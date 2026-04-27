"use client"

import type { InsurerId, PaymentReminderRow } from "@/lib/payment-reminder-extractors"

/**
 * Client-side persistence for payment-reminder uploads.
 *
 * Each upload is keyed by the saved smart-list id it produced, so navigating
 * to that list later (Customers page) can still retrieve the insurer-specific
 * columns that aren't part of the MasterCustomer schema.
 */

export interface PaymentReminderUpload {
  savedListId: string
  insurer: InsurerId
  insurerLabel: string
  filename: string
  uploadedAt: string
  rows: PaymentReminderRow[]
}

const KEY = "qollabi:payment-reminders"
const CHANGE_EVENT = "qollabi:payment-reminders-changed"

function read(): Record<string, PaymentReminderUpload> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, PaymentReminderUpload>
  } catch {
    return {}
  }
}

function write(all: Record<string, PaymentReminderUpload>) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(all))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export function savePaymentReminderUpload(u: PaymentReminderUpload) {
  const all = read()
  all[u.savedListId] = u
  write(all)
}

export function getPaymentReminderUpload(
  savedListId: string,
): PaymentReminderUpload | null {
  return read()[savedListId] ?? null
}

export function listPaymentReminderUploads(): PaymentReminderUpload[] {
  return Object.values(read()).sort((a, b) =>
    b.uploadedAt.localeCompare(a.uploadedAt),
  )
}
