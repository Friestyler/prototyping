export type UserSavedListType = "dynamic" | "static"

export interface UserSavedList {
  id: string
  name: string
  type: UserSavedListType
  customerCount: number
  /** Partner IDs (stringified) that belong to the list. */
  customerIds: string[]
  sourceUseCaseId: string
  sourceTitle: string
  iconBg: string
  iconColor: string
  description: string
  createdAt: string
}

const STORAGE_KEY = "qollabi:user-saved-lists"

export function loadUserSavedLists(): UserSavedList[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveUserSavedList(list: UserSavedList): UserSavedList[] {
  const current = loadUserSavedLists()
  const next = [list, ...current]
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent("qollabi:user-saved-lists-changed"))
  return next
}

export function deleteUserSavedList(id: string): UserSavedList[] {
  const current = loadUserSavedLists()
  const next = current.filter((l) => l.id !== id)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent("qollabi:user-saved-lists-changed"))
  return next
}
