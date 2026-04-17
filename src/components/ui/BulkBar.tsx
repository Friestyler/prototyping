"use client";

import { Plus } from "lucide-react";

interface BulkBarProps {
  count: number;
  entityName: string;
  onClear: () => void;
  visible: boolean;
}

export default function BulkBar({ count, entityName, onClear, visible }: BulkBarProps) {
  if (!visible) return null;

  const label = count === 1 ? entityName : `${entityName}s`;

  return (
    <div className="flex items-center gap-3 bg-gray-800 text-white px-7 py-2.5 text-[13px]">
      <span>
        {count} {label} selected
      </span>
      <button className="flex items-center gap-1.5 py-1 px-3 rounded-md bg-white/10 text-white border-none font-sans text-[12.5px] cursor-pointer hover:bg-white/[0.18] transition-colors">
        <Plus className="w-3 h-3" />
        Add to list
      </button>
      <span
        className="ml-auto opacity-60 cursor-pointer text-xs hover:opacity-100 transition-opacity"
        onClick={onClear}
      >
        Clear selection
      </span>
    </div>
  );
}
