/**
 * Helpers + sample data layered on top of the auto-generated category tree.
 *
 * Shape (from qollabi-schema.sql):
 *   category  (domein)  ->  subcategory (polistype)  ->  product_template
 * Each sample customer `product` points at one `productTemplateId`
 * (external id = policy number).
 */

import {
  AI_CATEGORY_TREE,
  type AiCategory,
  type AiSubcategory,
  type AiTemplate,
} from "@/lib/ai-prompt-context-data";

export { AI_CATEGORY_TREE };
export type { AiCategory, AiSubcategory, AiTemplate };

// ────────────────────────────────────────────────────────────────────────────
// Tree lookups
// ────────────────────────────────────────────────────────────────────────────

interface TemplateWithAncestors {
  template: AiTemplate;
  subcategory: AiSubcategory;
  category: AiCategory;
}

const TEMPLATE_INDEX: Map<string, TemplateWithAncestors> = (() => {
  const m = new Map<string, TemplateWithAncestors>();
  for (const cat of AI_CATEGORY_TREE) {
    for (const sub of cat.subcategories) {
      for (const tpl of sub.templates) {
        m.set(tpl.id, { template: tpl, subcategory: sub, category: cat });
      }
    }
  }
  return m;
})();

const SUB_INDEX: Map<string, { subcategory: AiSubcategory; category: AiCategory }> = (() => {
  const m = new Map<string, { subcategory: AiSubcategory; category: AiCategory }>();
  for (const cat of AI_CATEGORY_TREE) {
    for (const sub of cat.subcategories) m.set(sub.id, { subcategory: sub, category: cat });
  }
  return m;
})();

const CAT_INDEX: Map<string, AiCategory> = new Map(AI_CATEGORY_TREE.map((c) => [c.id, c]));

export const AI_PRODUCT_TEMPLATES: AiTemplate[] = Array.from(TEMPLATE_INDEX.values()).map((t) => t.template);

export function getTemplate(id: string) {
  return TEMPLATE_INDEX.get(id);
}

export function getSubcategory(id: string) {
  return SUB_INDEX.get(id);
}

export function getCategory(id: string) {
  return CAT_INDEX.get(id);
}

export function templatePath(id: string): string {
  const entry = TEMPLATE_INDEX.get(id);
  if (!entry) return "";
  return `${entry.category.name} › ${entry.subcategory.name} › ${entry.template.insurer}`;
}

/**
 * Expand a set of selected node ids (cat-* | sub-* | tpl-*) into the
 * concrete set of template ids the scope resolves to.
 */
export function expandSelectionToTemplateIds(selectedIds: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const id of selectedIds) {
    if (id.startsWith("tpl-")) {
      if (TEMPLATE_INDEX.has(id)) out.add(id);
    } else if (id.startsWith("sub-")) {
      const entry = SUB_INDEX.get(id);
      if (entry) for (const tpl of entry.subcategory.templates) out.add(tpl.id);
    } else if (id.startsWith("cat-")) {
      const cat = CAT_INDEX.get(id);
      if (cat) {
        for (const sub of cat.subcategories) {
          for (const tpl of sub.templates) out.add(tpl.id);
        }
      }
    }
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
// Sample customer portfolio — stands in for a real per-recipient product set.
// Each product references a real template id from the tree above.
// ────────────────────────────────────────────────────────────────────────────

export interface AiSampleProduct {
  id: string;
  productTemplateId: string;
  policyNumber: string;
  premium: string;
  contractEndDate?: string;
}

export const AI_SAMPLE_CUSTOMER_PRODUCTS: AiSampleProduct[] = [
  { id: "p-auto-1",  productTemplateId: "tpl-auto-toerisme-en-zaken-gemengd-gebruik-axa",               policyNumber: "624611603",    premium: "€ 980 / yr",  contractEndDate: "2026-07-14" },
  { id: "p-auto-2",  productTemplateId: "tpl-auto-toerisme-en-zaken-gemengd-gebruik-baloise-insurance", policyNumber: "5T80770",      premium: "€ 720 / yr",  contractEndDate: "2026-03-09" },
  { id: "p-auto-3",  productTemplateId: "tpl-auto-lichte-vrachtwagens-axa",                             policyNumber: "622610550",    premium: "€ 1,100 / yr", contractEndDate: "2026-10-11" },
  { id: "p-fire-1",  productTemplateId: "tpl-brand-eenvoudige-risico-s-brand-er-woonhuizen-ag-insurance", policyNumber: "46171659",   premium: "€ 420 / yr",  contractEndDate: "2027-02-01" },
  { id: "p-ba-1",    productTemplateId: "tpl-ba-particulieren-ba-priv-leven-ag-insurance",              policyNumber: "64525575",     premium: "€ 140 / yr",  contractEndDate: "2026-09-30" },
  { id: "p-rb-1",    productTemplateId: "tpl-rechtsbijstand-algemene-rechtsbijstand-multi-objecttype-das", policyNumber: "1030349",    premium: "€ 180 / yr",  contractEndDate: "2026-06-20" },
  { id: "p-life-1",  productTemplateId: "tpl-leven-en-belegging-individueel-leven-klassiek-tak-21-ag-insurance", policyNumber: "11307176", premium: "€ 2,100 / yr", contractEndDate: "2030-12-31" },
  { id: "p-ind-1",   productTemplateId: "tpl-individueel-hospitalisatie-dkv-belgium",                   policyNumber: "220809031",    premium: "€ 640 / yr",  contractEndDate: "2026-12-31" },
];

// ────────────────────────────────────────────────────────────────────────────
// Assets + risk objects — unchanged from before, just co-located here.
// ────────────────────────────────────────────────────────────────────────────

export interface AiAsset {
  id: string;
  name: string;
  kind: string;
  linkedTo: string;
}

export interface AiRiskObject {
  id: string;
  kind: "Vehicle" | "Building" | "Travel";
  label: string;
  attachedProduct: string;
}

export const AI_ASSETS: AiAsset[] = [
  { id: "a1", name: "Policy_AON_Cybersecurity_2026.pdf", kind: "Policy", linkedTo: "Artex Group · AON Cybersecurity" },
  { id: "a2", name: "Contract_Ethias_Auto_Omnium.pdf", kind: "Contract", linkedTo: "Ethias Auto Omnium" },
  { id: "a3", name: "Claim_Janssens_202604.pdf", kind: "Claim report", linkedTo: "Sophie Janssens" },
  { id: "a4", name: "AG_Home_Terms_2024.pdf", kind: "Terms", linkedTo: "AG Home Insurance" },
];

export const AI_RISK_OBJECTS: AiRiskObject[] = [
  { id: "r1", kind: "Vehicle", label: "BMW X3 · 1-ABC-234", attachedProduct: "Auto Toerisme en Zaken, gemengd gebruik AXA" },
  { id: "r2", kind: "Vehicle", label: "Audi A3 · 1-DEF-567", attachedProduct: "Auto Toerisme en Zaken, gemengd gebruik BALOISE INSURANCE" },
  { id: "r3", kind: "Building", label: "Rue Royale 42, 1000 Brussels", attachedProduct: "Brand eenvoudige risico's Brand ER - woonhuizen AG INSURANCE" },
  { id: "r4", kind: "Travel", label: "Schengen · annual", attachedProduct: "Reis Reisverzekeringen ASSUDIS" },
];
