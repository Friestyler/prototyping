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

const ICON_MAP: Record<SmartListIcon, React.ComponentType<{ className?: string }>> = {
  clock: Clock,
  car: Car,
  heart: Heart,
  "trending-up": TrendingUp,
  brain: Brain,
}

type Period = "7d" | "30d" | "60d" | "90d"

interface PriorityRecommendationsProps {
  onCreateCampaignFor?: (useCaseId: string) => void
}

export default function PriorityRecommendations({ onCreateCampaignFor }: PriorityRecommendationsProps) {
  const [period, setPeriod] = useState<Period>("30d")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingFor, setSavingFor] = useState<SmartListUseCase | null>(null)

  const growthScore = 68
  const churnScore = 54

  const handleSaveList = (uc: SmartListUseCase) => {
    setSavingFor(uc)
  }

  const handleConfirmSave = (name: string, type: UserSavedListType) => {
    if (!savingFor) return
    const recordIds = savingFor.customers.map((c) => String(c.recordId))
    saveUserSavedList({
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      type,
      customerCount: savingFor.customers.length || savingFor.clientCount,
      customerIds: recordIds,
      sourceUseCaseId: savingFor.id,
      sourceTitle: savingFor.title,
      iconBg: savingFor.iconBg,
      iconColor: savingFor.iconColor,
      description: savingFor.description,
      createdAt: new Date().toISOString(),
    })
    toast({
      title: "Smart list saved",
      description: `"${name}" added to My Lists as ${type === "dynamic" ? "a dynamic list" : "a static list"}.`,
    })
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
        <div className="flex justify-end">
          <PeriodPills value={period} onChange={setPeriod} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScoreCard
            kind="growth"
            score={growthScore}
            title="Growth Health Score"
            badge="Needs Attention"
            description="5 smart list opportunities to increase premium revenue and expand your book of business."
            scoreLabel="Growth score"
          />
          <ScoreCard
            kind="churn"
            score={churnScore}
            title="Churn Risk Score"
            badge="At Risk"
            description="5 retention campaigns to protect your existing portfolio from client attrition."
            scoreLabel="Churn score"
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

function PeriodPills({ value, onChange }: { value: Period; onChange: (v: Period) => void }) {
  const periods: Period[] = ["7d", "30d", "60d", "90d"]
  return (
    <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
      {periods.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-md transition-colors",
            value === p
              ? "bg-primary text-primary-foreground"
              : "text-gray-600 hover:text-gray-900",
          )}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

function ScoreCard({
  kind,
  score,
  title,
  badge,
  description,
  scoreLabel,
}: {
  kind: "growth" | "churn"
  score: number
  title: string
  badge: string
  description: string
  scoreLabel: string
}) {
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
    </Card>
  )
}

function SmartListCard({
  useCase,
  expanded,
  onToggle,
  onSave,
  onCreateCampaign,
}: {
  useCase: SmartListUseCase
  expanded: boolean
  onToggle: () => void
  onSave: () => void
  onCreateCampaign: () => void
}) {
  const Icon = ICON_MAP[useCase.icon]
  const isGrowth = useCase.type === "drives_growth"

  const HintIcon = isGrowth ? Rocket : ShieldAlert
  const hintLabel = isGrowth ? "Drives growth" : "Prevents churn"

  const canExpand = !useCase.comingSoon

  return (
    <Card className="gap-0 py-0 rounded-2xl border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={canExpand ? onToggle : undefined}
        disabled={!canExpand}
        className={cn(
          "w-full text-left p-4 flex items-start gap-4 transition-colors",
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
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900">{useCase.title}</h3>
            {useCase.comingSoon && (
              <Badge variant="secondary" className="text-[10.5px]">
                <Sparkles className="w-3 h-3" />
                Coming soon
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{useCase.description}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge
            className={cn(
              "rounded-full border",
              isGrowth
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-600 border-red-200",
            )}
          >
            <HintIcon className="w-3 h-3" />
            {hintLabel}
          </Badge>
          {!useCase.comingSoon && (
            <Badge variant="secondary" className="rounded-full border border-gray-200">
              {useCase.matchPct}% {isGrowth ? "match" : "risk"}
            </Badge>
          )}
          {canExpand && (
            <ChevronDown
              className={cn(
                "w-4 h-4 text-gray-400 transition-transform",
                expanded && "rotate-180",
              )}
            />
          )}
        </div>
      </button>

      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/60">
        <div className="text-sm text-gray-600 flex items-center gap-3 flex-wrap">
          <span>
            <span className="font-semibold text-gray-900">{useCase.clientCount}</span> clients
          </span>
          {useCase.atRiskEuros != null && (
            <>
              <span className="text-gray-300">·</span>
              <span>
                <span className="font-semibold text-red-600">€{(useCase.atRiskEuros / 1000).toFixed(0)}k</span> at risk
              </span>
            </>
          )}
          {useCase.growthPotentialEuros != null && (
            <>
              <span className="text-gray-300">·</span>
              <span>
                <span className="font-semibold text-green-600">€{(useCase.growthPotentialEuros / 1000).toFixed(1)}k</span> potential
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSave} disabled={useCase.comingSoon}>
            <Bookmark className="w-3.5 h-3.5" />
            Save list
          </Button>
          <Button size="sm" onClick={onCreateCampaign} disabled={useCase.comingSoon}>
            <Send className="w-3.5 h-3.5" />
            Create campaign
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {expanded && canExpand && (
        <div className="border-t border-gray-100 bg-white">
          {useCase.customers.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              No customers match this list yet.
            </div>
          ) : (
            <CustomerTable customers={useCase.customers} />
          )}
        </div>
      )}
    </Card>
  )
}

