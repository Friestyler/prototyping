/**
 * Single source of truth for the customers used across the app.
 *
 * - The My Portfolio → Priority Recommendations smart-list cards read from
 *   `MASTER_CUSTOMERS` via `SMART_LIST_MEMBERSHIP`.
 * - The Customers page (`lists-2-view.tsx`) displays these same records — the
 *   existing customer pool is extended with `MASTER_CUSTOMERS_AS_RECORDS` so
 *   that when a saved list is opened it filters the customer pool by the same
 *   IDs that were set on the saved list.
 *
 * Adding a customer to a smart list in one place surfaces them in the other.
 *
 * Note: the type `Partner` from `lib/okr-data.ts` is a legacy name for the
 * rich customer record shape consumed by the Customers page; it has nothing
 * to do with "partner" as a business concept — it is the customer record.
 */

import { initialPartners, type Partner as CustomerRecord, type ProductInstance, type OKRItem, type PartnerTeamMember } from "@/lib/okr-data"

export type CustomerType = "Natural person" | "Legal entity"

export interface MasterCustomer {
  id: string
  /** Numeric customer-record id used by the Customers page table. */
  recordId: number
  firstName: string
  lastName: string
  dateOfBirth: string
  address: string
  customerType: CustomerType
  dossierNumber: string
  products: string[]
  annualPremium: number
  email?: string

  // Optional legacy-carrier fields so records transformed from the original
  // `initialPartners` array preserve the rich data that existing smart-list
  // suggestion filters (policy expiry, coverage-related, two-product upsell,
  // cross-sell multi-product) rely on. Left untouched for the 62 hand-written
  // master records.
  legacyIdVnemer?: number
  legacyTeam?: PartnerTeamMember[]
  legacyTeamSize?: CustomerRecord["teamSize"]
  legacyOwner?: string
  legacyProductInstances?: ProductInstance[]
  legacyExpiringProduct?: string
  legacyContractEndDate?: string
  legacyDesiredProducts?: string
  legacyExtraOkrs?: Record<string, OKRItem>
}

export const MASTER_CUSTOMERS: MasterCustomer[] = [
  // Payment reminders (#1 — Direct debit failure)
  { id: "anon-101", recordId: 101, firstName: "Customer",     lastName: "101",      dateOfBirth: "1978-03-14", address: "Rue du Commerce 15, 1000 Brussels",      customerType: "Natural person", dossierNumber: "D-10234", products: ["Auto", "Home"],            annualPremium: 2340, email: "customer-101@example.com" },
  { id: "anon-102", recordId: 102, firstName: "Customer",  lastName: "102",        dateOfBirth: "1985-09-22", address: "Avenue Louise 212, 1050 Brussels",       customerType: "Natural person", dossierNumber: "D-10421", products: ["Auto"],                    annualPremium: 890,  email: "customer-102@example.com" },
  { id: "anon-103", recordId: 103, firstName: "Customer",      lastName: "103",     dateOfBirth: "1972-11-02", address: "Antwerpsesteenweg 44, 2640 Mortsel",     customerType: "Natural person", dossierNumber: "D-10588", products: ["Home", "Life"],            annualPremium: 3120, email: "customer-103@example.com" },
  { id: "anon-104", recordId: 104, firstName: "Customer",     lastName: "104",       dateOfBirth: "1990-05-17", address: "Koning Albertlaan 8, 9000 Ghent",        customerType: "Natural person", dossierNumber: "D-10612", products: ["Auto"],                    annualPremium: 1240, email: "customer-104@example.com" },
  { id: "anon-105", recordId: 105, firstName: "Customer",    lastName: "105",       dateOfBirth: "1982-07-29", address: "Chaussée de Wavre 101, 1160 Auderghem",  customerType: "Natural person", dossierNumber: "D-10734", products: ["Home"],                    annualPremium: 1680, email: "customer-105@example.com" },
  { id: "anon-106", recordId: 106, firstName: "Customer",  lastName: "106",          dateOfBirth: "1975-01-11", address: "Meir 48, 2000 Antwerp",                  customerType: "Natural person", dossierNumber: "D-10801", products: ["Auto", "Home"],            annualPremium: 2450, email: "customer-106@example.com" },
  { id: "anon-107", recordId: 107, firstName: "Customer",   lastName: "107",         dateOfBirth: "1988-12-03", address: "Grote Markt 12, 3000 Leuven",            customerType: "Natural person", dossierNumber: "D-10855", products: ["Auto"],                    annualPremium: 950,  email: "customer-107@example.com" },
  { id: "anon-108", recordId: 108, firstName: "Customer",  lastName: "108",     dateOfBirth: "1969-08-19", address: "Rue Royale 77, 1000 Brussels",           customerType: "Natural person", dossierNumber: "D-10912", products: ["Auto", "Life"],            annualPremium: 2780, email: "customer-108@example.com" },
  { id: "anon-109", recordId: 109, firstName: "Customer",    lastName: "109",       dateOfBirth: "1981-04-25", address: "Stationsplein 3, 8000 Bruges",           customerType: "Natural person", dossierNumber: "D-11007", products: ["Home"],                    annualPremium: 1420, email: "customer-109@example.com" },
  { id: "anon-110", recordId: 110, firstName: "Customer",     lastName: "110",       dateOfBirth: "1993-06-08", address: "Lange Gasthuisstraat 24, 2000 Antwerp",  customerType: "Natural person", dossierNumber: "D-11145", products: ["Auto"],                    annualPremium: 1190, email: "customer-110@example.com" },
  { id: "anon-111", recordId: 111, firstName: "Customer",   lastName: "111",     dateOfBirth: "1965-02-16", address: "Avenue de Tervueren 155, 1150 Brussels", customerType: "Natural person", dossierNumber: "D-11203", products: ["Auto", "Home", "Life"],    annualPremium: 3450, email: "customer-111@example.com" },
  { id: "anon-112", recordId: 112, firstName: "Customer",     lastName: "112",         dateOfBirth: "1987-10-30", address: "Bondgenotenlaan 62, 3000 Leuven",        customerType: "Natural person", dossierNumber: "D-11290", products: ["Auto"],                    annualPremium: 1090, email: "customer-112@example.com" },

  // First Car — Teen Drivers (#4 — Child reaching driving age)
  { id: "anon-113", recordId: 113, firstName: "Customer",     lastName: "113",        dateOfBirth: "1976-04-11", address: "Kerkstraat 14, 2800 Mechelen",           customerType: "Natural person", dossierNumber: "D-20113", products: ["Auto", "Home", "Life"],            annualPremium: 3210, email: "customer-113@example.com" },
  { id: "anon-114", recordId: 114, firstName: "Customer",  lastName: "114",       dateOfBirth: "1974-09-03", address: "Leopoldlaan 55, 9000 Ghent",             customerType: "Natural person", dossierNumber: "D-20188", products: ["Auto", "Home"],                    annualPremium: 2480, email: "customer-114@example.com" },
  { id: "anon-115", recordId: 115, firstName: "Customer",      lastName: "115",     dateOfBirth: "1971-12-28", address: "Turnhoutsebaan 201, 2100 Deurne",        customerType: "Natural person", dossierNumber: "D-20241", products: ["Auto", "Home", "Hospitalisatie"],  annualPremium: 3890, email: "customer-115@example.com" },
  { id: "anon-116", recordId: 116, firstName: "Customer",    lastName: "116",         dateOfBirth: "1977-05-19", address: "Rue de la Loi 88, 1040 Brussels",        customerType: "Natural person", dossierNumber: "D-20317", products: ["Auto", "Home"],                    annualPremium: 2290, email: "customer-116@example.com" },
  { id: "anon-117", recordId: 117, firstName: "Customer",    lastName: "117",          dateOfBirth: "1973-02-06", address: "Markt 9, 3500 Hasselt",                  customerType: "Natural person", dossierNumber: "D-20382", products: ["Auto", "Home", "Life"],            annualPremium: 3470, email: "customer-117@example.com" },
  { id: "anon-118", recordId: 118, firstName: "Customer", lastName: "118",       dateOfBirth: "1975-08-23", address: "Rue Neuve 32, 7000 Mons",                customerType: "Natural person", dossierNumber: "D-20446", products: ["Auto", "Home"],                    annualPremium: 2610, email: "customer-118@example.com" },
  { id: "anon-119", recordId: 119, firstName: "Customer",      lastName: "119",       dateOfBirth: "1970-06-14", address: "Sint-Pietersplein 18, 9000 Ghent",       customerType: "Natural person", dossierNumber: "D-20515", products: ["Auto", "Home", "Hospitalisatie", "Life"], annualPremium: 4280, email: "customer-119@example.com" },
  { id: "anon-120", recordId: 120, firstName: "Customer",  lastName: "120",        dateOfBirth: "1979-11-01", address: "Avenue Molière 70, 1190 Forest",         customerType: "Natural person", dossierNumber: "D-20583", products: ["Auto", "Home"],                    annualPremium: 2150, email: "customer-120@example.com" },
  { id: "anon-121", recordId: 121, firstName: "Customer",   lastName: "121",       dateOfBirth: "1972-07-09", address: "Place Verte 4, 7500 Tournai",            customerType: "Natural person", dossierNumber: "D-20649", products: ["Auto", "Home", "Life"],            annualPremium: 3590, email: "customer-121@example.com" },
  { id: "anon-122", recordId: 122, firstName: "Customer",    lastName: "122",       dateOfBirth: "1978-03-27", address: "Gasthuisberg 11, 3000 Leuven",           customerType: "Natural person", dossierNumber: "D-20702", products: ["Auto", "Home", "Hospitalisatie"],  annualPremium: 3120, email: "customer-122@example.com" },

  // No Life Insurance (#7 — Dependents present, no life insurance)
  { id: "anon-123", recordId: 123, firstName: "Customer",   lastName: "123",         dateOfBirth: "1984-01-22", address: "Rue du Marché 7, 1348 Louvain-la-Neuve",  customerType: "Natural person", dossierNumber: "D-30102", products: ["Auto", "Home"],                      annualPremium: 2140, email: "customer-123@example.com" },
  { id: "anon-124", recordId: 124, firstName: "Customer",       lastName: "124", dateOfBirth: "1980-05-11", address: "Oudaan 12, 2000 Antwerp",                 customerType: "Natural person", dossierNumber: "D-30148", products: ["Auto", "Home", "Hospitalisatie"],    annualPremium: 2890, email: "customer-124@example.com" },
  { id: "anon-125", recordId: 125, firstName: "Customer",       lastName: "125",   dateOfBirth: "1989-03-08", address: "Sint-Baafsplein 2, 9000 Ghent",           customerType: "Natural person", dossierNumber: "D-30205", products: ["Auto"],                              annualPremium: 1180, email: "customer-125@example.com" },
  { id: "anon-126", recordId: 126, firstName: "Customer",     lastName: "126",      dateOfBirth: "1977-10-15", address: "Kouterstraat 20, 8800 Roeselare",         customerType: "Natural person", dossierNumber: "D-30262", products: ["Home"],                              annualPremium: 1490, email: "customer-126@example.com" },
  { id: "anon-127", recordId: 127, firstName: "Customer",      lastName: "127",       dateOfBirth: "1982-07-04", address: "Veldstraat 99, 9000 Ghent",               customerType: "Natural person", dossierNumber: "D-30318", products: ["Auto", "Home"],                      annualPremium: 2210, email: "customer-127@example.com" },
  { id: "anon-128", recordId: 128, firstName: "Customer",      lastName: "128",        dateOfBirth: "1975-12-19", address: "Rue des Tanneurs 48, 1000 Brussels",      customerType: "Natural person", dossierNumber: "D-30371", products: ["Auto", "Home", "BA Familiale"],      annualPremium: 2680, email: "customer-128@example.com" },
  { id: "anon-129", recordId: 129, firstName: "Customer",      lastName: "129",       dateOfBirth: "1986-06-30", address: "Boulevard Tirou 12, 6000 Charleroi",      customerType: "Natural person", dossierNumber: "D-30428", products: ["Home"],                              annualPremium: 1340, email: "customer-129@example.com" },
  { id: "anon-130", recordId: 130, firstName: "Customer",      lastName: "130",         dateOfBirth: "1974-02-24", address: "Herckenrodesingel 33, 3500 Hasselt",      customerType: "Natural person", dossierNumber: "D-30491", products: ["Auto", "Home"],                      annualPremium: 2310, email: "customer-130@example.com" },
  { id: "anon-131", recordId: 131, firstName: "Customer",       lastName: "131",      dateOfBirth: "1983-09-17", address: "Brusselsestraat 5, 3000 Leuven",          customerType: "Natural person", dossierNumber: "D-30554", products: ["Auto", "Home", "Hospitalisatie"],    annualPremium: 2940, email: "customer-131@example.com" },
  { id: "anon-132", recordId: 132, firstName: "Customer",      lastName: "132",          dateOfBirth: "1990-04-02", address: "Kerkplein 7, 2800 Mechelen",              customerType: "Natural person", dossierNumber: "D-30617", products: ["Auto"],                              annualPremium: 1260, email: "customer-132@example.com" },
  { id: "anon-133", recordId: 133, firstName: "Customer",  lastName: "133",          dateOfBirth: "1981-11-26", address: "Rue de Fer 3, 5000 Namur",                customerType: "Natural person", dossierNumber: "D-30680", products: ["Auto", "Home"],                      annualPremium: 2490, email: "customer-133@example.com" },
  { id: "anon-134", recordId: 134, firstName: "Customer",      lastName: "134",        dateOfBirth: "1976-03-12", address: "Oostendse Baan 88, 8400 Ostend",          customerType: "Natural person", dossierNumber: "D-30742", products: ["Home", "Hospitalisatie"],            annualPremium: 1870, email: "customer-134@example.com" },
  { id: "anon-135", recordId: 135, firstName: "Customer",      lastName: "135",       dateOfBirth: "1987-08-05", address: "Nationalestraat 14, 2000 Antwerp",        customerType: "Natural person", dossierNumber: "D-30809", products: ["Auto", "Home"],                      annualPremium: 2180, email: "customer-135@example.com" },
  { id: "anon-136", recordId: 136, firstName: "Customer",    lastName: "136",         dateOfBirth: "1973-05-28", address: "Place Saint-Lambert 1, 4000 Liège",       customerType: "Natural person", dossierNumber: "D-30872", products: ["Auto", "Home", "BA Familiale"],      annualPremium: 2720, email: "customer-136@example.com" },
  { id: "anon-137", recordId: 137, firstName: "Customer",  lastName: "137",        dateOfBirth: "1991-10-14", address: "Diestsestraat 26, 3000 Leuven",           customerType: "Natural person", dossierNumber: "D-30935", products: ["Auto"],                              annualPremium: 1230, email: "customer-137@example.com" },
  { id: "anon-138", recordId: 138, firstName: "Customer",     lastName: "138",           dateOfBirth: "1985-01-09", address: "Rue Haute 40, 1000 Brussels",             customerType: "Natural person", dossierNumber: "D-30991", products: ["Auto", "Home"],                      annualPremium: 2340, email: "customer-138@example.com" },
  { id: "anon-139", recordId: 139, firstName: "Customer",      lastName: "139",           dateOfBirth: "1980-07-21", address: "Parklaan 15, 2200 Herentals",             customerType: "Natural person", dossierNumber: "D-31045", products: ["Home", "Hospitalisatie"],            annualPremium: 1980, email: "customer-139@example.com" },
  { id: "anon-140", recordId: 140, firstName: "Customer",    lastName: "140",         dateOfBirth: "1978-12-02", address: "Rue du Pont 9, 7100 La Louvière",         customerType: "Natural person", dossierNumber: "D-31102", products: ["Auto", "Home"],                      annualPremium: 2420, email: "customer-140@example.com" },

  // Price Increase + No Contact (#3 — 2024 law: rolling exit window)
  { id: "anon-141", recordId: 141, firstName: "Customer",       lastName: "141",    dateOfBirth: "1971-02-17", address: "Rue de Namur 24, 5000 Namur",             customerType: "Natural person", dossierNumber: "D-40108", products: ["Auto", "Home"],                     annualPremium: 2890, email: "customer-141@example.com" },
  { id: "anon-142", recordId: 142, firstName: "Customer",     lastName: "142",   dateOfBirth: "1979-06-09", address: "Avenue de la Couronne 45, 1050 Brussels", customerType: "Natural person", dossierNumber: "D-40162", products: ["Home"],                             annualPremium: 1720, email: "customer-142@example.com" },
  { id: "anon-143", recordId: 143, firstName: "Customer",     lastName: "143",    dateOfBirth: "1988-11-23", address: "Rue Léopold 15, 7700 Mouscron",           customerType: "Natural person", dossierNumber: "D-40221", products: ["Auto"],                             annualPremium: 1180, email: "customer-143@example.com" },
  { id: "anon-144", recordId: 144, firstName: "Customer",   lastName: "144",    dateOfBirth: "1975-03-04", address: "Rue du Château 18, 6700 Arlon",           customerType: "Natural person", dossierNumber: "D-40277", products: ["Auto", "Home", "Hospitalisatie"],   annualPremium: 3650, email: "customer-144@example.com" },
  { id: "anon-145", recordId: 145, firstName: "Customer",    lastName: "145",   dateOfBirth: "1992-07-30", address: "Chaussée de Louvain 202, 1030 Schaerbeek",customerType: "Natural person", dossierNumber: "D-40334", products: ["Auto"],                             annualPremium: 1090, email: "customer-145@example.com" },
  { id: "anon-146", recordId: 146, firstName: "Customer",    lastName: "146",     dateOfBirth: "1984-10-18", address: "Rue du Parc 11, 1348 Louvain-la-Neuve",   customerType: "Natural person", dossierNumber: "D-40391", products: ["Home", "BA Familiale"],              annualPremium: 1940, email: "customer-146@example.com" },
  { id: "anon-147", recordId: 147, firstName: "Customer",     lastName: "147",    dateOfBirth: "1969-05-12", address: "Rue des Carmes 7, 4000 Liège",            customerType: "Natural person", dossierNumber: "D-40448", products: ["Auto", "Home"],                     annualPremium: 2620, email: "customer-147@example.com" },
  { id: "anon-148", recordId: 148, firstName: "Customer",   lastName: "148",   dateOfBirth: "1983-12-26", address: "Place de la Vieille Halle 3, 1000 Brussels", customerType: "Natural person", dossierNumber: "D-40509", products: ["Auto"],                       annualPremium: 1210, email: "customer-148@example.com" },
  { id: "anon-149", recordId: 149, firstName: "Customer",     lastName: "149",   dateOfBirth: "1974-08-21", address: "Boulevard d'Avroy 99, 4000 Liège",        customerType: "Natural person", dossierNumber: "D-40572", products: ["Auto", "Home", "Life"],             annualPremium: 3480, email: "customer-149@example.com" },
  { id: "anon-150", recordId: 150, firstName: "Customer",     lastName: "150",    dateOfBirth: "1981-04-13", address: "Rue Émile Vandervelde 22, 1090 Jette",    customerType: "Natural person", dossierNumber: "D-40635", products: ["Home"],                             annualPremium: 1580, email: "customer-150@example.com" },
  { id: "anon-151", recordId: 151, firstName: "Customer",     lastName: "151",     dateOfBirth: "1976-01-07", address: "Avenue des Combattants 8, 1332 Genval",   customerType: "Natural person", dossierNumber: "D-40698", products: ["Auto", "Home"],                     annualPremium: 2710, email: "customer-151@example.com" },
  { id: "anon-152", recordId: 152, firstName: "Customer",  lastName: "152",     dateOfBirth: "1993-09-19", address: "Rue de Campine 34, 4000 Liège",           customerType: "Natural person", dossierNumber: "D-40761", products: ["Auto"],                             annualPremium: 1050, email: "customer-152@example.com" },
  { id: "anon-153", recordId: 153, firstName: "Customer",    lastName: "153",  dateOfBirth: "1970-06-25", address: "Rue de l'Église 5, 6600 Bastogne",        customerType: "Natural person", dossierNumber: "D-40824", products: ["Auto", "Home", "Hospitalisatie"],   annualPremium: 3280, email: "customer-153@example.com" },
  { id: "anon-154", recordId: 154, firstName: "Customer",   lastName: "154",   dateOfBirth: "1982-11-03", address: "Rue Saint-Gilles 60, 4000 Liège",         customerType: "Natural person", dossierNumber: "D-40887", products: ["Home"],                             annualPremium: 1690, email: "customer-154@example.com" },
  { id: "anon-155", recordId: 155, firstName: "Customer",     lastName: "155",    dateOfBirth: "1977-02-28", address: "Rue Grétry 14, 4020 Liège",               customerType: "Natural person", dossierNumber: "D-40951", products: ["Auto", "Home"],                     annualPremium: 2540, email: "customer-155@example.com" },
  { id: "anon-156", recordId: 156, firstName: "Customer",     lastName: "156",    dateOfBirth: "1986-05-16", address: "Place Jourdan 26, 1040 Brussels",         customerType: "Natural person", dossierNumber: "D-41018", products: ["Auto"],                             annualPremium: 1170, email: "customer-156@example.com" },
  { id: "anon-157", recordId: 157, firstName: "Customer",    lastName: "157",  dateOfBirth: "1968-10-08", address: "Rue de la Station 33, 7060 Soignies",     customerType: "Natural person", dossierNumber: "D-41074", products: ["Auto", "Home", "Life"],             annualPremium: 3790, email: "customer-157@example.com" },
  { id: "anon-158", recordId: 158, firstName: "Customer",  lastName: "158",    dateOfBirth: "1979-07-22", address: "Chaussée de Charleroi 140, 1060 Brussels",customerType: "Natural person", dossierNumber: "D-41138", products: ["Home", "Hospitalisatie"],           annualPremium: 2080, email: "customer-158@example.com" },
  { id: "anon-159", recordId: 159, firstName: "Customer",   lastName: "159",  dateOfBirth: "1972-12-11", address: "Mechelsesteenweg 120, 2018 Antwerp",      customerType: "Natural person", dossierNumber: "D-41194", products: ["Auto", "Home"],                     annualPremium: 2860, email: "customer-159@example.com" },
  { id: "anon-160", recordId: 160, firstName: "Customer",   lastName: "160",    dateOfBirth: "1990-03-05", address: "Rue de l'Armistice 12, 7000 Mons",        customerType: "Natural person", dossierNumber: "D-41255", products: ["Auto"],                             annualPremium: 1140, email: "customer-160@example.com" },
  { id: "anon-161", recordId: 161, firstName: "Customer", lastName: "161", dateOfBirth: "-",     address: "Boulevard de la Woluwe 58, 1200 Brussels", customerType: "Legal entity",  dossierNumber: "D-41318", products: ["Auto", "Home", "BA Familiale"],     annualPremium: 3010, email: "customer-161@example.com" },
  { id: "anon-162", recordId: 162, firstName: "Customer",    lastName: "162",   dateOfBirth: "1985-09-02", address: "Quai aux Briques 50, 1000 Brussels",      customerType: "Natural person", dossierNumber: "D-41372", products: ["Home"],                             annualPremium: 1630, email: "customer-162@example.com" },
]

export const SMART_LIST_MEMBERSHIP: Record<string, string[]> = {
  "payment-reminders":        MASTER_CUSTOMERS.filter((c) => c.id.startsWith("pr-")).map((c) => c.id),
  "first-car-teen-drivers":   MASTER_CUSTOMERS.filter((c) => c.id.startsWith("fc-")).map((c) => c.id),
  "no-life-insurance":        MASTER_CUSTOMERS.filter((c) => c.id.startsWith("nl-")).map((c) => c.id),
  "price-increase-no-contact":MASTER_CUSTOMERS.filter((c) => c.id.startsWith("pi-")).map((c) => c.id),
  "top-50-churn-ml":          [],
}

export function getCustomersForUseCase(useCaseId: string): MasterCustomer[] {
  const ids = SMART_LIST_MEMBERSHIP[useCaseId] ?? []
  const byId = new Map(MASTER_CUSTOMERS.map((c) => [c.id, c]))
  return ids.map((id) => byId.get(id)!).filter(Boolean)
}

export function findMasterCustomer(id: string): MasterCustomer | undefined {
  return MASTER_CUSTOMERS.find((c) => c.id === id)
}

/**
 * Convert a MasterCustomer into the shape consumed by the Customers page
 * (currently typed as `Partner` in `lib/okr-data.ts` — that is the legacy
 * type name for the customer record).
 */
export function masterCustomerToRecord(c: MasterCustomer): CustomerRecord {
  const displayName = c.lastName ? `${c.firstName} ${c.lastName}`.trim() : c.firstName
  const baseOkrs: Record<string, OKRItem> = {
    "first-name":    { label: "First Name",     value: c.firstName,     status: "active" } as OKRItem,
    "last-name":     { label: "Last Name",      value: c.lastName,      status: "active" } as OKRItem,
    "date-of-birth": { label: "Date of Birth",  value: c.dateOfBirth,   status: "active" } as OKRItem,
    "address":       { label: "Address",        value: c.address,       status: "active" } as OKRItem,
    "customer-type": { label: "Customer Type",  value: c.customerType,  status: "active" } as OKRItem,
    "customer-id":   { label: "Customer ID",    value: c.dossierNumber, status: "active" } as OKRItem,
    "email":         { label: "Email",          value: c.email ?? "",   status: "active" } as OKRItem,
    "annual-premium":{ label: "Annual Premium", value: `€${c.annualPremium.toLocaleString()}`, status: "active" } as OKRItem,
  }

  // Legacy address-line-* OKRs for existing filters that look them up by name.
  if (c.address) {
    const [line1, line2 = ""] = c.address.split(",").map((s) => s.trim())
    baseOkrs["address-line-1"] = { label: "Address Line 1", value: line1, status: "active" } as OKRItem
    if (line2) baseOkrs["address-line-2"] = { label: "Address Line 2", value: line2, status: "active" } as OKRItem
  }

  return {
    id: c.recordId,
    idVnemer: c.legacyIdVnemer ?? c.recordId + 9000,
    name: displayName,
    status: "active",
    code: c.dossierNumber,
    teamSize: c.legacyTeamSize ?? "small",
    team: c.legacyTeam ?? [],
    owner: c.legacyOwner ?? "Portfolio Intelligence",
    currentProducts: c.products,
    productInstances: c.legacyProductInstances,
    expiringProduct: c.legacyExpiringProduct,
    contractEndDate: c.legacyContractEndDate,
    desiredProducts: c.legacyDesiredProducts,
    email: c.email,
    okrs: {
      ...baseOkrs,
      ...(c.legacyExtraOkrs ?? {}),
    },
  } as CustomerRecord
}

/**
 * Convert a legacy Partner record (companies with productInstances, OKR
 * milestones, etc.) into the canonical MasterCustomer shape. The rich
 * fields are kept in `legacy*` slots so they can be restored when the
 * MasterCustomer is rendered back as a Partner for existing smart-list
 * logic in `lists-2-view.tsx`.
 */
function legacyPartnerToMasterCustomer(p: CustomerRecord): MasterCustomer {
  const readOkr = (key: string): string => {
    const v = p.okrs?.[key] as OKRItem | undefined
    return typeof v?.value === "string" ? v.value : ""
  }

  const addr1 = readOkr("address-line-1")
  const addr2 = readOkr("address-line-2")
  const address = [addr1, addr2].filter(Boolean).join(", ")

  const annualPremium =
    p.productInstances?.reduce((sum, inst) => {
      const raw = inst.attributes?.premiumValue ?? "0"
      const num = parseFloat(String(raw).replace(/[€\s,]/g, "")) || 0
      return sum + num
    }, 0) ?? 0

  // Preserve OKRs that don't map to a named MasterCustomer field, so the
  // revenue dashboards and other legacy UI still find them.
  const preservedKeys = new Set(["address-line-1", "address-line-2", "email"])
  const legacyExtraOkrs: Record<string, OKRItem> = {}
  for (const [k, v] of Object.entries(p.okrs ?? {})) {
    if (!preservedKeys.has(k)) legacyExtraOkrs[k] = v as OKRItem
  }

  // Anonymized: original company name, email, owner and team-member names from
  // the legacy mock are not surfaced. Structural data (products, address
  // fragments, OKR milestones) is kept since it doesn't identify anyone.
  const recordId = Number(p.id)
  const anonName = `Customer ${recordId}`

  return {
    id: `legacy-${p.id}`,
    // Use the original numeric id so existing mock saved lists that reference
    // ids 1..40 continue to filter correctly. No collision with master 101–162.
    recordId,
    firstName: anonName,
    lastName: "",
    dateOfBirth: "",
    address,
    customerType: "Legal entity",
    dossierNumber: p.code ?? `D-L${String(p.id).padStart(5, "0")}`,
    products: p.currentProducts ?? [],
    annualPremium,
    email: `customer-${recordId}@example.com`,

    legacyIdVnemer: p.idVnemer,
    legacyTeam: undefined,
    legacyTeamSize: p.teamSize,
    legacyOwner: undefined,
    legacyProductInstances: p.productInstances,
    legacyExpiringProduct: p.expiringProduct,
    legacyContractEndDate: p.contractEndDate,
    legacyDesiredProducts: p.desiredProducts,
    legacyExtraOkrs,
  }
}

/** The 40 legacy company records converted to the master shape. */
export const LEGACY_MASTER_CUSTOMERS: MasterCustomer[] = initialPartners.map(legacyPartnerToMasterCustomer)

/** Single source of truth for every customer in the app. */
export const ALL_MASTER_CUSTOMERS: MasterCustomer[] = [...MASTER_CUSTOMERS, ...LEGACY_MASTER_CUSTOMERS]

export const MASTER_CUSTOMERS_AS_RECORDS: CustomerRecord[] = ALL_MASTER_CUSTOMERS.map(masterCustomerToRecord)

/**
 * Convert any customer record (whether originally from the master database or
 * from the legacy Partner mock data) into the MasterCustomer shape expected
 * by the shared CustomerTable component. Best-effort mapping is used for
 * legacy records that don't have all the master fields.
 */
export function customerRecordToMasterCustomer(c: CustomerRecord): MasterCustomer {
  // Records originating from the master database have a recordId in the
  // 101+ range and their okrs already carry first-name, last-name, etc.
  const fromMaster = MASTER_CUSTOMERS.find((m) => m.recordId === c.id)
  if (fromMaster) return fromMaster

  const readOkr = (key: string): string => {
    const v = c.okrs?.[key] as any
    return typeof v?.value === "string" ? v.value : ""
  }

  // Legacy records: split "name" into first/last, derive address from OKRs
  // if present, mark as Legal entity (the legacy mock is companies).
  const fullName = c.name ?? ""
  const [firstName, ...rest] = fullName.split(" ")
  const lastName = rest.join(" ")

  const addrLine1 = readOkr("address-line-1")
  const addrLine2 = readOkr("address-line-2")
  const address = [addrLine1, addrLine2].filter(Boolean).join(", ")

  return {
    id: `legacy-${c.id}`,
    recordId: Number(c.id),
    firstName: firstName || fullName,
    lastName: lastName || "",
    dateOfBirth: "",
    address,
    customerType: "Legal entity",
    dossierNumber: c.code ?? String(c.idVnemer ?? c.id),
    products: c.currentProducts ?? [],
    annualPremium: 0,
    email: c.email,
  }
}
