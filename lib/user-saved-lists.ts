/**
 * Client for the user's saved smart lists.
 *
 * Backed by `/api/smart-lists` (Postgres via Neon). The browser is treated as
 * the "demo" user for now — auth happens server-side. Multi-tenant access
 * still goes through the same routes via Bearer api-key (used by MCP).
 */

export type UserSavedListType = "dynamic" | "static"

export interface UserSavedList {
  id: string
  name: string
  type: UserSavedListType
  customerCount: number
  customerIds: string[]
  sourceUseCaseId: string
  sourceTitle: string
  iconBg: string
  iconColor: string
  description: string
  createdAt: string
}

interface ApiSmartList {
  id: string
  name: string
  type: UserSavedListType
  description: string
  sourceUseCaseId: string | null
  sourceTitle: string | null
  iconBg: string | null
  iconColor: string | null
  customerIds: string[]
  createdAt: string
  updatedAt: string
}

const CHANGE_EVENT = "qollabi:user-saved-lists-changed"

function fromApi(l: ApiSmartList): UserSavedList {
  return {
    id: l.id,
    name: l.name,
    type: l.type,
    customerCount: l.customerIds.length,
    customerIds: l.customerIds,
    sourceUseCaseId: l.sourceUseCaseId ?? "",
    sourceTitle: l.sourceTitle ?? l.name,
    iconBg: l.iconBg ?? "#F3F4F6",
    iconColor: l.iconColor ?? "#6B7280",
    description: l.description,
    createdAt: l.createdAt,
  }
}

function notifyChange() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

export async function loadUserSavedLists(): Promise<UserSavedList[]> {
  if (typeof window === "undefined") return []
  try {
    const res = await fetch("/api/smart-lists", { cache: "no-store" })
    if (!res.ok) return []
    const data = (await res.json()) as { lists: ApiSmartList[] }
    return data.lists.map(fromApi)
  } catch {
    return []
  }
}

export interface SaveSmartListInput {
  name: string
  type: UserSavedListType
  customerIds: string[]
  description?: string
  sourceUseCaseId?: string
  sourceTitle?: string
  iconBg?: string
  iconColor?: string
}

export async function saveUserSavedList(input: SaveSmartListInput): Promise<UserSavedList | null> {
  try {
    const res = await fetch("/api/smart-lists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { list: ApiSmartList }
    notifyChange()
    return fromApi(data.list)
  } catch {
    return null
  }
}

export async function deleteUserSavedList(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/smart-lists/${encodeURIComponent(id)}`, { method: "DELETE" })
    if (!res.ok) return false
    notifyChange()
    return true
  } catch {
    return false
  }
}

export async function updateUserSavedList(
  id: string,
  patch: Partial<Pick<UserSavedList, "name" | "type" | "description" | "customerIds">>,
): Promise<UserSavedList | null> {
  try {
    const res = await fetch(`/api/smart-lists/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { list: ApiSmartList }
    notifyChange()
    return fromApi(data.list)
  } catch {
    return null
  }
}
