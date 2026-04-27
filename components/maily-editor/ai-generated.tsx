"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import type { AiPromptAttrs } from "@/components/maily-editor/ai-prompt-extension";
import type { RecipientContext } from "@/lib/resolve-email";
import { generateAiPromptText } from "@/lib/ai-prompt-client";
import { mockGenerate } from "@/lib/resolve-email";

interface AiGeneratedProps {
  attrs: AiPromptAttrs;
  ctx: RecipientContext;
}

/**
 * Renders the AI prompt block's output for a single recipient.
 * Calls the real LLM via /api/ai-prompt/generate, with a module-level cache
 * so switching recipients back and forth doesn't re-hit the API.
 */
export function AiGenerated({ attrs, ctx }: AiGeneratedProps) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; text: string }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    generateAiPromptText(attrs, ctx)
      .then((text) => {
        if (!cancelled) setState({ status: "ready", text });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ status: "error", message: err.message });
      });
    return () => {
      cancelled = true;
    };
    // attrs and ctx are stable by value; depend on their JSON for proper re-fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(attrs), ctx.firstName, ctx.lastName, ctx.company]);

  if (state.status === "loading") {
    return (
      <span className="inline-flex items-center gap-1 text-indigo-500">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="italic">Generating…</span>
      </span>
    );
  }
  if (state.status === "error") {
    return (
      <span
        className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-1 rounded"
        title={state.message}
      >
        <AlertCircle className="w-3 h-3" />
        <span className="italic">AI generation failed — using fallback:</span>{" "}
        <span className="text-foreground not-italic">{mockGenerate(attrs, ctx)}</span>
      </span>
    );
  }
  return <>{renderEmailMarkdown(state.text)}</>;
}

/**
 * Minimal email-safe markdown renderer.
 * Supports: paragraphs (blank-line separated), bulleted lists (`- `), inline `**bold**`.
 * Anything else passes through as plain text. Keeps the AI output readable as
 * a professional email layout without pulling in a full markdown dependency.
 */
function renderEmailMarkdown(text: string): ReactNode {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const blocks: { kind: "paragraph" | "list"; lines: string[] }[] = [];
  for (const rawBlock of trimmed.split(/\n{2,}/)) {
    const block = rawBlock.trim();
    if (!block) continue;
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const isList = lines.every((l) => /^[-•*]\s+/.test(l));
    if (isList) {
      blocks.push({ kind: "list", lines: lines.map((l) => l.replace(/^[-•*]\s+/, "")) });
    } else {
      blocks.push({ kind: "paragraph", lines });
    }
  }

  return blocks.map((b, i) => {
    if (b.kind === "list") {
      return (
        <ul key={i} className="list-disc pl-5 my-2 space-y-0.5">
          {b.lines.map((l, j) => (
            <li key={j}>{renderInline(l)}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i} className={i === 0 ? "mt-0 mb-2" : "my-2"}>
        {b.lines.map((l, j) => (
          <span key={j}>
            {renderInline(l)}
            {j < b.lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    );
  });
}

function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  const re = /\*\*([^*]+)\*\*/g;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<strong key={`b-${i++}`}>{match[1]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
