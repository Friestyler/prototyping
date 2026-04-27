import type { AiPromptAttrs } from "@/components/maily-editor/ai-prompt-extension";
import type { RecipientContext } from "@/lib/resolve-email";
import {
  AI_ASSETS,
  AI_RISK_OBJECTS,
  AI_SAMPLE_CUSTOMER_PRODUCTS,
  expandSelectionToTemplateIds,
  getTemplate,
  templatePath,
} from "@/lib/ai-prompt-context";

export interface GenerateRequest {
  attrs: AiPromptAttrs;
  recipient: RecipientContext;
}

export interface GenerateResponse {
  text: string;
}

/**
 * Resolve the prompt block's scope selections into the concrete lists the
 * LLM will see for a single recipient.
 *
 *   - `entire-portfolio`: every product on the sample portfolio.
 *   - `filtered`: products whose template id is in the expanded selection
 *     (a picked category expands to all its subcategories + templates;
 *     a picked subcategory expands to all its templates).
 */
export function buildScopePayload(attrs: AiPromptAttrs) {
  const sampleProducts = AI_SAMPLE_CUSTOMER_PRODUCTS.map((p) => ({
    ...p,
    entry: getTemplate(p.productTemplateId),
  })).filter((p) => p.entry);

  const matched =
    attrs.scope === "entire-portfolio"
      ? sampleProducts
      : (() => {
          const expanded = expandSelectionToTemplateIds(attrs.selectedFilterIds);
          return sampleProducts.filter((p) => expanded.has(p.entry!.template.id));
        })();

  const categories = Array.from(
    new Set(matched.map((p) => `${p.entry!.category.name} › ${p.entry!.subcategory.name}`)),
  );

  // Documents + risk objects are attached to products in production. In the
  // prototype we surface ALL known samples when the relevant source is on, as
  // a stand-in for "whatever happens to be attached to the in-scope items".
  // Risk objects ride with the products source — they're always attached to
  // products, so toggling them separately would just be noise.
  const assets = attrs.sources.includes("assets") ? AI_ASSETS : [];
  const riskObjects = attrs.sources.includes("products") ? AI_RISK_OBJECTS : [];

  return {
    products: matched.map((p) => ({
      name: p.entry!.template.name,
      insurer: p.entry!.template.insurer,
      category: templatePath(p.entry!.template.id),
      policyNumber: p.policyNumber,
      premium: p.premium,
      contractEndDate: p.contractEndDate,
    })),
    categories,
    assets: assets.map((a) => ({ name: a.name, kind: a.kind, linkedTo: a.linkedTo })),
    riskObjects: riskObjects.map((r) => ({
      kind: r.kind,
      label: r.label,
      attachedProduct: r.attachedProduct,
    })),
  };
}

// Stable cache key: same (attrs + recipient) should never hit the API twice.
function cacheKey(attrs: AiPromptAttrs, recipient: RecipientContext): string {
  const scope = buildScopePayload(attrs);
  return JSON.stringify({
    i: attrs.instructionType,
    p: attrs.prompt,
    t: attrs.tone,
    l: attrs.length,
    g: [...attrs.guardrails].sort(),
    s: attrs.scope,
    scope,
    r: {
      f: recipient.firstName ?? "",
      l: recipient.lastName ?? "",
      c: recipient.company ?? "",
    },
  });
}

type CacheEntry = { text: string } | { error: string } | { pending: Promise<string> };
const CACHE = new Map<string, CacheEntry>();

export async function generateAiPromptText(
  attrs: AiPromptAttrs,
  recipient: RecipientContext,
): Promise<string> {
  const key = cacheKey(attrs, recipient);
  const cached = CACHE.get(key);
  if (cached) {
    if ("text" in cached) return cached.text;
    if ("error" in cached) throw new Error(cached.error);
    return cached.pending;
  }

  const pending = (async () => {
    const res = await fetch("/api/ai-prompt/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        attrs,
        recipient,
        scope: buildScopePayload(attrs),
      }),
    });
    if (!res.ok) {
      const message = await res.text().catch(() => res.statusText);
      const err = `AI generation failed (${res.status}): ${message}`;
      CACHE.set(key, { error: err });
      throw new Error(err);
    }
    const json = (await res.json()) as GenerateResponse;
    CACHE.set(key, { text: json.text });
    return json.text;
  })();

  CACHE.set(key, { pending });
  return pending;
}

export function clearAiPromptCache() {
  CACHE.clear();
}
