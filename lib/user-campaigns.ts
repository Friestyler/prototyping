/**
 * Client for the user's saved campaigns + templates.
 * Backed by /api/campaigns and /api/campaign-templates (Postgres via Neon).
 */

export type TargetGroup = "Customers" | "Leads"
export type CampaignStatus = "Draft" | "Active" | "Stopped"
export type CampaignIcon = "check" | "star" | "text" | "mail"

export interface UserCampaign {
  id: string
  name: string
  icon: CampaignIcon
  iconBg: string
  iconColor: string
  targetGroup: TargetGroup
  description: string
  status: CampaignStatus
  templateId: string | null
  smartListId: string | null
  recipientIds: string[]
  subject: string
  body: string
  createdAt: string
  updatedAt: string
}

export interface UserCampaignTemplate {
  id: string
  name: string
  icon: CampaignIcon
  iconBg: string
  iconColor: string
  targetGroup: TargetGroup
  description: string
  subject: string
  body: string
  createdAt: string
  updatedAt: string
}

const CHANGE_EVENT = "qollabi:user-campaigns-changed"

function notifyChange() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export const USER_CAMPAIGNS_CHANGE_EVENT = CHANGE_EVENT

// ─── Campaigns ─────────────────────────────────────────────────────────────

export async function loadUserCampaigns(): Promise<UserCampaign[]> {
  if (typeof window === "undefined") return []
  try {
    const res = await fetch("/api/campaigns", { cache: "no-store" })
    if (!res.ok) return []
    const data = (await res.json()) as { campaigns: UserCampaign[] }
    return data.campaigns
  } catch {
    return []
  }
}

export interface SaveCampaignInput {
  name: string
  targetGroup: TargetGroup
  description?: string
  templateId?: string | null
  smartListId?: string | null
  recipientIds?: string[]
  subject?: string
  body?: string
  icon?: CampaignIcon
  iconBg?: string
  iconColor?: string
}

export async function saveUserCampaign(input: SaveCampaignInput): Promise<UserCampaign | null> {
  try {
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { campaign: UserCampaign }
    notifyChange()
    return data.campaign
  } catch {
    return null
  }
}

export async function deleteUserCampaign(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/campaigns/${encodeURIComponent(id)}`, { method: "DELETE" })
    if (!res.ok) return false
    notifyChange()
    return true
  } catch {
    return false
  }
}

// ─── Templates ─────────────────────────────────────────────────────────────

export async function loadUserCampaignTemplates(): Promise<UserCampaignTemplate[]> {
  if (typeof window === "undefined") return []
  try {
    const res = await fetch("/api/campaign-templates", { cache: "no-store" })
    if (!res.ok) return []
    const data = (await res.json()) as { templates: UserCampaignTemplate[] }
    return data.templates
  } catch {
    return []
  }
}

export interface SaveTemplateInput {
  name: string
  targetGroup: TargetGroup
  description?: string
  subject?: string
  body?: string
  icon?: CampaignIcon
  iconBg?: string
  iconColor?: string
}

export async function saveUserCampaignTemplate(
  input: SaveTemplateInput,
): Promise<UserCampaignTemplate | null> {
  try {
    const res = await fetch("/api/campaign-templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { template: UserCampaignTemplate }
    notifyChange()
    return data.template
  } catch {
    return null
  }
}

export async function deleteUserCampaignTemplate(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/campaign-templates/${encodeURIComponent(id)}`, { method: "DELETE" })
    if (!res.ok) return false
    notifyChange()
    return true
  } catch {
    return false
  }
}
