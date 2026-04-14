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
  MoreHorizontal,
  BarChart3,
  Trash2,
} from "lucide-react";
import { campaigns, campaignStats } from "@/data/campaigns";
import { templates } from "@/data/templates";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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

type Tab = "campaigns" | "templates";

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("campaigns");

  return (
    <div className="bg-white min-h-full">
      {/* Sub-tabs */}
      <div className="px-7 py-2.5 bg-white border-b border-border flex gap-2">
        {[
          { key: "campaigns" as Tab, label: "Campaigns", icon: Send },
          { key: "templates" as Tab, label: "Templates", icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "inline-flex items-center gap-1.5 py-[7px] px-3.5 rounded-lg text-[13px] font-medium transition-colors",
              activeTab === key
                ? "bg-brand-light text-brand"
                : "text-muted hover:bg-gray-50"
            )}
          >
            <Icon className="h-[13px] w-[13px]" />
            {label}
          </button>
        ))}
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
          <Button asChild>
            <Link href="/campaigns/create">
              <Plus className="h-[13px] w-[13px]" />
              {activeTab === "campaigns" ? "New campaign" : "New template"}
            </Link>
          </Button>
        </div>

        {/* Stats Cards (campaigns only) */}
        {activeTab === "campaigns" && (
          <div className="grid grid-cols-5 gap-3.5 mb-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 pt-4">
                    <div className="flex items-start justify-between mb-2.5">
                      <span className="text-[13px] text-muted">{stat.label}</span>
                      <div className="w-[30px] h-[30px] rounded-md bg-brand-light flex items-center justify-center">
                        <Icon className="h-3.5 w-3.5 text-brand" />
                      </div>
                    </div>
                    <div className="text-[22px] font-semibold">{stat.value}</div>
                  </CardContent>
                </Card>
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
                <Card key={t.id} className="hover:shadow-sm transition-shadow flex flex-col">
                  <CardContent className="p-4 pt-4 flex flex-col flex-1">
                    <div className="mb-2.5">
                      <div
                        className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: t.iconBg, color: t.iconColor }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="text-[14px] font-medium mb-1">{t.name}</div>
                    <p className="text-xs text-muted leading-relaxed mb-3.5 flex-1">
                      {t.description}
                    </p>
                    <div className="flex gap-2">
                      <Button asChild variant="default" size="sm" className="flex-1">
                        <Link href={`/campaigns/create?templateId=${t.id}`}>
                          <Send className="h-3 w-3" />
                          Use template
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Campaign table */}
        {activeTab === "campaigns" && (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Name</TableHead>
                  <TableHead>Target Group</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients (#)</TableHead>
                  <TableHead>Emails sent (#)</TableHead>
                  <TableHead className="w-10 pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => {
                  const Icon = iconMap[c.icon] || Mail;
                  const statusVariant: "success" | "default" | "secondary" =
                    c.status === "Active"
                      ? "success"
                      : c.status === "Complete"
                      ? "default"
                      : "secondary";
                  return (
                    <TableRow key={c.id} className="cursor-pointer">
                      <TableCell className="pl-5">
                        <Link
                          href={`/campaigns/create?campaignId=${c.id}`}
                          className="flex items-center gap-2.5 no-underline text-foreground"
                        >
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: c.iconBg, color: c.iconColor }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.targetGroup === "Leads" ? "default" : "secondary"}>
                          {c.targetGroup}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted">
                        {c.description || <span className="text-light">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant} className="border border-current/20">
                          <Pencil className="h-2.5 w-2.5" />
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.recipients}</TableCell>
                      <TableCell>{c.emailsSent}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/campaigns/create?campaignId=${c.id}`}
                                className="no-underline text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="h-3.5 w-3.5" />
                              View analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600">
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
