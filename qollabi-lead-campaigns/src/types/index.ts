export interface Customer {
  id: string;
  type: string;
  name: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface Lead {
  id: string;
  externalId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  attachmentLink?: string;
  source?: string;
  owner?: string;
}

export interface Campaign {
  id: string;
  name: string;
  icon: "check" | "star" | "text" | "mail";
  iconBg: string;
  iconColor: string;
  targetGroup: TargetGroup;
  description: string;
  status: "Draft" | "Active" | "Stopped";
  recipients: number;
  emailsSent: number;
  sentCount: number;
}

export interface Template {
  id: string;
  name: string;
  icon: "check" | "star" | "text" | "mail";
  iconBg: string;
  iconColor: string;
  targetGroup: TargetGroup;
  description: string;
}

export interface SmartList {
  id: string;
  name: string;
  type: "Static" | "Dynamic";
  count: number;
  entityType: "customer" | "lead";
}

export type FilterOperator =
  | "contains"
  | "does not contain"
  | "is"
  | "is not"
  | "is empty"
  | "is not empty";

export interface Filter {
  attribute: string;
  operator: FilterOperator;
  value: string;
}

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type TargetGroup = "Customers" | "Leads";
