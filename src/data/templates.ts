import { Template } from "@/types";

export const templates: Template[] = [
  {
    id: "T-001",
    name: "AON Cybersecurity Offer Follow-up",
    icon: "star",
    iconBg: "#EEF2FF",
    iconColor: "#5B5BD6",
    targetGroup: "Leads",
    description: "Send the personalised cybersecurity offer PDF to leads.",
  },
  {
    id: "T-002",
    name: "Vivium Welcome Flow",
    icon: "mail",
    iconBg: "#ECFDF5",
    iconColor: "#059669",
    targetGroup: "Leads",
    description: "Welcome new Vivium form leads with two onboarding emails.",
  },
  {
    id: "T-003",
    name: "Annual Renewal Reminder",
    icon: "check",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    targetGroup: "Customers",
    description: "Standard renewal reminder sent to existing customers.",
  },
  {
    id: "T-004",
    name: "Customer NPS Pulse",
    icon: "text",
    iconBg: "#F3F4F6",
    iconColor: "#374151",
    targetGroup: "Customers",
    description: "Quarterly NPS survey for the customer portfolio.",
  },
];
