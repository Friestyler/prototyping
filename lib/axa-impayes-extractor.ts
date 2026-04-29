/**
 * AXA "Impayés" extractor.
 *
 * Different file from AXA Chutes: this is the carrier's payment-reminder export
 * (rows with `Statut de la créance` populated — first reminder, last reminder,
 * mise en demeure, etc.). The header sits on row 0; cells are `;`-separated
 * and may carry a leading apostrophe (Excel text marker) on numeric ids.
 *
 * Schema mapping requested by the broker:
 *   - `Preneur`                  → customer name (orgs OR persons)
 *   - `N° du contrat`            → product external id
 *   - `Type de contrat`          → product family
 *   - `Période de couverture du` → contract start
 *   - `Période de couverture au` → contract end
 *   - `Statut de la créance`     → payment status (drives PR1 / PR2 / MeD lists)
 *   - `Date statut de la créance`→ action date
 *   - `Montant total réclamé`    → open amount (premium + fees)
 */

import { findHeaderRowIndex, headerIndex } from "@/lib/carrier-file-parser"

export interface AxaImpayeRow {
  id: string
  /** Original `Preneur` cell, untouched. */
  fullName: string
  firstName: string
  lastName: string
  isLegalEntity: boolean
  policyExternalId: string
  contractType: string
  coverageStart: string
  coverageEnd: string
  paymentStatus: string
  statusDate: string
  totalAmount: string
}

const SIGNATURE_HEADERS = [
  "preneur",
  "n° du contrat",
  "statut de la creance",
  "periode de couverture du",
]

export interface AxaImpayesDetection {
  matched: boolean
  confidence: number
  headerRowIndex: number
}

export function detectAxaImpayes(
  allRows: string[][],
  filename: string,
): AxaImpayesDetection {
  const headerRowIndex = findHeaderRowIndex(allRows, [
    "preneur",
    "n° du contrat",
    "statut de la creance",
  ])
  let confidence = 0
  if (headerRowIndex !== -1) {
    const headers = allRows[headerRowIndex]
    const hits = SIGNATURE_HEADERS.filter(
      (s) => headerIndex(headers, [s]) !== -1,
    ).length
    confidence = hits / SIGNATURE_HEADERS.length
  }
  if (/axa/i.test(filename)) confidence = Math.min(1, confidence + 0.2)
  if (/impaye/i.test(filename)) confidence = Math.min(1, confidence + 0.1)
  return {
    matched: confidence >= 0.5,
    confidence,
    headerRowIndex,
  }
}

/**
 * Strip Excel's leading-apostrophe text marker (e.g. `'010720152540`) so we
 * store the raw numeric id like every other extractor.
 */
function stripExcelQuote(s: string): string {
  return s.startsWith("'") ? s.slice(1) : s
}

const ORG_KEYWORDS = new Set([
  // Legal-form abbreviations (FR/NL/EN/DE)
  "srl", "sa", "sas", "sarl", "asbl", "vzw", "nv", "bv", "bvba", "sprl",
  "scs", "scrl", "gmbh", "ltd", "inc", "llc", "ag", "kg", "ohg",
  // Generic company markers
  "company", "companies", "cie", "co", "com", "comm", "corp", "group",
  "groupe", "holding", "holdings", "invest", "investment", "investments",
  "associes", "associees", "associates", "partners", "partner",
  // Sector / activity words common in this dataset
  "brasserie", "etablissement", "etablissements", "entreprise", "entreprises",
  "productions", "production", "studios", "studio", "construction",
  "immobilier", "immo", "fitnessland", "motors", "floor", "fils", "freres",
  // Geographic / institutional markers
  "boulevard", "rue", "avenue", "chaussee", "place",
  "ambassade", "mission", "representative", "representation", "division",
  "technical", "telecom", "telecommunications",
  // Country names that appear as suffix on company rows in this file
  "belgique", "belgie", "allemagne", "deutschland", "france", "espagne",
  "espana", "italie", "italia", "grece", "greece", "luxembourg",
])

const HAS_DIGIT = /\d/

/**
 * Decide whether `Preneur` is a person or an organisation, then split it.
 *
 * AXA's file capitalises everything (e.g. `PINEIRO LOPEZ HECTOR` for a person,
 * `LA BRASSERIE DE LA SENNE` for a company), so the AXA-Chutes "all-caps means
 * org" trick doesn't work here. Instead we keyword-match on common company
 * markers and fall back to the standard "last token = first name" split for
 * persons (preserving multi-token last names like "Van Damme").
 */
function splitPreneur(raw: string): {
  fullName: string
  firstName: string
  lastName: string
  isLegalEntity: boolean
} {
  const fullName = raw.trim()
  if (!fullName) {
    return { fullName: "", firstName: "", lastName: "", isLegalEntity: false }
  }
  const tokens = fullName.split(/\s+/).filter(Boolean)

  if (tokens.length === 1) {
    return { fullName, firstName: "", lastName: fullName, isLegalEntity: true }
  }
  if (HAS_DIGIT.test(fullName)) {
    return { fullName, firstName: "", lastName: fullName, isLegalEntity: true }
  }
  if (/[&]/.test(fullName)) {
    return { fullName, firstName: "", lastName: fullName, isLegalEntity: true }
  }
  if (tokens.some((t) => ORG_KEYWORDS.has(t.toLowerCase()))) {
    return { fullName, firstName: "", lastName: fullName, isLegalEntity: true }
  }

  // Person: last whitespace-separated token is the first name (handles
  // hyphenated firsts like JEAN-LOUP, PER-ORLUFF), the rest is the last name.
  const last = tokens[tokens.length - 1]
  return {
    fullName,
    firstName: last,
    lastName: tokens.slice(0, -1).join(" "),
    isLegalEntity: false,
  }
}

export function extractAxaImpayes(allRows: string[][]): AxaImpayeRow[] {
  const headerRowIndex = findHeaderRowIndex(allRows, [
    "preneur",
    "n° du contrat",
    "statut de la creance",
  ])
  if (headerRowIndex === -1) return []
  const headers = allRows[headerRowIndex]
  const dataRows = allRows.slice(headerRowIndex + 1)

  const iPreneur = headerIndex(headers, ["preneur"])
  const iContrat = headerIndex(headers, ["n° du contrat", "no du contrat"])
  const iType = headerIndex(headers, ["type de contrat"])
  const iCovDu = headerIndex(headers, ["periode de couverture du", "période de couverture du"])
  const iCovAu = headerIndex(headers, ["periode de couverture au", "période de couverture au"])
  const iStatut = headerIndex(headers, ["statut de la creance", "statut de la créance"])
  const iStatutDate = headerIndex(headers, [
    "date statut de la creance",
    "date statut de la créance",
  ])
  const iTotal = headerIndex(headers, ["montant total reclame", "montant total réclamé"])

  const out: AxaImpayeRow[] = []
  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r]
    if (!row || row.every((c) => !c?.trim())) continue
    const policy = stripExcelQuote((row[iContrat] ?? "").trim())
    if (!policy || !/^\d+$/.test(policy)) continue

    const split = splitPreneur((row[iPreneur] ?? "").trim())
    if (!split.fullName) continue

    out.push({
      id: `${policy}-${r}`,
      fullName: split.fullName,
      firstName: split.firstName,
      lastName: split.lastName,
      isLegalEntity: split.isLegalEntity,
      policyExternalId: policy,
      contractType: (row[iType] ?? "").trim(),
      coverageStart: (row[iCovDu] ?? "").trim(),
      coverageEnd: (row[iCovAu] ?? "").trim(),
      paymentStatus: (row[iStatut] ?? "").trim(),
      statusDate: (row[iStatutDate] ?? "").trim(),
      totalAmount: (row[iTotal] ?? "").trim(),
    })
  }
  return out
}
