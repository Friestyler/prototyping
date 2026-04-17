"use client"

import { useState } from "react"
import Lists2View from "@/components/lists-2-view"
import CampaignCreationFlow from "@/components/campaign-creation-flow"
import SidebarNavigation from "@/components/sidebar-navigation"
import SmartListsSettings from "@/components/smart-lists-settings"
import PortfolioIntelligence from "@/components/portfolio-intelligence"
import LeadsPage from "@/components/leads-campaigns/leads-page"
import CampaignsPage from "@/components/leads-campaigns/campaigns-page"
// `Partner` is a legacy type name in okr-data.ts — it's the customer record shape.
import { type Partner as CustomerRecord } from "@/lib/okr-data"
import { MASTER_CUSTOMERS_AS_RECORDS } from "@/lib/customer-database"
import { findSmartListUseCase } from "@/lib/smart-list-use-cases"

interface SavedList {
  id: string
  name: string
  type: "static" | "dynamic"
  customerCount: number
  advancedFilters: any
  createdAt: string
  customers?: CustomerRecord[]
}

const ALL_CUSTOMERS: CustomerRecord[] = MASTER_CUSTOMERS_AS_RECORDS

export default function OKRDashboard() {
  const [customers, setCustomers] = useState<CustomerRecord[]>(ALL_CUSTOMERS)
  const [activeMenu, setActiveMenu] = useState("partners")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showCampaignFlow, setShowCampaignFlow] = useState(false)
  const [preSelectedList, setPreSelectedList] = useState<SavedList | undefined>()
  // Template to auto-open in Smart Lists when navigating from Portfolio Insights
  const [pendingTemplate, setPendingTemplate] = useState<string | undefined>()
  const [campaignsInitialName, setCampaignsInitialName] = useState<string | undefined>()

  const handleCreateCampaign = (savedList?: SavedList, listCustomers?: CustomerRecord[]) => {
    if (savedList && listCustomers) {
      setPreSelectedList({ ...savedList, customers: listCustomers })
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

  // Called from Priority Recommendations → Create campaign CTA
  const handleCreateCampaignForUseCase = (useCaseId: string) => {
    const uc = findSmartListUseCase(useCaseId)
    setCampaignsInitialName(uc?.title)
    setActiveMenu("campaigns")
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
              <PortfolioIntelligence
                onOpenTemplate={handleOpenTemplate}
                onCreateCampaignFor={handleCreateCampaignForUseCase}
              />
            )}
            {activeMenu === "leads" && <LeadsPage />}
            {activeMenu === "campaigns" && (
              <CampaignsPage
                initialCampaignName={campaignsInitialName}
                onInitialConsumed={() => setCampaignsInitialName(undefined)}
              />
            )}
            {(activeMenu === "partners" || activeMenu === "customers") && (
              <Lists2View
                data={customers}
                onChange={setCustomers}
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
