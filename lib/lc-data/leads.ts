import { Lead, SmartList } from "@/lib/lc-types";

export const leads: Lead[] = [
  {
    id: "L-001",
    firstName: "Sophie",
    lastName: "Janssens",
    email: "s.janssens@qollabi.com",
    company: "Artex Group",
    attachmentLink: "https://example.com/offer_janssens.pdf",
    source: "aoncybersecurity",
    owner: "Kevin Kools",
  },
  {
    id: "L-002",
    firstName: "Marc",
    lastName: "De Backer",
    email: "marc.debacker@qollabi.com",
    company: "FinGroup NV",
    attachmentLink: "https://example.com/offer_debacker.pdf",
    source: "aoncybersecurity",
    owner: "Raciel Rodriguez",
  },
  {
    id: "L-003",
    firstName: "Lena",
    lastName: "Vermeersch",
    email: "l.vermeersch@qollabi.com",
    company: "BrokerVision BVBA",
    attachmentLink: "https://example.com/offer_vermeersch.pdf",
    source: "aoncybersecurity",
    owner: "Kevin Kools",
  },
  {
    id: "L-004",
    firstName: "Thomas",
    lastName: "Willems",
    email: "t.willems@qollabi.com",
    company: "Novaco NV",
    attachmentLink: "",
    source: "viviumforms",
    owner: "Kevin Kools",
  },
  {
    id: "L-005",
    firstName: "Elena",
    lastName: "Mertens",
    email: "",
    company: "ClearPath BVBA",
    attachmentLink: "https://example.com/offer_mertens.pdf",
    source: "viviumforms",
    owner: "",
  },
];

export const leadSmartLists: SmartList[] = [
  { id: "ls-1", name: "AON Cybersecurity Leads", type: "Dynamic", count: 3, entityType: "lead" },
  { id: "ls-2", name: "Vivium Form Leads", type: "Dynamic", count: 2, entityType: "lead" },
  { id: "ls-3", name: "All Leads", type: "Static", count: 5, entityType: "lead" },
];
