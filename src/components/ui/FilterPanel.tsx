"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Filter, FilterOperator } from "@/types";

interface FilterAttribute {
  value: string;
  label: string;
  operators: FilterOperator[];
}

interface FilterPanelProps {
  visible: boolean;
  attributes: FilterAttribute[];
  filters: Filter[];
  onAddFilter: (filter: Filter) => void;
  onRemoveFilter: (index: number) => void;
}

const allOperators: FilterOperator[] = [
  "contains",
  "does not contain",
  "is",
  "is not",
  "is empty",
  "is not empty",
];

export default function FilterPanel({
  visible,
  attributes,
  filters,
  onAddFilter,
  onRemoveFilter,
}: FilterPanelProps) {
  const [attr, setAttr] = useState("");
  const [op, setOp] = useState<FilterOperator>("contains");
  const [val, setVal] = useState("");

  if (!visible) return null;

  const selectedAttr = attributes.find((a) => a.value === attr);
  const operators = selectedAttr?.operators || allOperators;
  const needsValue = op !== "is empty" && op !== "is not empty";

  const handleAdd = () => {
    if (!attr) return;
    onAddFilter({ attribute: attr, operator: op, value: val });
    setVal("");
  };

  return (
    <div className="mx-7 my-3.5 bg-white border border-border rounded-[10px] p-4 shadow-sm">
      <div className="text-[13px] font-medium mb-3">Filters</div>
      <div className="flex items-center gap-2.5 mb-2">
        <select
          value={attr}
          onChange={(e) => {
            setAttr(e.target.value);
            setOp("contains");
          }}
          className="py-[7px] px-2.5 border border-b2 rounded-md font-sans text-[12.5px] text-gray-900 bg-white outline-none focus:border-brand"
        >
          <option value="">Select attribute...</option>
          {attributes.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <select
          value={op}
          onChange={(e) => setOp(e.target.value as FilterOperator)}
          className="py-[7px] px-2.5 border border-b2 rounded-md font-sans text-[12.5px] text-gray-900 bg-white outline-none focus:border-brand"
        >
          {operators.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {needsValue && (
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Value..."
            className="py-[7px] px-2.5 border border-b2 rounded-md font-sans text-[12.5px] text-gray-900 bg-white outline-none focus:border-brand"
          />
        )}
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-brand text-white border-none rounded-lg font-sans text-[12.5px] font-medium cursor-pointer hover:bg-brand-hover transition-colors"
        >
          Add
        </button>
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {filters.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-light text-brand rounded-md text-xs font-medium"
            >
              {f.attribute} {f.operator}
              {f.value ? ` "${f.value}"` : ""}
              <X
                className="w-3 h-3 cursor-pointer opacity-60 hover:opacity-100"
                onClick={() => onRemoveFilter(i)}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
