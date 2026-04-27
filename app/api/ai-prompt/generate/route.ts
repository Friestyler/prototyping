/**
 * Runs an AI-prompt block against one recipient's scope data.
 *
 * The flow-builder AI block stores config (instruction type, tone, length,
 * scope selections, guardrails). At send time (or preview time) we resolve
 * that config into a single system+user prompt and ask Claude for the copy
 * that will go inline in the email for this recipient.
 */

import { NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL_ID = process.env.CLAUDE_PROMPT_MODEL_ID ?? "claude-haiku-4-5";

interface ProductIn {
  name: string;
  category?: string;
  policyNumber?: string;
  premium?: string;
}

interface AssetIn {
  name: string;
  kind?: string;
  linkedTo?: string;
}

interface RiskObjectIn {
  kind: string;
  label: string;
  attachedProduct?: string;
}

interface RecipientIn {
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  preferredLanguage?: string;
}

interface AttrsIn {
  instructionType: "summary" | "validation" | "insights" | "recommendation" | "custom";
  prompt: string;
  tone: "professional" | "friendly" | "casual";
  length: "sentence" | "paragraph" | "long";
  scope: "single-product" | "multiple-products" | "category" | "entire-portfolio";
  sources: string[];
  guardrails: string[];
}

interface GenerateBody {
  attrs: AttrsIn;
  recipient: RecipientIn;
  scope: {
    products?: ProductIn[];
    categories?: string[];
    assets?: AssetIn[];
    riskObjects?: RiskObjectIn[];
  };
}

const INSTRUCTION_HINTS: Record<AttrsIn["instructionType"], string> = {
  summary: "Produce a concise, structured overview of the data below.",
  validation:
    "List the details per item and ask the customer to confirm they are still correct, or to flag what changed.",
  insights:
    "Highlight notable patterns, overlaps, or gaps in the portfolio data below.",
  recommendation:
    "Propose concrete next steps the customer should consider given this portfolio.",
  custom: "",
};

const LENGTH_HINTS: Record<AttrsIn["length"], string> = {
  sentence: "Respond in exactly one sentence.",
  paragraph: "Respond in 2–3 sentences.",
  long: "Respond in a short paragraph of 4–6 sentences.",
};

const TONE_HINTS: Record<AttrsIn["tone"], string> = {
  professional: "Use a professional, business tone suitable for a Belgian insurance broker.",
  friendly: "Use a warm, approachable tone while staying professional.",
  casual: "Use a light, conversational tone.",
};

const GUARDRAIL_RULES: Record<string, string> = {
  "no-fabrication":
    "Only use facts from the data below. Do not invent product names, coverage details, prices, or dates that are not present in the data.",
  "no-guarantees":
    "Do not make absolute or unconditional claims such as \"fully covered\", \"best price\", or \"guaranteed\".",
  "factual-numbers":
    "Only quote numbers (premiums, sums insured, dates, policy numbers) that appear verbatim in the data below.",
  "no-fake-links":
    "Do not fabricate URLs or document references. If no document is attached, omit the reference.",
  "append-disclaimer":
    "End your response with a brief standard disclaimer line: \"This message is for validation; please confirm or reply with any corrections.\"",
  "match-customer-language":
    "Respond in the customer's preferred language if provided (see recipient.preferredLanguage); otherwise English.",
  "broker-review":
    "", // behavioural gate, not a content rule
};

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ai_not_configured", message: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 503 },
    );
  }

  let body: GenerateBody;
  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body?.attrs || !body?.recipient) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const { attrs, recipient, scope } = body;

  const activeGuardrails = (attrs.guardrails ?? [])
    .map((k) => GUARDRAIL_RULES[k])
    .filter(Boolean);

  const systemLines: string[] = [
    "You generate a section of copy that will be injected into a broker-to-customer email. Write it the way a professional broker or account manager would write that section themselves — polished, readable, correctly formatted for an email body.",
    "",
    "FORMATTING RULES:",
    "- Do NOT include a greeting (no \"Dear …\", \"Hi …\") or a sign-off (no \"Kind regards\", \"Best\", signature). The surrounding email already has those.",
    "- Use short paragraphs separated by a blank line. No walls of text.",
    "- When listing multiple items (policies, vehicles, documents), use a bulleted list with `- ` prefixes, one item per line.",
    "- Bold key terms with Markdown `**…**` when it aids scanning (e.g. product names or policy numbers in a validation list). Use it sparingly.",
    "- Do not include headings (`#`), code fences, tables, or HTML. Keep it to paragraphs and bullet lists.",
    "- Write in the customer's language if preferredLanguage is set; otherwise match the language of the recipient's data context.",
    "",
    "HARD RULES:",
    ...activeGuardrails.map((r) => `- ${r}`),
    activeGuardrails.length === 0 ? "- Stay factual and grounded in the data below." : "",
    "",
    "STYLE:",
    `- ${TONE_HINTS[attrs.tone]}`,
    `- ${LENGTH_HINTS[attrs.length]}`,
    attrs.instructionType !== "custom" ? `- ${INSTRUCTION_HINTS[attrs.instructionType]}` : "",
    "",
    "DATA FOR THIS RECIPIENT:",
    JSON.stringify(
      {
        recipient: {
          firstName: recipient.firstName ?? null,
          lastName: recipient.lastName ?? null,
          company: recipient.company ?? null,
          email: recipient.email ?? null,
          preferredLanguage: recipient.preferredLanguage ?? null,
        },
        scope: {
          kind: attrs.scope,
          products: scope?.products ?? [],
          categories: scope?.categories ?? [],
          assets: scope?.assets ?? [],
          riskObjects: scope?.riskObjects ?? [],
        },
      },
      null,
      2,
    ),
  ].filter(Boolean);

  const userPrompt =
    attrs.prompt?.trim() ||
    INSTRUCTION_HINTS[attrs.instructionType] ||
    "Write the requested content.";

  try {
    const { text } = await generateText({
      model: anthropic(MODEL_ID),
      maxOutputTokens: 600,
      temperature: 0.5,
      system: systemLines.join("\n"),
      prompt: userPrompt,
    });

    return NextResponse.json({ text: text.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("ai-prompt generate error:", message);
    return NextResponse.json({ error: "generation_failed", message }, { status: 502 });
  }
}
