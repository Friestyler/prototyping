"use client";

import { useState } from "react";
import { Upload, Lock, AlertTriangle } from "lucide-react";
import { TargetGroup } from "@/types";
import Modal from "@/components/ui/Modal";

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
      <div className="mb-5">
        <label className="block text-[13px] font-medium mb-[7px]">
          Campaign Name <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          placeholder="Campaign Name"
          defaultValue="AON Cybersecurity Follow-up"
          className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(91,91,214,0.08)] transition-all"
        />
      </div>

      {/* Target Group */}
      <div className="mb-5">
        <label className="block text-[13px] font-medium mb-[7px]">
          Target Group <span className="text-red-600">*</span>
        </label>
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
          {/* Customers option */}
          <button
            onClick={() => tryChange("Customers")}
            disabled={locked}
            className={`border-[1.5px] rounded-[10px] p-3.5 text-left transition-all ${
              targetGroup === "Customers"
                ? "border-brand bg-brand-50"
                : "border-b2 hover:border-indigo-300"
            } ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 ${
                  targetGroup === "Customers"
                    ? "border-brand bg-brand"
                    : "border-b2"
                }`}
              >
                {targetGroup === "Customers" && (
                  <div className="w-[5px] h-[5px] rounded-full bg-white" />
                )}
              </div>
              <span className="text-[13px] font-medium">Customers</span>
              <span className="text-[10px] font-semibold px-[7px] py-0.5 rounded-[10px] bg-gray-100 text-muted ml-1">
                Default
              </span>
            </div>
            <p className="text-xs text-muted pl-6 leading-relaxed">
              Send to your customer portfolio using customer smart lists and contact records.
            </p>
          </button>

          {/* Leads option */}
          <button
            onClick={() => tryChange("Leads")}
            disabled={locked}
            className={`border-[1.5px] rounded-[10px] p-3.5 text-left transition-all ${
              targetGroup === "Leads"
                ? "border-brand bg-brand-50"
                : "border-b2 hover:border-indigo-300"
            } ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 ${
                  targetGroup === "Leads"
                    ? "border-brand bg-brand"
                    : "border-b2"
                }`}
              >
                {targetGroup === "Leads" && (
                  <div className="w-[5px] h-[5px] rounded-full bg-white" />
                )}
              </div>
              <span className="text-[13px] font-medium">Leads</span>
              <span className="text-[10px] font-semibold px-[7px] py-0.5 rounded-[10px] bg-brand-light text-brand ml-1">
                New
              </span>
            </div>
            <p className="text-xs text-muted pl-6 leading-relaxed">
              Send to leads from form submissions. Uses lead smart lists with company, email and attachment link.
            </p>
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mb-5">
        <label className="block text-[13px] font-medium mb-[7px]">Description</label>
        <textarea
          placeholder="Brief description of this campaign's purpose..."
          defaultValue="AON form leads — April 2026"
          className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(91,91,214,0.08)] resize-y min-h-[88px] leading-relaxed transition-all"
        />
      </div>

      {/* Objective */}
      <div className="mb-5">
        <label className="block text-[13px] font-medium mb-[7px]">Objective</label>
        <textarea
          placeholder="What outcome should this campaign achieve?"
          className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(91,91,214,0.08)] resize-y min-h-[88px] leading-relaxed transition-all"
        />
      </div>

      {/* Icon selector */}
      <div className="mb-5">
        <label className="block text-[13px] font-medium mb-[7px]">Choose Icon</label>
        <div className="flex gap-2.5 flex-wrap">
          {icons.map((icon, i) => (
            <button
              key={i}
              onClick={() => setSelectedIcon(i)}
              className={`w-[42px] h-[42px] rounded-[10px] cursor-pointer flex items-center justify-center text-lg border-2 transition-all hover:scale-110 ${
                selectedIcon === i
                  ? "outline outline-[2.5px] outline-gray-900 outline-offset-1"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: icon.bg }}
            >
              {icon.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Upload */}
      <div className="mb-5">
        <label className="block text-[13px] font-medium mb-[7px]">Or Upload Image</label>
        <div className="border border-b2 rounded-lg p-3.5 flex items-center gap-3.5">
          <div className="w-[52px] h-[52px] border border-b2 rounded-lg flex items-center justify-center text-light flex-shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <button className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-white text-gray-900 border border-b2 rounded-lg font-sans text-[12.5px] font-medium cursor-pointer hover:bg-gray-50 mb-1">
              <Upload className="w-3 h-3" />
              Upload Image
            </button>
            <p className="text-xs text-light mt-1 leading-relaxed">
              Supported formats: JPG, PNG, SVG, WebP. Max file size: 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end mt-1">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-1.5 py-2 px-[18px] bg-brand text-white border-none rounded-lg font-sans text-[13px] font-medium cursor-pointer hover:bg-brand-hover transition-colors"
        >
          Continue to Select Recipients &rarr;
        </button>
      </div>

      {/* Destructive confirmation modal */}
      <Modal
        open={pendingChange !== null}
        onClose={() => setPendingChange(null)}
        title="Change target group?"
        footer={
          <>
            <button
              onClick={() => setPendingChange(null)}
              className="inline-flex items-center gap-1.5 py-[7px] px-3.5 bg-white text-gray-900 border border-b2 rounded-lg font-sans text-[13px] font-medium cursor-pointer hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmChange}
              className="inline-flex items-center gap-1.5 py-2 px-[18px] bg-red-600 text-white border-none rounded-lg font-sans text-[13px] font-medium cursor-pointer hover:bg-red-700"
            >
              Change to {pendingChange}
            </button>
          </>
        }
      >
        <div className="flex gap-3 items-start">
          <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-[13px] leading-relaxed text-gray-900">
            Changing the target group will <strong>remove all selected recipients</strong> and{" "}
            <strong>delete all merge tags used in your email</strong>. This cannot be undone.
          </div>
        </div>
      </Modal>
    </div>
  );
}
