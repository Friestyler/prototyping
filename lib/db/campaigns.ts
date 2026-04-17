import { sql } from "./client"
import crypto from "node:crypto"
import type { CampaignIcon, CampaignTargetGroup } from "./campaign-templates"

export type CampaignStatus = "Draft" | "Active" | "Stopped"

export interface DbCampaign {
  id: string
  userId: string
  name: string
  icon: CampaignIcon
  iconBg: string
  iconColor: string
  targetGroup: CampaignTargetGroup
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

interface CampaignRow {
  id: string
  user_id: string
  name: string
  icon: CampaignIcon
  icon_bg: string
  icon_color: string
  target_group: CampaignTargetGroup
  description: string
  status: CampaignStatus
  template_id: string | null
  smart_list_id: string | null
  recipient_ids: string[]
  subject: string
  body: string
  created_at: string
  updated_at: string
}

function rowToCampaign(r: CampaignRow): DbCampaign {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    icon: r.icon,
    iconBg: r.icon_bg,
    iconColor: r.icon_color,
    targetGroup: r.target_group,
    description: r.description,
    status: r.status,
    templateId: r.template_id,
    smartListId: r.smart_list_id,
    recipientIds: Array.isArray(r.recipient_ids) ? r.recipient_ids : [],
    subject: r.subject,
    body: r.body,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function listCampaigns(userId: string): Promise<DbCampaign[]> {
  const rows = (await sql`
    select * from user_campaigns where user_id = ${userId} order by created_at desc
  `) as CampaignRow[]
  return rows.map(rowToCampaign)
}

export async function getCampaign(userId: string, id: string): Promise<DbCampaign | null> {
  const rows = (await sql`
    select * from user_campaigns where user_id = ${userId} and id = ${id} limit 1
  `) as CampaignRow[]
  return rows.length > 0 ? rowToCampaign(rows[0]) : null
}

export interface CreateCampaignInput {
  name: string
  targetGroup: CampaignTargetGroup
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

export async function createCampaign(userId: string, input: CreateCampaignInput): Promise<DbCampaign> {
  const id = `cmp_${crypto.randomBytes(8).toString("hex")}`
  const rows = (await sql`
    insert into user_campaigns (
      id, user_id, name, target_group, description,
      template_id, smart_list_id, recipient_ids, subject, body,
      icon, icon_bg, icon_color
    ) values (
      ${id}, ${userId}, ${input.name}, ${input.targetGroup}, ${input.description ?? ""},
      ${input.templateId ?? null}, ${input.smartListId ?? null},
      ${JSON.stringify(input.recipientIds ?? [])}::jsonb,
      ${input.subject ?? ""}, ${input.body ?? ""},
      ${input.icon ?? "mail"}, ${input.iconBg ?? "#ECFDF5"}, ${input.iconColor ?? "#059669"}
    )
    returning *
  `) as CampaignRow[]
  return rowToCampaign(rows[0])
}

export interface UpdateCampaignInput {
  name?: string
  targetGroup?: CampaignTargetGroup
  description?: string
  status?: CampaignStatus
  templateId?: string | null
  smartListId?: string | null
  recipientIds?: string[]
  subject?: string
  body?: string
  icon?: CampaignIcon
  iconBg?: string
  iconColor?: string
}

export async function updateCampaign(
  userId: string,
  id: string,
  patch: UpdateCampaignInput,
): Promise<DbCampaign | null> {
  const existing = await getCampaign(userId, id)
  if (!existing) return null
  const next = {
    name: patch.name ?? existing.name,
    targetGroup: patch.targetGroup ?? existing.targetGroup,
    description: patch.description ?? existing.description,
    status: patch.status ?? existing.status,
    templateId: patch.templateId === undefined ? existing.templateId : patch.templateId,
    smartListId: patch.smartListId === undefined ? existing.smartListId : patch.smartListId,
    recipientIds: patch.recipientIds ?? existing.recipientIds,
    subject: patch.subject ?? existing.subject,
    body: patch.body ?? existing.body,
    icon: patch.icon ?? existing.icon,
    iconBg: patch.iconBg ?? existing.iconBg,
    iconColor: patch.iconColor ?? existing.iconColor,
  }
  const rows = (await sql`
    update user_campaigns set
      name = ${next.name},
      target_group = ${next.targetGroup},
      description = ${next.description},
      status = ${next.status},
      template_id = ${next.templateId},
      smart_list_id = ${next.smartListId},
      recipient_ids = ${JSON.stringify(next.recipientIds)}::jsonb,
      subject = ${next.subject},
      body = ${next.body},
      icon = ${next.icon},
      icon_bg = ${next.iconBg},
      icon_color = ${next.iconColor},
      updated_at = now()
    where user_id = ${userId} and id = ${id}
    returning *
  `) as CampaignRow[]
  return rows.length > 0 ? rowToCampaign(rows[0]) : null
}

export async function deleteCampaign(userId: string, id: string): Promise<boolean> {
  const rows = (await sql`
    delete from user_campaigns where user_id = ${userId} and id = ${id} returning id
  `) as Array<{ id: string }>
  return rows.length > 0
}
