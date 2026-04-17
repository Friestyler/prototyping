/**
 * Single-shot smart-list generator.
 *
 * Input: a natural-language prompt describing the segment the user wants.
 * Output: a structured smart-list spec (name, description, customer-pool
 * filter, resolved customer count + sample) so the UI can preview before
 * persisting via /api/smart-lists.
 */

import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { getModel } from "@/lib/ai/client"
import { ALL_MASTER_CUSTOMERS } from "@/lib/customer-database"
import { customerToWire, filterCustomers, type CustomerFilter } from "@/lib/customer-filter"

export const runtime = "nodejs"
export const maxDuration = 60

const responseSchema = z.object({
  name: z.string().min(1).max(120).describe("Concise, action-oriented list title (≤6 words)."),
  description: z.string().max(500).describe("One sentence explaining who's in this list and why."),
  filter: z.object({
    query: z.string().optional(),
    customerType: z.enum(["Natural person", "Legal entity"]).optional(),
    productsAny: z.array(z.string()).optional(),
    productsAll: z.array(z.string()).optional(),
    productsNone: z.array(z.string()).optional(),
    minPremium: z.number().optional(),
    maxPremium: z.number().optional(),
    bornAfter: z.string().optional().describe("YYYY-MM-DD"),
    bornBefore: z.string().optional().describe("YYYY-MM-DD"),
  }),
  type: z.enum(["dynamic", "static"]).describe(
    "'dynamic' if membership should keep matching the filter as the pool changes; 'static' to freeze today's matches.",
  ),
  reasoning: z.string().describe("Why these criteria match the user's prompt — 1-3 sentences."),
})

const productCatalog = Array.from(
  new Set(ALL_MASTER_CUSTOMERS.flatMap((c) => c.products)),
).sort()

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ai_not_configured", message: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 503 },
    )
  }

  let body: { prompt?: string }
  try {
    body = (await request.json()) as { prompt?: string }
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const prompt = body.prompt?.trim()
  if (!prompt) {
    return NextResponse.json({ error: "prompt_required" }, { status: 400 })
  }

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: responseSchema,
      maxOutputTokens: 800,
      temperature: 0.3,
      system: [
        "You build customer smart lists for a Belgian insurance broker tool.",
        `Pool size: ${ALL_MASTER_CUSTOMERS.length} customers (mix of natural persons and legal entities).`,
        `Available products carried by customers: ${productCatalog.join(", ")}.`,
        "Filter semantics:",
        "- productsAny: customer must carry at least one of these.",
        "- productsAll: customer must carry every one of these.",
        "- productsNone: customer must carry none of these (use this for coverage gaps, e.g. 'no Life insurance').",
        "- minPremium / maxPremium: annual premium in EUR.",
        "- bornAfter / bornBefore: date-of-birth bounds (YYYY-MM-DD).",
        "- customerType: distinguish individuals from companies.",
        "Pick the most specific filter that captures the user's intent. Don't over-filter.",
        "If the user asks for something the schema can't express (e.g. churn risk), pick the closest available proxy and explain in `reasoning`.",
      ].join("\n"),
      prompt,
    })

    const filter = object.filter as CustomerFilter
    const matches = filterCustomers(filter)

    return NextResponse.json({
      proposal: {
        name: object.name,
        description: object.description,
        type: object.type,
        filter,
        reasoning: object.reasoning,
      },
      matchCount: matches.length,
      sample: matches.slice(0, 5).map(customerToWire),
      customerIds: matches.map((c) => String(c.recordId)),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("smart-list AI error:", message)
    return NextResponse.json({ error: "generation_failed", message }, { status: 502 })
  }
}
