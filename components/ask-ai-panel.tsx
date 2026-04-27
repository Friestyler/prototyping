"use client"

import { useEffect, useRef, useState } from "react"
import {
  Sparkles,
  X,
  Send,
  Loader2,
  MessageSquare,
  Menu,
  Plus,
  Trash2,
  Bookmark,
  PinIcon,
  Users,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import {
  useAiInsights,
  type Artefact,
  type ChartData,
  type SmartListColumn,
  type SmartListPayload,
} from "@/components/ai-insights-context"
import { SmartListPreviewTable } from "@/components/smart-list-preview-table"
import { saveUserSavedList, type UserSavedListType } from "@/lib/user-saved-lists"
import { toast } from "@/hooks/use-toast"

const CHART_COLORS = [
  "#4F46E5",
  "#0D9488",
  "#F59E0B",
  "#DB2777",
  "#0EA5E9",
  "#8B5CF6",
  "#16A34A",
  "#DC2626",
  "#6B7280",
]

const STARTERS = [
  "What's my total annual premium?",
  "Chart customers by product.",
  "Show me customers without Life insurance.",
  "Which cities concentrate most of my customers?",
]

function fmt(value: number, unit: ChartData["unit"]) {
  if (unit === "eur") return `€${value.toLocaleString("en-BE")}`
  if (unit === "percent") return `${value.toFixed(1)}%`
  return value.toLocaleString("en-BE")
}

function ChartView({ chart, compact = true }: { chart: ChartData; compact?: boolean }) {
  const height = compact ? 200 : 280
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        {chart.type === "bar" ? (
          <BarChart data={chart.data} margin={{ top: 4, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              interval={0}
              angle={chart.data.length > 5 ? -25 : 0}
              textAnchor={chart.data.length > 5 ? "end" : "middle"}
              height={chart.data.length > 5 ? 60 : 30}
            />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(Number(v), chart.unit)} />
            <Tooltip formatter={(v: number) => fmt(v, chart.unit)} />
            <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : chart.type === "line" ? (
          <LineChart data={chart.data} margin={{ top: 4, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(Number(v), chart.unit)} />
            <Tooltip formatter={(v: number) => fmt(v, chart.unit)} />
            <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie data={chart.data} dataKey="value" nameKey="label" outerRadius={compact ? 72 : 100} label={(p) => p.label}>
              {chart.data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => fmt(v, chart.unit)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

function ChartArtefactCard({
  chart,
  committed,
  onPin,
}: {
  chart: ChartData
  committed: boolean
  onPin: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 mt-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[12px] font-semibold text-[#111827] truncate">{chart.title}</div>
        <Button
          size="sm"
          variant={committed ? "outline" : "default"}
          disabled={committed}
          onClick={onPin}
          className="h-7 text-[11px] gap-1"
        >
          {committed ? <Check className="w-3 h-3" /> : <PinIcon className="w-3 h-3" />}
          {committed ? "Pinned" : "Pin to Insights"}
        </Button>
      </div>
      <ChartView chart={chart} />
    </div>
  )
}

function SmartListArtefactCard({
  payload,
  committed,
  onSave,
}: {
  payload: SmartListPayload
  committed: boolean
  onSave: () => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 mt-2 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold text-[#111827] truncate">
            {payload.proposal.name}
          </div>
          <div className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">
            {payload.proposal.description}
          </div>
        </div>
        <Button
          size="sm"
          variant={committed ? "outline" : "default"}
          disabled={committed}
          onClick={onSave}
          className="h-7 text-[11px] gap-1 flex-shrink-0"
        >
          {committed ? <Check className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
          {committed ? "Saved" : "Save list"}
        </Button>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
        <Users className="w-3 h-3" />
        <span className="font-medium text-gray-700">{payload.matchCount}</span>
        <span>matching customers</span>
        <span className="text-gray-300">·</span>
        <span className="capitalize">{payload.proposal.type}</span>
      </div>

      {payload.sample.length > 0 && (
        <SmartListPreviewTable
          sample={payload.sample}
          columns={(payload.proposal.columns ?? []) as SmartListColumn[]}
          matchCount={payload.matchCount}
          density="compact"
          maxRows={3}
        />
      )}
    </div>
  )
}

export default function AskAiPanel({
  open: controlledOpen,
  onOpenChange,
}: {
  open?: boolean
  onOpenChange?: (next: boolean) => void
} = {}) {
  const {
    sessions,
    activeSession,
    activeSessionId,
    newSession,
    switchSession,
    deleteSession,
    appendTurn,
    updateTurn,
    commitArtefact,
    committed,
    activeDraft,
    panelOpen: contextOpen,
    setPanelOpen,
    seedPrompt,
    consumeSeed,
    requestNavigation,
  } = useAiInsights()

  const open = controlledOpen ?? contextOpen
  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next)
    setPanelOpen(next)
  }
  const [prompt, setPrompt] = useState("")
  const [showSessions, setShowSessions] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const turns = activeSession.turns

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [turns, open, activeSessionId])

  // Consume seed prompt when opened.
  useEffect(() => {
    if (open && seedPrompt) {
      setPrompt(seedPrompt)
      consumeSeed()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seedPrompt])

  function isArtefactCommitted(turnId: string, kind: "chart" | "smartList"): boolean {
    return committed.some(
      (c) =>
        c.kind === kind && c.versions.some((v) => v.turnId === turnId),
    )
  }

  async function ask(text?: string) {
    const p = (text ?? prompt).trim()
    if (!p) return
    const id = crypto.randomUUID()
    appendTurn({ id, prompt: p, loading: true })
    setPrompt("")

    const history = turns
      .filter((t) => !t.loading && !t.error)
      .flatMap((t) => {
        const entries: { role: "user" | "assistant"; content: string }[] = [
          { role: "user", content: t.prompt },
        ]
        if (t.answer) entries.push({ role: "assistant", content: t.answer })
        return entries
      })

    const activeArtefactForServer = activeDraft
      ? activeDraft.kind === "chart"
        ? { type: "chart" as const, payload: activeDraft.chart }
        : { type: "smartList" as const, payload: activeDraft.payload }
      : null

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: p,
          history,
          activeArtefact: activeArtefactForServer,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        updateTurn(id, {
          loading: false,
          error: data.message ?? data.error ?? `HTTP ${res.status}`,
        })
        return
      }

      let artefact: Artefact | null = null
      if (data.artefact?.type === "chart") {
        artefact = { kind: "chart", chart: data.artefact.chart }
      } else if (data.artefact?.type === "smartList") {
        artefact = {
          kind: "smartList",
          payload: {
            proposal: data.artefact.proposal,
            matchCount: data.artefact.matchCount,
            sample: data.artefact.sample,
            customerIds: data.artefact.customerIds,
          },
        }
      }

      updateTurn(id, {
        loading: false,
        answer: data.answer,
        artefact,
      })
    } catch (e) {
      updateTurn(id, { loading: false, error: String(e) })
    }
  }

  async function handleSaveSmartList(turnId: string, payload: SmartListPayload) {
    const saved = await saveUserSavedList({
      name: payload.proposal.name,
      type: payload.proposal.type as UserSavedListType,
      customerIds: payload.customerIds,
      description: payload.proposal.description,
      sourceUseCaseId: "ai-generated",
      sourceTitle: "AI Generated",
      iconBg: "#EEF2FF",
      iconColor: "#4F46E5",
    })

    if (!saved) {
      toast({ title: "Couldn't save list", description: "Try again." })
      return
    }

    commitArtefact({
      sessionId: activeSessionId,
      kind: "smartList",
      artefact: { kind: "smartList", payload },
      prompt: turns.find((t) => t.id === turnId)?.prompt ?? "",
      turnId,
      externalRef: saved.id,
    })

    // Jump to the Customers page with the new list already selected. Chat panel stays open.
    requestNavigation({ menu: "customers", listId: saved.id })

    toast({
      title: "Smart list saved",
      description: `"${payload.proposal.name}" opened in Customers.`,
    })
  }

  function handlePinChart(turnId: string, chart: ChartData) {
    commitArtefact({
      sessionId: activeSessionId,
      kind: "chart",
      artefact: { kind: "chart", chart },
      prompt: turns.find((t) => t.id === turnId)?.prompt ?? "",
      turnId,
    })
    requestNavigation({ menu: "portfolio-insights" })
    toast({
      title: "Chart pinned",
      description: `"${chart.title}" added to Portfolio Insights.`,
    })
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white pl-4 pr-5 py-3 flex items-center gap-2 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[13px] font-medium">Ask AI</span>
        </button>
      )}

      {open && (
        <div className="fixed top-0 right-0 bottom-0 z-50 w-[420px] bg-white border-l border-gray-200 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setShowSessions((v) => !v)}
                className="text-gray-500 hover:text-gray-900 transition-colors p-1 -ml-1 rounded hover:bg-gray-100"
                title="Chat sessions"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="w-7 h-7 rounded-md bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[#111827] truncate">Brand Broker AI</div>
                <div className="text-[11px] text-[#6B7280] truncate">{activeSession.title}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  newSession()
                  setShowSessions(false)
                }}
                className="text-gray-500 hover:text-gray-900 transition-colors p-1 rounded hover:bg-gray-100"
                title="New chat"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showSessions && (
            <div className="border-b border-gray-200 bg-gray-50/70 max-h-56 overflow-y-auto">
              <div className="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-gray-500">
                Chat history
              </div>
              <div className="pb-2">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-[12px] cursor-pointer hover:bg-white",
                      s.id === activeSessionId && "bg-white",
                    )}
                    onClick={() => {
                      switchSession(s.id)
                      setShowSessions(false)
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span
                      className={cn(
                        "flex-1 truncate",
                        s.id === activeSessionId ? "text-gray-900 font-medium" : "text-gray-700",
                      )}
                    >
                      {s.title}
                    </span>
                    <span className="text-[10.5px] text-gray-400 flex-shrink-0">
                      {s.turns.length > 0 && `${s.turns.length} turn${s.turns.length === 1 ? "" : "s"}`}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSession(s.id)
                      }}
                      className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {turns.length === 0 && (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mx-auto">
                  <MessageSquare className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <div className="text-[13px] text-[#374151] font-medium">Ask anything</div>
                <div className="text-[12px] text-[#6B7280] px-4">
                  Ask a question, request a chart, or describe a customer segment — I'll generate what fits.
                </div>
                <div className="space-y-1.5 px-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="w-full text-left text-[12px] text-[#374151] px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((t) => (
              <div key={t.id} className="space-y-2">
                <div className="bg-[#F3F4F6] rounded-lg px-3 py-2 text-[13px] text-[#111827]">{t.prompt}</div>
                {t.loading && (
                  <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Thinking…
                  </div>
                )}
                {t.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                    {t.error}
                  </div>
                )}
                {t.answer && (
                  <div className="text-[13px] text-[#111827] whitespace-pre-wrap leading-relaxed">{t.answer}</div>
                )}
                {t.artefact?.kind === "chart" && (
                  <ChartArtefactCard
                    chart={t.artefact.chart}
                    committed={isArtefactCommitted(t.id, "chart")}
                    onPin={() => handlePinChart(t.id, t.artefact!.kind === "chart" ? t.artefact!.chart : (null as never))}
                  />
                )}
                {t.artefact?.kind === "smartList" && (
                  <SmartListArtefactCard
                    payload={t.artefact.payload}
                    committed={isArtefactCommitted(t.id, "smartList")}
                    onSave={() =>
                      handleSaveSmartList(
                        t.id,
                        t.artefact!.kind === "smartList" ? t.artefact!.payload : (null as never),
                      )
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 p-3">
            <div className="relative">
              <Textarea
                rows={2}
                placeholder="Ask a question, request a chart, or describe a segment…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    ask()
                  }
                }}
                className="resize-none pr-12 text-[13px]"
              />
              <Button
                onClick={() => ask()}
                disabled={!prompt.trim()}
                size="icon"
                className="absolute right-2 bottom-2 h-7 w-7"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="text-[10.5px] text-[#9CA3AF] mt-1.5 text-center">
              Powered by Claude · Press Enter to send
            </div>
          </div>
        </div>
      )}
    </>
  )
}
