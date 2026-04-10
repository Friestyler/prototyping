"use client";

import { useState, useMemo, useCallback } from "react";
import { Download, Plus, Filter as FilterIcon } from "lucide-react";
import { leads } from "@/data/leads";
import { Filter, FilterOperator } from "@/types";
import SmartListTabs from "@/components/ui/SmartListTabs";
import SearchInput from "@/components/ui/SearchInput";
import BulkBar from "@/components/ui/BulkBar";
import FilterPanel from "@/components/ui/FilterPanel";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";

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
    value: "offerPdf",
    label: "Offer PDF",
    operators: ["is empty", "is not empty"] as FilterOperator[],
  },
  {
    value: "owner",
    label: "Owner",
    operators: ["is", "is not", "is empty", "is not empty"] as FilterOperator[],
  },
];

type SortKey = "fullName" | "firstName" | "lastName" | "email" | "company" | "offerPdfName" | "owner";
type SortDir = "asc" | "desc" | null;

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const perPage = 20;

  const getFieldValue = useCallback((lead: (typeof leads)[0], attr: string): string => {
    switch (attr) {
      case "firstName": return lead.firstName;
      case "lastName": return lead.lastName;
      case "email": return lead.email;
      case "company": return lead.company;
      case "externalId": return lead.externalId || "";
      case "offerPdf": return lead.offerPdfLink;
      case "owner": return lead.owner;
      default: return "";
    }
  }, []);

  const filtered = useMemo(() => {
    let data = [...leads];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((l) => {
        const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
        return fullName.includes(q) || l.firstName.toLowerCase().includes(q) || l.lastName.toLowerCase().includes(q);
      });
    }

    // Advanced filters
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

    // Sorting
    if (sortKey && sortDir) {
      data.sort((a, b) => {
        let av = "", bv = "";
        if (sortKey === "fullName") {
          av = `${a.firstName} ${a.lastName}`;
          bv = `${b.firstName} ${b.lastName}`;
        } else if (sortKey === "offerPdfName") {
          av = a.offerPdfName;
          bv = b.offerPdfName;
        } else {
          av = a[sortKey as keyof typeof a] as string || "";
          bv = b[sortKey as keyof typeof b] as string || "";
        }
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }

    return data;
  }, [search, filters, sortKey, sortDir, getFieldValue]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
      if (sortDir === "desc") setSortKey(null);
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
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((_, i) => i)));
    }
  };

  const SortArrows = ({ col }: { col: SortKey }) => (
    <span className={`sort-arrows ${sortKey === col ? sortDir : ""}`}>
      <span className="up" />
      <span className="down" />
    </span>
  );

  const MutedDash = () => <span className="text-light">&ndash;</span>;

  return (
    <div className="bg-white min-h-full">
      {/* Header — no subtitle per epic */}
      <div className="px-7 pt-[22px] pb-[18px] flex items-start justify-between border-b border-gray-100">
        <div>
          <h1 className="text-[22px] font-semibold">Leads</h1>
        </div>
        <div className="flex gap-2.5 items-center">
          <button className="inline-flex items-center gap-1.5 py-[7px] px-3.5 bg-white text-gray-900 border border-b2 rounded-lg font-sans text-[13px] font-medium cursor-pointer hover:bg-gray-50 transition-colors">
            <Download className="w-[13px] h-[13px]" />
            Export leads as CSV
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 py-2 px-[18px] bg-brand text-white border-none rounded-lg font-sans text-[13px] font-medium cursor-pointer hover:bg-brand-hover transition-colors"
          >
            <Plus className="w-[13px] h-[13px]" />
            New lead
          </button>
        </div>
      </div>

      {/* Smart List Tabs */}
      <SmartListTabs
        tabs={smartListTabs}
        note="Selecting a list will automatically include any leads added to that list in the future."
      />

      {/* Toolbar */}
      <div className="px-7 py-3.5 flex items-center gap-2.5 border-b border-border bg-white">
        <SearchInput
          placeholder="Lead name"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          className="min-w-[220px]"
        />
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={`inline-flex items-center gap-1.5 py-[7px] px-[13px] rounded-lg text-[13px] font-medium bg-white border cursor-pointer transition-all font-sans ${
            filterOpen
              ? "text-brand border-brand bg-brand-light"
              : "text-gray-700 border-b2 hover:bg-gray-50"
          }`}
        >
          <FilterIcon className="w-[13px] h-[13px]" />
          Filters
          {filters.length > 0 && (
            <span className="ml-1 text-[11px] bg-brand text-white px-1.5 rounded-full font-semibold">
              {filters.length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        visible={filterOpen}
        attributes={filterAttributes}
        filters={filters}
        onAddFilter={(f) => {
          setFilters([...filters, f]);
          setPage(1);
        }}
        onRemoveFilter={(i) => {
          setFilters(filters.filter((_, idx) => idx !== i));
          setPage(1);
        }}
      />

      {/* Bulk Bar */}
      <BulkBar
        count={selected.size}
        entityName="lead"
        onClear={() => setSelected(new Set())}
        visible={selected.size > 0}
      />

      {/* No Stats Bar for Leads (per epic) */}

      {/* Data Table */}
      <div className="bg-white overflow-x-auto">
        <table className="w-full border-collapse min-w-[950px]">
          <thead>
            <tr>
              <th className="pl-7 pr-3.5 py-2.5 text-xs font-medium text-muted text-left border-b border-gray-100 w-10 bg-white">
                <input
                  type="checkbox"
                  checked={selected.size === paginated.length && paginated.length > 0}
                  onChange={toggleAll}
                />
              </th>
              {[
                { key: "fullName" as SortKey, label: "Lead" },
                { key: "firstName" as SortKey, label: "First Name" },
                { key: "lastName" as SortKey, label: "Last Name" },
                { key: "email" as SortKey, label: "Email" },
                { key: "company" as SortKey, label: "Company" },
                { key: "offerPdfName" as SortKey, label: "Offer PDF" },
                { key: "owner" as SortKey, label: "Owner" },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3.5 py-2.5 text-xs font-medium text-muted text-left border-b border-gray-100 whitespace-nowrap bg-white cursor-pointer select-none hover:text-gray-700"
                >
                  {col.label}
                  <SortArrows col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-muted text-[13px]">
                  <div className="mb-2 text-base font-medium text-gray-900">No leads found</div>
                  <p>Try adjusting your search or filters.</p>
                </td>
              </tr>
            ) : (
              paginated.map((l, i) => {
                const fullName = `${l.firstName} ${l.lastName}`.trim();
                return (
                  <tr
                    key={l.id}
                    className="border-b border-gray-50 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="pl-7 pr-3.5 py-[13px]">
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggleSelect(i)}
                      />
                    </td>
                    <td className="px-3.5 py-[13px] text-[13px] text-brand font-medium">
                      {fullName || <MutedDash />}
                    </td>
                    <td className="px-3.5 py-[13px] text-[13px]">
                      {l.firstName || <MutedDash />}
                    </td>
                    <td className="px-3.5 py-[13px] text-[13px]">
                      {l.lastName || <MutedDash />}
                    </td>
                    <td className="px-3.5 py-[13px] text-[13px] text-muted">
                      {l.email || <MutedDash />}
                    </td>
                    <td className="px-3.5 py-[13px] text-[13px]">
                      {l.company || <MutedDash />}
                    </td>
                    <td className="px-3.5 py-[13px] text-[13px]">
                      {l.offerPdfName ? (
                        <a
                          href={l.offerPdfLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand hover:underline max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          <Download className="w-[11px] h-[11px] flex-shrink-0" />
                          {l.offerPdfName}
                        </a>
                      ) : (
                        <MutedDash />
                      )}
                    </td>
                    <td className="px-3.5 py-[13px] text-[13px] pr-7">
                      {l.owner ? (
                        <div className="flex items-center gap-[7px]">
                          <div
                            className="w-6 h-6 rounded-full text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: l.ownerColor }}
                          >
                            {l.ownerInitials}
                          </div>
                          <span>{l.owner}</span>
                        </div>
                      ) : (
                        <MutedDash />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        total={filtered.length}
        page={page}
        perPage={perPage}
        entityName="leads"
        onPageChange={setPage}
      />

      {/* New Lead Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Lead"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="inline-flex items-center gap-1.5 py-[7px] px-3.5 bg-white text-gray-900 border border-b2 rounded-lg font-sans text-[13px] font-medium cursor-pointer hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="inline-flex items-center gap-1.5 py-2 px-[18px] bg-brand text-white border-none rounded-lg font-sans text-[13px] font-medium cursor-pointer hover:bg-brand-hover"
            >
              Create Lead
            </button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-[13px] font-medium mb-[7px]">External ID</label>
            <input type="text" placeholder="Optional external identifier" className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(91,91,214,0.08)]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-[7px]">First Name</label>
            <input type="text" placeholder="First name" className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(91,91,214,0.08)]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-[7px]">Last Name</label>
            <input type="text" placeholder="Last name" className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(91,91,214,0.08)]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-[7px]">Email</label>
            <input type="email" placeholder="email@example.com" className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(91,91,214,0.08)]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-[7px]">Company</label>
            <input type="text" placeholder="Company name" className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(91,91,214,0.08)]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-[7px]">Offer PDF Link</label>
            <input type="url" placeholder="https://..." className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(91,91,214,0.08)]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-[7px]">Owner</label>
            <select className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand bg-white">
              <option value="">Select owner...</option>
              <option value="kk">Kevin Kools</option>
              <option value="rr">Raciel Rodriguez</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
