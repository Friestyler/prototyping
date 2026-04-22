"use client"

import { Undo2, Redo2, Sparkles, MessageSquare, X } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAiInsights, type ChartData } from "@/components/ai-insights-context"

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

function fmt(value: number, unit: ChartData["unit"]) {
  if (unit === "eur") return `€${value.toLocaleString("en-BE")}`
  if (unit === "percent") return `${value.toFixed(1)}%`
  return value.toLocaleString("en-BE")
}

function ChartView({ chart }: { chart: ChartData }) {
  const data = chart.data
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        {chart.type === "bar" ? (
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              interval={0}
              angle={data.length > 5 ? -25 : 0}
              textAnchor={data.length > 5 ? "end" : "middle"}
              height={data.length > 5 ? 70 : 30}
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(Number(v), chart.unit)} />
            <Tooltip formatter={(v: number) => fmt(v, chart.unit)} />
            <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : chart.type === "line" ? (
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(Number(v), chart.unit)} />
            <Tooltip formatter={(v: number) => fmt(v, chart.unit)} />
            <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" outerRadius={100} label={(p) => p.label}>
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
  )
}

export default function AiChartBoard({
  onOpenChat,
}: {
  onOpenChat?: (sessionId: string) => void
}) {
  const { committed, switchSession, undoArtefact, redoArtefact, removeCommitted } = useAiInsights()

  const pinnedCharts = committed.filter((c) => c.kind === "chart")

  if (pinnedCharts.length === 0) return null

  return (
    <div className="max-w-6xl mx-auto mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-md bg-[#EEF2FF] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#4F46E5]" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">AI Charts</h2>
        <span className="text-sm text-gray-500">Pinned from your conversations</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pinnedCharts.map((pc) => {
          const version = pc.versions[pc.activeVersion]
          if (!version || version.artefact.kind !== "chart") return null
          const canUndo = pc.activeVersion > 0
          const canRedo = pc.activeVersion < pc.versions.length - 1

          return (
            <Card key={pc.id} className="p-5 rounded-2xl border-gray-200">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {version.artefact.chart.title}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">From: {pc.sessionTitle}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => undoArtefact(pc.id)}
                    disabled={!canUndo}
                    title="Previous version"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-[11px] text-gray-500 tabular-nums px-1">
                    v{pc.activeVersion + 1}/{pc.versions.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => redoArtefact(pc.id)}
                    disabled={!canRedo}
                    title="Next version"
                  >
                    <Redo2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      switchSession(pc.sessionId)
                      onOpenChat?.(pc.sessionId)
                    }}
                    title="Continue this conversation"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:text-red-600"
                    onClick={() => removeCommitted(pc.id)}
                    title="Remove from Insights"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <ChartView chart={version.artefact.chart} />
            </Card>
          )
        })}
      </div>
    </div>
  )
}
