import { sql } from "./client"
import crypto from "node:crypto"

export type CampaignTargetGroup = "Customers" | "Leads"
export type CampaignIcon = "check" | "star" | "text" | "mail"

export interface DbCampaignTemplate {
  id: string
  userId: string
  name: string
  icon: CampaignIcon
  iconBg: string
  iconColor: string
  targetGroup: CampaignTargetGroup
  description: string
  subject: string
  body: string
  createdAt: string
  updatedAt: string
}

interface TemplateRow {
  id: string
  user_id: string
  name: string
  icon: CampaignIcon
  icon_bg: string
  icon_color: string
  target_group: CampaignTargetGroup
  description: string
  subject: string
  body: string
  created_at: string
  updated_at: string
}

function rowToTemplate(r: TemplateRow): DbCampaignTemplate {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    icon: r.icon,
    iconBg: r.icon_bg,
    iconColor: r.icon_color,
    targetGroup: r.target_group,
    description: r.description,
    subject: r.subject,
    body: r.body,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function listTemplates(userId: string): Promise<DbCampaignTemplate[]> {
  const rows = (await sql`
    select * from user_campaign_templates
    where user_id = ${userId}
    order by created_at desc
  `) as TemplateRow[]
  return rows.map(rowToTemplate)
}

export async function getTemplate(userId: string, id: string): Promise<DbCampaignTemplate | null> {
  const rows = (await sql`
    select * from user_campaign_templates where user_id = ${userId} and id = ${id} limit 1
  `) as TemplateRow[]
  return rows.length > 0 ? rowToTemplate(rows[0]) : null
}

export interface CreateTemplateInput {
  name: string
  targetGroup: CampaignTargetGroup
  description?: string
  subject?: string
  body?: string
  icon?: CampaignIcon
  iconBg?: string
  iconColor?: string
}

export async function createTemplate(userId: string, input: CreateTemplateInput): Promise<DbCampaignTemplate> {
  const id = `tpl_${crypto.randomBytes(8).toString("hex")}`
  const rows = (await sql`
    insert into user_campaign_templates (
      id, user_id, name, target_group, description, subject, body,
      icon, icon_bg, icon_color
    ) values (
      ${id}, ${userId}, ${input.name}, ${input.targetGroup},
      ${input.description ?? ""}, ${input.subject ?? ""}, ${input.body ?? ""},
      ${input.icon ?? "mail"}, ${input.iconBg ?? "#ECFDF5"}, ${input.iconColor ?? "#059669"}
    )
    returning *
  `) as TemplateRow[]
  return rowToTemplate(rows[0])
}

export interface UpdateTemplateInput {
  name?: string
  targetGroup?: CampaignTargetGroup
  description?: string
  subject?: string
  body?: string
  icon?: CampaignIcon
  iconBg?: string
  iconColor?: string
}

export async function updateTemplate(
  userId: string,
  id: string,
  patch: UpdateTemplateInput,
): Promise<DbCampaignTemplate | null> {
  const existing = await getTemplate(userId, id)
  if (!existing) return null
  const next = {
    name: patch.name ?? existing.name,
    targetGroup: patch.targetGroup ?? existing.targetGroup,
    description: patch.description ?? existing.description,
    subject: patch.subject ?? existing.subject,
    body: patch.body ?? existing.body,
    icon: patch.icon ?? existing.icon,
    iconBg: patch.iconBg ?? existing.iconBg,
    iconColor: patch.iconColor ?? existing.iconColor,
  }
  const rows = (await sql`
    update user_campaign_templates set
      name = ${next.name},
      target_group = ${next.targetGroup},
      description = ${next.description},
      subject = ${next.subject},
      body = ${next.body},
      icon = ${next.icon},
      icon_bg = ${next.iconBg},
      icon_color = ${next.iconColor},
      updated_at = now()
    where user_id = ${userId} and id = ${id}
    returning *
  `) as TemplateRow[]
  return rows.length > 0 ? rowToTemplate(rows[0]) : null
}

export async function deleteTemplate(userId: string, id: string): Promise<boolean> {
  const rows = (await sql`
    delete from user_campaign_templates where user_id = ${userId} and id = ${id} returning id
  `) as Array<{ id: string }>
  return rows.length > 0
}
