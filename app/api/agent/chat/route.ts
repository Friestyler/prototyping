/**
 * Unified AI chat endpoint.
 *
 * Single conversational surface that can emit three artefact types:
 *   - text      → plain answer (no artefact)
 *   - chart     → chart spec (the UI can pin to Portfolio Insights)
 *   - smartList → smart-list proposal + resolved customers (the UI can save)
 *
 * The model picks via Claude tool-use. We pass conversation history so
 * follow-ups (“make it a pie”, “only Baloise”) refine the active artefact
 * in place.
 */

import { NextResponse } from "next/server"
import { anthropic } from "@ai-sdk/anthropic"
import { generateText, tool } from "ai"
import { z } from "zod"
import { ALL_MASTER_CUSTOMERS } from "@/lib/customer-database"
import { customerToWire, filterCustomers, type CustomerFilter } from "@/lib/customer-filter"
import { computePortfolioFacts } from "@/lib/ai/portfolio-context"

export const runtime = "nodejs"
export const maxDuration = 60

const CHAT_MODEL_ID = process.env.CLAUDE_CHAT_MODEL_ID ?? "claude-haiku-4-5"

interface HistoryTurn {
  role: "user" | "assistant"
  content: string
}

interface ActiveArtefact {
  type: "chart" | "smartList"
  payload: unknown
}

const chartToolParams = z.object({
  type: z.enum(["bar", "pie", "line"]),
  title: z.string(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  unit: z.enum(["count", "eur", "percent"]).default("count"),
  data: z
    .array(z.object({ label: z.string(), value: z.number() }))
    .min(2)
    .max(20),
})

const SMART_LIST_COLUMNS = [
  "products",
  "age",
  "email",
  "premium",
  "address",
  "dossierNumber",
  "customerType",
] as const

const smartListToolParams = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500),
  type: z.enum(["dynamic", "static"]),
  filter: z.object({
    query: z.string().optional(),
    customerType: z.enum(["Natural person", "Legal entity"]).optional(),
    productsAny: z.array(z.string()).optional(),
    productsAll: z.array(z.string()).optional(),
    productsNone: z.array(z.string()).optional(),
    minPremium: z.number().optional(),
    maxPremium: z.number().optional(),
    bornAfter: z.string().optional(),
    bornBefore: z.string().optional(),
  }),
  /**
   * Columns to show alongside the customer's name. Only include values the
   * user explicitly asked for. If they didn't specify, leave this empty and
   * append a one-sentence question to your text answer (e.g.
   * "Which columns would you like to see — age, email, products, premium?").
   */
  columns: z.array(z.enum(SMART_LIST_COLUMNS)).optional(),
})

const productCatalog = Array.from(
  new Set(ALL_MASTER_CUSTOMERS.flatMap((c) => c.products)),
).sort()

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ai_not_configured", message: "ANTHROPIC_API_KEY is not set." },
      { status: 503 },
    )
  }

  let body: {
    prompt?: string
    history?: HistoryTurn[]
    activeArtefact?: ActiveArtefact | null
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const prompt = body.prompt?.trim()
  if (!prompt) return NextResponse.json({ error: "prompt_required" }, { status: 400 })

  const history = Array.isArray(body.history) ? body.history.slice(-10) : []
  const historyTranscript = history
    .map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.content}`)
    .join("\n")

  const facts = computePortfolioFacts()

  let chartPayload: z.infer<typeof chartToolParams> | null = null
  let smartListPayload: z.infer<typeof smartListToolParams> | null = null

  try {
    const result = await generateText({
      model: anthropic(CHAT_MODEL_ID),
      temperature: 0.3,
      maxOutputTokens: 1500,
      system: [
        "You are the embedded AI assistant inside Brand Broker, a tool used by Belgian insurance brokers.",
        "",
        "You choose between three response modes:",
        "1. Plain text — for factual questions about the portfolio. Just answer directly.",
        "2. `generate_chart` tool — when the user asks to visualise/plot/chart data.",
        "3. `generate_smart_list` tool — when the user asks for a list/segment/audience of customers (e.g. 'show me customers without life insurance', 'customers aged 50+').",
        "",
        "If the user's follow-up is refining the previously-shown artefact (e.g. 'make it a pie', 'only Baloise', 'add teen drivers'), call the SAME tool again with updated parameters. Don't describe the change in text — regenerate the artefact.",
        "",
        "Never call more than one tool per response. If both a chart and a list could fit, pick the one that matches the user's verb ('show me' = list, 'chart/plot' = chart).",
        "",
        "Be concise. When you use a tool, the surrounding text should be a one-sentence intro, not a wall of explanation.",
        "",
        `Available products: ${productCatalog.join(", ")}.`,
        `Customer pool size: ${ALL_MASTER_CUSTOMERS.length}.`,
        "",
        "Filter semantics for smart lists:",
        "- productsAny: customer has at least one of these.",
        "- productsAll: customer has every one.",
        "- productsNone: customer has none (use for gap lists, e.g. 'no life insurance').",
        "- minPremium / maxPremium: annual premium EUR bounds.",
        "- bornAfter / bornBefore: DOB bounds (YYYY-MM-DD).",
        "",
        "Smart-list columns:",
        `- Available: ${SMART_LIST_COLUMNS.join(", ")}. Customer name is always shown — don't request it.`,
        "- If the user's prompt explicitly mentions which columns to show (e.g. 'include age and email', 'with premium'), set `columns` to exactly those.",
        "- If the user did NOT specify columns, leave `columns` empty AND end your text answer with a single clarifying question like: \"Which columns would you like to see? e.g. age, email, premium, products.\" Suggest 3–4 columns that are relevant to the filter (e.g. age when the filter uses DOB bounds, premium when it uses premium bounds, products when it filters by product).",
        "",
        "Portfolio summary (source of truth for factual answers):",
        JSON.stringify(facts, null, 2),
        historyTranscript ? `\nConversation so far:\n${historyTranscript}` : "",
        body.activeArtefact
          ? `\nArtefact currently visible to user:\n${JSON.stringify(body.activeArtefact)}`
          : "",
      ].join("\n"),
      prompt,
      tools: {
        generate_chart: tool({
          description:
            "Produce a chart visualisation of portfolio data. Use when the user asks to plot, chart, or visualise.",
          inputSchema: chartToolParams,
          execute: async (params) => {
            chartPayload = params
            return { ok: true }
          },
        }),
        generate_smart_list: tool({
          description:
            "Produce a smart list of customers matching a filter. Use when the user asks for a list/segment of customers.",
          inputSchema: smartListToolParams,
          execute: async (params) => {
            smartListPayload = params
            return { ok: true }
          },
        }),
      },
    })

    let artefact: unknown = null
    if (chartPayload) {
      artefact = { type: "chart", chart: chartPayload }
    } else if (smartListPayload) {
      const filter = smartListPayload.filter as CustomerFilter
      const matches = filterCustomers(filter)
      artefact = {
        type: "smartList",
        proposal: {
          name: smartListPayload.name,
          description: smartListPayload.description,
          type: smartListPayload.type,
          filter,
          columns: smartListPayload.columns ?? [],
        },
        matchCount: matches.length,
        sample: matches.slice(0, 5).map(customerToWire),
        customerIds: matches.map((c) => String(c.recordId)),
      }
    }

    return NextResponse.json({
      answer: result.text ?? "",
      artefact,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("unified chat AI error:", message)
    return NextResponse.json({ error: "generation_failed", message }, { status: 502 })
  }
}
