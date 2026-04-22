"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

// ── Artefact payloads ──────────────────────────────────────────────────────
export interface ChartData {
  type: "bar" | "pie" | "line"
  title: string
  xLabel?: string
  yLabel?: string
  unit: "count" | "eur" | "percent"
  data: Array<{ label: string; value: number }>
}

export interface SmartListWireCustomer {
  id: string
  firstName: string
  lastName: string | null
  customerType: string
  dossierNumber: string
  products: string[]
}

export interface SmartListProposal {
  name: string
  description: string
  type: "dynamic" | "static"
  filter: Record<string, unknown>
}

export interface SmartListPayload {
  proposal: SmartListProposal
  matchCount: number
  sample: SmartListWireCustomer[]
  customerIds: string[]
}

export type Artefact =
  | { kind: "chart"; chart: ChartData }
  | { kind: "smartList"; payload: SmartListPayload }

// ── Chat + history ─────────────────────────────────────────────────────────
export interface ChatTurn {
  id: string
  prompt: string
  answer?: string
  /** The draft artefact produced by THIS turn (inline card in chat). */
  artefact?: Artefact | null
  loading?: boolean
  error?: string
}

export interface ArtefactVersion {
  artefact: Artefact
  prompt: string
  turnId: string
}

/**
 * Artefacts that have been explicitly committed (pinned chart, saved list).
 * One thread per session: follow-ups bump the active version so undo/redo works.
 */
export interface CommittedArtefact {
  id: string
  sessionId: string
  sessionTitle: string
  kind: "chart" | "smartList"
  versions: ArtefactVersion[]
  activeVersion: number
  /** For saved smart lists, track the SavedList id so we can open it. */
  externalRef?: string
}

export interface ChatSession {
  id: string
  title: string
  createdAt: number
  turns: ChatTurn[]
}

interface AiChatContextValue {
  sessions: ChatSession[]
  activeSessionId: string
  activeSession: ChatSession
  committed: CommittedArtefact[]
  newSession: () => string
  switchSession: (id: string) => void
  deleteSession: (id: string) => void
  appendTurn: (turn: ChatTurn) => void
  updateTurn: (turnId: string, patch: Partial<ChatTurn>) => void
  /** Commit an artefact from a turn. If a committed artefact with the same sessionId+kind exists, append as a new version. */
  commitArtefact: (args: {
    sessionId: string
    kind: "chart" | "smartList"
    artefact: Artefact
    prompt: string
    turnId: string
    externalRef?: string
  }) => void
  removeCommitted: (committedId: string) => void
  undoArtefact: (committedId: string) => void
  redoArtefact: (committedId: string) => void
  /** The latest draft artefact in the active session (for follow-up context). */
  activeDraft: Artefact | null
  // Panel open state + seed prompt — so any page can pop the chat with a prefilled prompt.
  panelOpen: boolean
  setPanelOpen: (next: boolean) => void
  seedPrompt: string | null
  openPanelWithPrompt: (prompt: string, options?: { newSession?: boolean }) => void
  consumeSeed: () => void
  // Navigation requests from within the chat (e.g. "open the list I just saved").
  pendingNavigation: PendingNavigation | null
  requestNavigation: (target: PendingNavigation) => void
  consumeNavigation: () => void
}

export type PendingNavigation = {
  /** Matches the app's `activeMenu` values. */
  menu: "customers" | "portfolio-insights" | "campaigns" | "leads"
  /** Saved list id to auto-open after navigation. */
  listId?: string
}

const AiChatContext = createContext<AiChatContextValue | null>(null)

function makeSession(title = "New chat"): ChatSession {
  return {
    id: crypto.randomUUID(),
    title,
    createdAt: Date.now(),
    turns: [],
  }
}

function deriveTitle(firstPrompt: string): string {
  const trimmed = firstPrompt.trim().replace(/\s+/g, " ")
  if (trimmed.length <= 48) return trimmed
  return `${trimmed.slice(0, 45)}…`
}

export function AiInsightsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => [makeSession()])
  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id ?? "")
  const [committed, setCommitted] = useState<CommittedArtefact[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [seedPrompt, setSeedPrompt] = useState<string | null>(null)
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null)

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? sessions[0],
    [sessions, activeSessionId],
  )

  const newSession = useCallback(() => {
    const session = makeSession()
    setSessions((prev) => [session, ...prev])
    setActiveSessionId(session.id)
    return session.id
  }, [])

  const switchSession = useCallback((id: string) => setActiveSessionId(id), [])

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== id)
        if (filtered.length === 0) {
          const fresh = makeSession()
          setActiveSessionId(fresh.id)
          return [fresh]
        }
        if (id === activeSessionId) setActiveSessionId(filtered[0].id)
        return filtered
      })
      // Drop any committed artefacts tied to the deleted session.
      setCommitted((prev) => prev.filter((c) => c.sessionId !== id))
    },
    [activeSessionId],
  )

  const appendTurn = useCallback(
    (turn: ChatTurn) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s
          const isFirst = s.turns.length === 0
          return {
            ...s,
            title: isFirst ? deriveTitle(turn.prompt) : s.title,
            turns: [...s.turns, turn],
          }
        }),
      )
    },
    [activeSessionId],
  )

  const updateTurn = useCallback(
    (turnId: string, patch: Partial<ChatTurn>) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, turns: s.turns.map((t) => (t.id === turnId ? { ...t, ...patch } : t)) }
            : s,
        ),
      )
    },
    [activeSessionId],
  )

  const commitArtefact = useCallback<AiChatContextValue["commitArtefact"]>(
    ({ sessionId, kind, artefact, prompt, turnId, externalRef }) => {
      const session = sessions.find((s) => s.id === sessionId)
      const sessionTitle = session?.title ?? "Untitled"
      setCommitted((prev) => {
        const existing = prev.find((c) => c.sessionId === sessionId && c.kind === kind)
        if (existing) {
          // Append new version; truncate any "future" versions after the active pointer.
          const base = existing.versions.slice(0, existing.activeVersion + 1)
          const nextVersions = [...base, { artefact, prompt, turnId }]
          const updated: CommittedArtefact = {
            ...existing,
            versions: nextVersions,
            activeVersion: nextVersions.length - 1,
            externalRef: externalRef ?? existing.externalRef,
            sessionTitle,
          }
          return prev.map((c) => (c === existing ? updated : c))
        }
        const fresh: CommittedArtefact = {
          id: crypto.randomUUID(),
          sessionId,
          sessionTitle,
          kind,
          versions: [{ artefact, prompt, turnId }],
          activeVersion: 0,
          externalRef,
        }
        return [...prev, fresh]
      })
    },
    [sessions],
  )

  const removeCommitted = useCallback((committedId: string) => {
    setCommitted((prev) => prev.filter((c) => c.id !== committedId))
  }, [])

  const undoArtefact = useCallback((committedId: string) => {
    setCommitted((prev) =>
      prev.map((c) =>
        c.id === committedId && c.activeVersion > 0
          ? { ...c, activeVersion: c.activeVersion - 1 }
          : c,
      ),
    )
  }, [])

  const redoArtefact = useCallback((committedId: string) => {
    setCommitted((prev) =>
      prev.map((c) =>
        c.id === committedId && c.activeVersion < c.versions.length - 1
          ? { ...c, activeVersion: c.activeVersion + 1 }
          : c,
      ),
    )
  }, [])

  const activeDraft = useMemo<Artefact | null>(() => {
    if (!activeSession) return null
    for (let i = activeSession.turns.length - 1; i >= 0; i--) {
      const t = activeSession.turns[i]
      if (t.artefact) return t.artefact
    }
    return null
  }, [activeSession])

  const openPanelWithPrompt = useCallback<AiChatContextValue["openPanelWithPrompt"]>(
    (prompt, options) => {
      if (options?.newSession) newSession()
      setSeedPrompt(prompt)
      setPanelOpen(true)
    },
    [newSession],
  )

  const consumeSeed = useCallback(() => setSeedPrompt(null), [])

  const requestNavigation = useCallback((target: PendingNavigation) => {
    setPendingNavigation(target)
  }, [])

  const consumeNavigation = useCallback(() => setPendingNavigation(null), [])

  const value: AiChatContextValue = {
    sessions,
    activeSessionId,
    activeSession,
    committed,
    newSession,
    switchSession,
    deleteSession,
    appendTurn,
    updateTurn,
    commitArtefact,
    removeCommitted,
    undoArtefact,
    redoArtefact,
    activeDraft,
    panelOpen,
    setPanelOpen,
    seedPrompt,
    openPanelWithPrompt,
    consumeSeed,
    pendingNavigation,
    requestNavigation,
    consumeNavigation,
  }

  return <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>
}

export function useAiInsights() {
  const ctx = useContext(AiChatContext)
  if (!ctx) throw new Error("useAiInsights must be used within AiInsightsProvider")
  return ctx
}
