"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles, X, Send, Loader2, MessageSquare } from "lucide-react"
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

interface ChartData {
  type: "bar" | "pie" | "line"
  title: string
  xLabel?: string
  yLabel?: string
  unit: "count" | "eur" | "percent"
  data: Array<{ label: string; value: number }>
}

interface ChatTurn {
  id: string
  prompt: string
  answer?: string
  chart?: ChartData | null
  followUps?: string[]
  loading?: boolean
  error?: string
}

const CHART_COLORS = ["#4F46E5", "#0D9488", "#F59E0B", "#DB2777", "#0EA5E9", "#8B5CF6", "#16A34A", "#DC2626", "#6B7280"]

const STARTERS = [
  "What's my total annual premium?",
  "Show me a chart of customers by product.",
  "How many customers have only one product?",
  "Which cities concentrate most of my customers?",
]

function fmt(value: number, unit: ChartData["unit"]) {
  if (unit === "eur") return `€${value.toLocaleString("en-BE")}`
  if (unit === "percent") return `${value.toFixed(1)}%`
  return value.toLocaleString("en-BE")
}

function ChartView({ chart }: { chart: ChartData }) {
  const data = chart.data
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mt-2">
      <div className="text-[12px] font-medium text-[#111827] mb-2">{chart.title}</div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          {chart.type === "bar" ? (
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={data.length > 5 ? -25 : 0} textAnchor={data.length > 5 ? "end" : "middle"} height={data.length > 5 ? 60 : 30} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(Number(v), chart.unit)} />
              <Tooltip formatter={(v: number) => fmt(v, chart.unit)} />
              <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chart.type === "line" ? (
            <LineChart data={data} margin={{ top: 4, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(Number(v), chart.unit)} />
              <Tooltip formatter={(v: number) => fmt(v, chart.unit)} />
              <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          ) : (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" outerRadius={80} label={(p) => p.label}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v, chart.unit)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function AskAiPanel() {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [turns, open])

  async function ask(text?: string) {
    const p = (text ?? prompt).trim()
    if (!p) return
    const id = crypto.randomUUID()
    setTurns((prev) => [...prev, { id, prompt: p, loading: true }])
    setPrompt("")
    try {
      const res = await fetch("/api/agent/insights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      })
      const data = await res.json()
      if (!res.ok) {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, loading: false, error: data.message ?? data.error ?? `HTTP ${res.status}` } : t,
          ),
        )
        return
      }
      setTurns((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, loading: false, answer: data.answer, chart: data.chart, followUps: data.followUpSuggestions }
            : t,
        ),
      )
    } catch (e) {
      setTurns((prev) =>
        prev.map((t) => (t.id === id ? { ...t, loading: false, error: String(e) } : t)),
      )
    }
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
        <div className="fixed top-0 right-0 bottom-0 z-50 w-[400px] bg-white border-l border-gray-200 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#EEF2FF] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#111827]">Portfolio AI</div>
                <div className="text-[11px] text-[#6B7280]">Ask anything about your portfolio</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {turns.length === 0 && (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mx-auto">
                  <MessageSquare className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <div className="text-[13px] text-[#374151] font-medium">Start a conversation</div>
                <div className="text-[12px] text-[#6B7280] px-4">
                  Claude can analyse your portfolio, count customers, and chart distributions.
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
                {t.chart && <ChartView chart={t.chart} />}
                {t.followUps && t.followUps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {t.followUps.map((f) => (
                      <button
                        key={f}
                        onClick={() => ask(f)}
                        className="text-[11.5px] px-2 py-1 rounded-full border border-gray-200 text-[#374151] hover:bg-gray-50"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 p-3">
            <div className="relative">
              <Textarea
                rows={2}
                placeholder="Ask about your portfolio…"
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
