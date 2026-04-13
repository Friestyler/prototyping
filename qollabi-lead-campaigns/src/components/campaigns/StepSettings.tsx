"use client";

import { TargetGroup } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface StepSettingsProps {
  targetGroup: TargetGroup;
  autoSend: boolean;
  onAutoSendChange: (v: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function StepSettings({
  targetGroup,
  autoSend,
  onAutoSendChange,
  onPrev,
  onNext,
}: StepSettingsProps) {
  const entityLabel = targetGroup === "Leads" ? "lead" : "customer";
  const entityCap = targetGroup === "Leads" ? "Lead" : "Customer";

  return (
    <div className="max-w-[680px] mx-auto">
      <div className="text-sm font-medium mb-[18px]">Configure campaign settings</div>

      {/* Sender Information */}
      <div className="mb-5">
        <Label className="block mb-2.5">Sender Information</Label>
        <div className="grid gap-[7px] mb-3.5">
          <Label htmlFor="sender-email" className="text-xs font-normal text-muted">
            Sender Email
          </Label>
          <Input id="sender-email" type="email" defaultValue="kevin@qollabi.com" />
        </div>
        <div className="grid gap-[7px]">
          <Label htmlFor="sender-name" className="text-xs font-normal text-muted">
            Display Name
          </Label>
          <Input id="sender-name" defaultValue="Kevin Kools" />
        </div>
      </div>

      {/* Reply-To */}
      <div className="mb-5 grid gap-2.5">
        <Label htmlFor="reply-to">Reply-To Email</Label>
        <Input id="reply-to" type="email" defaultValue="kevin@qollabi.com" />
      </div>

      {/* Automation */}
      <div className="mb-5">
        <Label className="block mb-2.5">Automation</Label>

        {[
          {
            on: true,
            title: `Send automatically when a ${entityLabel} enters the list`,
            desc: `Every new ${entityLabel} entering the selected smart list is immediately enrolled. Each submission triggers a new send.`,
          },
          {
            on: false,
            title: "Hold for manual review",
            desc: `${entityCap}s are queued in Draft & Send for you to review and send manually.`,
          },
        ].map(({ on, title, desc }) => {
          const active = autoSend === on;
          return (
            <button
              key={String(on)}
              onClick={() => onAutoSendChange(on)}
              className={cn(
                "flex items-start gap-[13px] p-[13px] px-4 border rounded-lg w-full text-left transition-all mb-3 last:mb-0",
                active ? "border-brand bg-gray-50" : "border-border bg-gray-50 opacity-60"
              )}
            >
              <div
                className={cn(
                  "w-9 h-5 rounded-full relative flex-shrink-0 mt-0.5 transition-colors",
                  active ? "bg-brand" : "bg-gray-300"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform",
                    active ? "translate-x-4" : "left-0.5"
                  )}
                />
              </div>
              <div>
                <div className="text-[13px] font-medium">{title}</div>
                <div className="text-xs text-muted mt-0.5 leading-relaxed">{desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* CC Recipients */}
      <div className="mb-5 grid gap-2.5">
        <Label>
          CC Recipients <span className="font-normal text-muted">(optional)</span>
        </Label>
        <Select defaultValue="none">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No CC</SelectItem>
            <SelectItem value="same">Same CC for all</SelectItem>
            <SelectItem value="owner">Use {entityCap} Owner</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-light mt-0.5 leading-relaxed">
          CC the {entityLabel}&apos;s owner on every email sent.
        </p>
      </div>

      {/* BCC Recipients */}
      <div className="mb-5 grid gap-2.5">
        <Label>
          BCC Recipients <span className="font-normal text-muted">(optional)</span>
        </Label>
        <Select defaultValue="none">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No BCC</SelectItem>
            <SelectItem value="same">Same BCC for all</SelectItem>
            <SelectItem value="owner">Use {entityCap} Owner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recipient Filters */}
      <div className="mb-5">
        <Label className="block mb-2.5">Recipient Filters</Label>
        <div className="flex items-start gap-[13px] p-[13px] px-4 border border-border rounded-lg bg-gray-50 opacity-60">
          <div className="w-9 h-5 rounded-full bg-gray-300 relative flex-shrink-0 mt-0.5">
            <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 left-0.5 shadow-sm" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-light">Exclude previously sent</div>
            <div className="text-xs text-light mt-0.5 leading-relaxed">
              Skip {entityLabel}s who have already received an email from this campaign.
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          ← Previous
        </Button>
        <Button onClick={onNext}>Continue to Draft &amp; Send →</Button>
      </div>
    </div>
  );
}
