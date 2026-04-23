"use client";

import {
  ArrowDown,
  Clock,
  Eye,
  Mail,
  MousePointerClick,
  Phone,
  Plus,
  Trash2,
  CheckSquare,
} from "lucide-react";
import { TargetGroup } from "@/lib/lc-types";
import type {
  EmailStep,
  FlowStep,
  TaskStep,
  WaitConfig,
  WaitType,
  WaitUnit,
} from "@/lib/flow-types";
import { defaultWait, newEmailStep, newTaskStep } from "@/lib/flow-types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmailEditor } from "@/components/maily-editor/email-editor";

import { WAIT_TYPE_LABELS } from "@/lib/flow-types";

const waitTypeLabels = WAIT_TYPE_LABELS;

const otherUsers = ["Alice Nguyen", "Ben Carter", "Chloé Martin", "Diego Alvarez"];

interface StepFlowBuilderProps {
  targetGroup: TargetGroup;
  steps: FlowStep[];
  onStepsChange: (next: FlowStep[]) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function StepFlowBuilder({
  targetGroup,
  steps,
  onStepsChange,
  onPrev,
  onNext,
}: StepFlowBuilderProps) {
  const setSteps = (
    next: FlowStep[] | ((prev: FlowStep[]) => FlowStep[]),
  ) => {
    onStepsChange(typeof next === "function" ? next(steps) : next);
  };

  const updateStep = (id: string, patch: Partial<FlowStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? ({ ...s, ...patch } as FlowStep) : s)));
  };

  const updateWait = (id: string, patch: Partial<WaitConfig>) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, waitBefore: { ...(s.waitBefore ?? defaultWait()), ...patch } } : s,
      ),
    );
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const addStep = (kind: "email" | "task") => {
    const base = kind === "email" ? newEmailStep() : newTaskStep();
    base.waitBefore = defaultWait();
    setSteps((prev) => [...prev, base]);
  };

  const emailStepNumbers = new Map<string, number>();
  {
    let n = 0;
    for (const s of steps) if (s.kind === "email") emailStepNumbers.set(s.id, ++n);
  }
  const taskStepNumbers = new Map<string, number>();
  {
    let n = 0;
    for (const s of steps) if (s.kind === "task") taskStepNumbers.set(s.id, ++n);
  }

  return (
    <div className="max-w-[680px] mx-auto">
      <div className="flex flex-col items-center">
        {steps.map((step, index) => (
          <div key={step.id} className="w-full flex flex-col items-center">
            {index > 0 && (
              <>
                <ArrowDown className="w-4 h-4 text-muted-foreground my-2" />
                <WaitConnector
                  value={step.waitBefore ?? defaultWait()}
                  onChange={(patch) => updateWait(step.id, patch)}
                />
                <ArrowDown className="w-4 h-4 text-muted-foreground my-2" />
              </>
            )}

            {step.kind === "email" ? (
              <EmailStepCard
                step={step}
                stepNumber={emailStepNumbers.get(step.id) ?? 1}
                canDelete={index > 0}
                onChange={(patch) => updateStep(step.id, patch)}
                onDelete={() => removeStep(step.id)}
              />
            ) : (
              <TaskStepCard
                step={step}
                stepNumber={taskStepNumbers.get(step.id) ?? 1}
                onChange={(patch) => updateStep(step.id, patch)}
                onDelete={() => removeStep(step.id)}
              />
            )}
          </div>
        ))}

        <ArrowDown className="w-4 h-4 text-muted-foreground my-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-3.5 h-3.5" />
              Add step to sequence
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem onClick={() => addStep("email")}>
              <Mail className="w-3.5 h-3.5" />
              Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addStep("task")}>
              <CheckSquare className="w-3.5 h-3.5" />
              Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          ← Previous
        </Button>
        <Button onClick={onNext}>Continue to Settings →</Button>
      </div>
    </div>
  );
}

function WaitConnector({
  value,
  onChange,
}: {
  value: WaitConfig;
  onChange: (patch: Partial<WaitConfig>) => void;
}) {
  const showDuration = value.type === "specific-time";
  const showThenWait =
    value.type !== "specific-time" && value.type !== "after-opened" && value.type !== "if-not-opened";
  // Click-based and reply-based conditions support a follow-up delay ("then wait N days").
  // Open-based conditions are instantaneous triggers.

  const Icon =
    value.type === "specific-time"
      ? Clock
      : value.type.includes("link")
        ? MousePointerClick
        : value.type.includes("reply")
          ? Mail
          : Eye;

  return (
    <Card className="border-dashed bg-gray-50/50 shadow-none w-[360px]">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground shrink-0">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          <Select value={value.type} onValueChange={(v) => onChange({ type: v as WaitType })}>
            <SelectTrigger className="h-8 text-[13px] flex-1 min-w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(waitTypeLabels) as WaitType[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {waitTypeLabels[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(showDuration || showThenWait) && (
            <div className="flex items-center gap-2 w-full">
              {showThenWait && (
                <span className="text-[12px] text-muted-foreground">then wait</span>
              )}
              <Input
                type="number"
                min={1}
                value={value.amount}
                onChange={(e) => onChange({ amount: Math.max(1, Number(e.target.value) || 1) })}
                className="h-8 w-16 text-[13px]"
              />
              <Select value={value.unit} onValueChange={(v) => onChange({ unit: v as WaitUnit })}>
                <SelectTrigger className="h-8 text-[13px] flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmailStepCard({
  step,
  stepNumber,
  canDelete,
  onChange,
  onDelete,
}: {
  step: EmailStep;
  stepNumber: number;
  canDelete: boolean;
  onChange: (patch: Partial<EmailStep>) => void;
  onDelete: () => void;
}) {
  return (
    <Card className="w-full shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-[13px]">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Step {stepNumber}</span>
            <span className="text-muted-foreground">Email</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="w-3.5 h-3.5" />
              Preview Email
            </Button>
            {canDelete && (
              <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete step">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Subject Line" required>
            <Input
              value={step.subject}
              onChange={(e) => onChange({ subject: e.target.value })}
              placeholder="Enter email subject line"
            />
          </Field>
          <Field label="Preview Text">
            <Input
              value={step.previewText}
              onChange={(e) => onChange({ previewText: e.target.value })}
              placeholder="Enter preview text (appears in inbox)"
            />
          </Field>
          <Field label="Body">
            <EmailEditor
              value={step.body ?? undefined}
              onChange={(json) => onChange({ body: json })}
              placeholder="Write something or / to see commands"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Type <code className="px-1 py-px rounded bg-muted">/</code> for commands. Pick <strong>AI content</strong> to add a block that generates copy per recipient at send time.
            </p>
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskStepCard({
  step,
  stepNumber,
  onChange,
  onDelete,
}: {
  step: TaskStep;
  stepNumber: number;
  onChange: (patch: Partial<TaskStep>) => void;
  onDelete: () => void;
}) {
  return (
    <Card className="w-full shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-[13px]">
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Task {stepNumber}</span>
            <span className="text-muted-foreground">
              {step.type === "call" ? "Call" : "Email"}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete step">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="space-y-4">
          <Field label="Task Name" required>
            <Input
              value={step.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g. Follow up with customer"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <Select
                value={step.type}
                onValueChange={(v) => onChange({ type: v as TaskStep["type"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <span className="inline-flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </span>
                  </SelectItem>
                  <SelectItem value="call">
                    <span className="inline-flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Due">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={step.dueDays}
                  onChange={(e) =>
                    onChange({ dueDays: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="w-20"
                />
                <span className="text-[13px] text-muted-foreground">days after creation</span>
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Responsible">
              <Select
                value={step.responsible}
                onValueChange={(v) =>
                  onChange({
                    responsible: v as TaskStep["responsible"],
                    responsibleUser: v === "customer-owner" ? undefined : step.responsibleUser,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer-owner">Customer owner</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {step.responsible === "other" && (
              <Field label="User">
                <Select
                  value={step.responsibleUser ?? ""}
                  onValueChange={(v) => onChange({ responsibleUser: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherUsers.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>

          <Field label="Description">
            <Textarea
              value={step.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="What should be done in this task?"
              className="min-h-[100px]"
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
