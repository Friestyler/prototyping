"use client"

import { initialPartners, type Partner as CustomerRecord } from "@/lib/okr-data"
import {
  ALL_MASTER_CUSTOMERS,
  masterCustomerToRecord,
  type MasterCustomer,
} from "@/lib/customer-database"
import {
  appendCarrierEntries,
  type CarrierEntry,
} from "@/lib/carrier-entries-store"

/**
 * Runtime-imported customer records — customers that didn't exist in the demo
 * portfolio but were added by uploading an insurer file (AXA Chutes, etc.).
 *
 * Kept in localStorage so a full-page refresh doesn't lose them, and a change
 * event fires whenever records are added so `app/page.tsx` can re-merge them
 * into its `customers` state.
 */

const KEY = "qollabi:imported-customers"
const CHANGE_EVENT = "qollabi:imported-customers-changed"

/** Recordids start well above the demo pool (101–300) to avoid collisions. */
const RECORD_ID_BASE = 900_000

let initialPartnersSeeded = false

/**
 * Mirror the persisted imports into the module-scoped `initialPartners`
 * array that `lists-2-view.tsx` reads directly (not via props). Idempotent —
 * only inserts records whose id isn't already present.
 */
function seedInitialPartners(records: MasterCustomer[]) {
  const existing = new Set(initialPartners.map((p) => String(p.id)))
  for (const m of records) {
    const rec = masterCustomerToRecord(m)
    if (!existing.has(String(rec.id))) {
      initialPartners.push(rec)
      existing.add(String(rec.id))
    }
  }
}

function read(): MasterCustomer[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const all = JSON.parse(raw) as MasterCustomer[]
    if (!initialPartnersSeeded) {
      seedInitialPartners(all)
      initialPartnersSeeded = true
    }
    return all
  } catch {
    return []
  }
}

function write(all: MasterCustomer[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(all))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export function getImportedMasterCustomers(): MasterCustomer[] {
  return read()
}

export function getImportedCustomerRecords(): CustomerRecord[] {
  return read().map(masterCustomerToRecord)
}

/**
 * Upsert a batch of imported customers, keyed by dossierNumber (unique per
 * external policy). Returns the persisted recordIds in the same order.
 */
export function upsertImportedCustomers(records: Omit<MasterCustomer, "id" | "recordId">[]): number[] {
  const existing = read()
  const byDossier = new Map(existing.map((c) => [c.dossierNumber, c]))
  let nextId = RECORD_ID_BASE + existing.length
  const recordIds: number[] = []

  for (const rec of records) {
    const prior = byDossier.get(rec.dossierNumber)
    if (prior) {
      recordIds.push(prior.recordId)
      continue
    }
    const recordId = nextId++
    const full: MasterCustomer = {
      ...rec,
      id: `imp-${recordId}`,
      recordId,
    }
    existing.push(full)
    byDossier.set(full.dossierNumber, full)
    recordIds.push(recordId)
  }

  write(existing)
  // Keep the module-scoped `initialPartners` array in sync so list rendering
  // (which reads it directly, not via props) can find these records.
  seedInitialPartners(existing)
  return recordIds
}

export { CHANGE_EVENT as IMPORTED_CUSTOMERS_CHANGE_EVENT }

/**
 * One row as it comes out of a carrier extractor, normalized to the shape we
 * need to match or synthesize a customer.
 *
 * `dossierNumber` is now an *identity* key (e.g. `VIVIUM-EMAIL-x@y.com`,
 * `AXA-NAME-vanbaeten-nathalie`) rather than a per-policy key. This lets one
 * customer accumulate multiple `CarrierEntry`s — the policies they have in
 * arrears or churn — across multiple rows of the same upload.
 */
export interface ImportCandidate {
  dossierNumber: string
  firstName: string
  lastName: string
  email?: string
  products: string[]
  customerType: "Natural person" | "Legal entity"
  /** What to write into the carrier-entries sidecar for the resolved customer. */
  carrierEntry: CarrierEntry
}

export type PortfolioMatcher = (
  candidate: ImportCandidate,
  portfolio: MasterCustomer[],
) => number | null

/**
 * For every candidate: reuse the existing portfolio customer if the matcher
 * finds one, otherwise upsert a synthetic customer record (deduped by
 * dossierNumber across uploads). Each row's `carrierEntry` is recorded in the
 * carrier-entries sidecar — the same recordId can accumulate multiple entries.
 *
 * Returns:
 *  - `customerIds`: deduped recordIds for the smart-list payload.
 *  - `matchedFromPortfolio`: count of rows that hit an existing portfolio
 *    customer (the rest were imported fresh).
 */
export function resolveOrImportCustomers(
  candidates: ImportCandidate[],
  match: PortfolioMatcher,
): { customerIds: number[]; matchedFromPortfolio: number } {
  const portfolio = ALL_MASTER_CUSTOMERS
  const toImport: Omit<MasterCustomer, "id" | "recordId">[] = []
  const importIndexFor = new Map<number, number>()
  const dossierToImportIndex = new Map<string, number>()
  const reusedFromPortfolio: (number | null)[] = []
  let matchedFromPortfolio = 0

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const existing = match(c, portfolio)
    if (existing != null) {
      reusedFromPortfolio.push(existing)
      matchedFromPortfolio++
      continue
    }
    reusedFromPortfolio.push(null)
    // De-dupe within the same upload: two rows that share an identity key
    // collapse to one synthesized customer.
    const priorIdx = dossierToImportIndex.get(c.dossierNumber)
    if (priorIdx != null) {
      importIndexFor.set(i, priorIdx)
      continue
    }
    const idx = toImport.length
    importIndexFor.set(i, idx)
    dossierToImportIndex.set(c.dossierNumber, idx)
    toImport.push({
      firstName: c.firstName || "Unknown",
      lastName: c.lastName || "",
      dateOfBirth: "",
      address: "",
      customerType: c.customerType,
      dossierNumber: c.dossierNumber,
      products: c.products,
      annualPremium: 0,
      email: c.email,
    })
  }

  const importedIds = upsertImportedCustomers(toImport)

  const customerIds: number[] = []
  const seen = new Set<number>()
  const entriesBatch: Array<{ recordId: number; entry: CarrierEntry }> = []
  for (let i = 0; i < candidates.length; i++) {
    const portfolioId = reusedFromPortfolio[i]
    const id =
      portfolioId != null
        ? portfolioId
        : importedIds[importIndexFor.get(i)!]
    if (!seen.has(id)) {
      seen.add(id)
      customerIds.push(id)
    }
    entriesBatch.push({ recordId: id, entry: candidates[i].carrierEntry })
  }
  appendCarrierEntries(entriesBatch)

  return { customerIds, matchedFromPortfolio }
}
