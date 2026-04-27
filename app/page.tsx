"use client"

import { useState } from "react"
import Lists2View from "@/components/lists-2-view"
import CampaignCreationFlow from "@/components/campaign-creation-flow"
import SidebarNavigation from "@/components/sidebar-navigation"
import SmartListsSettings from "@/components/smart-lists-settings"
import PortfolioIntelligence from "@/components/portfolio-intelligence"
import LeadsPage from "@/components/leads-campaigns/leads-page"
import CampaignsPage from "@/components/leads-campaigns/campaigns-page"
import MCPSetupPage from "@/components/mcp-setup-page"
import BrokerHubPage from "@/components/broker-hub-page"
import ProductsPage from "@/components/products-page"
import ContactsPage from "@/components/contacts-page"
import FormsPage from "@/components/forms-page"
import AssetsPage from "@/components/assets-page"
// `Partner` is a legacy type name in okr-data.ts — it's the customer record shape.
import { type Partner as CustomerRecord } from "@/lib/okr-data"
import { MASTER_CUSTOMERS_AS_RECORDS } from "@/lib/customer-database"
import {
  IMPORTED_CUSTOMERS_CHANGE_EVENT,
  getImportedCustomerRecords,
} from "@/lib/imported-customers-store"
import { findSmartListUseCase } from "@/lib/smart-list-use-cases"
import { AiInsightsProvider, useAiInsights, type PendingNavigation } from "@/components/ai-insights-context"
import AskAiPanel from "@/components/ask-ai-panel"
import { useEffect } from "react"

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

  // Merge in customers that were added via Broker Hub file uploads (e.g. AXA
  // Chutes). Re-sync whenever the store broadcasts a change.
  useEffect(() => {
    const sync = () => {
      const imported = getImportedCustomerRecords()
      if (imported.length === 0) return
      setCustomers((prev) => {
        const existing = new Set(prev.map((p) => p.id))
        const additions = imported.filter((i) => !existing.has(i.id))
        return additions.length > 0 ? [...prev, ...additions] : prev
      })
    }
    sync()
    window.addEventListener(IMPORTED_CUSTOMERS_CHANGE_EVENT, sync)
    return () => window.removeEventListener(IMPORTED_CUSTOMERS_CHANGE_EVENT, sync)
  }, [])
  const [activeMenu, setActiveMenu] = useState("partners")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showCampaignFlow, setShowCampaignFlow] = useState(false)
  const [preSelectedList, setPreSelectedList] = useState<SavedList | undefined>()
  // Template to auto-open in Smart Lists when navigating from Portfolio Insights
  const [pendingTemplate, setPendingTemplate] = useState<string | undefined>()
  const [pendingOpenListId, setPendingOpenListId] = useState<string | undefined>()
  const [campaignsInitialName, setCampaignsInitialName] = useState<string | undefined>()

  const handleAiNavigation = (target: PendingNavigation) => {
    // Never close the chat panel on navigation — user wants to keep iterating.
    setActiveMenu(target.menu)
    if (target.listId) setPendingOpenListId(target.listId)
  }

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
      <AiInsightsProvider>
        <div className="min-h-screen bg-background">
          <CampaignCreationFlow preSelectedList={preSelectedList} onBack={handleBackFromCampaign} />
        </div>
        <RootAskAiPanel />
        <NavigationBridge onNavigate={handleAiNavigation} />
      </AiInsightsProvider>
    )
  }

  if (activeMenu === "settings") {
    return (
      <AiInsightsProvider>
        <div className="min-h-screen bg-background">
          <SmartListsSettings onBack={handleBackFromSettings} />
        </div>
        <RootAskAiPanel />
        <NavigationBridge onNavigate={handleAiNavigation} />
      </AiInsightsProvider>
    )
  }

  return (
    <AiInsightsProvider>
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
              {activeMenu === "broker-hub" && <BrokerHubPage />}
              {activeMenu === "products" && <ProductsPage />}
              {activeMenu === "contacts" && <ContactsPage />}
              {activeMenu === "forms" && <FormsPage />}
              {activeMenu === "assets" && <AssetsPage />}
              {activeMenu === "leads" && <LeadsPage />}
              {activeMenu === "mcp-setup" && <MCPSetupPage />}
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
                  pendingOpenListId={pendingOpenListId}
                  onListOpened={() => setPendingOpenListId(undefined)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <RootAskAiPanel />
      <NavigationBridge onNavigate={handleAiNavigation} />
    </AiInsightsProvider>
  )
}

function RootAskAiPanel() {
  return <AskAiPanel />
}

function NavigationBridge({ onNavigate }: { onNavigate: (target: PendingNavigation) => void }) {
  const { pendingNavigation, consumeNavigation } = useAiInsights()
  useEffect(() => {
    if (!pendingNavigation) return
    onNavigate(pendingNavigation)
    consumeNavigation()
  }, [pendingNavigation, onNavigate, consumeNavigation])
  return null
}
