/**
 * Portfolio Insights AI agent.
 *
 * Single-shot Q&A: the user asks a question about their portfolio, the model
 * answers in plain text and optionally returns a chart spec the UI renders.
 * Pre-computed aggregates are stuffed into the system prompt so the model
 * doesn't have to invent numbers.
 */

import { NextResponse } from "next/server"
import { anthropic } from "@ai-sdk/anthropic"
import { generateObject } from "ai"
import { z } from "zod"
import { computePortfolioFacts } from "@/lib/ai/portfolio-context"

// Insights favour latency over depth — Haiku handles the structured chart spec fast.
const INSIGHTS_MODEL_ID = process.env.CLAUDE_INSIGHTS_MODEL_ID ?? "claude-haiku-4-5"

export const runtime = "nodejs"
export const maxDuration = 60

const chartSchema = z.object({
  type: z.enum(["bar", "pie", "line"]).describe("Chart visualization type."),
  title: z.string().describe("Short chart title."),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
  data: z
    .array(z.object({ label: z.string(), value: z.number() }))
    .describe("Chart data points (2–20 items). Each point is a label + a numeric value."),
  unit: z.enum(["count", "eur", "percent"]).default("count"),
})

const responseSchema = z.object({
  answer: z.string().describe("Plain-text answer to the broker's question. 1–4 short paragraphs."),
  followUpSuggestions: z
    .array(z.string())
    .optional()
    .describe("Up to 3 short follow-up questions the broker might ask next."),
  chart: chartSchema.nullable().describe(
    "Set to a chart spec when a visualisation actually helps. Set to null for purely textual answers.",
  ),
})

interface HistoryTurn {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ai_not_configured", message: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 503 },
    )
  }

  let body: { prompt?: string; history?: HistoryTurn[]; currentChart?: unknown }
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

  try {
    const { object } = await generateObject({
      model: anthropic(INSIGHTS_MODEL_ID),
      schema: responseSchema,
      maxOutputTokens: 1500,
      temperature: 0.4,
      system: [
        "You are an embedded portfolio analyst inside Brand Broker, a tool used by Belgian insurance brokers.",
        "Answer the broker's question using the data summary below. Be concise and concrete (specific numbers, EUR amounts, customer counts).",
        "If the question naturally calls for a chart, return one. If text is enough, return chart=null.",
        "When you reference customers, use anonymised aggregates — never fabricate names or invent data not present below.",
        "If the user asks to refine or modify a chart you previously returned (e.g. 'remove the smallest', 'only show life products', 'switch to a pie chart'), return the updated chart as a new chart spec — don't describe the change in text.",
        "",
        "Portfolio summary (single source of truth):",
        JSON.stringify(facts, null, 2),
        historyTranscript ? `\nConversation so far:\n${historyTranscript}` : "",
        body.currentChart ? `\nChart currently displayed to the user:\n${JSON.stringify(body.currentChart)}` : "",
      ].join("\n"),
      prompt,
    })

    return NextResponse.json({
      answer: object.answer,
      chart: object.chart,
      followUpSuggestions: object.followUpSuggestions ?? [],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("insights AI error:", message)
    return NextResponse.json({ error: "generation_failed", message }, { status: 502 })
  }
}
