"use client";

import { useState } from "react";
import { Upload, Lock, AlertTriangle } from "lucide-react";
import { TargetGroup } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface StepDetailsProps {
  targetGroup: TargetGroup;
  onTargetGroupChange: (tg: TargetGroup) => void;
  onNext: () => void;
  sentCount?: number;
}

const icons = [
  { emoji: "\u2764\uFE0F", bg: "#EC4899" },
  { emoji: "\uD83D\uDCC4", bg: "#8B5CF6" },
  { emoji: "\u2726", bg: "#F59E0B" },
  { emoji: "\uD83D\uDD17", bg: "#6366F1" },
  { emoji: "\uD83D\uDCC5", bg: "#10B981" },
  { emoji: "\uD83D\uDEE1\uFE0F", bg: "#3B82F6" },
  { emoji: "\u2B50", bg: "#F59E0B" },
  { emoji: "\u2709\uFE0F", bg: "#6B7280" },
];

export default function StepDetails({
  targetGroup,
  onTargetGroupChange,
  onNext,
  sentCount = 0,
}: StepDetailsProps) {
  const [selectedIcon, setSelectedIcon] = useState(7);
  const [pendingChange, setPendingChange] = useState<TargetGroup | null>(null);

  const locked = sentCount > 0;

  const tryChange = (tg: TargetGroup) => {
    if (locked || tg === targetGroup) return;
    setPendingChange(tg);
  };

  const confirmChange = () => {
    if (pendingChange) onTargetGroupChange(pendingChange);
    setPendingChange(null);
  };

  return (
    <div className="max-w-[680px] mx-auto">
      <p className="text-[13.5px] text-muted text-center mb-6">
        Configure your campaign name and details
      </p>

      {/* Campaign Name */}
      <div className="mb-5 grid gap-[7px]">
        <Label htmlFor="campaign-name">
          Campaign Name <span className="text-red-600">*</span>
        </Label>
        <Input
          id="campaign-name"
          placeholder="Campaign Name"
          defaultValue="AON Cybersecurity Follow-up"
        />
      </div>

      {/* Target Group */}
      <div className="mb-5">
        <Label className="block mb-[7px]">
          Target Group <span className="text-red-600">*</span>
        </Label>
        <p className="text-xs text-light mb-2.5 leading-relaxed">
          Determines who can receive this campaign. Cannot be changed after the first email is sent.
        </p>
        {locked && (
          <div className="flex items-center gap-2 mb-2.5 px-3 py-2 rounded-lg bg-gray-50 border border-b2 text-[12.5px] text-muted">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            The target group cannot be changed after emails have been sent.
          </div>
        )}
        <div
          className="grid grid-cols-2 gap-3"
          title={
            locked
              ? "The target group cannot be changed after emails have been sent."
              : undefined
          }
        >
          {[
            {
              key: "Customers" as TargetGroup,
              badge: <Badge variant="secondary">Default</Badge>,
              desc: "Send to your customer portfolio using customer smart lists and contact records.",
            },
            {
              key: "Leads" as TargetGroup,
              badge: <Badge variant="default">New</Badge>,
              desc: "Send to leads from form submissions. Uses lead smart lists with company, email and attachment link.",
            },
          ].map(({ key, badge, desc }) => (
            <button
              key={key}
              onClick={() => tryChange(key)}
              disabled={locked}
              className={cn(
                "border-[1.5px] rounded-lg p-3.5 text-left transition-all",
                targetGroup === key
                  ? "border-brand bg-brand-50"
                  : "border-b2 hover:border-indigo-300",
                locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0",
                    targetGroup === key ? "border-brand bg-brand" : "border-b2"
                  )}
                >
                  {targetGroup === key && (
                    <div className="w-[5px] h-[5px] rounded-full bg-white" />
                  )}
                </div>
                <span className="text-[13px] font-medium">{key}</span>
                {badge}
              </div>
              <p className="text-xs text-muted pl-6 leading-relaxed">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="mb-5 grid gap-[7px]">
        <Label htmlFor="campaign-description">Description</Label>
        <Textarea
          id="campaign-description"
          placeholder="Brief description of this campaign's purpose..."
          defaultValue="AON form leads — April 2026"
        />
      </div>

      {/* Objective */}
      <div className="mb-5 grid gap-[7px]">
        <Label htmlFor="campaign-objective">Objective</Label>
        <Textarea
          id="campaign-objective"
          placeholder="What outcome should this campaign achieve?"
        />
      </div>

      {/* Icon selector */}
      <div className="mb-5">
        <Label className="block mb-[7px]">Choose Icon</Label>
        <div className="flex gap-2.5 flex-wrap">
          {icons.map((icon, i) => (
            <button
              key={i}
              onClick={() => setSelectedIcon(i)}
              className={cn(
                "w-[42px] h-[42px] rounded-lg flex items-center justify-center text-lg border-2 transition-all hover:scale-110",
                selectedIcon === i
                  ? "outline outline-[2.5px] outline-gray-900 outline-offset-1 border-transparent"
                  : "border-transparent"
              )}
              style={{ backgroundColor: icon.bg }}
            >
              {icon.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Upload */}
      <div className="mb-5">
        <Label className="block mb-[7px]">Or Upload Image</Label>
        <div className="border border-b2 rounded-lg p-3.5 flex items-center gap-3.5">
          <div className="w-[52px] h-[52px] border border-b2 rounded-lg flex items-center justify-center text-light flex-shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <Button variant="outline" size="sm" className="mb-1">
              <Upload className="h-3 w-3" />
              Upload Image
            </Button>
            <p className="text-xs text-light mt-1 leading-relaxed">
              Supported formats: JPG, PNG, SVG, WebP. Max file size: 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end mt-1">
        <Button onClick={onNext}>Continue to Select Recipients →</Button>
      </div>

      {/* Destructive confirmation dialog */}
      <Dialog
        open={pendingChange !== null}
        onOpenChange={(o) => !o && setPendingChange(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change target group?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-[13px] leading-relaxed text-foreground">
              Changing the target group will{" "}
              <strong>remove all selected recipients</strong> and{" "}
              <strong>delete all merge tags used in your email</strong>.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingChange(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmChange}>
              Change to {pendingChange}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
