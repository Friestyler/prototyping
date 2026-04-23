import type { JSONContent } from "@tiptap/core";

export type WaitType =
  | "specific-time"
  | "after-opened"
  | "if-not-opened"
  | "after-link-clicked"
  | "if-no-link-clicked"
  | "after-reply"
  | "if-no-reply";

export type WaitUnit = "minutes" | "hours" | "days";

export interface WaitConfig {
  type: WaitType;
  amount: number;
  unit: WaitUnit;
}

export interface EmailStep {
  id: string;
  kind: "email";
  subject: string;
  previewText: string;
  body: JSONContent | null;
  waitBefore?: WaitConfig;
}

export interface TaskStep {
  id: string;
  kind: "task";
  name: string;
  description: string;
  type: "email" | "call";
  responsible: "customer-owner" | "other";
  responsibleUser?: string;
  dueDays: number;
  waitBefore?: WaitConfig;
}

export type FlowStep = EmailStep | TaskStep;

const newId = () => Math.random().toString(36).slice(2, 9);

export const newEmailStep = (): EmailStep => ({
  id: newId(),
  kind: "email",
  subject: "",
  previewText: "",
  body: null,
});

export const newTaskStep = (): TaskStep => ({
  id: newId(),
  kind: "task",
  name: "",
  description: "",
  type: "email",
  responsible: "customer-owner",
  dueDays: 3,
});

export const defaultWait = (): WaitConfig => ({
  type: "specific-time",
  amount: 3,
  unit: "days",
});

export const WAIT_TYPE_LABELS: Record<WaitType, string> = {
  "specific-time": "Wait a specific time",
  "after-opened": "After previous email opened",
  "if-not-opened": "If previous email not opened",
  "after-link-clicked": "After any link clicked",
  "if-no-link-clicked": "If no link clicked",
  "after-reply": "After reply received",
  "if-no-reply": "If no reply received",
};
