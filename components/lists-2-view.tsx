"use client"

import React from "react"

// import type React from "react" // Removed the duplicate import

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import {
  LayoutGrid,
  ListIcon,
  SearchIcon,
  MoreHorizontalIcon,
  TargetIcon,
  Network,
  GitBranch,
  XIcon,
  ChevronDownIcon,
  Calendar,
  Target,
  Star,
  Sparkles,
  TrendingUp,
  Users,
  PlusIcon,
  DownloadIcon,
  CloudRain,
  Shield,
  Car,
  Zap,
  ZapOff,
  Filter,
  Bookmark,
  Columns3,
  CheckIcon,
  ChevronDown,
  ArrowRight,
  Home,
  Heart,
  Clock,
  Moon,
  Baby,
  TrendingDown,
  ShieldOff,
  Layers,
  ChevronRight,
  Megaphone,
  Send,
  BookmarkPlus,
  ListPlus,
  AlertTriangle,
  CheckCircle,
  UserMinus,
} from "lucide-react"
import { Loader2 } from "lucide-react"
// </CHANGE>
import { initialPartners as initialCustomers, type Partner as Customer } from "@/lib/okr-data"
import { customerRecordToMasterCustomer } from "@/lib/customer-database"
import { CustomerTable } from "@/components/customer-table"
console.log("[v0] initialCustomers loaded, first customer:", initialCustomers[0])
console.log("[v0] First customer productInstances:", initialCustomers[0]?.productInstances)
import type { FilterGroup } from "./advanced-query-builder"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import { VoucherUnlockDialog } from "./voucher-unlock-dialog"
import { useCredits } from "@/components/credit-context"
import { getCreditCost, getListType } from "@/lib/credit-costs"
import { useVoucher } from "./voucher-context"
import { CreditConfirmationDialog } from "./credit-confirmation-dialog" // Added import
import { CreditIndicator } from "@/components/credit-indicator"

// Import Carousel components
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import PortfolioIntelligence from "@/components/portfolio-intelligence"
import { ALL_SIGNALS, SIGNAL_CATEGORIES } from "@/lib/portfolio-intelligence-data"

// Icon map for AI signal cards (mirrors ai-signals.tsx)
const SIGNAL_ICON_MAP: Record<string, React.ElementType> = {
  "home": Home,
  "heart-pulse": Heart,
  "car": Car,
  "clock": Clock,
  "moon": Moon,
  "baby": Baby,
  "users-x": Users,
  "trending-down": TrendingDown,
  "shield-off": ShieldOff,
  "layers": Layers,
}

type Props = {
  data?: Customer[]
  onChange?: (next: Customer[]) => void
}

type SavedView = {
  id: string
  name: string
  filters: FilterGroup | null
  columnVisibility: Record<string, boolean>
  createdAt: Date
}

interface SavedList {
  id: string
  name: string
  type: "static" | "dynamic"
  customerCount: number
  customerIds?: string[]
  searchTerm?: string
  filters?: {
    status: string
    type: string
    size: string
    stage: string
  }
  advancedFilters?: FilterGroup | null // FIX: Changed AdvancedFilter to FilterGroup
  columnVisibility?: Record<string, boolean>
  linkedCampaigns?: Array<{
    id: string
    name: string
    status: string
    createdAt: string
  }>
  createdAt?: string
  updatedAt?: string
  // Smart list metadata for saved smart lists
  isFromSmartList?: boolean
  smartListIcon?: React.ReactNode
  smartListColor?: string
  smartListDescription?: string
  originalSmartListId?: string
  isActedUpon?: boolean // Added for sorting smart lists
}

interface SmartListRule {
  id: string
  type: "filter" | "segment" | "condition"
  label: string
  description: string
}

interface SmartListSuggestion {
  id: string
  name: string
  description: string
  icon: React.ReactNode | string
  userCount: number
  dollarValue: number
  rating?: number // Changed from `number` to `number | undefined` to match usage
  recommendedByExperts: boolean
  badge?: "New" | "Offered"
  brandedBy?: string
  isBranded?: boolean
  logoUrl?: string
  isMarketRadar?: boolean
  daysLeft?: number
  marketPulseDate?: string
  // </CHANGE>
  color?: string // Added color property
  rules: SmartListRule[] // Added rules property
  // actionDate?: Date // Added actionDate property
  actedUpon?: "saved" | "campaign" | boolean
  actionDate?: Date
  source?: string // Added source property for smart lists
  // AI Signal fields
  isAISignal?: boolean
  signalId?: string
  signalCategoryType?: string
  signalUrgency?: string
  signalGradient?: [string, string]
  signalKeyReasons?: string[]
  signalCampaignSubject?: string
  signalCampaignBody?: string
  signalSuggestedCampaign?: string
  signalCatColor?: string
}

interface PromptHistory {
  id: string
  prompt: string
  timestamp: Date
  resultingRules: SmartListRule[]
}

interface Campaign {
  id: string
  name: string
  type: string
  status: "Active" | "Paused" | "Completed" | "Draft" | "Scheduled"
  startDate: string
  endDate: string
  description: string
  targetAudience: string
  impressions?: number
  clicks?: number
  conversions?: number
  openRate?: number
  clickRate?: number
  conversionRate?: number
  assignedBroker: string
  priority: "High" | "Medium" | "Low"
  channel: string[]
  notes?: string
  // Added customer-specific metrics
  responseRate?: number
  engagementScore?: number
  lastOpened?: string
  lastClicked?: string
  emailsSent?: number
}

// Define CampaignTemplate interface
interface CampaignTemplate {
  id: string
  name: string
  description: string
  uses: number
}

// Mock campaign data for customers
const mockCampaigns: Record<string, Campaign[]> = {
  "1": [
    {
      id: "camp-001",
      name: "Q1 Insurance Renewal Campaign",
      type: "Email",
      status: "Active",
      startDate: "2024-01-15",
      endDate: "2024-03-31",
      description: "Targeted renewal campaign for existing customers with policies expiring in Q1",
      targetAudience: "Existing customers with expiring policies",
      impressions: 45000,
      clicks: 2250,
      conversions: 180,
      openRate: 24.5,
      clickRate: 5.0,
      conversionRate: 8.0,
      assignedBroker: "Sarah Johnson",
      priority: "High",
      channel: ["Email", "SMS"],
      notes: "Strong performance, consider expanding reach",
      responseRate: 3.5,
      engagementScore: 8.1,
      lastOpened: "3 days ago",
      lastClicked: "1 week ago",
      emailsSent: 1500,
    },
    {
      id: "camp-002",
      name: "Home Insurance Promotion",
      type: "Digital",
      status: "Completed",
      startDate: "2023-11-01",
      endDate: "2023-12-31",
      description: "Digital advertising campaign promoting home insurance products",
      targetAudience: "Homeowners aged 25-55",
      impressions: 125000,
      clicks: 3750,
      conversions: 95,
      clickRate: 3.0,
      conversionRate: 2.5,
      assignedBroker: "Michael Chen",
      priority: "Medium",
      channel: ["Google Ads", "Facebook", "LinkedIn"],
      responseRate: 2.1,
      engagementScore: 6.5,
      lastOpened: "1 month ago",
      lastClicked: "1 month ago",
      emailsSent: 5000,
    },
  ],
  "2": [
    {
      id: "camp-003",
      name: "Business Insurance Webinar Series",
      type: "Webinar",
      status: "Scheduled",
      startDate: "2024-02-15",
      endDate: "2024-04-30",
      description: "Educational webinar series for small business owners about insurance needs",
      targetAudience: "Small business owners",
      assignedBroker: "Lisa Rodriguez",
      priority: "Medium",
      channel: ["Webinar", "Email", "Social Media"],
      responseRate: 4.0,
      engagementScore: 8.5,
      lastOpened: "1 week ago",
      lastClicked: "1 week ago",
      emailsSent: 800,
    },
  ],
  "3": [
    {
      id: "camp-004",
      name: "Auto Insurance Direct Mail",
      type: "Direct Mail",
      status: "Active",
      startDate: "2024-01-01",
      endDate: "2024-02-29",
      description: "Direct mail campaign targeting vehicle owners for auto insurance",
      targetAudience: "Vehicle owners without current coverage",
      conversions: 45,
      conversionRate: 1.8,
      assignedBroker: "David Kim",
      priority: "High",
      channel: ["Direct Mail", "Follow-up Phone"],
      responseRate: 1.5,
      engagementScore: 5.0,
      lastOpened: "N/A",
      lastClicked: "N/A",
      emailsSent: 0,
    },
    {
      id: "camp-005",
      name: "Life Insurance Consultation Drive",
      type: "Phone",
      status: "Paused",
      startDate: "2023-12-01",
      endDate: "2024-01-31",
      description: "Outbound calling campaign for life insurance consultations",
      targetAudience: "Adults 30-60 without life insurance",
      conversions: 22,
      assignedBroker: "Emma Thompson",
      priority: "Low",
      channel: ["Phone", "Email Follow-up"],
      responseRate: 2.5,
      engagementScore: 7.0,
      lastOpened: "2 weeks ago",
      lastClicked: "2 weeks ago",
      emailsSent: 300,
    },
  ],
}

// Function to get campaigns for a customer
const getCustomerCampaigns = (customerId: string): Campaign[] => {
  return mockCampaigns[customerId] || []
}

const smartListSuggestionsInitial: SmartListSuggestion[] = [
  {
    id: "1",
    name: "Coverage on related customers",
    description: "Customers with family members who need additional coverage",
    icon: "👨‍👩‍👧‍👦",
    userCount: 28,
    dollarValue: 347.7,
    rating: 4.8,
    recommendedByExperts: true,
    badge: "Offered",
    brandedBy: "Allianz",
    isBranded: true,
    logoUrl: "https://allianz.be/content/dam/onemarketing/system/allianz-logo.svg",
    color: "purple",
    rules: [],
    source: "Allianz", // Added source
  },
  {
    id: "axa-cross-sell",
    name: "Cross-sell to multi-product customer",
    description: "High-value customers with multiple products seeking comprehensive coverage solutions",
    icon: "🎯",
    userCount: 42,
    dollarValue: 348.7,
    rating: 4.9,
    recommendedByExperts: true,
    badge: "Offered",
    brandedBy: "AXA",
    isBranded: true,
    logoUrl: "/axa-insurance-logo.png",
    color: "purple",
    rules: [],
    source: "AXA", // Added source
  },
  {
    id: "baloise-renewals",
    name: "Contract Renewals",
    description: "High-value customers with contracts ending soon requiring attention",
    icon: "📋",
    userCount: 18,
    dollarValue: 890.0,
    rating: 4.6,
    recommendedByExperts: true,
    badge: "Offered",
    brandedBy: "Baloise",
    isBranded: true,
    logoUrl: "/baloise-insurance-logo.jpg",
    color: "purple",
    rules: [],
    source: "Baloise", // Added source
  },
  {
    id: "market-radar-storm",
    name: "Storm Season Property Check",
    description:
      "Rising wind and rain incidents across Belgium and the Netherlands create urgent property protection opportunities",
    icon: <CloudRain className="h-5 w-5" />,
    userCount: 37,
    dollarValue: 265.4,
    rating: 4.7,
    recommendedByExperts: true,
    isMarketRadar: true,
    daysLeft: 20,
    marketPulseDate: "October 2025",
    color: "blue",
    rules: [],
    source: "Qollabi AI", // Added source
  },
  {
    id: "market-radar-cyber",
    name: "Cyber Awareness Month: Protect Your Business",
    description: "Recent phishing and ransomware incidents highlight growing SME cybersecurity insurance demand",
    icon: <Shield className="h-5 w-5" />,
    userCount: 44,
    dollarValue: 328.7,
    rating: 4.8,
    recommendedByExperts: true,
    isMarketRadar: true,
    daysLeft: 10,
    marketPulseDate: "October 2025",
    color: "blue",
    rules: [],
    source: "Qollabi AI", // Added source
  },
  {
    id: "market-radar-inflation",
    name: "Inflation & Auto Repairs",
    description: "Car part and repair costs have risen sharply across Europe, leaving many drivers underinsured",
    icon: <Car className="h-5 w-5" />,
    userCount: 29,
    dollarValue: 302.1,
    rating: 4.6,
    recommendedByExperts: true,
    isMarketRadar: true,
    daysLeft: 25,
    marketPulseDate: "October 2025",
    color: "blue",
    rules: [],
    source: "Qollabi AI", // Added source
  },
  // </CHANGE>
  {
    id: "policy-expiry",
    name: "Policy Expiry Alerts",
    description: "Customers with policies expiring in the next 60 days",
    icon: <Calendar className="h-5 w-5" />,
    userCount: 18,
    dollarValue: 180.5,
    rating: 4.7,
    recommendedByExperts: true,
    badge: "New",
    isBranded: false,
    color: "blue",
    rules: [],
    source: "Qollabi AI", // Added source
  },
  {
    id: "two-product-upsell",
    name: "Two-Product Cross-sell",
    description: "Customers with exactly two products who may benefit from bundling",
    icon: <Target className="h-5 w-5" />,
    userCount: 35,
    dollarValue: 450.2,
    rating: 4.3,
    recommendedByExperts: true,
    isMarketRadar: true,
    daysLeft: 18,
    marketPulseDate: "November 2025",
    badge: null,
    isBranded: false,
    color: "blue",
    rules: [],
    source: "Qollabi AI", // Added source
  },
  {
    id: "cross-sell",
    name: "Cross-sell Opportunities",
    description: "24 customers with single policies showing potential for additional coverage worth €156,800",
    icon: <Users className="h-4 w-4" />,
    userCount: 24,
    dollarValue: 156.8,
    rating: 4.5,
    recommendedByExperts: true,
    badge: null,
    isBranded: false,
    color: "blue",
    rules: [],
    source: "Qollabi AI", // Added source
  },
  {
    id: "cross-sell-multi-product",
    name: "Cross-sell to multi-product customer",
    description:
      "42 customers with 1-2 products identified for expansion to multi-product relationships worth €284,500",
    icon: <TrendingUp className="h-4 w-4" />,
    userCount: 42,
    dollarValue: 284.5,
    rating: 4.6,
    recommendedByExperts: false,
    badge: null,
    isBranded: false,
    color: "blue",
    rules: [],
    source: "Qollabi AI", // Added source
  },
  {
    id: "upsell-premium", // Added
    name: "Premium Upsell Targets", // Added
    description: "31 customers with basic coverage showing indicators for premium product interest", // Added
    icon: <TrendingUp className="h-4 w-4" />, // Added
    userCount: 31,
    dollarValue: 210.0,
    rating: 4.2,
    recommendedByExperts: false,
    badge: null,
    isBranded: false,
    color: "blue", // Added color
    rules: [], // Added rules
    source: "Qollabi AI", // Added source
  },
]

// ── Inject AI Signal templates into the pre-built pool ────────────────────────
const URGENCY_ORDER_MAP: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

const aiSignalSuggestions: SmartListSuggestion[] = ALL_SIGNALS
  .slice()
  .sort((a, b) => URGENCY_ORDER_MAP[a.urgency] - URGENCY_ORDER_MAP[b.urgency])
  .map((sig) => {
    const cat = SIGNAL_CATEGORIES.find(c => c.type === sig.categoryType)
    const catColor = cat?.color ?? "#0D9488"
    const tf30 = sig.timeframes.find(t => t.days === 30) ?? sig.timeframes[sig.timeframes.length - 1]
    return {
      id: `signal-${sig.id}`,
      name: sig.suggestedSmartList,
      description: sig.description,
      icon: sig.icon,
      userCount: tf30.clientCount,
      dollarValue: Math.round(tf30.totalPremiumImpact / 1000),
      rating: undefined,
      recommendedByExperts: true,
      isBranded: false,
      isMarketRadar: false,
      color: "teal",
      rules: [],
      source: "Qollabi AI",
      isAISignal: true,
      signalId: sig.id,
      signalCategoryType: sig.categoryType,
      signalUrgency: sig.urgency,
      signalGradient: sig.gradient,
      signalKeyReasons: sig.keyReasons,
      signalCampaignSubject: sig.campaignSubject,
      signalCampaignBody: sig.campaignBody,
      signalSuggestedCampaign: sig.suggestedCampaign,
      signalCatColor: catColor,
    }
  })

const smartListSuggestionsWithSignals: SmartListSuggestion[] = [
  ...aiSignalSuggestions,
  ...smartListSuggestionsInitial,
]

// Using mockSavedLists instead of initialSavedLists
const mockSavedLists: SavedList[] = [
  {
    id: "1",
    name: "All Customers",
    type: "static",
    customerCount: 8440,
    customerIds: initialCustomers.map((c) => c.id.toString()),
    createdAt: new Date().toISOString(), // Added createdAt
  },
  {
    id: "2",
    name: "High Value Customers",
    type: "dynamic",
    customerCount: 2150, // Increased from 1250 due to enhanced filtering
    searchTerm: "premium",
    filters: { status: "active", type: "all", size: "large", stage: "all" },
    linkedCampaigns: [
      {
        id: "camp-2",
        name: "Premium Product Launch",
        status: "draft",
        createdAt: "2024-02-01",
      },
      {
        id: "camp-3",
        name: "VIP Customer Survey",
        status: "active",
        createdAt: "2024-01-20",
      },
    ],
    createdAt: new Date().toISOString(), // Added createdAt
  },
  {
    id: "3",
    name: "New Customers (Last 30 Days)",
    type: "dynamic",
    customerCount: 342,
    searchTerm: "new",
    filters: { status: "active", type: "all", size: "all", stage: "all" },
    createdAt: new Date().toISOString(), // Added createdAt
  },
  {
    id: "4",
    name: "Lapsed Customers",
    type: "static",
    customerCount: 89,
    customerIds: ["1", "4", "6"],
    linkedCampaigns: [
      {
        id: "camp-4",
        name: "Win-Back Campaign",
        status: "active",
        createdAt: "2024-01-10",
      },
    ],
    createdAt: new Date().toISOString(), // Added createdAt
  },
]

const formatEuropeanNumber = (value: number, unit?: string): string => {
  if (value === undefined || value === null) return "-"

  // Format number with European style: periods for thousands, commas for decimals
  const formatted = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)

  if (unit === "currency") return `${formatted} €`
  if (unit === "percentage") return `${formatted}%`
  if (unit === "#") return `${formatted} #`
  if (unit === "number") return formatted

  return formatted
}

const getColumnDisplayName = (key: string): string => {
  const columnNames: Record<string, string> = {
    customer: "Customer",
    team: "Account Team",
    industry: "Industry",
    region: "Region",
    customerType: "Customer Type",
    policyValue: "Policy Value",
    customerSince: "Customer Since",
    contractDate: "Policy Start Date",
    revenue: "Revenue Growth",
    satisfaction: "Customer Satisfaction",
    expansion: "Market Expansion",
    leads: "Lead Generation",
    retention: "Customer Retention",
    owner: "Owner", // Added owner column name
    partners: "Partners", // Added partners column name
  }
  return columnNames[key] || key
}

const generateCriteriaDescription = (rules: SmartListRule[]): string => {
  if (!rules || rules.length === 0) {
    return "No specific criteria applied - showing all customers"
  }

  if (rules.length === 1) {
    return `Showing customers ${rules[0].description.toLowerCase()}`
  }

  if (rules.length === 2) {
    return `Showing customers ${rules[0].description.toLowerCase()} and ${rules[1].description.toLowerCase()}`
  }

  const lastRule = rules.slice(-1)[0] // Fixed to use slice(-1)[0]
  const otherRules = rules.slice(0, -1)
  const otherDescriptions = otherRules.map((rule) => rule.description.toLowerCase()).join(", ")

  return `Showing customers ${otherDescriptions}, and ${lastRule.description.toLowerCase()}`
}

const getExpirationInfo = (list: SmartListSuggestion | SavedList) => {
  if ("rules" in list) {
    // Smart list - expires in 24 hours from creation
    const expirationDate = new Date()
    expirationDate.setHours(expirationDate.getHours() + 24)
    const hoursLeft = Math.max(0, Math.floor((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60)))
    return hoursLeft > 0 ? `${hoursLeft}h` : "Expired"
  } else {
    // Saved lists don't show expiration info
    return null
  }
}

interface Lists2ViewProps {
  data: Customer[]
  onChange: (data: Customer[]) => void
  onSidebarCollapseChange?: (collapsed: boolean) => void
  onCreateCampaign?: (savedList?: SavedList, filteredCustomers?: Customer[]) => void
  /** Name of a smart list template to auto-open when the component mounts */
  pendingTemplate?: string
  /** Called once pendingTemplate has been consumed */
  onTemplateMounted?: () => void
}

export default function Lists2View({
  data: propData,
  onChange,
  onSidebarCollapseChange,
  onCreateCampaign,
  pendingTemplate,
  onTemplateMounted,
}: Lists2ViewProps) {
  const { toast } = useToast()
  // Removed useVoucher context as it's not used in this component
  // const { isTemplateLocked, unlockTemplate } = useVoucher() // Removed as useVoucher is not in use
  const { isTemplateLocked, unlockTemplate } = useVoucher()
  const {
    creditBalance,
    useCredits: deductCredits,
    creditsUsed,
    unlockTemplate: unlockCreditTemplate,
    isTemplateUnlocked,
  } = useCredits()

  const [showCreditDialog, setShowCreditDialog] = useState(false)
  const [selectedCreditTemplate, setSelectedCreditTemplate] = useState<SmartListSuggestion | null>(null)

  const [showVoucherDialog, setShowVoucherDialog] = useState(false)
  const [selectedLockedTemplate, setSelectedLockedTemplate] = useState<SmartListSuggestion | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [listFilters, setListFilters] = useState<Record<string, FilterGroup | null>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [selectedOKR, setSelectedOKR] = useState<any>(null)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [showOKRModal, setShowOKRModal] = useState(false)

  const [savedLists, setSavedLists] = useState<SavedList[]>(mockSavedLists)
  const [smartListSuggestions, setSmartListSuggestions] = useState<SmartListSuggestion[]>(smartListSuggestionsWithSignals)

  // Merge user-saved lists (from Priority Recommendations) into savedLists
  useEffect(() => {
    const merge = async () => {
      const { loadUserSavedLists } = await import("@/lib/user-saved-lists")
      const { findSmartListUseCase } = await import("@/lib/smart-list-use-cases")
      const userLists = loadUserSavedLists()
      if (userLists.length === 0) return
      setSavedLists((prev) => {
        const existingIds = new Set(prev.map((l) => l.id))
        const toAdd = userLists
          .filter((u) => !existingIds.has(u.id))
          .map((u): SavedList => {
            // Backfill customerIds for entries saved before the field existed
            // by deriving them from the source use case.
            let customerIds = u.customerIds
            if (!customerIds || customerIds.length === 0) {
              const uc = findSmartListUseCase(u.sourceUseCaseId)
              customerIds = uc ? uc.customers.map((c) => String(c.recordId)) : []
            }
            return {
              id: u.id,
              name: u.name,
              type: u.type,
              customerCount: u.customerCount,
              customerIds,
              createdAt: u.createdAt,
              isFromSmartList: true,
              smartListColor: u.iconColor,
              smartListDescription: u.description,
              originalSmartListId: u.sourceUseCaseId,
            }
          })
        return toAdd.length ? [...toAdd, ...prev] : prev
      })
    }
    merge()
    const handler = () => merge()
    window.addEventListener("qollabi:user-saved-lists-changed", handler)
    return () => window.removeEventListener("qollabi:user-saved-lists-changed", handler)
  }, [])

  const [viewMode, setViewMode] = useState<"cards" | "list">("cards") // Redeclared viewMode, this is the correct one.

  // Renamed smartListFilter to listFilter for unified filtering
  const [listFilter, setListFilter] = useState<"all" | "offered" | "radar" | "saved" | "templates">("saved") // Added 'templates' filter
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<
    "all" | "pre-built" | "branded" | "market-radar"
  >("all") // State for template category filtering

  const [previewState, setPreviewState] = useState<{
    isActive: boolean
    listName: string
    rules: SmartListRule[]
    originalSuggestion?: SmartListSuggestion
  } | null>(null)

  const [promptHistory, setPromptHistory] = useState<PromptHistory[]>([])
  const [currentPrompt, setCurrentPrompt] = useState("")
  const [aiPanelDocked, setAiPanelDocked] = useState<"left" | "right">("right")
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [isFocused, setIsFocused] = useState(false) // State for input focus
  const [aiPromptExpanded, setAIPromptExpanded] = useState(false) // State to control AI prompt section visibility

  const [showAIGenerationDialog, setShowAIGenerationDialog] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGeneratingList, setIsGeneratingList] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false) // Added for AI prompt submit

  const [savedViews, setSavedViews] = useState<SavedView[]>([
    {
      id: "default",
      name: "Default View",
      filters: null,
      columnVisibility: {
        customer: true,
        team: true,
        revenue: true,
        satisfaction: true,
        expansion: false,
        leads: false,
        retention: false,
      },
      createdAt: new Date(),
    },
  ])
  const [currentViewId, setCurrentViewId] = useState<string>("default")
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [newViewName, setNewViewName] = useState("")
  const [isLoadingView, setIsLoadingView] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [showListDialog, setShowListDialog] = useState(false)

  const [showAddToListDialog, setShowAddToListDialog] = useState(false)
  const [selectedExistingList, setSelectedExistingList] = useState<string | null>(null)

  const [showSaveSmartListDialog, setShowSaveSmartListDialog] = useState(false)
  const [selectedListType, setSelectedListType] = useState<"dynamic" | "static">("dynamic")
  const [smartListName, setSmartListName] = useState("")

  const [openedSmartList, setOpenedSmartList] = useState<SmartListSuggestion | null>(null)

  // Auto-open a template requested from Portfolio Insights
  useEffect(() => {
    if (!pendingTemplate) return
    const match = smartListSuggestionsWithSignals.find(
      (s) => s.name.toLowerCase() === pendingTemplate.toLowerCase()
    )
    if (match) {
      setListFilter("templates")
      setOpenedSmartList(match)
      setSelectedListId("all")
    }
    onTemplateMounted?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTemplate])

  const [showAddToCampaignDialog, setShowAddToCampaignDialog] = useState(false)
  const [showCampaignTemplateDialog, setShowCampaignTemplateDialog] = useState(false)
  const [selectedExistingCampaign, setSelectedExistingCampaign] = useState<string | null>(null)
  const [selectedCampaignTemplate, setSelectedCampaignTemplate] = useState<CampaignTemplate | null>(null) // Changed to CampaignTemplate

  const existingCampaigns = [
    { id: "1", name: "Q4 Renewal Campaign", status: "Active", contacts: 1250, created: "2024-01-15" },
    { id: "2", name: "New Product Launch", status: "Draft", contacts: 850, created: "2024-01-10" },
    { id: "3", name: "Customer Satisfaction Survey", status: "Active", contacts: 2100, created: "2024-01-05" },
    { id: "4", name: "Holiday Promotion", status: "Completed", contacts: 3200, created: "2023-12-01" },
  ]

  const campaignTemplates: CampaignTemplate[] = [
    // Explicitly typed as CampaignTemplate[]
    {
      id: "1",
      name: "Product Launch Template",
      description: "Standard template for new product announcements",
      uses: 45,
    },
    { id: "2", name: "Renewal Reminder Template", description: "Template for contract renewal campaigns", uses: 78 },
    { id: "3", name: "Survey Template", description: "Customer feedback and satisfaction surveys", uses: 32 },
    { id: "4", name: "Event Invitation Template", description: "Template for webinars and events", uses: 23 },
    { id: "5", name: "Newsletter Template", description: "Monthly newsletter template", uses: 67 },
  ]

  const customerAttributes = [
    { id: "customer", label: "Customer", lock: true, type: "partner" as const },
    { id: "owner", label: "Owner", type: "partner" as const },
    { id: "team", label: "Team", type: "partner" as const },
    { id: "partners", label: "Partners", type: "partner" as const },
    { id: "industry", label: "Industry", type: "partner" as const },
    { id: "region", label: "Region", type: "partner" as const },
    { id: "customerType", label: "Customer Type", type: "partner" as const },
    { id: "customerSince", label: "Customer Since", type: "partner" as const },
    { id: "contractDate", label: "Policy Start Date", type: "partner" as const },
    { id: "campaigns", label: "Campaigns", type: "partner" as const },
  ]

  const insuranceProductCategories = [
    {
      id: "personal-insurance",
      label: "Personal Insurance",
      products: [
        { id: "life-insurance", label: "Life Insurance" },
        { id: "health-insurance", label: "Health Insurance" },
        { id: "auto-insurance", label: "Auto Insurance" },
        { id: "home-insurance", label: "Home Insurance" },
        { id: "travel-insurance", label: "Travel Insurance" },
        { id: "disability-insurance", label: "Disability Insurance" },
        { id: "pet-insurance", label: "Pet Insurance" },
      ],
    },
    {
      id: "commercial-insurance",
      label: "Commercial Insurance",
      products: [
        { id: "business-insurance", label: "Business Insurance" },
        { id: "liability-insurance", label: "Liability Insurance" },
        { id: "property-insurance", label: "Property Insurance" },
      ],
    },
  ]

  const productAttributes = [
    { id: "product-name", label: "Name", type: "text" as const },
    { id: "product-id", label: "Product ID", type: "id" as const },
    { id: "product-description", label: "Description", type: "text" as const },
    { id: "product-provider", label: "Provider", type: "text" as const },
    { id: "product-contract-start", label: "Contract Start Date", type: "date" as const },
    { id: "product-contract-end", label: "Contract End Date", type: "date" as const },
    { id: "product-total-value", label: "Total Value", type: "currency" as const },
    { id: "product-premium-value", label: "Premium Value", type: "currency" as const },
    { id: "product-premium-percent", label: "Premium %", type: "percentage" as const },
    { id: "product-discount-percent", label: "Discount %", type: "percentage" as const },
    { id: "product-category", label: "Product Category", type: "text" as const },
    { id: "product-lifecycle-stage", label: "Product Lifecycle Stage", type: "text" as const },
    { id: "product-policy-id", label: "Policy ID", type: "id" as const },
    { id: "product-dossier-id", label: "Dossier ID", type: "id" as const },
    { id: "product-policyholder-id", label: "Policyholder ID", type: "id" as const },
    { id: "product-policy-number", label: "Policy Number", type: "id" as const },
    { id: "product-contract-id", label: "Contract ID", type: "id" as const },
    { id: "product-insurer", label: "Insurer", type: "text" as const },
    { id: "product-domain", label: "Product Domain", type: "text" as const },
    { id: "product-type", label: "Product Type", type: "text" as const },
    { id: "product-billing-frequency", label: "Billing Frequency", type: "text" as const },
    { id: "product-status", label: "Status", type: "text" as const },
    { id: "product-situation", label: "Situation", type: "text" as const },
    { id: "product-last-premium", label: "Last Premium Amount", type: "currency" as const },
  ]

  const availableFields = [
    { id: "customer", label: "Customer", type: "text" as const },
    { id: "owner", label: "Owner", type: "text" as const }, // Added owner field
    { id: "team", label: "Account Team", type: "number" as const },
    { id: "partners", label: "Partners", type: "number" as const }, // Added partners field
    { id: "industry", label: "Industry", type: "text" as const },
    { id: "region", label: "Region", type: "text" as const },
    {
      id: "customerType",
      label: "Customer Type",
      type: "select" as const,
      options: ["Premium", "Standard", "Basic", "Corporate"],
    },
    // Removed policyValue
    { id: "customerSince", label: "Customer Since", type: "text" as const },
    { id: "contractDate", label: "Policy Start Date", type: "date" as const },
    { id: "tags", label: "Tags", type: "tags" as const },
    {
      id: "status",
      label: "OKR Status",
      type: "select" as const,
      options: ["success", "warning", "error", "undefined"],
    },
    // Add all product attributes as filterable fields
    ...insuranceProductCategories.flatMap((category) =>
      category.products.flatMap((product) =>
        productAttributes.map((attr) => ({
          id: `${product.id}-${attr.id}`,
          label: `${product.label} > ${attr.label}`,
          type: attr.type,
        })),
      ),
    ),
  ]

  const insuranceProducts = [
    { id: "life-insurance", label: "Life Insurance" },
    { id: "health-insurance", label: "Health Insurance" },
    { id: "auto-insurance", label: "Auto Insurance" },
    { id: "home-insurance", label: "Home Insurance" },
    { id: "property-insurance", label: "Property Insurance" },
    { id: "business-insurance", label: "Business Insurance" },
    { id: "liability-insurance", label: "Liability Insurance" },
    { id: "travel-insurance", label: "Travel Insurance" },
    { id: "disability-insurance", label: "Disability Insurance" },
    { id: "pet-insurance", label: "Pet Insurance" },
  ]

  const [listColumnVisibility, setListColumnVisibility] = useState<Record<string, Record<string, boolean>>>({
    "1": {
      customer: true,
      team: true,
      industry: true,
      region: true,
      customerType: true,
      policyValue: true,
      customerSince: true,
      contractDate: true,
      revenue: true,
      satisfaction: true,
      expansion: true,
      leads: true,
      retention: true,
    },
  })

  const [editValue, setEditValue] = useState("")
  const [internal, setInternal] = useState<Customer[]>(initialCustomers)

  const data = internal
  const setData = (next: Customer[]) => setInternal(next)

  const [selectedListId, setSelectedListId] = useState<string | null>("1")

  // Removed excludedCustomers state and related logic
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // New column, default to ascending
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const calculateSmartListTotalValue = useCallback(
    (suggestion: SmartListSuggestion) => {
      const parseValue = (str: string | undefined) => {
        if (!str) return 0
        const cleaned = str.replace(/[€\s,]/g, "")
        return Number.parseFloat(cleaned) || 0
      }

      let listCustomers: Customer[] = []

      // Special handling for policy-expiry list
      if (suggestion.id === "policy-expiry") {
        const today = new Date()
        const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)

        listCustomers = initialCustomers.filter((customer) => {
          if (!customer.expiringProduct || !customer.contractEndDate) return false

          const [day, month, year] = customer.contractEndDate.split("/").map(Number)
          const contractDate = new Date(year, month - 1, day)

          return contractDate >= today && contractDate <= ninetyDaysFromNow
        })
      } else {
        // For other smart lists, use a subset based on estimatedCount
        listCustomers = initialCustomers.slice(0, suggestion.userCount || 10)
      }

      const totalValue = listCustomers.reduce((sum, customer) => {
        const customerValue =
          customer.productInstances?.reduce((instanceSum, instance) => {
            return instanceSum + parseValue(instance.attributes?.totalValue)
          }, 0) || 0
        return sum + customerValue
      }, 0)

      return totalValue
    },
    [initialCustomers],
  )

  const getListFilteredCustomers = useCallback(
    (customers: Customer[]) => {
      if (selectedListId === "all") {
        return customers
      }

      const list = savedLists.find((l) => l.id === selectedListId)
      if (!list) return customers

      // Filter out excluded customers when viewing a smart list
      if (openedSmartList) {
        const listId = openedSmartList.name
        // Apply the filters from the smart list itself first
        const filtered = customers.filter((customer) => {
          // Placeholder for actual smart list filter logic
          // In a real scenario, you'd convert smart list rules to filter conditions
          // For now, assume all customers are potential matches before exclusion
          return true
        })
        return filtered
      }

      return customers
    },
    [selectedListId, savedLists, openedSmartList],
  )

  const columnVisibility = useMemo(() => {
    if (openedSmartList?.id === "two-product-upsell") {
      return {
        customer: true,
        owner: true,
        "Product 1": true,
        "Product 2": true,
        "Total Value": true,
        status: false,
        team: false,
        partnerCount: false,
        revenue: false,
        "Current Products": false,
        "Desired Products": false,
      }
    }

    if (openedSmartList?.id === "coverage-related") {
      return {
        customer: true,
        email: true,
        "Address Line 1": true,
        "Address Line 2": true,
        "Policies Total": true,
        "Policies Baloise": true,
        "Policies Other": true,
        owner: false,
        status: false,
        team: false,
        partnerCount: false,
        revenue: false,
        "Current Products": false,
        "Total Value": false,
      }
    }

    const currentListId = selectedListId || "1"
    console.log(
      "[v0] columnVisibility for list",
      currentListId,
      ":",
      listColumnVisibility[currentListId] || {
        customer: true,
        owner: false,
        team: false,
        industry: true,
        region: true,
        customerType: true,
        policyValue: true,
        customerSince: true,
        contractDate: true,
        campaigns: true, // Add campaigns column
        revenue: true,
        satisfaction: true,
        expansion: true,
        leads: true,
        retention: true,
        partners: true, // Added partners column visibility
      },
    )
    return (
      listColumnVisibility[currentListId] || {
        customer: true,
        owner: false,
        team: false,
        industry: true,
        region: true,
        customerType: true,
        policyValue: true,
        customerSince: true,
        contractDate: true,
        campaigns: true, // Add campaigns column
        revenue: true,
        satisfaction: true,
        expansion: true,
        leads: true,
        retention: true,
        partners: true, // Added partners column visibility
      }
    )
  }, [selectedListId, listColumnVisibility, openedSmartList])

  const setColumnVisibility = useCallback(
    (newVisibility: Record<string, boolean>) => {
      const currentListId = selectedListId || "1"
      console.log("[v0] setColumnVisibility called for list", currentListId, "with:", newVisibility) // Fixed: changed currentId to currentListId
      setListColumnVisibility((prev) => ({
        ...prev,
        [currentListId]: newVisibility,
      }))
    },
    [selectedListId],
  )

  const handleColumnVisibilityChange = useCallback(
    (newVisibility: Record<string, boolean>) => {
      console.log("[v0] handleColumnVisibilityChange called with:", newVisibility)
      setColumnVisibility(newVisibility)
    },
    [setColumnVisibility],
  )

  const [advancedFilter, setAdvancedFilter] = useState<FilterGroup | null>(null)
  const [allCustomersFilter, setAllCustomersFilter] = useState<FilterGroup | null>(null)

  const handleSuggestionClick = (suggestion: SmartListSuggestion) => {
    console.log("[v0] Market Radar check:", {
      id: suggestion.id,
      isMarketRadar: suggestion.isMarketRadar,
      isBranded: suggestion.isBranded,
      badge: suggestion.badge,
    })
    // </CHANGE>

    // Check if template needs voucher unlock (for offered/branded templates)
    if (isTemplateLocked(suggestion.id)) {
      setSelectedLockedTemplate(suggestion)
      setShowVoucherDialog(true)
      return
    }

    const creditCost = getCreditCost(suggestion.badge || "", suggestion.isMarketRadar || false, suggestion.isBranded)
    const isUnlocked = isTemplateUnlocked(suggestion.id)

    if (creditCost > 0 && !isUnlocked) {
      setSelectedCreditTemplate(suggestion)
      setShowCreditDialog(true)
      return
    }

    setOpenedSmartList(suggestion)
    setSelectedListId(null)

    toast({
      title: "Smart List Opened",
      description: `Viewing "${suggestion.name}" with ${suggestion.userCount} customers`,
    })
  }
  // </CHANGE>

  const handlePromptSubmit = () => {
    if (!currentPrompt.trim() || !previewState) return

    // Mock AI parsing - in real implementation, this would call an AI service
    const newRules: SmartListRule[] = []

    // Simple keyword-based rule generation for demo
    if (currentPrompt.toLowerCase().includes("belgium")) {
      newRules.push({
        id: `rule-${Date.now()}`,
        type: "filter",
        label: "Belgium Only",
        description: "Customers located in Belgium",
      })
    }

    if (currentPrompt.toLowerCase().includes("midmarket")) {
      newRules.push({
        id: `rule-${Date.now() + 1}`,
        type: "segment",
        label: "Midmarket",
        description: "Midmarket customer segment",
      })
    }

    if (currentPrompt.toLowerCase().includes("exclude inactive")) {
      newRules.push({
        id: `rule-${Date.now() + 2}`,
        type: "condition",
        label: "Exclude Inactive",
        description: "Remove inactive customers",
      })
    }

    const historyEntry: PromptHistory = {
      id: Date.now().toString(),
      prompt: currentPrompt,
      timestamp: new Date(),
      resultingRules: newRules,
    }

    setPromptHistory((prev) => [historyEntry, ...prev.slice(0, 4)])

    if (newRules.length > 0) {
      setPreviewState((prev) =>
        prev
          ? {
              ...prev,
              rules: [...prev.rules, ...newRules],
            }
          : null,
      )
    }

    setCurrentPrompt("")
    toast({
      title: "List Refined",
      description: `Added ${newRules.length} new rules to the list`,
    })
  }

  // Updated handleSavePreviewList to accept type
  const handleSavePreviewList = (type: "dynamic" | "static") => {
    if (!openedSmartList) return

    setSmartListName(openedSmartList.name)
    setSelectedListType(type)
    setShowSaveSmartListDialog(true)
  }

  const handleConfirmSaveSmartList = () => {
    if (!openedSmartList) return

    const listType = getListType(openedSmartList)
    const creditCost = getCreditCost(listType)

    const newList: SavedList = {
      id: Date.now().toString(),
      name: smartListName,
      type: selectedListType,
      customerCount: openedSmartList.userCount || 0,
      advancedFilters: null, // This should likely be populated from openedSmartList.rules
      createdAt: new Date().toISOString(),
      // Store smart list metadata
      isFromSmartList: true,
      smartListIcon: openedSmartList.icon,
      smartListColor: openedSmartList.color,
      smartListDescription: openedSmartList.description,
      originalSmartListId: openedSmartList.id,
      updatedAt: new Date().toISOString(), // Added updatedAt
    }

    setSavedLists((prev) => [newList, ...prev])

    deductCredits(creditCost, smartListName)

    setOpenedSmartList(null)
    setShowSaveSmartListDialog(false)
    setSmartListName("")

    // Show toast with balance update
    if (creditCost > 0) {
      const newBalance = creditBalance - creditCost
      if (newBalance < 0) {
        toast({
          title: "List Saved",
          description: `"${newList.name}" saved. Balance: ${newBalance} credits. You'll be charged in your next billing period.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "List Saved",
          description: `"${newList.name}" saved. ${newBalance} credits remaining.`,
        })
      }
    } else {
      toast({
        title: "List Saved",
        description: `"${newList.name}" has been saved as a ${selectedListType} list`,
      })
    }
    // </CHANGE>
  }

  const handleDiscardSmartList = () => {
    if (!openedSmartList) return

    // Simply clear the opened smart list without marking as acted upon
    setOpenedSmartList(null)

    toast({
      title: "Smart List Closed",
      description: "Returned to main view",
    })
  }

  const removeRule = (ruleId: string) => {
    if (!previewState) return

    setPreviewState((prev) =>
      prev
        ? {
            ...prev,
            rules: prev.rules.filter((rule) => rule.id !== ruleId),
          }
        : null,
    )
  }

  const getCurrentListFilter = () => {
    if (!selectedListId) return null

    if (selectedListId === "1") {
      return allCustomersFilter
    }

    // For other lists, return their specific filters
    return listFilters[selectedListId] || null
  }

  const updateCurrentListFilter = (filter: FilterGroup | null) => {
    if (selectedListId === "1") {
      setAllCustomersFilter(filter)
    } else if (selectedListId) {
      setListFilters((prev) => ({
        ...prev,
        [selectedListId]: filter,
      }))
    }
  }

  const applyAdvancedFilter = (customer: Customer, filter: FilterGroup) => {
    const evaluateCondition = (condition: any) => {
      const { field, operator, value } = condition

      if (field === "customer") {
        const customerName = customer.name.toLowerCase()
        const searchValue = value.toLowerCase()

        switch (operator) {
          case "contains":
            return customerName.includes(searchValue)
          case "contains_any":
            const searchValues = Array.isArray(value)
              ? value.map((v) => v.toLowerCase())
              : value
                  .toLowerCase()
                  .split(",")
                  .filter(Boolean)
                  .map((v: string) => v.trim())
            return searchValues.some((searchVal) => customerName.includes(searchVal))
          case "equals":
            return customerName === searchValue
          case "not_equals":
            return customerName !== searchValue
          case "starts_with":
            return customerName.startsWith(searchValue)
          case "ends_with":
            return customerName.endsWith(searchValue)
          default:
            return false
        }
      }

      if (field === "owner") {
        const ownerName = customer.owner?.toLowerCase() || ""
        const searchValue = value.toLowerCase()

        switch (operator) {
          case "equals":
            return ownerName === searchValue
          case "not_equals":
            return ownerName !== searchValue
          case "is_empty":
            return !customer.owner
          case "is_not_empty":
            return !!customer.owner
          default:
            return false
        }
      }

      if (field === "team") {
        const teamSize = customer.team.length
        const numValue = Number.parseFloat(value)
        if (isNaN(numValue)) return false

        switch (operator) {
          case "equals":
            return teamSize === numValue
          case "not_equals":
            return teamSize !== numValue
          case "greater_than":
            return teamSize > numValue
          case "less_than":
            return teamSize < numValue
          case "greater_equal":
            return teamSize >= numValue
          case "less_equal":
            return teamSize <= numValue
          default:
            return false
        }
      }

      if (field === "partners") {
        const partnerCount = customer.partnerCount ?? 0
        const numValue = Number.parseFloat(value)
        if (isNaN(numValue)) return false

        switch (operator) {
          case "equals":
            return partnerCount === numValue
          case "not_equals":
            return partnerCount !== numValue
          case "greater_than":
            return partnerCount > numValue
          case "less_than":
            return partnerCount < numValue
          case "greater_equal":
            return partnerCount >= numValue
          case "less_equal":
            return partnerCount <= numValue
          case "is_empty":
            return partnerCount === 0
          case "is_not_empty":
            return partnerCount > 0
          default:
            return false
        }
      }

      if (field === "tags") {
        const allOkrTags = Object.values(customer.okrs)
          .flatMap((okr) => okr.tags || [])
          .map((tag) => tag.toLowerCase())

        const searchValues = Array.isArray(value)
          ? value.map((v) => v.toLowerCase())
          : value
              .toLowerCase()
              .split(",")
              .filter(Boolean)
              .map((v: string) => v.trim())

        switch (operator) {
          case "contains":
            return searchValues.some((searchValue) => allOkrTags.includes(searchValue))
          case "contains_any":
            return searchValues.some((searchValue) => allOkrTags.includes(searchValue))
          case "is_empty":
            return allOkrTags.length === 0
          case "is_not_empty":
            return allOkrTags.length > 0
          default:
            return false
        }
      }

      return false
    }

    const { conditions, logic } = filter

    if (logic === "AND") {
      return conditions.every(evaluateCondition)
    } else {
      return conditions.some(evaluateCondition)
    }
  }

  const getOKRIcon = (okr: any) => {
    if (okr.type === "Objective") return <TargetIcon className="h-3 w-3 text-blue-600" />
    return okr.level === 1 ? (
      <Network className="h-3 w-3 text-purple-600" />
    ) : (
      <GitBranch className="h-3 w-3 text-purple-400" />
    )
  }

  const handleEdit = (customerId: string, okrId: string, field: "realized" | "target", currentValue: number) => {
    setEditingCell(`${customerId}-${okrId}-${field}`)
    setEditValue((currentValue ?? "").toString())
  }

  const handleSave = (customerId: string, okrId: string, field: "realized" | "target") => {
    const numericValue = Number.parseFloat(editValue.replace(/[^\d.-]/g, ""))
    if (!isNaN(numericValue)) {
      setData(
        data.map((customer) =>
          customer.id === customerId
            ? { ...customer, okrs: { ...customer.okrs, [okrId]: { ...customer.okrs[okrId], [field]: numericValue } } }
            : customer,
        ),
      )
    }
    setEditingCell(null)
    setEditValue("")
  }

  const handleStatusChange = (customerId: string, okrId: string, newStatus: string) => {
    setData(
      data.map((customer) =>
        customer.id === customerId
          ? { ...customer, okrs: { ...customer.okrs, [okrId]: { ...customer.okrs[okrId], status: newStatus as any } } }
          : customer,
      ),
    )
  }

  const isPolicyExpiryList = openedSmartList?.id === "policy-expiry"
  const isCrossSellMultiProductList = openedSmartList?.id === "cross-sell-multi-product"
  const isTwoProductUpsellList =
    openedSmartList?.id === "two-product-upsell" ||
    (selectedListId &&
      savedLists.find((list) => list.id === selectedListId)?.originalSmartListId === "two-product-upsell")
  const isCoverageRelatedList = openedSmartList?.id === "coverage-related"

  const getEffectiveColumnVisibility = () => {
    // Start with the base column visibility from the Columns dropdown
    const baseVisibility = { ...columnVisibility }

    console.log("[v0] getEffectiveColumnVisibility - baseVisibility:", baseVisibility)
    console.log(
      "[v0] getEffectiveColumnVisibility - isPolicyExpiryList:",
      isPolicyExpiryList,
      "isCrossSellMultiProductList:",
      isCrossSellMultiProductList,
      // Added isTwoProductUpsellList to log
      "isTwoProductUpsellList:",
      isTwoProductUpsellList,
      // Added isCoverageRelatedList to log
      "isCoverageRelatedList:",
      isCoverageRelatedList,
    )

    // For smart lists, ensure their special columns are always visible
    // but don't hide other columns - let the Columns dropdown control that
    if (isPolicyExpiryList) {
      return {
        ...baseVisibility,
        // Ensure policy expiry specific columns are visible
        // These are rendered separately and not controlled by columnVisibility
      }
    }

    if (isCrossSellMultiProductList) {
      return {
        ...baseVisibility,
        // Ensure cross-sell specific columns are visible
        // These are rendered separately and not controlled by columnVisibility
      }
    }

    if (isTwoProductUpsellList) {
      return {
        ...baseVisibility,
        team: false,
        // Hide all columns after Team
        partners: false,
        owner: false,
        industry: false,
        region: false,
        customerType: false,
        customerSince: false,
        contractDate: false,
        campaigns: false,
        // Hide all product columns
        ...Object.keys(baseVisibility).reduce(
          (acc, key) => {
            if (key.includes("-") || key.startsWith("product")) {
              acc[key] = false
            }
            return acc
          },
          {} as Record<string, boolean>,
        ),
      }
    }

    // Ensure coverage-related list columns are visible when the list is open
    if (isCoverageRelatedList) {
      return {
        ...baseVisibility,
        customer: true, // Ensure customer column is visible
        email: true,
        "Address Line 1": true,
        "Address Line 2": true,
        "Policies Total": true,
        "Policies Baloise": true,
        "Policies Other": true,
        owner: false, // Keep owner hidden as per original smart list logic
        status: false, // Keep status hidden
        team: false, // Keep team hidden
        partnerCount: false, // Keep partnerCount hidden
        revenue: false, // Keep revenue hidden
        "Current Products": false, // Keep Current Products hidden
        "Total Value": false, // Keep Total Value hidden
      }
    }

    return baseVisibility
  }

  const effectiveColumnVisibility = getEffectiveColumnVisibility()

  console.log("[v0] Final effectiveColumnVisibility:", effectiveColumnVisibility)

  // Fix: Added `excludedCustomers` state and logic as it was used but not declared.
  const [excludedCustomers, setExcludedCustomers] = useState<Record<string, Set<string>>>({})

  const getListFilteredCustomers_updated = useCallback(
    (customers: Customer[]) => {
      // Add customers parameter
      if (!selectedListId || selectedListId === "1") {
        return customers
      }

      const selectedList = savedLists.find((list) => list.id === selectedListId)
      if (!selectedList) {
        return customers
      }

      if (selectedList.customerIds && (selectedList.type === "static" || selectedList.isFromSmartList)) {
        const wanted = new Set(selectedList.customerIds)
        return customers.filter((customer) => wanted.has(String(customer.id)))
      }

      // Filter out excluded customers when viewing a smart list
      if (openedSmartList) {
        const listId = openedSmartList.name
        const excluded = excludedCustomers[listId] || new Set()
        // Apply the filters from the smart list itself first
        let filtered = customers.filter((customer) => {
          // Placeholder for actual smart list filter logic
          // In a real scenario, you'd convert smart list rules to filter conditions
          // For now, assume all customers are potential matches before exclusion
          return true
        })
        filtered = filtered.filter((customer) => !excluded.has(customer.id))
        return filtered
      }

      return customers
    },
    [selectedListId, savedLists, openedSmartList, excludedCustomers],
  )

  const filteredSmartListSuggestions = useMemo(() => {
    let filtered = smartListSuggestions

    // Apply existing list filter
    if (listFilter === "all") {
      filtered = filtered.filter((s) => !s.isBranded && !s.isMarketRadar)
    } else if (listFilter === "offered") {
      filtered = filtered.filter((s) => s.isBranded)
    } else if (listFilter === "radar") {
      filtered = filtered.filter((s) => s.isMarketRadar)
    }

    // Apply template category filter for new UI
    if (listFilter === "templates") {
      if (activeTemplateCategory === "pre-built") {
        filtered = filtered.filter((s) => !s.isBranded && !s.isMarketRadar)
      } else if (activeTemplateCategory === "branded") {
        filtered = filtered.filter((s) => s.isBranded)
      } else if (activeTemplateCategory === "market-radar") {
        filtered = filtered.filter((s) => s.isMarketRadar)
      }
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return filtered
  }, [smartListSuggestions, listFilter, searchTerm, activeTemplateCategory])
  // </CHANGE>

  const tabCounts = useMemo(() => {
    return {
      all: smartListSuggestions.filter((list) => !list.isBranded && !list.isMarketRadar).length,
      offered: smartListSuggestions.filter((list) => list.isBranded).length,
      // </CHANGE>
      radar: smartListSuggestions.filter((list) => list.isMarketRadar).length,
      saved: savedLists.length,
      templates: smartListSuggestions.length, // Count for templates tab
    }
  }, [smartListSuggestions, savedLists])
  // </CHANGE>

  const filteredData = useMemo(() => {
    console.log("[v0] Filtering data - selectedListId:", selectedListId, "allCustomersFilter:", allCustomersFilter)

    if (openedSmartList) {
      if (openedSmartList.id === "coverage-related") {
        // Filter customers with max 2 Baloise products and 1+ other products
        const filtered = data.filter((customer) => {
          if (!customer.productInstances || customer.productInstances.length === 0) return false

          const baloiseProducts = customer.productInstances.filter((p) =>
            p.attributes?.insurer?.toLowerCase().includes("baloise"),
          ).length
          const otherProducts = customer.productInstances.filter(
            (p) => !p.attributes?.insurer?.toLowerCase().includes("baloise"),
          ).length

          return baloiseProducts <= 2 && otherProducts >= 1
        })

        if (sortColumn) {
          return filtered.sort((a, b) => {
            let valueA: any
            let valueB: any

            switch (sortColumn) {
              case "customer":
                valueA = a.name.toLowerCase()
                valueB = b.name.toLowerCase()
                break
              case "email":
                valueA = (a.okrs?.email?.value || "").toString().toLowerCase()
                valueB = (b.okrs?.email?.value || "").toString().toLowerCase()
                break
              case "address-line-1":
                valueA = (a.okrs?.["address-line-1"]?.value || "").toString().toLowerCase()
                valueB = (b.okrs?.["address-line-1"]?.value || "").toString().toLowerCase()
                break
              case "address-line-2":
                valueA = (a.okrs?.["address-line-2"]?.value || "").toString().toLowerCase()
                valueB = (b.okrs?.["address-line-2"]?.value || "").toString().toLowerCase()
                break
              case "policies-total":
                valueA = a.productInstances?.length || 0
                valueB = b.productInstances?.length || 0
                break
              case "policies-baloise":
                valueA = a.productInstances?.filter((p) => p.attributes?.insurer === "Baloise").length || 0
                valueB = b.productInstances?.filter((p) => p.attributes?.insurer === "Baloise").length || 0
                break
              case "policies-other":
                valueA = a.productInstances?.filter((p) => p.attributes?.insurer !== "Baloise").length || 0
                valueB = b.productInstances?.filter((p) => p.attributes?.insurer !== "Baloise").length || 0
                break
              default:
                return 0
            }

            // Handle numeric vs string comparison
            if (typeof valueA === "number" && typeof valueB === "number") {
              return sortDirection === "asc" ? valueA - valueB : valueB - valueA
            } else {
              const comparison = valueA.localeCompare(valueB)
              return sortDirection === "asc" ? comparison : -comparison
            }
          })
        }

        // Default sort by address line 1, then address line 2
        return filtered.sort((a, b) => {
          const addressA = (a.okrs?.["address-line-1"]?.value || "").toLowerCase()
          const addressB = (b.okrs?.["address-line-1"]?.value || "").toLowerCase()

          if (addressA !== addressB) {
            return addressA.localeCompare(addressB)
          }

          const address2A = (a.okrs?.["address-line-2"]?.value || "").toLowerCase()
          const address2B = (b.okrs?.["address-line-2"]?.value || "").toLowerCase()
          return address2A.localeCompare(address2B)
        })
      }

      if (openedSmartList.id === "policy-expiry") {
        const today = new Date()
        const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)

        console.log(
          "[v0] Filtering for policy expiry - today:",
          today.toISOString(),
          "90 days from now:",
          ninetyDaysFromNow.toISOString(),
        )

        const filtered = data.filter((customer) => {
          if (!customer.expiringProduct || !customer.contractEndDate) {
            console.log("[v0] Customer", customer.name, "missing expiring product data")
            return false
          }

          const [day, month, year] = customer.contractEndDate.split("/").map(Number)
          const contractDate = new Date(year, month - 1, day)

          console.log(
            "[v0] Customer",
            customer.name,
            "contract end date:",
            contractDate.toISOString(),
            "expiring product:",
            customer.expiringProduct,
          )

          const isExpiringSoon = contractDate >= today && contractDate <= ninetyDaysFromNow
          console.log("[v0] Customer", customer.name, "is expiring soon:", isExpiringSoon)

          return isExpiringSoon
        })

        console.log("[v0] Policy expiry filtered count:", filtered.length)
        filtered.forEach((customer) => {
          console.log(
            "[v0] Customer:",
            customer.name,
            "expiringProduct:",
            customer.expiringProduct,
            "contractEndDate:",
            customer.contractEndDate,
          )
        })
        return filtered
      }

      // For other smart lists, return a subset as mock data
      const potentialCustomers = data.slice(0, openedSmartList.userCount || 10)
      return potentialCustomers
    }

    // Existing filtering logic for saved lists
    let result = data.filter((customer) => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      const currentFilter = getCurrentListFilter()
      console.log("[v0] Current filter for customer", customer.name, ":", currentFilter)

      const matchesAdvancedFilter = currentFilter ? applyAdvancedFilter(customer, currentFilter) : true
      console.log("[v0] Customer", customer.name, "matches advanced filter:", matchesAdvancedFilter)

      return matchesSearch && matchesAdvancedFilter
    })

    // Fix: Declare getListFilteredCustomers or ensure it's available in scope
    result = getListFilteredCustomers_updated(result) // Use the updated function
    console.log("[v0] Final filtered result count:", result.length)

    return result
  }, [
    data,
    searchTerm,
    listFilters,
    selectedListId,
    savedLists,
    advancedFilter,
    allCustomersFilter,
    openedSmartList,
    getListFilteredCustomers_updated, // Depend on the updated function
    excludedCustomers, // Depend on excludedCustomers for smart list filtering
    sortColumn, // Depend on sortColumn for sorting
    sortDirection, // Depend on sortDirection for sorting
  ])

  // Calculate totalOpportunities, totalValue, and weightedValue for the metrics bar
  const totalOpportunities = useMemo(() => {
    return filteredData.filter((c) => c.opportunities && c.opportunities.length > 0).length
  }, [filteredData])

  const totalValue = useMemo(() => {
    return filteredData.reduce((sum, c) => {
      const oppValue = c.opportunities?.reduce((s, o) => s + (o.value || 0), 0) || 0
      return sum + oppValue
    }, 0)
  }, [filteredData])

  const weightedValue = useMemo(() => {
    return filteredData.reduce((sum, c) => {
      const oppValue = c.opportunities?.reduce((s, o) => s + (o.value || 0) * (o.probability || 0), 0) || 0
      return sum + oppValue
    }, 0)
  }, [filteredData])

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const calculateListTotalValue = useCallback(
    (list: SavedList) => {
      const parseValue = (str: string | undefined) => {
        if (!str) return 0
        const cleaned = str.replace(/[€\s,]/g, "")
        return Number.parseFloat(cleaned) || 0
      }

      let listCustomers: Customer[] = []

      if (list.customerIds && (list.type === "static" || list.isFromSmartList)) {
        const wanted = new Set(list.customerIds)
        listCustomers = initialCustomers.filter((customer) => wanted.has(String(customer.id)))
      } else if (list.type === "dynamic" && list.filters) {
        const listFilters = list.filters
        const listSearchTerm = list.searchTerm || ""

        listCustomers = initialCustomers.filter((customer) => {
          const matchesListSearch =
            !listSearchTerm ||
            customer.name.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
            (customer.code && customer.code.toLowerCase().includes(listSearchTerm.toLowerCase()))

          const matchesListFilters =
            (listFilters.status === "all" || customer.status === listFilters.status) &&
            (listFilters.size === "all" || customer.teamSize === listFilters.size)

          return matchesListSearch && matchesListFilters
        })
      }

      const totalValue = listCustomers.reduce((sum, customer) => {
        const customerValue =
          customer.productInstances?.reduce((instanceSum, instance) => {
            return instanceSum + parseValue(instance.attributes?.totalValue)
          }, 0) || 0
        return sum + customerValue
      }, 0)

      return totalValue
    },
    [initialCustomers],
  )

  // </CHANGE> Uncommented formatCurrencyCompact function as it's still needed
  const formatCurrencyCompact = (amount: number) => {
    if (amount >= 1000000) {
      return `€${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `€${(amount / 1000).toFixed(0)}K`
    }
    return `€${amount.toFixed(0)}`
  }
  // </CHANGE>

  const formatNumberCompact = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`
    }
    return `${amount.toFixed(0)}`
  }
  // </CHANGE>

  const saveCurrentView = useCallback(() => {
    if (!newViewName.trim()) return

    const newView: SavedView = {
      id: Date.now().toString(),
      name: newViewName.trim(),
      filters: advancedFilter,
      columnVisibility: { ...columnVisibility },
      createdAt: new Date(),
    }

    setSavedViews((prev) => [...prev, newView])
    setCurrentViewId(newView.id)
    setShowViewDialog(false)
    setNewViewName("")

    toast({
      title: "View Saved",
      description: `"${newView.name}" has been saved successfully`,
    })
  }, [newViewName, advancedFilter, columnVisibility, toast])

  const loadView = useCallback(
    (viewId: string) => {
      setIsLoadingView(true)
      const view = savedViews.find((v) => v.id === viewId)

      if (view) {
        setCurrentViewId(viewId)
        if (view.filters) {
          updateCurrentListFilter(view.filters)
        }
        if (view.columnVisibility) {
          setColumnVisibility(view.columnVisibility)
        }

        toast({
          title: "View Loaded",
          description: `Loaded "${view.name}"`,
        })
      }

      setIsLoadingView(false)
    },
    [savedViews, toast, setColumnVisibility],
  )

  const saveAsDynamicList = useCallback(() => {
    if (!newListName.trim()) return

    const newList: SavedList = {
      id: Date.now().toString(),
      name: newListName.trim(),
      type: "dynamic",
      customerCount: filteredData.length,
      advancedFilters: advancedFilter,
      columnVisibility: { ...columnVisibility },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setSavedLists((prev) => [newList, ...prev])
    setSelectedListId(newList.id)
    setShowListDialog(false)
    setNewListName("")

    toast({
      title: "Dynamic List Created",
      description: `"${newList.name}" has been saved with ${newList.customerCount} customers`,
    })
  }, [newListName, filteredData, advancedFilter, columnVisibility, toast])

  useEffect(() => {
    if (isLoadingView || currentViewId === "default") return

    const currentView = savedViews.find((v) => v.id === currentViewId)
    if (!currentView) return

    setSavedViews((prev) =>
      prev.map((view) =>
        view.id === currentViewId
          ? { ...view, filters: advancedFilter, columnVisibility: { ...columnVisibility } }
          : view,
      ),
    )
  }, [advancedFilter, columnVisibility, currentViewId, isLoadingView, savedViews])

  const activeFilterCount = useMemo(() => {
    const currentFilter = getCurrentListFilter()
    if (!currentFilter) return 0

    const countConditions = (group: FilterGroup): number => {
      return group.conditions.reduce((count, condition) => {
        if ("field" in condition) {
          return count + 1
        } else {
          return count + countConditions(condition)
        }
      }, 0)
    }

    return countConditions(currentFilter)
  }, [listFilters, selectedListId, allCustomersFilter])

  // Removed visibleColumns calculation based on key metrics
  const getCurrentListName = () => {
    if (openedSmartList) {
      return openedSmartList.name
    }
    // Fix: Declare savedLists or ensure it's available in scope
    return savedLists.find((list) => list.id === selectedListId)?.name || "All Customers"
  }

  const [savedListsExpanded, setSavedListsExpanded] = useState(true)
  // const [viewMode, setViewMode] = useState<"cards" | "list">("cards"); // This was a duplicate declaration, removed to fix lint error.

  // Fix: Declare savedLists or ensure it's available in scope
  const selectedList = savedLists.find((list) => list.id === selectedListId)

  const [showColumnConfig, setShowColumnConfig] = useState(false)
  const [newListColumnVisibility, setNewListColumnVisibility] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (showAddToListDialog) {
      setNewListColumnVisibility(columnVisibility)
      setShowColumnConfig(false)
    }
  }, [showAddToListDialog, columnVisibility])

  const handleAddToList = () => {
    const selectedCustomerIds = Array.from(selectedCustomers)

    if (selectedExistingList) {
      // Add to existing static list
      // Fix: Declare setSavedLists or ensure it's available in scope
      setSavedLists((prev) =>
        prev.map((list) => {
          if (list.id === selectedExistingList && list.type === "static") {
            const existingIds = new Set(list.customerIds || [])
            selectedCustomerIds.forEach((id) => existingIds.add(id))
            return {
              ...list,
              customerIds: Array.from(existingIds),
              customerCount: existingIds.size,
              updatedAt: new Date().toISOString(),
            }
          }
          return list
        }),
      )
    } else if (newListName.trim()) {
      // Create new static list
      const newList: SavedList = {
        id: Date.now().toString(),
        name: newListName.trim(),
        type: "static",
        customerCount: selectedCustomerIds.length,
        customerIds: selectedCustomerIds,
        columnVisibility: newListColumnVisibility,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      // Fix: Declare setSavedLists or ensure it's available in scope
      setSavedLists((prev) => [newList, ...prev])
    }

    // Close dialog and clear selections
    setShowAddToListDialog(false)
    setNewListName("")
    setSelectedExistingList(null)
    setSelectedCustomers(new Set())
    setShowColumnConfig(false)
    setNewListColumnVisibility({})
  }

  const handleListSelection = (listId: string) => {
    setOpenedSmartList(null)
    setShowAiPanel(false)
    setSelectedListId(listId)

    if (listId !== "1") {
      // Fix: Declare savedLists or ensure it's available in scope
      const selectedList = savedLists.find((list) => list.id === listId)
      if (selectedList?.columnVisibility) {
        setListColumnVisibility((prev) => ({
          ...prev,
          [listId]: selectedList.columnVisibility,
        }))
      }

      // Auto-apply filters for dynamic lists
      if (selectedList?.type === "dynamic" && selectedList.advancedFilters) {
        setListFilters((prev) => ({
          ...prev,
          [listId]: selectedList.advancedFilters,
        }))
      }
    }
  }

  const [listCreationMode, setListCreationMode] = useState<"create" | "existing">("create")

  const handleDeleteList = (listId: string) => {
    // Fix: Declare setSavedLists or ensure it's available in scope
    setSavedLists((prev) => prev.filter((list) => list.id !== listId))
    if (selectedListId === listId) {
      setSelectedListId("1")
    }
  }

  const handleOpenEditListDialog = (list: any) => {
    console.log("Edit list:", list.name)
  }

  const handleStartEditingListContent = (listId: string) => {
    console.log("Edit list content:", listId)
  }

  const handleStartEditingDynamicListContent = (listId: string) => {
    console.log("Edit dynamic list content:", listId)
  }

  const handleOpenDeleteConfirm = (listId: string) => {
    handleDeleteList(listId)
  }

  // Fix: Declare smartListSuggestions or ensure it's available in scope
  const sortedSmartListSuggestions = useMemo(() => {
    return [...smartListSuggestions]
    // </CHANGE>
  }, [smartListSuggestions])

  const handleSaveAsNewList = () => {
    // This function is a placeholder for saving the current list as a new static or dynamic list.
    // The logic for saving as a new list (static or dynamic) would be implemented here.
    // For now, we can just log a message.
    console.log("Save as new list clicked")
    // Potentially open a dialog to choose between static/dynamic and enter a name.
  }

  const handleAddToExistingCampaign = () => {
    setShowAddToCampaignDialog(true)
  }

  const handleUseCampaignTemplate = () => {
    setShowCampaignTemplateDialog(true)
  }

  const handleSelectExistingCampaign = () => {
    if (selectedExistingCampaign) {
      console.log("Adding to existing campaign:", selectedExistingCampaign)
      // TODO: Implement actual campaign addition logic
      setShowAddToCampaignDialog(false)
      setSelectedExistingCampaign(null)
    }
  }

  const handleCampaignTemplateSelect = (template: CampaignTemplate | null) => {
    // Accept null
    setSelectedCampaignTemplate(template)
    if (template) {
      // TODO: Implement actual template usage logic
      setShowCampaignTemplateDialog(false)
      // setSelectedCampaignTemplate(null) // This line was causing the issue, removed to keep the selected template
    }
  }

  const [selectedCustomerCampaigns, setSelectedCustomerCampaigns] = useState<{
    customer: any
    campaigns: Campaign[]
  } | null>(null)

  const handleGenerateAIList = async () => {
    if (!aiPrompt.trim()) return

    setIsGeneratingList(true)
    try {
      const response = await fetch("/api/generate-smart-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      })

      if (!response.ok) throw new Error("Failed to generate list")

      const generatedList = await response.json()

      // Add the generated list to saved lists
      const newList: SavedList = {
        id: Date.now().toString(),
        name: generatedList.name,
        description: generatedList.description,
        type: "dynamic" as const,
        filters: generatedList.filters,
        customerCount: generatedList.estimatedCount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), // Added updatedAt
      }

      // Fix: Declare setSavedLists or ensure it's available in scope
      setSavedLists((prev) => [newList, ...prev])
      setShowAIGenerationDialog(false)
      setAiPrompt("")
      // Remove this line as it's replaced by the new single-level filter
      // setListsViewType("saved")
      setSelectedListId(newList.id)
      toast({
        title: "Smart List Generated",
        description: `Created "${newList.name}" with ${newList.estimatedCount} estimated customers`,
      })
    } catch (error) {
      console.error("Error generating AI list:", error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate smart list. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingList(false)
    }
  }

  const handleGenerateSmartList = async () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true) // Set generating state for AI prompt

    try {
      const response = await fetch("/api/generate-smart-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate smart list")
      }

      const { smartList } = await response.json()

      // Create a new smart list suggestion with AI-generated data
      const newSmartList: SmartListSuggestion = {
        id: `ai-generated-${Date.now()}`,
        name: smartList.name,
        description: smartList.description,
        icon: <Users className="h-4 w-4" />,
        color: "purple",
        rules: smartList.rules.map((rule: any) => ({
          ...rule,
          id: rule.id || `rule-${Date.now()}-${Math.random()}`,
        })),
        userCount: smartList.estimatedCount,
        dollarValue: 0, // Default value as it's not provided by AI
        rating: 0, // Default value
        recommendedByExperts: false, // Default value
        isActedUpon: false, // Set to false for new suggestions
        source: "AI Generated", // Added source
      }

      // Add to smart list suggestions
      // Fix: Declare setSmartListSuggestions or ensure it's available in scope
      setSmartListSuggestions((prev) => [newSmartList, ...prev])

      // Automatically open the generated list
      handleSuggestionClick(newSmartList)

      // Close dialog and reset form
      setShowAIGenerationDialog(false)
      setAiPrompt("")

      toast({
        title: "Smart List Generated",
        description: `Created "${smartList.name}" with ${smartList.estimatedCount} estimated customers`,
      })
    } catch (error) {
      console.error("Error generating smart list:", error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate smart list. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreditConfirm = () => {
    if (!selectedCreditTemplate) return

    const creditCost = getCreditCost(
      selectedCreditTemplate.badge || "",
      selectedCreditTemplate.isMarketRadar || false,
      selectedCreditTemplate.isBranded, // Pass isBranded here
    )

    // Use the correct hook/function for deducting credits
    deductCredits(creditCost, selectedCreditTemplate.name)
    unlockCreditTemplate(selectedCreditTemplate.id)

    // Open the list
    setOpenedSmartList(selectedCreditTemplate)
    setSelectedListId(null)

    const newBalance = creditBalance - creditCost
    toast({
      title: (
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span>Template "{selectedCreditTemplate.name}" unlocked with credits!</span>
        </div>
      ) as any,
      description:
        newBalance < 0 ? `You'll be charged for the additional credits in your next billing period.` : undefined,
    })

    setShowCreditDialog(false)
    setSelectedCreditTemplate(null)
  }

  const CampaignLinkTooltip = ({ campaigns, children }: { campaigns: any[]; children: React.ReactNode }) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent className="max-w-sm p-4 bg-white border shadow-lg">
            <div className="space-y-3">
              <div className="font-semibold text-sm text-gray-900">🔗 Campaign Auto-Enrollment</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                This list is linked to {campaigns.length} active campaign{campaigns.length > 1 ? "s" : ""}.
                <strong className="text-blue-600">
                  {" "}
                  Every customer added to this list will automatically be enrolled
                </strong>{" "}
                in:
              </div>
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded text-xs">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        campaign.status === "active"
                          ? "bg-green-500"
                          : campaign.status === "draft"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-gray-500 capitalize">
                        {campaign.status} • Created {campaign.createdAt}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border-l-2 border-amber-400">
                ⚠️ <strong>Broker Note:</strong> Customers will receive campaign emails immediately upon list addition.
                Review campaign settings before adding new customers.
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  useEffect(() => {
    if (isPolicyExpiryList) {
      console.log("[v0] TABLE RENDER - filteredData length:", filteredData.length)
      filteredData.forEach((customer, index) => {
        console.log(
          `[v0] TABLE RENDER - Row ${index + 1}: ${customer.name} (ID: ${customer.id}) expiringProduct: ${customer.expiringProduct} contractEndDate: ${customer.contractEndDate}`,
        )
      })
    }
  }, [filteredData, isPolicyExpiryList])

  const aggregateAttributeValues = (
    instances: any[],
    attributeKey: string,
    attributeType: "text" | "id" | "date" | "currency" | "percentage",
  ): string | null => {
    // Get all non-empty values
    const values = instances
      .map((instance) => instance.attributes[attributeKey])
      .filter((val) => val !== undefined && val !== null && val !== "")

    if (values.length === 0) {
      return null // No values available
    }

    switch (attributeType) {
      case "currency":
      case "percentage": {
        // Sum all numeric values
        const sum = values.reduce((acc, val) => {
          const numVal = Number.parseFloat(val.toString().replace(/[^0-9.-]/g, ""))
          return acc + (isNaN(numVal) ? 0 : numVal)
        }, 0)

        if (attributeType === "percentage") {
          return `${sum}%`
        }
        // Format currency
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(sum)
      }

      case "date": {
        // If all equal, show one; else comma-separated sorted ascending
        const uniqueValues = Array.from(new Set(values))
        if (uniqueValues.length === 1) {
          return uniqueValues[0]
        }
        return uniqueValues.sort().join(", ")
      }

      case "id": {
        // Always show all values comma-separated
        return values.join(", ")
      }

      case "text":
      default: {
        // If all identical, show one; else comma-separated sorted A→Z
        const uniqueValues = Array.from(new Set(values))
        if (uniqueValues.length === 1) {
          return uniqueValues[0]
        }
        return uniqueValues.sort().join(", ")
      }
    }
  }

  const visibleProducts = insuranceProducts // Define visibleProducts based on your requirements

  const [customColumns, setCustomColumns] = React.useState<
    Array<{
      id: string
      name: string
      formula: string
    }>
  >([])
  const [showAddColumnMenu, setShowAddColumnMenu] = React.useState(false)
  const [showFormulaDialog, setShowFormulaDialog] = React.useState(false)
  const [formulaInput, setFormulaInput] = React.useState("")
  const [columnNameInput, setColumnNameInput] = React.useState("")
  const [showVariableMenu, setShowVariableMenu] = React.useState(false)
  const [variableMenuPosition, setVariableMenuPosition] = React.useState({ top: 0, left: 0 })
  const [cursorPosition, setCursorPosition] = React.useState(0)
  const formulaInputRef = React.useRef<HTMLTextAreaElement>(null)

  // Available variables for formula
  const availableVariables = [
    { label: "Property Insurance Value", value: "propertyInsuranceValue" },
    { label: "Liability Insurance Value", value: "liabilityInsuranceValue" },
    { label: "Total Value", value: "totalValue" },
    { label: "Team Size", value: "teamSize" },
    { label: "Partners", value: "partners" },
  ]

  // Handle formula input change and detect slash command
  const handleFormulaInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    setFormulaInput(value)
    setCursorPosition(cursorPos)

    // Check if user typed "/" to show variable menu
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastSlashIndex = textBeforeCursor.lastIndexOf("/")

    if (lastSlashIndex !== -1 && lastSlashIndex === cursorPos - 1) {
      // Show variable menu
      const textarea = e.target
      const rect = textarea.getBoundingClientRect()
      setVariableMenuPosition({
        top: rect.top + 100,
        left: rect.left + 20,
      })
      setShowVariableMenu(true)
    } else {
      setShowVariableMenu(false)
    }
  }

  // Insert variable into formula
  const insertVariable = (variable: string) => {
    const textBeforeCursor = formulaInput.substring(0, cursorPosition)
    const textAfterCursor = formulaInput.substring(cursorPosition)
    const lastSlashIndex = textBeforeCursor.lastIndexOf("/")

    const newText = formulaInput.substring(0, lastSlashIndex) + `{${variable}}` + textAfterCursor

    setFormulaInput(newText)
    setShowVariableMenu(false)

    // Focus back on textarea
    setTimeout(() => {
      formulaInputRef.current?.focus()
    }, 0)
  }

  // Evaluate formula for a customer
  const evaluateFormula = (formula: string, customer: any): string => {
    try {
      // Parse premium values from strings like "€2,400" to numbers
      const parseValue = (str: string | undefined) => {
        if (!str) return 0
        const cleaned = str.replace(/[€\s,]/g, "")
        return Number.parseFloat(cleaned) || 0
      }

      const propertyProduct = customer.productInstances?.find(
        (instance: any) =>
          instance.productName === "Property Insurance" ||
          instance.attributes?.productCategory === "Property Insurance",
      )
      const liabilityProduct = customer.productInstances?.find(
        (instance: any) =>
          instance.productName === "Liability Insurance" ||
          instance.attributes?.productCategory === "Liability Insurance",
      )

      const propertyValue = parseValue(propertyProduct?.attributes?.premiumValue)
      const liabilityValue = parseValue(liabilityProduct?.attributes?.premiumValue)
      const totalValue = propertyValue + liabilityValue

      // Replace variables in formula
      let evaluatedFormula = formula
        .replace(/{propertyInsuranceValue}/g, propertyValue.toString())
        .replace(/{liabilityInsuranceValue}/g, liabilityValue.toString())
        .replace(/{totalValue}/g, totalValue.toString())
        .replace(/{teamSize}/g, (customer.team?.length || 0).toString())
        .replace(/{partners}/g, (customer.partnerCount || 0).toString())

      // Safe evaluation: only allow basic arithmetic operations
      // Remove any characters that aren't numbers, operators, parentheses, or decimal points
      evaluatedFormula = evaluatedFormula.replace(/[^0-9+\-*/().\s]/g, "")

      // Use Function constructor instead of eval for safer evaluation
      // This still evaluates code but is slightly safer than direct eval
      const result = new Function(`return ${evaluatedFormula}`)()

      // Format result
      if (typeof result === "number") {
        return result % 1 === 0 ? result.toString() : result.toFixed(2)
      }
      return result.toString()
    } catch (error) {
      console.error("Error evaluating formula:", error)
      return "Error"
    }
  }

  // Save custom column
  const handleSaveCustomColumn = () => {
    if (!columnNameInput.trim() || !formulaInput.trim()) return

    const newColumn = {
      id: `custom-${Date.now()}`,
      name: columnNameInput,
      formula: formulaInput,
    }

    setCustomColumns([...customColumns, newColumn])
    setColumnNameInput("")
    setFormulaInput("")
    setShowFormulaDialog(false)
    setShowAddColumnMenu(false)
  }

  // Helper to handle saving and switching to saved lists
  const handleSavedListClick = (list: SavedList) => {
    setSelectedListId(list.id)
    setOpenedSmartList(null) // Close smart list preview if open
    setShowAiPanel(false)
  }

  const handleDisregardSmartList = () => {
    setOpenedSmartList(null)
    toast({
      title: "Smart List Closed",
      description: "You have returned to the main customer view.",
    })
  }

  const handleVoucherApply = (code: string) => {
    if (selectedLockedTemplate) {
      unlockTemplate(selectedLockedTemplate.id)
      toast({
        title: "Template Unlocked",
        description: `"${selectedLockedTemplate.name}" is now available to use`,
      })
      setSelectedLockedTemplate(null)
    }
  }

  const filteredSavedLists = useMemo(() => {
    // Filter saved lists based on searchTerm
    return savedLists.filter((list) => list.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [savedLists, searchTerm])

  // Handle AI prompt submit
  const handleAIPromptSubmit = () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false)
      setAIPromptExpanded(false) // Collapse AI prompt after submission
      toast({
        title: "Audience Generated",
        description: "Your custom audience is being created. You'll be notified when it's ready.",
      })
      // In a real scenario, this would trigger the generation and potentially open the new list
    }, 1500)
  }

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-blue-100/50 via-blue-50/30 via-5% to-white to-7%">
        <div className="flex items-center justify-between px-6 py-1.5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">...</span>
              <span className="text-gray-300">/</span>
              <span className="text-blue-600 font-normal">Customers</span>
              {(selectedList || openedSmartList) && (
                <>
                  <span className="text-gray-300">/</span>
                  <span className="text-gray-700">
                    {selectedList?.name || openedSmartList?.name}
                    {openedSmartList && <span className="text-gray-400 ml-1.5">(Preview)</span>}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditIndicator />
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-normal">KK</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-12 pb-2 text-center">
          <h1 className="text-5xl font-semibold text-gray-900 mb-3 text-balance">{"Build Lists and Launch Campaigns"}</h1>
          <p className="text-lg text-gray-600 mb-8 text-pretty">Create or choose a list to launch your next campaign</p>

          {/* Tab Navigation - Canva Style */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                setListFilter("saved")
                setSelectedListId(null)
                setAIPromptExpanded(false)
              }}
              className={cn(
                "rounded-lg px-6 py-2.5 font-medium transition-all border",
                listFilter === "saved"
                  ? "bg-[rgb(224,231,255)] text-primary border-transparent hover:bg-[rgb(214,221,245)]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
              )}
            >
              <Bookmark className="w-4 h-4 mr-2 text-gray-500" />
              My Lists
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                setListFilter("templates")
                setActiveTemplateCategory("all")
              }}
              className={cn(
                "rounded-lg px-6 py-2.5 font-medium transition-all border",
                listFilter === "templates"
                  ? "bg-[rgb(224,231,255)] text-primary border-transparent hover:bg-[rgb(214,221,245)]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
              )}
            >
              <LayoutGrid className="w-4 h-4 mr-2 text-gray-500" />
              Templates
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => setAIPromptExpanded(true)}
              className={cn(
                "rounded-lg px-6 py-2.5 font-medium transition-all border",
                aiPromptExpanded
                  ? "bg-[rgb(224,231,255)] text-primary border-transparent hover:bg-[rgb(214,221,245)]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
              )}
            >
              <Sparkles className="w-4 h-4 mr-2 text-gray-500" />
              Create with AI
            </Button>
            {/* </CHANGE> */}
          </div>
        </div>
        {/* </CHANGE> */}

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6">
          {/* Saved Lists / Templates View */}

          {/* My Lists View */}
          {listFilter === "saved" && (
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Your Audiences</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl bg-transparent">
                      {viewMode === "cards" ? <LayoutGrid className="w-4 h-4" /> : <ListIcon className="w-4 h-4" />}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={() => setViewMode("cards")} className="cursor-pointer">
                      <LayoutGrid className="w-4 h-4 mr-2" />
                      Cards
                      {viewMode === "cards" && <CheckIcon className="w-4 h-4 ml-auto text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setViewMode("list")} className="cursor-pointer">
                      <ListIcon className="w-4 h-4 mr-2" />
                      List
                      {viewMode === "list" && <CheckIcon className="w-4 h-4 ml-auto text-primary" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {viewMode === "cards" ? (
                <div className="py-6 px-[54px]">
                  <Carousel
                    opts={{
                      align: "start",
                      loop: false,
                    }}
                    className="w-full"
                  >
                    {/* Added px-4 to CarouselContent to create space between arrows and cards, preventing ring clipping */}
                    <CarouselContent className="-ml-4 py-2 px-4">
                      {filteredSavedLists.map((list) => (
                        <CarouselItem key={list.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                          <Card
                            className={cn(
                              "group cursor-pointer transition-all rounded-2xl overflow-hidden border-gray-200",
                              selectedListId === list.id
                                ? "ring-2 ring-primary ring-offset-2 shadow-xl -translate-y-1"
                                : "hover:shadow-lg hover:-translate-y-1",
                            )}
                            onClick={() => handleSavedListClick(list)}
                          >
                            <CardContent className="p-6">
                              {/* Icon Container */}
                              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                                <Bookmark className="h-6 w-6 text-primary" />
                              </div>

                              {/* Content */}
                              <h3 className="font-semibold text-base mb-2 line-clamp-2 leading-tight">{list.name}</h3>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                                {list.customerCount.toLocaleString()} customers
                              </p>
                              {list.createdAt && (
                                <p className="text-xs text-gray-400">
                                  Edited {new Date(list.createdAt).toLocaleDateString()}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="-left-4 lg:-left-12" />
                    <CarouselNext className="-right-4 lg:-right-12" />
                  </Carousel>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSavedLists.map((list) => (
                    <Card
                      key={list.id}
                      className={cn(
                        "p-4 cursor-pointer transition-all rounded-xl border-gray-200",
                        selectedListId === list.id ? "ring-2 ring-primary ring-offset-2 shadow-xl" : "hover:shadow-md",
                      )}
                      onClick={() => handleSavedListClick(list)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Bookmark className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{list.name}</h3>
                            <p className="text-sm text-gray-500">{list.customerCount.toLocaleString()} customers</p>
                          </div>
                        </div>
                        {list.createdAt && (
                          <p className="text-xs text-gray-400">{new Date(list.createdAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Templates View */}
          {listFilter === "templates" && (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 pt-2">
                {/* Pre-built Smart Lists */}
                <Card
                  className={cn(
                    "group cursor-pointer transition-all rounded-3xl overflow-hidden border-0 h-[90px] bg-gradient-to-br from-orange-100 via-orange-50 to-amber-50",
                    activeTemplateCategory === "pre-built"
                      ? "ring-2 ring-primary ring-offset-2 shadow-xl -translate-y-1"
                      : "hover:shadow-xl hover:-translate-y-1",
                  )}
                  onClick={() => setActiveTemplateCategory("pre-built")}
                >
                  <CardContent className="p-3 h-full flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">Pre-built smart lists</h3>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <div className="w-16 h-16 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center transform rotate-6 transition-transform group-hover:rotate-12">
                        <img
                          src="/organized-audience-list-cards-stacked.jpg"
                          alt="Pre-built smart lists"
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Branded Smart Lists */}
                <Card
                  className={cn(
                    "group cursor-pointer transition-all rounded-3xl overflow-hidden border-0 h-[90px] bg-gradient-to-br from-purple-100 via-purple-50 to-pink-50",
                    activeTemplateCategory === "branded"
                      ? "ring-2 ring-primary ring-offset-2 shadow-xl -translate-y-1"
                      : "hover:shadow-xl hover:-translate-y-1",
                  )}
                  onClick={() => setActiveTemplateCategory("branded")}
                >
                  <CardContent className="p-3 h-full flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">Branded smart lists</h3>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <div className="w-16 h-16 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center transform rotate-6 transition-transform group-hover:rotate-12">
                        <img
                          src="/insurance-company-branded-badge-shield.jpg"
                          alt="Branded smart lists"
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Market Radar Lists */}
                <Card
                  className={cn(
                    "group cursor-pointer transition-all rounded-3xl overflow-hidden border-0 h-[90px] bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-50",
                    activeTemplateCategory === "market-radar"
                      ? "ring-2 ring-primary ring-offset-2 shadow-xl -translate-y-1"
                      : "hover:shadow-xl hover:-translate-y-1",
                  )}
                  onClick={() => setActiveTemplateCategory("market-radar")}
                >
                  <CardContent className="p-3 h-full flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">AI Market radar lists</h3>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <div className="w-16 h-16 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center transform rotate-6 transition-transform group-hover:rotate-12">
                        <img
                          src="/ai-radar-screen-detecting-opportunities.jpg"
                          alt="AI Market radar lists"
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* </CHANGE> */}
              <div className="space-y-12">
                {/* Pre-built Templates Section */}
                {filteredSmartListSuggestions.filter((s) => !s.isBranded && !s.isMarketRadar).length > 0 && (
                  <div>
                    {activeTemplateCategory !== "pre-built" && (
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Pre-built Smart Lists</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTemplateCategory("pre-built")}
                          className="text-primary hover:text-primary/80"
                        >
                          View all
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {/* </CHANGE> */}
                    <Carousel
                      opts={{
                        align: "start",
                        loop: false,
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="-ml-4 py-2 px-4">
                        {filteredSmartListSuggestions
                          .filter((s) => !s.isBranded && !s.isMarketRadar)
                          .slice(0, 8)
                          .map((suggestion) => (
                            <CarouselItem key={suggestion.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                              <Card
                                className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 rounded-2xl overflow-hidden bg-white border-gray-200 h-full"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                <CardContent className="p-5">
                                  {suggestion.isAISignal ? (
                                    /* ── AI Signal card variant ── */
                                    (() => {
                                      const catColor = suggestion.signalCatColor ?? "#0D9488"
                                      const catLabel = SIGNAL_CATEGORIES.find(c => c.type === suggestion.signalCategoryType)?.label ?? suggestion.signalCategoryType ?? ""
                                      const urgency = suggestion.signalUrgency ?? "medium"
                                      const IconComp = (typeof suggestion.icon === "string" ? (SIGNAL_ICON_MAP[suggestion.icon] ?? Sparkles) : null)
                                      const URGENCY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
                                        critical: { bg: "#FEE2E2", text: "#DC2626", label: "Critical" },
                                        high:     { bg: "#FED7AA", text: "#EA580C", label: "High" },
                                        medium:   { bg: "#FEF3C7", text: "#D97706", label: "Medium" },
                                        low:      { bg: "#D1FAE5", text: "#059669", label: "Low" },
                                      }
                                      const urg = URGENCY_COLORS[urgency] ?? URGENCY_COLORS.medium
                                      return (
                                        <>
                                          {/* Category + urgency badges */}
                                          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                                            <span
                                              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wide border"
                                              style={{ color: catColor, backgroundColor: catColor + "14", borderColor: catColor + "30" }}
                                            >
                                              {catLabel}
                                            </span>
                                            <span
                                              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wide"
                                              style={{ color: urg.text, backgroundColor: urg.bg }}
                                            >
                                              {urg.label}
                                            </span>
                                          </div>

                                          {/* Icon */}
                                          <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                                            style={{ background: `linear-gradient(135deg, ${suggestion.signalGradient?.[0] ?? "#F0FDFA"}, ${suggestion.signalGradient?.[1] ?? "#CCFBF1"})` }}
                                          >
                                            {IconComp
                                              ? <IconComp size={17} style={{ color: catColor }} />
                                              : <Sparkles size={17} style={{ color: catColor }} />
                                            }
                                          </div>

                                          {/* Name */}
                                          <h3 className="font-semibold text-sm mb-1.5 line-clamp-2 leading-tight text-gray-900">
                                            {suggestion.name}
                                          </h3>

                                          {/* Key reasons */}
                                          {suggestion.signalKeyReasons && suggestion.signalKeyReasons.length > 0 && (
                                            <ul className="mb-3 space-y-1">
                                              {suggestion.signalKeyReasons.slice(0, 2).map((r, i) => (
                                                <li key={i} className="flex items-start gap-1.5 text-[10.5px] text-gray-500 leading-snug">
                                                  <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: catColor }} />
                                                  {r}
                                                </li>
                                              ))}
                                            </ul>
                                          )}

                                          {/* Metrics footer */}
                                          <div className="flex items-center gap-3 text-xs border-t border-gray-100 pt-3 mt-auto">
                                            <div className="flex items-center gap-1.5">
                                              <Users className="h-3.5 w-3.5 text-gray-400" />
                                              <span className="font-medium text-gray-700">{suggestion.userCount}</span>
                                            </div>
                                            <div className="flex items-center gap-1 ml-auto">
                                              <span className="text-gray-400 text-[10px]">potential</span>
                                              <span className="font-semibold" style={{ color: catColor }}>
                                                €{suggestion.dollarValue >= 1000
                                                  ? `${(suggestion.dollarValue / 1000).toFixed(0)}k`
                                                  : suggestion.dollarValue}
                                              </span>
                                            </div>
                                          </div>
                                        </>
                                      )
                                    })()
                                  ) : (
                                    /* ── Standard pre-built card ── */
                                    <>
                                      {/* Icon */}
                                      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                                        <div className="text-2xl text-primary">{suggestion.icon}</div>
                                      </div>

                                      {/* Content */}
                                      <h3 className="font-semibold text-base mb-2 line-clamp-2 leading-tight">
                                        {suggestion.name}
                                      </h3>
                                      <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-snug">
                                        {suggestion.description}
                                      </p>

                                      {/* Rating */}
                                      {suggestion.rating && (
                                        <div className="flex items-center gap-2 mb-4">
                                          <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                              <Star
                                                key={i}
                                                className={cn(
                                                  "h-3.5 w-3.5",
                                                  i < Math.floor(suggestion.rating!)
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "fill-gray-200 text-gray-200",
                                                )}
                                              />
                                            ))}
                                          </div>
                                          <span className="text-sm font-medium">{suggestion.rating}</span>
                                        </div>
                                      )}

                                      {/* Metrics */}
                                      <div className="flex items-center gap-3 text-sm border-t border-gray-100 pt-4">
                                        <div className="flex items-center gap-1.5">
                                          <Users className="h-4 w-4 text-gray-400" />
                                          <span className="font-medium text-xs">{suggestion.userCount} customers</span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-400">€</span>
                                          <span className="font-medium text-xs">
                                            {formatNumberCompact(suggestion.dollarValue)}
                                          </span>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </CardContent>
                              </Card>
                            </CarouselItem>
                          ))}
                      </CarouselContent>
                      <CarouselPrevious className="-left-4 lg:-left-12" />
                      <CarouselNext className="-right-4 lg:-right-12" />
                    </Carousel>
                  </div>
                )}

                {/* Branded Templates Section */}
                {filteredSmartListSuggestions.filter((s) => s.isBranded).length > 0 && (
                  <div>
                    {activeTemplateCategory !== "branded" && (
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Branded Smart Lists</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTemplateCategory("branded")}
                          className="text-primary hover:text-primary/80"
                        >
                          View all
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {/* </CHANGE> */}
                    <Carousel
                      opts={{
                        align: "start",
                        loop: false,
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="-ml-4 py-2 px-4">
                        {filteredSmartListSuggestions
                          .filter((s) => s.isBranded)
                          .slice(0, 8)
                          .map((suggestion) => (
                            <CarouselItem key={suggestion.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                              <Card
                                className={cn(
                                  "group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 rounded-2xl overflow-hidden h-full",
                                  suggestion.isAISignal
                                    ? "bg-white border border-gray-200 border-l-[3px]"
                                    : "bg-white border-gray-200",
                                )}
                                style={suggestion.isAISignal ? { borderLeftColor: suggestion.signalCatColor ?? "#0D9488" } : undefined}
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                <CardContent className="p-6">
                                  {/* Badge */}
                                  {suggestion.badge === "Offered" && (
                                    <Badge className="absolute top-4 right-4 bg-branded text-branded-foreground rounded-lg">
                                      {suggestion.badge}
                                    </Badge>
                                  )}

                                  {/* Icon/Logo */}
                                  <div className="w-14 h-14 rounded-2xl bg-branded-muted border border-branded-border flex items-center justify-center mb-4">
                                    {suggestion.logoUrl ? (
                                      <img
                                        src={suggestion.logoUrl || "/placeholder.svg"}
                                        alt={`${suggestion.brandedBy} logo`}
                                        className="w-full h-full object-contain p-2"
                                        onError={(e) => {
                                          e.currentTarget.src = "/axa-insurance-logo.png"
                                        }}
                                      />
                                    ) : (
                                      <div className="text-2xl text-branded">{suggestion.icon}</div>
                                    )}
                                  </div>

                                  {/* Content */}
                                  <h3 className="font-semibold text-base mb-2 line-clamp-2 leading-tight">
                                    {suggestion.name}
                                  </h3>
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-snug">
                                    {suggestion.description}
                                  </p>

                                  {/* Source */}
                                  {suggestion.brandedBy && (
                                    <p className="text-xs text-branded font-medium mb-3">by {suggestion.brandedBy}</p>
                                  )}

                                  {/* Rating */}
                                  {suggestion.rating && (
                                    <div className="flex items-center gap-2 mb-4">
                                      <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={cn(
                                              "h-3.5 w-3.5",
                                              i < Math.floor(suggestion.rating!)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "fill-gray-200 text-gray-200",
                                            )}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm font-medium">{suggestion.rating}</span>
                                    </div>
                                  )}

                                  {/* Metrics */}
                                  <div className="flex items-center gap-3 text-sm border-t border-gray-100 pt-4">
                                    <div className="flex items-center gap-1.5">
                                      <Users className="h-4 w-4 text-gray-400" />
                                      <span className="font-medium text-xs">{suggestion.userCount} customers</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-400">€</span>
                                      <span className="font-medium text-xs">
                                        {formatNumberCompact(suggestion.dollarValue)}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </CarouselItem>
                          ))}
                      </CarouselContent>
                      <CarouselPrevious className="-left-4 lg:-left-12" />
                      <CarouselNext className="-right-4 lg:-right-12" />
                    </Carousel>
                  </div>
                )}

                {/* Market Radar Templates Section */}
                {filteredSmartListSuggestions.filter((s) => s.isMarketRadar).length > 0 && (
                  <div>
                    {activeTemplateCategory !== "market-radar" && (
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">AI Market Radar Lists</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTemplateCategory("market-radar")}
                          className="text-primary hover:text-primary/80"
                        >
                          View all
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <Carousel
                      opts={{
                        align: "start",
                        loop: false,
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="-ml-4 py-2 px-4">
                        {filteredSmartListSuggestions
                          .filter((s) => s.isMarketRadar)
                          .slice(0, 8)
                          .map((suggestion) => (
                            <CarouselItem key={suggestion.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                              <Card
                                className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 rounded-2xl overflow-hidden bg-white border-gray-200 h-full"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                <CardContent className="p-6">
                                  {/* Badge */}
                                  {suggestion.daysLeft !== undefined && (
                                    <Badge className="absolute top-4 right-4 bg-orange-100 text-orange-700 border-orange-200 rounded-lg">
                                      {suggestion.daysLeft} days left
                                    </Badge>
                                  )}

                                  {/* Icon */}
                                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                                    <div className="text-2xl text-primary">{suggestion.icon}</div>
                                  </div>

                                  {/* Content */}
                                  <h3 className="font-semibold text-base mb-2 line-clamp-2 leading-tight">
                                    {suggestion.name}
                                  </h3>
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-snug">
                                    {suggestion.description}
                                  </p>

                                  {/* Source */}
                                  {suggestion.isMarketRadar && (
                                    <p className="text-xs text-blue-600 mb-3">
                                      by {suggestion.source || "Qollabi AI"} – Market Pulse,{" "}
                                      {suggestion.marketPulseDate}
                                    </p>
                                  )}

                                  {/* Rating */}
                                  {suggestion.rating && (
                                    <div className="flex items-center gap-2 mb-4">
                                      <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={cn(
                                              "h-3.5 w-3.5",
                                              i < Math.floor(suggestion.rating!)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "fill-gray-200 text-gray-200",
                                            )}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm font-medium">{suggestion.rating}</span>
                                    </div>
                                  )}

                                  {/* Metrics */}
                                  <div className="flex items-center gap-3 text-sm border-t border-gray-100 pt-4">
                                    <div className="flex items-center gap-1.5">
                                      <Users className="h-4 w-4 text-gray-400" />
                                      <span className="font-medium text-xs">{suggestion.userCount} customers</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-400">€</span>
                                      <span className="font-medium text-xs">
                                        {formatNumberCompact(suggestion.dollarValue)}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </CarouselItem>
                          ))}
                      </CarouselContent>
                      <CarouselPrevious className="-left-4 lg:-left-12" />
                      <CarouselNext className="-right-4 lg:-right-12" />
                    </Carousel>
                  </div>
                )}
              </div>
              {/* </CHANGE> */}
            </div>
          )}

          {/* AI Prompt View */}
          {aiPromptExpanded && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-2">Create with AI</h2>
                <p className="text-gray-600">Describe the audience you want to reach and let AI build your list</p>
              </div>

              <Card className="p-8 rounded-3xl border-gray-200 shadow-lg">
                <Label htmlFor="ai-prompt" className="text-base font-medium mb-3 block">
                  Describe your target audience
                </Label>
                <Textarea
                  id="ai-prompt"
                  placeholder="Example: Show me customers who own a home, have children under 18, and don't have life insurance..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="min-h-[120px] rounded-xl text-base resize-none"
                />

                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-3">Quick starts:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "New homeowners in the last 6 months",
                      "Small business owners with 5-20 employees",
                      "Parents with young children under 5",
                      "High-value customers without life insurance",
                    ].map((quickStart) => (
                      <Button
                        key={quickStart}
                        variant="outline"
                        size="sm"
                        className="rounded-full bg-transparent"
                        onClick={() => setAiPrompt(quickStart)}
                      >
                        {quickStart}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <Button
                    size="lg"
                    className="flex-1 rounded-xl"
                    onClick={handleAIPromptSubmit}
                    disabled={!aiPrompt.trim() || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Audience
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl bg-transparent"
                    onClick={() => setAIPromptExpanded(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>

              {/* Recent AI-created lists */}
              {promptHistory.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent AI-created audiences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {promptHistory.slice(0, 4).map((history) => (
                      <Card
                        key={history.id}
                        className="p-4 cursor-pointer hover:shadow-md transition-all rounded-xl border-gray-200"
                        onClick={() => {
                          setAiPrompt(history.prompt)
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{history.prompt}</p>
                            <p className="text-xs text-gray-500">
                              {history.timestamp.toLocaleDateString()} • {history.resultingRules.length} rules
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedListId && (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Customer name"
                      className="pl-10 h-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Show View, Filters, and Columns buttons only for saved lists */}
                  {selectedListId && (
                    <>
                      <Button
                        variant="outline"
                        className="h-10 px-4 gap-2 bg-transparent font-normal rounded-xl"
                        onClick={() => {
                          // Placeholder - no functionality
                        }}
                      >
                        <Bookmark className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10 px-4 gap-2 bg-transparent font-normal rounded-xl"
                        onClick={() => {
                          // Placeholder - no functionality
                        }}
                      >
                        <Filter className="h-4 w-4" />
                        Filters
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10 px-4 gap-2 bg-transparent font-normal rounded-xl"
                        onClick={() => {
                          // Placeholder - no functionality
                        }}
                      >
                        <Columns3 className="h-4 w-4" />
                        Columns
                      </Button>
                      {/* </CHANGE> */}
                    </>
                  )}
                </div>

                {/* Actions dropdown with Export and New Customer - aligned to the right */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 px-3 rounded-xl bg-transparent">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                    {/* </CHANGE> */}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                      <DownloadIcon className="w-4 h-4" />
                      Export customers as CSV
                    </DropdownMenuItem>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer"
                            onSelect={(e) => {
                              e.preventDefault()
                              // New customer action here
                            }}
                          >
                            <PlusIcon className="w-4 h-4" />
                            New customer
                          </DropdownMenuItem>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="text-xs">
                            New customers are added to "All Customers" and will appear in other lists only if they match
                            the list's criteria.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {/* </CHANGE> */}

              {/* Breadcrumb */}

              <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 px-3 py-2 bg-gray-50/30 rounded border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Total Customers</span>
                  <span className="text-sm font-normal text-gray-900">{filteredData.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Total Opportunities</span>
                  <span className="text-sm font-normal text-gray-900">{totalOpportunities}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Total Value</span>
                  <span className="text-sm font-normal text-gray-900">{formatCurrency(totalValue)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Weighted Value</span>
                  <span className="text-sm font-normal text-gray-900">{formatCurrency(weightedValue)}</span>
                </div>
              </div>

              {selectedCustomers.size > 0 && (
                <div className="bg-[#F5F5FF] border rounded-lg p-4 flex items-center justify-between border-[#D8D8FF]">
                  <div className="flex items-center gap-4">
                    <span className="text-[#4A4A8A] font-normal text-sm">
                      {selectedCustomers.size} customers selected
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowOKRModal(true)}
                        className="text-[#4A4A8A] hover:bg-[#BFC6F5] bg-[rgba(225,228,251,1)] border-0 rounded-lg"
                      >
                        <TargetIcon className="h-4 w-4 mr-2" />+ Assign key metric
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddToListDialog(true)}
                        className="text-[#4A4A8A] hover:bg-[#BFC6F5] bg-[rgba(225,228,251,1)] border-0 rounded-lg"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add to list
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomers(new Set())}
                    className="text-[#4A4A8A] hover:text-[#6A6ABF]"
                  >
                    <XIcon className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              )}

              <Card>
                <CardContent className="p-0">
                  <CustomerTable
                    customers={filteredData.map(customerRecordToMasterCustomer)}
                  />
                </CardContent>
              </Card>

              {selectedOKR && (
                <Dialog open={!!selectedOKR} onOpenChange={() => setSelectedOKR(null)}>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {getOKRIcon(selectedOKR.okr)}
                        {selectedOKR.okr.name} - {selectedOKR.customer.name}
                      </DialogTitle>
                      <DialogDescription>
                        {selectedOKR.okr.type} {selectedOKR.okr.level && `• Level ${selectedOKR.okr.level}`} •{" "}
                        {selectedOKR.okr.target ? "Target & Realized" : "Realized Only"}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* Removed milestones table with realized/target metrics */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Details</h4>
                        <div className="space-y-2">
                          <p>
                            <strong>Customer:</strong> {selectedOKR.customer.customer}
                          </p>
                          <p>
                            <strong>Industry:</strong> {selectedOKR.customer.industry}
                          </p>
                          <p>
                            <strong>Region:</strong> {selectedOKR.customer.region}
                          </p>
                          {/* Display Owner in the dialog */}
                          <p>
                            <strong>Owner:</strong> {selectedOKR.customer.owner || "Unassigned"}
                          </p>
                        </div>
                      </div>
                      {/* Removed Key Metrics section from dialog */}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Dialogs */}
              <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New View</DialogTitle>
                    <DialogDescription>
                      Save your current filter and column settings as a reusable view.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="view-name" className="text-sm font-medium">
                        View Name
                      </Label>
                      <Input
                        id="view-name"
                        value={newViewName}
                        onChange={(e) => setNewViewName(e.target.value)}
                        placeholder="Enter view name..."
                        className="mt-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveCurrentView()
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                        Cancel
                      </Button>
                      {/* Fix: Declare saveCurrentView or ensure it's available in scope */}
                      <Button onClick={saveCurrentView} disabled={!newViewName.trim()}>
                        Save View
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Dynamic List</DialogTitle>
                    <DialogDescription>
                      Save your current filters as a dynamic list that automatically updates based on the criteria.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="list-name" className="text-sm font-medium">
                        List Name
                      </Label>
                      <Input
                        id="list-name"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Enter list name..."
                        className="mt-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveAsDynamicList()
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowListDialog(false)}>
                        Cancel
                      </Button>
                      {/* Fix: Declare saveAsDynamicList or ensure it's available in scope */}
                      <Button onClick={saveAsDynamicList} disabled={!newListName.trim()}>
                        Save List
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showAddToListDialog} onOpenChange={setShowAddToListDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add {selectedCustomers.size} customers to list</DialogTitle>
                    <DialogDescription>
                      Add the selected customers to an existing static list or create a new one.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Choose an option</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="create-new"
                            name="list-option"
                            checked={listCreationMode === "create"}
                            onChange={() => {
                              setListCreationMode("create")
                              setSelectedExistingList(null)
                              setNewListName("")
                            }}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="create-new" className="text-base font-medium">
                            Create new list
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="add-existing"
                            name="list-option"
                            checked={listCreationMode === "existing"}
                            onChange={() => {
                              setListCreationMode("existing")
                              setNewListName("")
                              setSelectedExistingList("")
                            }}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="add-existing" className="text-base font-medium">
                            Add to existing list
                          </Label>
                        </div>
                      </div>
                    </div>

                    {listCreationMode === "create" && (
                      <div>
                        <Label htmlFor="new-list-name-add" className="text-base font-semibold mb-2 block">
                          New list name
                        </Label>
                        <Input
                          id="new-list-name-add"
                          placeholder="Enter list name"
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                          className="text-base"
                        />
                      </div>
                    )}

                    {listCreationMode === "existing" && (
                      <div>
                        <Label className="text-base font-semibold mb-2 block">Select existing list</Label>
                        <Select
                          value={selectedExistingList || ""}
                          onValueChange={(value) => setSelectedExistingList(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a list" />
                          </SelectTrigger>
                          <SelectContent>
                            {savedLists
                              .filter((list) => list.type === "static")
                              .map((list) => (
                                <SelectItem key={list.id} value={list.id}>
                                  {list.name} ({list.customerCount} customers)
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-3 text-lg font-semibold">Column Configuration</h4>

                        <div className="ml-6">
                          <div className="space-y-2 pl-4 border-l-2 border-muted">
                            <div>
                              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Customer Fields</h4>
                              <div className="space-y-2">
                                {[
                                  "customer",
                                  "owner", // Added owner field
                                  "team",
                                  "industry",
                                  "region",
                                  "customerType",
                                  // Removed policyValue
                                  "customerSince",
                                  "contractDate",
                                ].map((key) => (
                                  <div key={key} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`column-${key}-add`}
                                      checked={newListColumnVisibility[key] ?? true} // Default to true if undefined
                                      onCheckedChange={(checked) => {
                                        setNewListColumnVisibility((prev) => ({
                                          ...prev,
                                          [key]: !!checked,
                                        }))
                                      }}
                                    />
                                    <Label htmlFor={`column-${key}-add`} className="text-sm">
                                      {getColumnDisplayName(key)}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Removed Key Metrics section from dialog */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddToListDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddToList}
                      disabled={
                        (listCreationMode === "create" && !newListName.trim()) ||
                        (listCreationMode === "existing" && !selectedExistingList)
                      }
                    >
                      Add to list
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showSaveSmartListDialog} onOpenChange={setShowSaveSmartListDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Save Smart List</DialogTitle>
                    <DialogDescription>
                      Choose how you want to save this smart list and give it a name.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="smart-list-name" className="text-sm font-medium">
                        List Name
                      </Label>
                      <Input
                        id="smart-list-name"
                        value={smartListName}
                        onChange={(e) => setSmartListName(e.target.value)}
                        placeholder="Enter list name..."
                        className="mt-1"
                      />
                    </div>

                    {openedSmartList &&
                      (() => {
                        const listType = getListType(openedSmartList)
                        const creditCost = getCreditCost(listType)
                        const isUnlocked = isTemplateUnlocked(openedSmartList.id)
                        if (creditCost > 0 && !isUnlocked) {
                          const newBalance = creditBalance - creditCost
                          return (
                            <div
                              className={`p-3 rounded-lg border ${newBalance < 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}
                            >
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-700">Credit cost:</span>
                                <span className="font-semibold text-gray-900">{creditCost} credits</span>
                              </div>
                              <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-gray-600">New balance:</span>
                                <span className={`font-semibold ${newBalance < 0 ? "text-red-600" : "text-gray-900"}`}>
                                  {newBalance} credits
                                </span>
                              </div>
                              {newBalance < 0 && (
                                <div className="mt-2 pt-2 border-t border-red-200">
                                  <p className="text-xs text-red-700">
                                    You'll be charged for the additional credits in your next billing period.
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        }
                        return null
                      })()}

                    <div className="space-y-3">
                      <label className="text-sm font-medium">List Type</label>

                      <div className="space-y-3">
                        <div
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedListType === "dynamic"
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedListType("dynamic")}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center h-5">
                              <input
                                type="radio"
                                checked={selectedListType === "dynamic"}
                                onChange={() => setSelectedListType("dynamic")}
                                className="h-4 w-4 text-purple-600"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">Smart Dynamic List </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Automatically updates as customers meet or no longer meet the criteria. Always shows
                                current matches based on real-time data.
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedListType === "static"
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedListType("static")}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center h-5">
                              <input
                                type="radio"
                                checked={selectedListType === "static"}
                                onChange={() => setSelectedListType("static")}
                                className="h-4 w-4 text-purple-600"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">Static List</div>
                              <div className="text-xs text-gray-600 mt-1">
                                Saves the current snapshot of customers. The list remains fixed even if customer data
                                changes over time.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSaveSmartListDialog(false)
                          setSmartListName("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleConfirmSaveSmartList} disabled={!smartListName.trim()}>
                        Save List
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showAddToCampaignDialog} onOpenChange={setShowAddToCampaignDialog}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add to Existing Campaign</DialogTitle>
                    <DialogDescription>Select an existing campaign to add your selected contacts to.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="max-h-96 overflow-y-auto">
                      <div className="space-y-2">
                        {existingCampaigns.map((campaign) => (
                          <div
                            key={campaign.id}
                            className={cn(
                              "p-4 border rounded-lg cursor-pointer transition-colors",
                              selectedExistingCampaign === campaign.id
                                ? "border-purple-500 bg-purple-50"
                                : "border-gray-200 hover:border-gray-300",
                            )}
                            onClick={() => setSelectedExistingCampaign(campaign.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="radio"
                                  checked={selectedExistingCampaign === campaign.id}
                                  onChange={() => setSelectedExistingCampaign(campaign.id)}
                                  className="w-4 h-4 text-purple-600"
                                />
                                <div>
                                  <h4 className="font-medium">{campaign.name}</h4>
                                  <p className="text-sm text-gray-500">
                                    {campaign.contacts} contacts • Created {campaign.created}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className={cn(
                                    "px-2 py-1 text-xs rounded-full",
                                    campaign.status === "Active"
                                      ? "bg-green-100 text-green-800"
                                      : campaign.status === "Draft"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800",
                                  )}
                                >
                                  {campaign.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddToCampaignDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSelectExistingCampaign}
                      disabled={!selectedExistingCampaign}
                      style={{ backgroundColor: "#546be8" }}
                    >
                      Add to Campaign
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showCampaignTemplateDialog} onOpenChange={setShowCampaignTemplateDialog}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Choose Campaign Template</DialogTitle>
                    <DialogDescription>
                      Select a template to create your campaign from. Templates include pre-configured settings and
                      content.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="max-h-96 overflow-y-auto">
                      <div className="space-y-2">
                        {campaignTemplates.map((template) => (
                          <div
                            key={template.id}
                            className={cn(
                              "p-4 border rounded-lg cursor-pointer transition-colors",
                              selectedCampaignTemplate?.id === template.id // Use ?.id for comparison
                                ? "border-purple-500 bg-purple-50"
                                : "border-gray-200 hover:border-gray-300",
                            )}
                            onClick={() => handleCampaignTemplateSelect(template)} // Pass the template object
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                checked={selectedCampaignTemplate?.id === template.id} // Use ?.id for comparison
                                onChange={() => handleCampaignTemplateSelect(template)} // Pass the template object
                                className="w-4 h-4 text-purple-600"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">{template.name}</h4>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCampaignTemplateDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleCampaignTemplateSelect(selectedCampaignTemplate)} // Call the handler with the selected template
                      disabled={!selectedCampaignTemplate}
                      style={{ backgroundColor: "#546be8" }}
                    >
                      Use Template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showAIGenerationDialog} onOpenChange={setShowAIGenerationDialog}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Generate Smart List with AI
                    </DialogTitle>
                    <DialogDescription>
                      Describe the type of customers you want to target, and AI will create a smart list with
                      appropriate filters.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ai-prompt-modal" className="text-sm font-medium mb-2 block">
                        Describe your target customers
                      </Label>
                      <Textarea
                        id="ai-prompt-modal"
                        placeholder="e.g., 'High-value enterprise customers with over 500 employees who haven't been contacted in the last 3 months' or 'Small businesses in tech industry with active policies'"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">AI can help you target customers based on:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                        <div>• Company size & industry</div>
                        <div>• Policy status & types</div>
                        <div>• Last contact date</div>
                        <div>• Premium amounts</div>
                        <div>• Geographic location</div>
                        <div>• Risk profiles</div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowAIGenerationDialog(false)}
                      disabled={isGeneratingList}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleGenerateSmartList}
                      disabled={!aiPrompt.trim() || isGeneratingList}
                      style={{ backgroundColor: "#546be8" }}
                    >
                      {isGeneratingList ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate List
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <VoucherUnlockDialog
                open={showVoucherDialog}
                onOpenChange={setShowVoucherDialog}
                templateName={selectedLockedTemplate?.name || ""}
                templateBrand={selectedLockedTemplate?.brandedBy || ""}
                templateLogoUrl={selectedLockedTemplate?.logoUrl}
                templateDescription={selectedLockedTemplate?.description}
                onVoucherApply={handleVoucherApply}
              />

              <CreditConfirmationDialog
                open={showCreditDialog}
                onOpenChange={setShowCreditDialog}
                template={{
                  name: selectedCreditTemplate?.name || "",
                  description: selectedCreditTemplate?.description || "",
                  icon: selectedCreditTemplate?.icon,
                  logoUrl: selectedCreditTemplate?.logoUrl,
                }}
                creditCost={getCreditCost(
                  selectedCreditTemplate?.badge || "",
                  selectedCreditTemplate?.isMarketRadar || false,
                  selectedCreditTemplate?.isBranded, // Pass isBranded here
                )}
                currentBalance={creditBalance}
                onConfirm={handleCreditConfirm}
              />
            </>
          )}

          {selectedOKR && (
            <Dialog open={!!selectedOKR} onOpenChange={() => setSelectedOKR(null)}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {getOKRIcon(selectedOKR.okr)}
                    {selectedOKR.okr.name} - {selectedOKR.customer.name}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedOKR.okr.type} {selectedOKR.okr.level && `• Level ${selectedOKR.okr.level}`} •{" "}
                    {selectedOKR.okr.target ? "Target & Realized" : "Realized Only"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Removed milestones table with realized/target metrics */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Details</h4>
                    <div className="space-y-2">
                      <p>
                        <strong>Customer:</strong> {selectedOKR.customer.customer}
                      </p>
                      <p>
                        <strong>Industry:</strong> {selectedOKR.customer.industry}
                      </p>
                      <p>
                        <strong>Region:</strong> {selectedOKR.customer.region}
                      </p>
                      {/* Display Owner in the dialog */}
                      <p>
                        <strong>Owner:</strong> {selectedOKR.customer.owner || "Unassigned"}
                      </p>
                    </div>
                  </div>
                  {/* Removed Key Metrics section from dialog */}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
