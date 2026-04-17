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
  { id: "pr-1",  recordId: 101, firstName: "Henri",     lastName: "Janssens",      dateOfBirth: "1978-03-14", address: "Rue du Commerce 15, 1000 Brussels",      customerType: "Natural person", dossierNumber: "D-10234", products: ["Auto", "Home"],            annualPremium: 2340, email: "h.janssens@qollabi.com" },
  { id: "pr-2",  recordId: 102, firstName: "Caroline",  lastName: "Dubois",        dateOfBirth: "1985-09-22", address: "Avenue Louise 212, 1050 Brussels",       customerType: "Natural person", dossierNumber: "D-10421", products: ["Auto"],                    annualPremium: 890,  email: "c.dubois@qollabi.com" },
  { id: "pr-3",  recordId: 103, firstName: "Kris",      lastName: "Vermeulen",     dateOfBirth: "1972-11-02", address: "Antwerpsesteenweg 44, 2640 Mortsel",     customerType: "Natural person", dossierNumber: "D-10588", products: ["Home", "Life"],            annualPremium: 3120, email: "k.vermeulen@qollabi.com" },
  { id: "pr-4",  recordId: 104, firstName: "Marie",     lastName: "Peeters",       dateOfBirth: "1990-05-17", address: "Koning Albertlaan 8, 9000 Ghent",        customerType: "Natural person", dossierNumber: "D-10612", products: ["Auto"],                    annualPremium: 1240, email: "m.peeters@qollabi.com" },
  { id: "pr-5",  recordId: 105, firstName: "Sophie",    lastName: "Laurent",       dateOfBirth: "1982-07-29", address: "Chaussée de Wavre 101, 1160 Auderghem",  customerType: "Natural person", dossierNumber: "D-10734", products: ["Home"],                    annualPremium: 1680, email: "s.laurent@qollabi.com" },
  { id: "pr-6",  recordId: 106, firstName: "Isabelle",  lastName: "Maes",          dateOfBirth: "1975-01-11", address: "Meir 48, 2000 Antwerp",                  customerType: "Natural person", dossierNumber: "D-10801", products: ["Auto", "Home"],            annualPremium: 2450, email: "i.maes@qollabi.com" },
  { id: "pr-7",  recordId: 107, firstName: "Nicolas",   lastName: "Claes",         dateOfBirth: "1988-12-03", address: "Grote Markt 12, 3000 Leuven",            customerType: "Natural person", dossierNumber: "D-10855", products: ["Auto"],                    annualPremium: 950,  email: "n.claes@qollabi.com" },
  { id: "pr-8",  recordId: 108, firstName: "Frederic",  lastName: "De Backer",     dateOfBirth: "1969-08-19", address: "Rue Royale 77, 1000 Brussels",           customerType: "Natural person", dossierNumber: "D-10912", products: ["Auto", "Life"],            annualPremium: 2780, email: "f.debacker@qollabi.com" },
  { id: "pr-9",  recordId: 109, firstName: "Thomas",    lastName: "Willems",       dateOfBirth: "1981-04-25", address: "Stationsplein 3, 8000 Bruges",           customerType: "Natural person", dossierNumber: "D-11007", products: ["Home"],                    annualPremium: 1420, email: "t.willems@qollabi.com" },
  { id: "pr-10", recordId: 110, firstName: "Elena",     lastName: "Mertens",       dateOfBirth: "1993-06-08", address: "Lange Gasthuisstraat 24, 2000 Antwerp",  customerType: "Natural person", dossierNumber: "D-11145", products: ["Auto"],                    annualPremium: 1190, email: "e.mertens@qollabi.com" },
  { id: "pr-11", recordId: 111, firstName: "Raphael",   lastName: "Van Damme",     dateOfBirth: "1965-02-16", address: "Avenue de Tervueren 155, 1150 Brussels", customerType: "Natural person", dossierNumber: "D-11203", products: ["Auto", "Home", "Life"],    annualPremium: 3450, email: "r.vandamme@qollabi.com" },
  { id: "pr-12", recordId: 112, firstName: "Lucas",     lastName: "Cools",         dateOfBirth: "1987-10-30", address: "Bondgenotenlaan 62, 3000 Leuven",        customerType: "Natural person", dossierNumber: "D-11290", products: ["Auto"],                    annualPremium: 1090, email: "l.cools@qollabi.com" },

  // First Car — Teen Drivers (#4 — Child reaching driving age)
  { id: "fc-1",  recordId: 113, firstName: "Peter",     lastName: "Jansen",        dateOfBirth: "1976-04-11", address: "Kerkstraat 14, 2800 Mechelen",           customerType: "Natural person", dossierNumber: "D-20113", products: ["Auto", "Home", "Life"],            annualPremium: 3210, email: "p.jansen@qollabi.com" },
  { id: "fc-2",  recordId: 114, firstName: "Annelies",  lastName: "De Smet",       dateOfBirth: "1974-09-03", address: "Leopoldlaan 55, 9000 Ghent",             customerType: "Natural person", dossierNumber: "D-20188", products: ["Auto", "Home"],                    annualPremium: 2480, email: "a.desmet@qollabi.com" },
  { id: "fc-3",  recordId: 115, firstName: "Marc",      lastName: "Vermeulen",     dateOfBirth: "1971-12-28", address: "Turnhoutsebaan 201, 2100 Deurne",        customerType: "Natural person", dossierNumber: "D-20241", products: ["Auto", "Home", "Hospitalisatie"],  annualPremium: 3890, email: "m.vermeulen@qollabi.com" },
  { id: "fc-4",  recordId: 116, firstName: "Ingrid",    lastName: "Claes",         dateOfBirth: "1977-05-19", address: "Rue de la Loi 88, 1040 Brussels",        customerType: "Natural person", dossierNumber: "D-20317", products: ["Auto", "Home"],                    annualPremium: 2290, email: "i.claes@qollabi.com" },
  { id: "fc-5",  recordId: 117, firstName: "Pieter",    lastName: "Maes",          dateOfBirth: "1973-02-06", address: "Markt 9, 3500 Hasselt",                  customerType: "Natural person", dossierNumber: "D-20382", products: ["Auto", "Home", "Life"],            annualPremium: 3470, email: "p.maes@qollabi.com" },
  { id: "fc-6",  recordId: 118, firstName: "Véronique", lastName: "Willems",       dateOfBirth: "1975-08-23", address: "Rue Neuve 32, 7000 Mons",                customerType: "Natural person", dossierNumber: "D-20446", products: ["Auto", "Home"],                    annualPremium: 2610, email: "v.willems@qollabi.com" },
  { id: "fc-7",  recordId: 119, firstName: "Jean",      lastName: "Peeters",       dateOfBirth: "1970-06-14", address: "Sint-Pietersplein 18, 9000 Ghent",       customerType: "Natural person", dossierNumber: "D-20515", products: ["Auto", "Home", "Hospitalisatie", "Life"], annualPremium: 4280, email: "j.peeters@qollabi.com" },
  { id: "fc-8",  recordId: 120, firstName: "Laurence",  lastName: "Dubois",        dateOfBirth: "1979-11-01", address: "Avenue Molière 70, 1190 Forest",         customerType: "Natural person", dossierNumber: "D-20583", products: ["Auto", "Home"],                    annualPremium: 2150, email: "l.dubois@qollabi.com" },
  { id: "fc-9",  recordId: 121, firstName: "Olivier",   lastName: "Laurent",       dateOfBirth: "1972-07-09", address: "Place Verte 4, 7500 Tournai",            customerType: "Natural person", dossierNumber: "D-20649", products: ["Auto", "Home", "Life"],            annualPremium: 3590, email: "o.laurent@qollabi.com" },
  { id: "fc-10", recordId: 122, firstName: "Sabine",    lastName: "Mertens",       dateOfBirth: "1978-03-27", address: "Gasthuisberg 11, 3000 Leuven",           customerType: "Natural person", dossierNumber: "D-20702", products: ["Auto", "Home", "Hospitalisatie"],  annualPremium: 3120, email: "s.mertens@qollabi.com" },

  // No Life Insurance (#7 — Dependents present, no life insurance)
  { id: "nl-1",  recordId: 123, firstName: "Béatrice",   lastName: "Moreau",         dateOfBirth: "1984-01-22", address: "Rue du Marché 7, 1348 Louvain-la-Neuve",  customerType: "Natural person", dossierNumber: "D-30102", products: ["Auto", "Home"],                      annualPremium: 2140, email: "b.moreau@qollabi.com" },
  { id: "nl-2",  recordId: 124, firstName: "Piet",       lastName: "Van den Broeck", dateOfBirth: "1980-05-11", address: "Oudaan 12, 2000 Antwerp",                 customerType: "Natural person", dossierNumber: "D-30148", products: ["Auto", "Home", "Hospitalisatie"],    annualPremium: 2890, email: "p.vandenbroeck@qollabi.com" },
  { id: "nl-3",  recordId: 125, firstName: "Emma",       lastName: "Vandenberghe",   dateOfBirth: "1989-03-08", address: "Sint-Baafsplein 2, 9000 Ghent",           customerType: "Natural person", dossierNumber: "D-30205", products: ["Auto"],                              annualPremium: 1180, email: "e.vandenberghe@qollabi.com" },
  { id: "nl-4",  recordId: 126, firstName: "Martin",     lastName: "De Clerck",      dateOfBirth: "1977-10-15", address: "Kouterstraat 20, 8800 Roeselare",         customerType: "Natural person", dossierNumber: "D-30262", products: ["Home"],                              annualPremium: 1490, email: "m.declerck@qollabi.com" },
  { id: "nl-5",  recordId: 127, firstName: "Sofie",      lastName: "Goossens",       dateOfBirth: "1982-07-04", address: "Veldstraat 99, 9000 Ghent",               customerType: "Natural person", dossierNumber: "D-30318", products: ["Auto", "Home"],                      annualPremium: 2210, email: "s.goossens@qollabi.com" },
  { id: "nl-6",  recordId: 128, firstName: "David",      lastName: "Lefèvre",        dateOfBirth: "1975-12-19", address: "Rue des Tanneurs 48, 1000 Brussels",      customerType: "Natural person", dossierNumber: "D-30371", products: ["Auto", "Home", "BA Familiale"],      annualPremium: 2680, email: "d.lefevre@qollabi.com" },
  { id: "nl-7",  recordId: 129, firstName: "Julie",      lastName: "Charlier",       dateOfBirth: "1986-06-30", address: "Boulevard Tirou 12, 6000 Charleroi",      customerType: "Natural person", dossierNumber: "D-30428", products: ["Home"],                              annualPremium: 1340, email: "j.charlier@qollabi.com" },
  { id: "nl-8",  recordId: 130, firstName: "Kevin",      lastName: "Segers",         dateOfBirth: "1974-02-24", address: "Herckenrodesingel 33, 3500 Hasselt",      customerType: "Natural person", dossierNumber: "D-30491", products: ["Auto", "Home"],                      annualPremium: 2310, email: "k.segers@qollabi.com" },
  { id: "nl-9",  recordId: 131, firstName: "Anne",       lastName: "Hendrickx",      dateOfBirth: "1983-09-17", address: "Brusselsestraat 5, 3000 Leuven",          customerType: "Natural person", dossierNumber: "D-30554", products: ["Auto", "Home", "Hospitalisatie"],    annualPremium: 2940, email: "a.hendrickx@qollabi.com" },
  { id: "nl-10", recordId: 132, firstName: "Simon",      lastName: "Devos",          dateOfBirth: "1990-04-02", address: "Kerkplein 7, 2800 Mechelen",              customerType: "Natural person", dossierNumber: "D-30617", products: ["Auto"],                              annualPremium: 1260, email: "s.devos@qollabi.com" },
  { id: "nl-11", recordId: 133, firstName: "Valentine",  lastName: "Leroy",          dateOfBirth: "1981-11-26", address: "Rue de Fer 3, 5000 Namur",                customerType: "Natural person", dossierNumber: "D-30680", products: ["Auto", "Home"],                      annualPremium: 2490, email: "v.leroy@qollabi.com" },
  { id: "nl-12", recordId: 134, firstName: "Bruno",      lastName: "Callens",        dateOfBirth: "1976-03-12", address: "Oostendse Baan 88, 8400 Ostend",          customerType: "Natural person", dossierNumber: "D-30742", products: ["Home", "Hospitalisatie"],            annualPremium: 1870, email: "b.callens@qollabi.com" },
  { id: "nl-13", recordId: 135, firstName: "Sarah",      lastName: "Bogaerts",       dateOfBirth: "1987-08-05", address: "Nationalestraat 14, 2000 Antwerp",        customerType: "Natural person", dossierNumber: "D-30809", products: ["Auto", "Home"],                      annualPremium: 2180, email: "s.bogaerts@qollabi.com" },
  { id: "nl-14", recordId: 136, firstName: "Olivier",    lastName: "Dumont",         dateOfBirth: "1973-05-28", address: "Place Saint-Lambert 1, 4000 Liège",       customerType: "Natural person", dossierNumber: "D-30872", products: ["Auto", "Home", "BA Familiale"],      annualPremium: 2720, email: "o.dumont@qollabi.com" },
  { id: "nl-15", recordId: 137, firstName: "Charlotte",  lastName: "Wouters",        dateOfBirth: "1991-10-14", address: "Diestsestraat 26, 3000 Leuven",           customerType: "Natural person", dossierNumber: "D-30935", products: ["Auto"],                              annualPremium: 1230, email: "c.wouters@qollabi.com" },
  { id: "nl-16", recordId: 138, firstName: "Maxime",     lastName: "Thys",           dateOfBirth: "1985-01-09", address: "Rue Haute 40, 1000 Brussels",             customerType: "Natural person", dossierNumber: "D-30991", products: ["Auto", "Home"],                      annualPremium: 2340, email: "m.thys@qollabi.com" },
  { id: "nl-17", recordId: 139, firstName: "Laura",      lastName: "Smet",           dateOfBirth: "1980-07-21", address: "Parklaan 15, 2200 Herentals",             customerType: "Natural person", dossierNumber: "D-31045", products: ["Home", "Hospitalisatie"],            annualPremium: 1980, email: "l.smet@qollabi.com" },
  { id: "nl-18", recordId: 140, firstName: "Antoine",    lastName: "Gillet",         dateOfBirth: "1978-12-02", address: "Rue du Pont 9, 7100 La Louvière",         customerType: "Natural person", dossierNumber: "D-31102", products: ["Auto", "Home"],                      annualPremium: 2420, email: "a.gillet@qollabi.com" },

  // Price Increase + No Contact (#3 — 2024 law: rolling exit window)
  { id: "pi-1",  recordId: 141, firstName: "Hugo",       lastName: "Deprez",    dateOfBirth: "1971-02-17", address: "Rue de Namur 24, 5000 Namur",             customerType: "Natural person", dossierNumber: "D-40108", products: ["Auto", "Home"],                     annualPremium: 2890, email: "h.deprez@qollabi.com" },
  { id: "pi-2",  recordId: 142, firstName: "Céline",     lastName: "Van Loo",   dateOfBirth: "1979-06-09", address: "Avenue de la Couronne 45, 1050 Brussels", customerType: "Natural person", dossierNumber: "D-40162", products: ["Home"],                             annualPremium: 1720, email: "c.vanloo@qollabi.com" },
  { id: "pi-3",  recordId: 143, firstName: "Benoît",     lastName: "Mahieu",    dateOfBirth: "1988-11-23", address: "Rue Léopold 15, 7700 Mouscron",           customerType: "Natural person", dossierNumber: "D-40221", products: ["Auto"],                             annualPremium: 1180, email: "b.mahieu@qollabi.com" },
  { id: "pi-4",  recordId: 144, firstName: "Nathalie",   lastName: "Renard",    dateOfBirth: "1975-03-04", address: "Rue du Château 18, 6700 Arlon",           customerType: "Natural person", dossierNumber: "D-40277", products: ["Auto", "Home", "Hospitalisatie"],   annualPremium: 3650, email: "n.renard@qollabi.com" },
  { id: "pi-5",  recordId: 145, firstName: "Vincent",    lastName: "Servais",   dateOfBirth: "1992-07-30", address: "Chaussée de Louvain 202, 1030 Schaerbeek",customerType: "Natural person", dossierNumber: "D-40334", products: ["Auto"],                             annualPremium: 1090, email: "v.servais@qollabi.com" },
  { id: "pi-6",  recordId: 146, firstName: "Aurélie",    lastName: "Denis",     dateOfBirth: "1984-10-18", address: "Rue du Parc 11, 1348 Louvain-la-Neuve",   customerType: "Natural person", dossierNumber: "D-40391", products: ["Home", "BA Familiale"],              annualPremium: 1940, email: "a.denis@qollabi.com" },
  { id: "pi-7",  recordId: 147, firstName: "Pascal",     lastName: "Bodart",    dateOfBirth: "1969-05-12", address: "Rue des Carmes 7, 4000 Liège",            customerType: "Natural person", dossierNumber: "D-40448", products: ["Auto", "Home"],                     annualPremium: 2620, email: "p.bodart@qollabi.com" },
  { id: "pi-8",  recordId: 148, firstName: "Sandrine",   lastName: "Lambert",   dateOfBirth: "1983-12-26", address: "Place de la Vieille Halle 3, 1000 Brussels", customerType: "Natural person", dossierNumber: "D-40509", products: ["Auto"],                       annualPremium: 1210, email: "s.lambert@qollabi.com" },
  { id: "pi-9",  recordId: 149, firstName: "Xavier",     lastName: "Georges",   dateOfBirth: "1974-08-21", address: "Boulevard d'Avroy 99, 4000 Liège",        customerType: "Natural person", dossierNumber: "D-40572", products: ["Auto", "Home", "Life"],             annualPremium: 3480, email: "x.georges@qollabi.com" },
  { id: "pi-10", recordId: 150, firstName: "Muriel",     lastName: "Evrard",    dateOfBirth: "1981-04-13", address: "Rue Émile Vandervelde 22, 1090 Jette",    customerType: "Natural person", dossierNumber: "D-40635", products: ["Home"],                             annualPremium: 1580, email: "m.evrard@qollabi.com" },
  { id: "pi-11", recordId: 151, firstName: "Jérôme",     lastName: "Simon",     dateOfBirth: "1976-01-07", address: "Avenue des Combattants 8, 1332 Genval",   customerType: "Natural person", dossierNumber: "D-40698", products: ["Auto", "Home"],                     annualPremium: 2710, email: "j.simon@qollabi.com" },
  { id: "pi-12", recordId: 152, firstName: "Véronique",  lastName: "Leduc",     dateOfBirth: "1993-09-19", address: "Rue de Campine 34, 4000 Liège",           customerType: "Natural person", dossierNumber: "D-40761", products: ["Auto"],                             annualPremium: 1050, email: "v.leduc@qollabi.com" },
  { id: "pi-13", recordId: 153, firstName: "Grégory",    lastName: "Poncelet",  dateOfBirth: "1970-06-25", address: "Rue de l'Église 5, 6600 Bastogne",        customerType: "Natural person", dossierNumber: "D-40824", products: ["Auto", "Home", "Hospitalisatie"],   annualPremium: 3280, email: "g.poncelet@qollabi.com" },
  { id: "pi-14", recordId: 154, firstName: "Florence",   lastName: "Collard",   dateOfBirth: "1982-11-03", address: "Rue Saint-Gilles 60, 4000 Liège",         customerType: "Natural person", dossierNumber: "D-40887", products: ["Home"],                             annualPremium: 1690, email: "f.collard@qollabi.com" },
  { id: "pi-15", recordId: 155, firstName: "Damien",     lastName: "Herman",    dateOfBirth: "1977-02-28", address: "Rue Grétry 14, 4020 Liège",               customerType: "Natural person", dossierNumber: "D-40951", products: ["Auto", "Home"],                     annualPremium: 2540, email: "d.herman@qollabi.com" },
  { id: "pi-16", recordId: 156, firstName: "Audrey",     lastName: "Quinet",    dateOfBirth: "1986-05-16", address: "Place Jourdan 26, 1040 Brussels",         customerType: "Natural person", dossierNumber: "D-41018", products: ["Auto"],                             annualPremium: 1170, email: "a.quinet@qollabi.com" },
  { id: "pi-17", recordId: 157, firstName: "Thierry",    lastName: "François",  dateOfBirth: "1968-10-08", address: "Rue de la Station 33, 7060 Soignies",     customerType: "Natural person", dossierNumber: "D-41074", products: ["Auto", "Home", "Life"],             annualPremium: 3790, email: "t.francois@qollabi.com" },
  { id: "pi-18", recordId: 158, firstName: "Catherine",  lastName: "Mouton",    dateOfBirth: "1979-07-22", address: "Chaussée de Charleroi 140, 1060 Brussels",customerType: "Natural person", dossierNumber: "D-41138", products: ["Home", "Hospitalisatie"],           annualPremium: 2080, email: "c.mouton@qollabi.com" },
  { id: "pi-19", recordId: 159, firstName: "Philippe",   lastName: "Hanssens",  dateOfBirth: "1972-12-11", address: "Mechelsesteenweg 120, 2018 Antwerp",      customerType: "Natural person", dossierNumber: "D-41194", products: ["Auto", "Home"],                     annualPremium: 2860, email: "p.hanssens@qollabi.com" },
  { id: "pi-20", recordId: 160, firstName: "Isabelle",   lastName: "Cornet",    dateOfBirth: "1990-03-05", address: "Rue de l'Armistice 12, 7000 Mons",        customerType: "Natural person", dossierNumber: "D-41255", products: ["Auto"],                             annualPremium: 1140, email: "i.cornet@qollabi.com" },
  { id: "pi-21", recordId: 161, firstName: "Deprez & Partners SCRL", lastName: "", dateOfBirth: "-",     address: "Boulevard de la Woluwe 58, 1200 Brussels", customerType: "Legal entity",  dossierNumber: "D-41318", products: ["Auto", "Home", "BA Familiale"],     annualPremium: 3010, email: "contact@qollabi.com" },
  { id: "pi-22", recordId: 162, firstName: "Mélanie",    lastName: "Carlier",   dateOfBirth: "1985-09-02", address: "Quai aux Briques 50, 1000 Brussels",      customerType: "Natural person", dossierNumber: "D-41372", products: ["Home"],                             annualPremium: 1630, email: "m.carlier@qollabi.com" },
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

  return {
    id: `legacy-${p.id}`,
    // Use the original numeric id so existing mock saved lists that reference
    // ids 1..40 continue to filter correctly. No collision with master 101–162.
    recordId: Number(p.id),
    firstName: p.name,
    lastName: "",
    dateOfBirth: "",
    address,
    customerType: "Legal entity",
    dossierNumber: p.code ?? `D-L${String(p.id).padStart(5, "0")}`,
    products: p.currentProducts ?? [],
    annualPremium,
    email: p.email ?? readOkr("email") ?? undefined,

    legacyIdVnemer: p.idVnemer,
    legacyTeam: p.team,
    legacyTeamSize: p.teamSize,
    legacyOwner: p.owner,
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
