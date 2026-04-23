"use client";

import { useState } from "react";
import { Search, Send, CheckCircle, AlertCircle, Inbox } from "lucide-react";
import { Lead } from "@/lib/lc-types";
import { getOwnerMeta } from "@/lib/lc-data/users";
import type { FlowStep, EmailStep } from "@/lib/flow-types";
import {
  leadToContext,
  renderEmailForRecipient,
  resolveMergeTags,
} from "@/lib/resolve-email";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StepDraftSendProps {
  autoSend: boolean;
  emailHasMergeTags: boolean;
  recipients: Lead[];
  flowSteps?: FlowStep[];
  onPrev: () => void;
  onGoToRecipients: () => void;
}

type DraftFilter = "All" | "Sent" | "Pending";

export default function StepDraftSend({
  autoSend,
  emailHasMergeTags,
  recipients,
  flowSteps,
  onPrev,
  onGoToRecipients,
}: StepDraftSendProps) {
  const firstEmailStep = flowSteps?.find((s): s is EmailStep => s.kind === "email") ?? null;
  const hasAuthoredBody = !!firstEmailStep?.body?.content?.length;
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeFilter, setActiveFilter] = useState<DraftFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const draftLeads = recipients;
  const safeIdx = Math.min(selectedIdx, Math.max(0, draftLeads.length - 1));
  const selected = draftLeads[safeIdx];
  const selectedOwner = selected ? getOwnerMeta(selected.owner) : null;
  const selectedComplete = !!selected?.email;

  const ctaLabel = autoSend ? "Activate campaign" : "Send all";

  const fullName = (l: Lead) =>
    `${l.firstName || ""} ${l.lastName || ""}`.trim() || "Unnamed lead";
  const initials = (l: Lead) => {
    const a = (l.firstName || "")[0] || "";
    const b = (l.lastName || "")[0] || "";
    return (a + b).toUpperCase() || "?";
  };
  const colorFor = (l: Lead) => {
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
        <Button variant="outline" size="sm" onClick={onPrev}>
          ← Previous
        </Button>
        <Button disabled={draftLeads.length === 0}>
          <Send className="h-[13px] w-[13px]" />
          {ctaLabel}
        </Button>
      </div>

      {draftLeads.length === 0 ? (
        <Card>
          <div className="py-16 px-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Inbox className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium text-foreground mb-4">
              No recipients selected
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={onGoToRecipients}>
                ← Back to Select Recipients
              </Button>
            </div>
          </div>
        </Card>
      ) : (
      <div className="grid grid-cols-[360px_1fr] gap-3.5" style={{ height: "calc(100vh - 280px)" }}>
        {/* Left panel: lead list */}
        <Card className="flex flex-col overflow-hidden p-0">
          <div className="p-3 px-4 border-b border-border">
            <div className="relative">
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-light pointer-events-none" />
            </div>
            <div className="flex gap-1 mt-2">
              {(["All", "Sent", "Pending"] as DraftFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "py-1 px-3 rounded-md text-[12.5px] font-medium transition-colors",
                    activeFilter === f
                      ? "bg-brand text-white"
                      : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {draftLeads.map((lead, i) => {
              const incomplete = !lead.email;
              const isActive = selectedIdx === i;
              return (
                <button
                  key={lead.id}
                  onClick={() => setSelectedIdx(i)}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-[11px] border-b border-gray-50 cursor-pointer w-full text-left transition-colors",
                    isActive ? "bg-brand-light" : "hover:bg-gray-50"
                  )}
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
                        <Badge variant="warning" className="text-[10.5px] py-px px-1.5">
                          <AlertCircle className="h-[10px] w-[10px]" />
                          Incomplete information
                        </Badge>
                      )}
                    </div>
                    <div
                      className={cn(
                        "text-xs truncate",
                        incomplete ? "text-amber-700" : "text-muted-foreground"
                      )}
                    >
                      {incomplete
                        ? "No email address"
                        : `${lead.email} \u00b7 ${lead.company || ""}`}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[11px] hover:border-red-500 hover:text-red-500"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Exclude
                  </Button>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right panel: email preview */}
        <Card className="overflow-y-auto p-0">
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
              <div className="text-xs text-muted-foreground mt-0.5">
                {selectedComplete ? (
                  selected.email
                ) : (
                  <span className="text-amber-700">No email address</span>
                )}{" "}
                · {selected.company || "—"} · Owner: {selectedOwner?.name || "—"}
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[11px]">
              Exclude
            </Button>
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
                <div className="text-xs text-muted-foreground">
                  {selectedComplete ? (
                    selected.email
                  ) : (
                    <span className="text-amber-700">No email address</span>
                  )}{" "}
                  · {selected.company || "—"}
                </div>
              </div>
              {selectedComplete ? (
                <Badge variant="success">
                  <CheckCircle className="h-[10px] w-[10px]" />
                  Information complete
                </Badge>
              ) : (
                <Badge variant="warning">
                  <AlertCircle className="h-[10px] w-[10px]" />
                  Incomplete lead information
                </Badge>
              )}
              <Button variant="outline" size="sm" className="h-6 px-2 text-[11px] ml-2">
                Exclude
              </Button>
            </div>
          </div>

          {/* Email preview */}
          <div className="mx-[18px] my-[18px] border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-[11px] px-[13px] bg-gray-50 border-b border-border">
              <div className="text-[13px] font-semibold flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-brand text-white text-[11px] font-semibold flex items-center justify-center">
                  1
                </div>
                Email Preview{" "}
                <span className="text-xs text-muted-foreground font-normal">To: {fullName(selected)}</span>
              </div>
              <div className="flex gap-2 items-center">
                {selectedComplete ? (
                  <Badge variant="success">
                    <CheckCircle className="h-[10px] w-[10px]" />
                    Ready to send
                  </Badge>
                ) : (
                  <Badge variant="warning">
                    <AlertCircle className="h-[10px] w-[10px]" />
                    Incomplete lead information
                  </Badge>
                )}
                <Button size="sm" disabled={!selectedComplete}>
                  <Send className="h-[11px] w-[11px]" />
                  Send
                </Button>
              </div>
            </div>

            {/* Email fields — fully resolved for the selected recipient */}
            {(() => {
              const ctx = leadToContext(selected);
              const sender = {
                name: "Kevin Kools",
                signature: "Brand Broker Insurance · +32 2 123 4567",
              };
              const attachmentLink =
                selected.attachmentLink ?? "https://portal.brandbroker.com/offer/abc123";
              const resolveStr = (s: string) =>
                resolveMergeTags(s, ctx, sender, attachmentLink);

              const resolvedSubject = firstEmailStep?.subject
                ? resolveStr(firstEmailStep.subject)
                : "Your AON Cybersecurity offer is ready";

              const rows = [
                { label: "From:", body: <>{sender.name} (via Brand Broker)</> },
                {
                  label: "Subject:",
                  body: (
                    <>
                      <span className="inline-flex items-center gap-1 text-[11.5px] text-brand cursor-pointer hover:underline mb-1">
                        ✎ Customize
                      </span>
                      <div>{resolvedSubject}</div>
                    </>
                  ),
                },
                {
                  label: "Content:",
                  body: (
                    <>
                      <span className="inline-flex items-center gap-1 text-[11.5px] text-brand cursor-pointer hover:underline mb-1">
                        ✎ Customize
                      </span>
                      {hasAuthoredBody ? (
                        <div className="mt-1 leading-[1.6]">
                          {renderEmailForRecipient(firstEmailStep!.body, ctx, {
                            sender,
                            attachmentLink,
                          })}
                        </div>
                      ) : emailHasMergeTags ? (
                        <div className="mt-1 leading-[1.9]">
                          Dear {resolveStr("{{lead.firstName}} {{lead.lastName}}")} —{" "}
                          {resolveStr("{{lead.company}}")},
                          <br />
                          <br />
                          Your personalised offer is ready:
                          <br />
                          <a
                            href={attachmentLink}
                            className="text-brand underline break-all"
                          >
                            {attachmentLink}
                          </a>
                          <br />
                          <br />
                          Kind regards,
                          <br />
                          {sender.name}
                          <br />
                          {sender.signature}
                        </div>
                      ) : (
                        <div className="mt-1 leading-[1.9]">
                          Dear ,
                          <br />
                          <br />
                          Your personalised offer is ready:
                          <br />
                          <br />
                          Kind regards,
                        </div>
                      )}
                    </>
                  ),
                },
              ];
              return rows.map((row, i, arr) => (
                <div
                  key={row.label}
                  className={cn("flex", i < arr.length - 1 && "border-b border-gray-50")}
                >
                  <div className="text-[12.5px] text-muted-foreground p-2.5 px-[13px] min-w-[85px] border-r border-gray-50 bg-gray-50/50 flex-shrink-0">
                    {row.label}
                  </div>
                  <div className="text-[12.5px] text-foreground p-2.5 px-[13px] flex-1">
                    {row.body}
                  </div>
                </div>
              ));
            })()}
          </div>
        </Card>
      </div>
      )}
    </>
  );
}
