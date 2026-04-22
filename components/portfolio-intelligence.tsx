"use client"

import { useEffect, useState } from "react"
import { Sparkles, BarChart3 } from "lucide-react"
import PortfolioOverview from "@/components/portfolio-overview"
import PriorityRecommendations from "@/components/priority-recommendations"
import AiChartBoard from "@/components/ai-chart-board"
import CreateWithAiWorkspace from "@/components/create-with-ai-workspace"
import { useAiInsights } from "@/components/ai-insights-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ActiveTab = "create-ai" | "priority" | "insights"

interface PortfolioIntelligenceProps {
  onCreateSmartList?: (name: string, clientCount: number) => void
  onOpenTemplate?: (templateName: string) => void
  onCreateCampaignFor?: (useCaseId: string) => void
}

export default function PortfolioIntelligence({ onOpenTemplate, onCreateCampaignFor }: PortfolioIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("create-ai")
  const [signalFilter, setSignalFilter] = useState<string | undefined>()
  const [started, setStarted] = useState(false)
  const { setPanelOpen, committed } = useAiInsights()
  const pinnedChartCount = committed.filter((c) => c.kind === "chart").length

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 200)
    return () => clearTimeout(t)
  }, [])

  // Any time a new chart is pinned, surface it by snapping to the Insights sub-tab.
  useEffect(() => {
    if (pinnedChartCount > 0) setActiveTab("insights")
  }, [pinnedChartCount])

  const switchToSignals = (filter?: string) => {
    setSignalFilter(filter)
    setActiveTab("insights")
  }

  return (
    <div className="flex flex-col bg-white min-h-full">
      <div className="px-6 pt-12 pb-6 text-center">
        <h1 className="text-5xl font-semibold text-gray-900 mb-3 text-balance">Activate your portfolio</h1>
        <p className="text-lg text-gray-600 mb-8 text-pretty">
          Create or choose a list to launch your next campaign
        </p>

        <div className="flex items-center justify-center gap-2">
          <Button
            size="lg"
            variant="ghost"
            onClick={() => setActiveTab("create-ai")}
            className={cn(
              "rounded-lg px-6 py-2.5 font-medium transition-all border",
              activeTab === "create-ai"
                ? "bg-[rgb(224,231,255)] text-primary border-transparent hover:bg-[rgb(214,221,245)]"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
            )}
          >
            <Sparkles className="w-4 h-4 mr-2 text-gray-500" />
            Create with AI
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => setActiveTab("priority")}
            className={cn(
              "rounded-lg px-6 py-2.5 font-medium transition-all border",
              activeTab === "priority"
                ? "bg-[rgb(224,231,255)] text-primary border-transparent hover:bg-[rgb(214,221,245)]"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
            )}
          >
            <Sparkles className="w-4 h-4 mr-2 text-gray-500" />
            Priority Recommendations
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => setActiveTab("insights")}
            className={cn(
              "rounded-lg px-6 py-2.5 font-medium transition-all border",
              activeTab === "insights"
                ? "bg-[rgb(224,231,255)] text-primary border-transparent hover:bg-[rgb(214,221,245)]"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
            )}
          >
            <BarChart3 className="w-4 h-4 mr-2 text-gray-500" />
            Portfolio Insights
          </Button>
        </div>
      </div>

      <div className="px-6 pb-10">
        {activeTab === "create-ai" && (
          <CreateWithAiWorkspace onChartPinned={() => setActiveTab("insights")} />
        )}
        {activeTab === "priority" && (
          <PriorityRecommendations onCreateCampaignFor={onCreateCampaignFor} />
        )}
        {activeTab === "insights" && (
          <>
            <AiChartBoard onOpenChat={() => setPanelOpen(true)} />
            <PortfolioOverview
              onSwitchToSignals={switchToSignals}
              onOpenTemplate={onOpenTemplate}
              started={started}
            />
          </>
        )}
      </div>
    </div>
  )
}
