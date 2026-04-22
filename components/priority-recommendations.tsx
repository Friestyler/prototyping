"use client"

import { useState } from "react"
import {
  Clock,
  Car,
  Heart,
  TrendingUp,
  Brain,
  Bookmark,
  Send,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ShieldAlert,
  Rocket,
  Lock,
  Bot,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { CustomerTable } from "@/components/customer-table"
import { cn } from "@/lib/utils"
import {
  SMART_LIST_USE_CASES,
  type SmartListIcon,
  type SmartListUseCase,
} from "@/lib/smart-list-use-cases"
import { toast } from "@/hooks/use-toast"
import { SaveSmartListDialog } from "@/components/save-smart-list-dialog"
import { saveUserSavedList, type UserSavedListType } from "@/lib/user-saved-lists"
import { useAiInsights } from "@/components/ai-insights-context"

const ICON_MAP: Record<SmartListIcon, React.ComponentType<{ className?: string }>> = {
  clock: Clock,
  car: Car,
  heart: Heart,
  "trending-up": TrendingUp,
  brain: Brain,
}


interface PriorityRecommendationsProps {
  onCreateCampaignFor?: (useCaseId: string) => void
}

export default function PriorityRecommendations({ onCreateCampaignFor }: PriorityRecommendationsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingFor, setSavingFor] = useState<SmartListUseCase | null>(null)
  const [savingAgentFor, setSavingAgentFor] = useState<SmartListUseCase | null>(null)
  const { requestNavigation } = useAiInsights()

  const growthScore = 68
  const churnScore = 54

  const handleSaveList = (uc: SmartListUseCase) => {
    setSavingFor(uc)
  }

  const handleSaveAgent = (uc: SmartListUseCase) => {
    setSavingAgentFor(uc)
  }

  const handleConfirmSaveAgent = async (name: string) => {
    if (!savingAgentFor) return
    toast({
      title: "Agent saved",
      description: `"${name}" will keep "${savingAgentFor.title}" in sync.`,
    })
    setSavingAgentFor(null)
  }

  const handleConfirmSave = async (name: string, type: UserSavedListType) => {
    if (!savingFor) return
    const recordIds = savingFor.customers.map((c) => String(c.recordId))
    const saved = await saveUserSavedList({
      name,
      type,
      customerIds: recordIds,
      sourceUseCaseId: savingFor.id,
      sourceTitle: savingFor.title,
      iconBg: savingFor.iconBg,
      iconColor: savingFor.iconColor,
      description: savingFor.description,
    })
    if (saved) {
      toast({
        title: "Smart list saved",
        description: `"${name}" opened in Customers.`,
      })
      requestNavigation({ menu: "customers", listId: saved.id })
    } else {
      toast({
        title: "Couldn't save list",
        description: "The server rejected the save. Check the API logs.",
      })
    }
    setSavingFor(null)
  }

  const handleCreateCampaign = (uc: SmartListUseCase) => {
    if (uc.comingSoon) {
      toast({
        title: "Coming soon",
        description: "The ML churn model is being trained on your portfolio — available in the next release.",
      })
      return
    }
    if (onCreateCampaignFor) onCreateCampaignFor(uc.id)
    else {
      toast({
        title: "Opening campaign builder",
        description: `Pre-selecting "${uc.title}" (${uc.clientCount} clients).`,
      })
    }
  }

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScoreCard
            kind="growth"
            score={growthScore}
            title="Growth Health Score"
            badge="Needs Attention"
            description="5 smart list opportunities to increase premium revenue and expand your book of business."
            scoreLabel="Growth score"
            breakdown={[
              { label: "Missing products", value: "312 customers", tone: "amber" },
              { label: "Unactioned life events", value: "47 last 90 days", tone: "amber" },
              { label: "Tax and pension gaps", value: "€128k potential", tone: "green" },
            ]}
          />
          <ScoreCard
            kind="churn"
            score={churnScore}
            title="Churn Risk Score"
            badge="At Risk"
            description="5 retention campaigns to protect your existing portfolio from client attrition."
            scoreLabel="Churn score"
            breakdown={[
              { label: "Payment failures", value: "12 last 30 days", tone: "red" },
              { label: "Premium increase YoY", value: "+8.4%", tone: "red" },
              { label: "Days to next renewal", value: "avg 48 days", tone: "neutral" },
              { label: "Active policies per client", value: "avg 1.8", tone: "neutral" },
            ]}
          />
        </div>

        <div>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recommended smart lists</h2>
            </div>
            <div className="text-sm text-gray-500">Based on your portfolio · Updated today</div>
          </div>

          <div className="space-y-3">
            {SMART_LIST_USE_CASES.map((uc) => (
              <SmartListCard
                key={uc.id}
                useCase={uc}
                expanded={expandedId === uc.id}
                onToggle={() => setExpandedId(expandedId === uc.id ? null : uc.id)}
                onSave={() => handleSaveList(uc)}
                onSaveAgent={() => handleSaveAgent(uc)}
                onCreateCampaign={() => handleCreateCampaign(uc)}
              />
            ))}
          </div>
        </div>
      </div>

      <SaveSmartListDialog
        open={!!savingFor}
        onOpenChange={(o) => !o && setSavingFor(null)}
        defaultName={savingFor?.title ?? ""}
        onConfirm={handleConfirmSave}
      />

      <SaveSmartListDialog
        variant="agent"
        open={!!savingAgentFor}
        onOpenChange={(o) => !o && setSavingAgentFor(null)}
        defaultName={savingAgentFor?.title ?? ""}
        onConfirm={(name) => handleConfirmSaveAgent(name)}
      />
    </>
  )
}

function SectionHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

interface ScoreFactor {
  label: string
  value: string
  /** Lightweight qualitative colour so e.g. "high-risk" rows read at a glance. */
  tone?: "neutral" | "red" | "green" | "amber"
}

function ScoreCard({
  kind,
  score,
  title,
  badge,
  description,
  scoreLabel,
  breakdown,
}: {
  kind: "growth" | "churn"
  score: number
  title: string
  badge: string
  description: string
  scoreLabel: string
  breakdown?: ScoreFactor[]
}) {
  const [expanded, setExpanded] = useState(false)
  const isGrowth = kind === "growth"
  const barColor = isGrowth ? "bg-green-500" : "bg-red-500"
  const ringStroke = isGrowth ? "#16A34A" : "#DC2626"
  const scoreNumber = isGrowth ? "text-green-600" : "text-red-600"

  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <Card className="gap-4 py-5 rounded-2xl border-gray-200">
      <div className="px-5 flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="6" />
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke={ringStroke}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-gray-900">
            {score}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <Badge
              className={cn(
                "rounded-full border",
                isGrowth
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-600 border-red-200",
              )}
            >
              {badge}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="px-5">
        <div className="flex items-center justify-between text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          <span>{scoreLabel}</span>
          <span className={cn("font-semibold", scoreNumber)}>{score}/100</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {breakdown && breakdown.length > 0 && (
        <div className="px-5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors pt-3 border-t border-gray-100"
          >
            <span>{expanded ? "Hide breakdown" : "See breakdown"}</span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-gray-400 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>

          {expanded && (
            <ul className="mt-3 space-y-2">
              {breakdown.map((f) => (
                <li
                  key={f.label}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-gray-600">{f.label}</span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      f.tone === "red" && "text-red-600",
                      f.tone === "green" && "text-green-600",
                      f.tone === "amber" && "text-amber-700",
                      (!f.tone || f.tone === "neutral") && "text-gray-900",
                    )}
                  >
                    {f.value}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  )
}

function SmartListCard({
  useCase,
  expanded,
  onToggle,
  onSave,
  onSaveAgent,
  onCreateCampaign,
}: {
  useCase: SmartListUseCase
  expanded: boolean
  onToggle: () => void
  onSave: () => void
  onSaveAgent: () => void
  onCreateCampaign: () => void
}) {
  const Icon = ICON_MAP[useCase.icon]
  const isGrowth = useCase.type === "drives_growth"

  const HintIcon = isGrowth ? Rocket : ShieldAlert
  const hintLabel = isGrowth ? "Drives growth" : "Prevents churn"

  const canExpand = !useCase.comingSoon

  const heroAmount =
    useCase.atRiskEuros != null
      ? { label: "annual premium at risk", value: useCase.atRiskEuros, color: "text-red-600" }
      : null

  return (
    <Card
      className={cn(
        "gap-0 py-0 rounded-2xl border overflow-hidden transition-all",
        expanded ? "border-gray-300 shadow-md" : "border-gray-200 hover:border-gray-300",
      )}
    >
      <button
        type="button"
        onClick={canExpand ? onToggle : undefined}
        disabled={!canExpand}
        aria-expanded={expanded}
        className={cn(
          "w-full text-left p-4 flex items-center gap-4 transition-colors",
          canExpand && "hover:bg-gray-50/60 cursor-pointer",
          !canExpand && "cursor-default",
        )}
      >
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: useCase.iconBg }}
        >
          <Icon className="w-5 h-5" style={{ color: useCase.iconColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="text-[15px] font-semibold text-gray-900 truncate">{useCase.title}</h3>
            {useCase.comingSoon && (
              <Badge variant="secondary" className="text-[10.5px]">
                <Sparkles className="w-3 h-3" />
                Coming soon
              </Badge>
            )}
            {!useCase.comingSoon && (
              <Badge
                className={cn(
                  "rounded-full border text-[10.5px] font-medium",
                  isGrowth
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-600 border-red-200",
                )}
              >
                <HintIcon className="w-3 h-3" />
                {useCase.matchPct}% {isGrowth ? "match" : "risk"} · {hintLabel}
              </Badge>
            )}
          </div>
          <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-2">{useCase.description}</p>
        </div>

        <div className="flex-shrink-0 text-right hidden sm:block">
          {heroAmount ? (
            <>
              <div className={cn("text-xl font-semibold tabular-nums", heroAmount.color)}>
                €{(heroAmount.value / 1000).toFixed(heroAmount.value >= 10_000 ? 0 : 1)}k
              </div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wide">
                {heroAmount.label} · {useCase.clientCount} clients
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-semibold tabular-nums text-gray-900">
                {useCase.clientCount}
              </div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wide">
                matching clients
              </div>
            </>
          )}
        </div>

        {canExpand && (
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform flex-shrink-0",
              expanded && "rotate-180",
            )}
          />
        )}
      </button>

      {expanded && canExpand && (
        <>
          {/* Save-to-refine banner (owns the Save list CTA) */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-indigo-50/40">
            <div className="flex items-center gap-2.5 text-sm text-indigo-950/80 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white border border-indigo-100 flex items-center justify-center flex-shrink-0">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-[13px] text-gray-900">Preview mode</div>
                <div className="text-[12px] text-gray-600 truncate">
                  Save this list to refine with filters and unlock sorting.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={onSave}>
                <Bookmark className="w-3.5 h-3.5" />
                Save list
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onSaveAgent()
                }}
              >
                <Bot className="w-3.5 h-3.5" />
                Agent
              </Button>
            </div>
          </div>

          {/* Preview table */}
          <div className="border-t border-gray-100 bg-white">
            {useCase.customers.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                No customers match this list yet.
              </div>
            ) : (
              <CustomerTable customers={useCase.customers} previewMode onSave={onSave} />
            )}
          </div>

          {/* Primary action footer */}
          <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-100 bg-white">
            <Button onClick={onCreateCampaign}>
              <Send className="w-3.5 h-3.5" />
              Create campaign
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}


