import { ALL_MASTER_CUSTOMERS, type MasterCustomer, type CustomerType } from "@/lib/customer-database"

export interface CustomerFilter {
  query?: string
  customerType?: CustomerType
  productsAny?: string[]
  productsAll?: string[]
  productsNone?: string[]
  minPremium?: number
  maxPremium?: number
  bornAfter?: string
  bornBefore?: string
  limit?: number
}

const lc = (s: string) => s.toLowerCase()

export function filterCustomers(filter: CustomerFilter): MasterCustomer[] {
  const q = filter.query?.toLowerCase().trim()
  const any = filter.productsAny?.map(lc)
  const all = filter.productsAll?.map(lc)
  const none = filter.productsNone?.map(lc)

  const matches = ALL_MASTER_CUSTOMERS.filter((c) => {
    if (filter.customerType && c.customerType !== filter.customerType) return false
    const lcProducts = c.products.map(lc)
    if (any && !any.some((p) => lcProducts.includes(p))) return false
    if (all && !all.every((p) => lcProducts.includes(p))) return false
    if (none && none.some((p) => lcProducts.includes(p))) return false
    if (filter.minPremium != null && c.annualPremium < filter.minPremium) return false
    if (filter.maxPremium != null && c.annualPremium > filter.maxPremium) return false
    if (filter.bornAfter && (!c.dateOfBirth || c.dateOfBirth < filter.bornAfter)) return false
    if (filter.bornBefore && (!c.dateOfBirth || c.dateOfBirth > filter.bornBefore)) return false
    if (q) {
      const hay = [c.firstName, c.lastName, c.address, c.dossierNumber, c.email ?? ""]
        .join(" ")
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  if (filter.limit && filter.limit > 0) return matches.slice(0, filter.limit)
  return matches
}

export function customerToWire(c: MasterCustomer) {
  return {
    customerId: c.dossierNumber,
    recordId: String(c.recordId),
    customerType: c.customerType,
    firstName: c.firstName,
    lastName: c.lastName,
    dateOfBirth: c.dateOfBirth || null,
    address: c.address,
    products: c.products,
    annualPremium: c.annualPremium,
    email: c.email ?? null,
  }
}
