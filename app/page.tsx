"use client"

import { useState } from "react"
import Lists2View from "@/components/lists-2-view"
import CampaignCreationFlow from "@/components/campaign-creation-flow"
import SidebarNavigation from "@/components/sidebar-navigation"
import SmartListsSettings from "@/components/smart-lists-settings"
import PortfolioIntelligence from "@/components/portfolio-intelligence"
import { initialPartners, type Partner } from "@/lib/okr-data"

interface SavedList {
  id: string
  name: string
  type: "static" | "dynamic"
  customerCount: number
  advancedFilters: any
  createdAt: string
  customers?: Partner[]
}

export default function OKRDashboard() {
  const [partners, setPartners] = useState<Partner[]>(initialPartners)
  const [activeMenu, setActiveMenu] = useState("partners")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showCampaignFlow, setShowCampaignFlow] = useState(false)
  const [preSelectedList, setPreSelectedList] = useState<SavedList | undefined>()
  // Template to auto-open in Smart Lists when navigating from Portfolio Insights
  const [pendingTemplate, setPendingTemplate] = useState<string | undefined>()

  const handleCreateCampaign = (savedList?: SavedList, customers?: Partner[]) => {
    if (savedList && customers) {
      setPreSelectedList({ ...savedList, customers })
    } else {
      setPreSelectedList(savedList)
    }
    setShowCampaignFlow(true)
  }

  const handleBackFromCampaign = () => {
    setShowCampaignFlow(false)
    setPreSelectedList(undefined)
  }

  const handleBackFromSettings = () => {
    setActiveMenu("partners")
  }

  // Called from Portfolio Insights action cards — navigate to Smart Lists + open template
  const handleOpenTemplate = (templateName: string) => {
    setPendingTemplate(templateName)
    setActiveMenu("customers")
  }

  if (showCampaignFlow) {
    return (
      <div className="min-h-screen bg-background">
        <CampaignCreationFlow preSelectedList={preSelectedList} onBack={handleBackFromCampaign} />
      </div>
    )
  }

  if (activeMenu === "settings") {
    return (
      <div className="min-h-screen bg-background">
        <SmartListsSettings onBack={handleBackFromSettings} />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      <SidebarNavigation activeMenu={activeMenu} onMenuChange={setActiveMenu} forceCollapsed={sidebarCollapsed} />

      <div className="flex-1 flex flex-col overflow-hidden mt-4">
        <div className="flex-1 overflow-y-auto overflow-x-hidden rounded-tl-2xl shadow-sm">
          <div>
            {activeMenu === "portfolio-insights" && (
              <PortfolioIntelligence onOpenTemplate={handleOpenTemplate} />
            )}
            {(activeMenu === "partners" || activeMenu === "customers") && (
              <Lists2View
                data={partners}
                onChange={setPartners}
                onSidebarCollapseChange={setSidebarCollapsed}
                onCreateCampaign={handleCreateCampaign}
                pendingTemplate={pendingTemplate}
                onTemplateMounted={() => setPendingTemplate(undefined)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
