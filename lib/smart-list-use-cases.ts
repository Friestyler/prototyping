import { MASTER_CUSTOMERS, SMART_LIST_MEMBERSHIP, type MasterCustomer, type CustomerType } from "@/lib/customer-database"

export type { CustomerType }
export type SmartListCustomer = MasterCustomer

export type SmartListType = "prevents_churn" | "drives_growth"

export type SmartListIcon = "clock" | "car" | "heart" | "trending-up" | "brain"

interface SmartListUseCaseMeta {
  id: string
  rank: string
  title: string
  icon: SmartListIcon
  iconBg: string
  iconColor: string
  description: string
  type: SmartListType
  matchPct: number
  rule: string
  comingSoon?: boolean
  sourceUseCase: string
  overrideClientCount?: number
  /** Optional fixed fallback when customer premiums aren't available (e.g. ML list with no resolved rows). */
  atRiskOverride?: number
}

export interface SmartListUseCase extends SmartListUseCaseMeta {
  clientCount: number
  customers: SmartListCustomer[]
  customerIds: string[]
  /** Sum of `annualPremium` across resolved customers. Only computed for churn lists. */
  atRiskEuros?: number
}

const USE_CASE_META: SmartListUseCaseMeta[] = [
  {
    id: "payment-reminders",
    rank: "#1",
    title: "Payment Reminders",
    icon: "clock",
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
    description:
      "Clients with failed or upcoming direct debit payments at risk of policy lapse. Contact within 48 hours to prevent administrative churn.",
    type: "prevents_churn",
    matchPct: 98,
    rule: "Rule-based",
    sourceUseCase: "Direct debit failure (domiciliëring) — Use case #1",
  },
  {
    id: "first-car-teen-drivers",
    rank: "#4",
    title: "First Car — Teen Drivers",
    icon: "car",
    iconBg: "#EEF2FF",
    iconColor: "#4F46E5",
    description:
      "Households with a child turning 17 this year and no youth auto policy in the portfolio. Contact 6 months ahead to capture the first-car conversation before comparison sites do.",
    type: "drives_growth",
    matchPct: 87,
    rule: "Rule-based",
    sourceUseCase: "Child reaching driving age — Use case #4",
  },
  {
    id: "no-life-insurance",
    rank: "#7",
    title: "No Life Insurance — Households with Children",
    icon: "heart",
    iconBg: "#FCE7F3",
    iconColor: "#DB2777",
    description:
      "Households with dependent children and zero life or overlijdensverzekering coverage. The most widespread coverage gap in Belgian broker portfolios — 34% of families with dependents hold no life insurance.",
    type: "drives_growth",
    matchPct: 92,
    rule: "Rule-based",
    sourceUseCase: "Dependents present, no life insurance — Use case #7",
  },
  {
    id: "price-increase-no-contact",
    rank: "#3",
    title: "Price Increase + No Contact",
    icon: "trending-up",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    description:
      "Clients who saw a premium increase >8% in the last 12 months and had no broker contact since. Under the Oct 2024 termination law, every day is a cancellation day — highest retention urgency.",
    type: "prevents_churn",
    matchPct: 94,
    rule: "Rule-based",
    sourceUseCase: "2024 law: rolling 60-day exit window — Use case #3",
  },
  {
    id: "top-50-churn-ml",
    rank: "ML",
    title: "Top 50 Churn Risk",
    icon: "brain",
    iconBg: "#F3F4F6",
    iconColor: "#6B7280",
    description:
      "Machine-learning model ranking your 50 highest churn-risk clients across all signals — tenure, inactivity, single-product exposure, renewal concentration and claims pressure.",
    type: "prevents_churn",
    matchPct: 0,
    rule: "AI-based",
    comingSoon: true,
    sourceUseCase: "ML churn model (blended signals)",
    overrideClientCount: 50,
  },
]

const byId = new Map(MASTER_CUSTOMERS.map((c) => [c.id, c]))

export const SMART_LIST_USE_CASES: SmartListUseCase[] = USE_CASE_META.map((meta) => {
  const ids = SMART_LIST_MEMBERSHIP[meta.id] ?? []
  const customers = ids.map((id) => byId.get(id)!).filter(Boolean)
  const premiumSum = customers.reduce((acc, c) => acc + (c.annualPremium ?? 0), 0)
  const atRiskEuros =
    meta.type === "prevents_churn"
      ? premiumSum > 0
        ? premiumSum
        : meta.atRiskOverride
      : undefined
  return {
    ...meta,
    clientCount: meta.overrideClientCount ?? customers.length,
    customers,
    customerIds: ids,
    atRiskEuros,
  }
})

export function findSmartListUseCase(id: string): SmartListUseCase | undefined {
  return SMART_LIST_USE_CASES.find((u) => u.id === id)
}
