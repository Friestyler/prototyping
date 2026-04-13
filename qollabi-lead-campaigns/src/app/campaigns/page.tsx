"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Send,
  FileText,
  Plus,
  Mail,
  TrendingUp,
  Eye,
  MousePointer,
  Star,
  CheckSquare,
  Pencil,
} from "lucide-react";
import { campaigns, campaignStats } from "@/data/campaigns";
import { templates } from "@/data/templates";

const statCards = [
  { label: "Emails Sent", value: campaignStats.emailsSent, icon: Mail },
  { label: "Active Campaigns", value: campaignStats.activeCampaigns, icon: Send },
  { label: "Avg Engagement Rate", value: campaignStats.avgEngagementRate, icon: TrendingUp },
  { label: "Open Rate", value: campaignStats.openRate, icon: Eye },
  { label: "Click Rate", value: campaignStats.clickRate, icon: MousePointer },
];

const iconMap: Record<string, typeof Star> = {
  check: CheckSquare,
  star: Star,
  text: FileText,
  mail: Mail,
};

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "templates">("campaigns");

  return (
    <div className="bg-white min-h-full">
      {/* Sub-tabs */}
      <div className="px-7 py-2.5 bg-white border-b border-border flex gap-2">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`inline-flex items-center gap-1.5 py-[7px] px-3.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all ${
            activeTab === "campaigns"
              ? "bg-brand-light text-brand"
              : "text-muted hover:bg-gray-50"
          }`}
        >
          <Send className="w-[13px] h-[13px]" />
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`inline-flex items-center gap-1.5 py-[7px] px-3.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all ${
            activeTab === "templates"
              ? "bg-brand-light text-brand"
              : "text-muted hover:bg-gray-50"
          }`}
        >
          <FileText className="w-[13px] h-[13px]" />
          Templates
        </button>
      </div>

      <div className="p-7">
        {/* Page header */}
        <div className="flex items-start justify-between pb-5">
          <div>
            <h1 className="text-[22px] font-semibold">
              {activeTab === "campaigns" ? "Campaigns" : "Templates"}
            </h1>
            <p className="text-[13px] text-muted mt-1">
              {activeTab === "campaigns"
                ? "Campaigns let you manage your campaigns for better management and quick access."
                : "Reusable campaign templates with pre-configured target groups and email flows."}
            </p>
          </div>
          <Link
            href="/campaigns/create"
            className="inline-flex items-center gap-1.5 py-2 px-[18px] bg-brand text-white border-none rounded-lg font-sans text-[13px] font-medium cursor-pointer hover:bg-brand-hover transition-colors no-underline"
          >
            <Plus className="w-[13px] h-[13px]" />
            New campaign
          </Link>
        </div>

        {/* Stats Cards (campaigns only) */}
        {activeTab === "campaigns" && (
          <div className="grid grid-cols-5 gap-3.5 mb-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white border border-border rounded-[10px] p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <span className="text-[13px] text-muted">{stat.label}</span>
                    <div className="w-[30px] h-[30px] rounded-[7px] bg-brand-light flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-brand" />
                    </div>
                  </div>
                  <div className="text-[22px] font-semibold">{stat.value}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Templates grid */}
        {activeTab === "templates" && (
          <div className="grid grid-cols-3 gap-3.5 mb-6">
            {templates.map((t) => {
              const Icon = iconMap[t.icon] || Mail;
              return (
                <div
                  key={t.id}
                  className="bg-white border border-border rounded-[10px] p-4 hover:shadow-sm transition-shadow flex flex-col"
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div
                      className="w-9 h-9 rounded-[7px] flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: t.iconBg, color: t.iconColor }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`inline-flex items-center text-[11.5px] font-medium px-2.5 py-0.5 rounded-full ${
                        t.targetGroup === "Leads"
                          ? "bg-brand-light text-brand"
                          : "bg-gray-100 text-muted"
                      }`}
                    >
                      {t.targetGroup}
                    </span>
                  </div>
                  <div className="text-[14px] font-medium mb-1">{t.name}</div>
                  <p className="text-xs text-muted leading-relaxed mb-3.5 flex-1">
                    {t.description}
                  </p>
                  <Link
                    href={`/campaigns/create?templateId=${t.id}`}
                    className="inline-flex items-center justify-center gap-1.5 py-[7px] px-3.5 bg-white text-gray-900 border border-b2 rounded-lg font-sans text-[12.5px] font-medium cursor-pointer hover:bg-gray-50 transition-colors no-underline"
                  >
                    Use template
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Campaign table */}
        {activeTab === "campaigns" && (
        <div className="bg-white border border-border rounded-[10px] overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="pl-5 pr-4 py-2.5 text-xs font-medium text-muted text-left border-b border-gray-100 whitespace-nowrap">
                  Name
                  <span className="sort-arrows ml-1">
                    <span className="up" />
                    <span className="down" />
                  </span>
                </th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted text-left border-b border-gray-100 whitespace-nowrap">
                  Target Group
                </th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted text-left border-b border-gray-100 whitespace-nowrap">
                  Description
                </th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted text-left border-b border-gray-100 whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted text-left border-b border-gray-100 whitespace-nowrap">
                  Recipients (#)
                </th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted text-left border-b border-gray-100 whitespace-nowrap">
                  Emails Sent (#)
                </th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const Icon = iconMap[c.icon] || Mail;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="pl-5 pr-4 py-[13px] text-[13px]">
                      <Link
                        href="/campaigns/create"
                        className="flex items-center gap-2.5 no-underline text-gray-900"
                      >
                        <div
                          className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: c.iconBg, color: c.iconColor }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-[13px] text-[13px]">
                      <span
                        className={`inline-flex items-center text-[11.5px] font-medium px-2.5 py-0.5 rounded-full ${
                          c.targetGroup === "Leads"
                            ? "bg-brand-light text-brand"
                            : "bg-gray-100 text-muted"
                        }`}
                      >
                        {c.targetGroup}
                      </span>
                    </td>
                    <td className="px-4 py-[13px] text-[13px] text-muted">
                      {c.description || <span className="text-light">&ndash;</span>}
                    </td>
                    <td className="px-4 py-[13px] text-[13px]">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-0.5 rounded-full border ${
                          c.status === "Active"
                            ? "bg-green-50 text-green-600 border-green-200"
                            : c.status === "Complete"
                            ? "bg-brand-light text-brand border-indigo-200"
                            : "bg-gray-100 text-muted border-b2"
                        }`}
                      >
                        <Pencil className="w-[10px] h-[10px]" />
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-[13px] text-[13px]">{c.recipients}</td>
                    <td className="px-4 py-[13px] text-[13px]">{c.emailsSent}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
