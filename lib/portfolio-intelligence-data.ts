// ─── Broker & Portfolio Summary ───────────────────────────────────────────────

export const BROKER = {
  name: "Thomas Declercq",
  agency: "Declercq & Partners",
  portfolioHealthScore: 74,
  healthDelta: +3,
  peerPercentile: 31,
  totalClients: 847,
  totalHouseholds: 612,
  totalPremium: 1284500,
  premiumDelta: +4.2,
  churnRiskScore: 32,
  churnRiskDelta: -4,
}

export const CHURN_RISK_DIMENSIONS = [
  { name: "Tenure Vulnerability", score: 48, description: "212 clients in 0–2yr at-risk window" },
  { name: "Inactivity Rate", score: 38, description: "213 clients not contacted in 12+ months" },
  { name: "Single-Product Exposure", score: 35, description: "231 households with 1 product only" },
  { name: "Renewal Concentration", score: 29, description: "87 renewals due in next 90 days" },
  { name: "Complaint / Claims Pressure", score: 18, description: "Low claim dispute rate this period" },
]

export const PORTFOLIO_STATS = {
  avgProductsPerHousehold: 2.1,
  singleProductHouseholds: 231,
  multiProductHouseholds: 381,
  avgTenureYears: 6.4,
  emailCaptureRate: 71,
  activeLastYear: 634,
  inactiveOverOneYear: 213,
  renewalsNext90Days: 87,
}

export const PRODUCT_DISTRIBUTION = [
  { name: "Auto", count: 412, premium: 387000, color: "#0D9488" },
  { name: "Brand", count: 289, premium: 312000, color: "#1A3A5C" },
  { name: "BA / Familiale", count: 198, premium: 143000, color: "#F59E0B" },
  { name: "Hospitalisatie", count: 156, premium: 198000, color: "#16A34A" },
  { name: "Schuldsaldo", count: 89, premium: 176000, color: "#DC2626" },
  { name: "Rechtsbijstand", count: 72, premium: 68500, color: "#8B5CF6" },
]

export const TENURE_DISTRIBUTION = [
  { label: "< 1 yr", count: 94, risk: "high" as const },
  { label: "1–2 yr", count: 118, risk: "high" as const },
  { label: "2–5 yr", count: 203, risk: "medium" as const },
  { label: "5–10 yr", count: 267, risk: "low" as const },
  { label: "10+ yr", count: 165, risk: "low" as const },
]

export const HEALTH_DIMENSIONS = [
  {
    name: "Portfolio Coverage",
    score: 61,
    weight: 0.30,
    benchmark: 74,
    description: "Product mix vs. peer benchmark",
    benchmarkLabel: "Peers avg 74",
    insight: "Life & pension underrepresented vs. similar brokers — 231 households have only 1 product",
    status: "below" as const,
  },
  {
    name: "Performance & Growth",
    score: 82,
    weight: 0.25,
    benchmark: 71,
    description: "Revenue growth, cross-sell & conversion",
    benchmarkLabel: "Peers avg 71",
    insight: "+4.2% premium growth, 34 new products added last 6 months — above benchmark",
    status: "above" as const,
  },
  {
    name: "Engagement & Activity",
    score: 68,
    weight: 0.25,
    benchmark: 72,
    description: "Contact recency, campaign usage & data quality",
    benchmarkLabel: "Peers avg 72",
    insight: "213 clients not contacted in 12+ months — engagement below peer level",
    status: "below" as const,
  },
  {
    name: "Risk Signals",
    score: 74,
    weight: 0.20,
    benchmark: 69,
    description: "Churn pressure, renewals & concentration risk",
    benchmarkLabel: "Peers avg 69",
    insight: "Auto concentration (49% of portfolio) — above-average renewal risk in Sept",
    status: "above" as const,
  },
]

// Actions that point to a smart list template to launch a campaign from
export const HEALTH_ACTIONS = [
  {
    dimension: "Portfolio Coverage",
    text: "231 single-product households — bundle them into a cross-sell campaign",
    pts: "+5 pts",
    color: "#0D9488",
    templateName: "Cross-Sell — Schuldsaldo for Homeowners",
    signalId: "xs-1",
    clientCount: 87,
  },
  {
    dimension: "Engagement & Activity",
    text: "213 clients not contacted in 12+ months — re-engage with a personal outreach",
    pts: "+4 pts",
    color: "#0D9488",
    templateName: "Churn Risk — Long-Term Zero Claims",
    signalId: "churn-3",
    clientCount: 76,
  },
  {
    dimension: "Portfolio Coverage",
    text: "47 clients flagged as churn risk — proactive retention before renewal",
    pts: "+3 pts",
    color: "#0D9488",
    templateName: "Churn Risk — Single Product Peak Window",
    signalId: "churn-1",
    clientCount: 124,
  },
]

// ─── Churn probability by tenure cohort ───────────────────────────────────────
// Based on signals: churn-1 (months 12–18 peak), churn-2, churn-3
export const CHURN_BY_TENURE = [
  { label: "< 1 yr",   clients: 94,  churnPct: 28, atRisk: 26 },
  { label: "1–2 yr",   clients: 118, churnPct: 41, atRisk: 48 },  // peak window (signal churn-1)
  { label: "2–5 yr",   clients: 203, churnPct: 18, atRisk: 37 },
  { label: "5–10 yr",  clients: 267, churnPct: 9,  atRisk: 24 },
  { label: "10+ yr",   clients: 165, churnPct: 6,  atRisk: 10 },
]

// ─── Revenue at risk per signal category (30-day window) ──────────────────────
export const REVENUE_AT_RISK = [
  { category: "Renewals",    premium: 209000 + 249600, color: "#2563EB" },
  { category: "Churn Risk",  premium: 148900 + 168400 + 109000, color: "#EF4444" },
  { category: "Dormant",     premium: 125100, color: "#7C3AED" },
  { category: "Life Events", premium: 37200 + 28800, color: "#F59E0B" },
  { category: "Cross-Sell",  premium: 104400 + 75600 + 49200, color: "#0D9488" },
]

// ─── Signal action pipeline (urgency × category) ──────────────────────────────
export const SIGNAL_PIPELINE = [
  { category: "Churn Risk",  critical: 124, high: 47,  medium: 76, low: 0  },
  { category: "Cross-Sell",  critical: 0,   high: 87,  medium: 63, low: 41 },
  { category: "Life Events", critical: 31,  high: 24,  medium: 0,  low: 0  },
  { category: "Renewals",    critical: 53,  high: 0,   medium: 44, low: 0  },
  { category: "Dormant",     critical: 0,   high: 29,  medium: 0,  low: 0  },
]

// ─── Contact recency segments ──────────────────────────────────────────────────
// Based on: dormant signal (12+ months), engagement rate, active last year
export const CONTACT_RECENCY = [
  { label: "< 30 days",    count: 187, color: "#0D9488" },
  { label: "30–90 days",   count: 243, color: "#16A34A" },
  { label: "90–180 days",  count: 204, color: "#F59E0B" },
  { label: "180–365 days", count: 132, color: "#F97316" },
  { label: "12+ months",   count: 81,  color: "#EF4444" },
]

// ─── Customers by number of products ─────────────────────────────────────────
export const CUSTOMERS_BY_PRODUCT_COUNT = [
  { products: "1 product",  customers: 231, color: "#EF4444" },
  { products: "2 products", customers: 198, color: "#F97316" },
  { products: "3 products", customers: 127, color: "#F59E0B" },
  { products: "4 products", customers:  72, color: "#0D9488" },
  { products: "5 products", customers:  31, color: "#2563EB" },
  { products: "6+",         customers:  12, color: "#7C3AED" },
]

// ─── Claims frequency by tenure ───────────────────────────────────────────────
// Key signal driver: churn-2 (zero claims 3yr), churn-3, renewal patterns
export const CLAIMS_BY_TENURE = [
  { band: "< 1 yr",   noClaims: 58, oneTwo: 29, threePlus: 7  },
  { band: "1–3 yr",   noClaims: 89, oneTwo: 43, threePlus: 12 },
  { band: "3–5 yr",   noClaims: 102, oneTwo: 38, threePlus: 18 },
  { band: "5–10 yr",  noClaims: 134, oneTwo: 49, threePlus: 24 },
  { band: "10+ yr",   noClaims: 98,  oneTwo: 42, threePlus: 25 },
]

// ─── Product gaps per household cohort ────────────────────────────────────────
// Drives cross-sell signals xs-1, xs-2, xs-3
export const PRODUCT_GAP_DATA = [
  { cohort: "1 product",  households: 231, missedRevenue: 312000 },
  { cohort: "2 products", households: 198, missedRevenue: 178000 },
  { cohort: "3 products", households: 127, missedRevenue: 89000  },
  { cohort: "4+ products", households: 56, missedRevenue: 21000  },
]

// ─── Signal Architecture ──────────────────────────────────────────────────────

export type UrgencyLevel = "critical" | "high" | "medium" | "low"
export type CategoryType = "churn" | "crosssell" | "lifecycle" | "renewal" | "dormant"

export interface SignalTimeframe {
  days: 7 | 30 | 60 | 90
  clientCount: number
  totalPremiumImpact: number
}

export interface Signal {
  id: string
  categoryType: CategoryType
  name: string
  description: string       // 2-sentence narrative
  urgency: UrgencyLevel
  icon: string              // which icon to render
  gradient: [string, string] // card gradient stops
  timeframes: SignalTimeframe[]
  keyReasons: string[]
  suggestedSmartList: string
  suggestedCampaign: string
  campaignSubject: string
  campaignBody: string
}

export interface SignalCategory {
  id: string
  type: CategoryType
  label: string
  color: string
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const SIGNAL_CATEGORIES: SignalCategory[] = [
  { id: "churn",     type: "churn",     label: "Churn Risk",         color: "#EF4444" },
  { id: "crosssell", type: "crosssell", label: "Cross-Sell",         color: "#0D9488" },
  { id: "lifecycle", type: "lifecycle", label: "Life Events",        color: "#F59E0B" },
  { id: "renewal",   type: "renewal",   label: "Renewals",           color: "#2563EB" },
  { id: "dormant",   type: "dormant",   label: "Dormant",            color: "#7C3AED" },
]

// ─── Signals ──────────────────────────────────────────────────────────────────

export const ALL_SIGNALS: Signal[] = [
  // ── CHURN RISK ──────────────────────────────────────────────────────────────
  {
    id: "churn-1",
    categoryType: "churn",
    name: "Single Product at Renewal Window",
    description:
      "Auto-only or Brand-only clients in months 12–18 of tenure are 3× more likely to cancel than multi-product households. Your AI model flagged these clients because they show no multi-line stickiness and have not been contacted recently.",
    urgency: "critical",
    icon: "shield-off",
    gradient: ["#FEF2F2", "#FEE2E2"],
    timeframes: [
      { days: 7,  clientCount: 38,  totalPremiumImpact: 54200  },
      { days: 30, clientCount: 124, totalPremiumImpact: 148900 },
      { days: 60, clientCount: 231, totalPremiumImpact: 278600 },
      { days: 90, clientCount: 347, totalPremiumImpact: 416400 },
    ],
    keyReasons: [
      "Single product = no stickiness across coverage lines",
      "Months 12–18 = peak price-comparison behaviour",
      "No broker contact in 6+ months",
    ],
    suggestedSmartList: "Churn Risk — Single Product Peak Window",
    suggestedCampaign: "Retention — Bundle Offer Call",
    campaignSubject: "Uw verzekering optimaal beschermen — persoonlijk voorstel",
    campaignBody: `Beste {{voornaam}},\n\nOp basis van uw dossier zien we dat u momenteel enkel een {{product}}-verzekering heeft. We willen u graag tonen hoe een gecombineerde dekking u niet alleen beter beschermt, maar ook voordelen biedt bij uw volgende verlenging.\n\nMag ik u binnenkort even bellen voor een kort gesprek?\n\nMet vriendelijke groeten,\n{{makelaar}}`,
  },
  {
    id: "churn-2",
    categoryType: "churn",
    name: "Family Contagion Risk",
    description:
      "When one household member cancels, the probability that remaining members follow within 90 days rises to 68%. These households had a cancellation recently and have not received any retention outreach.",
    urgency: "high",
    icon: "users-x",
    gradient: ["#FFF7ED", "#FED7AA"],
    timeframes: [
      { days: 7,  clientCount: 12,  totalPremiumImpact: 43200  },
      { days: 30, clientCount: 47,  totalPremiumImpact: 168400 },
      { days: 60, clientCount: 89,  totalPremiumImpact: 319200 },
      { days: 90, clientCount: 134, totalPremiumImpact: 480400 },
    ],
    keyReasons: [
      "Household member cancelled within last 60 days",
      "Multi-product households — full revenue at risk",
      "No retention outreach attempted",
    ],
    suggestedSmartList: "Churn Risk — Family Contagion Households",
    suggestedCampaign: "Retention — Family Loyalty Offer",
    campaignSubject: "Een persoonlijk woord over uw gezinsverzekeringen",
    campaignBody: `Beste {{voornaam}},\n\nWe willen even persoonlijk contact opnemen om na te gaan of uw huidige dekking nog volledig aansluit bij uw gezinssituatie. Als trouwe klant heeft u recht op onze beste voorwaarden.\n\nIk neem binnenkort contact op.\n\nMet vriendelijke groeten,\n{{makelaar}}`,
  },
  {
    id: "churn-3",
    categoryType: "churn",
    name: "Zero-Claims Price Sensitivity",
    description:
      "Long-term clients with no claims in 3+ years who received a premium increase are showing disengagement — they haven't opened a single email in 12 months and are questioning their policy's value.",
    urgency: "medium",
    icon: "trending-down",
    gradient: ["#F0FDF4", "#DCFCE7"],
    timeframes: [
      { days: 7,  clientCount: 19,  totalPremiumImpact: 28000  },
      { days: 30, clientCount: 76,  totalPremiumImpact: 109000 },
      { days: 60, clientCount: 143, totalPremiumImpact: 204800 },
      { days: 90, clientCount: 218, totalPremiumImpact: 312000 },
    ],
    keyReasons: [
      "No claims in 3+ years — questioning policy value",
      "Premium increased 10–15% at last renewal",
      "No engagement email opened in 12 months",
    ],
    suggestedSmartList: "Churn Risk — Long-Term Zero Claims",
    suggestedCampaign: "Value Demonstration — Annual Review",
    campaignSubject: "Uw jaarlijkse polisoverzicht — tijd voor een gratis review",
    campaignBody: `Beste {{voornaam}},\n\nAls klant zonder schadegevallen heeft u recht op een persoonlijk premiegesprek. We kijken samen na of uw huidige dekking nog optimaal is en of er ruimte is voor een aanpassing in uw voordeel.\n\nGratis en vrijblijvend.\n\nMet vriendelijke groeten,\n{{makelaar}}`,
  },

  // ── CROSS-SELL ───────────────────────────────────────────────────────────────
  {
    id: "xs-1",
    categoryType: "crosssell",
    name: "Homeowners Without Schuldsaldo",
    description:
      "These clients have a Brand (fire) policy — meaning they own a home — but no mortgage protection in place. Clients aged 30–45 with a recent mortgage are in the highest-conversion window for Schuldsaldo.",
    urgency: "high",
    icon: "home",
    gradient: ["#F0FDFA", "#CCFBF1"],
    timeframes: [
      { days: 7,  clientCount: 22,  totalPremiumImpact: 26400  },
      { days: 30, clientCount: 87,  totalPremiumImpact: 104400 },
      { days: 60, clientCount: 164, totalPremiumImpact: 196800 },
      { days: 90, clientCount: 241, totalPremiumImpact: 289200 },
    ],
    keyReasons: [
      "Brand policy detected but no Schuldsaldo",
      "Average age 34–42 — peak mortgage protection profile",
      "82 similar clients already hold this product",
    ],
    suggestedSmartList: "Cross-Sell — Schuldsaldo for Homeowners",
    suggestedCampaign: "Cross-Sell — Schuldsaldo Bundle Offer",
    campaignSubject: "Uw woning is verzekerd — maar uw hypotheek ook?",
    campaignBody: `Beste {{voornaam}},\n\nU heeft uw woning goed verzekerd via uw brandpolis. Maar wat als u of uw partner niet meer kan werken? Een schuldsaldoverzekering zorgt ervoor dat uw hypotheek altijd gedekt is.\n\nIk toon u graag de opties — volledig afgestemd op uw situatie.\n\nMet vriendelijke groeten,\n{{makelaar}}`,
  },
  {
    id: "xs-2",
    categoryType: "crosssell",
    name: "Young Adults Without Health Cover",
    description:
      "Clients aged 25–35 with only Auto or BA coverage have no hospitalisation insurance. This age group has the highest conversion rate for Hospitalisatie, especially those expecting or recently having a first child.",
    urgency: "medium",
    icon: "heart-pulse",
    gradient: ["#FDF2F8", "#FCE7F3"],
    timeframes: [
      { days: 7,  clientCount: 15,  totalPremiumImpact: 18000  },
      { days: 30, clientCount: 63,  totalPremiumImpact: 75600  },
      { days: 60, clientCount: 118, totalPremiumImpact: 141600 },
      { days: 90, clientCount: 179, totalPremiumImpact: 214800 },
    ],
    keyReasons: [
      "No hospitalisatie detected — significant protection gap",
      "Young couple or first-child profile",
      "Low current premium — high upsell headroom",
    ],
    suggestedSmartList: "Cross-Sell — Hospitalisatie Young Adults",
    suggestedCampaign: "Cross-Sell — Health Cover Young Adults",
    campaignSubject: "Bent u écht beschermd als u morgen in het ziekenhuis belandt?",
    campaignBody: `Beste {{voornaam}},\n\nEen ziekenhuisopname kan snel €5.000 of meer kosten. Met een hospitalisatieverzekering betaalt u nooit méér dan uw eigen risico — de rest is gedekt.\n\nVoor uw leeftijdsgroep hebben we momenteel uitstekende voorwaarden. Mag ik u een voorstel bezorgen?\n\nMet vriendelijke groeten,\n{{makelaar}}`,
  },
  {
    id: "xs-3",
    categoryType: "crosssell",
    name: "New Car Buyers for Omnium",
    description:
      "Clients with a vehicle under 3 years old currently covered by Mini or Basis auto insurance are underinsured. The optimal Omnium upsell window is within 24 months of purchase — after that, conversion drops sharply.",
    urgency: "medium",
    icon: "car",
    gradient: ["#EFF6FF", "#DBEAFE"],
    timeframes: [
      { days: 7,  clientCount: 9,   totalPremiumImpact: 10800  },
      { days: 30, clientCount: 41,  totalPremiumImpact: 49200  },
      { days: 60, clientCount: 78,  totalPremiumImpact: 93600  },
      { days: 90, clientCount: 116, totalPremiumImpact: 139200 },
    ],
    keyReasons: [
      "Car purchased within last 24 months — Omnium window open",
      "Currently only Mini or Basis coverage",
      "Significant financial exposure on a recent vehicle",
    ],
    suggestedSmartList: "Upsell — Omnium for Recent Car Buyers",
    suggestedCampaign: "Upsell — Omnium Upgrade",
    campaignSubject: "Uw nieuwe wagen verdient volledige bescherming",
    campaignBody: `Beste {{voornaam}},\n\nU heeft recent een nieuwe wagen aangekocht — gefeliciteerd! Met uw huidige basisverzekering bent u gedekt bij aanrijding met een andere partij. Maar voor schade aan uw eigen voertuig (parking, vandalisme, diefstal) biedt een Omniumverzekering de volledige bescherming.\n\nIk bezorg u graag een vrijblijvende offerte.\n\nMet vriendelijke groeten,\n{{makelaar}}`,
  },

  // ── LIFE EVENTS ──────────────────────────────────────────────────────────────
  {
    id: "le-1",
    categoryType: "lifecycle",
    name: "Recent Home Purchase",
    description:
      "Address change combined with a new Brand policy in the last 30 days is a near-certain home purchase signal. The 90-day window post-purchase is when Schuldsaldo and Rechtsbijstand conversion is highest — act now.",
    urgency: "critical",
    icon: "home",
    gradient: ["#FFFBEB", "#FEF3C7"],
    timeframes: [
      { days: 7,  clientCount: 8,  totalPremiumImpact: 9600  },
      { days: 30, clientCount: 31, totalPremiumImpact: 37200 },
      { days: 60, clientCount: 58, totalPremiumImpact: 69600 },
      { days: 90, clientCount: 84, totalPremiumImpact: 100800},
    ],
    keyReasons: [
      "Address change + new Brand policy within 30 days",
      "Optimal Schuldsaldo window: within 90 days of purchase",
      "Rechtsbijstand often bundled at same moment",
    ],
    suggestedSmartList: "Life Event — Recent Home Purchases",
    suggestedCampaign: "Life Event — Home Purchase Welcome Bundle",
    campaignSubject: "Proficiat met uw nieuwe woning — wij regelen de rest",
    campaignBody: `Beste {{voornaam}},\n\nGefeliciteerd met uw nieuwe woning! Naast uw brandverzekering zijn er nog twee dekkingen die u nu best in orde brengt: een schuldsaldoverzekering (voor uw hypotheek) en een rechtsbijstandsverzekering (voor juridische bescherming als huiseigenaar).\n\nIk neem binnenkort contact op voor een compleet overzicht.\n\nMet vriendelijke groeten,\n{{makelaar}}`,
  },
  {
    id: "le-2",
    categoryType: "lifecycle",
    name: "New Child in the Household",
    description:
      "A new child detected in household data triggers an immediate insurance review need. Familiale (BA), Schuldsaldo upgrade, and Hospitalisatie for the child are the three most relevant products at this life stage.",
    urgency: "high",
    icon: "baby",
    gradient: ["#F0FDF4", "#DCFCE7"],
    timeframes: [
      { days: 7,  clientCount: 6,  totalPremiumImpact: 7200  },
      { days: 30, clientCount: 24, totalPremiumImpact: 28800 },
      { days: 60, clientCount: 45, totalPremiumImpact: 54000 },
      { days: 90, clientCount: 67, totalPremiumImpact: 80400 },
    ],
    keyReasons: [
      "New child detected in household data",
      "Familiale (BA) often not yet in place",
      "Schuldsaldo + Hospitalisatie upgrade relevant",
    ],
    suggestedSmartList: "Life Event — New Parents",
    suggestedCampaign: "Life Event — Family Protection Review",
    campaignSubject: "Proficiat met de uitbreiding van uw gezin!",
    campaignBody: `Beste {{voornaam}},\n\nEen nieuwe baby brengt geluk — en ook nieuwe verantwoordelijkheden. Heeft u al nagedacht over een familiale verzekering, de hospitalisatiedekking voor uw kind, en een eventuele uitbreiding van uw schuldsaldo?\n\nIk help u graag met een volledig gezinsoverzicht.\n\nMet vriendelijke groeten,\n{{makelaar}}`,
  },

  // ── RENEWALS ─────────────────────────────────────────────────────────────────
  {
    id: "ren-1",
    categoryType: "renewal",
    name: "Critical Renewals — No Recent Contact",
    description:
      "Policies renewing within 30 days where there has been no broker contact in over 90 days. These are your highest cancellation-risk renewals — each day without outreach increases the probability of non-renewal.",
    urgency: "critical",
    icon: "clock",
    gradient: ["#EFF6FF", "#DBEAFE"],
    timeframes: [
      { days: 7,  clientCount: 17,  totalPremiumImpact: 67000  },
      { days: 30, clientCount: 53,  totalPremiumImpact: 209000 },
      { days: 60, clientCount: 97,  totalPremiumImpact: 382600 },
      { days: 90, clientCount: 144, totalPremiumImpact: 568200 },
    ],
    keyReasons: [
      "Renewal within 30 days AND no contact in 90+ days",
      "Churn score > 50 — not a safe renewal",
      "Window closes fast — action needed this week",
    ],
    suggestedSmartList: "Critical Renewals — Act This Week",
    suggestedCampaign: "Urgent Renewal — Personal Outreach",
    campaignSubject: "Uw polis vervalt binnenkort — laten we even praten",
    campaignBody: `Beste {{voornaam}},\n\nUw verzekering vervalt binnenkort en ik wil even persoonlijk contact opnemen. Het is een goed moment om te kijken of uw huidige dekking nog volledig aansluit bij uw situatie — en of we de voorwaarden kunnen optimaliseren.\n\nKan ik u bellen deze week?\n\nMet vriendelijke groeten,\n{{makelaar}}`,
  },
  {
    id: "ren-2",
    categoryType: "renewal",
    name: "High-Value Multi-Product Renewals",
    description:
      "High-value clients with 3+ products renewing in the next 30–60 days. These clients are warm, recently contacted, and prime candidates for a loyalty bundle offer that improves retention and increases annual premium.",
    urgency: "medium",
    icon: "layers",
    gradient: ["#F5F3FF", "#EDE9FE"],
    timeframes: [
      { days: 7,  clientCount: 11,  totalPremiumImpact: 62400  },
      { days: 30, clientCount: 44,  totalPremiumImpact: 249600 },
      { days: 60, clientCount: 82,  totalPremiumImpact: 465200 },
      { days: 90, clientCount: 121, totalPremiumImpact: 686600 },
    ],
    keyReasons: [
      "3+ products per household — maximum retention leverage",
      "Renewal in 31–60 days — ideal pre-renewal window",
      "Recent contact logged — client is warm",
    ],
    suggestedSmartList: "Renewals — High-Value Bundle Opportunity",
    suggestedCampaign: "Renewal — Multi-Product Loyalty Discount",
    campaignSubject: "Exclusief loyaliteitsvoordeel voor uw komende verlenging",
    campaignBody: `Beste {{voornaam}},\n\nAls klant met meerdere verzekeringen bij ons heeft u recht op ons loyaliteitsprogramma. Bij uw komende verlenging kunnen we u een gecombineerd voordeel aanbieden op al uw polissen samen.\n\nIk neem contact op om de details te bespreken.\n\nMet vriendelijke groeten,\n{{makelaar}}`,
  },

  // ── DORMANT ──────────────────────────────────────────────────────────────────
  {
    id: "dor-1",
    categoryType: "dormant",
    name: "High-Value Clients Gone Silent",
    description:
      "Clients generating over €3,000 in annual premium with no broker contact in 12+ months. Research shows that high-value clients who go silent for over a year have a 4× higher churn rate over the following 12 months.",
    urgency: "high",
    icon: "moon",
    gradient: ["#F5F3FF", "#EDE9FE"],
    timeframes: [
      { days: 7,  clientCount: 7,  totalPremiumImpact: 30200  },
      { days: 30, clientCount: 29, totalPremiumImpact: 125100 },
      { days: 60, clientCount: 54, totalPremiumImpact: 232900 },
      { days: 90, clientCount: 81, totalPremiumImpact: 349200 },
    ],
    keyReasons: [
      "Premium > €3,000/yr — high-value clients going dark",
      "No contact in 12–18 months",
      "Multiple products — re-engagement ROI is high",
    ],
    suggestedSmartList: "Dormant — High-Value Re-Engagement",
    suggestedCampaign: "Re-Engagement — Premium Client Outreach",
    campaignSubject: "Het is een tijdje geleden — mogen we even bijpraten?",
    campaignBody: `Beste {{voornaam}},\n\nHet is al een tijdje geleden dat we contact hadden, en ik wil even persoonlijk langs komen of bellen. Als klant met meerdere polissen bij ons verdient u een jaarlijks overzichtsgesprek.\n\nIk plan graag een moment in op uw gemak.\n\nMet vriendelijke groeten,\n{{makelaar}}`,
  },
]
