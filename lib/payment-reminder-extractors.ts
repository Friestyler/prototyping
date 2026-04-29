/**
 * Insurer-specific extraction of payment-reminder rows.
 *
 * CSV parsing + header normalization lives in `./carrier-file-parser.ts`.
 * This module owns the Vivium-flavoured extractor and re-exports the shared
 * insurer metadata so the upload UI has a single source of truth.
 */

import { headerIndex, parseDelimitedRows } from "@/lib/carrier-file-parser"

export { parseDelimitedRows as parseDelimited } from "@/lib/carrier-file-parser"

export interface PaymentReminderRow {
  id: string
  firstName: string
  lastName: string
  email: string
  policyExternalId: string
  etatNonPaiement: string
  dateAction: string
  soldePolice: string
  vcs: string
  numCompte: string
  /** Concatenated postal address (street + zip + city) when available. */
  address?: string
}

export type InsurerId =
  | "vivium"
  | "baloise"
  | "axa"
  | "ag"
  | "allianz"
  | "ethias"
  | "kbc"
  | "dkv"
  | "other"

export interface InsurerOption {
  id: InsurerId
  label: string
  color: string
}

export const INSURERS: InsurerOption[] = [
  { id: "vivium", label: "Vivium", color: "#D97706" },
  { id: "baloise", label: "Baloise", color: "#DC2626" },
  { id: "axa", label: "AXA", color: "#1E40AF" },
  { id: "ag", label: "AG", color: "#059669" },
  { id: "allianz", label: "Allianz", color: "#0369A1" },
  { id: "ethias", label: "Ethias", color: "#7C3AED" },
  { id: "kbc", label: "KBC", color: "#0E7490" },
  { id: "dkv", label: "DKV", color: "#65A30D" },
  { id: "other", label: "Other", color: "#6B7280" },
]

export function getInsurer(id: InsurerId): InsurerOption {
  return INSURERS.find((i) => i.id === id) ?? INSURERS[INSURERS.length - 1]
}

export interface DetectionResult {
  insurer: InsurerId
  confidence: number
}

interface Extractor {
  insurer: InsurerId
  detect: (allRows: string[][], filename: string) => number
  extract: (allRows: string[][]) => PaymentReminderRow[]
}

const VIVIUM_SIGNATURE = [
  "police",
  "etat de non-paiement",
  "num. compte p&v",
  "solde police",
]

const viviumExtractor: Extractor = {
  insurer: "vivium",
  detect: (allRows, filename) => {
    const headers = allRows[0] ?? []
    let score = 0
    if (headers.length > 0) {
      const hits = VIVIUM_SIGNATURE.filter(
        (s) => headerIndex(headers, [s]) !== -1,
      ).length
      score = hits / VIVIUM_SIGNATURE.length
    }
    if (/vivium/i.test(filename)) score = Math.min(1, score + 0.2)
    if (/impaye/i.test(filename)) score = Math.min(1, score + 0.1)
    return score
  },
  extract: (allRows) => {
    const headers = allRows[0] ?? []
    const rows = allRows.slice(1)

    // Newer Vivium exports use a single "NOM PRENEUR ASSURANCES" column
    // formatted as "LastName, FirstName"; older exports had separate first/
    // last name columns. Support both.
    const iNomPreneur = headerIndex(headers, [
      "nom preneur assurances",
      "nom du preneur",
      "preneur",
    ])
    const iFirstLegacy = headerIndex(headers, ["first name", "prenom", "prénom"])
    const iLastLegacy = headerIndex(headers, ["last name"])

    const iEmail = headerIndex(headers, ["email", "e-mail"])
    const iPolice = headerIndex(headers, ["police"])
    const iEtat = headerIndex(headers, ["etat de non-paiement"])
    const iDate = headerIndex(headers, ["date action"])
    const iSolde = headerIndex(headers, ["solde police"])
    const iVcs = headerIndex(headers, ["vcs"])
    const iCompte = headerIndex(headers, ["num. compte p&v", "num compte p&v"])
    const iAdresse = headerIndex(headers, ["adresse"])
    const iCp = headerIndex(headers, ["c.p.", "cp", "code postal"])
    const iLocalite = headerIndex(headers, ["localite", "localité"])

    const out: PaymentReminderRow[] = []
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r]
      if (!row || row.every((c) => !c?.trim())) continue

      const police = (row[iPolice] ?? "").trim()
      const etat = (row[iEtat] ?? "").trim()

      // The newer Vivium export duplicates each customer across two rows: the
      // first carries contract metadata with an empty status, the second
      // carries the reminder data (status, email, action date). We only want
      // rows that have a populated `ETAT DE NON-PAIEMENT`. As a side effect
      // this also drops the legacy "mapping metadata" stub row whose POLICE
      // value isn't a real policy number.
      if (!etat) continue
      if (!/^\d+$/.test(police)) continue

      // Names: prefer "NOM PRENEUR ASSURANCES" ("LastName, FirstName"); split
      // on the first comma so multi-token last names like "Van der Linden"
      // stay intact.
      let firstName = ""
      let lastName = ""
      if (iNomPreneur !== -1) {
        const raw = (row[iNomPreneur] ?? "").trim()
        const commaIdx = raw.indexOf(",")
        if (commaIdx > 0) {
          lastName = raw.slice(0, commaIdx).trim()
          firstName = raw.slice(commaIdx + 1).trim()
        } else {
          // No comma: treat the whole string as a last name (or org name).
          lastName = raw
        }
      } else {
        firstName = (row[iFirstLegacy] ?? "").trim()
        lastName = (row[iLastLegacy] ?? "").trim()
      }

      // Address: stitch street + postal code + city when present.
      const street = (row[iAdresse] ?? "").trim()
      const cp = (row[iCp] ?? "").trim()
      const city = (row[iLocalite] ?? "").trim()
      const cityLine = [cp, city].filter(Boolean).join(" ")
      const address = [street, cityLine].filter(Boolean).join(", ")

      if (!police && !firstName && !lastName) continue

      out.push({
        id: `${police || "row"}-${r}`,
        firstName,
        lastName,
        email: (row[iEmail] ?? "").trim(),
        policyExternalId: police,
        etatNonPaiement: etat,
        dateAction: (row[iDate] ?? "").trim(),
        soldePolice: (row[iSolde] ?? "").trim(),
        vcs: (row[iVcs] ?? "").trim(),
        numCompte: (row[iCompte] ?? "").trim(),
        address: address || undefined,
      })
    }
    return out
  },
}

const EXTRACTORS: Extractor[] = [viviumExtractor]

export function detectInsurer(allRows: string[][], filename: string): DetectionResult {
  let best: DetectionResult = { insurer: "other", confidence: 0 }
  for (const ex of EXTRACTORS) {
    const score = ex.detect(allRows, filename)
    if (score > best.confidence) best = { insurer: ex.insurer, confidence: score }
  }
  return best
}

export function extractFor(insurer: InsurerId, allRows: string[][]): PaymentReminderRow[] {
  const ex = EXTRACTORS.find((e) => e.insurer === insurer)
  if (!ex) return []
  return ex.extract(allRows)
}
