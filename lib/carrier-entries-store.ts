"use client"

/**
 * Sidecar store for carrier-file annotations on a customer.
 *
 * Both the Vivium "Payment reminders" and AXA "Chutes" upload flows attach
 * one or more entries per customer (the policy number(s) that were flagged
 * for non-payment / churn). The entries live here, keyed by recordId, so
 * portfolio customers and import-only customers share a single rendering
 * pathway.
 */

export interface CarrierEntry {
  insurer: string // "Vivium" | "AXA"
  policyNumber: string
  uploadedAt: string
  /**
   * Raw status as it appears in the carrier's file. Drives the classifier
   * that routes customers into the preset Payment Reminder 1 / 2 / Mise en
   * demeure dynamic lists. Examples:
   *   Vivium → "RAPPEL", "RAPPEL 2", "MISE EN DEMEURE"
   *   AXA   → "Resil.Non Paiement De Prime", "Renon Expiration Contractuelle"
   */
  status?: string
  /**
   * The carrier's "action date" — for Vivium this is `DATE ACTION` (when the
   * reminder was sent), for AXA it's `Date de fin`. Used by the classifier as
   * a timeframe escalator (a stale RAPPEL escalates to Payment Reminder 2).
   * Format follows the source file (typically DD/MM/YYYY or DD-MM-YYYY).
   */
  actionDate?: string
}

const KEY = "qollabi:carrier-entries"
const CHANGE_EVENT = "qollabi:carrier-entries-changed"

type Map = Record<string, CarrierEntry[]>

function read(): Map {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Map
  } catch {
    return {}
  }
}

function write(all: Map) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(all))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

/**
 * Merge a batch of entries into the store. Idempotent — `(insurer, policyNumber)`
 * pairs that already exist for a recordId are not duplicated.
 */
export function appendCarrierEntries(
  batch: Array<{ recordId: number | string; entry: CarrierEntry }>,
) {
  if (batch.length === 0) return
  const all = read()
  for (const { recordId, entry } of batch) {
    const key = String(recordId)
    const existing = all[key] ?? []
    if (existing.some((e) => e.insurer === entry.insurer && e.policyNumber === entry.policyNumber)) {
      continue
    }
    all[key] = [...existing, entry]
  }
  write(all)
}

export function getCarrierEntries(recordId: number | string): CarrierEntry[] {
  return read()[String(recordId)] ?? []
}

export function getAllCarrierEntries(): Map {
  return read()
}

export { CHANGE_EVENT as CARRIER_ENTRIES_CHANGE_EVENT }
