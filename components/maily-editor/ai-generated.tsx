"use client";

import { useEffect, useState } from "react";
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
  return <span>{state.text}</span>;
}
