"use client"

import {
  getAllCarrierEntries,
  type CarrierEntry,
} from "@/lib/carrier-entries-store"

/**
 * Three default *dynamic* lists that every broker sees in My Lists. Each
 * customer flows in/out automatically based on the latest carrier-entry
 * status — no manual list creation per upload.
 *
 * The classifier rules normalize accents/case before matching, so Vivium's
 * "RAPPEL" and a hypothetical "Rappel" both land in Payment Reminder 1.
 */

export interface PaymentReminderListSpec {
  id: string
  name: string
  description: string
  iconColor: string
  iconBg: string
  matches: (entry: CarrierEntry) => boolean
}

export const PAYMENT_REMINDER_LISTS: PaymentReminderListSpec[] = [
  {
    id: "payment-reminder-1",
    name: "Payment Reminder 1",
    description:
      "Customers who have just missed a premium and are due for their first payment reminder.",
    iconColor: "#D97706",
    iconBg: "#FEF3C7",
    matches: isFirstReminder,
  },
  {
    id: "payment-reminder-2",
    name: "Payment Reminder 2",
    description:
      "Customers who haven't paid after the first reminder and now need a firmer second notice.",
    iconColor: "#EA580C",
    iconBg: "#FED7AA",
    matches: isSecondReminder,
  },
  {
    id: "mise-en-demeure",
    name: "Mise en demeure",
    description:
      "Customers at the formal-notice stage, the final step before the policy is cancelled for non-payment.",
    iconColor: "#DC2626",
    iconBg: "#FECACA",
    matches: isMiseEnDemeure,
  },
]

const PRESET_IDS = new Set(PAYMENT_REMINDER_LISTS.map((l) => l.id))

export function isPaymentReminderListId(id: string | null | undefined): boolean {
  return !!id && PRESET_IDS.has(id)
}

export function getListSpec(id: string): PaymentReminderListSpec | undefined {
  return PAYMENT_REMINDER_LISTS.find((l) => l.id === id)
}

/**
 * Compute the deduped recordIds (as strings) of every customer with at least
 * one carrier-entry that matches this list's criteria.
 */
export function computeListCustomerIds(spec: PaymentReminderListSpec): string[] {
  const all = getAllCarrierEntries()
  const out: string[] = []
  const seen = new Set<string>()
  for (const [recordId, entries] of Object.entries(all)) {
    if (entries.some((e) => spec.matches(e)) && !seen.has(recordId)) {
      seen.add(recordId)
      out.push(recordId)
    }
  }
  return out
}

// ── Classification ─────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

const ESCALATION_DAYS = 30

function isFirstReminder(e: CarrierEntry): boolean {
  const s = normalize(e.status ?? "")
  if (!s) return false
  // Bare "rappel" or "rappel 1" — but only while still inside the first-reminder
  // window. A stale rappel escalates to Payment Reminder 2.
  if (/^rappel(\s*1)?$/.test(s)) {
    return !isActionOlderThanDays(e, ESCALATION_DAYS)
  }
  return false
}

function isSecondReminder(e: CarrierEntry): boolean {
  const s = normalize(e.status ?? "")
  if (!s) return false
  // Explicit second-reminder labels.
  if (/(rappel\s*[23]|deuxieme\s*rappel|2eme\s*rappel|recouvrement)/.test(s)) {
    return true
  }
  // Stale first reminder (carrier hasn't escalated the label yet but enough
  // time has passed that it's effectively at second-reminder stage).
  if (/^rappel(\s*1)?$/.test(s) && isActionOlderThanDays(e, ESCALATION_DAYS)) {
    return true
  }
  return false
}

function isMiseEnDemeure(e: CarrierEntry): boolean {
  const s = normalize(e.status ?? "")
  return /mise\s*en\s*demeure/.test(s)
}

function isActionOlderThanDays(e: CarrierEntry, days: number): boolean {
  if (!e.actionDate) return false
  const d = parseDate(e.actionDate)
  if (!d) return false
  return d.getTime() < Date.now() - days * 24 * 60 * 60 * 1000
}

function parseDate(s: string): Date | null {
  // Belgian carrier files use DD/MM/YYYY or DD-MM-YYYY.
  const parts = s.split(/[/-]/).map((p) => p.trim()).filter(Boolean)
  if (parts.length !== 3) return null
  const [a, b, c] = parts.map((p) => Number.parseInt(p, 10))
  if (![a, b, c].every(Number.isFinite)) return null
  if (c >= 1900 && c <= 2100) return new Date(c, b - 1, a)
  return null
}
