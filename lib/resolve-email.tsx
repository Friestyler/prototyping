import type { JSONContent } from "@tiptap/core";
import type { ReactNode } from "react";
import type { Lead } from "@/lib/lc-types";
import type {
  AiPromptAttrs,
  PromptLength,
  PromptTone,
} from "@/components/maily-editor/ai-prompt-extension";

export interface RecipientContext {
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  owner?: string;
}

export const leadToContext = (l: Lead): RecipientContext => ({
  firstName: l.firstName,
  lastName: l.lastName,
  company: l.company,
  email: l.email,
  owner: l.owner,
});

export interface SenderContext {
  name?: string;
  signature?: string;
}

export function resolveMergeTags(
  text: string,
  ctx: RecipientContext,
  sender?: SenderContext,
  attachmentLink?: string,
): string {
  const map: Record<string, string | undefined> = {
    "lead.firstName": ctx.firstName,
    "lead.lastName": ctx.lastName,
    "lead.company": ctx.company,
    "lead.email": ctx.email,
    "lead.owner": ctx.owner,
    "lead.attachmentLink": attachmentLink,
    "customer.firstName": ctx.firstName,
    "customer.lastName": ctx.lastName,
    "customer.name": [ctx.firstName, ctx.lastName].filter(Boolean).join(" "),
    "customer.company": ctx.company,
    "contact.firstName": ctx.firstName,
    "contact.lastName": ctx.lastName,
    "contact.email": ctx.email,
    "sender.name": sender?.name,
    "sender.signature": sender?.signature,
  };
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key: string) => {
    const value = map[key];
    return value !== undefined && value !== "" ? value : match;
  });
}

/**
 * Mock generator: in production this is an LLM call. For the prototype we
 * render a deterministic string so brokers see *what* will be generated
 * without burning API calls on every preview.
 */
export function mockGenerate(attrs: AiPromptAttrs, ctx: RecipientContext): string {
  const name = ctx.firstName || "there";
  const company = ctx.company || "your team";
  const toneSuffix: Record<PromptTone, string> = {
    professional: "",
    friendly: " 🙂",
    casual: "!",
  };
  const core = buildByInstruction(attrs, { name, company });
  return trimByLength(core, attrs.length) + toneSuffix[attrs.tone];
}

function buildByInstruction(
  attrs: AiPromptAttrs,
  { name, company }: { name: string; company: string },
) {
  switch (attrs.instructionType) {
    case "summary":
      return `Here is an overview of your current coverage at ${company}, ${name}.`;
    case "validation":
      return `${name}, please confirm the details below for ${company} are still correct — or let us know what changed.`;
    case "insights":
      return `Looking at ${company}'s portfolio, a few patterns stand out worth your attention.`;
    case "recommendation":
      return `Based on what's in place at ${company}, here are the next steps we'd recommend, ${name}.`;
    case "custom":
    default:
      return `[Generated content for ${name} at ${company}]`;
  }
}

function trimByLength(s: string, length: PromptLength) {
  if (length === "sentence") return s.split(/(?<=[.!?])\s/)[0];
  if (length === "paragraph") return s;
  return s + " " + s; // "long" mock
}

/**
 * Walks a tiptap JSON doc and returns a React tree. AI prompt nodes are
 * replaced with the mock-generated text for this recipient, highlighted
 * so the user can distinguish generated content from static copy.
 */
export interface RenderOptions {
  sender?: SenderContext;
  attachmentLink?: string;
}

export function renderEmailForRecipient(
  doc: JSONContent | null | undefined,
  ctx: RecipientContext,
  options?: RenderOptions,
): ReactNode {
  if (!doc) return <span className="text-muted-foreground italic">(empty)</span>;
  return <>{renderNode(doc, ctx, options ?? {}, "root")}</>;
}

function renderNode(
  node: JSONContent,
  ctx: RecipientContext,
  options: RenderOptions,
  key: string,
): ReactNode {
  if (node.type === "aiPrompt") {
    const attrs = node.attrs as AiPromptAttrs;
    return <span key={key}>{mockGenerate(attrs, ctx)}</span>;
  }
  if (node.type === "text") {
    return resolveMergeTags(node.text ?? "", ctx, options.sender, options.attachmentLink);
  }
  if (node.type === "hardBreak") {
    return <br key={key} />;
  }

  const children = (node.content ?? []).map((c, i) =>
    renderNode(c, ctx, options, `${key}-${i}`),
  );

  switch (node.type) {
    case "doc":
      return children;
    case "paragraph":
      return (
        <p key={key} className="my-2 leading-[1.6]">
          {children.length ? children : <br />}
        </p>
      );
    case "heading":
      const level = (node.attrs?.level as number) || 2;
      const Tag = `h${Math.min(Math.max(level, 1), 6)}` as keyof JSX.IntrinsicElements;
      return (
        <Tag key={key} className="font-semibold my-2">
          {children}
        </Tag>
      );
    case "bulletList":
      return <ul key={key} className="list-disc pl-5 my-2">{children}</ul>;
    case "orderedList":
      return <ol key={key} className="list-decimal pl-5 my-2">{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key} className="border-l-2 pl-3 text-muted-foreground my-2">{children}</blockquote>;
    default:
      return <span key={key}>{children}</span>;
  }
}

export function hasAiPromptNodes(doc: JSONContent | null | undefined): boolean {
  if (!doc) return false;
  if (doc.type === "aiPrompt") return true;
  return (doc.content ?? []).some(hasAiPromptNodes);
}
