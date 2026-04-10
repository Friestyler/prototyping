"use client";

import { TargetGroup } from "@/types";

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

  return (
    <div className="max-w-[680px] mx-auto">
      <div className="text-sm font-medium mb-[18px]">Configure campaign settings</div>

      {/* Sender Information */}
      <div className="mb-5">
        <label className="block text-[13px] font-medium mb-2.5">Sender Information</label>
        <div className="mb-3.5">
          <label className="block text-xs font-normal text-muted mb-[7px]">Sender Email</label>
          <input
            type="email"
            defaultValue="kevin@qollabi.com"
            placeholder="kevin@broker.be"
            className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand transition-all"
          />
        </div>
        <div className="mb-3.5">
          <label className="block text-xs font-normal text-muted mb-[7px]">Display Name</label>
          <input
            type="text"
            defaultValue="Kevin Kools"
            placeholder="Kevin Kools"
            className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand transition-all"
          />
        </div>
      </div>

      {/* Reply-To */}
      <div className="mb-5">
        <label className="block text-[13px] font-medium mb-2.5">Reply-To Email</label>
        <input
          type="email"
          defaultValue="kevin@qollabi.com"
          placeholder="reply@broker.be"
          className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand transition-all"
        />
      </div>

      {/* Automation */}
      <div className="mb-5">
        <label className="block text-[13px] font-medium mb-2.5">Automation</label>

        <button
          onClick={() => onAutoSendChange(true)}
          className={`flex items-start gap-[13px] p-[13px] px-4 border rounded-lg mb-3 w-full text-left transition-all ${
            autoSend ? "border-brand bg-gray-50" : "border-border bg-gray-50 opacity-60"
          }`}
        >
          <div
            className={`w-9 h-5 rounded-[10px] relative flex-shrink-0 mt-0.5 transition-colors ${
              autoSend ? "bg-brand" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform ${
                autoSend ? "translate-x-4" : "left-0.5"
              }`}
            />
          </div>
          <div>
            <div className="text-[13px] font-medium">
              Send automatically when a {entityLabel} enters the list
            </div>
            <div className="text-xs text-muted mt-0.5 leading-relaxed">
              Every new {entityLabel} entering the selected smart list is immediately enrolled. Each
              submission triggers a new send.
            </div>
          </div>
        </button>

        <button
          onClick={() => onAutoSendChange(false)}
          className={`flex items-start gap-[13px] p-[13px] px-4 border rounded-lg w-full text-left transition-all ${
            !autoSend ? "border-brand bg-gray-50" : "border-border bg-gray-50 opacity-60"
          }`}
        >
          <div
            className={`w-9 h-5 rounded-[10px] relative flex-shrink-0 mt-0.5 transition-colors ${
              !autoSend ? "bg-brand" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-transform ${
                !autoSend ? "translate-x-4" : "left-0.5"
              }`}
            />
          </div>
          <div>
            <div className="text-[13px] font-medium">Hold for manual review</div>
            <div className="text-xs text-muted mt-0.5 leading-relaxed">
              {targetGroup === "Leads" ? "Leads" : "Customers"} are queued in Draft &amp; Send for
              you to review and send manually.
            </div>
          </div>
        </button>
      </div>

      {/* CC Recipients */}
      <div className="mb-5">
        <label className="block text-[13px] font-medium mb-2.5">
          CC Recipients <span className="font-normal text-muted">(optional)</span>
        </label>
        <select className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand bg-white transition-all">
          <option>No CC</option>
          <option>Same CC for all</option>
          <option>
            Use {targetGroup === "Leads" ? "Lead" : "Customer"} Owner
          </option>
        </select>
        <p className="text-xs text-light mt-1.5 leading-relaxed">
          CC the {entityLabel}&apos;s owner on every email sent.
        </p>
      </div>

      {/* BCC Recipients */}
      <div className="mb-5">
        <label className="block text-[13px] font-medium mb-2.5">
          BCC Recipients <span className="font-normal text-muted">(optional)</span>
        </label>
        <select className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand bg-white transition-all">
          <option>No BCC</option>
          <option>Same BCC for all</option>
          <option>
            Use {targetGroup === "Leads" ? "Lead" : "Customer"} Owner
          </option>
        </select>
      </div>

      {/* Recipient Filters */}
      <div className="mb-5">
        <label className="block text-[13px] font-medium mb-2.5">Recipient Filters</label>
        <div className="flex items-start gap-[13px] p-[13px] px-4 border border-border rounded-lg bg-gray-50 opacity-60">
          <div className="w-9 h-5 rounded-[10px] bg-gray-300 relative flex-shrink-0 mt-0.5">
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
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-1.5 py-[7px] px-3.5 bg-white text-gray-900 border border-b2 rounded-lg font-sans text-[13px] font-medium cursor-pointer hover:bg-gray-50 transition-colors"
        >
          &larr; Previous
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-1.5 py-2 px-[18px] bg-brand text-white border-none rounded-lg font-sans text-[13px] font-medium cursor-pointer hover:bg-brand-hover transition-colors"
        >
          Continue to Draft &amp; Send &rarr;
        </button>
      </div>
    </div>
  );
}
