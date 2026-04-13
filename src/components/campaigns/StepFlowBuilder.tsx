"use client";

import { Plus } from "lucide-react";
import { TargetGroup } from "@/types";

interface StepFlowBuilderProps {
  targetGroup: TargetGroup;
  onPrev: () => void;
  onNext: () => void;
}

const leadMergeTags = [
  "sender.name",
  "sender.signature",
  "lead.firstName",
  "lead.lastName",
  "lead.email",
  "lead.company",
  "lead.owner",
  "lead.attachmentLink",
];

const customerMergeTags = [
  "sender.name",
  "sender.signature",
  "customer.name",
  "customer.firstName",
  "customer.lastName",
  "contact.firstName",
  "contact.lastName",
  "contact.email",
];

export default function StepFlowBuilder({ targetGroup, onPrev, onNext }: StepFlowBuilderProps) {
  const tags = targetGroup === "Leads" ? leadMergeTags : customerMergeTags;

  return (
    <div className="max-w-[680px] mx-auto">
      <div className="bg-gray-50 border-2 border-dashed border-b2 rounded-xl py-[60px] px-10 text-center text-muted">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 opacity-30">
            <Plus className="w-10 h-10" />
          </div>
        </div>
        <div className="text-sm font-medium text-gray-900 mb-1.5">Flow Builder</div>
        <div className="text-[13px] mb-4">
          Design your campaign email here. Add email steps, time delays, and conditions.
        </div>

        {/* Merge tags reference */}
        <div className="text-xs text-brand bg-brand-light rounded-lg inline-block px-3.5 py-2 text-left leading-[1.8]">
          <strong>
            Available merge tags ({targetGroup === "Leads" ? "Lead" : "Customer"} campaign):
          </strong>
          <br />
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {tags.map((tag) => (
              <code
                key={tag}
                className={`font-mono text-[11.5px] px-1.5 py-px rounded ${
                  tag === "lead.attachmentLink"
                    ? "bg-green-50 text-green-600"
                    : "bg-brand-light text-brand"
                }`}
              >
                {`{{${tag}}}`}
              </code>
            ))}
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
          Continue to Settings &rarr;
        </button>
      </div>
    </div>
  );
}
