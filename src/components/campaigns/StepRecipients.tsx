"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Users,
  CheckCircle,
  AlertCircle,
  Check,
  Search,
  Layers,
  Zap,
  CheckSquare,
} from "lucide-react";
import { leads, leadSmartLists } from "@/data/leads";
import { getOwnerMeta } from "@/data/users";
import { TargetGroup } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface StepRecipientsProps {
  targetGroup: TargetGroup;
  selectedLists: Set<string>;
  onSelectedListsChange: (next: Set<string>) => void;
  includedLeadIds: Set<string>;
  onIncludedLeadIdsChange: (next: Set<string>) => void;
  onPrev: () => void;
  onNext: () => void;
}

type SelectedFilter = "All" | "Has Email" | "Missing Info";

export default function StepRecipients({
  selectedLists,
  onSelectedListsChange,
  includedLeadIds,
  onIncludedLeadIdsChange,
  onPrev,
  onNext,
}: StepRecipientsProps) {
  const [activeListTab, setActiveListTab] = useState<string>("static");
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>("All");

  const staticLists = leadSmartLists.filter((l) => l.type === "Static");
  const dynamicLists = leadSmartLists.filter((l) => l.type === "Dynamic");

  // Mock: leads belonging to any selected list = all leads.
  const listLeads = useMemo(
    () => (selectedLists.size > 0 ? leads : []),
    [selectedLists]
  );

  // Selecting/unselecting a list auto-toggles all of its leads (mock: all leads).
  useEffect(() => {
    if (selectedLists.size === 0) {
      onIncludedLeadIdsChange(new Set());
    } else {
      onIncludedLeadIdsChange(new Set(leads.map((l) => l.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLists]);

  const toggleList = (id: string) => {
    const next = new Set(selectedLists);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedListsChange(next);
  };

  const toggleLead = (id: string) => {
    const next = new Set(includedLeadIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onIncludedLeadIdsChange(next);
  };

  const allListLeadsIncluded =
    listLeads.length > 0 && listLeads.every((l) => includedLeadIds.has(l.id));

  const toggleAllListLeads = () => {
    const next = new Set(includedLeadIds);
    if (allListLeadsIncluded) {
      listLeads.forEach((l) => next.delete(l.id));
    } else {
      listLeads.forEach((l) => next.add(l.id));
    }
    onIncludedLeadIdsChange(next);
  };

  // Final recipients = leads from selected lists ∩ individually included.
  const selectedLeads = useMemo(
    () => listLeads.filter((l) => includedLeadIds.has(l.id)),
    [listLeads, includedLeadIds]
  );

  const withEmail = selectedLeads.filter((l) => l.email).length;
  const missingInfo = selectedLeads.filter((l) => !l.email).length;

  const stats = [
    {
      label: "Leads Selected",
      value: selectedLeads.length,
      icon: Users,
      color: "text-brand",
      bg: "bg-brand-light",
    },
    {
      label: "Leads with Email",
      value: withEmail,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Missing info",
      value: missingInfo,
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const filteredSelected = useMemo(() => {
    return selectedLeads.filter((l) => {
      if (selectedFilter === "Has Email" && !l.email) return false;
      if (selectedFilter === "Missing Info" && l.email) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${l.firstName || ""} ${l.lastName || ""} ${l.email || ""} ${
          l.company || ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [selectedLeads, selectedFilter, search]);

  const tabConfig = [
    {
      key: "static",
      label: `Static Lists (${staticLists.length})`,
      icon: Layers,
      lists: staticLists,
    },
    {
      key: "dynamic",
      label: `Dynamic Lists (${dynamicLists.length})`,
      icon: Zap,
      lists: dynamicLists,
    },
  ];

  const filterPills: { key: SelectedFilter; label: string; count: number }[] = [
    { key: "All", label: "All", count: selectedLeads.length },
    { key: "Has Email", label: "Has Email", count: withEmail },
    { key: "Missing Info", label: "Missing Info", count: missingInfo },
  ];

  return (
    <div className="max-w-[960px] mx-auto">
      {/* Stats bar — single card with sections */}
      <Card className="mb-3.5">
        <CardContent className="p-0 grid grid-cols-3">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="p-4 px-5 flex items-center gap-3"
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0",
                  bg
                )}
              >
                <Icon className={cn("h-4 w-4", color)} />
              </div>
              <div className="flex-1">
                <div className="text-[12.5px] text-muted">{label}</div>
                <div className={cn("text-xl font-semibold", color)}>{value}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* List selector */}
      <Card className="mb-6">
        <CardContent className="p-3.5 px-[18px] pt-3.5">
          <Tabs value={activeListTab} onValueChange={setActiveListTab}>
            <TabsList className="border-b border-border w-full justify-start rounded-none gap-0">
              {tabConfig.map((t) => (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:text-foreground -mb-px"
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </TabsTrigger>
              ))}
              <TabsTrigger
                value="selected"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:text-foreground -mb-px"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Selected ({selectedLeads.length})
              </TabsTrigger>
            </TabsList>

            {/* Static / Dynamic — list cards */}
            {tabConfig.map((t) => (
              <TabsContent key={t.key} value={t.key} className="mt-4">
                <p className="text-[12.5px] text-muted mb-3">
                  <strong className="text-foreground">Note:</strong> Selecting a list will
                  automatically include any leads added to that list in the future.
                </p>
                {t.lists.length === 0 ? (
                  <div className="py-6 text-center text-[13px] text-muted border border-dashed border-b2 rounded-lg">
                    No lists in this view.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 mb-1">
                    {t.lists.map((list) => {
                      const isSelected = selectedLists.has(list.id);
                      return (
                        <button
                          key={list.id}
                          onClick={() => toggleList(list.id)}
                          className={cn(
                            "border-[1.5px] rounded-lg p-[13px] px-[15px] cursor-pointer text-left transition-all relative",
                            isSelected ? "border-brand" : "border-b2 hover:border-indigo-300"
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-[11px] right-[11px] w-4 h-4 border-[1.5px] rounded-[3px] flex items-center justify-center",
                              isSelected ? "bg-brand border-brand" : "border-b2"
                            )}
                          >
                            {isSelected && (
                              <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                            )}
                          </div>
                          <div className="text-[13px] font-medium text-brand mb-1.5 pr-6">
                            {list.name}
                          </div>
                          <Badge
                            variant={list.type === "Dynamic" ? "default" : "secondary"}
                            className="rounded-md"
                          >
                            {list.type === "Dynamic" ? (
                              <Zap className="h-2.5 w-2.5" />
                            ) : (
                              <Layers className="h-2.5 w-2.5" />
                            )}
                            {list.type === "Dynamic" ? "Filtered Dynamic" : "Static"}
                          </Badge>
                          <div className="text-xs text-muted mt-1.5">{list.count} leads</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            ))}

            {/* Selected — search + filter pills + flat lead table */}
            <TabsContent value="selected" className="mt-4">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="relative flex-1 max-w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-light pointer-events-none" />
                  <Input
                    placeholder="Search leads…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <div className="flex gap-1.5">
                  {filterPills.map((p) => {
                    const active = selectedFilter === p.key;
                    return (
                      <button
                        key={p.key}
                        onClick={() => setSelectedFilter(p.key)}
                        className={cn(
                          "inline-flex items-center gap-1.5 py-[7px] px-3 rounded-md text-[12.5px] font-medium transition-colors border",
                          active
                            ? "bg-brand text-white border-brand"
                            : "bg-white text-muted border-b2 hover:bg-gray-50"
                        )}
                      >
                        {p.key === "Has Email" && (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        {p.key === "Missing Info" && (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {p.label} ({p.count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredSelected.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-muted border border-dashed border-b2 rounded-lg">
                  {selectedLeads.length === 0
                    ? "Select a Static or Dynamic list to add leads."
                    : "No leads match the current search or filter."}
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Owner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSelected.map((l) => {
                        const ownerMeta = getOwnerMeta(l.owner);
                        const dash = <span className="text-light">—</span>;
                        return (
                          <TableRow key={l.id}>
                            <TableCell className="font-medium">
                              {l.firstName || dash}
                            </TableCell>
                            <TableCell className="font-medium">
                              {l.lastName || dash}
                            </TableCell>
                            <TableCell>
                              {l.email ? (
                                <span className="text-muted">{l.email}</span>
                              ) : (
                                <span className="text-light italic">
                                  No email available
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{l.company || dash}</TableCell>
                            <TableCell>
                              {ownerMeta ? (
                                <div className="flex items-center gap-[7px]">
                                  <div
                                    className="w-6 h-6 rounded-full text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: ownerMeta.color }}
                                  >
                                    {ownerMeta.initials}
                                  </div>
                                  {ownerMeta.name}
                                </div>
                              ) : (
                                dash
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recipients preview — shown for Static / Dynamic tabs only */}
      {activeListTab !== "selected" && (
        <Card className="overflow-hidden mb-6">
          {listLeads.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-muted">
              Select a Static or Dynamic list above to preview its leads.
            </div>
          ) : (
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-[18px] w-10">
                    <Checkbox
                      checked={allListLeadsIncluded}
                      onCheckedChange={toggleAllListLeads}
                      aria-label="Select all leads"
                    />
                  </TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listLeads.map((l) => {
                  const ownerMeta = getOwnerMeta(l.owner);
                  const dash = <span className="text-light">—</span>;
                  const isIncluded = includedLeadIds.has(l.id);
                  return (
                    <TableRow
                      key={l.id}
                      data-state={isIncluded ? "selected" : undefined}
                      className={cn(!isIncluded && "opacity-60")}
                    >
                      <TableCell className="pl-[18px]">
                        <Checkbox
                          checked={isIncluded}
                          onCheckedChange={() => toggleLead(l.id)}
                          aria-label={`Include ${l.firstName || ""} ${l.lastName || ""}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{l.firstName || dash}</TableCell>
                      <TableCell className="font-medium">{l.lastName || dash}</TableCell>
                      <TableCell>
                        {l.email ? (
                          <span className="text-muted">{l.email}</span>
                        ) : (
                          <span className="text-light italic">No email available</span>
                        )}
                      </TableCell>
                      <TableCell>{l.company || dash}</TableCell>
                      <TableCell>
                        {ownerMeta ? (
                          <div className="flex items-center gap-[7px]">
                            <div
                              className="w-6 h-6 rounded-full text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: ownerMeta.color }}
                            >
                              {ownerMeta.initials}
                            </div>
                            {ownerMeta.name}
                          </div>
                        ) : (
                          dash
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
        <Button variant="outline" onClick={onPrev}>
          ← Previous
        </Button>
        <Button onClick={onNext}>Continue to Flow Builder →</Button>
      </div>
    </div>
  );
}
