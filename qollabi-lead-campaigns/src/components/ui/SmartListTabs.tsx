"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";

interface Tab {
  label: string;
  count: number;
}

interface SmartListTabsProps {
  tabs: Tab[];
  note?: string;
}

export default function SmartListTabs({ tabs, note }: SmartListTabsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [view, setView] = useState<"cards" | "list">("cards");

  return (
    <>
      <div className="px-7 pt-3.5 border-b border-border flex items-center justify-between bg-white">
        <div className="flex gap-2">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer border transition-all whitespace-nowrap ${
                activeTab === i
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-gray-700 border-b2 hover:border-brand hover:text-brand"
              }`}
            >
              {tab.label}
              <span
                className={`text-[11px] font-semibold px-1.5 rounded-[10px] min-w-[18px] text-center ${
                  activeTab === i
                    ? "bg-white/25"
                    : "bg-gray-100 text-muted"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex border border-b2 rounded-lg overflow-hidden mb-px">
          <button
            onClick={() => setView("cards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium cursor-pointer border-none transition-all ${
              view === "cards"
                ? "bg-brand text-white"
                : "bg-white text-muted hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <LayoutGrid className="w-[13px] h-[13px]" />
            Cards
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium cursor-pointer border-none transition-all ${
              view === "list"
                ? "bg-brand text-white"
                : "bg-white text-muted hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <List className="w-[13px] h-[13px]" />
            List
          </button>
        </div>
      </div>
      <div className="py-9 px-7 flex items-center justify-center border-b border-border bg-white">
        <span className="text-[13px] text-light">No smart lists available</span>
      </div>
      {note && (
        <div className="px-7 py-1 text-[12px] text-muted border-b border-border bg-gray-50/50">
          {note}
        </div>
      )}
    </>
  );
}
