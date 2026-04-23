"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Car,
  ChevronDown,
  FileText,
  Layers,
  Loader2,
  Package,
  Plane,
  Play,
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
  AI_CATEGORY_TREE,
  AI_RISK_OBJECTS,
  AI_SAMPLE_CUSTOMER_PRODUCTS,
  expandSelectionToTemplateIds,
  getTemplate,
  templatePath,
  type AiCategory,
  type AiSubcategory,
  type AiTemplate,
} from "@/lib/ai-prompt-context";
import { generateAiPromptText } from "@/lib/ai-prompt-client";

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

export type ScopeKey = "entire-portfolio" | "filtered";

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
  /**
   * Mixed ids from the category tree — can be `cat-…`, `sub-…`, or `tpl-…`.
   * A picked category expands to all its subcategories and templates; a
   * picked subcategory expands to all its templates.
   */
  selectedFilterIds: string[];
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

const SCOPE_OPTIONS: { key: ScopeKey; label: string; hint: string }[] = [
  {
    key: "entire-portfolio",
    label: "All products",
    hint: "Every product this recipient has.",
  },
  {
    key: "filtered",
    label: "Specific products",
    hint: "Only products in the categories, subcategories, or templates you pick.",
  },
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
  scope: overrides?.scope ?? "entire-portfolio",
  selectedFilterIds: overrides?.selectedFilterIds ?? [],
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
      selectedFilterIds: { default: d.selectedFilterIds },
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

  // Freeze the editor while the configurator is open so the bubble / floating
  // toolbar doesn't bleed through the dialog.
  useEffect(() => {
    if (!editor) return;
    if (open) {
      const was = editor.isEditable;
      editor.setEditable(false);
      document.body.setAttribute("data-ai-prompt-dialog", "open");
      return () => {
        editor.setEditable(was);
        document.body.removeAttribute("data-ai-prompt-dialog");
      };
    }
  }, [open, editor]);

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
  // Resolve the filter against the sample customer portfolio so the preview
  // shows exactly what the LLM will see for a matched recipient.
  const productsInScope = useMemo(() => {
    const expanded =
      draft.scope === "entire-portfolio"
        ? null
        : expandSelectionToTemplateIds(draft.selectedFilterIds);
    return AI_SAMPLE_CUSTOMER_PRODUCTS.map((p) => ({
      ...p,
      entry: getTemplate(p.productTemplateId),
    })).filter((p) => {
      if (!p.entry) return false;
      if (!expanded) return true;
      return expanded.has(p.entry.template.id);
    });
  }, [draft.scope, draft.selectedFilterIds]);

  const categoriesInScope = useMemo(() => {
    const names = new Set<string>();
    for (const p of productsInScope) {
      if (p.entry) names.add(`${p.entry.category.name} › ${p.entry.subcategory.name}`);
    }
    return Array.from(names);
  }, [productsInScope]);

  const toggleFilter = (id: string) => {
    patch({
      selectedFilterIds: draft.selectedFilterIds.includes(id)
        ? draft.selectedFilterIds.filter((x) => x !== id)
        : [...draft.selectedFilterIds, id],
    });
  };

  const showFilters = draft.scope === "filtered";
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
          <div className="overflow-y-auto px-6 py-5 space-y-5">
            {/* What to generate */}
            <Section title="What should the AI generate?">
              <ChipSelect
                options={(Object.keys(INSTRUCTION_PRESETS) as InstructionType[]).map((k) => ({
                  key: k,
                  label: INSTRUCTION_PRESETS[k].label,
                }))}
                value={draft.instructionType}
                onChange={(v) => onInstructionChange(v)}
              />
              <div className="text-[11px] text-muted-foreground mt-1.5">
                {INSTRUCTION_PRESETS[draft.instructionType].description}
              </div>
              <Textarea
                value={draft.prompt}
                onChange={(e) =>
                  patch({ prompt: e.target.value, instructionType: "custom" })
                }
                placeholder="Describe what the AI should write, per recipient. Reference fields with {{customer.name}}, {{product.name}}, etc."
                className="min-h-[90px] text-[13px] mt-2"
              />
            </Section>

            {/* Data sources */}
            <Section
              title="Data sources"
              hint="Where the AI gets its information for each recipient"
            >
              <div className="flex flex-wrap gap-1.5">
                {SOURCE_OPTIONS.map((opt) => {
                  const active = draft.sources.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      onClick={() => toggleSource(opt.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[12px] transition-colors",
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
              {draft.sources.includes("assets") && (
                <div className="mt-2 text-[11px] text-muted-foreground">
                  The AI will scan PDFs attached to in-scope products. Filtering by document type
                  (contracts, policy descriptions, claim reports) is coming later.
                </div>
              )}
            </Section>

            {/* Scope */}
            <Section title="Scope">
              <ChipSelect
                options={SCOPE_OPTIONS.map((s) => ({ key: s.key, label: s.label }))}
                value={draft.scope}
                onChange={(v) => patch({ scope: v })}
              />
              <div className="text-[11px] text-muted-foreground mt-1.5">
                {SCOPE_OPTIONS.find((s) => s.key === draft.scope)?.hint}
              </div>

              {showFilters && (
                <div className="mt-2.5">
                  <CategoryTreePicker
                    selectedIds={draft.selectedFilterIds}
                    onToggle={toggleFilter}
                    onSelectAll={() =>
                      patch({ selectedFilterIds: AI_CATEGORY_TREE.map((c) => c.id) })
                    }
                    onClear={() => patch({ selectedFilterIds: [] })}
                  />
                </div>
              )}

              {showFilters && draft.selectedFilterIds.length === 0 && (
                <div className="mt-2 text-[11.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
                  No filters selected — the AI will see zero products for each recipient. Pick at
                  least one category, subcategory, or product template.
                </div>
              )}
            </Section>

            {/* Generation mode */}
            <Section title="Generation mode">
              <ChipSelect
                options={MODE_OPTIONS.map((m) => ({ key: m.key, label: m.label }))}
                value={draft.generationMode}
                onChange={(v) => patch({ generationMode: v })}
              />
              <div className="text-[11px] text-muted-foreground mt-1.5">
                {MODE_OPTIONS.find((m) => m.key === draft.generationMode)?.hint}
              </div>
            </Section>

            {/* Tone & length */}
            <Section title="Voice">
              <div className="grid grid-cols-2 gap-3">
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
              </div>
            </Section>

            {/*
             * Guardrails are enforced server-side from the defaults; no UI for
             * the broker. `draft.guardrails` still flows to the API route.
             */}
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
                        {p.entry?.template.name ?? "—"}{" "}
                        <span className="text-light">· {p.policyNumber}</span>
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
                      ? "PDFs attached to in-scope products"
                      : "Not in sources"
                  }
                />
                <ReadoutRow
                  icon={<Shield className="w-3.5 h-3.5" />}
                  label="Risk objects"
                  value={
                    draft.sources.includes("risk-objects")
                      ? "Risk objects attached to in-scope products"
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

            <LivePreview
              attrs={draft}
              fallbackText={mockPreview(draft, productsInScope, categoriesInScope)}
            />
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
  hint,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
          {icon}
          {title}
          {hint ? (
            <span className="font-normal text-muted-foreground text-[11px]">— {hint}</span>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ChipSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[12px] transition-colors",
              active
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-border bg-white text-muted-foreground hover:border-indigo-200 hover:bg-indigo-50/40",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
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

function CategoryTreePicker({
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const [openCats, setOpenCats] = useState<Set<string>>(() => new Set());
  const [openSubs, setOpenSubs] = useState<Set<string>>(() => new Set());
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = AI_CATEGORY_TREE.every((c) => selectedSet.has(c.id));

  const toggleCat = (id: string) =>
    setOpenCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleSub = (id: string) =>
    setOpenSubs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const isUnderSelected = (cat: AiCategory, sub?: AiSubcategory): boolean => {
    if (selectedSet.has(cat.id)) return true;
    if (sub && selectedSet.has(sub.id)) return true;
    return false;
  };

  return (
    <div className="rounded-md border border-border bg-white max-h-[420px] overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-1.5 sticky top-0 bg-white border-b border-border z-[1]">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Categories · subcategories · product templates
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={allSelected ? onClear : onSelectAll}
            className="text-[11.5px] text-brand hover:underline"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
          {!allSelected && selectedIds.length > 0 && (
            <>
              <span className="text-muted-foreground text-[11px]">·</span>
              <button
                type="button"
                onClick={onClear}
                className="text-[11.5px] text-muted-foreground hover:text-foreground"
              >
                Clear ({selectedIds.length})
              </button>
            </>
          )}
        </div>
      </div>
      {AI_CATEGORY_TREE.map((cat) => {
        const catActive = selectedSet.has(cat.id);
        const catOpen = openCats.has(cat.id);
        const subCount = cat.subcategories.length;
        const tplCount = cat.subcategories.reduce((n, s) => n + s.templates.length, 0);
        return (
          <div key={cat.id}>
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 border-b border-gray-50",
                catActive ? "bg-indigo-50/60" : "hover:bg-gray-50",
              )}
            >
              <button
                type="button"
                onClick={() => toggleCat(cat.id)}
                className="w-4 h-4 flex items-center justify-center text-muted-foreground flex-shrink-0"
                aria-label={catOpen ? "Collapse category" : "Expand category"}
              >
                <ChevronDown
                  className={cn("w-3.5 h-3.5 transition-transform", !catOpen && "-rotate-90")}
                />
              </button>
              <Checkbox checked={catActive} onCheckedChange={() => onToggle(cat.id)} />
              <button
                type="button"
                onClick={() => toggleCat(cat.id)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="text-[12.5px] font-medium truncate">{cat.name}</div>
                <div className="text-[10.5px] text-muted-foreground">
                  {subCount} subcategor{subCount === 1 ? "y" : "ies"} · {tplCount} template
                  {tplCount === 1 ? "" : "s"}
                </div>
              </button>
            </div>

            {catOpen &&
              cat.subcategories.map((sub) => {
                const subActive = selectedSet.has(sub.id);
                const subOpen = openSubs.has(sub.id);
                const effectivelyActive = catActive || subActive;
                return (
                  <div key={sub.id}>
                    <div
                      className={cn(
                        "flex items-center gap-2 pr-3 py-1.5 border-b border-gray-50",
                        subActive ? "bg-indigo-50/60" : catActive ? "bg-indigo-50/25" : "hover:bg-gray-50",
                      )}
                      style={{ paddingLeft: 34 }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSub(sub.id)}
                        className="w-4 h-4 flex items-center justify-center text-muted-foreground flex-shrink-0"
                        aria-label={subOpen ? "Collapse subcategory" : "Expand subcategory"}
                      >
                        <ChevronDown
                          className={cn("w-3.5 h-3.5 transition-transform", !subOpen && "-rotate-90")}
                        />
                      </button>
                      <Checkbox
                        checked={subActive}
                        disabled={catActive}
                        onCheckedChange={() => onToggle(sub.id)}
                      />
                      <button
                        type="button"
                        onClick={() => toggleSub(sub.id)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="text-[12.5px] truncate">{sub.name}</div>
                        <div className="text-[10.5px] text-muted-foreground">
                          {sub.templates.length} template{sub.templates.length === 1 ? "" : "s"}
                        </div>
                      </button>
                    </div>

                    {subOpen &&
                      sub.templates.map((tpl) => {
                        const tplActive = selectedSet.has(tpl.id);
                        const covered = isUnderSelected(cat, sub);
                        return (
                          <label
                            key={tpl.id}
                            className={cn(
                              "flex items-center gap-2 pr-3 py-1.5 cursor-pointer border-b border-gray-50",
                              tplActive
                                ? "bg-indigo-50/60"
                                : covered
                                  ? "bg-indigo-50/25"
                                  : "hover:bg-gray-50",
                            )}
                            style={{ paddingLeft: 60 }}
                          >
                            <Checkbox
                              checked={tplActive}
                              disabled={covered}
                              onCheckedChange={() => onToggle(tpl.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-[12.5px] font-medium truncate">{tpl.name}</div>
                              <div className="text-[10.5px] text-muted-foreground truncate">
                                {tpl.insurer}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                );
              })}
          </div>
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

function LivePreview({ attrs, fallbackText }: { attrs: AiPromptAttrs; fallbackText: string }) {
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; text: string }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const run = async () => {
    setState({ status: "loading" });
    try {
      const text = await generateAiPromptText(attrs, {
        firstName: "Sophie",
        lastName: "Janssens",
        company: "Artex Group",
      });
      setState({ status: "ready", text });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
          Sample preview
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={run}
          disabled={state.status === "loading"}
          className="h-7 px-2 text-[11.5px]"
        >
          {state.status === "loading" ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              {state.status === "ready" ? "Regenerate" : "Run for sample"}
            </>
          )}
        </Button>
      </div>

      <div className="rounded-md border border-border bg-white p-3 text-[12.5px] leading-relaxed text-foreground whitespace-pre-wrap min-h-[80px]">
        {state.status === "ready" ? (
          state.text
        ) : state.status === "error" ? (
          <span className="inline-flex items-start gap-1.5 text-rose-700">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>{state.message}</span>
          </span>
        ) : (
          <span className="text-muted-foreground italic">{fallbackText}</span>
        )}
      </div>
      <div className="text-[10.5px] text-muted-foreground mt-1.5">
        {state.status === "ready"
          ? "Generated with Claude for a sample recipient (Sophie Janssens · Artex Group)."
          : state.status === "error"
            ? "Real generation failed. Check ANTHROPIC_API_KEY or the server logs."
            : "Shown below is a mock preview. Click Run for sample to call the real model."}
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

type ScopeProduct = {
  id: string;
  productTemplateId: string;
  policyNumber: string;
  premium: string;
  entry?: ReturnType<typeof getTemplate>;
};

function mockPreview(
  attrs: AiPromptAttrs,
  products: ScopeProduct[],
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
          `• ${p.entry?.template.name ?? "Product"} (${p.policyNumber}) — premium ${p.premium}. Still correct?`,
      )
      .join("\n");
  }
  if (attrs.instructionType === "summary" && attrs.generationMode === "per-category") {
    const cats = categories.length ? categories : ["Auto", "Home"];
    return cats
      .slice(0, 3)
      .map((c) => {
        const count = products.filter((p) =>
          p.entry ? `${p.entry.category.name} › ${p.entry.subcategory.name}`.includes(c) : false,
        ).length;
        return `• ${c}: ${count} product${count === 1 ? "" : "s"} in place.`;
      })
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
