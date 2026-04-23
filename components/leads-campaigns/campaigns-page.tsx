"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { campaigns as seedCampaigns, campaignStats } from "@/lib/lc-data/campaigns";
import { templates as seedTemplates } from "@/lib/lc-data/templates";
import CampaignWizard from "@/components/leads-campaigns/campaign-wizard";
import CampaignAnalytics from "@/components/leads-campaigns/campaign-analytics";
import NewTemplateDialog from "@/components/leads-campaigns/new-template-dialog";
import {
  USER_CAMPAIGNS_CHANGE_EVENT,
  deleteUserCampaign,
  deleteUserCampaignTemplate,
  loadUserCampaignTemplates,
  loadUserCampaigns,
  type UserCampaign,
  type UserCampaignTemplate,
} from "@/lib/user-campaigns";

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
import { useToast } from "@/hooks/use-toast";
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

interface WizardState {
  templateId?: string;
  campaignId?: string;
  initialName?: string;
  initialCampaign?: import("@/components/leads-campaigns/campaign-wizard").WizardInitialCampaign;
}

interface CampaignsPageProps {
  initialCampaignName?: string;
  onInitialConsumed?: () => void;
}

interface DisplayedCampaign {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  targetGroup: "Customers" | "Leads";
  description: string;
  status: string;
  recipients: number;
  emailsSent: number;
  isUserCreated: boolean;
}

interface DisplayedTemplate {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  targetGroup: "Customers" | "Leads";
  description: string;
  isUserCreated: boolean;
}

export default function CampaignsPage({ initialCampaignName, onInitialConsumed }: CampaignsPageProps = {}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("campaigns");
  const [wizard, setWizard] = useState<WizardState | null>(null);
  const [analyticsCampaignId, setAnalyticsCampaignId] = useState<string | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [userCampaigns, setUserCampaigns] = useState<UserCampaign[]>([]);
  const [userTemplates, setUserTemplates] = useState<UserCampaignTemplate[]>([]);

  const refresh = useCallback(async () => {
    const [c, t] = await Promise.all([loadUserCampaigns(), loadUserCampaignTemplates()]);
    setUserCampaigns(c);
    setUserTemplates(t);
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(USER_CAMPAIGNS_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(USER_CAMPAIGNS_CHANGE_EVENT, onChange);
  }, [refresh]);

  useEffect(() => {
    if (initialCampaignName) {
      setWizard({ initialName: initialCampaignName });
      onInitialConsumed?.();
    }
  }, [initialCampaignName, onInitialConsumed]);

  const openEditWizard = useCallback(
    (c: DisplayedCampaign) => {
      setWizard({
        campaignId: c.id,
        initialCampaign: {
          id: c.id,
          name: c.name,
          description: c.description ?? "",
          targetGroup: c.targetGroup,
          sentCount: c.emailsSent,
        },
      });
    },
    [],
  );

  const handleWizardClose = useCallback(() => {
    setWizard(null);
    refresh();
  }, [refresh]);

  // Merge API rows + static seed. User-created appear first.
  const allCampaigns: DisplayedCampaign[] = useMemo(() => {
    const fromUser: DisplayedCampaign[] = userCampaigns.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      iconBg: c.iconBg,
      iconColor: c.iconColor,
      targetGroup: c.targetGroup,
      description: c.description,
      status: c.status,
      recipients: c.recipientIds.length,
      emailsSent: 0,
      isUserCreated: true,
    }));
    const fromSeed: DisplayedCampaign[] = seedCampaigns.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      iconBg: c.iconBg,
      iconColor: c.iconColor,
      targetGroup: c.targetGroup,
      description: c.description,
      status: c.status,
      recipients: c.recipients,
      emailsSent: c.emailsSent,
      isUserCreated: false,
    }));
    return [...fromUser, ...fromSeed];
  }, [userCampaigns]);

  const allTemplates: DisplayedTemplate[] = useMemo(() => {
    const fromUser: DisplayedTemplate[] = userTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      iconBg: t.iconBg,
      iconColor: t.iconColor,
      targetGroup: t.targetGroup,
      description: t.description,
      isUserCreated: true,
    }));
    const fromSeed: DisplayedTemplate[] = seedTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      iconBg: t.iconBg,
      iconColor: t.iconColor,
      targetGroup: t.targetGroup,
      description: t.description,
      isUserCreated: false,
    }));
    return [...fromUser, ...fromSeed];
  }, [userTemplates]);

  const handleDeleteCampaign = async (c: DisplayedCampaign) => {
    if (!c.isUserCreated) {
      toast({ title: "Built-in campaigns can't be deleted." });
      return;
    }
    const ok = await deleteUserCampaign(c.id);
    toast({ title: ok ? "Campaign deleted" : "Couldn't delete campaign" });
  };

  const handleDeleteTemplate = async (t: DisplayedTemplate) => {
    if (!t.isUserCreated) {
      toast({ title: "Built-in templates can't be deleted." });
      return;
    }
    const ok = await deleteUserCampaignTemplate(t.id);
    toast({ title: ok ? "Template deleted" : "Couldn't delete template" });
  };

  if (wizard) {
    return (
      <CampaignWizard
        templateId={wizard.templateId}
        campaignId={wizard.campaignId}
        initialCampaign={wizard.initialCampaign}
        initialName={wizard.initialName}
        onBack={handleWizardClose}
      />
    );
  }

  if (analyticsCampaignId) {
    const c = allCampaigns.find((x) => x.id === analyticsCampaignId);
    if (c) {
      return (
        <CampaignAnalytics
          campaign={{
            id: c.id,
            name: c.name,
            status: c.status,
            recipients: c.recipients,
          }}
          onBack={() => setAnalyticsCampaignId(null)}
        />
      );
    }
  }

  return (
    <div className="bg-white min-h-full">
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
                : "text-muted-foreground hover:bg-gray-50"
            )}
          >
            <Icon className="h-[13px] w-[13px]" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-7">
        <div className="flex items-start justify-between pb-5">
          <div>
            <h1 className="text-[22px] font-semibold">
              {activeTab === "campaigns" ? "Campaigns" : "Templates"}
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              {activeTab === "campaigns"
                ? "Campaigns let you manage your campaigns for better management and quick access."
                : "Reusable campaign templates with pre-configured target groups and email flows."}
            </p>
          </div>
          {activeTab === "campaigns" ? (
            <Button onClick={() => setWizard({})}>
              <Plus className="h-[13px] w-[13px]" />
              New campaign
            </Button>
          ) : (
            <Button onClick={() => setShowNewTemplate(true)}>
              <Plus className="h-[13px] w-[13px]" />
              New template
            </Button>
          )}
        </div>

        {activeTab === "campaigns" && (
          <div className="grid grid-cols-5 gap-3.5 mb-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 pt-4">
                    <div className="flex items-start justify-between mb-2.5">
                      <span className="text-[13px] text-muted-foreground">{stat.label}</span>
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

        {activeTab === "templates" && (
          <div className="grid grid-cols-3 gap-3.5 mb-6">
            {allTemplates.map((t) => {
              const Icon = iconMap[t.icon] || Mail;
              return (
                <Card key={t.id} className="hover:shadow-sm transition-shadow flex flex-col">
                  <CardContent className="p-4 pt-4 flex flex-col flex-1">
                    <div className="mb-2.5 flex items-start justify-between">
                      <div
                        className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: t.iconBg, color: t.iconColor }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {t.isUserCreated && (
                        <Badge variant="secondary" className="text-[10px]">
                          Yours
                        </Badge>
                      )}
                    </div>
                    <div className="text-[14px] font-medium mb-1">{t.name}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3.5 flex-1">
                      {t.description || <span className="text-light">No description</span>}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => setWizard({ templateId: t.id })}
                      >
                        <Send className="h-3 w-3" />
                        Use template
                      </Button>
                      {t.isUserCreated ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(t)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

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
                {allCampaigns.map((c) => {
                  const Icon = iconMap[c.icon] || Mail;
                  const statusVariant: "success" | "secondary" =
                    c.status === "Active" ? "success" : "secondary";
                  return (
                    <TableRow key={c.id} className="cursor-pointer">
                      <TableCell className="pl-5">
                        <button
                          onClick={() => openEditWizard(c)}
                          className="flex items-center gap-2.5 text-foreground text-left"
                        >
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: c.iconBg, color: c.iconColor }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          {c.name}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.targetGroup === "Leads" ? "default" : "secondary"}>
                          {c.targetGroup}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.description || <span className="text-light">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant}>
                          {c.status === "Draft" && <Pencil className="h-2.5 w-2.5" />}
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
                            <DropdownMenuItem onClick={() => openEditWizard(c)}>
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={c.status !== "Active"}
                              onClick={() => {
                                if (c.status === "Active") setAnalyticsCampaignId(c.id);
                              }}
                            >
                              <BarChart3 className="h-3.5 w-3.5" />
                              View analytics
                            </DropdownMenuItem>
                            {c.isUserCreated && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => handleDeleteCampaign(c)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
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

      <NewTemplateDialog
        open={showNewTemplate}
        onOpenChange={setShowNewTemplate}
        onCreated={refresh}
      />
    </div>
  );
}
