"use client"

import { useEffect, useRef, useState } from "react"
import {
  Sparkles,
  Send,
  Loader2,
  MessageSquare,
  Plus,
  Bookmark,
  PinIcon,
  Users,
  Check,
  BarChart3,
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
  type SmartListPayload,
} from "@/components/ai-insights-context"
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

const QUICK_STARTS = [
  "Customers without Life insurance aged 30–55",
  "Home insurance expiring in the next 90 days",
  "High-value customers with only one product",
  "Chart customers by product",
]

function fmt(value: number, unit: ChartData["unit"]) {
  if (unit === "eur") return `€${value.toLocaleString("en-BE")}`
  if (unit === "percent") return `${value.toFixed(1)}%`
  return value.toLocaleString("en-BE")
}

function ChartView({ chart }: { chart: ChartData }) {
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        {chart.type === "bar" ? (
          <BarChart data={chart.data} margin={{ top: 4, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              interval={0}
              angle={chart.data.length > 5 ? -25 : 0}
              textAnchor={chart.data.length > 5 ? "end" : "middle"}
              height={chart.data.length > 5 ? 60 : 30}
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(Number(v), chart.unit)} />
            <Tooltip formatter={(v: number) => fmt(v, chart.unit)} />
            <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : chart.type === "line" ? (
          <LineChart data={chart.data} margin={{ top: 4, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(Number(v), chart.unit)} />
            <Tooltip formatter={(v: number) => fmt(v, chart.unit)} />
            <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie data={chart.data} dataKey="value" nameKey="label" outerRadius={100} label={(p) => p.label}>
              {chart.data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => fmt(v, chart.unit)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

interface Props {
  onSavedListOpen?: (listId: string) => void
  onChartPinned?: () => void
  /** Optional prompt to auto-send once when the component mounts. */
  initialPrompt?: string
  /** Called after the auto-seeded prompt is dispatched, so the parent can clear its seed. */
  onInitialPromptConsumed?: () => void
}

export default function CreateWithAiWorkspace({
  onSavedListOpen,
  onChartPinned,
  initialPrompt,
  onInitialPromptConsumed,
}: Props = {}) {
  const {
    activeSession,
    activeSessionId,
    newSession,
    appendTurn,
    updateTurn,
    commitArtefact,
    committed,
    activeDraft,
  } = useAiInsights()

  const [prompt, setPrompt] = useState("")
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const seedFiredRef = useRef(false)
  const turns = activeSession.turns

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [turns, activeSessionId])

  useEffect(() => {
    if (!initialPrompt || seedFiredRef.current) return
    seedFiredRef.current = true
    ask(initialPrompt)
    onInitialPromptConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt])

  function isArtefactCommitted(turnId: string, kind: "chart" | "smartList"): boolean {
    return committed.some((c) => c.kind === kind && c.versions.some((v) => v.turnId === turnId))
  }

  // Locate the most recent turn that produced the active draft, so the right-rail
  // CTAs can commit that specific turn's artefact (and flip to "Pinned/Saved").
  const latestArtefactTurn = [...turns].reverse().find((t) => !!t.artefact)
  const latestArtefactCommitted =
    latestArtefactTurn && latestArtefactTurn.artefact
      ? isArtefactCommitted(latestArtefactTurn.id, latestArtefactTurn.artefact.kind)
      : false

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
        body: JSON.stringify({ prompt: p, history, activeArtefact: activeArtefactForServer }),
      })
      const data = await res.json()
      if (!res.ok) {
        updateTurn(id, { loading: false, error: data.message ?? data.error ?? `HTTP ${res.status}` })
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

      updateTurn(id, { loading: false, answer: data.answer, artefact })
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

    toast({
      title: "Smart list saved",
      description: `"${payload.proposal.name}" opened in Customers.`,
    })
    onSavedListOpen?.(saved.id)
  }

  function handlePinChart(turnId: string, chart: ChartData) {
    commitArtefact({
      sessionId: activeSessionId,
      kind: "chart",
      artefact: { kind: "chart", chart },
      prompt: turns.find((t) => t.id === turnId)?.prompt ?? "",
      turnId,
    })
    toast({ title: "Chart pinned", description: `"${chart.title}" added to Portfolio Insights.` })
    onChartPinned?.()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 h-[calc(100vh-14rem)] min-h-[560px]">
      {/* Main column */}
      <div className="flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-2xl mx-auto space-y-5">
            {turns.length === 0 && (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 text-[#4F46E5]" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">Create with AI</div>
                  <div className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
                    Describe a customer segment or ask for a chart. I'll generate what fits, and you
                    can save it as a smart list or pin it to your dashboard.
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {QUICK_STARTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="text-left text-sm text-gray-700 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-indigo-200 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((t) => (
              <div key={t.id} className="space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-[#4F46E5] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                    {t.prompt}
                  </div>
                </div>
                {t.loading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking…
                  </div>
                )}
                {t.error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    {t.error}
                  </div>
                )}
                {t.answer && (
                  <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {t.answer}
                  </div>
                )}
                {t.artefact?.kind === "chart" && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {t.artefact.chart.title}
                      </div>
                      <Button
                        size="sm"
                        variant={isArtefactCommitted(t.id, "chart") ? "outline" : "default"}
                        disabled={isArtefactCommitted(t.id, "chart")}
                        onClick={() =>
                          handlePinChart(
                            t.id,
                            t.artefact!.kind === "chart" ? t.artefact!.chart : (null as never),
                          )
                        }
                      >
                        {isArtefactCommitted(t.id, "chart") ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <PinIcon className="w-3.5 h-3.5" />
                        )}
                        {isArtefactCommitted(t.id, "chart") ? "Pinned" : "Pin to Insights"}
                      </Button>
                    </div>
                    <ChartView chart={t.artefact.chart} />
                  </div>
                )}
                {t.artefact?.kind === "smartList" && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {t.artefact.payload.proposal.name}
                        </div>
                        <div className="text-xs text-gray-600 leading-relaxed mt-0.5">
                          {t.artefact.payload.proposal.description}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isArtefactCommitted(t.id, "smartList") ? "outline" : "default"}
                        disabled={isArtefactCommitted(t.id, "smartList")}
                        onClick={() =>
                          handleSaveSmartList(
                            t.id,
                            t.artefact!.kind === "smartList"
                              ? t.artefact!.payload
                              : (null as never),
                          )
                        }
                        className="flex-shrink-0"
                      >
                        {isArtefactCommitted(t.id, "smartList") ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                        {isArtefactCommitted(t.id, "smartList") ? "Saved" : "Save list"}
                      </Button>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-medium text-gray-700">
                        {t.artefact.payload.matchCount}
                      </span>
                      <span>matching customers</span>
                      <span className="text-gray-300">·</span>
                      <span className="capitalize">{t.artefact.payload.proposal.type}</span>
                    </div>

                    {t.artefact.payload.sample.length > 0 && (
                      <ul className="bg-gray-50 rounded-lg border border-gray-100 divide-y divide-gray-100">
                        {t.artefact.payload.sample.slice(0, 4).map((c) => (
                          <li
                            key={c.id}
                            className="px-3 py-2 text-xs flex items-center justify-between gap-2"
                          >
                            <span className="truncate text-gray-700">
                              {c.firstName} {c.lastName ?? ""}
                            </span>
                            <span className="text-gray-400 truncate">
                              {c.products.join(", ")}
                            </span>
                          </li>
                        ))}
                        {t.artefact.payload.matchCount > 4 && (
                          <li className="px-3 py-1.5 text-[11px] text-gray-400">
                            + {t.artefact.payload.matchCount - 4} more
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sticky input */}
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Textarea
                rows={2}
                placeholder="Describe a segment, ask for a chart, or follow up on the draft…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    ask()
                  }
                }}
                className="resize-none pr-12 text-sm"
              />
              <Button
                onClick={() => ask()}
                disabled={!prompt.trim()}
                size="icon"
                className="absolute right-2 bottom-2 h-8 w-8"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-[11px] text-gray-400 mt-1.5 text-center">
              Powered by Claude · Press Enter to send, Shift+Enter for newline
            </div>
          </div>
        </div>
      </div>

      {/* Right rail */}
      <aside className="hidden lg:flex flex-col gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-900">Actions</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => newSession()}
              className="text-gray-500 hover:text-gray-900"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </Button>
          </div>

          {!latestArtefactTurn ? (
            <div className="text-xs text-gray-500 leading-relaxed">
              Start a prompt to produce a draft. Actions appear here once there's something to save.
            </div>
          ) : latestArtefactTurn.artefact?.kind === "smartList" ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-500 leading-relaxed">
                Draft smart list ready. Save it to the Customers page, where you can refine with
                filters.
              </div>
              <Button
                className="w-full justify-start"
                disabled={latestArtefactCommitted}
                onClick={() =>
                  latestArtefactTurn.artefact?.kind === "smartList" &&
                  handleSaveSmartList(latestArtefactTurn.id, latestArtefactTurn.artefact.payload)
                }
              >
                {latestArtefactCommitted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                {latestArtefactCommitted ? "Saved as smart list" : "Save as smart list"}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => ask("Turn the current draft into a chart.")}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Visualize as chart
              </Button>
            </div>
          ) : latestArtefactTurn.artefact?.kind === "chart" ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-500 leading-relaxed">
                Draft chart ready. Add it to your Portfolio Insights dashboard.
              </div>
              <Button
                className="w-full justify-start"
                disabled={latestArtefactCommitted}
                onClick={() =>
                  latestArtefactTurn.artefact?.kind === "chart" &&
                  handlePinChart(latestArtefactTurn.id, latestArtefactTurn.artefact.chart)
                }
              >
                {latestArtefactCommitted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <PinIcon className="w-3.5 h-3.5" />
                )}
                {latestArtefactCommitted ? "Added to dashboard" : "Add to dashboard"}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => ask("Turn this into a saved smart list of the matching customers.")}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Save as smart list
              </Button>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900 mb-2">Session</div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{activeSession.title}</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1 tabular-nums">
            {turns.length} {turns.length === 1 ? "turn" : "turns"}
          </div>
        </div>

        <div
          className={cn(
            "rounded-2xl border border-dashed p-4 text-xs leading-relaxed",
            "border-indigo-200 bg-indigo-50/40 text-indigo-900",
          )}
        >
          <div className="font-medium mb-1">Tip</div>
          You can refine by following up — e.g. "narrow to customers in Brussels" or "group by age".
        </div>
      </aside>
    </div>
  )
}
