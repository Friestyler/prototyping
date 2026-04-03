"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, ChevronRight, X, TrendingUp } from "lucide-react"
import { BROKER } from "@/lib/portfolio-intelligence-data"
import PortfolioOverview from "@/components/portfolio-overview"
import AISignals from "@/components/ai-signals"
import { cn } from "@/lib/utils"

type ActiveTab = "portfolio" | "signals"

const NOTIFICATIONS = [
  { id: 1, client: "Janssens H.", message: "Churn score 92% — renewal in 47 days", level: "critical" as const },
  { id: 2, client: "Dubois C.", message: "Renewal in 9 days — no contact in 98 days", level: "high" as const },
  { id: 3, client: "Vermeulen K.", message: "Home purchase detected — act within 21 days", level: "medium" as const },
]

interface PortfolioIntelligenceProps {
  onCreateSmartList?: (name: string, clientCount: number) => void
  onOpenTemplate?: (templateName: string) => void
}

export default function PortfolioIntelligence({ onCreateSmartList, onOpenTemplate }: PortfolioIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("portfolio")
  const [signalFilter, setSignalFilter] = useState<string | undefined>()
  const [notifOpen, setNotifOpen] = useState(false)
  const [started, setStarted] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // Start number animations after mount
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 200)
    return () => clearTimeout(t)
  }, [])

  // Close notification dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const switchToSignals = (filter?: string) => {
    setSignalFilter(filter)
    setActiveTab("signals")
  }

  const healthColor =
    BROKER.portfolioHealthScore >= 80
      ? "#16A34A"
      : BROKER.portfolioHealthScore >= 65
      ? "#0D9488"
      : "#F59E0B"

  return (
    <div
      className="flex flex-col bg-[#F8FAFC]"
      style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)" }}
    >
      {/* Top Bar */}
      

      {/* Tab Nav */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 flex-shrink-0">
        <div className="flex gap-1">
          {[
            { key: "portfolio" as ActiveTab, label: "Portfolio Overview" },
            { key: "signals" as ActiveTab, label: "AI Signals" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.key
                  ? "border-[#0D9488] text-[#0D9488]"
                  : "border-transparent text-[#475569] hover:text-[#1A3A5C]",
              )}
            >
              {tab.label}
              {tab.key === "signals" && (
                <span className="ml-2 px-1.5 py-0.5 bg-[#FEE2E2] text-[#DC2626] text-[10px] font-bold rounded-full">
                  3
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 pt-5 pb-6 bg-background">
        {activeTab === "portfolio" && (
          <PortfolioOverview onSwitchToSignals={switchToSignals} onOpenTemplate={onOpenTemplate} started={started} />
        )}
        {activeTab === "signals" && (
          <AISignals key={signalFilter} initialFilter={signalFilter} onCreateSmartList={onCreateSmartList} />
        )}
      </div>
    </div>
  )
}
