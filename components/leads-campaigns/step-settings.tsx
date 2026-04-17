"use client";

import { useState } from "react";
import { UserCircle2 } from "lucide-react";
import { TargetGroup } from "@/lib/lc-types";

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

type OptionCardProps = {
  label: string;
  desc?: string;
  selected: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

function OptionCard({ label, desc, selected, disabled, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "w-full text-left rounded-lg border p-3.5 px-4 flex items-start gap-3 transition-all",
        selected
          ? "border-foreground bg-gray-50"
          : "border-border bg-white hover:border-b2",
        disabled && "opacity-50 cursor-not-allowed hover:border-border",
      )}
    >
      <span
        className={cn(
          "mt-0.5 h-4 w-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0",
          selected ? "border-brand" : "border-b2",
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-brand" />}
      </span>
      <span className="flex-1">
        <span className="block text-[13px] font-medium text-foreground">{label}</span>
        {desc && (
          <span className="block text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
            {desc}
          </span>
        )}
      </span>
    </button>
  );
}

function SectionDivider() {
  return <div className="h-px bg-border my-7" />;
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
  const entityPlural = `${entityLabel}s`;

  return (
    <div className="max-w-[720px] mx-auto pb-6">
      {/* Sender Information */}
      <section>
        <h2 className="text-[15px] font-semibold mb-4">Sender Information</h2>

        <div className="grid gap-2 mb-5">
          <Label>Sender Mode</Label>
          <Select defaultValue="static">
            <SelectTrigger className="h-[52px] text-left">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="static">
                <div className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-[13px] font-medium">Static Sender</div>
                    <div className="text-[11.5px] text-muted-foreground">
                      Use the same sender information for all recipients
                    </div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="dynamic">
                <div className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-[13px] font-medium">Dynamic Sender</div>
                    <div className="text-[11.5px] text-muted-foreground">
                      Use the {entityLabel}&apos;s owner as the sender
                    </div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 mb-5">
          <Label>
            Sender Email <span className="text-red-600">*</span>
          </Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Choose a verified email address. You can manage sender emails in Workspace Settings.
          </p>
          <Select defaultValue="kamelia@brandbroker.com">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kamelia@brandbroker.com">kamelia@brandbroker.com</SelectItem>
              <SelectItem value="kevin@brandbroker.com">kevin@brandbroker.com</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 mb-1">
          <Label htmlFor="display-name">
            Display Name <span className="text-red-600">*</span>
          </Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This is how your name will appear to recipients
          </p>
          <Input id="display-name" placeholder="Name T1" defaultValue="Name T1" />
        </div>
      </section>

      <SectionDivider />

      {/* Reply-To */}
      <section>
        <h2 className="text-[15px] font-semibold mb-1">Reply-To Email</h2>
        <p className="text-[12.5px] text-muted-foreground mb-3 leading-relaxed">
          Replies will automatically go to your sender email
        </p>
        <Input
          value="Same as sender email"
          readOnly
          disabled
          className="bg-gray-50 cursor-not-allowed"
        />
      </section>

      <SectionDivider />

      {/* CC Recipients */}
      <section>
        <h2 className="text-[15px] font-semibold mb-1">CC Recipients</h2>
        <p className="text-[12.5px] text-muted-foreground mb-3 leading-relaxed">
          Add CC recipients to your campaign emails.
        </p>
        <CcBccRadioGroup
          defaultValue="none"
          ownerLabel={`Use ${entityCap} Owner column`}
          ownerDesc={`CC the owner of each ${entityLabel} dynamically based on the Owner field`}
          noneLabel="No CC"
          sameLabel={`Same CC for all ${entityPlural === "leads" ? "recipients" : "recipients"}`}
        />
      </section>

      <SectionDivider />

      {/* BCC Recipients */}
      <section>
        <h2 className="text-[15px] font-semibold mb-1">BCC Recipients</h2>
        <p className="text-[12.5px] text-muted-foreground mb-3 leading-relaxed">
          Add BCC recipients to your campaign emails.
        </p>
        <CcBccRadioGroup
          defaultValue="none"
          ownerLabel={`Use ${entityCap} Owner column`}
          ownerDesc={`BCC the owner of each ${entityLabel} dynamically based on the Owner field`}
          noneLabel="No BCC"
          sameLabel="Same BCC for all recipients"
        />
      </section>

      <SectionDivider />

      {/* Automation Settings */}
      <section>
        <h2 className="text-[15px] font-semibold mb-1">Automation Settings</h2>
        <p className="text-[12.5px] text-muted-foreground mb-3 leading-relaxed">
          When new people are added to your dynamic list, decide if they should receive this
          campaign automatically or wait for your approval.
        </p>
        <div className="grid gap-2.5">
          <OptionCard
            label="Send automatically"
            desc={`New ${entityPlural} receive the campaign immediately when added to the list`}
            selected={autoSend}
            disabled
          />
          <OptionCard
            label="Hold for manual review"
            desc={`New ${entityPlural} are added to a draft. You review and approve before sending`}
            selected={!autoSend}
            onClick={() => onAutoSendChange(false)}
          />
        </div>
      </section>

      <SectionDivider />

      {/* Recipient Filters */}
      <section>
        <h2 className="text-[15px] font-semibold mb-3">Recipient Filters</h2>
        <div className="flex items-start gap-3 border border-border rounded-lg p-3.5 px-4">
          <div className="flex-1">
            <div className="text-[13px] font-medium text-foreground">
              Exclude previously sent
            </div>
            <div className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
              Prevent duplicate sends to {entityPlural} who already received this campaign
            </div>
          </div>
          <div className="w-9 h-5 rounded-full bg-gray-300 relative flex-shrink-0 mt-0.5">
            <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 left-0.5 shadow-sm" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-between mt-8 pt-5">
        <Button variant="outline" onClick={onPrev}>
          ← Back
        </Button>
        <Button onClick={onNext}>Continue to Draft &amp; Send →</Button>
      </div>
    </div>
  );
}

interface CcBccRadioGroupProps {
  defaultValue: "none" | "same" | "owner";
  ownerLabel: string;
  ownerDesc: string;
  noneLabel: string;
  sameLabel: string;
}

function CcBccRadioGroup({
  defaultValue,
  ownerLabel,
  ownerDesc,
  noneLabel,
  sameLabel,
}: CcBccRadioGroupProps) {
  const [value, setValue] = useState<"none" | "same" | "owner">(defaultValue);
  return (
    <div className="grid gap-2.5">
      <OptionCard
        label={noneLabel}
        selected={value === "none"}
        onClick={() => setValue("none")}
      />
      <OptionCard
        label={sameLabel}
        selected={value === "same"}
        onClick={() => setValue("same")}
      />
      <OptionCard
        label={ownerLabel}
        desc={ownerDesc}
        selected={value === "owner"}
        onClick={() => setValue("owner")}
      />
    </div>
  );
}
