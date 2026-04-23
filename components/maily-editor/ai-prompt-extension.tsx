"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { useMemo, useState } from "react";
import {
  Building2,
  Car,
  FileText,
  Layers,
  Package,
  Plane,
  Shield,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  AI_ASSETS,
  AI_CATEGORIES,
  AI_PRODUCTS,
  AI_RISK_OBJECTS,
} from "@/lib/ai-prompt-context-data";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export type InstructionType =
  | "summary"
  | "validation"
  | "insights"
  | "recommendation"
  | "custom";

export type PromptTone = "professional" | "friendly" | "casual";
export type PromptLength = "sentence" | "paragraph" | "long";

export type SourceKey =
  | "customer"
  | "products"
  | "contracts"
  | "assets"
  | "risk-objects"
  | "contacts";

export type ScopeKey =
  | "single-product"
  | "multiple-products"
  | "category"
  | "entire-portfolio";

export type GenerationMode = "per-product" | "per-category" | "aggregated";

export type GuardrailKey =
  | "no-fabrication"
  | "no-guarantees"
  | "no-fake-links"
  | "factual-numbers"
  | "append-disclaimer"
  | "broker-review"
  | "match-customer-language";

export interface AiPromptAttrs {
  label: string;
  prompt: string;
  instructionType: InstructionType;
  tone: PromptTone;
  length: PromptLength;

  sources: SourceKey[];
  scope: ScopeKey;
  selectedProductIds: string[];
  selectedCategoryIds: string[];
  selectedAssetIds: string[];
  selectedRiskObjectIds: string[];

  generationMode: GenerationMode;
  guardrails: GuardrailKey[];
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiPrompt: {
      insertAiPrompt: (attrs?: Partial<AiPromptAttrs>) => ReturnType;
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Presets & static config
// ────────────────────────────────────────────────────────────────────────────

const INSTRUCTION_PRESETS: Record<
  InstructionType,
  { label: string; description: string; prompt: string }
> = {
  summary: {
    label: "Summary",
    description: "Structured overview of the selected data",
    prompt:
      "Summarize the selected products and related risk objects in a clear, structured overview the customer can scan in 30 seconds.",
  },
  validation: {
    label: "Validation request",
    description: "Ask the customer to confirm details",
    prompt:
      "List the details for each selected item and ask the customer to confirm they are still correct — or flag what changed.",
  },
  insights: {
    label: "Insights",
    description: "Observations drawn from the data",
    prompt:
      "Highlight notable patterns or gaps across the selected products (e.g. overlapping coverage, missing categories, renewal risk).",
  },
  recommendation: {
    label: "Recommendation",
    description: "Next-step suggestions",
    prompt:
      "Propose concrete next steps the customer should consider given their current portfolio and the attached documents.",
  },
  custom: {
    label: "Custom",
    description: "Write your own instruction",
    prompt: "",
  },
};

const SOURCE_OPTIONS: { key: SourceKey; label: string; icon: React.ReactNode }[] = [
  { key: "customer", label: "Customer attributes", icon: <User className="w-3.5 h-3.5" /> },
  { key: "products", label: "Products / contracts", icon: <Package className="w-3.5 h-3.5" /> },
  { key: "assets", label: "Documents (PDFs)", icon: <FileText className="w-3.5 h-3.5" /> },
  { key: "risk-objects", label: "Risk objects", icon: <Shield className="w-3.5 h-3.5" /> },
  { key: "contacts", label: "Contacts", icon: <Users className="w-3.5 h-3.5" /> },
];

const SCOPE_OPTIONS: { key: ScopeKey; label: string }[] = [
  { key: "single-product", label: "Single product" },
  { key: "multiple-products", label: "Multiple products" },
  { key: "category", label: "By category" },
  { key: "entire-portfolio", label: "Entire portfolio" },
];

const MODE_OPTIONS: { key: GenerationMode; label: string; hint: string }[] = [
  { key: "per-product", label: "Per product", hint: "One block of content for each product in scope" },
  { key: "per-category", label: "Per category", hint: "One block of content grouped by category" },
  { key: "aggregated", label: "One aggregated summary", hint: "A single block covering everything in scope" },
];

const GUARDRAILS: { key: GuardrailKey; label: string; description: string; defaultOn: boolean }[] = [
  {
    key: "no-fabrication",
    label: "Only use facts from selected sources",
    description: "The AI must not invent product names, coverage, prices, or dates not present in the data.",
    defaultOn: true,
  },
  {
    key: "no-guarantees",
    label: "No absolute claims",
    description: "Avoid unconditional promises like \"fully covered\", \"best price\", \"guaranteed\".",
    defaultOn: true,
  },
  {
    key: "factual-numbers",
    label: "Only quote numbers that appear in the source",
    description: "Premiums, sums insured, and dates must match source verbatim.",
    defaultOn: true,
  },
  {
    key: "no-fake-links",
    label: "Never fabricate URLs or document references",
    description: "If no attachment is available, omit rather than inventing one.",
    defaultOn: true,
  },
  {
    key: "append-disclaimer",
    label: "Append standard validation disclaimer",
    description: "Adds the broker disclaimer used for validation emails.",
    defaultOn: false,
  },
  {
    key: "match-customer-language",
    label: "Match the customer's preferred language",
    description: "Falls back to the campaign language if preference is missing.",
    defaultOn: false,
  },
  {
    key: "broker-review",
    label: "Queue for broker review before sending",
    description: "Never auto-send without a human check.",
    defaultOn: false,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Defaults
// ────────────────────────────────────────────────────────────────────────────

const defaultAttrs = (overrides?: Partial<AiPromptAttrs>): AiPromptAttrs => ({
  label: overrides?.label ?? "AI",
  prompt: overrides?.prompt ?? INSTRUCTION_PRESETS.summary.prompt,
  instructionType: overrides?.instructionType ?? "summary",
  tone: overrides?.tone ?? "professional",
  length: overrides?.length ?? "paragraph",
  sources: overrides?.sources ?? ["customer", "products"],
  scope: overrides?.scope ?? "multiple-products",
  selectedProductIds: overrides?.selectedProductIds ?? [],
  selectedCategoryIds: overrides?.selectedCategoryIds ?? [],
  selectedAssetIds: overrides?.selectedAssetIds ?? [],
  selectedRiskObjectIds: overrides?.selectedRiskObjectIds ?? [],
  generationMode: overrides?.generationMode ?? "aggregated",
  guardrails: overrides?.guardrails ?? GUARDRAILS.filter((g) => g.defaultOn).map((g) => g.key),
});

// ────────────────────────────────────────────────────────────────────────────
// Tiptap Node
// ────────────────────────────────────────────────────────────────────────────

export const AiPromptNode = Node.create({
  name: "aiPrompt",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    const d = defaultAttrs();
    return {
      label: { default: d.label },
      prompt: { default: d.prompt },
      instructionType: { default: d.instructionType },
      tone: { default: d.tone },
      length: { default: d.length },
      sources: { default: d.sources },
      scope: { default: d.scope },
      selectedProductIds: { default: d.selectedProductIds },
      selectedCategoryIds: { default: d.selectedCategoryIds },
      selectedAssetIds: { default: d.selectedAssetIds },
      selectedRiskObjectIds: { default: d.selectedRiskObjectIds },
      generationMode: { default: d.generationMode },
      guardrails: { default: d.guardrails },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-ai-prompt]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-ai-prompt": "true" }),
      `[AI: ${HTMLAttributes.label || HTMLAttributes.prompt || "prompt"}]`,
    ];
  },

  addCommands() {
    return {
      insertAiPrompt:
        (attrs) =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name, attrs: defaultAttrs(attrs) })
            .insertContent(" ")
            .run();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AiPromptChip);
  },
});

// ────────────────────────────────────────────────────────────────────────────
// Chip (NodeView)
// ────────────────────────────────────────────────────────────────────────────

function AiPromptChip({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const attrs = node.attrs as AiPromptAttrs;
  const [open, setOpen] = useState(false);
  const editable = editor?.isEditable ?? true;

  const summary = buildChipSummary(attrs);

  return (
    <NodeViewWrapper as="span" className="inline-block align-baseline">
      <span
        role="button"
        tabIndex={0}
        onClick={() => editable && setOpen(true)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && editable) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded-md text-[12px] font-medium",
          "bg-gradient-to-r from-violet-50 to-indigo-50 text-indigo-700 border border-indigo-200",
          "hover:from-violet-100 hover:to-indigo-100 cursor-pointer select-none",
        )}
        contentEditable={false}
      >
        <Sparkles className="w-3 h-3" />
        <span className="font-semibold">AI</span>
        <span className="opacity-70">·</span>
        <span className="max-w-[360px] truncate">{summary}</span>
        {editable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteNode();
            }}
            className="ml-0.5 -mr-0.5 w-4 h-4 rounded hover:bg-indigo-200 flex items-center justify-center"
            aria-label="Remove AI block"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </span>

      {open && (
        <AiPromptConfigurator
          initial={attrs}
          onCancel={() => setOpen(false)}
          onSave={(next) => {
            updateAttributes(next);
            setOpen(false);
          }}
        />
      )}
    </NodeViewWrapper>
  );
}

function buildChipSummary(attrs: AiPromptAttrs): string {
  const instr = INSTRUCTION_PRESETS[attrs.instructionType]?.label ?? "Custom";
  const scope = SCOPE_OPTIONS.find((s) => s.key === attrs.scope)?.label.toLowerCase() ?? "";
  const mode = MODE_OPTIONS.find((m) => m.key === attrs.generationMode)?.label.toLowerCase() ?? "";
  return `${instr} · ${scope} · ${mode}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Configurator dialog
// ────────────────────────────────────────────────────────────────────────────

function AiPromptConfigurator({
  initial,
  onCancel,
  onSave,
}: {
  initial: AiPromptAttrs;
  onCancel: () => void;
  onSave: (next: AiPromptAttrs) => void;
}) {
  const [draft, setDraft] = useState<AiPromptAttrs>(initial);
  const [guardrailsOpen, setGuardrailsOpen] = useState(false);

  const patch = (p: Partial<AiPromptAttrs>) => setDraft((d) => ({ ...d, ...p }));

  const onInstructionChange = (t: InstructionType) => {
    const preset = INSTRUCTION_PRESETS[t];
    patch({
      instructionType: t,
      prompt: t === "custom" ? draft.prompt : preset.prompt,
    });
  };

  const toggleSource = (k: SourceKey) => {
    patch({
      sources: draft.sources.includes(k)
        ? draft.sources.filter((s) => s !== k)
        : [...draft.sources, k],
    });
  };

  const toggleGuardrail = (k: GuardrailKey) => {
    patch({
      guardrails: draft.guardrails.includes(k)
        ? draft.guardrails.filter((g) => g !== k)
        : [...draft.guardrails, k],
    });
  };

  const toggleArray = (field: keyof AiPromptAttrs, id: string) => {
    const current = (draft[field] as string[]) ?? [];
    patch({
      [field]: current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    } as Partial<AiPromptAttrs>);
  };

  // Resolve which products will be in scope — drives the preview pane + mode logic
  const productsInScope = useMemo(() => {
    switch (draft.scope) {
      case "entire-portfolio":
        return AI_PRODUCTS;
      case "category":
        return AI_PRODUCTS.filter((p) => draft.selectedCategoryIds.includes(p.category));
      case "multiple-products":
      case "single-product":
        return AI_PRODUCTS.filter((p) => draft.selectedProductIds.includes(p.id));
    }
  }, [draft.scope, draft.selectedCategoryIds, draft.selectedProductIds]);

  const categoriesInScope = useMemo(
    () => Array.from(new Set(productsInScope.map((p) => p.category))),
    [productsInScope],
  );

  const showProductPicker =
    draft.scope === "single-product" || draft.scope === "multiple-products";
  const showCategoryPicker = draft.scope === "category";
  const showAssetPicker = draft.sources.includes("assets");
  const showRiskPicker = draft.sources.includes("risk-objects");

  return (
    <Dialog open onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-[980px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Configure AI-generated content
          </DialogTitle>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">
            Runs once per recipient at send time. Choose what data the AI sees, what to generate,
            and how to group the output.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_360px] max-h-[70vh]">
          {/* LEFT — configuration */}
          <div className="overflow-y-auto px-6 py-5 space-y-6">
            {/* What to generate */}
            <Section title="What should the AI generate?">
              <div className="grid grid-cols-5 gap-2 mb-3">
                {(Object.keys(INSTRUCTION_PRESETS) as InstructionType[]).map((k) => {
                  const preset = INSTRUCTION_PRESETS[k];
                  const active = draft.instructionType === k;
                  return (
                    <button
                      key={k}
                      onClick={() => onInstructionChange(k)}
                      className={cn(
                        "rounded-md border px-2.5 py-2 text-left transition-colors",
                        active
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-border bg-white hover:border-indigo-200 hover:bg-indigo-50/40",
                      )}
                    >
                      <div className="text-[12.5px] font-medium">{preset.label}</div>
                      <div className="text-[10.5px] text-muted-foreground mt-0.5 leading-tight">
                        {preset.description}
                      </div>
                    </button>
                  );
                })}
              </div>
              <Textarea
                value={draft.prompt}
                onChange={(e) =>
                  patch({ prompt: e.target.value, instructionType: "custom" })
                }
                placeholder="Describe what the AI should write, per recipient. Reference fields with {{customer.name}}, {{product.name}}, etc."
                className="min-h-[90px] text-[13px]"
              />
            </Section>

            {/* Data sources */}
            <Section title="Data sources">
              <div className="flex flex-wrap gap-2">
                {SOURCE_OPTIONS.map((opt) => {
                  const active = draft.sources.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      onClick={() => toggleSource(opt.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[12.5px] transition-colors",
                        active
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-border bg-white text-muted-foreground hover:border-indigo-200 hover:bg-indigo-50/40",
                      )}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Scope */}
            <Section title="Scope">
              <div className="grid grid-cols-4 gap-2 mb-3">
                {SCOPE_OPTIONS.map((opt) => {
                  const active = draft.scope === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() =>
                        patch({
                          scope: opt.key,
                          // reset selections that don't apply to the new scope
                          selectedProductIds:
                            opt.key === "single-product" || opt.key === "multiple-products"
                              ? draft.selectedProductIds
                              : [],
                          selectedCategoryIds:
                            opt.key === "category" ? draft.selectedCategoryIds : [],
                        })
                      }
                      className={cn(
                        "rounded-md border px-2 py-2 text-center text-[12.5px] font-medium transition-colors",
                        active
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-border bg-white text-muted-foreground hover:border-indigo-200",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {showProductPicker && (
                <MultiSelectList
                  title="Products"
                  items={AI_PRODUCTS.map((p) => ({
                    id: p.id,
                    label: p.name,
                    sub: `${p.category} · ${p.policyNumber}`,
                  }))}
                  selected={draft.selectedProductIds}
                  onToggle={(id) => toggleArray("selectedProductIds", id)}
                  singleSelect={draft.scope === "single-product"}
                  onSingleSelect={(id) => patch({ selectedProductIds: [id] })}
                  emptyLabel="Select one or more products"
                />
              )}

              {showCategoryPicker && (
                <MultiSelectList
                  title="Categories"
                  items={AI_CATEGORIES.map((c) => ({
                    id: c,
                    label: c,
                    sub: `${AI_PRODUCTS.filter((p) => p.category === c).length} products`,
                  }))}
                  selected={draft.selectedCategoryIds}
                  onToggle={(id) => toggleArray("selectedCategoryIds", id)}
                  emptyLabel="Select one or more categories"
                />
              )}
            </Section>

            {/* Generation mode */}
            <Section title="Generation mode">
              <div className="grid grid-cols-3 gap-2">
                {MODE_OPTIONS.map((m) => {
                  const active = draft.generationMode === m.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => patch({ generationMode: m.key })}
                      className={cn(
                        "rounded-md border px-3 py-2.5 text-left transition-colors",
                        active
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-border bg-white hover:border-indigo-200",
                      )}
                    >
                      <div className="text-[12.5px] font-medium">{m.label}</div>
                      <div className="text-[10.5px] text-muted-foreground mt-0.5 leading-tight">
                        {m.hint}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Documents */}
            {showAssetPicker && (
              <Section title="Documents to include" icon={<FileText className="w-3.5 h-3.5" />}>
                <MultiSelectList
                  items={AI_ASSETS.map((a) => ({
                    id: a.id,
                    label: a.name,
                    sub: `${a.kind} · ${a.linkedTo}`,
                  }))}
                  selected={draft.selectedAssetIds}
                  onToggle={(id) => toggleArray("selectedAssetIds", id)}
                  emptyLabel="No documents selected — AI will not see any PDFs"
                />
              </Section>
            )}

            {/* Risk objects */}
            {showRiskPicker && (
              <Section title="Risk objects to include" icon={<Shield className="w-3.5 h-3.5" />}>
                <MultiSelectList
                  items={AI_RISK_OBJECTS.map((r) => ({
                    id: r.id,
                    label: r.label,
                    sub: `${r.kind} · attached to ${r.attachedProduct}`,
                    icon:
                      r.kind === "Vehicle" ? (
                        <Car className="w-3.5 h-3.5" />
                      ) : r.kind === "Building" ? (
                        <Building2 className="w-3.5 h-3.5" />
                      ) : (
                        <Plane className="w-3.5 h-3.5" />
                      ),
                  }))}
                  selected={draft.selectedRiskObjectIds}
                  onToggle={(id) => toggleArray("selectedRiskObjectIds", id)}
                  emptyLabel="No risk objects selected"
                />
              </Section>
            )}

            {/* Tone & length */}
            <Section title="Voice">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[12px] font-medium">Tone</Label>
                  <Select
                    value={draft.tone}
                    onValueChange={(v) => patch({ tone: v as PromptTone })}
                  >
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[12px] font-medium">Length</Label>
                  <Select
                    value={draft.length}
                    onValueChange={(v) => patch({ length: v as PromptLength })}
                  >
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sentence">1 sentence</SelectItem>
                      <SelectItem value="paragraph">Short paragraph</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[12px] font-medium">Chip label</Label>
                  <Input
                    value={draft.label}
                    onChange={(e) => patch({ label: e.target.value })}
                    className="h-9 text-[13px]"
                  />
                </div>
              </div>
            </Section>

            {/* Guardrails */}
            <Section
              title="Guardrails"
              action={
                <button
                  type="button"
                  onClick={() => setGuardrailsOpen((o) => !o)}
                  className="text-[12px] text-brand hover:underline"
                >
                  {guardrailsOpen ? "Collapse" : `Review (${draft.guardrails.length} active)`}
                </button>
              }
            >
              {guardrailsOpen ? (
                <div className="space-y-2">
                  {GUARDRAILS.map((g) => {
                    const active = draft.guardrails.includes(g.key);
                    return (
                      <label
                        key={g.key}
                        className={cn(
                          "flex gap-2.5 rounded-md border p-2.5 cursor-pointer",
                          active ? "border-indigo-200 bg-indigo-50/40" : "border-border bg-white",
                        )}
                      >
                        <Checkbox
                          checked={active}
                          onCheckedChange={() => toggleGuardrail(g.key)}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="text-[12.5px] font-medium">{g.label}</div>
                          <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                            {g.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {draft.guardrails.map((k) => {
                    const g = GUARDRAILS.find((x) => x.key === k);
                    if (!g) return null;
                    return (
                      <span
                        key={k}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        ✓ {g.label}
                      </span>
                    );
                  })}
                  {draft.guardrails.length === 0 && (
                    <span className="text-[11.5px] text-muted-foreground italic">
                      No guardrails active — AI output is unconstrained.
                    </span>
                  )}
                </div>
              )}
            </Section>
          </div>

          {/* RIGHT — preview / scope readout */}
          <div className="border-l border-border bg-gray-50/40 overflow-y-auto px-5 py-5 space-y-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
                In scope for this recipient
              </div>
              <div className="rounded-md border border-border bg-white p-3 space-y-2">
                <ReadoutRow
                  icon={<Layers className="w-3.5 h-3.5" />}
                  label="Categories"
                  value={categoriesInScope.length ? categoriesInScope.join(", ") : "—"}
                />
                <ReadoutRow
                  icon={<Package className="w-3.5 h-3.5" />}
                  label="Products"
                  value={
                    productsInScope.length
                      ? `${productsInScope.length} selected`
                      : draft.scope === "entire-portfolio"
                        ? "Entire portfolio"
                        : "None selected"
                  }
                />
                {productsInScope.length > 0 && (
                  <ul className="pl-5 text-[11.5px] text-muted-foreground space-y-0.5">
                    {productsInScope.slice(0, 6).map((p) => (
                      <li key={p.id} className="list-disc">
                        {p.name}
                      </li>
                    ))}
                    {productsInScope.length > 6 && (
                      <li className="list-disc">+ {productsInScope.length - 6} more</li>
                    )}
                  </ul>
                )}
                <ReadoutRow
                  icon={<FileText className="w-3.5 h-3.5" />}
                  label="Documents"
                  value={
                    draft.sources.includes("assets")
                      ? draft.selectedAssetIds.length
                        ? `${draft.selectedAssetIds.length} PDF${draft.selectedAssetIds.length === 1 ? "" : "s"}`
                        : "None selected"
                      : "Not in sources"
                  }
                />
                <ReadoutRow
                  icon={<Shield className="w-3.5 h-3.5" />}
                  label="Risk objects"
                  value={
                    draft.sources.includes("risk-objects")
                      ? draft.selectedRiskObjectIds.length
                        ? `${draft.selectedRiskObjectIds.length} linked`
                        : "None selected"
                      : "Not in sources"
                  }
                />
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
                Output shape
              </div>
              <div className="rounded-md border border-border bg-white p-3 text-[12px] leading-relaxed">
                {describeOutputShape(draft, productsInScope.length, categoriesInScope.length)}
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
                Sample preview
              </div>
              <div className="rounded-md border border-border bg-white p-3 text-[12.5px] leading-relaxed text-foreground whitespace-pre-wrap">
                {mockPreview(draft, productsInScope, categoriesInScope)}
              </div>
              <div className="text-[10.5px] text-muted-foreground mt-1.5">
                Mocked for illustration — real copy is generated per recipient at send time.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t border-border bg-white">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)}>Save AI block</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Small UI helpers
// ────────────────────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
          {icon}
          {title}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MultiSelectList({
  title,
  items,
  selected,
  onToggle,
  singleSelect,
  onSingleSelect,
  emptyLabel,
}: {
  title?: string;
  items: { id: string; label: string; sub?: string; icon?: React.ReactNode }[];
  selected: string[];
  onToggle: (id: string) => void;
  singleSelect?: boolean;
  onSingleSelect?: (id: string) => void;
  emptyLabel?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-white max-h-[200px] overflow-y-auto">
      {title && (
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground px-3 pt-2 pb-1">
          {title}
        </div>
      )}
      {items.length === 0 && (
        <div className="px-3 py-2 text-[12px] text-muted-foreground italic">{emptyLabel}</div>
      )}
      {items.map((it) => {
        const active = selected.includes(it.id);
        return (
          <label
            key={it.id}
            className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 cursor-pointer border-b border-gray-50 last:border-b-0",
              active ? "bg-indigo-50/50" : "hover:bg-gray-50",
            )}
          >
            {singleSelect ? (
              <input
                type="radio"
                checked={active}
                onChange={() => onSingleSelect?.(it.id)}
                className="accent-indigo-600"
              />
            ) : (
              <Checkbox checked={active} onCheckedChange={() => onToggle(it.id)} />
            )}
            {it.icon}
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium truncate">{it.label}</div>
              {it.sub && (
                <div className="text-[11px] text-muted-foreground truncate">{it.sub}</div>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}

function ReadoutRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 text-[12px]">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
          {label}
        </div>
        <div className="text-[12.5px] text-foreground">{value}</div>
      </div>
    </div>
  );
}

function describeOutputShape(
  attrs: AiPromptAttrs,
  productCount: number,
  categoryCount: number,
): string {
  switch (attrs.generationMode) {
    case "per-product":
      return productCount > 0
        ? `${productCount} block${productCount === 1 ? "" : "s"} — one per product.`
        : "One block per product in scope (none selected yet).";
    case "per-category":
      return categoryCount > 0
        ? `${categoryCount} block${categoryCount === 1 ? "" : "s"} — one per category.`
        : "One block per category (none in scope yet).";
    case "aggregated":
    default:
      return "A single aggregated block covering everything in scope.";
  }
}

function mockPreview(
  attrs: AiPromptAttrs,
  products: typeof AI_PRODUCTS,
  categories: string[],
): string {
  if (attrs.instructionType === "validation" && attrs.generationMode === "per-product") {
    if (products.length === 0) {
      return "Here are your products — please confirm the details or flag anything that changed.";
    }
    return products
      .slice(0, 3)
      .map(
        (p) =>
          `• ${p.name} (${p.policyNumber}) — premium ${p.premium}. Still correct?`,
      )
      .join("\n");
  }
  if (attrs.instructionType === "summary" && attrs.generationMode === "per-category") {
    const cats = categories.length ? categories : ["Auto", "Home"];
    return cats
      .slice(0, 3)
      .map((c) => `• ${c}: ${products.filter((p) => p.category === c).length} products in place.`)
      .join("\n");
  }
  if (attrs.instructionType === "summary" || attrs.generationMode === "aggregated") {
    return `Overview: ${products.length || "several"} products across ${categories.length || "multiple"} categor${categories.length === 1 ? "y" : "ies"}. ${products.length ? "Coverage looks consistent with the latest attached documents." : ""}`;
  }
  if (attrs.instructionType === "insights") {
    return "Observed: overlap between two Auto policies on the partner vehicle. Recommend consolidating to a single omnium policy.";
  }
  if (attrs.instructionType === "recommendation") {
    return "Given the current portfolio and the attached documents, consider adding business-interruption coverage before Q3.";
  }
  return "Generated copy will appear here for each recipient at send time.";
}
