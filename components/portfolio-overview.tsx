"use client"

import { useEffect, useRef, useState } from "react"
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowRight,
  Activity,
  Target,
  AlertTriangle,
  Zap,
  ChevronDown,
  ShieldCheck,
  TrendingDown,
  ExternalLink,
  BarChart2,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts"
import {
  BROKER,
  PORTFOLIO_STATS,
  PRODUCT_DISTRIBUTION,
  TENURE_DISTRIBUTION,
  HEALTH_DIMENSIONS,
  HEALTH_ACTIONS,
  CHURN_RISK_DIMENSIONS,
  CHURN_BY_TENURE,
  REVENUE_AT_RISK,
  SIGNAL_PIPELINE,
  CONTACT_RECENCY,
  PRODUCT_GAP_DATA,
  CUSTOMERS_BY_PRODUCT_COUNT,
  CLAIMS_BY_TENURE,
} from "@/lib/portfolio-intelligence-data"
import { cn } from "@/lib/utils"

// ── Coverage Penetration Matrix ────────────────────────────────────────────────
const MATRIX_COLUMNS = ["Auto", "Home", "Life", "Health", "Cyber", "Pension"]

const MATRIX_DATA = [
  { segment: "High Value", values: [90, 65, 35, 80, 10, 40] },
  { segment: "Growth",     values: [75, 45, 28, 60,  8, 25] },
  { segment: "New (<1yr)", values: [82, 30, 18, 55,  5, 10] },
  { segment: "At-Risk",    values: [60, 35, 20, 45,  3, 15] },
  { segment: "Lapsed",     values: [40, 25, 12, 30,  2,  8] },
  { segment: "SME",        values: [70, 55, 42, 65, 28, 50] },
]

const PENETRATION_TIERS = [
  { label: "High (70%+)",   bg: "#4338CA", text: "#FFFFFF", min: 70  },
  { label: "Mid (50–70%)",  bg: "#818CF8", text: "#FFFFFF", min: 50  },
  { label: "Low (30–50%)",  bg: "#C7D2FE", text: "#3730A3", min: 30  },
  { label: "Alert (15–30%)",bg: "#F59E0B", text: "#FFFFFF", min: 15  },
  { label: "Critical (<15%)",bg:"#F87171", text: "#FFFFFF", min: 0   },
]

function getPenetrationTier(pct: number) {
  if (pct >= 70) return PENETRATION_TIERS[0]
  if (pct >= 50) return PENETRATION_TIERS[1]
  if (pct >= 30) return PENETRATION_TIERS[2]
  if (pct >= 15) return PENETRATION_TIERS[3]
  return PENETRATION_TIERS[4]
}
// ──────────────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
      else setCount(target)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

function useAnimateWidth(target: number, duration = 900, delay = 0, start = false) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!start) return
    const timer = setTimeout(() => {
      let startTime: number | null = null
      const step = (ts: number) => {
        if (!startTime) startTime = ts
        const progress = Math.min((ts - startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setWidth(eased * target)
        if (progress < 1) requestAnimationFrame(step)
        else setWidth(target)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(timer)
  }, [target, duration, delay, start])
  return width
}

interface KPICardProps {
  icon: React.ReactNode
  label: string
  value: number
  formattedValue?: string
  subtitle: string
  subtitleColor?: string
  extra?: React.ReactNode
  delay?: number
  started: boolean
}

function KPICard({ icon, label, formattedValue, value, subtitle, subtitleColor, extra, delay = 0, started }: KPICardProps) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  const count = useCountUp(value, 1200, started)
  const display = formattedValue
    ? formattedValue.replace(/\d[\d,]*/, () => count.toLocaleString("de-BE"))
    : count.toLocaleString("de-BE")

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col gap-3 transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#475569] uppercase tracking-wider font-[var(--font-dm-sans)]">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-[#F0FDFA] flex items-center justify-center text-[#0D9488]">{icon}</div>
      </div>
      <div className="font-[var(--font-dm-serif)] text-3xl text-[#1A3A5C] leading-none tracking-tight">
        {display}
      </div>
      {extra}
      <p className={cn("text-xs font-[var(--font-dm-sans)]", subtitleColor ?? "text-[#475569]")}>{subtitle}</p>
    </div>
  )
}

function CircularProgress({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const [offset, setOffset] = useState(circ)
  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circ - (score / 100) * circ)
    }, 100)
    return () => clearTimeout(t)
  }, [score, circ])
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#0D9488"
        strokeWidth={6}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
    </svg>
  )
}

function AnimatedBar({ pct, color, delay = 0, started }: { pct: number; color: string; delay?: number; started: boolean }) {
  const width = useAnimateWidth(pct, 900, delay, started)
  return (
    <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-none" style={{ width: `${width}%`, backgroundColor: color }} />
    </div>
  )
}

interface PortfolioOverviewProps {
  onSwitchToSignals: (filter?: string) => void
  onOpenTemplate?: (templateName: string) => void
  started: boolean
}

// ── Large Score Arc ────────────────────────────────────────────────────────────
function ScoreArc({ score, color, size = 120 }: { score: number; color: string; size?: number }) {
  const strokeW = 9
  const r = (size - strokeW * 2) / 2
  const circ = 2 * Math.PI * r
  // Arc goes from -210deg to +30deg (240deg sweep) for a semi-open gauge feel
  const sweep = 240
  const dashTotal = (sweep / 360) * circ
  const [offset, setOffset] = useState(dashTotal)
  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(dashTotal - (score / 100) * dashTotal)
    }, 120)
    return () => clearTimeout(t)
  }, [score, dashTotal])
  // We draw two arcs: track + filled
  const startAngle = -210 // degrees from 3-o-clock
  const rad = (deg: number) => (deg * Math.PI) / 180
  const cx = size / 2, cy = size / 2
  const arcPath = (startDeg: number, endDeg: number, radius: number) => {
    const start = { x: cx + radius * Math.cos(rad(startDeg)), y: cy + radius * Math.sin(rad(startDeg)) }
    const end = { x: cx + radius * Math.cos(rad(endDeg)), y: cy + radius * Math.sin(rad(endDeg)) }
    const largeArc = endDeg - startDeg > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
  }
  const trackD = arcPath(startAngle, startAngle + sweep, r)
  const fillD = arcPath(startAngle, startAngle + (score / 100) * sweep, r)
  return (
    <svg width={size} height={size}>
      <path d={trackD} fill="none" stroke="#E2E8F0" strokeWidth={strokeW} strokeLinecap="round" />
      <path
        d={fillD}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(0.16,1,0.3,1)" }}
      />
    </svg>
  )
}
// ──────────────────────────────────────────────────────────────────────────────

export default function PortfolioOverview({ onSwitchToSignals, onOpenTemplate, started }: PortfolioOverviewProps) {
  const [expandedCard, setExpandedCard] = useState<"health" | "churn" | null>(null)
  const totalCount = PRODUCT_DISTRIBUTION.reduce((s, p) => s + p.count, 0)
  const tenureTotal = TENURE_DISTRIBUTION.reduce((s, t) => s + t.count, 0)

  const healthScore = useCountUp(BROKER.portfolioHealthScore, 1400, started)
  const churnScore = useCountUp(BROKER.churnRiskScore, 1400, started)
  const renewalsCount = useCountUp(PORTFOLIO_STATS.renewalsNext90Days, 1000, started)

  const healthColor = BROKER.portfolioHealthScore >= 80 ? "#16A34A" : BROKER.portfolioHealthScore >= 65 ? "#0D9488" : "#F59E0B"
  const churnColor = BROKER.churnRiskScore >= 60 ? "#DC2626" : BROKER.churnRiskScore >= 40 ? "#F59E0B" : "#16A34A"
  const churnLabel = BROKER.churnRiskScore >= 60 ? "High Risk" : BROKER.churnRiskScore >= 40 ? "Moderate" : "Low Risk"

  return (
    <div className="font-[var(--font-dm-sans)] space-y-6 pb-10">

      {/* ── Hero Score Cards + standard KPIs ─────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">

        {/* Health Score Card */}
        <div className="col-span-1">
          <button
            className={cn(
              "w-full text-left bg-white rounded-xl border transition-all duration-200 p-5 flex flex-col gap-1",
              expandedCard === "health"
                ? "border-[#0D9488] shadow-md ring-1 ring-[#0D9488]/20"
                : "border-[#E2E8F0] hover:border-[#0D9488]/40 hover:shadow-sm",
            )}
            onClick={() => setExpandedCard(expandedCard === "health" ? null : "health")}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider">Health Score</span>
              <div className="flex items-center gap-1.5">
                
                <ChevronDown
                  size={14}
                  className={cn("text-[#94A3B8] transition-transform duration-200", expandedCard === "health" && "rotate-180")}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <ScoreArc score={BROKER.portfolioHealthScore} color={healthColor} size={80} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-[var(--font-dm-serif)] text-xl text-[#1A3A5C] leading-none">{healthScore}</span>
                </div>
              </div>
              <div>
                <div className="font-[var(--font-dm-serif)] text-2xl text-[#1A3A5C] leading-none">
                  {healthScore}<span className="text-sm text-[#94A3B8] font-normal">/100</span>
                </div>
                <p className="text-xs text-[#475569] mt-1">Top {BROKER.peerPercentile}% of peers</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <ShieldCheck size={11} style={{ color: healthColor }} />
                  <span className="text-[10.5px] font-medium" style={{ color: healthColor }}>
                    {BROKER.portfolioHealthScore >= 80 ? "Excellent" : BROKER.portfolioHealthScore >= 65 ? "Good" : "Needs attention"}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Churn Risk Card */}
        <div className="col-span-1">
          <button
            className={cn(
              "w-full text-left bg-white rounded-xl border transition-all duration-200 p-5 flex flex-col gap-1",
              expandedCard === "churn"
                ? "border-[#EF4444] shadow-md ring-1 ring-[#EF4444]/20"
                : "border-[#E2E8F0] hover:border-[#EF4444]/40 hover:shadow-sm",
            )}
            onClick={() => setExpandedCard(expandedCard === "churn" ? null : "churn")}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider">Churn Risk</span>
              <div className="flex items-center gap-1.5">
                
                <ChevronDown
                  size={14}
                  className={cn("text-[#94A3B8] transition-transform duration-200", expandedCard === "churn" && "rotate-180")}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <ScoreArc score={BROKER.churnRiskScore} color={churnColor} size={80} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-[var(--font-dm-serif)] text-xl text-[#1A3A5C] leading-none">{churnScore}</span>
                </div>
              </div>
              <div>
                <div className="font-[var(--font-dm-serif)] text-2xl text-[#1A3A5C] leading-none">
                  {churnScore}<span className="text-sm text-[#94A3B8] font-normal">/100</span>
                </div>
                <p className="text-xs text-[#475569] mt-1">47 clients flagged</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <TrendingDown size={11} style={{ color: churnColor }} />
                  <span className="text-[10.5px] font-medium" style={{ color: churnColor }}>{churnLabel}</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Total Clients */}
        <KPICard
          icon={<Users size={16} />}
          label="Total Clients"
          value={BROKER.totalClients}
          subtitle={`${BROKER.totalHouseholds.toLocaleString("de-BE")} households`}
          delay={0}
          started={started}
        />
        {/* Renewals */}
        <KPICard
          icon={<Calendar size={16} />}
          label="Renewals Next 90 Days"
          value={PORTFOLIO_STATS.renewalsNext90Days}
          subtitle="€342,000 at risk"
          subtitleColor="text-[#F59E0B]"
          delay={60}
          started={started}
        />
      </div>

      {/* ── Expandable Breakdown Panels ───────────────────────────────────── */}
      {expandedCard === "health" && (
        <div className="bg-white rounded-xl border border-[#0D9488]/30 p-5 -mt-2 shadow-sm">
          <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-3">
            Recommended actions
          </p>
          <div className="grid grid-cols-3 gap-3">
            {HEALTH_ACTIONS.map((action) => (
              <button
                key={action.signalId}
                onClick={() => onOpenTemplate?.(action.templateName)}
                className="group text-left p-4 rounded-lg border border-[#E2E8F0] hover:border-[#0D9488] hover:bg-[#F0FDFA] transition-all duration-150"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[11.5px] text-[#1A3A5C] leading-relaxed font-medium">{action.text}</p>
                  <ExternalLink
                    size={13}
                    className="text-[#0D9488] flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#94A3B8] truncate max-w-[140px]">{action.templateName}</span>
                  <span className="text-[11px] font-bold text-[#0D9488]">{action.pts}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#F0FDFA] border border-[#99F6E4] text-[#0D9488] text-[10px] font-semibold">
                    Open template
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">{action.clientCount} clients</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {expandedCard === "churn" && (
        <div className="bg-white rounded-xl border border-[#EF4444]/30 p-5 -mt-2 shadow-sm">
          <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-3">
            Recommended actions
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { text: "Re-engage 47 clients in churn-risk window (1–2 yr tenure)", pts: "-6 pts", templateName: "Churn Risk — Single Product Peak Window", clientCount: 47 },
              { text: "Add cross-sell product to 231 single-policy households", pts: "-5 pts", templateName: "Cross-Sell — Schuldsaldo for Homeowners", clientCount: 231 },
              { text: "Contact 213 clients inactive for 12+ months", pts: "-4 pts", templateName: "Churn Risk — Long-Term Zero Claims", clientCount: 213 },
            ].map((item) => (
              <button
                key={item.templateName}
                onClick={() => onOpenTemplate?.(item.templateName)}
                className="group text-left p-4 rounded-lg border border-[#E2E8F0] hover:border-[#EF4444] hover:bg-[#FFF5F5] transition-all duration-150"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[11.5px] text-[#1A3A5C] leading-relaxed font-medium">{item.text}</p>
                  <ExternalLink
                    size={13}
                    className="text-[#EF4444] flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#94A3B8] truncate max-w-[140px]">{item.templateName}</span>
                  <span className="text-[11px] font-bold text-[#EF4444]">{item.pts}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#FFF5F5] border border-[#FCA5A5] text-[#EF4444] text-[10px] font-semibold">
                    Open template
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">{item.clientCount} clients</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Two-column row */}
      <div className="grid grid-cols-5 gap-5">
        {/* Product Distribution (60%) */}
        <div className="col-span-3 bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h3 className="text-sm font-semibold text-[#1A3A5C] mb-4">Product Distribution</h3>
          <div className="space-y-3">
            {PRODUCT_DISTRIBUTION.map((p, i) => {
              const pct = Math.round((p.count / totalCount) * 100)
              return (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="font-medium text-[#1A3A5C]">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[#475569]">
                      <span>{p.count} clients</span>
                      
                    </div>
                  </div>
                  <AnimatedBar pct={pct} color={p.color} delay={i * 80} started={started} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Tenure Breakdown (40%) */}
        <div className="col-span-2 bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-[#1A3A5C]">Client Tenure Breakdown</h3>
          <div className="space-y-2">
            {TENURE_DISTRIBUTION.map((t, i) => {
              const pct = Math.round((t.count / tenureTotal) * 100)
              const barColor = t.risk === "high" ? "#DC2626" : t.risk === "medium" ? "#F59E0B" : "#16A34A"
              return (
                <div key={t.label} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#475569]">{t.label}</span>
                    <span className="font-medium text-[#1A3A5C]">{t.count}</span>
                  </div>
                  <AnimatedBar pct={pct} color={barColor} delay={i * 80} started={started} />
                </div>
              )
            })}
          </div>
          <div className="pt-2 border-t border-[#E2E8F0] space-y-1 text-xs text-[#475569]">
            <p>Average tenure: <span className="font-semibold text-[#1A3A5C]">{PORTFOLIO_STATS.avgTenureYears} years</span></p>
            <p><span className="font-semibold text-[#1A3A5C]">{PORTFOLIO_STATS.singleProductHouseholds}</span> single-product households (37.8%)</p>
          </div>
        </div>
      </div>

      {/* Engagement Health Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Email Capture */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-[#0D9488]" />
            <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider">Email Capture Rate</span>
          </div>
          <div className="font-[var(--font-dm-serif)] text-3xl text-[#1A3A5C]">{PORTFOLIO_STATS.emailCaptureRate}%</div>
          <AnimatedBar pct={PORTFOLIO_STATS.emailCaptureRate} color="#0D9488" delay={200} started={started} />
          <p className="text-xs text-[#475569]">{PORTFOLIO_STATS.emailCaptureRate}% of clients reachable by email</p>
        </div>
        {/* Active */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-[#0D9488]" />
            <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider">Active Last 12 Months</span>
          </div>
          <div className="font-[var(--font-dm-serif)] text-3xl text-[#1A3A5C]">{PORTFOLIO_STATS.activeLastYear} <span className="text-lg text-[#475569]">clients</span></div>
          <AnimatedBar pct={Math.round((PORTFOLIO_STATS.activeLastYear / BROKER.totalClients) * 100)} color="#0D9488" delay={250} started={started} />
          <p className="text-xs text-[#475569]">{PORTFOLIO_STATS.inactiveOverOneYear} clients not contacted in 12+ months</p>
        </div>
        {/* Avg products */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Target size={15} className="text-[#0D9488]" />
            <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider">Avg Products / Household</span>
          </div>
          <div className="font-[var(--font-dm-serif)] text-3xl text-[#1A3A5C]">{PORTFOLIO_STATS.avgProductsPerHousehold} <span className="text-lg text-[#475569]">/ 4</span></div>
          {/* Gauge 1-4 */}
          <div className="relative">
            <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
              <AnimatedBar pct={((PORTFOLIO_STATS.avgProductsPerHousehold - 1) / 3) * 100} color="#0D9488" delay={300} started={started} />
            </div>
            <div className="flex justify-between text-[10px] text-[#475569] mt-1">
              <span>1</span><span>2</span><span>3</span><span>4</span>
            </div>
          </div>
          <p className="text-xs text-[#475569]">Target: 3.0 products per household</p>
        </div>
      </div>

      {/* ── Chart Row 1: Churn by Tenure + Revenue at Risk ────────────────── */}
      

      {/* ── Chart Row 2: Signal Pipeline + Contact Recency ────────────────── */}
      

      {/* ── Chart Row 3: Product Gap Revenue ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-[#0D9488]" />
            <h3 className="text-sm font-semibold text-[#1A3A5C]">Cross-Sell Gap by Household Density</h3>
          </div>
          <button
            onClick={() => onSwitchToSignals("crosssell")}
            className="flex items-center gap-1 text-[10.5px] font-semibold text-[#0D9488] hover:underline"
          >
            View signals <ArrowRight size={11} />
          </button>
        </div>
        <p className="text-xs text-[#475569] mb-4">Estimated missed premium revenue per product-density cohort — cross-sell opportunity</p>
        <div className="grid grid-cols-4 gap-3">
          {PRODUCT_GAP_DATA.map((d, i) => {
            const maxRev = Math.max(...PRODUCT_GAP_DATA.map(x => x.missedRevenue))
            const barPct = (d.missedRevenue / maxRev) * 100
            const colors = ["#EF4444", "#F97316", "#F59E0B", "#0D9488"]
            return (
              <div key={d.cohort} className="flex flex-col gap-2 p-3 rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#475569]">{d.cohort}</span>
                  <span className="text-[10px] font-semibold" style={{ color: colors[i] }}>{d.households} HH</span>
                </div>
                <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: colors[i] }} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1A3A5C]">€{(d.missedRevenue / 1000).toFixed(0)}k</p>
                  <p className="text-[10px] text-[#475569]">missed revenue</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Chart Row 4: Product Count Distribution + Claims by Tenure ─────── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Customers by Number of Products */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-[#2563EB]" />
            <h3 className="text-sm font-semibold text-[#1A3A5C]">Customers by Product Count</h3>
          </div>
          <p className="text-xs text-[#475569] mb-4">Distribution of households by number of active policies</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={CUSTOMERS_BY_PRODUCT_COUNT} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="products"
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v}`}
              />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 11 }}
                formatter={(val: number) => [val, "Customers"]}
              />
              <Bar dataKey="customers" name="Customers" radius={[4, 4, 0, 0]} maxBarSize={44}>
                {CUSTOMERS_BY_PRODUCT_COUNT.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {CUSTOMERS_BY_PRODUCT_COUNT.map(d => (
              <span key={d.products} className="flex items-center gap-1 text-[10px] text-[#475569]">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: d.color }} />
                {d.products}: <span className="font-semibold text-[#1A3A5C] ml-0.5">{d.customers}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Claims by Tenure Band */}
        
      </div>

      {/* Coverage Penetration Matrix */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#1A3A5C]">Coverage Penetration Matrix</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6D28D9] text-white uppercase tracking-wide">AI</span>
            </div>
            <p className="text-xs text-[#475569] mt-0.5">Click any cell to explore the segment and launch a campaign</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-separate border-spacing-1.5">
            <thead>
              <tr>
                <th className="w-24" />
                {MATRIX_COLUMNS.map((col) => (
                  <th key={col} className="text-xs font-semibold text-[#475569] text-center pb-2 px-1">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX_DATA.map((row) => (
                <tr key={row.segment}>
                  <td className="text-xs font-semibold text-[#1A3A5C] pr-3 whitespace-nowrap">{row.segment}</td>
                  {row.values.map((pct, ci) => {
                    const tier = getPenetrationTier(pct)
                    const hasAlert = pct < 30 && pct >= 15
                    const isCritical = pct < 15
                    return (
                      <td key={ci} className="p-0">
                        <button
                          className="relative w-full rounded-lg px-2 py-2.5 text-sm font-bold text-center transition-all duration-150 hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#6D28D9]"
                          style={{ backgroundColor: tier.bg, color: tier.text }}
                          title={`${row.segment} × ${MATRIX_COLUMNS[ci]}: ${pct}% penetration`}
                          onClick={() => onSwitchToSignals("crosssell")}
                        >
                          {(hasAlert || isCritical) && (
                            <span className="absolute top-0.5 right-1 text-[9px] leading-none opacity-80">▲</span>
                          )}
                          {pct}%
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[#E2E8F0]">
          {PENETRATION_TIERS.map((tier) => (
            <div key={tier.label} className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ backgroundColor: tier.bg }} />
              <span className="text-xs text-[#475569]">{tier.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
