/**
 * AI-backed extraction for payment-reminder PDFs.
 *
 * Brokers receive these letters from many insurers (DKV, Vivium, AXA, Baloise,
 * AG, Ethias, …), each with its own layout. Hand-rolling a parser per insurer
 * doesn't scale, so we hand the PDF to Claude with a single canonical schema
 * and let the model normalize across formats. New insurers work without code
 * changes; the regex-based CSV extractors (carrier-file-parser.ts) stay in
 * place for the deterministic CSV exports we already support.
 *
 * Input  : multipart/form-data with `file` = the PDF
 * Output : { insurerName, insurerId, documentType, rows: [{ customerName,
 *           policyNumber, openAmount, currency }] }
 */
import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { getModel } from "@/lib/ai/client"
import type { InsurerId } from "@/lib/payment-reminder-extractors"

export const runtime = "nodejs"
export const maxDuration = 60

const KNOWN_INSURERS: InsurerId[] = [
  "vivium",
  "baloise",
  "axa",
  "ag",
  "allianz",
  "ethias",
  "kbc",
  "dkv",
]

const rowSchema = z.object({
  customerName: z
    .string()
    .min(1)
    .describe("The policyholder name as it appears in the PDF, untouched."),
  policyNumber: z
    .string()
    .min(1)
    .describe("Policy / contract number for this row."),
  openAmount: z
    .number()
    .nullable()
    .describe(
      "Outstanding premium / amount due for this policy. Use a decimal point (1234.56). Null if the PDF doesn't show one.",
    ),
  currency: z
    .string()
    .nullable()
    .describe("ISO 4217 currency code if shown (typically EUR). Null if absent."),
})

const responseSchema = z.object({
  insurerName: z
    .string()
    .describe("The insurer that sent this letter, as printed on the document (e.g. 'DKV', 'Vivium')."),
  documentType: z
    .enum(["mise-en-demeure", "rappel", "rappel-2", "other"])
    .describe(
      "Stage of the dunning workflow this document represents: rappel (first reminder), rappel-2 (second/firmer reminder), mise-en-demeure (formal notice — last step before cancellation), or other.",
    ),
  rows: z.array(rowSchema).describe("One row per policy listed in the PDF."),
})

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ai_not_configured", message: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 503 },
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_required" }, { status: 400 })
  }
  if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "expected_pdf" }, { status: 400 })
  }

  const bytes = new Uint8Array(await file.arrayBuffer())

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: responseSchema,
      maxOutputTokens: 4000,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Extract the unpaid policies from this insurer's payment-reminder PDF.",
                "Belgian insurers ship these letters in French, Dutch, German, or English — the columns/labels vary by language but the content is the same. Map across languages:",
                "  • Customer name : 'NOM DU PRENEUR', 'NOM PRENEUR ASSURANCES', 'NAAM VERZEKERINGNEMER', 'POLISHOUDER', 'VERSICHERUNGSNEHMER'.",
                "  • Policy number : 'NO DE POLICE', 'POLICE', 'POLISNUMMER', 'CONTRAT', 'POLIZZA'.",
                "  • Open amount   : 'MONTANT', 'SOLDE', 'BEDRAG', 'OPENSTAAND', 'SALDO', 'BETRAG'.",
                "  • Address (if printed): street + postal code + city — keep on one line, comma-separated.",
                "For every policy listed in the document, return one row. Multiple policies for the same customer → one row each.",
                "",
                "Determine the document type from the letter's wording (any language):",
                "  • rappel          ← 'rappel', '1er rappel', '1ste herinnering', 'eerste aanmaning', '1. Mahnung', 'first reminder'",
                "  • rappel-2        ← '2e rappel', 'deuxième rappel', 'dernière lettre', '2de herinnering', 'tweede aanmaning', '2. Mahnung'",
                "  • mise-en-demeure ← 'mise en demeure', 'ingebrekestelling', 'aanmaning' alone after a prior reminder, 'Mahnbescheid', 'formal notice'",
                "If you cannot map the document to one of the above stages with high confidence, return 'other'.",
                "",
                "Return the insurer's name exactly as printed on the letter (look at the header/letterhead, not the addressee).",
                "openAmount must be a number with a decimal point. Handle both European ('1.234,56' or '1 234,56' → 1234.56) and Anglo ('1,234.56' → 1234.56) formats. Strip currency symbols.",
                "currency must be the ISO 4217 code if shown ('EUR' is the default for BE/NL/DE/LU). Use null if the PDF doesn't show a currency symbol or code.",
                "Do not invent rows. If a value is missing from the PDF, use null — never a guessed value.",
              ].join("\n"),
            },
            {
              type: "file",
              data: bytes,
              mediaType: "application/pdf",
            },
          ],
        },
      ],
    })

    const insurerId = mapInsurerId(object.insurerName)

    return NextResponse.json({
      insurerName: object.insurerName,
      insurerId,
      documentType: object.documentType,
      rows: object.rows,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("extract-pdf AI error:", message)
    return NextResponse.json({ error: "extraction_failed", message }, { status: 502 })
  }
}

function mapInsurerId(name: string): InsurerId {
  const n = name.toLowerCase().trim()
  for (const id of KNOWN_INSURERS) {
    if (n.includes(id)) return id
  }
  return "other"
}
