"use client"

import type { InsurerId } from "@/lib/payment-reminder-extractors"

/**
 * Canonical row coming out of the AI-backed PDF extractor. Insurer-agnostic on
 * purpose — every insurer's PDF gets normalized into this shape, so the upload
 * UI doesn't need a switch per format.
 */
export interface PdfPaymentReminderRow {
  customerName: string
  policyNumber: string
  openAmount: number | null
  currency: string | null
}

export type PdfDocumentType = "mise-en-demeure" | "rappel" | "rappel-2" | "other"

export interface PdfExtractionResult {
  insurerName: string
  insurerId: InsurerId
  documentType: PdfDocumentType
  rows: PdfPaymentReminderRow[]
}

export interface PdfExtractionError {
  error: string
  message?: string
}

/**
 * POST the PDF to the extraction route. Throws on transport errors; returns a
 * tagged error object when the server responds with one (so the caller can
 * show a precise toast — e.g. "AI not configured" vs. "Extraction failed").
 */
export async function extractPaymentReminderPdf(
  file: File,
): Promise<PdfExtractionResult | PdfExtractionError> {
  const form = new FormData()
  form.append("file", file)

  const res = await fetch("/api/payment-reminders/extract-pdf", {
    method: "POST",
    body: form,
  })

  const json = (await res.json().catch(() => null)) as
    | PdfExtractionResult
    | PdfExtractionError
    | null

  if (!res.ok) {
    if (json && "error" in json) return json
    return { error: "request_failed", message: `HTTP ${res.status}` }
  }
  if (!json || !("rows" in json)) {
    return { error: "invalid_response" }
  }
  return json
}

/**
 * Map the AI's document-type guess to the carrier-entry status string the
 * preset Payment Reminder lists already classify on (carrier-entries-store.ts
 * + payment-reminder-lists.ts). Keeps the PDF flow on the same routing rails
 * as Vivium/AXA without a new classifier.
 */
export function statusFromDocumentType(t: PdfDocumentType): string | undefined {
  switch (t) {
    case "rappel":
      return "RAPPEL"
    case "rappel-2":
      return "RAPPEL 2"
    case "mise-en-demeure":
      return "MISE EN DEMEURE"
    default:
      return undefined
  }
}

/**
 * Best-effort split of "LASTNAME FIRSTNAME" or "FIRSTNAME LASTNAME" into
 * (firstName, lastName). PDFs from different insurers use different orders;
 * for matching against the portfolio it's good enough to keep the full
 * string available. Legal entities (e.g. "COTE MOLIERE SPRL") collapse to
 * lastName-only — same convention used by the AXA Chutes extractor.
 */
export function splitCustomerName(raw: string): {
  firstName: string
  lastName: string
  customerType: "Natural person" | "Legal entity"
} {
  const trimmed = raw.replace(/\s+/g, " ").trim()
  if (!trimmed) return { firstName: "", lastName: "", customerType: "Natural person" }

  // Legal-entity heuristic: any of the common Belgian company suffixes.
  if (/\b(s\.?p\.?r\.?l\.?|s\.?r\.?l\.?|s\.?a\.?|sc|scrl|asbl|nv|bv|bvba|cvba)\b/i.test(trimmed)) {
    return { firstName: "", lastName: trimmed, customerType: "Legal entity" }
  }

  const parts = trimmed.split(" ")
  if (parts.length === 1) {
    return { firstName: "", lastName: parts[0], customerType: "Natural person" }
  }

  // Heuristic: if the first token is ALL-CAPS and the second is mixed case,
  // it's likely "LASTNAME Firstname" (DKV style). Otherwise treat as
  // "Firstname Lastname[s]" and let the multi-token tail be the surname.
  const looksLastFirst =
    parts[0] === parts[0].toUpperCase() && parts[1] !== parts[1].toUpperCase()
  if (looksLastFirst) {
    return {
      firstName: parts.slice(1).join(" "),
      lastName: parts[0],
      customerType: "Natural person",
    }
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
    customerType: "Natural person",
  }
}
