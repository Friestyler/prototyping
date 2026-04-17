"use client";

import { useState, useMemo } from "react";
import { Download, Plus, SlidersHorizontal, Columns3, Filter } from "lucide-react";
import { customers, customerStats } from "@/data/customers";
import SmartListTabs from "@/components/ui/SmartListTabs";
import SearchInput from "@/components/ui/SearchInput";
import BulkBar from "@/components/ui/BulkBar";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";

const smartListTabs = [
  { label: "Qollabi Templates", count: 0 },
  { label: "Offered Templates", count: 1 },
  { label: "Market Radar Templates", count: 0 },
  { label: "Saved Lists", count: 7 },
];

type SortKey = "id" | "type" | "name" | "firstName" | "lastName" | "dateOfBirth";
type SortDir = "asc" | "desc" | null;

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const perPage = 10;

  const filtered = useMemo(() => {
    let data = [...customers];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (sortKey && sortDir) {
      data.sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return data;
  }, [search, sortKey, sortDir]);

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
      {/* Header */}
      <div className="px-7 pt-[22px] pb-[18px] flex items-start justify-between border-b border-gray-100">
        <div>
          <h1 className="text-[22px] font-semibold">Customers</h1>
          <p className="text-[13px] text-muted mt-1">
            Manage customers who collaborate with you on your initiatives.
          </p>
        </div>
        <div className="flex gap-2.5 items-center">
          <button className="inline-flex items-center gap-1.5 py-[7px] px-3.5 bg-white text-gray-900 border border-b2 rounded-lg font-sans text-[13px] font-medium cursor-pointer hover:bg-gray-50 transition-colors">
            <Download className="w-[13px] h-[13px]" />
            Export customers as CSV
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 py-2 px-[18px] bg-brand text-white border-none rounded-lg font-sans text-[13px] font-medium cursor-pointer hover:bg-brand-hover transition-colors"
          >
            <Plus className="w-[13px] h-[13px]" />
            New customer
          </button>
        </div>
      </div>

      {/* Smart List Tabs */}
      <SmartListTabs tabs={smartListTabs} />

      {/* Toolbar */}
      <div className="px-7 py-3.5 flex items-center gap-2.5 border-b border-border bg-white">
        <SearchInput
          placeholder="Customer name"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          className="min-w-[240px]"
        />
        <button className="inline-flex items-center gap-1.5 py-[7px] px-[13px] rounded-lg text-[13px] font-medium text-gray-700 bg-white border border-b2 cursor-pointer hover:bg-gray-50 transition-all font-sans">
          <SlidersHorizontal className="w-[13px] h-[13px] text-muted" />
          View
        </button>
        <button className="inline-flex items-center gap-1.5 py-[7px] px-[13px] rounded-lg text-[13px] font-medium text-gray-700 bg-white border border-b2 cursor-pointer hover:bg-gray-50 transition-all font-sans">
          <Filter className="w-[13px] h-[13px] text-muted" />
          Filters
        </button>
        <button className="inline-flex items-center gap-1.5 py-[7px] px-[13px] rounded-lg text-[13px] font-medium text-gray-700 bg-white border border-b2 cursor-pointer hover:bg-gray-50 transition-all font-sans">
          <Columns3 className="w-[13px] h-[13px] text-muted" />
          Columns
        </button>
        <button className="inline-flex items-center gap-1.5 py-[7px] px-[13px] rounded-lg text-[13px] font-medium text-gray-700 bg-white border border-b2 cursor-pointer hover:bg-gray-50 transition-all font-sans">
          Products
        </button>
      </div>

      {/* Bulk Bar */}
      <BulkBar
        count={selected.size}
        entityName="customer"
        onClear={() => setSelected(new Set())}
        visible={selected.size > 0}
      />

      {/* Stats Bar */}
      <div className="px-7 py-[11px] flex items-center text-[13px] border-b border-border bg-white">
        <div className="flex items-center gap-1">
          Total Customers
          <span className="font-semibold text-gray-900 ml-1">
            {customerStats.totalCustomers.toLocaleString()}
          </span>
        </div>
        <span className="text-b2 mx-4">|</span>
        <div className="flex items-center gap-1">
          Total Opportunities
          <span className="font-semibold text-gray-900 ml-1">{customerStats.totalOpportunities}</span>
        </div>
        <span className="text-b2 mx-4">|</span>
        <div className="flex items-center gap-1">
          Total Value Opportunities
          <span className="font-semibold text-gray-900 ml-1">{customerStats.totalValueOpportunities}</span>
        </div>
        <span className="text-b2 mx-4">|</span>
        <div className="flex items-center gap-1">
          Weighted Value Opportunities
          <span className="font-semibold text-gray-900 ml-1">
            {customerStats.weightedValueOpportunities}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white">
        <table className="w-full border-collapse">
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
                { key: "id" as SortKey, label: "Customer ID" },
                { key: "type" as SortKey, label: "Customer Type" },
                { key: "name" as SortKey, label: "Customer" },
                { key: "firstName" as SortKey, label: "First Name" },
                { key: "lastName" as SortKey, label: "Last Name" },
                { key: "dateOfBirth" as SortKey, label: "Date of Birth" },
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
            {paginated.map((c, i) => (
              <tr
                key={i}
                className="border-b border-gray-50 cursor-pointer hover:bg-gray-50/50 transition-colors"
              >
                <td className="pl-7 pr-3.5 py-[13px]">
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggleSelect(i)}
                  />
                </td>
                <td className="px-3.5 py-[13px] text-[13px]">
                  {c.id === "-" ? <MutedDash /> : c.id}
                </td>
                <td className="px-3.5 py-[13px] text-[13px]">
                  {c.type === "-" ? <MutedDash /> : c.type}
                </td>
                <td className="px-3.5 py-[13px] text-[13px] text-brand font-medium">
                  {c.name}
                </td>
                <td className="px-3.5 py-[13px] text-[13px]">
                  {c.firstName === "-" ? <MutedDash /> : c.firstName}
                </td>
                <td className="px-3.5 py-[13px] text-[13px]">
                  {c.lastName === "-" ? <MutedDash /> : c.lastName}
                </td>
                <td className="px-3.5 py-[13px] text-[13px] pr-7">
                  {c.dateOfBirth === "-" ? <MutedDash /> : c.dateOfBirth}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        total={filtered.length > 10 ? customerStats.totalCustomers : filtered.length}
        page={page}
        perPage={perPage}
        entityName="customers"
        onPageChange={setPage}
      />

      {/* New Customer Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Customer"
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
              Create Customer
            </button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-[13px] font-medium mb-[7px]">
              Customer Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Customer name"
              className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(91,91,214,0.08)]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-[7px]">Customer Type</label>
            <select className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand bg-white">
              <option value="">Select type...</option>
              <option>Individual</option>
              <option>Company</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-[7px]">First Name</label>
            <input type="text" placeholder="First name" className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand" />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-[7px]">Last Name</label>
            <input type="text" placeholder="Last name" className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand" />
          </div>
          <div>
            <label className="block text-[13px] font-medium mb-[7px]">Date of Birth</label>
            <input type="date" className="w-full py-[9px] px-[13px] border border-b2 rounded-lg font-sans text-[13px] outline-none focus:border-brand" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
