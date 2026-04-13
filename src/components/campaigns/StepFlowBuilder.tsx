"use client";

import { Plus } from "lucide-react";
import { TargetGroup } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
      <Card className="border-dashed border-2 bg-gray-50 shadow-none">
        <CardContent className="py-[60px] px-10 text-center text-muted">
          <div className="flex justify-center mb-3">
            <Plus className="h-10 w-10 opacity-30" />
          </div>
          <div className="text-sm font-medium text-foreground mb-1.5">Flow Builder</div>
          <div className="text-[13px] mb-4">
            Design your campaign email here. Add email steps, time delays, and conditions.
          </div>

          <div className="text-xs text-brand bg-brand-light rounded-lg inline-block px-3.5 py-2 text-left leading-[1.8]">
            <strong>
              Available merge tags ({targetGroup === "Leads" ? "Lead" : "Customer"} campaign):
            </strong>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {tags.map((tag) => (
                <code
                  key={tag}
                  className={cn(
                    "font-mono text-[11.5px] px-1.5 py-px rounded",
                    tag === "lead.attachmentLink"
                      ? "bg-green-50 text-green-600"
                      : "bg-white text-brand border border-indigo-100"
                  )}
                >
                  {`{{${tag}}}`}
                </code>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          ← Previous
        </Button>
        <Button onClick={onNext}>Continue to Settings →</Button>
      </div>
    </div>
  );
}
