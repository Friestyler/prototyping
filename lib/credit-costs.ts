// Credit cost constants for different list types

export const CREDIT_COSTS = {
  QOLLABI_TEMPLATE: 10, // Static or dynamic Qollabi templates
  MARKET_RADAR: 10, // Market Radar lists
  BRANDED: 0, // Branded/offered lists (voucher-based)
} as const

export type CreditCostType = keyof typeof CREDIT_COSTS

export function getCreditCost(badge: string | null | undefined, isMarketRadar: boolean, isBranded?: boolean): number {
  // Branded/offered lists use vouchers, not credits
  if (isBranded || badge === "Offered" || badge === "Branded") {
    return CREDIT_COSTS.BRANDED
  }

  // Market Radar lists cost credits
  if (isMarketRadar) {
    return CREDIT_COSTS.MARKET_RADAR
  }

  // All other Qollabi templates cost credits (unless branded)
  return CREDIT_COSTS.QOLLABI_TEMPLATE
}

export function getListType(list: { isBranded?: boolean; isMarketRadar?: boolean }):
  | "qollabi"
  | "market-radar"
  | "branded" {
  if (list.isBranded) return "branded"
  if (list.isMarketRadar) return "market-radar"
  return "qollabi"
}
