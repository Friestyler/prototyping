"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Download,
  Plus,
  Filter as FilterIcon,
  Search,
  X,
  MoreHorizontal,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  Zap,
  Layers,
} from "lucide-react";
import { leads, leadSmartLists } from "@/data/leads";
import { getOwnerMeta, users } from "@/data/users";
import { Filter, FilterOperator } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const smartListTabs = [
  { label: "Qollabi Templates", count: 0 },
  { label: "Offered Templates", count: 2 },
  { label: "Market Radar Templates", count: 0 },
  { label: "Saved Lists", count: 1 },
];

const filterAttributes = [
  {
    value: "firstName",
    label: "First Name",
    operators: ["contains", "does not contain", "is", "is not", "is empty", "is not empty"] as FilterOperator[],
  },
  {
    value: "lastName",
    label: "Last Name",
    operators: ["contains", "does not contain", "is", "is not", "is empty", "is not empty"] as FilterOperator[],
  },
  {
    value: "email",
    label: "Email",
    operators: ["contains", "does not contain", "is", "is not", "is empty", "is not empty"] as FilterOperator[],
  },
  {
    value: "company",
    label: "Company",
    operators: ["contains", "does not contain", "is", "is not", "is empty", "is not empty"] as FilterOperator[],
  },
  {
    value: "externalId",
    label: "External ID",
    operators: ["contains", "does not contain", "is", "is not", "is empty", "is not empty"] as FilterOperator[],
  },
  {
    value: "source",
    label: "Source",
    operators: ["contains", "does not contain", "is", "is not", "is empty", "is not empty"] as FilterOperator[],
  },
  {
    value: "attachmentLink",
    label: "Attachment Link",
    operators: ["is empty", "is not empty"] as FilterOperator[],
  },
  {
    value: "owner",
    label: "Owner",
    operators: ["is", "is not", "is empty", "is not empty"] as FilterOperator[],
  },
];

type SortKey = "firstName" | "lastName" | "email" | "company" | "attachmentLink" | "owner";
type SortDir = "asc" | "desc" | null;
type ListView = "cards" | "list";

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [draftAttribute, setDraftAttribute] = useState<string | undefined>();
  const [draftOperator, setDraftOperator] = useState<FilterOperator | undefined>();
  const [draftValue, setDraftValue] = useState("");
  const [activeListTab, setActiveListTab] = useState("Saved Lists");
  const [listView, setListView] = useState<ListView>("cards");
  const [modalOpen, setModalOpen] = useState(false);

  const perPage = 20;

  const getFieldValue = useCallback((lead: (typeof leads)[0], attr: string): string => {
    switch (attr) {
      case "firstName": return lead.firstName || "";
      case "lastName": return lead.lastName || "";
      case "email": return lead.email || "";
      case "company": return lead.company || "";
      case "externalId": return lead.externalId || "";
      case "source": return lead.source || "";
      case "attachmentLink": return lead.attachmentLink || "";
      case "owner": return lead.owner || "";
      default: return "";
    }
  }, []);

  const filtered = useMemo(() => {
    let data = [...leads];

    if (search) {
      const q = search.toLowerCase();
      data = data.filter((l) => {
        const first = (l.firstName || "").toLowerCase();
        const last = (l.lastName || "").toLowerCase();
        const fullName = `${first} ${last}`.trim();
        return fullName.includes(q) || first.includes(q) || last.includes(q);
      });
    }

    if (filters.length > 0) {
      data = data.filter((l) =>
        filters.every((f) => {
          const v = getFieldValue(l, f.attribute);
          const vl = v.toLowerCase();
          const fv = (f.value || "").toLowerCase();
          switch (f.operator) {
            case "contains": return vl.includes(fv);
            case "does not contain": return !vl.includes(fv);
            case "is": return vl === fv;
            case "is not": return vl !== fv;
            case "is empty": return !v;
            case "is not empty": return !!v;
            default: return true;
          }
        })
      );
    }

    if (sortKey && sortDir) {
      data.sort((a, b) => {
        const av = (a[sortKey as keyof typeof a] as string) || "";
        const bv = (b[sortKey as keyof typeof b] as string) || "";
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }

    return data;
  }, [search, filters, sortKey, sortDir, getFieldValue]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      const next: SortDir = sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc";
      setSortDir(next);
      if (next === null) setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleSelect = (idx: number) => {
    const next = new Set(selected);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === paginated.length && paginated.length > 0) setSelected(new Set());
    else setSelected(new Set(paginated.map((_, i) => i)));
  };

  const SortArrow = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="ml-1 inline h-3 w-3 opacity-30" />;
    return (
      <ChevronDown
        className={cn(
          "ml-1 inline h-3 w-3 text-brand transition-transform",
          sortDir === "asc" && "rotate-180"
        )}
      />
    );
  };

  const MutedDash = () => <span className="text-light">—</span>;

  const draftAttributeMeta = filterAttributes.find((a) => a.value === draftAttribute);

  const addDraftFilter = () => {
    if (!draftAttribute || !draftOperator) return;
    const needsValue = draftOperator !== "is empty" && draftOperator !== "is not empty";
    if (needsValue && !draftValue) return;
    setFilters([
      ...filters,
      { attribute: draftAttribute, operator: draftOperator, value: needsValue ? draftValue : "" },
    ]);
    setDraftAttribute(undefined);
    setDraftOperator(undefined);
    setDraftValue("");
    setPage(1);
  };

  const removeFilter = (idx: number) => {
    setFilters(filters.filter((_, i) => i !== idx));
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <div className="bg-white min-h-full">
      {/* Header */}
      <div className="px-7 pt-[22px] pb-[18px] flex items-start justify-between border-b border-gray-100">
        <h1 className="text-[22px] font-semibold">Leads</h1>
        <div className="flex gap-2.5 items-center">
          <Button variant="outline" size="sm">
            <Download className="h-[13px] w-[13px]" />
            Export leads as CSV
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-[13px] w-[13px]" />
            New lead
          </Button>
        </div>
      </div>

      {/* Smart list tabs row */}
      <div className="px-7 py-3 border-b border-border flex items-center gap-2 bg-white">
        <div className="flex gap-2 flex-1 flex-wrap">
          {smartListTabs.map((t) => (
            <button
              key={t.label}
              onClick={() => setActiveListTab(t.label)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg py-[7px] px-3.5 text-[13px] font-medium transition-colors",
                activeListTab === t.label
                  ? "bg-brand text-white"
                  : "bg-white border border-b2 text-foreground hover:bg-gray-50"
              )}
            >
              {t.label}
              <Badge
                variant={activeListTab === t.label ? "outline" : "secondary"}
                className={cn(
                  "rounded-full px-1.5 py-0 text-[11px]",
                  activeListTab === t.label && "bg-white/20 text-white border-transparent"
                )}
              >
                {t.count}
              </Badge>
            </button>
          ))}
        </div>
        <div className="inline-flex items-center rounded-lg border border-b2 bg-white p-0.5">
          <button
            onClick={() => setListView("cards")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md py-1.5 px-3 text-[12.5px] font-medium transition-colors",
              listView === "cards" ? "bg-brand text-white" : "text-muted hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </button>
          <button
            onClick={() => setListView("list")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md py-1.5 px-3 text-[12.5px] font-medium transition-colors",
              listView === "list" ? "bg-brand text-white" : "text-muted hover:text-foreground"
            )}
          >
            <ListIcon className="h-3.5 w-3.5" />
            List
          </button>
        </div>
      </div>

      <p className="px-7 py-2 text-[12.5px] text-muted bg-gray-50/50 border-b border-border">
        Selecting a list will automatically include any leads added to that list in the future.
      </p>

      {/* Saved Lists card grid */}
      {activeListTab === "Saved Lists" && (
        <div className="px-7 pt-4 pb-1 bg-white">
          <div className="grid grid-cols-3 gap-3.5">
            {leadSmartLists.length === 0 ? (
              <div className="col-span-3 py-8 text-center text-[13px] text-muted border border-dashed border-b2 rounded-lg">
                No saved lists yet.
              </div>
            ) : (
              leadSmartLists.map((list) => (
                <button
                  key={list.id}
                  className="text-left rounded-lg border border-border bg-white p-4 hover:border-brand hover:shadow-sm transition-all"
                >
                  <div className="text-[14px] font-semibold text-brand mb-2">{list.name}</div>
                  <Badge variant={list.type === "Dynamic" ? "default" : "secondary"} className="rounded-md">
                    {list.type === "Dynamic" ? (
                      <Zap className="h-2.5 w-2.5" />
                    ) : (
                      <Layers className="h-2.5 w-2.5" />
                    )}
                    {list.type === "Dynamic" ? "Filtered Dynamic" : "Static"}
                  </Badge>
                  <div className="text-xs text-muted mt-2">{list.count} leads</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="px-7 py-3.5 flex items-center gap-2.5 border-b border-border bg-white">
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-light pointer-events-none" />
          <Input
            placeholder="Lead name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <FilterIcon className="h-[13px] w-[13px]" />
              Filters
              {filters.length > 0 && (
                <Badge variant="default" className="ml-1 h-4 px-1.5 rounded-full">
                  {filters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={8} className="w-auto min-w-[640px] max-w-[860px] p-4">
            <div className="space-y-3">
              {filters.map((f, i) => {
                const meta = filterAttributes.find((a) => a.value === f.attribute);
                const showValue = f.operator !== "is empty" && f.operator !== "is not empty";
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-b2 bg-white px-3 py-2 text-[13px] min-w-[180px]">
                      <span className="font-medium text-foreground">{meta?.label || f.attribute}</span>
                      <ChevronDown className="ml-auto h-3.5 w-3.5 opacity-50" />
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-b2 bg-white px-3 py-2 text-[13px] min-w-[160px]">
                      <span className="text-muted">{f.operator}</span>
                      <ChevronDown className="ml-auto h-3.5 w-3.5 opacity-50" />
                    </div>
                    {showValue && (
                      <div className="rounded-lg border border-b2 bg-white px-3 py-2 text-[13px] min-w-[180px]">
                        {f.value || <span className="text-light">Value</span>}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted"
                      onClick={() => removeFilter(i)}
                      aria-label="Remove filter"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              {/* Draft row */}
              <div className="flex items-center gap-3">
                <Select
                  value={draftAttribute}
                  onValueChange={(v) => {
                    setDraftAttribute(v);
                    setDraftOperator(undefined);
                  }}
                >
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue placeholder="Select field…" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterAttributes.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={draftOperator}
                  onValueChange={(v) => setDraftOperator(v as FilterOperator)}
                  disabled={!draftAttributeMeta}
                >
                  <SelectTrigger className="min-w-[160px]">
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {(draftAttributeMeta?.operators || []).map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={draftValue}
                  onChange={(e) => setDraftValue(e.target.value)}
                  placeholder="Value"
                  disabled={
                    !draftOperator ||
                    draftOperator === "is empty" ||
                    draftOperator === "is not empty"
                  }
                  className="min-w-[180px]"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted opacity-0 pointer-events-none"
                  aria-hidden
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <button
                  className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-brand transition-colors"
                  type="button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add nested filter
                </button>
                <button
                  onClick={addDraftFilter}
                  disabled={!draftAttribute || !draftOperator}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[13px] transition-colors",
                    draftAttribute && draftOperator
                      ? "text-brand hover:text-brand-hover"
                      : "text-light cursor-not-allowed"
                  )}
                  type="button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add filter
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="px-7 py-2.5 flex items-center gap-3 border-b border-border bg-gray-900 text-white">
          <span className="text-[13px] font-medium">{selected.size} selected</span>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            Add to list
          </Button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-[12px] text-white/70 hover:text-white underline-offset-2 hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Data table */}
      <div className="bg-white">
        <Table className="min-w-[950px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-7 w-10">
                <Checkbox
                  checked={selected.size === paginated.length && paginated.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              {([
                { key: "firstName", label: "First Name" },
                { key: "lastName", label: "Last Name" },
                { key: "email", label: "Email" },
                { key: "company", label: "Company" },
                { key: "attachmentLink", label: "Attachment Link" },
                { key: "owner", label: "Owner" },
              ] as { key: SortKey; label: string }[]).map((col) => (
                <TableHead
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer select-none hover:text-foreground"
                >
                  {col.label}
                  <SortArrow col={col.key} />
                </TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center text-muted">
                  <div className="mb-2 text-base font-medium text-foreground">No leads found</div>
                  <p className="text-[13px]">Try adjusting your search or filters.</p>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((l, i) => {
                const ownerMeta = getOwnerMeta(l.owner);
                const linkLabel = l.attachmentLink
                  ? l.attachmentLink.split("/").pop() || l.attachmentLink
                  : "";
                const isChecked = selected.has(i);
                return (
                  <TableRow
                    key={l.id}
                    data-state={isChecked ? "selected" : undefined}
                    className="cursor-pointer"
                  >
                    <TableCell className="pl-7">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleSelect(i)}
                      />
                    </TableCell>
                    <TableCell>{l.firstName || <MutedDash />}</TableCell>
                    <TableCell>{l.lastName || <MutedDash />}</TableCell>
                    <TableCell className="text-muted">{l.email || <MutedDash />}</TableCell>
                    <TableCell>{l.company || <MutedDash />}</TableCell>
                    <TableCell>
                      {l.attachmentLink ? (
                        <a
                          href={l.attachmentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand hover:underline max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          <Download className="h-[11px] w-[11px] flex-shrink-0" />
                          {linkLabel}
                        </a>
                      ) : (
                        <MutedDash />
                      )}
                    </TableCell>
                    <TableCell className="pr-2">
                      {ownerMeta ? (
                        <div className="flex items-center gap-[7px]">
                          <div
                            className="w-6 h-6 rounded-full text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: ownerMeta.color }}
                          >
                            {ownerMeta.initials}
                          </div>
                          <span>{ownerMeta.name}</span>
                        </div>
                      ) : (
                        <MutedDash />
                      )}
                    </TableCell>
                    <TableCell className="pr-7">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit lead</DropdownMenuItem>
                          <DropdownMenuItem>Add to list</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600">
                            Delete lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="px-7 py-3.5 flex items-center justify-between border-t border-border bg-white">
        <span className="text-xs text-muted">
          Showing {filtered.length === 0 ? 0 : (page - 1) * perPage + 1}–
          {Math.min(page * perPage, filtered.length)} of {filtered.length} leads
        </span>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </Button>
          <Button variant="outline" size="sm" className="border-brand text-brand bg-brand-light">
            {page}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* New Lead Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create lead</DialogTitle>
            <DialogDescription>
              Add a new lead to your workspace. All fields are optional.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3.5">
            <div className="grid gap-[7px]">
              <Label htmlFor="externalId">External ID</Label>
              <Input id="externalId" placeholder="Optional external identifier" />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="grid gap-[7px]">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="First name" />
              </div>
              <div className="grid gap-[7px]">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Last name" />
              </div>
            </div>
            <div className="grid gap-[7px]">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@example.com" />
            </div>
            <div className="grid gap-[7px]">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Company name" />
            </div>
            <div className="grid gap-[7px]">
              <Label htmlFor="attachmentLink">Attachment Link</Label>
              <Input id="attachmentLink" type="url" placeholder="https://…" />
            </div>
            <div className="grid gap-[7px]">
              <Label>Owner</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner…" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.name} value={u.name}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Create lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
