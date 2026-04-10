"use client";

import { useState } from "react";
import { Users, CheckCircle, AlertCircle, Info } from "lucide-react";
import { leads, leadSmartLists } from "@/data/leads";
import { TargetGroup } from "@/types";

interface StepRecipientsProps {
  targetGroup: TargetGroup;
  onPrev: () => void;
  onNext: () => void;
}

export default function StepRecipients({ targetGroup, onPrev, onNext }: StepRecipientsProps) {
  const [activeListTab, setActiveListTab] = useState<"static" | "dynamic" | "selected">("static");
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set(["ls-1"]));

  const toggleList = (id: string) => {
    const next = new Set(selectedLists);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLists(next);
  };

  const staticLists = leadSmartLists.filter((l) => l.type === "Static");
  const dynamicLists = leadSmartLists.filter((l) => l.type === "Dynamic");

  // Leads with email
  const leadsWithEmail = leads.filter((l) => l.email).length;
  const leadsMissingInfo = leads.filter((l) => !l.email).length;

  const recipientLeads = leads.slice(0, 3); // Simulating selected list leads

  return (
    <div className="max-w-[960px] mx-auto">
      {/* Stats cards — 3 for leads (no "Total Recipients") */}
      <div className="grid grid-cols-3 bg-white border border-border rounded-[10px] overflow-hidden mb-3.5">
        <div className="p-3.5 px-[18px] border-r border-border">
          <div className="text-[11.5px] text-muted mb-1.5 flex items-center gap-1.5">
            <Users className="w-[13px] h-[13px] text-brand" />
            Leads Selected
          </div>
          <div className="text-lg font-semibold">{recipientLeads.length}</div>
        </div>
        <div className="p-3.5 px-[18px] border-r border-border">
          <div className="text-[11.5px] text-muted mb-1.5 flex items-center gap-1.5">
            <CheckCircle className="w-[13px] h-[13px] text-green-600" />
            Leads with Email
          </div>
          <div className="text-lg font-semibold text-green-600">{leadsWithEmail}</div>
        </div>
        <div className="p-3.5 px-[18px]">
          <div className="text-[11.5px] text-muted mb-1.5 flex items-center gap-1.5">
            <AlertCircle className="w-[13px] h-[13px] text-amber-600" />
            Missing info
          </div>
          <div className="text-lg font-semibold text-amber-600">{leadsMissingInfo}</div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-brand-light border border-indigo-200 rounded-lg p-3 px-3.5 text-[12.5px] text-blue-800 mb-3.5 flex gap-2.5 items-start leading-relaxed">
        <Info className="w-[13px] h-[13px] flex-shrink-0 mt-0.5" />
        <div>
          <strong>Target group: {targetGroup}.</strong> Only{" "}
          {targetGroup === "Leads" ? "lead" : "customer"} smart lists are shown below.{" "}
          {targetGroup === "Leads" ? "Customer" : "Lead"} lists are not available for this campaign.
        </div>
      </div>

      {/* List selector */}
      <div className="bg-white border border-border rounded-[10px] p-3.5 px-[18px] mb-3.5">
        {/* Tabs */}
        <div className="flex border-b border-border mb-3.5">
          {[
            { key: "static" as const, label: `Static Lists (${staticLists.length})` },
            { key: "dynamic" as const, label: `Dynamic Lists (${dynamicLists.length})` },
            { key: "selected" as const, label: `Selected (${selectedLists.size})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveListTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium cursor-pointer border-b-2 -mb-px transition-all ${
                activeListTab === tab.key
                  ? "text-gray-900 border-brand"
                  : "text-muted border-transparent hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p className="text-[12.5px] text-muted mb-3">
          <strong className="text-gray-900">Note:</strong> Selecting a list will automatically include any leads added to that list in the future.
        </p>

        {/* List cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {(activeListTab === "static" ? staticLists : activeListTab === "dynamic" ? dynamicLists : leadSmartLists.filter(l => selectedLists.has(l.id))).map((list) => (
            <button
              key={list.id}
              onClick={() => toggleList(list.id)}
              className={`border-[1.5px] rounded-lg p-[13px] px-[15px] cursor-pointer text-left transition-all relative ${
                selectedLists.has(list.id)
                  ? "border-brand"
                  : "border-b2 hover:border-indigo-300"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`absolute top-[11px] right-[11px] w-4 h-4 border-[1.5px] rounded-[3px] flex items-center justify-center ${
                  selectedLists.has(list.id)
                    ? "bg-brand border-brand"
                    : "border-b2"
                }`}
              >
                {selectedLists.has(list.id) && (
                  <span className="text-[10px] text-white font-bold">&check;</span>
                )}
              </div>
              <div className="text-[13px] font-medium text-brand mb-1.5">{list.name}</div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-muted">
                {list.type}
              </span>
              <div className="text-xs text-muted mt-0.5">{list.count} leads</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recipients table — flat list for leads (no expand/collapse) */}
      <div className="bg-white border border-border rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="px-[13px] py-[9px] text-xs font-medium text-muted text-left border-b border-gray-100">
                First Name
              </th>
              <th className="px-[13px] py-[9px] text-xs font-medium text-muted text-left border-b border-gray-100">
                Last Name
              </th>
              <th className="px-[13px] py-[9px] text-xs font-medium text-muted text-left border-b border-gray-100">
                Email
              </th>
              <th className="px-[13px] py-[9px] text-xs font-medium text-muted text-left border-b border-gray-100">
                Company
              </th>
              <th className="px-[13px] py-[9px] text-xs font-medium text-muted text-left border-b border-gray-100">
                Owner
              </th>
            </tr>
          </thead>
          <tbody>
            {recipientLeads.map((l) => (
              <tr key={l.id} className="border-b border-gray-50 last:border-b-0">
                <td className="px-[13px] py-[11px] text-[13px] font-medium">{l.firstName}</td>
                <td className="px-[13px] py-[11px] text-[13px] font-medium">{l.lastName}</td>
                <td className="px-[13px] py-[11px] text-[13px] text-muted">{l.email}</td>
                <td className="px-[13px] py-[11px] text-[13px]">{l.company}</td>
                <td className="px-[13px] py-[11px] text-[13px]">
                  <div className="flex items-center gap-[7px]">
                    <div
                      className="w-6 h-6 rounded-full text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: l.ownerColor }}
                    >
                      {l.ownerInitials}
                    </div>
                    {l.owner}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          Continue to Flow Builder &rarr;
        </button>
      </div>
    </div>
  );
}
