"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Calendar,
  Send,
  ChevronDown,
  Clock,
} from "lucide-react";

const smartListItems = [
  { label: "Partners", href: "/customers" },
  { label: "Customers", href: "/customers" },
  { label: "Leads", href: "/leads" },
  { label: "Opportunities", href: "/customers" },
  { label: "Products", href: "/customers" },
  { label: "Contacts", href: "/customers" },
  { label: "Key Metric", href: "/customers" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string, label: string) => {
    if (label === "Leads") return pathname === "/leads";
    if (label === "Customers") return pathname === "/customers";
    return false;
  };

  const isCampaignsActive =
    pathname === "/campaigns" || pathname.startsWith("/campaigns/");

  return (
    <aside className="w-[232px] bg-white border-r border-border flex flex-col h-screen flex-shrink-0 overflow-y-auto">
      {/* Top */}
      <div className="px-4 py-2.5 border-b border-border">
        <span className="text-[13px] italic text-muted">u</span>
      </div>

      {/* Workspace selector */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border cursor-pointer hover:bg-gray-50">
        <div className="w-6 h-6 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
          <Clock className="w-[13px] h-[13px] text-brand" />
        </div>
        <span className="text-[13px] font-medium flex-1">Qollabi</span>
        <ChevronDown className="w-[11px] h-[11px] text-light" />
      </div>

      {/* Navigation */}
      <nav className="py-1.5 flex-1">
        {/* Broker Hub */}
        <Link
          href="/customers"
          className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 cursor-pointer transition-colors hover:bg-gray-50"
        >
          <LayoutGrid className="w-[15px] h-[15px] text-muted" />
          Broker Hub
        </Link>

        {/* Smart Lists section */}
        <div className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 cursor-pointer hover:bg-gray-50">
          <Calendar className="w-[15px] h-[15px] text-muted" />
          Smart Lists
          <ChevronDown className="w-[11px] h-[11px] text-light ml-auto" />
        </div>

        {/* Smart list sub-items */}
        {smartListItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`block py-1.5 px-4 pl-10 text-[13px] cursor-pointer transition-colors ${
              isActive(item.href, item.label)
                ? "bg-brand-light text-brand font-medium"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </Link>
        ))}

        <div className="h-px bg-gray-100 my-1" />

        {/* Campaigns */}
        <Link
          href="/campaigns"
          className={`flex items-center gap-2.5 px-4 py-2 text-[13px] cursor-pointer transition-colors ${
            isCampaignsActive
              ? "bg-brand-light text-brand font-medium"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Send
            className={`w-[15px] h-[15px] ${
              isCampaignsActive ? "text-brand" : "text-muted"
            }`}
          />
          Campaigns
        </Link>
      </nav>
    </aside>
  );
}
