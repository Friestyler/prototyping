import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Search, ChevronDown, ChevronUp, Filter, RefreshCw, Plus, X, ExternalLink, Building2, Phone, Mail, Globe, MapPin, FileText, Users, BarChart3, Zap, Clock, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, ArrowUpDown, Settings, Database, TrendingUp, UserPlus, Shield, Eye, Edit3, Save, Loader2, Newspaper, Share2, PieChart, Target, Sparkles, MessageCircle, ThumbsUp, Repeat2, TrendingDown, Heart, Activity, ArrowLeft, Download, Upload, Calendar, Send, MousePointerClick, ListChecks, PhoneCall, Forward, CalendarDays, ShoppingCart, Layers } from "lucide-react";

// ── Sample Data (loaded from Google Sheets OVIO-Broker DATABASE) ─────────
const SAMPLE_BROKERS = [
  { id: "746996901", name: "@EUROFIN", envId: "", website: "", productA: "", productB: "", productC: "", productD: "", strategicInterest: "", geoScore: "", status: "Belgian Insurance Brokers", statusDate: "30-06-2020", productTypes: "Life insurance with investment, Non-life insurance, Life insurance without investment", responsible: "", suspended: "No", comment: "", street: "Merksemsesteenweg 135", zip: "2100", city: "Antwerpen", country: "BE", legalForm: "Private Limited Company", language: "NL", freeServiceProvision: "", freedomEstablishment: "" },
  { id: "753420873", name: "03BEHEER", envId: "", website: "", productA: "", productB: "", productC: "", productD: "", strategicInterest: "", geoScore: "", status: "Belgian Insurance Brokers", statusDate: "01-04-2024", productTypes: "Non-life insurance", responsible: "", suspended: "No", comment: "", street: "Belgiëlei 182", zip: "2018", city: "Antwerpen", country: "BE", legalForm: "Public Limited Company", language: "NL", freeServiceProvision: "", freedomEstablishment: "" },
  { id: "461521347", name: "1T4U", envId: "", website: "", productA: "", productB: "", productC: "", productD: "", strategicInterest: "", geoScore: "", status: "Belgian Insurance Brokers", statusDate: "13-02-2017", productTypes: "Life insurance with investment, Non-life insurance, Life insurance without investment", responsible: "", suspended: "No", comment: "", street: "Jan Pieter De Nayerlaan 69", zip: "2860", city: "Sint-Katelijne-Waver", country: "BE", legalForm: "Private Limited Company", language: "NL", freeServiceProvision: "", freedomEstablishment: "" },
  { id: "430316833", name: "A&B PARTNERS", envId: "ab-partners.qollabi.ai", website: "https://abpartners.be", productA: "Ethias", productB: "AG Insurance", productC: "AXA Belgium", productD: "", strategicInterest: "High", geoScore: "87", status: "Belgian Insurance Brokers", statusDate: "01-06-2006", productTypes: "Non-life insurance, Life insurance without investment", responsible: "", suspended: "No", comment: "Active in fire & auto", street: "Kortrijksesteenweg 1052", zip: "9051", city: "Gent", country: "BE", legalForm: "Private Limited Company", language: "NL", freeServiceProvision: "", freedomEstablishment: "" },
  { id: "422624830", name: "A.B.C.", envId: "", website: "", productA: "", productB: "", productC: "", productD: "", strategicInterest: "", geoScore: "", status: "Belgian Insurance Brokers", statusDate: "01-11-2004", productTypes: "Life insurance with investment, Non-life insurance, Life insurance without investment", responsible: "", suspended: "No", comment: "", street: "Frankrijklei 64", zip: "2000", city: "Antwerpen", country: "BE", legalForm: "Private Limited Company", language: "NL", freeServiceProvision: "", freedomEstablishment: "" },
  { id: "871215633", name: "A.M. INSURANCE", envId: "", website: "", productA: "", productB: "", productC: "", productD: "", strategicInterest: "", geoScore: "", status: "Belgian Insurance Brokers", statusDate: "01-02-2019", productTypes: "Non-life insurance", responsible: "", suspended: "No", comment: "", street: "Rue de Livourne 25", zip: "1050", city: "Ixelles", country: "BE", legalForm: "Private Limited Company", language: "FR", freeServiceProvision: "", freedomEstablishment: "" },
  { id: "832851798", name: "ACTIGROUP INSURANCE", envId: "actigroup.qollabi.ai", website: "https://actigroup.be", productA: "Baloise", productB: "Fidea", productC: "", productD: "", strategicInterest: "Medium", geoScore: "72", status: "Belgian Insurance Brokers", statusDate: "01-09-2018", productTypes: "Life insurance with investment, Non-life insurance, Life insurance without investment", responsible: "", suspended: "No", comment: "SME focus", street: "Desguinlei 100", zip: "2018", city: "Antwerpen", country: "BE", legalForm: "Public Limited Company", language: "NL", freeServiceProvision: "", freedomEstablishment: "" },
  { id: "407183548", name: "ADAMS & PARTNERS", envId: "", website: "", productA: "", productB: "", productC: "", productD: "", strategicInterest: "", geoScore: "", status: "Belgian Insurance Brokers", statusDate: "01-06-1999", productTypes: "Life insurance with investment, Non-life insurance, Life insurance without investment", responsible: "", suspended: "No", comment: "", street: "Keizerinlaan 66", zip: "1000", city: "Brussels", country: "BE", legalForm: "Public Limited Company", language: "NL", freeServiceProvision: "", freedomEstablishment: "" },
  { id: "476238978", name: "ADVIS CONSULTING", envId: "advis.qollabi.ai", website: "https://advis-consulting.be", productA: "AXA Belgium", productB: "Vivium", productC: "NN Insurance", productD: "Athora", strategicInterest: "High", geoScore: "91", status: "Belgian Insurance Brokers", statusDate: "01-03-2008", productTypes: "Life insurance with investment, Non-life insurance, Life insurance without investment", responsible: "", suspended: "No", comment: "Top prospect - very active in life insurance", street: "Frankrijklei 128", zip: "2000", city: "Antwerpen", country: "BE", legalForm: "Private Limited Company", language: "NL", freeServiceProvision: "", freedomEstablishment: "" },
  { id: "667904512", name: "AGIO VERZEKERINGEN", envId: "", website: "", productA: "", productB: "", productC: "", productD: "", strategicInterest: "Low", geoScore: "35", status: "Belgian Insurance Brokers", statusDate: "15-09-2015", productTypes: "Non-life insurance", responsible: "", suspended: "No", comment: "", street: "Grote Markt 12", zip: "3500", city: "Hasselt", country: "BE", legalForm: "Private Limited Company", language: "NL", freeServiceProvision: "", freedomEstablishment: "" },
  { id: "512789345", name: "ALLIA INSURANCE BROKERS", envId: "allia.qollabi.ai", website: "https://allia.be", productA: "AG Insurance", productB: "Ethias", productC: "Baloise", productD: "Fidea", strategicInterest: "High", geoScore: "95", status: "Belgian Insurance Brokers", statusDate: "01-01-2010", productTypes: "Life insurance with investment, Non-life insurance, Life insurance without investment", responsible: "", suspended: "No", comment: "Premium client - 4 active campaigns", street: "Mechelsesteenweg 455", zip: "1950", city: "Kraainem", country: "BE", legalForm: "Public Limited Company", language: "NL", freeServiceProvision: "Yes", freedomEstablishment: "" },
  { id: "890345672", name: "BELFIUS INSURANCE PARTNERS", envId: "belfius-ip.qollabi.ai", website: "https://belfius-ip.be", productA: "Belfius", productB: "DVV", productC: "", productD: "", strategicInterest: "Medium", geoScore: "68", status: "Belgian Insurance Brokers", statusDate: "01-07-2020", productTypes: "Life insurance with investment, Non-life insurance", responsible: "", suspended: "No", comment: "Onboarding in progress", street: "Koningsstraat 110", zip: "1000", city: "Brussels", country: "BE", legalForm: "Public Limited Company", language: "FR", freeServiceProvision: "", freedomEstablishment: "" },
  { id: "345678901", name: "COENEN VERZEKERINGEN", envId: "coenen.qollabi.ai", website: "https://coenen-verzekeringen.be", productA: "AXA Belgium", productB: "AG Insurance", productC: "Vivium", productD: "", strategicInterest: "High", geoScore: "88", status: "Belgian Insurance Brokers", statusDate: "01-01-2005", productTypes: "Life insurance with investment, Non-life insurance, Life insurance without investment", responsible: "", suspended: "No", comment: "Active user - 6 campaigns, regular login", street: "Turnhoutsebaan 322", zip: "2100", city: "Deurne", country: "BE", legalForm: "Private Limited Company", language: "NL", freeServiceProvision: "", freedomEstablishment: "" },
  { id: "234567890", name: "PALMERS INSURANCE GROUP", envId: "palmers.qollabi.ai", website: "https://palmers-insurance.be", productA: "Ethias", productB: "NN Insurance", productC: "", productD: "", strategicInterest: "Medium", geoScore: "76", status: "Belgian Insurance Brokers", statusDate: "15-03-2012", productTypes: "Non-life insurance, Life insurance without investment", responsible: "", suspended: "No", comment: "2 active campaigns", street: "Leuvensesteenweg 17", zip: "3010", city: "Kessel-Lo", country: "BE", legalForm: "Private Limited Company", language: "NL", freeServiceProvision: "", freedomEstablishment: "" },
  { id: "123456789", name: "VANHEES & ZONEN", envId: "vanhees.qollabi.ai", website: "https://vanhees-verzekeringen.be", productA: "AG Insurance", productB: "Baloise", productC: "AXA Belgium", productD: "Athora", strategicInterest: "High", geoScore: "92", status: "Belgian Insurance Brokers", statusDate: "01-06-1998", productTypes: "Life insurance with investment, Non-life insurance, Life insurance without investment", responsible: "", suspended: "No", comment: "Top client - 8 campaigns, daily usage", street: "Antwerpsestraat 45", zip: "2500", city: "Lier", country: "BE", legalForm: "Public Limited Company", language: "NL", freeServiceProvision: "Yes", freedomEstablishment: "Yes" },
];

// Simulated enrichment data
const ENRICHMENT_DATA = {
  "430316833": { contacts: [{ name: "Jan De Smet", role: "CEO", email: "jan@abpartners.be", phone: "+32 9 123 45 67" }], campaigns: 2, lastLogin: "2026-03-28", usageScore: 65, onboarding: { reason: "Policy management digitization", direction: "Expand SME focus" } },
  "832851798": { contacts: [{ name: "Marie Claes", role: "Managing Director", email: "marie@actigroup.be", phone: "+32 3 456 78 90" }], campaigns: 1, lastLogin: "2026-03-15", usageScore: 42, onboarding: { reason: "Automation", direction: "Improve claims handling" } },
  "476238978": { contacts: [{ name: "Pieter Janssens", role: "CEO", email: "pieter@advis-consulting.be", phone: "+32 3 789 01 23" }, { name: "Lisa Wouters", role: "Operations", email: "lisa@advis-consulting.be", phone: "+32 3 789 01 24" }], campaigns: 5, lastLogin: "2026-04-01", usageScore: 89, onboarding: { reason: "Growth ambition", direction: "Expand life & pension insurance" } },
  "512789345": { contacts: [{ name: "Thomas Mertens", role: "CEO", email: "thomas@allia.be", phone: "+32 2 345 67 89" }, { name: "Sarah Van Den Berg", role: "Sales Director", email: "sarah@allia.be", phone: "+32 2 345 67 90" }], campaigns: 4, lastLogin: "2026-04-02", usageScore: 95, onboarding: { reason: "Become regional market leader", direction: "Multi-channel distribution" } },
  "890345672": { contacts: [{ name: "François Dubois", role: "Director", email: "francois@belfius-ip.be", phone: "+32 2 678 90 12" }], campaigns: 0, lastLogin: "2026-02-20", usageScore: 15, onboarding: { reason: "Improve compliance", direction: "Digital transformation" } },
  "345678901": { contacts: [{ name: "Koen Coenen", role: "Founder & CEO", email: "koen@coenen-verzekeringen.be", phone: "+32 3 234 56 78" }, { name: "An Peeters", role: "Account Manager", email: "an@coenen-verzekeringen.be", phone: "+32 3 234 56 79" }], campaigns: 6, lastLogin: "2026-04-02", usageScore: 92, onboarding: { reason: "Strengthen client retention", direction: "Optimize cross-selling" } },
  "234567890": { contacts: [{ name: "Mark Palmers", role: "Owner", email: "mark@palmers-insurance.be", phone: "+32 16 345 67 89" }], campaigns: 2, lastLogin: "2026-03-25", usageScore: 55, onboarding: { reason: "Increase efficiency", direction: "Non-life focus" } },
  "123456789": { contacts: [{ name: "Peter Vanhees", role: "CEO", email: "peter@vanhees-verzekeringen.be", phone: "+32 3 567 89 01" }, { name: "Els Vanhees", role: "CFO", email: "els@vanhees-verzekeringen.be", phone: "+32 3 567 89 02" }, { name: "Tom Hermans", role: "IT Manager", email: "tom@vanhees-verzekeringen.be", phone: "+32 3 567 89 03" }], campaigns: 8, lastLogin: "2026-04-02", usageScore: 98, onboarding: { reason: "Complete digital overhaul", direction: "Full product range, life & non-life" } },
};

// ── Social Media & News Data ────────────────────────────────────────────
const SOCIAL_MEDIA_DATA = {
  "430316833": {
    linkedin: { url: "linkedin.com/company/ab-partners", followers: 1240, posts: [
      { date: "2026-03-28", text: "Proud to announce our new partnership with Ethias for SME fire insurance packages!", likes: 45, comments: 12, shares: 8 },
      { date: "2026-03-15", text: "Our team attended the Belgian Insurance Forum 2026 - great insights on digital transformation", likes: 32, comments: 5, shares: 3 },
    ]},
    facebook: { url: "facebook.com/abpartners.be", followers: 890 },
    news: [
      { date: "2026-03-20", source: "De Tijd", title: "Ghent-based brokers see 15% growth in SME policies", sentiment: "positive", relevance: "high" },
      { date: "2026-02-10", source: "Trends", title: "Insurance brokers embrace AI for client onboarding", sentiment: "positive", relevance: "medium" },
    ],
  },
  "832851798": {
    linkedin: { url: "linkedin.com/company/actigroup-insurance", followers: 2100, posts: [
      { date: "2026-03-10", text: "Actigroup celebrates 5 years of sustainable insurance solutions in Antwerp", likes: 78, comments: 18, shares: 15 },
    ]},
    news: [
      { date: "2026-03-01", source: "Insurance Daily", title: "Antwerp broker market consolidation continues in 2026", sentiment: "neutral", relevance: "medium" },
    ],
  },
  "476238978": {
    linkedin: { url: "linkedin.com/company/advis-consulting", followers: 3450, posts: [
      { date: "2026-04-01", text: "Expanding our life & pension advisory team - 3 new certified advisors joining!", likes: 112, comments: 24, shares: 19 },
      { date: "2026-03-22", text: "Webinar recap: How to optimize your pension portfolio in a changing regulatory landscape", likes: 67, comments: 15, shares: 22 },
      { date: "2026-03-10", text: "Advis Consulting ranked #3 among Antwerp insurance brokers for client satisfaction", likes: 156, comments: 31, shares: 28 },
    ]},
    facebook: { url: "facebook.com/advisconsulting", followers: 1560 },
    twitter: { url: "twitter.com/advis_be", followers: 780 },
    news: [
      { date: "2026-03-25", source: "L'Echo", title: "Advis Consulting expands life insurance advisory with new hires", sentiment: "positive", relevance: "high" },
      { date: "2026-03-05", source: "Insurance Journal BE", title: "Top 10 fastest-growing brokers in Flanders - Advis at #3", sentiment: "positive", relevance: "high" },
      { date: "2026-02-18", source: "De Standaard", title: "Pension reform drives demand for specialized insurance brokers", sentiment: "positive", relevance: "medium" },
    ],
  },
  "512789345": {
    linkedin: { url: "linkedin.com/company/allia-insurance", followers: 5200, posts: [
      { date: "2026-04-02", text: "New multi-channel distribution platform live! Serving our broker partners even better.", likes: 189, comments: 42, shares: 35 },
      { date: "2026-03-18", text: "Allia Insurance Brokers wins 'Digital Innovator of the Year' at the Belgian Insurance Awards", likes: 234, comments: 56, shares: 48 },
    ]},
    facebook: { url: "facebook.com/allia.be", followers: 3200 },
    twitter: { url: "twitter.com/allia_insurance", followers: 1450 },
    news: [
      { date: "2026-03-30", source: "De Tijd", title: "Allia Insurance pioneers multi-channel broker distribution model", sentiment: "positive", relevance: "high" },
      { date: "2026-03-18", source: "Insurance Daily", title: "Belgian Insurance Awards 2026: Full list of winners", sentiment: "positive", relevance: "high" },
    ],
  },
  "345678901": {
    linkedin: { url: "linkedin.com/company/coenen-verzekeringen", followers: 1870, posts: [
      { date: "2026-04-01", text: "Client retention rate hits 94% - thank you to our amazing team and loyal clients!", likes: 87, comments: 20, shares: 11 },
      { date: "2026-03-12", text: "New cross-selling strategy paying off: 23% increase in multi-product clients", likes: 64, comments: 14, shares: 9 },
    ]},
    facebook: { url: "facebook.com/coenenverzekeringen", followers: 1100 },
    news: [
      { date: "2026-03-15", source: "Trends", title: "Deurne broker Coenen leads in cross-selling innovation", sentiment: "positive", relevance: "high" },
    ],
  },
  "123456789": {
    linkedin: { url: "linkedin.com/company/vanhees-zonen", followers: 4800, posts: [
      { date: "2026-04-02", text: "Excited to launch our full digital product suite covering life, non-life, and investment insurance!", likes: 203, comments: 48, shares: 41 },
      { date: "2026-03-25", text: "Peter Vanhees speaks at InsurTech Belgium 2026 on the future of broker-insurer collaboration", likes: 178, comments: 35, shares: 29 },
      { date: "2026-03-15", text: "Milestone: 25+ years in the insurance business. Grateful for the journey!", likes: 312, comments: 67, shares: 54 },
    ]},
    facebook: { url: "facebook.com/vanhees.verzekeringen", followers: 2800 },
    twitter: { url: "twitter.com/vanhees_ins", followers: 1200 },
    news: [
      { date: "2026-04-01", source: "De Tijd", title: "Vanhees & Zonen launches comprehensive digital insurance platform", sentiment: "positive", relevance: "high" },
      { date: "2026-03-25", source: "Insurance Journal BE", title: "InsurTech Belgium 2026: Brokers leading digital transformation", sentiment: "positive", relevance: "high" },
      { date: "2026-02-28", source: "Het Laatste Nieuws", title: "Family-run brokers thrive with technology adoption in Lier", sentiment: "positive", relevance: "medium" },
    ],
  },
};

// ── Socio-Demographic Data (per broker catchment area) ──────────────────
const SOCIODEMOGRAPHIC_DATA = {
  "430316833": {
    region: "Ghent Metropolitan Area",
    population: 482000,
    avgIncome: 38500,
    homeOwnership: 58.2,
    avgAge: 39.4,
    businessDensity: 72,
    insurancePenetration: 68.5,
    riskProfile: "Medium-Low",
    segments: [
      { name: "Young Professionals", pct: 28, potential: "High", products: "Auto, Renters, Health" },
      { name: "SME Owners", pct: 22, potential: "Very High", products: "Commercial, Liability, Fire" },
      { name: "Families", pct: 31, potential: "High", products: "Home, Life, Education savings" },
      { name: "Retirees", pct: 19, potential: "Medium", products: "Health, Pension, Funeral" },
    ],
    marketOpportunity: { score: 78, trend: "growing", note: "Strong SME base with increasing demand for commercial packages" },
    competitorDensity: 12,
  },
  "832851798": {
    region: "Antwerp South",
    population: 325000,
    avgIncome: 41200,
    homeOwnership: 62.1,
    avgAge: 41.2,
    businessDensity: 85,
    insurancePenetration: 72.3,
    riskProfile: "Medium",
    segments: [
      { name: "Young Professionals", pct: 24, potential: "High", products: "Auto, Health, Renters" },
      { name: "SME Owners", pct: 26, potential: "Very High", products: "Commercial, Fire, Liability" },
      { name: "Families", pct: 30, potential: "High", products: "Home, Life, Education savings" },
      { name: "Retirees", pct: 20, potential: "Medium", products: "Health, Pension" },
    ],
    marketOpportunity: { score: 82, trend: "stable", note: "Mature market with high business density, upsell potential" },
    competitorDensity: 18,
  },
  "476238978": {
    region: "Antwerp City Center",
    population: 530000,
    avgIncome: 42800,
    homeOwnership: 55.7,
    avgAge: 38.1,
    businessDensity: 94,
    insurancePenetration: 71.0,
    riskProfile: "Medium",
    segments: [
      { name: "Young Professionals", pct: 32, potential: "Very High", products: "Auto, Health, Life" },
      { name: "SME Owners", pct: 20, potential: "Very High", products: "Commercial, Liability, Pension" },
      { name: "Families", pct: 27, potential: "High", products: "Home, Life, Education savings" },
      { name: "Retirees", pct: 21, potential: "Medium", products: "Health, Pension, Funeral" },
    ],
    marketOpportunity: { score: 91, trend: "growing", note: "High-density urban market with strong life & pension demand" },
    competitorDensity: 22,
  },
  "512789345": {
    region: "Brussels East (Kraainem)",
    population: 185000,
    avgIncome: 52300,
    homeOwnership: 71.4,
    avgAge: 42.5,
    businessDensity: 68,
    insurancePenetration: 78.9,
    riskProfile: "Low",
    segments: [
      { name: "High-Net-Worth", pct: 18, potential: "Very High", products: "Life, Investment, Premium Home" },
      { name: "Expat Professionals", pct: 22, potential: "High", products: "Health, Auto, Liability" },
      { name: "Families", pct: 38, potential: "High", products: "Home, Life, Education savings" },
      { name: "Retirees", pct: 22, potential: "High", products: "Pension, Health, Estate" },
    ],
    marketOpportunity: { score: 95, trend: "growing", note: "Affluent suburb with high insurance penetration and premium client base" },
    competitorDensity: 8,
  },
  "890345672": {
    region: "Brussels Central (Ixelles)",
    population: 290000,
    avgIncome: 44100,
    homeOwnership: 48.3,
    avgAge: 36.8,
    businessDensity: 91,
    insurancePenetration: 62.1,
    riskProfile: "Medium",
    segments: [
      { name: "Young Professionals", pct: 35, potential: "High", products: "Auto, Renters, Health" },
      { name: "EU Professionals", pct: 20, potential: "High", products: "Health, Liability, Home" },
      { name: "Families", pct: 25, potential: "Medium", products: "Home, Life" },
      { name: "Students/Young Adults", pct: 20, potential: "Low", products: "Health, Auto" },
    ],
    marketOpportunity: { score: 72, trend: "growing", note: "High rental market with under-penetrated young professional segment" },
    competitorDensity: 15,
  },
  "345678901": {
    region: "Antwerp East (Deurne)",
    population: 195000,
    avgIncome: 36800,
    homeOwnership: 64.5,
    avgAge: 40.8,
    businessDensity: 58,
    insurancePenetration: 66.2,
    riskProfile: "Medium",
    segments: [
      { name: "Young Families", pct: 33, potential: "Very High", products: "Home, Life, Auto, Family" },
      { name: "SME Owners", pct: 18, potential: "High", products: "Commercial, Fire, Liability" },
      { name: "Senior Citizens", pct: 24, potential: "Medium", products: "Health, Pension, Funeral" },
      { name: "Young Adults", pct: 25, potential: "Medium", products: "Auto, Health, Renters" },
    ],
    marketOpportunity: { score: 85, trend: "growing", note: "Residential area with high cross-selling potential for family packages" },
    competitorDensity: 9,
  },
  "234567890": {
    region: "Leuven East (Kessel-Lo)",
    population: 145000,
    avgIncome: 40200,
    homeOwnership: 66.8,
    avgAge: 37.5,
    businessDensity: 62,
    insurancePenetration: 70.4,
    riskProfile: "Low",
    segments: [
      { name: "Young Professionals", pct: 30, potential: "High", products: "Auto, Home, Health" },
      { name: "University Staff", pct: 15, potential: "Medium", products: "Life, Pension, Health" },
      { name: "Families", pct: 35, potential: "High", products: "Home, Life, Education savings" },
      { name: "Retirees", pct: 20, potential: "Medium", products: "Health, Pension" },
    ],
    marketOpportunity: { score: 74, trend: "stable", note: "University town with educated demographic and stable insurance demand" },
    competitorDensity: 11,
  },
  "123456789": {
    region: "Lier & Surroundings",
    population: 115000,
    avgIncome: 39600,
    homeOwnership: 72.3,
    avgAge: 41.9,
    businessDensity: 55,
    insurancePenetration: 74.8,
    riskProfile: "Low",
    segments: [
      { name: "Established Families", pct: 36, potential: "Very High", products: "Home, Life, Auto, Education" },
      { name: "SME Owners", pct: 20, potential: "Very High", products: "Commercial, Liability, Fire, Fleet" },
      { name: "Senior Citizens", pct: 22, potential: "High", products: "Health, Pension, Estate, Funeral" },
      { name: "Young Couples", pct: 22, potential: "High", products: "Home, Auto, Life" },
    ],
    marketOpportunity: { score: 88, trend: "stable", note: "Loyal client base with high home ownership and strong multi-product potential" },
    competitorDensity: 6,
  },
};

// ── Insurer Account Manager Contacts (per broker, per insurer) ──────────
const INSURER_CONTACTS = {
  "430316833": {
    "Ethias": [
      { name: "Luc Verhoeven", role: "Account Manager Non-Life", division: "Non-Life", email: "luc.verhoeven@ethias.be", phone: "+32 4 220 31 10" },
      { name: "Sofie Lemmens", role: "Desk Account Manager", division: "Support Desk", email: "sofie.lemmens@ethias.be", phone: "+32 4 220 31 20" },
    ],
    "AG Insurance": [
      { name: "Bart Willems", role: "Account Manager Life", division: "Life", email: "bart.willems@aginsurance.be", phone: "+32 2 664 81 11" },
      { name: "Nathalie Dupont", role: "Account Manager Non-Life", division: "Non-Life", email: "nathalie.dupont@aginsurance.be", phone: "+32 2 664 81 22" },
    ],
    "AXA Belgium": [
      { name: "Kristof Peeters", role: "Regional Account Manager", division: "Non-Life", email: "kristof.peeters@axa.be", phone: "+32 3 286 25 00" },
    ],
  },
  "832851798": {
    "Baloise": [
      { name: "Dirk Van Damme", role: "Account Manager Non-Life", division: "Non-Life", email: "dirk.vandamme@baloise.be", phone: "+32 3 247 21 11" },
      { name: "Eline Goossens", role: "Account Manager Life", division: "Life", email: "eline.goossens@baloise.be", phone: "+32 3 247 21 22" },
      { name: "Youssef El Amrani", role: "Desk Account Manager", division: "Support Desk", email: "youssef.elamrani@baloise.be", phone: "+32 3 247 21 33" },
    ],
    "Fidea": [
      { name: "Hilde Maes", role: "Account Manager", division: "Non-Life", email: "hilde.maes@fidea.be", phone: "+32 3 253 31 11" },
    ],
  },
  "476238978": {
    "AXA Belgium": [
      { name: "Philippe Claessens", role: "Senior Account Manager Life", division: "Life", email: "philippe.claessens@axa.be", phone: "+32 3 286 25 10" },
      { name: "Eva De Wilde", role: "Account Manager Non-Life", division: "Non-Life", email: "eva.dewilde@axa.be", phone: "+32 3 286 25 20" },
      { name: "Rik Hendrickx", role: "Desk Account Manager", division: "Support Desk", email: "rik.hendrickx@axa.be", phone: "+32 3 286 25 30" },
    ],
    "Vivium": [
      { name: "Griet Janssen", role: "Account Manager", division: "Non-Life", email: "griet.janssen@vivium.be", phone: "+32 2 406 35 11" },
      { name: "Steven Hermans", role: "Account Manager Life & Pension", division: "Life", email: "steven.hermans@vivium.be", phone: "+32 2 406 35 22" },
    ],
    "NN Insurance": [
      { name: "Anja Martens", role: "Account Manager Life", division: "Life", email: "anja.martens@nn.be", phone: "+32 2 403 77 11" },
    ],
    "Athora": [
      { name: "Marc Debruyne", role: "Account Manager", division: "Life", email: "marc.debruyne@athora.com", phone: "+32 2 403 88 11" },
      { name: "Ilse Vandenberghe", role: "Desk Account Manager", division: "Support Desk", email: "ilse.vandenberghe@athora.com", phone: "+32 2 403 88 22" },
    ],
  },
  "512789345": {
    "AG Insurance": [
      { name: "Wouter Claes", role: "Senior Account Manager", division: "Non-Life", email: "wouter.claes@aginsurance.be", phone: "+32 2 664 82 11" },
      { name: "Katrien Devos", role: "Account Manager Life", division: "Life", email: "katrien.devos@aginsurance.be", phone: "+32 2 664 82 22" },
      { name: "Mohammed Benali", role: "Desk Account Manager", division: "Support Desk", email: "mohammed.benali@aginsurance.be", phone: "+32 2 664 82 33" },
    ],
    "Ethias": [
      { name: "Luc Verhoeven", role: "Account Manager Non-Life", division: "Non-Life", email: "luc.verhoeven@ethias.be", phone: "+32 4 220 31 10" },
      { name: "Céline Laurent", role: "Account Manager Life", division: "Life", email: "celine.laurent@ethias.be", phone: "+32 4 220 31 30" },
    ],
    "Baloise": [
      { name: "Jan Michiels", role: "Account Manager", division: "Non-Life", email: "jan.michiels@baloise.be", phone: "+32 3 247 22 11" },
    ],
    "Fidea": [
      { name: "Hilde Maes", role: "Account Manager", division: "Non-Life", email: "hilde.maes@fidea.be", phone: "+32 3 253 31 11" },
      { name: "Tom Raes", role: "Account Manager Life", division: "Life", email: "tom.raes@fidea.be", phone: "+32 3 253 31 22" },
    ],
  },
  "890345672": {
    "Belfius": [
      { name: "Isabelle Fontaine", role: "Account Manager", division: "Non-Life", email: "isabelle.fontaine@belfius.be", phone: "+32 2 222 11 11" },
    ],
    "DVV": [
      { name: "Geert Coppens", role: "Account Manager Non-Life", division: "Non-Life", email: "geert.coppens@dvv.be", phone: "+32 2 286 61 11" },
      { name: "Veerle Smeets", role: "Account Manager Life", division: "Life", email: "veerle.smeets@dvv.be", phone: "+32 2 286 61 22" },
    ],
  },
  "345678901": {
    "AXA Belgium": [
      { name: "Philippe Claessens", role: "Senior Account Manager Life", division: "Life", email: "philippe.claessens@axa.be", phone: "+32 3 286 25 10" },
      { name: "Eva De Wilde", role: "Account Manager Non-Life", division: "Non-Life", email: "eva.dewilde@axa.be", phone: "+32 3 286 25 20" },
    ],
    "AG Insurance": [
      { name: "Nathalie Dupont", role: "Account Manager Non-Life", division: "Non-Life", email: "nathalie.dupont@aginsurance.be", phone: "+32 2 664 81 22" },
      { name: "Bart Willems", role: "Account Manager Life", division: "Life", email: "bart.willems@aginsurance.be", phone: "+32 2 664 81 11" },
      { name: "Sarah De Backer", role: "Desk Account Manager", division: "Support Desk", email: "sarah.debacker@aginsurance.be", phone: "+32 2 664 81 44" },
    ],
    "Vivium": [
      { name: "Griet Janssen", role: "Account Manager", division: "Non-Life", email: "griet.janssen@vivium.be", phone: "+32 2 406 35 11" },
    ],
  },
  "234567890": {
    "Ethias": [
      { name: "Pierre Lemaire", role: "Account Manager", division: "Non-Life", email: "pierre.lemaire@ethias.be", phone: "+32 4 220 32 10" },
    ],
    "NN Insurance": [
      { name: "Anja Martens", role: "Account Manager Life", division: "Life", email: "anja.martens@nn.be", phone: "+32 2 403 77 11" },
      { name: "Ruben Smits", role: "Desk Account Manager", division: "Support Desk", email: "ruben.smits@nn.be", phone: "+32 2 403 77 22" },
    ],
  },
  "123456789": {
    "AG Insurance": [
      { name: "Wouter Claes", role: "Senior Account Manager", division: "Non-Life", email: "wouter.claes@aginsurance.be", phone: "+32 2 664 82 11" },
      { name: "Katrien Devos", role: "Account Manager Life", division: "Life", email: "katrien.devos@aginsurance.be", phone: "+32 2 664 82 22" },
      { name: "Sarah De Backer", role: "Desk Account Manager", division: "Support Desk", email: "sarah.debacker@aginsurance.be", phone: "+32 2 664 81 44" },
    ],
    "Baloise": [
      { name: "Dirk Van Damme", role: "Account Manager Non-Life", division: "Non-Life", email: "dirk.vandamme@baloise.be", phone: "+32 3 247 21 11" },
      { name: "Eline Goossens", role: "Account Manager Life", division: "Life", email: "eline.goossens@baloise.be", phone: "+32 3 247 21 22" },
    ],
    "AXA Belgium": [
      { name: "Philippe Claessens", role: "Senior Account Manager Life", division: "Life", email: "philippe.claessens@axa.be", phone: "+32 3 286 25 10" },
      { name: "Eva De Wilde", role: "Account Manager Non-Life", division: "Non-Life", email: "eva.dewilde@axa.be", phone: "+32 3 286 25 20" },
      { name: "Rik Hendrickx", role: "Desk Account Manager", division: "Support Desk", email: "rik.hendrickx@axa.be", phone: "+32 3 286 25 30" },
    ],
    "Athora": [
      { name: "Marc Debruyne", role: "Account Manager", division: "Life", email: "marc.debruyne@athora.com", phone: "+32 2 403 88 11" },
    ],
  },
};

// ── Styles ────────────────────────────────────────────────────────────────
const colors = {
  primary: "#4F46E5",
  primaryLight: "#EEF2FF",
  primaryDark: "#3730A3",
  bg: "#F8FAFC",
  white: "#FFFFFF",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  text: "#1E293B",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  danger: "#EF4444",
  dangerBg: "#FEF2F2",
  info: "#3B82F6",
  infoBg: "#EFF6FF",
};

// ── Badge Component ──────────────────────────────────────────────────────
function Badge({ children, variant = "default", size = "sm" }) {
  const variants = {
    default: { bg: colors.primaryLight, color: colors.primary },
    success: { bg: colors.successBg, color: colors.success },
    warning: { bg: colors.warningBg, color: colors.warning },
    danger: { bg: colors.dangerBg, color: colors.danger },
    info: { bg: colors.infoBg, color: colors.info },
    muted: { bg: "#F1F5F9", color: colors.textSecondary },
  };
  const v = variants[variant] || variants.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: size === "xs" ? "1px 6px" : "2px 10px",
      borderRadius: 12, fontSize: size === "xs" ? 10 : 12, fontWeight: 600,
      backgroundColor: v.bg, color: v.color, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, trend, color = colors.primary }) {
  return (
    <div style={{
      background: colors.white, borderRadius: 12, padding: "20px 24px",
      border: `1px solid ${colors.border}`, flex: 1, minWidth: 200,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{value}</div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      {trend && (
        <div style={{ marginTop: 8, fontSize: 12, color: trend > 0 ? colors.success : colors.danger }}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last week
        </div>
      )}
    </div>
  );
}

// ── Usage Score Bar ──────────────────────────────────────────────────────
function UsageBar({ score }) {
  const color = score >= 75 ? colors.success : score >= 40 ? colors.warning : colors.danger;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#E2E8F0" }}>
        <div style={{ width: `${score}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.5s" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 28 }}>{score}%</span>
    </div>
  );
}

// ── Sync Panel ───────────────────────────────────────────────────────────
function SyncPanel({ isOpen, onClose, onSync }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("2026-03-26 09:15");
  const [syncLog, setSyncLog] = useState([
    { time: "2026-03-26 09:15", status: "success", added: 12, updated: 45, removed: 0 },
    { time: "2026-03-19 09:00", status: "success", added: 8, updated: 32, removed: 2 },
    { time: "2026-03-12 09:00", status: "success", added: 15, updated: 28, removed: 0 },
  ]);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      const newEntry = { time: new Date().toLocaleString("en-GB"), status: "success", added: 7, updated: 38, removed: 1 };
      setSyncLog([newEntry, ...syncLog]);
      setLastSync(newEntry.time);
      setSyncing(false);
      onSync && onSync();
    }, 3000);
  };

  if (!isOpen) return null;
  return (
    <div style={{
      position: "fixed", top: 0, right: 0, width: 480, height: "100vh", background: colors.white,
      boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 1000, display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "20px 24px", borderBottom: `1px solid ${colors.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>Google Sheets Sync</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textSecondary }}>Weekly synchronization with OVIO-Broker DATABASE</p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <X size={20} color={colors.textSecondary} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        <div style={{
          background: colors.primaryLight, borderRadius: 12, padding: 20, marginBottom: 24,
          border: `1px solid ${colors.primary}20`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <Database size={20} color={colors.primary} />
            <span style={{ fontSize: 14, fontWeight: 600, color: colors.primary }}>Source: Google Sheets</span>
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, wordBreak: "break-all" }}>
            docs.google.com/spreadsheets/d/1Wb3hw...BOFBY
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary }}>
            Last sync: <strong>{lastSync}</strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, background: colors.successBg, borderRadius: 8, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: colors.success }}>8,273</div>
            <div style={{ fontSize: 11, color: colors.success }}>Total Brokers</div>
          </div>
          <div style={{ flex: 1, background: colors.infoBg, borderRadius: 8, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: colors.info }}>25</div>
            <div style={{ fontSize: 11, color: colors.info }}>Columns</div>
          </div>
          <div style={{ flex: 1, background: colors.warningBg, borderRadius: 8, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: colors.warning }}>Weekly</div>
            <div style={{ fontSize: 11, color: colors.warning }}>Sync Interval</div>
          </div>
        </div>

        <button onClick={handleSync} disabled={syncing} style={{
          width: "100%", padding: "12px 20px", borderRadius: 8, border: "none",
          background: syncing ? colors.textMuted : colors.primary, color: colors.white,
          fontSize: 14, fontWeight: 600, cursor: syncing ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24,
        }}>
          {syncing ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Syncing...</> : <><RefreshCw size={16} /> Sync Now</>}
        </button>

        <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 12 }}>Sync History</h4>
        {syncLog.map((log, i) => (
          <div key={i} style={{
            padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, marginBottom: 8,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <CheckCircle2 size={14} color={colors.success} />
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{log.time}</span>
              </div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>
                +{log.added} new · {log.updated} updated · {log.removed} removed
              </div>
            </div>
            <Badge variant="success" size="xs">OK</Badge>
          </div>
        ))}

        <div style={{ marginTop: 24, padding: 16, borderRadius: 8, background: "#F8FAFC", border: `1px solid ${colors.border}` }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: colors.text, margin: "0 0 8px" }}>Sync Settings</h4>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>
            Sync runs automatically every Monday at 09:00 CET. You can also trigger a manual sync using the button above.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select style={{
              flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px solid ${colors.border}`,
              fontSize: 12, color: colors.text, background: colors.white,
            }}>
              <option>Every Monday 09:00</option>
              <option>Every day 09:00</option>
              <option>Every 6 hours</option>
              <option>Manual only</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Enrichment Panel ─────────────────────────────────────────────────────
function EnrichmentPanel({ broker, enrichment, socialData, demoData, insurerContacts, isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    if (broker) {
      setEditData({
        website: broker.website || "",
        productA: broker.productA || "",
        productB: broker.productB || "",
        productC: broker.productC || "",
        productD: broker.productD || "",
        strategicInterest: broker.strategicInterest || "",
        comment: broker.comment || "",
      });
    }
  }, [broker]);

  if (!isOpen || !broker) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "products", label: "Products", icon: Shield },
    { id: "social", label: "Social", icon: Share2 },
    { id: "demographics", label: "Market", icon: PieChart },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "usage", label: "Usage", icon: BarChart3 },
    { id: "onboarding", label: "Onboarding", icon: UserPlus },
  ];

  const handleEnrich = () => {
    setEnriching(true);
    setTimeout(() => {
      setEnriching(false);
      setEditData(prev => ({
        ...prev,
        website: prev.website || `https://${broker.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.be`,
        productA: prev.productA || "AG Insurance",
        productB: prev.productB || "Ethias",
      }));
    }, 2500);
  };

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, width: 680, height: "100vh", background: colors.white,
      boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 1000, display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.text }}>{broker.name}</h3>
            <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
              <Badge variant="default">{broker.status?.replace("Belgian ", "")}</Badge>
              {broker.envId && <Badge variant="success">Qollabi</Badge>}
              {broker.suspended === "Yes" && <Badge variant="danger">Suspended</Badge>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleEnrich} disabled={enriching} style={{
              padding: "6px 12px", borderRadius: 6, border: `1px solid ${colors.primary}`,
              background: colors.white, color: colors.primary, fontSize: 12, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}>
              {enriching ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={14} />}
              {enriching ? "Enriching..." : "AI Enrich"}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X size={20} color={colors.textSecondary} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginTop: 16, overflowX: "auto", paddingBottom: 2 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "7px 12px", border: "none", background: activeTab === tab.id ? colors.primaryLight : "transparent",
              color: activeTab === tab.id ? colors.primary : colors.textSecondary,
              fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 400, cursor: "pointer", borderRadius: 6,
              display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
            }}>
              <tab.icon size={13} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <InfoField icon={Building2} label="Company Number" value={broker.id} />
              <InfoField icon={FileText} label="Legal Form" value={broker.legalForm} />
              <InfoField icon={MapPin} label="Address" value={`${broker.street}, ${broker.zip} ${broker.city}`} />
              <InfoField icon={Globe} label="Country" value={broker.country} />
              <InfoField icon={Globe} label="Website" value={broker.website || "—"} link={broker.website} />
              <InfoField icon={FileText} label="Language" value={broker.language === "NL" ? "Dutch" : broker.language === "FR" ? "French" : broker.language} />
              <InfoField icon={Clock} label="Active Since" value={broker.statusDate} />
              <InfoField icon={Database} label="Qollabi Env" value={broker.envId || "—"} />
            </div>
            {broker.strategicInterest && (
              <div style={{ padding: 16, borderRadius: 8, background: colors.primaryLight, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Strategic Interest</div>
                <Badge variant={broker.strategicInterest === "High" ? "success" : broker.strategicInterest === "Medium" ? "warning" : "muted"}>
                  {broker.strategicInterest}
                </Badge>
                {broker.geoScore && <span style={{ marginLeft: 12, fontSize: 13, color: colors.text }}>GEO Score: <strong>{broker.geoScore}</strong>/100</span>}
              </div>
            )}
            {broker.comment && (
              <div style={{ padding: 16, borderRadius: 8, background: "#F8FAFC", border: `1px solid ${colors.border}` }}>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Comments</div>
                <div style={{ fontSize: 13, color: colors.text }}>{broker.comment}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginTop: 0 }}>Insurance Products</h4>
            <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: "#F8FAFC", border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>Product Types</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {broker.productTypes?.split(",").map((p, i) => (
                  <Badge key={i} variant="info" size="xs">{p.trim()}</Badge>
                ))}
              </div>
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>Insurance Partners & Account Managers</h4>
            <div style={{ display: "grid", gap: 12 }}>
              {[broker.productA, broker.productB, broker.productC, broker.productD].filter(Boolean).map((partner, i) => {
                const contacts = insurerContacts?.[partner] || [];
                const divisions = [...new Set(contacts.map(c => c.division))];
                return (
                  <div key={i} style={{ borderRadius: 10, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
                    {/* Insurer Header */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                      background: colors.primaryLight, borderBottom: contacts.length ? `1px solid ${colors.border}` : "none",
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, background: colors.white,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 14, color: colors.primary, border: `1px solid ${colors.border}`,
                      }}>{partner[0]}</div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{partner}</span>
                      </div>
                      {contacts.length > 0 && (
                        <Badge variant="default" size="xs">{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</Badge>
                      )}
                    </div>

                    {/* Account Managers grouped by division */}
                    {contacts.length > 0 ? (
                      <div style={{ padding: "8px 14px 10px" }}>
                        {divisions.map((div, di) => (
                          <div key={di} style={{ marginBottom: di < divisions.length - 1 ? 10 : 0 }}>
                            <div style={{
                              fontSize: 10, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase",
                              letterSpacing: 0.8, marginBottom: 6, paddingBottom: 4,
                              borderBottom: `1px solid ${colors.borderLight}`,
                            }}>{div}</div>
                            {contacts.filter(c => c.division === div).map((contact, ci) => (
                              <div key={ci} style={{
                                display: "flex", alignItems: "center", gap: 10, padding: "6px 0",
                              }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                                  background: div === "Life" ? colors.successBg : div === "Non-Life" ? colors.infoBg : colors.warningBg,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 11, fontWeight: 700,
                                  color: div === "Life" ? colors.success : div === "Non-Life" ? colors.info : colors.warning,
                                }}>{contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{contact.name}</div>
                                  <div style={{ fontSize: 11, color: colors.textMuted }}>{contact.role}</div>
                                </div>
                                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                  <a href={`mailto:${contact.email}`} title={contact.email} style={{
                                    width: 26, height: 26, borderRadius: 6, border: `1px solid ${colors.border}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    textDecoration: "none", background: colors.white,
                                  }}><Mail size={12} color={colors.textSecondary} /></a>
                                  <a href={`tel:${contact.phone}`} title={contact.phone} style={{
                                    width: 26, height: 26, borderRadius: 6, border: `1px solid ${colors.border}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    textDecoration: "none", background: colors.white,
                                  }}><Phone size={12} color={colors.textSecondary} /></a>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: "10px 14px", fontSize: 12, color: colors.textMuted, fontStyle: "italic" }}>
                        No account manager contacts yet — use "AI Enrich" to look up.
                      </div>
                    )}
                  </div>
                );
              })}
              {![broker.productA, broker.productB, broker.productC, broker.productD].some(Boolean) && (
                <div style={{ textAlign: "center", padding: 24, color: colors.textMuted, fontSize: 13 }}>
                  No products known. Use "AI Enrich" to discover insurance products.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "social" && (
          <div>
            {/* Social Media Presence */}
            <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginTop: 0, marginBottom: 12 }}>Social Media Presence</h4>
            {socialData ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {socialData.linkedin && (
                    <div style={{ padding: 14, borderRadius: 8, border: `1px solid ${colors.border}`, textAlign: "center" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0A66C215", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#0A66C2" }}>in</span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>{socialData.linkedin.followers.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: colors.textSecondary }}>LinkedIn Followers</div>
                    </div>
                  )}
                  {socialData.facebook && (
                    <div style={{ padding: 14, borderRadius: 8, border: `1px solid ${colors.border}`, textAlign: "center" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1877F215", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#1877F2" }}>f</span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>{socialData.facebook.followers.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: colors.textSecondary }}>Facebook Followers</div>
                    </div>
                  )}
                  {socialData.twitter && (
                    <div style={{ padding: 14, borderRadius: 8, border: `1px solid ${colors.border}`, textAlign: "center" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1DA1F215", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#1DA1F2" }}>𝕏</span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>{socialData.twitter.followers.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: colors.textSecondary }}>X/Twitter Followers</div>
                    </div>
                  )}
                  {!socialData.linkedin && !socialData.facebook && !socialData.twitter && (
                    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 20, color: colors.textMuted, fontSize: 13 }}>
                      No social media profiles detected.
                    </div>
                  )}
                </div>

                {/* Recent Posts */}
                {socialData.linkedin?.posts?.length > 0 && (
                  <>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 10 }}>Recent LinkedIn Activity</h4>
                    <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                      {socialData.linkedin.posts.map((post, i) => (
                        <div key={i} style={{ padding: 14, borderRadius: 8, border: `1px solid ${colors.border}`, background: "#FAFAFA" }}>
                          <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 6 }}>{post.date}</div>
                          <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, marginBottom: 10 }}>{post.text}</div>
                          <div style={{ display: "flex", gap: 16, fontSize: 12, color: colors.textSecondary }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ThumbsUp size={12} /> {post.likes}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MessageCircle size={12} /> {post.comments}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Repeat2 size={12} /> {post.shares}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* News */}
                {socialData.news?.length > 0 && (
                  <>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 10 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Newspaper size={16} /> Relevant News</span>
                    </h4>
                    <div style={{ display: "grid", gap: 8 }}>
                      {socialData.news.map((item, i) => (
                        <div key={i} style={{ padding: 14, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, flex: 1 }}>{item.title}</div>
                            <Badge variant={item.relevance === "high" ? "success" : "muted"} size="xs">{item.relevance}</Badge>
                          </div>
                          <div style={{ display: "flex", gap: 12, fontSize: 12, color: colors.textSecondary }}>
                            <span>{item.source}</span>
                            <span>{item.date}</span>
                            <Badge variant={item.sentiment === "positive" ? "success" : item.sentiment === "negative" ? "danger" : "muted"} size="xs">
                              {item.sentiment}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 32, color: colors.textMuted, fontSize: 13 }}>
                No social media or news data available. Use "AI Enrich" to scan for online presence.
              </div>
            )}
          </div>
        )}

        {activeTab === "demographics" && (
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginTop: 0, marginBottom: 12 }}>Catchment Area Demographics</h4>
            {demoData ? (
              <>
                {/* Region Overview */}
                <div style={{ padding: 16, borderRadius: 8, background: colors.primaryLight, marginBottom: 16, border: `1px solid ${colors.primary}20` }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.primary, marginBottom: 4 }}>{demoData.region}</div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>
                    Broker catchment area analysis for campaign targeting
                  </div>
                </div>

                {/* Key Metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                  <div style={{ padding: 14, borderRadius: 8, border: `1px solid ${colors.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{(demoData.population / 1000).toFixed(0)}K</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>Population</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 8, border: `1px solid ${colors.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>€{(demoData.avgIncome / 1000).toFixed(1)}K</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>Avg. Income</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 8, border: `1px solid ${colors.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{demoData.avgAge}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>Avg. Age</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 8, border: `1px solid ${colors.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: colors.success }}>{demoData.homeOwnership}%</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>Home Ownership</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 8, border: `1px solid ${colors.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: colors.info }}>{demoData.insurancePenetration}%</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>Insurance Penetration</div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 8, border: `1px solid ${colors.border}`, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: colors.warning }}>{demoData.competitorDensity}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>Competitor Brokers</div>
                  </div>
                </div>

                {/* Market Opportunity */}
                <div style={{ padding: 16, borderRadius: 8, background: demoData.marketOpportunity.score >= 85 ? colors.successBg : demoData.marketOpportunity.score >= 70 ? colors.warningBg : colors.infoBg, marginBottom: 16, border: `1px solid ${demoData.marketOpportunity.score >= 85 ? colors.success : demoData.marketOpportunity.score >= 70 ? colors.warning : colors.info}20` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Target size={16} color={demoData.marketOpportunity.score >= 85 ? colors.success : colors.warning} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>Market Opportunity Score</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 24, fontWeight: 700, color: demoData.marketOpportunity.score >= 85 ? colors.success : colors.warning }}>{demoData.marketOpportunity.score}</span>
                      <span style={{ fontSize: 12, color: colors.textSecondary }}>/100</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Badge variant={demoData.marketOpportunity.trend === "growing" ? "success" : "muted"} size="xs">
                      {demoData.marketOpportunity.trend === "growing" ? "↑ Growing" : "→ Stable"}
                    </Badge>
                    <Badge variant={demoData.riskProfile === "Low" ? "success" : demoData.riskProfile === "Medium-Low" ? "info" : "warning"} size="xs">
                      Risk: {demoData.riskProfile}
                    </Badge>
                  </div>
                  <div style={{ fontSize: 13, color: colors.text }}>{demoData.marketOpportunity.note}</div>
                </div>

                {/* Target Segments */}
                <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 10 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Users size={16} /> Target Segments for Campaigns</span>
                </h4>
                <div style={{ display: "grid", gap: 8 }}>
                  {demoData.segments.map((seg, i) => (
                    <div key={i} style={{ padding: 14, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>{seg.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Badge variant={seg.potential === "Very High" ? "success" : seg.potential === "High" ? "info" : "muted"} size="xs">
                            {seg.potential} potential
                          </Badge>
                          <span style={{ fontSize: 16, fontWeight: 700, color: colors.primary }}>{seg.pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: "#E2E8F0", marginBottom: 8 }}>
                        <div style={{ width: `${seg.pct}%`, height: "100%", borderRadius: 2, background: seg.potential === "Very High" ? colors.success : seg.potential === "High" ? colors.info : colors.textMuted }} />
                      </div>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>
                        <strong>Recommended products:</strong> {seg.products}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 32, color: colors.textMuted, fontSize: 13 }}>
                No demographic data available. Use "AI Enrich" to generate catchment area analysis.
              </div>
            )}
          </div>
        )}

        {activeTab === "contacts" && (
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginTop: 0 }}>Contact Persons</h4>
            {enrichment?.contacts?.length > 0 ? (
              <div style={{ display: "grid", gap: 10 }}>
                {enrichment.contacts.map((c, i) => (
                  <div key={i} style={{ padding: 16, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>{c.name}</div>
                      <Badge variant="muted" size="xs">{c.role}</Badge>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: colors.textSecondary }}>
                        <Mail size={13} /> {c.email}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: colors.textSecondary }}>
                        <Phone size={13} /> {c.phone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 32, color: colors.textMuted, fontSize: 13 }}>
                No contacts available. Use "AI Enrich" to look up contact persons online.
              </div>
            )}
          </div>
        )}

        {activeTab === "usage" && (
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginTop: 0 }}>Usage Data</h4>
            {enrichment ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  <div style={{ padding: 16, borderRadius: 8, background: colors.primaryLight, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: colors.primary }}>{enrichment.campaigns}</div>
                    <div style={{ fontSize: 12, color: colors.primary }}>Campaigns</div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 8, background: colors.successBg, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: colors.success }}>{enrichment.lastLogin}</div>
                    <div style={{ fontSize: 12, color: colors.success }}>Last Login</div>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 8 }}>Usage Score</div>
                  <UsageBar score={enrichment.usageScore} />
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 32, color: colors.textMuted, fontSize: 13 }}>
                {broker.envId ? "Loading usage data..." : "No Qollabi environment — no usage data available."}
              </div>
            )}
          </div>
        )}

        {activeTab === "onboarding" && (
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginTop: 0 }}>Onboarding Information</h4>
            {enrichment?.onboarding ? (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ padding: 16, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Why Qollabi?</div>
                  <div style={{ fontSize: 14, color: colors.text }}>{enrichment.onboarding.reason}</div>
                </div>
                <div style={{ padding: 16, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Strategic Direction</div>
                  <div style={{ fontSize: 14, color: colors.text }}>{enrichment.onboarding.direction}</div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 32, color: colors.textMuted, fontSize: 13 }}>
                No onboarding data available. This is collected when the broker registers.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoField({ icon: Icon, label, value, link }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <Icon size={14} color={colors.textMuted} style={{ marginTop: 2, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11, color: colors.textMuted }}>{label}</div>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: colors.primary, textDecoration: "none" }}>{value}</a>
        ) : (
          <div style={{ fontSize: 13, color: colors.text }}>{value}</div>
        )}
      </div>
    </div>
  );
}

// ── Filter Dropdown ──────────────────────────────────────────────────────
function FilterDropdown({ label, options, value, onChange, icon: Icon }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        padding: "8px 14px", borderRadius: 8, border: `1px solid ${value ? colors.primary : colors.border}`,
        background: value ? colors.primaryLight : colors.white, color: value ? colors.primary : colors.textSecondary,
        fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
      }}>
        {Icon && <Icon size={14} />}
        <Filter size={12} />
        {label}
        {value && <span style={{ marginLeft: 4, fontWeight: 700 }}>· {value}</span>}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: 4, minWidth: 200,
          background: colors.white, borderRadius: 8, border: `1px solid ${colors.border}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: 300, overflow: "auto",
        }}>
          <button onClick={() => { onChange(""); setOpen(false); }} style={{
            display: "block", width: "100%", padding: "8px 14px", border: "none", background: "none",
            textAlign: "left", fontSize: 13, color: colors.textSecondary, cursor: "pointer",
          }}>All</button>
          {options.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }} style={{
              display: "block", width: "100%", padding: "8px 14px", border: "none",
              background: value === opt ? colors.primaryLight : "none",
              textAlign: "left", fontSize: 13, color: colors.text, cursor: "pointer",
            }}>{opt}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Campaign Sample Data (with per-broker detail) ───────────────────────
// Status per broker: "launched" | "not_launched" | "overdue" | "completed"
const generateBrokerCampaignData = (brokerId, campaignStatus) => {
  const broker = SAMPLE_BROKERS.find(b => b.id === brokerId);
  if (!broker) return null;
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const seed = parseInt(brokerId.slice(-4), 10);
  // Deterministic-ish per broker
  const statusPool = campaignStatus === "completed" ? ["completed"] : campaignStatus === "scheduled" ? ["not_launched"] : ["launched", "launched", "launched", "not_launched", "overdue", "completed"];
  const status = statusPool[(seed) % statusPool.length];
  const hasSent = status === "launched" || status === "completed" || status === "overdue";
  const sent = hasSent ? rand(80, 450) : 0;
  const opened = hasSent ? Math.round(sent * (0.45 + (seed % 30) / 100)) : 0;
  const clicked = hasSent ? Math.round(opened * (0.3 + (seed % 25) / 100)) : 0;
  const totalTasks = hasSent ? rand(5, 18) : 0;
  const doneTasks = status === "completed" ? totalTasks : hasSent ? rand(0, totalTasks) : 0;
  const overdueTasks = status === "overdue" ? rand(2, 6) : 0;
  const delegated = hasSent ? rand(0, Math.max(0, totalTasks - doneTasks - overdueTasks)) : 0;
  const called = hasSent ? rand(0, Math.max(0, totalTasks - doneTasks - overdueTasks - delegated)) : 0;
  const daysOverdue = status === "overdue" ? rand(2, 14) : 0;
  const lastActivity = status === "not_launched" ? null : `2026-0${rand(3,4)}-${String(rand(1, 28)).padStart(2, "0")}`;
  return {
    brokerId, brokerName: broker.name, city: broker.city,
    status, sent, opened, clicked,
    tasks: { total: totalTasks, done: doneTasks, overdue: overdueTasks, delegated, called, pending: Math.max(0, totalTasks - doneTasks - overdueTasks - delegated - called) },
    daysOverdue, lastActivity,
  };
};

const CAMPAIGNS = [
  { id: "C001", name: "Spring Non-Life Promo", type: "Non-Life", insurer: "AXA Belgium", status: "active", week: 12, year: 2026,
    brokerIds: ["476238978", "345678901", "123456789", "430316833", "832851798", "512789345", "234567890", "890345672", "667904512", "461521347", "753420873", "407183548", "422624830", "871215633", "746996901"] },
  { id: "C002", name: "Pension Awareness Q1", type: "Life", insurer: "AG Insurance", status: "active", week: 10, year: 2026,
    brokerIds: ["430316833", "512789345", "123456789", "345678901", "476238978", "234567890", "890345672", "832851798"] },
  { id: "C003", name: "SME Fire Package", type: "Non-Life", insurer: "Ethias", status: "active", week: 13, year: 2026,
    brokerIds: ["430316833", "512789345", "234567890", "123456789", "345678901", "667904512", "476238978", "871215633", "461521347", "407183548", "832851798", "890345672"] },
  { id: "C004", name: "Investment Life Launch", type: "Life", insurer: "Athora", status: "completed", week: 8, year: 2026,
    brokerIds: ["476238978", "123456789", "345678901", "512789345"] },
  { id: "C005", name: "Fleet Insurance Drive", type: "Non-Life", insurer: "Baloise", status: "active", week: 14, year: 2026,
    brokerIds: ["832851798", "512789345", "123456789", "430316833", "234567890", "345678901", "476238978", "890345672", "667904512"] },
  { id: "C006", name: "Health Top-Up Campaign", type: "Life", insurer: "Vivium", status: "scheduled", week: 16, year: 2026,
    brokerIds: ["476238978", "345678901", "123456789", "512789345", "832851798", "430316833"] },
  { id: "C007", name: "Home Insurance Renewal", type: "Non-Life", insurer: "AG Insurance", status: "active", week: 11, year: 2026,
    brokerIds: ["512789345", "123456789", "234567890", "345678901", "430316833", "476238978", "832851798", "890345672", "461521347", "753420873", "667904512"] },
].map(c => ({
  ...c,
  brokers: c.brokerIds.map(id => generateBrokerCampaignData(id, c.status)).filter(Boolean),
}));

// ── Insurer Environment ─────────────────────────────────────────────────
function InsurerEnvironment({ onBack }) {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [filterAM, setFilterAM] = useState("");
  const [filterCampaign, setFilterCampaign] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchBroker, setSearchBroker] = useState("");
  const [selectedWeeks, setSelectedWeeks] = useState({});
  const [bookingBrokers, setBookingBrokers] = useState([]);
  const [bookingType, setBookingType] = useState("");
  const [bookingRegion, setBookingRegion] = useState("");
  const [bookingInterest, setBookingInterest] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const [brokerStatusFilter, setBrokerStatusFilter] = useState("");
  const [brokerSortBy, setBrokerSortBy] = useState("status"); // status | name | tasks | emails

  // Collect all account managers from INSURER_CONTACTS
  const allAccountManagers = useMemo(() => {
    const ams = new Set();
    Object.values(INSURER_CONTACTS).forEach(insurers => {
      Object.values(insurers).forEach(contacts => {
        contacts.forEach(c => ams.add(c.name));
      });
    });
    return [...ams].sort();
  }, []);

  // Get AM for a broker
  const getBrokerAMs = (brokerId) => {
    const insurers = INSURER_CONTACTS[brokerId];
    if (!insurers) return [];
    const ams = [];
    Object.entries(insurers).forEach(([, contacts]) => {
      contacts.forEach(c => {
        if (!ams.find(a => a.name === c.name)) ams.push(c);
      });
    });
    return ams;
  };

  const getBrokerById = (id) => SAMPLE_BROKERS.find(b => b.id === id);

  // Page 1: Campaign Dashboard
  const renderCampaigns = () => {
    const filteredCampaigns = CAMPAIGNS.filter(c => {
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterCampaign && c.id !== filterCampaign) return false;
      if (filterAM) {
        const hasAM = c.brokers.some(bd => {
          const ams = getBrokerAMs(bd.brokerId);
          return ams.some(a => a.name === filterAM);
        });
        if (!hasAM) return false;
      }
      return true;
    });

    // Aggregate stats
    const allBrokerData = filteredCampaigns.flatMap(c => c.brokers);
    const totalEmails = allBrokerData.reduce((s, b) => s + b.sent, 0);
    const totalClicks = allBrokerData.reduce((s, b) => s + b.clicked, 0);
    const totalTasks = allBrokerData.reduce((s, b) => s + b.tasks.total, 0);
    const doneTasks = allBrokerData.reduce((s, b) => s + b.tasks.done, 0);
    const overdueBrokers = allBrokerData.filter(b => b.status === "overdue");
    const notLaunchedBrokers = allBrokerData.filter(b => b.status === "not_launched");

    // Status color/icon helpers
    const statusConfig = {
      overdue: { color: colors.danger, bg: colors.dangerBg, label: "Overdue", icon: AlertCircle },
      not_launched: { color: "#D97706", bg: colors.warningBg, label: "Not Launched", icon: Clock },
      launched: { color: colors.info, bg: colors.infoBg, label: "Launched", icon: Send },
      completed: { color: colors.success, bg: colors.successBg, label: "Completed", icon: CheckCircle2 },
    };

    const sortBrokers = (brokers) => {
      const statusPriority = { overdue: 0, not_launched: 1, launched: 2, completed: 3 };
      let filtered = brokerStatusFilter ? brokers.filter(b => b.status === brokerStatusFilter) : brokers;
      if (filterAM) {
        filtered = filtered.filter(b => {
          const ams = getBrokerAMs(b.brokerId);
          return ams.some(a => a.name === filterAM);
        });
      }
      return [...filtered].sort((a, b) => {
        if (brokerSortBy === "status") return (statusPriority[a.status] ?? 9) - (statusPriority[b.status] ?? 9);
        if (brokerSortBy === "name") return a.brokerName.localeCompare(b.brokerName);
        if (brokerSortBy === "tasks") return (b.tasks.overdue + b.tasks.pending) - (a.tasks.overdue + a.tasks.pending);
        if (brokerSortBy === "emails") return b.clicked - a.clicked;
        return 0;
      });
    };

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.text }}>Campaign Dashboard</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textSecondary }}>Monitor campaigns, spot issues, and follow up on broker performance</p>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          <StatCard icon={Layers} label="Active Campaigns" value={CAMPAIGNS.filter(c => c.status === "active").length} color={colors.primary} />
          <StatCard icon={Send} label="Emails Sent" value={totalEmails.toLocaleString()} color={colors.info} />
          <StatCard icon={MousePointerClick} label="Total Clicks" value={totalClicks.toLocaleString()} color={colors.success} />
          <StatCard icon={ListChecks} label="Tasks Done" value={`${doneTasks}/${totalTasks}`} color={colors.warning} />
        </div>

        {/* Attention Banner */}
        {(overdueBrokers.length > 0 || notLaunchedBrokers.length > 0) && (
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            {overdueBrokers.length > 0 && (
              <div style={{
                flex: 1, padding: "14px 18px", borderRadius: 10, background: colors.dangerBg,
                border: `1px solid ${colors.danger}30`, display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${colors.danger}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertCircle size={18} color={colors.danger} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: colors.danger }}>{overdueBrokers.length}</div>
                  <div style={{ fontSize: 12, color: colors.danger }}>Brokers overdue on tasks</div>
                </div>
                <button onClick={() => { setBrokerStatusFilter("overdue"); setExpandedCampaign(filteredCampaigns.find(c => c.brokers.some(b => b.status === "overdue"))?.id || null); }} style={{
                  marginLeft: "auto", padding: "6px 14px", borderRadius: 6, border: `1px solid ${colors.danger}40`,
                  background: colors.white, color: colors.danger, fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>Show all</button>
              </div>
            )}
            {notLaunchedBrokers.length > 0 && (
              <div style={{
                flex: 1, padding: "14px 18px", borderRadius: 10, background: colors.warningBg,
                border: `1px solid ${colors.warning}30`, display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${colors.warning}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={18} color="#D97706" />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#D97706" }}>{notLaunchedBrokers.length}</div>
                  <div style={{ fontSize: 12, color: "#D97706" }}>Brokers haven't launched yet</div>
                </div>
                <button onClick={() => { setBrokerStatusFilter("not_launched"); setExpandedCampaign(filteredCampaigns.find(c => c.brokers.some(b => b.status === "not_launched"))?.id || null); }} style={{
                  marginLeft: "auto", padding: "6px 14px", borderRadius: 6, border: `1px solid ${colors.warning}40`,
                  background: colors.white, color: "#D97706", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>Show all</button>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <FilterDropdown label="Campaign" options={CAMPAIGNS.map(c => c.name)} value={filterCampaign ? CAMPAIGNS.find(c => c.id === filterCampaign)?.name : ""} onChange={v => setFilterCampaign(v ? CAMPAIGNS.find(c => c.name === v)?.id : "")} />
          <FilterDropdown label="Campaign Status" options={["active", "completed", "scheduled"]} value={filterStatus} onChange={setFilterStatus} />
          <FilterDropdown label="Account Manager" options={allAccountManagers} value={filterAM} onChange={setFilterAM} />
          <FilterDropdown label="Broker Status" options={["overdue", "not_launched", "launched", "completed"]} value={brokerStatusFilter} onChange={setBrokerStatusFilter} />
          {(filterCampaign || filterStatus || filterAM || brokerStatusFilter) && (
            <button onClick={() => { setFilterCampaign(""); setFilterStatus(""); setFilterAM(""); setBrokerStatusFilter(""); }} style={{
              padding: "8px 14px", borderRadius: 8, border: "none", background: colors.dangerBg,
              color: colors.danger, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>Clear all filters</button>
          )}
        </div>

        {/* Campaign Cards */}
        <div style={{ display: "grid", gap: 12 }}>
          {filteredCampaigns.map(campaign => {
            const isExpanded = expandedCampaign === campaign.id;
            const sortedBrokers = sortBrokers(campaign.brokers);
            const cOverdue = campaign.brokers.filter(b => b.status === "overdue").length;
            const cNotLaunched = campaign.brokers.filter(b => b.status === "not_launched").length;
            const cLaunched = campaign.brokers.filter(b => b.status === "launched").length;
            const cCompleted = campaign.brokers.filter(b => b.status === "completed").length;
            const cTotalSent = campaign.brokers.reduce((s, b) => s + b.sent, 0);
            const cTotalClicked = campaign.brokers.reduce((s, b) => s + b.clicked, 0);
            const cTasksDone = campaign.brokers.reduce((s, b) => s + b.tasks.done, 0);
            const cTasksTotal = campaign.brokers.reduce((s, b) => s + b.tasks.total, 0);
            const taskPct = cTasksTotal ? Math.round(cTasksDone / cTasksTotal * 100) : 0;

            return (
              <div key={campaign.id} style={{ background: colors.white, borderRadius: 12, border: `1px solid ${cOverdue > 0 ? colors.danger + "40" : colors.border}`, overflow: "hidden" }}>
                {/* Compact Campaign Header — clickable */}
                <div onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)} style={{
                  padding: "14px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16,
                  background: isExpanded ? "#FAFBFF" : colors.white, transition: "background 0.15s",
                }}>
                  {/* Icon + Name */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: campaign.type === "Life" ? colors.successBg : colors.infoBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Shield size={16} color={campaign.type === "Life" ? colors.success : colors.info} />
                  </div>
                  <div style={{ minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: colors.text }}>{campaign.name}</div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>{campaign.insurer} · {campaign.type} · W{campaign.week}</div>
                  </div>

                  {/* Status summary pills */}
                  <div style={{ display: "flex", gap: 6, flex: 1 }}>
                    {cOverdue > 0 && <Badge variant="danger">{cOverdue} overdue</Badge>}
                    {cNotLaunched > 0 && <Badge variant="warning">{cNotLaunched} not launched</Badge>}
                    <Badge variant="info">{cLaunched} active</Badge>
                    {cCompleted > 0 && <Badge variant="success">{cCompleted} done</Badge>}
                  </div>

                  {/* Quick metrics */}
                  <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{cTotalSent > 0 ? Math.round(cTotalClicked / cTotalSent * 100) : 0}%</div>
                      <div style={{ fontSize: 10, color: colors.textMuted }}>CTR</div>
                    </div>
                    <div style={{ width: 80 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontSize: 10, color: colors.textMuted }}>Tasks</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: taskPct >= 75 ? colors.success : taskPct >= 40 ? colors.warning : colors.danger }}>{taskPct}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: "#E2E8F0" }}>
                        <div style={{ width: `${taskPct}%`, height: "100%", borderRadius: 2, background: taskPct >= 75 ? colors.success : taskPct >= 40 ? colors.warning : colors.danger }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: colors.textSecondary }}>{campaign.brokers.length} brokers</div>
                    <Badge variant={campaign.status === "active" ? "success" : campaign.status === "completed" ? "muted" : "warning"}>
                      {campaign.status}
                    </Badge>
                    {isExpanded ? <ChevronUp size={16} color={colors.textMuted} /> : <ChevronDown size={16} color={colors.textMuted} />}
                  </div>
                </div>

                {/* Expanded Broker Table */}
                {isExpanded && (
                  <div>
                    {/* Sort bar */}
                    <div style={{ padding: "8px 20px", background: "#F8FAFC", borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                      <span style={{ color: colors.textSecondary, marginRight: 4 }}>Sort by:</span>
                      {[
                        { id: "status", label: "Status (priority)" },
                        { id: "name", label: "Name" },
                        { id: "tasks", label: "Pending tasks" },
                        { id: "emails", label: "Clicks" },
                      ].map(s => (
                        <button key={s.id} onClick={() => setBrokerSortBy(s.id)} style={{
                          padding: "3px 10px", borderRadius: 4, border: "none", fontSize: 11, cursor: "pointer",
                          background: brokerSortBy === s.id ? colors.primaryLight : "transparent",
                          color: brokerSortBy === s.id ? colors.primary : colors.textSecondary,
                          fontWeight: brokerSortBy === s.id ? 600 : 400,
                        }}>{s.label}</button>
                      ))}
                      <span style={{ marginLeft: "auto", color: colors.textMuted }}>{sortedBrokers.length} of {campaign.brokers.length} brokers shown</span>
                    </div>

                    {/* Broker rows */}
                    <div style={{ maxHeight: 480, overflow: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: "#FDFDFE" }}>
                            <th style={{ padding: "8px 20px", textAlign: "left", fontWeight: 600, color: colors.textSecondary, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, width: "4%" }}>Status</th>
                            <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: colors.textSecondary, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, width: "18%" }}>Broker</th>
                            <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: colors.textSecondary, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, width: "14%" }}>Emails</th>
                            <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: colors.textSecondary, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, width: "20%" }}>Tasks</th>
                            <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: colors.textSecondary, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, width: "10%" }}>Last Active</th>
                            <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: colors.textSecondary, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, width: "20%" }}>Account Manager</th>
                            <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: colors.textSecondary, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, width: "6%" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedBrokers.map((bd, bi) => {
                            const sc = statusConfig[bd.status];
                            const ams = getBrokerAMs(bd.brokerId);
                            const taskPctBroker = bd.tasks.total ? Math.round(bd.tasks.done / bd.tasks.total * 100) : 0;
                            return (
                              <tr key={bd.brokerId} style={{
                                borderBottom: `1px solid ${colors.borderLight}`,
                                background: bd.status === "overdue" ? `${colors.danger}05` : bd.status === "not_launched" ? `${colors.warning}05` : "transparent",
                              }}>
                                {/* Status indicator */}
                                <td style={{ padding: "10px 20px" }}>
                                  <div title={sc.label} style={{
                                    width: 26, height: 26, borderRadius: 6, background: sc.bg,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>
                                    <sc.icon size={13} color={sc.color} />
                                  </div>
                                </td>

                                {/* Broker name */}
                                <td style={{ padding: "10px 10px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{
                                      width: 26, height: 26, borderRadius: 6, background: colors.primaryLight,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      fontWeight: 700, fontSize: 10, color: colors.primary, flexShrink: 0,
                                    }}>{bd.brokerName[0]}</div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: colors.text, fontSize: 12 }}>{bd.brokerName}</div>
                                      <div style={{ fontSize: 10, color: colors.textMuted }}>{bd.city}</div>
                                    </div>
                                  </div>
                                </td>

                                {/* Emails */}
                                <td style={{ padding: "10px 10px" }}>
                                  {bd.sent > 0 ? (
                                    <div>
                                      <div style={{ display: "flex", gap: 8, fontSize: 11, marginBottom: 3 }}>
                                        <span style={{ color: colors.textSecondary }}>{bd.sent} sent</span>
                                        <span style={{ color: colors.success, fontWeight: 600 }}>{bd.clicked} clicks</span>
                                      </div>
                                      <div style={{ height: 3, borderRadius: 2, background: "#E2E8F0", width: 80 }}>
                                        <div style={{ width: `${bd.sent ? Math.round(bd.clicked / bd.sent * 100) : 0}%`, height: "100%", borderRadius: 2, background: colors.success }} />
                                      </div>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: 11, color: colors.textMuted }}>—</span>
                                  )}
                                </td>

                                {/* Tasks */}
                                <td style={{ padding: "10px 10px" }}>
                                  {bd.tasks.total > 0 ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <div style={{ display: "flex", gap: 3 }}>
                                        {bd.tasks.done > 0 && <Badge variant="success" size="xs">{bd.tasks.done}</Badge>}
                                        {bd.tasks.delegated > 0 && <Badge variant="info" size="xs">{bd.tasks.delegated} del</Badge>}
                                        {bd.tasks.called > 0 && <Badge variant="warning" size="xs">{bd.tasks.called} call</Badge>}
                                        {bd.tasks.overdue > 0 && <Badge variant="danger" size="xs">{bd.tasks.overdue} overdue</Badge>}
                                        {bd.tasks.pending > 0 && <Badge variant="muted" size="xs">{bd.tasks.pending} pend</Badge>}
                                      </div>
                                      <span style={{ fontSize: 10, color: colors.textMuted, flexShrink: 0 }}>{taskPctBroker}%</span>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: 11, color: colors.textMuted }}>—</span>
                                  )}
                                </td>

                                {/* Last active */}
                                <td style={{ padding: "10px 10px" }}>
                                  <div>
                                    {bd.lastActivity ? (
                                      <span style={{ fontSize: 11, color: colors.textSecondary }}>{bd.lastActivity}</span>
                                    ) : (
                                      <span style={{ fontSize: 11, color: colors.textMuted, fontStyle: "italic" }}>Never</span>
                                    )}
                                    {bd.daysOverdue > 0 && (
                                      <div style={{ fontSize: 10, color: colors.danger, fontWeight: 600, marginTop: 2 }}>{bd.daysOverdue}d overdue</div>
                                    )}
                                  </div>
                                </td>

                                {/* Account Managers */}
                                <td style={{ padding: "10px 10px" }}>
                                  {ams.length > 0 ? (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                                      {ams.slice(0, 2).map((am, ai) => (
                                        <span key={ai} title={`${am.name} — ${am.role}\n${am.email}\n${am.phone}`} style={{
                                          display: "inline-flex", alignItems: "center", gap: 3,
                                          padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 500,
                                          background: am.division === "Life" ? colors.successBg : am.division === "Non-Life" ? colors.infoBg : colors.warningBg,
                                          color: am.division === "Life" ? colors.success : am.division === "Non-Life" ? colors.info : colors.warning,
                                          cursor: "default",
                                        }}>{am.name.split(" ")[0]} {am.name.split(" ").slice(-1)[0][0]}.</span>
                                      ))}
                                      {ams.length > 2 && <span style={{ fontSize: 9, color: colors.textMuted }}>+{ams.length - 2}</span>}
                                    </div>
                                  ) : <span style={{ fontSize: 10, color: colors.textMuted }}>—</span>}
                                </td>

                                {/* Action */}
                                <td style={{ padding: "10px 10px" }}>
                                  {(bd.status === "overdue" || bd.status === "not_launched") && (
                                    <button title="Send reminder" style={{
                                      width: 26, height: 26, borderRadius: 6, border: `1px solid ${bd.status === "overdue" ? colors.danger : colors.warning}40`,
                                      background: bd.status === "overdue" ? colors.dangerBg : colors.warningBg,
                                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                                    }}>
                                      <Send size={11} color={bd.status === "overdue" ? colors.danger : "#D97706"} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Page 2: Broker Directory (export/import)
  const renderBrokerDirectory = () => {
    const brokers = SAMPLE_BROKERS.filter(b => {
      if (!searchBroker) return true;
      const s = searchBroker.toLowerCase();
      return b.name.toLowerCase().includes(s) || b.id.includes(s) || b.city.toLowerCase().includes(s);
    });

    const handleExport = () => {
      const headers = ["VAT Number", "Name", "City", "ZIP", "Street", "Country", "Language", "Legal Form", "Product Types", "Contact 1 Name", "Contact 1 Role", "Contact 1 Email", "Contact 1 Phone", "Contact 2 Name", "Contact 2 Role", "Contact 2 Email", "Contact 2 Phone", "Contact 3 Name", "Contact 3 Role", "Contact 3 Email", "Contact 3 Phone"];
      const rows = brokers.map(b => {
        const enrichment = ENRICHMENT_DATA[b.id];
        const contacts = enrichment?.contacts || [];
        return [
          b.id, b.name, b.city, b.zip, b.street, b.country, b.language, b.legalForm, b.productTypes,
          contacts[0]?.name || "", contacts[0]?.role || "", contacts[0]?.email || "", contacts[0]?.phone || "",
          contacts[1]?.name || "", contacts[1]?.role || "", contacts[1]?.email || "", contacts[1]?.phone || "",
          contacts[2]?.name || "", contacts[2]?.role || "", contacts[2]?.email || "", contacts[2]?.phone || "",
        ];
      });
      const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "broker_directory_export.csv";
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.text }}>Broker Directory</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textSecondary }}>Export broker data for matching, import account manager assignments</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleExport} style={{
              padding: "10px 18px", borderRadius: 8, border: `1px solid ${colors.border}`,
              background: colors.white, color: colors.text, fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              <Download size={16} /> Export CSV
            </button>
            <button onClick={() => setImportModalOpen(true)} style={{
              padding: "10px 18px", borderRadius: 8, border: "none",
              background: colors.primary, color: colors.white, fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              <Upload size={16} /> Import Account Managers
            </button>
          </div>
        </div>

        {/* Info card */}
        <div style={{ padding: 16, borderRadius: 10, background: colors.infoBg, border: `1px solid ${colors.info}20`, marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <AlertCircle size={18} color={colors.info} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.6 }}>
            <strong>How it works:</strong> Export the broker list with VAT numbers and contact fields. Match it with your internal CRM, then import a CSV with columns: <code style={{ background: "#E0E7FF", padding: "1px 4px", borderRadius: 3, fontSize: 11 }}>VAT Number, AM Name, AM Division, AM Email, AM Phone</code> to assign account managers per division.
          </div>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8,
          border: `1px solid ${colors.border}`, background: colors.white, marginBottom: 16, maxWidth: 400,
        }}>
          <Search size={16} color={colors.textMuted} />
          <input value={searchBroker} onChange={e => setSearchBroker(e.target.value)}
            placeholder="Search broker..." style={{ border: "none", background: "none", outline: "none", flex: 1, fontSize: 13, color: colors.text }} />
        </div>

        {/* Table */}
        <div style={{ background: colors.white, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {["VAT Number", "Name", "City", "Language", "Product Types", "Contact Persons", "Account Managers"].map((h, i) => (
                    <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: colors.textSecondary, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${colors.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brokers.slice(0, 20).map(broker => {
                  const enrichment = ENRICHMENT_DATA[broker.id];
                  const contacts = enrichment?.contacts || [];
                  const ams = getBrokerAMs(broker.id);
                  return (
                    <tr key={broker.id} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 11, color: colors.textSecondary }}>{broker.id}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: colors.text }}>{broker.name}</td>
                      <td style={{ padding: "10px 14px", color: colors.text }}>{broker.city}</td>
                      <td style={{ padding: "10px 14px" }}><Badge variant="muted" size="xs">{broker.language}</Badge></td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                          {broker.productTypes?.split(",").slice(0, 2).map((p, j) => (
                            <Badge key={j} variant="info" size="xs">{p.trim().replace("Life insurance with investment", "Life+").replace("Life insurance without investment", "Life").replace("Non-life insurance", "Non-life")}</Badge>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {contacts.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {contacts.slice(0, 2).map((c, ci) => (
                              <div key={ci} style={{ fontSize: 11 }}>
                                <span style={{ fontWeight: 500, color: colors.text }}>{c.name}</span>
                                <span style={{ color: colors.textMuted }}> · {c.email}</span>
                              </div>
                            ))}
                            {contacts.length > 2 && <span style={{ fontSize: 10, color: colors.textMuted }}>+{contacts.length - 2} more</span>}
                          </div>
                        ) : <span style={{ color: colors.textMuted }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {ams.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                            {ams.slice(0, 3).map((am, ai) => (
                              <span key={ai} style={{
                                display: "inline-flex", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 500,
                                background: am.division === "Life" ? colors.successBg : am.division === "Non-Life" ? colors.infoBg : colors.warningBg,
                                color: am.division === "Life" ? colors.success : am.division === "Non-Life" ? colors.info : colors.warning,
                              }}>{am.name.split(" ")[0]} · {am.division}</span>
                            ))}
                            {ams.length > 3 && <span style={{ fontSize: 10, color: colors.textMuted }}>+{ams.length - 3}</span>}
                          </div>
                        ) : <span style={{ color: colors.textMuted, fontSize: 11, fontStyle: "italic" }}>Not assigned</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 20px", borderTop: `1px solid ${colors.border}`, fontSize: 12, color: colors.textSecondary }}>
            Showing {Math.min(20, brokers.length)} of {brokers.length} brokers
          </div>
        </div>

        {/* Import Modal */}
        {importModalOpen && (
          <>
            <div onClick={() => setImportModalOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.4)", zIndex: 1000 }} />
            <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 520, background: colors.white, borderRadius: 16, padding: 32, zIndex: 1001, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>Import Account Managers</h3>
                <button onClick={() => setImportModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color={colors.textSecondary} /></button>
              </div>
              <div style={{ padding: 20, borderRadius: 10, border: `2px dashed ${colors.border}`, textAlign: "center", marginBottom: 20, background: colors.bg }}>
                <Upload size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 500, color: colors.text, marginBottom: 4 }}>Drop your CSV file here or click to browse</div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>Required columns: VAT Number, AM Name, AM Division, AM Email, AM Phone</div>
                <button style={{
                  marginTop: 12, padding: "8px 20px", borderRadius: 8, border: `1px solid ${colors.primary}`,
                  background: colors.white, color: colors.primary, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Browse Files</button>
              </div>
              <div style={{ padding: 14, borderRadius: 8, background: colors.warningBg, fontSize: 12, color: colors.text }}>
                <strong>Note:</strong> Each row maps one account manager to a broker (by VAT number). Include one row per AM per division. Existing assignments will be updated, new ones will be created.
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Page 3: Campaign Marketplace
  const renderMarketplace = () => {
    const filteredBrokers = SAMPLE_BROKERS.filter(b => {
      if (bookingRegion && b.city !== bookingRegion) return false;
      if (bookingInterest && b.strategicInterest !== bookingInterest) return false;
      return true;
    });

    const weeks = Array.from({ length: 12 }, (_, i) => {
      const w = 14 + i;
      return { week: w, label: `W${w}` };
    });

    const getCampaignsForBrokerWeek = (brokerId, week) => {
      return CAMPAIGNS.filter(c => c.week === week && c.brokerIds.includes(brokerId));
    };

    const toggleWeekSelection = (brokerId, week) => {
      const key = `${brokerId}-${week}`;
      // Check conflict: same type already booked
      const existing = getCampaignsForBrokerWeek(brokerId, week);
      if (bookingType && existing.some(c => c.type === bookingType)) return; // blocked
      setSelectedWeeks(prev => ({ ...prev, [key]: !prev[key] }));
      if (!bookingBrokers.includes(brokerId)) {
        setBookingBrokers(prev => [...prev, brokerId]);
      }
    };

    const selectedCount = Object.values(selectedWeeks).filter(Boolean).length;

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.text }}>Campaign Marketplace</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: colors.textSecondary }}>Select brokers and book campaign slots by week</p>
          </div>
          <button onClick={() => { if (selectedCount > 0) setShowBookingModal(true); }} disabled={selectedCount === 0} style={{
            padding: "10px 18px", borderRadius: 8, border: "none",
            background: selectedCount > 0 ? colors.primary : colors.textMuted,
            color: colors.white, fontSize: 13, fontWeight: 600,
            cursor: selectedCount > 0 ? "pointer" : "default", display: "flex", alignItems: "center", gap: 6,
          }}>
            <ShoppingCart size={16} /> Book {selectedCount} slot{selectedCount !== 1 ? "s" : ""}
          </button>
        </div>

        {/* Booking Config */}
        <div style={{ background: colors.white, borderRadius: 12, border: `1px solid ${colors.border}`, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Campaign Configuration</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: colors.textSecondary }}>Type:</span>
              <select value={bookingType} onChange={e => setBookingType(e.target.value)} style={{
                padding: "6px 12px", borderRadius: 6, border: `1px solid ${colors.border}`, fontSize: 13, color: colors.text, background: colors.white,
              }}>
                <option value="">Select type...</option>
                <option value="Life">Life</option>
                <option value="Non-Life">Non-Life</option>
              </select>
            </div>
            <FilterDropdown label="Region" options={[...new Set(SAMPLE_BROKERS.map(b => b.city))].sort()} value={bookingRegion} onChange={setBookingRegion} />
            <FilterDropdown label="Interest" options={["High", "Medium", "Low"]} value={bookingInterest} onChange={setBookingInterest} />
            {(bookingRegion || bookingInterest) && (
              <button onClick={() => { setBookingRegion(""); setBookingInterest(""); }} style={{
                padding: "6px 12px", borderRadius: 6, border: "none", background: colors.dangerBg,
                color: colors.danger, fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}>Clear filters</button>
            )}
          </div>
        </div>

        {/* Scheduling Grid */}
        <div style={{ background: colors.white, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: colors.textSecondary, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${colors.border}`, position: "sticky", left: 0, background: "#F8FAFC", zIndex: 2, minWidth: 180 }}>Broker</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: colors.textSecondary, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${colors.border}`, minWidth: 80 }}>Region</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: colors.textSecondary, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${colors.border}`, minWidth: 60 }}>Interest</th>
                  {weeks.map(w => (
                    <th key={w.week} style={{ padding: "10px 6px", textAlign: "center", fontWeight: 600, color: colors.textSecondary, fontSize: 10, borderBottom: `1px solid ${colors.border}`, minWidth: 48 }}>
                      <div>{w.label}</div>
                      <div style={{ fontSize: 9, fontWeight: 400 }}>2026</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBrokers.map(broker => (
                  <tr key={broker.id} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                    <td style={{ padding: "8px 14px", position: "sticky", left: 0, background: colors.white, zIndex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 6, background: colors.primaryLight,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: 10, color: colors.primary,
                        }}>{broker.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: colors.text, fontSize: 11 }}>{broker.name}</div>
                          <div style={{ fontSize: 9, color: colors.textMuted }}>{broker.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "8px 14px", fontSize: 11, color: colors.text }}>{broker.city}</td>
                    <td style={{ padding: "8px 14px" }}>
                      {broker.strategicInterest ? (
                        <Badge variant={broker.strategicInterest === "High" ? "success" : broker.strategicInterest === "Medium" ? "warning" : "muted"} size="xs">{broker.strategicInterest}</Badge>
                      ) : <span style={{ color: colors.textMuted }}>—</span>}
                    </td>
                    {weeks.map(w => {
                      const existing = getCampaignsForBrokerWeek(broker.id, w.week);
                      const key = `${broker.id}-${w.week}`;
                      const isSelected = selectedWeeks[key];
                      const hasConflict = bookingType && existing.some(c => c.type === bookingType);
                      const hasOther = existing.length > 0;

                      return (
                        <td key={w.week} style={{ padding: "4px 3px", textAlign: "center" }}>
                          {hasConflict ? (
                            <div title={`Blocked: ${existing.find(c => c.type === bookingType)?.name}`} style={{
                              width: 36, height: 28, borderRadius: 4, margin: "0 auto",
                              background: colors.dangerBg, border: `1px solid ${colors.danger}40`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 9, color: colors.danger, fontWeight: 600,
                            }}>
                              <X size={12} />
                            </div>
                          ) : (
                            <div onClick={() => bookingType && toggleWeekSelection(broker.id, w.week)}
                              title={hasOther ? `Running: ${existing.map(c => c.name).join(", ")}` : "Available"}
                              style={{
                                width: 36, height: 28, borderRadius: 4, margin: "0 auto",
                                background: isSelected ? colors.primary : hasOther ? colors.warningBg : colors.bg,
                                border: `1px solid ${isSelected ? colors.primary : hasOther ? colors.warning + "40" : colors.border}`,
                                cursor: bookingType ? "pointer" : "default",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.15s",
                              }}>
                              {isSelected && <CheckCircle2 size={12} color={colors.white} />}
                              {!isSelected && hasOther && <span style={{ fontSize: 8, color: colors.warning, fontWeight: 700 }}>{existing.length}</span>}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: colors.bg, border: `1px solid ${colors.border}` }} /> Available</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: colors.warningBg, border: `1px solid ${colors.warning}40` }} /> Other campaign running</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: colors.primary }} /> Selected</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: colors.dangerBg, border: `1px solid ${colors.danger}40` }} /> Conflict (same type)</span>
            </div>
            <span style={{ fontSize: 12, color: colors.textSecondary }}>{filteredBrokers.length} brokers · {selectedCount} slots selected</span>
          </div>
        </div>

        {/* Booking Confirmation Modal */}
        {showBookingModal && (
          <>
            <div onClick={() => setShowBookingModal(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.4)", zIndex: 1000 }} />
            <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 480, background: colors.white, borderRadius: 16, padding: 32, zIndex: 1001, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700, color: colors.text }}>Confirm Campaign Booking</h3>
              <div style={{ marginBottom: 16, padding: 14, borderRadius: 8, background: colors.primaryLight }}>
                <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>Campaign Type</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: colors.primary }}>{bookingType || "Not selected"}</div>
              </div>
              <div style={{ marginBottom: 16, fontSize: 13, color: colors.text }}>
                <strong>{selectedCount}</strong> slot{selectedCount !== 1 ? "s" : ""} selected across <strong>{new Set(Object.entries(selectedWeeks).filter(([, v]) => v).map(([k]) => k.split("-")[0])).size}</strong> broker{bookingBrokers.length !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setShowBookingModal(false)} style={{
                  padding: "10px 20px", borderRadius: 8, border: `1px solid ${colors.border}`,
                  background: colors.white, color: colors.text, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Cancel</button>
                <button onClick={() => { setShowBookingModal(false); setSelectedWeeks({}); setBookingBrokers([]); }} style={{
                  padding: "10px 20px", borderRadius: 8, border: "none",
                  background: colors.primary, color: colors.white, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Confirm Booking</button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const tabs = [
    { id: "campaigns", label: "Campaign Dashboard", icon: Layers },
    { id: "brokers", label: "Broker Directory", icon: Users },
    { id: "marketplace", label: "Campaign Marketplace", icon: ShoppingCart },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: colors.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Sidebar */}
      <div style={{ width: 240, background: colors.white, borderRight: `1px solid ${colors.border}`, padding: "20px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: "#F59E0B",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: colors.white, fontWeight: 800, fontSize: 14,
          }}>IN</div>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>Insurer Portal</span>
            <div style={{ fontSize: 10, color: colors.textSecondary }}>AXA Belgium</div>
          </div>
        </div>

        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 20px", marginBottom: 16, width: "100%",
          border: "none", background: "none", color: colors.textSecondary, fontSize: 13, cursor: "pointer",
          textAlign: "left",
        }}>
          <ArrowLeft size={16} /> Back to Qollabi
        </button>

        <nav>
          {tabs.map(tab => (
            <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
              background: activeTab === tab.id ? "#FEF3C7" : "transparent",
              color: activeTab === tab.id ? "#D97706" : colors.textSecondary,
              fontSize: 14, fontWeight: activeTab === tab.id ? 600 : 400, cursor: "pointer",
              borderLeft: activeTab === tab.id ? "3px solid #F59E0B" : "3px solid transparent",
            }}>
              <tab.icon size={18} /> {tab.label}
            </div>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 32px", borderBottom: `1px solid ${colors.border}`, background: colors.white, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, color: colors.textSecondary }}>
            Insurer Environment / <span style={{ color: colors.text, fontWeight: 500 }}>{tabs.find(t => t.id === activeTab)?.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: colors.textSecondary }}>AXA Belgium</span>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#D97706" }}>AX</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: 32, overflow: "auto" }}>
          {activeTab === "campaigns" && renderCampaigns()}
          {activeTab === "brokers" && renderBrokerDirectory()}
          {activeTab === "marketplace" && renderMarketplace()}
        </div>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────
export default function QollabiBrokerDB() {
  const [currentPage, setCurrentPage] = useState("broker-db");
  const [brokers, setBrokers] = useState(SAMPLE_BROKERS);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterQollabi, setFilterQollabi] = useState("");
  const [filterInterest, setFilterInterest] = useState("");
  const [enrichingAll, setEnrichingAll] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const perPage = 10;

  const cities = useMemo(() => [...new Set(brokers.map(b => b.city))].sort(), [brokers]);
  const statuses = useMemo(() => [...new Set(brokers.map(b => b.status))].sort(), [brokers]);

  const filtered = useMemo(() => {
    return brokers.filter(b => {
      const s = search.toLowerCase();
      const matchSearch = !s || b.name.toLowerCase().includes(s) || b.id.includes(s) || b.city.toLowerCase().includes(s) || (b.envId && b.envId.toLowerCase().includes(s));
      const matchCity = !filterCity || b.city === filterCity;
      const matchStatus = !filterStatus || b.status === filterStatus;
      const matchLang = !filterLanguage || b.language === filterLanguage;
      const matchQollabi = !filterQollabi || (filterQollabi === "Yes" ? b.envId : !b.envId);
      const matchInterest = !filterInterest || b.strategicInterest === filterInterest;
      return matchSearch && matchCity && matchStatus && matchLang && matchQollabi && matchInterest;
    }).sort((a, b) => {
      const av = a[sortField] || "";
      const bv = b[sortField] || "";
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [brokers, search, sortField, sortDir, filterCity, filterStatus, filterLanguage, filterQollabi, filterInterest]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleEnrichAll = () => {
    setEnrichingAll(true);
    setEnrichProgress(0);
    const total = filtered.length;
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 3) + 1;
      if (current >= total) {
        current = total;
        clearInterval(interval);
        setTimeout(() => {
          setEnrichingAll(false);
          setEnrichProgress(0);
        }, 1000);
      }
      setEnrichProgress(Math.round((current / total) * 100));
    }, 400);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={12} color={colors.textMuted} />;
    return sortDir === "asc" ? <ChevronUp size={12} color={colors.primary} /> : <ChevronDown size={12} color={colors.primary} />;
  };

  if (currentPage === "insurer") {
    return <InsurerEnvironment onBack={() => setCurrentPage("broker-db")} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: colors.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Sidebar */}
      <div style={{ width: 240, background: colors.white, borderRight: `1px solid ${colors.border}`, padding: "20px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px", marginBottom: 32, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: colors.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: colors.white, fontWeight: 800, fontSize: 16,
          }}>Q</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>Qollabi</span>
        </div>
        <nav>
          {[
            { icon: Database, label: "Broker Database", active: true },
            { icon: FileText, label: "Campaign Templates", active: false },
            { icon: BarChart3, label: "Smart List Templates", active: false },
            { icon: TrendingUp, label: "Analytics", active: false },
            { icon: Settings, label: "Settings", active: false },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
              background: item.active ? colors.primaryLight : "transparent",
              color: item.active ? colors.primary : colors.textSecondary,
              fontSize: 14, fontWeight: item.active ? 600 : 400, cursor: "pointer",
              borderLeft: item.active ? `3px solid ${colors.primary}` : "3px solid transparent",
            }}>
              <item.icon size={18} /> {item.label}
            </div>
          ))}

          <div style={{ margin: "16px 20px", borderTop: `1px solid ${colors.border}`, paddingTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Environments</div>
            <div onClick={() => setCurrentPage("insurer")} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", borderRadius: 8,
              color: "#92400E", fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: "1px solid #F59E0B40",
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6, background: "#F59E0B",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#FFF", fontWeight: 800, fontSize: 9,
              }}>IN</div>
              Insurer Environment
              <ExternalLink size={12} style={{ marginLeft: "auto" }} />
            </div>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Breadcrumb */}
        <div style={{ padding: "12px 32px", borderBottom: `1px solid ${colors.border}`, background: colors.white, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, color: colors.textSecondary }}>
            Dashboard / <span style={{ color: colors.text, fontWeight: 500 }}>Broker Database</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: colors.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: colors.primary }}>KK</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: 32, overflow: "auto" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: colors.text }}>Broker Database</h1>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: colors.textSecondary }}>
                Manage all brokers, enrich data with AI, and sync with the source
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleEnrichAll} disabled={enrichingAll} style={{
                padding: "10px 18px", borderRadius: 8, border: "none",
                background: enrichingAll ? `linear-gradient(90deg, #8B5CF6 ${enrichProgress}%, #C4B5FD ${enrichProgress}%)` : "linear-gradient(135deg, #8B5CF6, #6D28D9)",
                color: colors.white, fontSize: 13, fontWeight: 600,
                cursor: enrichingAll ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6,
                boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)", transition: "all 0.3s",
              }}>
                {enrichingAll ? (
                  <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Enriching DB... {enrichProgress}%</>
                ) : (
                  <><Sparkles size={16} /> AI Enrich All</>
                )}
              </button>
              <button onClick={() => setSyncOpen(true)} style={{
                padding: "10px 18px", borderRadius: 8, border: `1px solid ${colors.border}`,
                background: colors.white, color: colors.text, fontSize: 13, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}>
                <RefreshCw size={16} /> Sync
              </button>
              <button style={{
                padding: "10px 18px", borderRadius: 8, border: "none",
                background: colors.primary, color: colors.white, fontSize: 13, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}>
                <Plus size={16} /> New Broker
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <StatCard icon={Building2} label="Total Brokers" value="8,273" trend={1.2} color={colors.primary} />
            <StatCard icon={CheckCircle2} label="Qollabi Active" value="342" trend={8.5} color={colors.success} />
            <StatCard icon={BarChart3} label="Active Campaigns" value="89" trend={12.3} color={colors.info} />
            <StatCard icon={Zap} label="Enriched Profiles" value="1,205" trend={5.7} color={colors.warning} />
          </div>

          {/* Search & Filters */}
          <div style={{
            background: colors.white, borderRadius: 12, border: `1px solid ${colors.border}`,
            marginBottom: 16, padding: "16px 20px",
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{
                flex: 1, minWidth: 250, display: "flex", alignItems: "center", gap: 8,
                padding: "8px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg,
              }}>
                <Search size={16} color={colors.textMuted} />
                <input
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search broker by name, company number, or city..."
                  style={{ border: "none", background: "none", outline: "none", flex: 1, fontSize: 13, color: colors.text }}
                />
              </div>
              <FilterDropdown label="City" options={cities} value={filterCity} onChange={v => { setFilterCity(v); setPage(1); }} />
              <FilterDropdown label="Language" options={["NL", "FR", "DE", "EN"]} value={filterLanguage} onChange={v => { setFilterLanguage(v); setPage(1); }} />
              <FilterDropdown label="Qollabi" options={["Yes", "No"]} value={filterQollabi} onChange={v => { setFilterQollabi(v); setPage(1); }} />
              <FilterDropdown label="Interest" options={["High", "Medium", "Low"]} value={filterInterest} onChange={v => { setFilterInterest(v); setPage(1); }} />
            </div>
          </div>

          {/* Table */}
          <div style={{ background: colors.white, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {[
                      { field: "name", label: "Name", width: "20%" },
                      { field: "envId", label: "Qollabi Env", width: "14%" },
                      { field: "city", label: "City", width: "10%" },
                      { field: "language", label: "Lang", width: "5%" },
                      { field: "productTypes", label: "Products", width: "18%" },
                      { field: "strategicInterest", label: "Interest", width: "8%" },
                      { field: "statusDate", label: "Active Since", width: "10%" },
                      { field: "", label: "Status", width: "8%" },
                      { field: "", label: "", width: "5%" },
                    ].map((col, i) => (
                      <th key={i} onClick={() => col.field && handleSort(col.field)} style={{
                        padding: "12px 14px", textAlign: "left", fontWeight: 600, color: colors.textSecondary,
                        fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, cursor: col.field ? "pointer" : "default",
                        borderBottom: `1px solid ${colors.border}`, width: col.width, whiteSpace: "nowrap",
                        userSelect: "none",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {col.label} {col.field && <SortIcon field={col.field} />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((broker, i) => {
                    const enrichment = ENRICHMENT_DATA[broker.id];
                    return (
                      <tr key={broker.id} onClick={() => setSelectedBroker(broker)}
                        style={{ cursor: "pointer", borderBottom: `1px solid ${colors.borderLight}`, transition: "background 0.1s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: 8, background: colors.primaryLight,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontWeight: 700, fontSize: 13, color: colors.primary, flexShrink: 0,
                            }}>{broker.name?.[0] || "?"}</div>
                            <div>
                              <div style={{ fontWeight: 600, color: colors.text }}>{broker.name}</div>
                              <div style={{ fontSize: 11, color: colors.textMuted }}>{broker.id}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {broker.envId ? (
                            <span style={{ fontSize: 12, color: colors.primary, fontWeight: 500 }}>{broker.envId}</span>
                          ) : (
                            <span style={{ fontSize: 12, color: colors.textMuted }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px", color: colors.text }}>{broker.city}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <Badge variant="muted" size="xs">{broker.language}</Badge>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {broker.productTypes?.split(",").slice(0, 2).map((p, j) => (
                              <Badge key={j} variant="info" size="xs">{p.trim().replace("Life insurance with investment", "Life+").replace("Life insurance without investment", "Life").replace("Non-life insurance", "Non-life")}</Badge>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {broker.strategicInterest ? (
                            <Badge variant={broker.strategicInterest === "High" ? "success" : broker.strategicInterest === "Medium" ? "warning" : "muted"} size="xs">
                              {broker.strategicInterest}
                            </Badge>
                          ) : <span style={{ color: colors.textMuted }}>—</span>}
                        </td>
                        <td style={{ padding: "12px 14px", color: colors.textSecondary, fontSize: 12 }}>{broker.statusDate}</td>
                        <td style={{ padding: "12px 14px" }}>
                          {enrichment ? (
                            <UsageBar score={enrichment.usageScore} />
                          ) : broker.envId ? (
                            <Badge variant="warning" size="xs">Onboarding</Badge>
                          ) : (
                            <Badge variant="muted" size="xs">Inactive</Badge>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                            <Eye size={16} color={colors.textMuted} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              padding: "12px 20px", borderTop: `1px solid ${colors.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ fontSize: 13, color: colors.textSecondary }}>
                {filtered.length} broker{filtered.length !== 1 ? "s" : ""} found
                {(filterCity || filterLanguage || filterQollabi || filterInterest || search) && " (filtered)"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
                  padding: "6px 10px", borderRadius: 6, border: `1px solid ${colors.border}`,
                  background: colors.white, cursor: page === 1 ? "default" : "pointer",
                  opacity: page === 1 ? 0.5 : 1,
                }}>
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>
                  Page {page} of {totalPages || 1}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
                  padding: "6px 10px", borderRadius: 6, border: `1px solid ${colors.border}`,
                  background: colors.white, cursor: page === totalPages ? "default" : "pointer",
                  opacity: page === totalPages ? 0.5 : 1,
                }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panels */}
      <SyncPanel isOpen={syncOpen} onClose={() => setSyncOpen(false)} />
      <EnrichmentPanel
        broker={selectedBroker}
        enrichment={selectedBroker ? ENRICHMENT_DATA[selectedBroker.id] : null}
        socialData={selectedBroker ? SOCIAL_MEDIA_DATA[selectedBroker.id] : null}
        demoData={selectedBroker ? SOCIODEMOGRAPHIC_DATA[selectedBroker.id] : null}
        insurerContacts={selectedBroker ? INSURER_CONTACTS[selectedBroker.id] : null}
        isOpen={!!selectedBroker}
        onClose={() => setSelectedBroker(null)}
      />

      {/* Overlay */}
      {(syncOpen || selectedBroker) && (
        <div onClick={() => { setSyncOpen(false); setSelectedBroker(null); }}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.3)", zIndex: 999 }}
        />
      )}
    </div>
  );
}
