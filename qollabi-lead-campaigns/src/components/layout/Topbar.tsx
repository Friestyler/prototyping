"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { PanelLeft } from "lucide-react";

const breadcrumbMap: Record<string, { items: { label: string; href?: string }[] }> = {
  "/customers": { items: [{ label: "Customers" }] },
  "/leads": { items: [{ label: "Leads" }] },
  "/campaigns": {
    items: [
      { label: "Campaigns", href: "/campaigns" },
      { label: "Campaigns" },
    ],
  },
  "/campaigns/create": {
    items: [
      { label: "Campaigns", href: "/campaigns" },
      { label: "New Campaign" },
    ],
  },
};

export default function Topbar() {
  const pathname = usePathname();
  const crumbs = breadcrumbMap[pathname] || breadcrumbMap["/customers"];

  return (
    <div className="bg-white border-b border-border h-[46px] flex items-center px-4 gap-2 flex-shrink-0">
      <button className="w-7 h-7 flex items-center justify-center cursor-pointer text-muted rounded">
        <PanelLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1.5 text-[13px] text-light flex-1">
        {crumbs.items.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-b2">/</span>}
            {item.href ? (
              <Link href={item.href} className="text-brand hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </div>

      <div className="w-[30px] h-[30px] rounded-full bg-gray-200 text-[11px] font-semibold text-gray-700 flex items-center justify-center ml-auto">
        KK
      </div>
    </div>
  );
}
