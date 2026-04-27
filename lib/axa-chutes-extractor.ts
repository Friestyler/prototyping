/**
 * AXA "Chutes - Détail des polices" extractor.
 *
 * The file AXA sends has a multi-row preamble (Hiérarchie, Sélections, Vision
 * économique...) before the real header row, and a totals row directly below
 * the header. Every row in this report is a churned policy — if `Statut` is
 * populated, the product is considered churned.
 *
 * Schema mapping requested by the broker:
 *   - `No de contrat`  → product external id
 *   - `Date de fin`    → churn date
 *   - `Statut`         → status description (populated = Churned)
 *   - `Assuré`         → customer name (last-first Belgian order)
 *   - `Produit`        → product family (RC Vie privée Confort, Auto 4R Confort…)
 *   - `Segment`        → customer segment (Particuliers, PME…)
 */

import {
  findHeaderRowIndex,
  headerIndex,
  parseDelimitedRows,
} from "@/lib/carrier-file-parser"

export interface AxaChuteRow {
  id: string
  firstName: string
  lastName: string
  fullName: string
  policyExternalId: string
  product: string
  createdAt: string
  churnDate: string
  statusDescription: string
  segment: string
  /** True when Statut is populated — the churn flag mapped to Product.Status. */
  isChurned: boolean
}

export { parseDelimitedRows as parseDelimited } from "@/lib/carrier-file-parser"

const SIGNATURE_HEADERS = ["no de contrat", "date de fin", "statut", "assure"]

export interface AxaChutesDetection {
  matched: boolean
  confidence: number
  headerRowIndex: number
}

export function detectAxaChutes(allRows: string[][], filename: string): AxaChutesDetection {
  const headerRowIndex = findHeaderRowIndex(allRows, ["no de contrat", "date de fin", "statut"])
  let confidence = 0
  if (headerRowIndex !== -1) {
    const headers = allRows[headerRowIndex]
    const hits = SIGNATURE_HEADERS.filter((s) => headerIndex(headers, [s]) !== -1).length
    confidence = hits / SIGNATURE_HEADERS.length
  }
  if (/axa/i.test(filename)) confidence = Math.min(1, confidence + 0.2)
  if (/chute/i.test(filename)) confidence = Math.min(1, confidence + 0.2)
  return {
    matched: confidence >= 0.5,
    confidence,
    headerRowIndex,
  }
}

/**
 * Parse the `Assuré` field into lastName + firstName.
 *
 * AXA files use Belgian order (LastName FirstName). Multi-token last names
 * ("Van Baeten", "Louis Le Deboucheur") are common, so we treat every token
 * before the final capitalized token as lastName. Organisations (single
 * uppercase blob with no obvious given name) get the full string as lastName.
 */
function splitAssure(raw: string): { firstName: string; lastName: string; fullName: string } {
  const fullName = raw.trim()
  if (!fullName) return { firstName: "", lastName: "", fullName: "" }
  const tokens = fullName.split(/\s+/)
  if (tokens.length === 1) {
    return { firstName: "", lastName: tokens[0], fullName }
  }
  // Heuristic: the last whitespace-separated token is the firstName when it
  // starts with a letter and isn't all-uppercase (which usually means the row
  // is an organisation like "AMBASSADE D ITALIE").
  const last = tokens[tokens.length - 1]
  const isAllCaps = last === last.toUpperCase() && /[A-Z]/.test(last)
  if (isAllCaps) {
    return { firstName: "", lastName: fullName, fullName }
  }
  return {
    firstName: last,
    lastName: tokens.slice(0, -1).join(" "),
    fullName,
  }
}

export function extractAxaChutes(allRows: string[][]): AxaChuteRow[] {
  const headerRowIndex = findHeaderRowIndex(
    allRows,
    ["no de contrat", "date de fin", "statut"],
  )
  if (headerRowIndex === -1) return []
  const headers = allRows[headerRowIndex]
  // The row directly below the header is a totals row (counts + sum columns
  // with no contract number). Skip it.
  const dataRows = allRows.slice(headerRowIndex + 2)

  const iNoContrat = headerIndex(headers, ["no de contrat"])
  const iAssure = headerIndex(headers, ["assure", "assuré"])
  const iProduit = headerIndex(headers, ["produit"])
  const iCreation = headerIndex(headers, ["date de creation", "date de création"])
  const iFin = headerIndex(headers, ["date de fin"])
  const iStatut = headerIndex(headers, ["statut"])
  const iSegment = headerIndex(headers, ["segment"])

  const out: AxaChuteRow[] = []
  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r]
    if (!row || row.every((c) => !c?.trim())) continue
    const noContrat = (row[iNoContrat] ?? "").trim()
    const statut = (row[iStatut] ?? "").trim()
    if (!noContrat) continue
    // Real AXA policy numbers are numeric. Filter anything else to guard
    // against stray summary/section rows.
    if (!/^\d+$/.test(noContrat)) continue

    const { firstName, lastName, fullName } = splitAssure((row[iAssure] ?? "").trim())

    out.push({
      id: `${noContrat}-${r}`,
      firstName,
      lastName,
      fullName,
      policyExternalId: noContrat,
      product: (row[iProduit] ?? "").trim(),
      createdAt: (row[iCreation] ?? "").trim(),
      churnDate: (row[iFin] ?? "").trim(),
      statusDescription: statut,
      segment: (row[iSegment] ?? "").trim(),
      // The file IS a list of churns — Statut being populated is the signal.
      isChurned: statut.length > 0,
    })
  }
  return out
}
