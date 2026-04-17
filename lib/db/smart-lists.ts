import { sql } from "./client"
import crypto from "node:crypto"

export type SmartListType = "dynamic" | "static"

export interface DbSmartList {
  id: string
  userId: string
  name: string
  type: SmartListType
  description: string
  sourceUseCaseId: string | null
  sourceTitle: string | null
  iconBg: string | null
  iconColor: string | null
  customerIds: string[]
  createdAt: string
  updatedAt: string
}

interface SmartListRow {
  id: string
  user_id: string
  name: string
  type: SmartListType
  description: string
  source_use_case_id: string | null
  source_title: string | null
  icon_bg: string | null
  icon_color: string | null
  customer_ids: string[]
  created_at: string
  updated_at: string
}

function rowToSmartList(r: SmartListRow): DbSmartList {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    type: r.type,
    description: r.description,
    sourceUseCaseId: r.source_use_case_id,
    sourceTitle: r.source_title,
    iconBg: r.icon_bg,
    iconColor: r.icon_color,
    customerIds: Array.isArray(r.customer_ids) ? r.customer_ids : [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function listSmartLists(userId: string): Promise<DbSmartList[]> {
  const rows = (await sql`
    select * from user_smart_lists where user_id = ${userId} order by created_at desc
  `) as SmartListRow[]
  return rows.map(rowToSmartList)
}

export async function getSmartList(userId: string, id: string): Promise<DbSmartList | null> {
  const rows = (await sql`
    select * from user_smart_lists where user_id = ${userId} and id = ${id} limit 1
  `) as SmartListRow[]
  return rows.length > 0 ? rowToSmartList(rows[0]) : null
}

export interface CreateSmartListInput {
  name: string
  type: SmartListType
  customerIds: string[]
  description?: string
  sourceUseCaseId?: string | null
  sourceTitle?: string | null
  iconBg?: string | null
  iconColor?: string | null
}

export async function createSmartList(userId: string, input: CreateSmartListInput): Promise<DbSmartList> {
  const id = `sl_${crypto.randomBytes(8).toString("hex")}`
  const rows = (await sql`
    insert into user_smart_lists (
      id, user_id, name, type, description,
      source_use_case_id, source_title, icon_bg, icon_color, customer_ids
    ) values (
      ${id}, ${userId}, ${input.name}, ${input.type}, ${input.description ?? ""},
      ${input.sourceUseCaseId ?? null}, ${input.sourceTitle ?? null},
      ${input.iconBg ?? null}, ${input.iconColor ?? null},
      ${JSON.stringify(input.customerIds)}::jsonb
    )
    returning *
  `) as SmartListRow[]
  return rowToSmartList(rows[0])
}

export interface UpdateSmartListInput {
  name?: string
  type?: SmartListType
  description?: string
  customerIds?: string[]
}

export async function updateSmartList(
  userId: string,
  id: string,
  patch: UpdateSmartListInput,
): Promise<DbSmartList | null> {
  const existing = await getSmartList(userId, id)
  if (!existing) return null

  const next = {
    name: patch.name ?? existing.name,
    type: patch.type ?? existing.type,
    description: patch.description ?? existing.description,
    customerIds: patch.customerIds ?? existing.customerIds,
  }

  const rows = (await sql`
    update user_smart_lists set
      name = ${next.name},
      type = ${next.type},
      description = ${next.description},
      customer_ids = ${JSON.stringify(next.customerIds)}::jsonb,
      updated_at = now()
    where user_id = ${userId} and id = ${id}
    returning *
  `) as SmartListRow[]
  return rows.length > 0 ? rowToSmartList(rows[0]) : null
}

export async function deleteSmartList(userId: string, id: string): Promise<boolean> {
  const rows = (await sql`
    delete from user_smart_lists where user_id = ${userId} and id = ${id} returning id
  `) as Array<{ id: string }>
  return rows.length > 0
}
