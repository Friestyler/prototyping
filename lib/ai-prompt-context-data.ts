/**
 * Mock reference data the AI prompt configurator binds to.
 * Replace with real API-backed selectors once the asset + product layers ship.
 */

export interface AiProduct {
  id: string;
  name: string;
  category: string;
  policyNumber: string;
  premium: string;
}

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

export const AI_CATEGORIES: string[] = [
  "Auto",
  "Home",
  "Leven en belegging",
  "Rechtsbijstand",
  "BA particulieren",
  "Transport & marine",
  "Reis",
  "Brand bijzondere risico's",
];

export const AI_PRODUCTS: AiProduct[] = [
  { id: "p1", name: "AON Cybersecurity", category: "BA particulieren", policyNumber: "POL-2026-AON-8821", premium: "€ 1,240 / yr" },
  { id: "p2", name: "Ethias Auto Omnium",  category: "Auto", policyNumber: "POL-2025-AUT-3301", premium: "€ 980 / yr" },
  { id: "p3", name: "Ethias Auto Omnium — Partner car", category: "Auto", policyNumber: "POL-2025-AUT-3401", premium: "€ 720 / yr" },
  { id: "p4", name: "AG Home Insurance", category: "Home", policyNumber: "POL-2024-HOM-7712", premium: "€ 540 / yr" },
  { id: "p5", name: "Baloise Group Life", category: "Leven en belegging", policyNumber: "POL-2025-LIF-4410", premium: "€ 2,100 / yr" },
  { id: "p6", name: "KBC Travel Plus", category: "Reis", policyNumber: "POL-2026-TRV-9002", premium: "€ 190 / yr" },
];

export const AI_ASSETS: AiAsset[] = [
  { id: "a1", name: "Policy_AON_Cybersecurity_2026.pdf", kind: "Policy", linkedTo: "Artex Group · AON Cybersecurity" },
  { id: "a2", name: "Contract_Ethias_Auto_Omnium.pdf", kind: "Contract", linkedTo: "Ethias Auto Omnium" },
  { id: "a3", name: "Claim_Janssens_202604.pdf", kind: "Claim report", linkedTo: "Sophie Janssens" },
  { id: "a4", name: "AG_Home_Terms_2024.pdf", kind: "Terms", linkedTo: "AG Home Insurance" },
];

export const AI_RISK_OBJECTS: AiRiskObject[] = [
  { id: "r1", kind: "Vehicle", label: "BMW X3 · 1-ABC-234", attachedProduct: "Ethias Auto Omnium" },
  { id: "r2", kind: "Vehicle", label: "Audi A3 · 1-DEF-567", attachedProduct: "Ethias Auto Omnium — Partner car" },
  { id: "r3", kind: "Building", label: "Rue Royale 42, 1000 Brussels", attachedProduct: "AG Home Insurance" },
  { id: "r4", kind: "Travel", label: "Schengen · annual", attachedProduct: "KBC Travel Plus" },
];
