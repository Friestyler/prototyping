"use client";

import { useState } from "react";
import { ArrowLeft, Check, Save } from "lucide-react";
import StepDetails from "@/components/leads-campaigns/step-details";
import StepRecipients from "@/components/leads-campaigns/step-recipients";
import StepFlowBuilder from "@/components/leads-campaigns/step-flow-builder";
import StepSettings from "@/components/leads-campaigns/step-settings";
import StepDraftSend from "@/components/leads-campaigns/step-draft-send";
import { TargetGroup, WizardStep } from "@/lib/lc-types";
import type { FlowStep } from "@/lib/flow-types";
import { newEmailStep } from "@/lib/flow-types";
import { templates } from "@/lib/lc-data/templates";
import { campaigns } from "@/lib/lc-data/campaigns";
import { leads } from "@/lib/lc-data/leads";
import { Button } from "@/components/ui/button";
import { saveUserCampaign } from "@/lib/user-campaigns";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { num: 1 as WizardStep, label: "Campaign Details", desc: "Configure campaign settings" },
  { num: 2 as WizardStep, label: "Select Recipients", desc: "Choose who receives this campaign" },
  { num: 3 as WizardStep, label: "Flow Builder", desc: "Design your campaign email" },
  { num: 4 as WizardStep, label: "Settings", desc: "Configure campaign settings" },
  { num: 5 as WizardStep, label: "Draft & Send", desc: "Review and send your campaign" },
];

export interface WizardInitialCampaign {
  id: string;
  name: string;
  description?: string;
  targetGroup: TargetGroup;
  sentCount?: number;
}

interface CampaignWizardProps {
  templateId?: string;
  campaignId?: string;
  initialCampaign?: WizardInitialCampaign;
  initialName?: string;
  onBack: () => void;
}

export default function CampaignWizard({
  templateId,
  campaignId,
  initialCampaign,
  initialName,
  onBack,
}: CampaignWizardProps) {
  // Prefer an explicitly-passed campaign (user-created), fall back to seed lookup.
  const loadedCampaign =
    initialCampaign ??
    (campaignId ? campaigns.find((c) => c.id === campaignId) ?? null : null);

  const initialTargetGroup: TargetGroup =
    loadedCampaign?.targetGroup ||
    (templateId && templates.find((t) => t.id === templateId)?.targetGroup) ||
    "Leads";

  const sentCount = loadedCampaign?.sentCount ?? 0;

  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [targetGroup, setTargetGroup] = useState<TargetGroup>(initialTargetGroup);
  const [autoSend, setAutoSend] = useState(false);

  const [campaignName, setCampaignName] = useState<string>(
    initialName ?? loadedCampaign?.name ?? "",
  );
  const [campaignDescription, setCampaignDescription] = useState<string>(
    loadedCampaign?.description ?? "",
  );

  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set(["ls-1"]));
  const [includedLeadIds, setIncludedLeadIds] = useState<Set<string>>(
    () => new Set(leads.map((l) => l.id))
  );

  const [emailHasMergeTags, setEmailHasMergeTags] = useState(true);
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>(() => [newEmailStep()]);
  const [saving, setSaving] = useState(false);

  const handleSaveDraft = async () => {
    if (!campaignName.trim()) {
      toast({ title: "Campaign name required", description: "Add a name before saving." });
      setCurrentStep(1);
      return;
    }
    setSaving(true);
    const recipientIds =
      targetGroup === "Leads"
        ? Array.from(includedLeadIds)
        : []; // Customers target — recipients come from MCP / smart list later.
    const saved = await saveUserCampaign({
      name: campaignName.trim(),
      targetGroup,
      description: campaignDescription.trim() || undefined,
      recipientIds,
    });
    setSaving(false);
    if (saved) {
      toast({
        title: "Draft saved",
        description: `"${saved.name}" is in Campaigns as a Draft.`,
      });
      onBack();
    } else {
      toast({ title: "Couldn't save draft", description: "The server rejected the save." });
    }
  };

  const goTo = (step: WizardStep) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTargetGroupChange = (tg: TargetGroup) => {
    if (tg === targetGroup) return;
    setTargetGroup(tg);
    setSelectedLists(new Set());
    setIncludedLeadIds(new Set());
    setEmailHasMergeTags(false);
  };

  const recipientLeads =
    selectedLists.size === 0
      ? []
      : leads.filter((l) => includedLeadIds.has(l.id));

  return (
    <div className="bg-white min-h-full px-8 py-7 overflow-y-auto h-full">
      <div className="flex items-center gap-3 mb-7">
        <button
          onClick={onBack}
          className="w-7 h-7 border border-b2 rounded-md flex items-center justify-center cursor-pointer text-muted-foreground bg-white hover:bg-gray-50 hover:border-brand hover:text-brand transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <h1 className="text-xl font-semibold flex-1">Create Campaign</h1>
        <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={saving}>
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving…" : "Save as Draft"}
        </Button>
      </div>

      <div className="flex items-start mb-8">
        {steps.map((step, i) => (
          <div key={step.num} className="flex-1 flex flex-col items-center relative">
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

      {currentStep === 1 && (
        <StepDetails
          targetGroup={targetGroup}
          onTargetGroupChange={handleTargetGroupChange}
          onNext={() => goTo(2)}
          sentCount={sentCount}
          initialName={initialName}
          name={campaignName}
          onNameChange={setCampaignName}
          description={campaignDescription}
          onDescriptionChange={setCampaignDescription}
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
          steps={flowSteps}
          onStepsChange={setFlowSteps}
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
          flowSteps={flowSteps}
          onPrev={() => goTo(4)}
          onGoToRecipients={() => goTo(2)}
        />
      )}
    </div>
  );
}
