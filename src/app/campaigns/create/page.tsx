"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import StepDetails from "@/components/campaigns/StepDetails";
import StepRecipients from "@/components/campaigns/StepRecipients";
import StepFlowBuilder from "@/components/campaigns/StepFlowBuilder";
import StepSettings from "@/components/campaigns/StepSettings";
import StepDraftSend from "@/components/campaigns/StepDraftSend";
import { TargetGroup, WizardStep } from "@/types";
import { templates } from "@/data/templates";
import { leads } from "@/data/leads";

const steps = [
  { num: 1 as WizardStep, label: "Campaign Details", desc: "Configure campaign settings" },
  { num: 2 as WizardStep, label: "Select Recipients", desc: "Choose who receives this campaign" },
  { num: 3 as WizardStep, label: "Flow Builder", desc: "Design your campaign email" },
  { num: 4 as WizardStep, label: "Settings", desc: "Configure campaign settings" },
  { num: 5 as WizardStep, label: "Draft & Send", desc: "Review and send your campaign" },
];

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={<div className="px-8 py-7 text-muted text-[13px]">Loading…</div>}>
      <CreateCampaignWizard />
    </Suspense>
  );
}

function CreateCampaignWizard() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  const sentCountParam = searchParams.get("sentCount");
  const initialTargetGroup: TargetGroup =
    (templateId && templates.find((t) => t.id === templateId)?.targetGroup) || "Leads";
  const sentCount = sentCountParam ? Number(sentCountParam) || 0 : 0;

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [targetGroup, setTargetGroup] = useState<TargetGroup>(initialTargetGroup);
  const [autoSend, setAutoSend] = useState(true);

  // Recipient selection (lifted so it can be cleared on target group change)
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set(["ls-1"]));
  const [includedLeadIds, setIncludedLeadIds] = useState<Set<string>>(
    () => new Set(leads.map((l) => l.id))
  );

  // Merge tags in the email body. False = body has been cleared of merge tags.
  const [emailHasMergeTags, setEmailHasMergeTags] = useState(true);

  const goTo = (step: WizardStep) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Destructive side effect: clears recipients + strips merge tags from body.
  const handleTargetGroupChange = (tg: TargetGroup) => {
    if (tg === targetGroup) return;
    setTargetGroup(tg);
    setSelectedLists(new Set());
    setIncludedLeadIds(new Set());
    setEmailHasMergeTags(false);
  };

  // Final recipient set — leads from any selected list, intersected with
  // individually included ids. Empty if no list is selected.
  const recipientLeads =
    selectedLists.size === 0
      ? []
      : leads.filter((l) => includedLeadIds.has(l.id));

  return (
    <div className="px-8 py-7 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <Link
          href="/campaigns"
          className="w-7 h-7 border border-b2 rounded-md flex items-center justify-center cursor-pointer text-muted bg-white hover:bg-gray-50 hover:border-brand hover:text-brand transition-all no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
        <h1 className="text-xl font-semibold">Create Campaign</h1>
      </div>

      {/* Wizard Stepper */}
      <div className="flex items-start mb-8">
        {steps.map((step, i) => (
          <div key={step.num} className="flex-1 flex flex-col items-center relative">
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={`absolute top-5 h-[1.5px] z-0 ${
                  step.num < currentStep ? "bg-brand" : "bg-b2"
                }`}
                style={{
                  left: "calc(50% + 22px)",
                  right: "calc(-50% + 22px)",
                }}
              />
            )}

            {/* Circle */}
            <button
              onClick={() => goTo(step.num)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold z-[1] relative transition-all cursor-pointer border-none ${
                step.num < currentStep
                  ? "bg-brand text-white"
                  : step.num === currentStep
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-light border-[1.5px] border-b2"
              }`}
            >
              {step.num < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                step.num
              )}
            </button>

            {/* Label */}
            <span
              className={`text-[13px] font-medium mt-2 text-center ${
                step.num < currentStep
                  ? "text-gray-900"
                  : step.num === currentStep
                  ? "text-brand"
                  : "text-light"
              }`}
            >
              {step.label}
            </span>
            <span className="text-[11.5px] text-light text-center mt-0.5 max-w-[110px] leading-snug">
              {step.desc}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <StepDetails
          targetGroup={targetGroup}
          onTargetGroupChange={handleTargetGroupChange}
          onNext={() => goTo(2)}
          sentCount={sentCount}
        />
      )}
      {currentStep === 2 && (
        <StepRecipients
          targetGroup={targetGroup}
          selectedLists={selectedLists}
          onSelectedListsChange={setSelectedLists}
          includedLeadIds={includedLeadIds}
          onIncludedLeadIdsChange={setIncludedLeadIds}
          onPrev={() => goTo(1)}
          onNext={() => goTo(3)}
        />
      )}
      {currentStep === 3 && (
        <StepFlowBuilder
          targetGroup={targetGroup}
          onPrev={() => goTo(2)}
          onNext={() => goTo(4)}
        />
      )}
      {currentStep === 4 && (
        <StepSettings
          targetGroup={targetGroup}
          autoSend={autoSend}
          onAutoSendChange={setAutoSend}
          onPrev={() => goTo(3)}
          onNext={() => goTo(5)}
        />
      )}
      {currentStep === 5 && (
        <StepDraftSend
          autoSend={autoSend}
          emailHasMergeTags={emailHasMergeTags}
          recipients={recipientLeads}
          onPrev={() => goTo(4)}
          onGoToRecipients={() => goTo(2)}
        />
      )}
    </div>
  );
}
