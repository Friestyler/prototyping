/**
 * Pre-computed portfolio facts the AI uses to answer broker questions
 * without doing client-side aggregation. Cheap to compute, kept in sync
 * with the in-memory customer pool.
 */

import { ALL_MASTER_CUSTOMERS } from "@/lib/customer-database"

export interface PortfolioFacts {
  totalCustomers: number
  byCustomerType: Record<string, number>
  byProduct: Record<string, { count: number; premium: number }>
  byProductCount: Record<string, number>
  premium: {
    total: number
    avg: number
    median: number
    min: number
    max: number
  }
  ageBuckets: Record<string, number>
  topCitiesByCount: Array<{ city: string; count: number }>
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function ageOn(dob: string, asOf: Date): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  let age = asOf.getFullYear() - d.getFullYear()
  const m = asOf.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && asOf.getDate() < d.getDate())) age--
  return age
}

function cityFromAddress(addr: string): string {
  const m = addr.match(/(\d{4,5})\s+(.+?)$/)
  if (m) return m[2].trim()
  const last = addr.split(",").pop()?.trim() ?? ""
  return last.replace(/^\d+\s+/, "")
}

export function computePortfolioFacts(asOf = new Date()): PortfolioFacts {
  const byCustomerType: Record<string, number> = {}
  const byProduct: Record<string, { count: number; premium: number }> = {}
  const byProductCount: Record<string, number> = {}
  const premiums: number[] = []
  const ageBuckets: Record<string, number> = {
    "<25": 0,
    "25-34": 0,
    "35-44": 0,
    "45-54": 0,
    "55-64": 0,
    "65+": 0,
    unknown: 0,
  }
  const cityCounts: Record<string, number> = {}

  for (const c of ALL_MASTER_CUSTOMERS) {
    byCustomerType[c.customerType] = (byCustomerType[c.customerType] ?? 0) + 1
    premiums.push(c.annualPremium)
    const perCustomerPremium = c.annualPremium / Math.max(1, c.products.length)
    for (const p of c.products) {
      const slot = byProduct[p] ?? (byProduct[p] = { count: 0, premium: 0 })
      slot.count++
      slot.premium += perCustomerPremium
    }
    const pc = String(c.products.length)
    byProductCount[pc] = (byProductCount[pc] ?? 0) + 1

    const age = ageOn(c.dateOfBirth, asOf)
    if (age == null) ageBuckets.unknown++
    else if (age < 25) ageBuckets["<25"]++
    else if (age < 35) ageBuckets["25-34"]++
    else if (age < 45) ageBuckets["35-44"]++
    else if (age < 55) ageBuckets["45-54"]++
    else if (age < 65) ageBuckets["55-64"]++
    else ageBuckets["65+"]++

    const city = cityFromAddress(c.address)
    if (city) cityCounts[city] = (cityCounts[city] ?? 0) + 1
  }

  const total = premiums.reduce((a, b) => a + b, 0)
  const topCitiesByCount = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([city, count]) => ({ city, count }))

  return {
    totalCustomers: ALL_MASTER_CUSTOMERS.length,
    byCustomerType,
    byProduct: Object.fromEntries(
      Object.entries(byProduct).map(([k, v]) => [
        k,
        { count: v.count, premium: Math.round(v.premium) },
      ]),
    ),
    byProductCount,
    premium: {
      total: Math.round(total),
      avg: Math.round(total / Math.max(1, premiums.length)),
      median: Math.round(median(premiums)),
      min: Math.round(Math.min(...premiums)),
      max: Math.round(Math.max(...premiums)),
    },
    ageBuckets,
    topCitiesByCount,
  }
}
