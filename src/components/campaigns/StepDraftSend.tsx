"use client";

import { useState } from "react";
import { Search, Send, CheckCircle, AlertCircle } from "lucide-react";
import { leads } from "@/data/leads";
import { getOwnerMeta } from "@/data/users";

interface StepDraftSendProps {
  autoSend: boolean;
  onPrev: () => void;
}

type DraftFilter = "All" | "Sent" | "Pending";

export default function StepDraftSend({ autoSend, onPrev }: StepDraftSendProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeFilter, setActiveFilter] = useState<DraftFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Use shared lead data so the no-email lead (L-005) appears.
  const draftLeads = leads;
  const selected = draftLeads[selectedIdx];
  const selectedOwner = getOwnerMeta(selected.owner);
  const selectedComplete = !!selected.email;

  const ctaLabel = autoSend ? "Activate campaign" : "Send all";

  const fullName = (l: typeof leads[number]) =>
    `${l.firstName || ""} ${l.lastName || ""}`.trim() || "Unnamed lead";
  const initials = (l: typeof leads[number]) => {
    const a = (l.firstName || "")[0] || "";
    const b = (l.lastName || "")[0] || "";
    return (a + b).toUpperCase() || "?";
  };
  const colorFor = (l: typeof leads[number]) => {
    const palette = ["#5B5BD6", "#059669", "#D97706", "#DB2777", "#0EA5E9"];
    const seed = (l.firstName || "") + (l.lastName || "");
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  };

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3.5">
        <button
          onClick={onPrev}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-white text-gray-900 border border-b2 rounded-lg font-sans text-[12.5px] font-medium cursor-pointer hover:bg-gray-50 transition-colors"
        >
          &larr; Previous
        </button>
        <button className="inline-flex items-center gap-1.5 py-2 px-[18px] bg-brand text-white border-none rounded-lg font-sans text-[13px] font-medium cursor-pointer hover:bg-brand-hover transition-colors">
          <Send className="w-[13px] h-[13px]" />
          {ctaLabel}
        </button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-[360px_1fr] gap-3.5" style={{ height: "calc(100vh - 280px)" }}>
        {/* Left panel: lead list */}
        <div className="bg-white border border-border rounded-[10px] flex flex-col overflow-hidden">
          <div className="p-3 px-4 border-b border-border">
            <div className="flex items-center gap-[7px] border border-b2 rounded-[7px] py-[7px] px-[11px] text-[13px]">
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-none outline-none font-sans text-[13px] text-gray-900 bg-transparent w-full placeholder:text-light"
              />
              <Search className="w-[13px] h-[13px] text-light" />
            </div>
            {/* Filter tabs — no "With contacts" / "Without contacts" for leads */}
            <div className="flex gap-1 mt-2">
              {(["All", "Sent", "Pending"] as DraftFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`py-1 px-3 rounded-[7px] text-[12.5px] font-medium cursor-pointer transition-all ${
                    activeFilter === f
                      ? "bg-brand text-white"
                      : "bg-gray-100 text-muted hover:bg-gray-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {draftLeads.map((lead, i) => {
              const incomplete = !lead.email;
              return (
                <button
                  key={lead.id}
                  onClick={() => setSelectedIdx(i)}
                  className={`flex items-center gap-2.5 px-4 py-[11px] border-b border-gray-50 cursor-pointer w-full text-left transition-colors ${
                    selectedIdx === i ? "bg-brand-light" : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full text-white text-[11px] font-semibold flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: colorFor(lead) }}
                  >
                    {initials(lead)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium flex items-center gap-1.5">
                      {fullName(lead)}
                      {incomplete && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-medium px-1.5 py-px rounded-full bg-amber-50 text-amber-700">
                          <AlertCircle className="w-[10px] h-[10px]" />
                          Incomplete information
                        </span>
                      )}
                    </div>
                    <div className={`text-xs truncate ${incomplete ? "text-amber-700" : "text-muted"}`}>
                      {incomplete ? "No email address" : `${lead.email} \u00b7 ${lead.company || ""}`}
                    </div>
                  </div>
                  <span className="text-xs py-0.5 px-2 border border-b2 rounded-[5px] cursor-pointer text-muted hover:border-red-500 hover:text-red-500 flex-shrink-0 transition-colors font-sans">
                    Exclude
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel: email preview */}
        <div className="bg-white border border-border rounded-[10px] overflow-y-auto">
          {/* Lead header */}
          <div className="p-3.5 px-[18px] border-b border-border flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full text-white text-[10px] font-semibold flex items-center justify-center"
                  style={{ backgroundColor: colorFor(selected) }}
                >
                  {initials(selected)}
                </div>
                {fullName(selected)}
              </div>
              <div className="text-xs text-muted mt-0.5">
                {selectedComplete ? selected.email : <span className="text-amber-700">No email address</span>}{" "}
                &middot; {selected.company || "—"} &middot; Owner: {selectedOwner?.name || "—"}
              </div>
            </div>
            <button className="text-xs py-0.5 px-2 border border-b2 rounded-[5px] cursor-pointer text-muted hover:border-red-500 hover:text-red-500 transition-colors font-sans">
              Exclude
            </button>
          </div>

          {/* Lead info card */}
          <div className="mx-[18px] mt-3.5 border border-border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2.5 p-[11px] px-3.5 border-b border-gray-50">
              <div
                className="w-8 h-8 rounded-full text-white text-[11px] font-semibold flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: colorFor(selected) }}
              >
                {initials(selected)}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium">{fullName(selected)}</div>
                <div className="text-xs text-muted">
                  {selectedComplete ? selected.email : <span className="text-amber-700">No email address</span>}{" "}
                  &middot; {selected.company || "—"}
                </div>
              </div>
              {selectedComplete ? (
                <span className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                  <CheckCircle className="w-[10px] h-[10px]" />
                  Information complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  <AlertCircle className="w-[10px] h-[10px]" />
                  Incomplete lead information
                </span>
              )}
              <button className="text-xs py-0.5 px-2 border border-b2 rounded-[5px] cursor-pointer text-muted hover:border-red-500 hover:text-red-500 ml-2 transition-colors font-sans">
                Exclude
              </button>
            </div>
          </div>

          {/* Email preview */}
          <div className="mx-[18px] mt-0 mb-[18px] border border-border rounded-lg overflow-hidden mt-3.5">
            {/* Email header */}
            <div className="flex items-center justify-between p-[11px] px-[13px] bg-gray-50 border-b border-border">
              <div className="text-[13px] font-semibold flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-brand text-white text-[11px] font-semibold flex items-center justify-center">
                  1
                </div>
                Email Preview{" "}
                <span className="text-xs text-muted font-normal">To: {fullName(selected)}</span>
              </div>
              <div className="flex gap-2 items-center">
                {selectedComplete ? (
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                    <CheckCircle className="w-[10px] h-[10px]" />
                    Ready to send
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                    <AlertCircle className="w-[10px] h-[10px]" />
                    Incomplete lead information
                  </span>
                )}
                <button
                  disabled={!selectedComplete}
                  className={`inline-flex items-center gap-1.5 py-1.5 px-[13px] border-none rounded-md font-sans text-[12.5px] font-medium transition-colors ${
                    selectedComplete
                      ? "bg-brand text-white cursor-pointer hover:bg-brand-hover"
                      : "bg-gray-200 text-light cursor-not-allowed"
                  }`}
                >
                  <Send className="w-[11px] h-[11px]" />
                  Send
                </button>
              </div>
            </div>

            {/* Email fields */}
            <div className="flex border-b border-gray-50">
              <div className="text-[12.5px] text-muted p-2.5 px-[13px] min-w-[85px] border-r border-gray-50 bg-gray-50/50 flex-shrink-0">
                From:
              </div>
              <div className="text-[12.5px] text-gray-900 p-2.5 px-[13px] flex-1">
                Kevin Kools (via Qollabi)
              </div>
            </div>
            <div className="flex border-b border-gray-50">
              <div className="text-[12.5px] text-muted p-2.5 px-[13px] min-w-[85px] border-r border-gray-50 bg-gray-50/50 flex-shrink-0">
                Subject:
              </div>
              <div className="text-[12.5px] text-gray-900 p-2.5 px-[13px] flex-1">
                <span className="inline-flex items-center gap-1 text-[11.5px] text-brand cursor-pointer hover:underline mb-1">
                  &#9998; Customize
                </span>
                <div>Your AON Cybersecurity offer is ready</div>
              </div>
            </div>
            <div className="flex">
              <div className="text-[12.5px] text-muted p-2.5 px-[13px] min-w-[85px] border-r border-gray-50 bg-gray-50/50 flex-shrink-0">
                Content:
              </div>
              <div className="text-[12.5px] text-gray-900 p-2.5 px-[13px] flex-1 leading-[1.9]">
                <span className="inline-flex items-center gap-1 text-[11.5px] text-brand cursor-pointer hover:underline mb-1">
                  &#9998; Customize
                </span>
                <div className="mt-1">
                  Dear{" "}
                  <code className="font-mono text-[11.5px] px-1 py-px rounded bg-brand-light text-brand">
                    {"{{lead.firstName}}"}
                  </code>{" "}
                  <code className="font-mono text-[11.5px] px-1 py-px rounded bg-brand-light text-brand">
                    {"{{lead.lastName}}"}
                  </code>{" "}
                  &mdash;{" "}
                  <code className="font-mono text-[11.5px] px-1 py-px rounded bg-brand-light text-brand">
                    {"{{lead.company}}"}
                  </code>
                  ,
                  <br />
                  <br />
                  Your personalised offer is ready:
                  <br />
                  <code className="font-mono text-[11.5px] px-1 py-px rounded bg-green-50 text-green-600">
                    {"{{lead.attachmentLink}}"}
                  </code>
                  <br />
                  <br />
                  Kind regards,
                  <br />
                  <code className="font-mono text-[11.5px] px-1 py-px rounded bg-brand-light text-brand">
                    {"{{sender.name}}"}
                  </code>
                  <br />
                  <code className="font-mono text-[11.5px] px-1 py-px rounded bg-brand-light text-brand">
                    {"{{sender.signature}}"}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
