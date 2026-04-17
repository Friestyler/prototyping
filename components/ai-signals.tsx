"use client"

import { useState, useMemo } from "react"
import {
  Home, Heart, Car, Clock, Moon, Baby,
  Sparkles, Users, TrendingDown, ShieldOff, Layers,
  CheckCircle, ChevronRight, ListPlus, Megaphone,
  X, Send, BookmarkPlus, Zap, ZapOff, ChevronDown,
  ArrowUpDown, AlertTriangle, RotateCcw, UserMinus, Search,
} from "lucide-react"
import { ALL_SIGNALS, SIGNAL_CATEGORIES, type Signal, type CategoryType } from "@/lib/portfolio-intelligence-data"
import { cn } from "@/lib/utils"

function fmtEuro(n: number) {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}k`
  return `€${n}`
}
function fmtCount(n: number) {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

const ICON_MAP: Record<string, React.ElementType> = {
  "home": Home, "heart-pulse": Heart, "car": Car, "clock": Clock,
  "moon": Moon, "baby": Baby, "users-x": Users,
  "trending-down": TrendingDown, "shield-off": ShieldOff, "layers": Layers,
}

type TimeframeDays = 7 | 30 | 60 | 90
type SortKey = "potential" | "confidence" | "urgency"

const URGENCY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const CONFIDENCE: Record<string, number> = {
  "churn-1": 94, "churn-2": 88, "churn-3": 81,
  "xs-1": 87, "xs-2": 79, "xs-3": 76,
  "le-1": 96, "le-2": 91,
  "ren-1": 97, "ren-2": 83,
  "dor-1": 85,
}

// ── Mock customer generator ───────────────────────────────────────────────────
const FIRST_NAMES = ["Thomas", "Marie", "Pieter", "Sophie", "Luc", "Emma", "Jan", "Julie", "Koen", "Laura", "David", "Nathalie", "Stef", "Elien", "Wim", "Charlotte", "Raf", "Ines", "Tim", "Hanne", "Bram", "Katrien", "Joris", "Lies", "Niels"]
const LAST_NAMES  = ["Declercq", "Janssen", "Peeters", "De Smedt", "Claes", "Wouters", "Willems", "Maes", "Leclercq", "Goossens", "Hermans", "Bogaert", "Van Acker", "De Wolf", "Baert", "Desmet", "Stevens", "Cools", "Dubois", "Mertens"]
const PRODUCTS    = ["Auto + Brand", "Auto only", "Brand + BA", "Hospitalisatie", "Auto + Hospitalisatie", "Brand + Schuldsaldo", "BA / Familiale", "Multi-product"]
const CITIES      = ["Gent", "Antwerpen", "Brussel", "Brugge", "Leuven", "Mechelen", "Hasselt", "Kortrijk", "Aalst", "Roeselare"]

function makeCustomers(count: number, signalId: string) {
  // deterministic seed from signal id so customers don't change on re-render
  let seed = signalId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const rng = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return Math.abs(seed) / 0xffffffff }
  return Array.from({ length: Math.min(count, 500) }, (_, i) => ({
    id: `${signalId}-${i}`,
    name: `${FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]}`,
    city: CITIES[Math.floor(rng() * CITIES.length)],
    product: PRODUCTS[Math.floor(rng() * PRODUCTS.length)],
    premium: Math.round((rng() * 3800 + 400) / 10) * 10,
  }))
}

// ── Recipients Dialog ─────────────────────────────────────────────────────────
function RecipientsDialog({ signal, totalCount, excluded, onExcludedChange, onClose }: {
  signal: Signal
  totalCount: number
  excluded: Set<string>
  onExcludedChange: (next: Set<string>) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState("")
  const customers = useMemo(() => makeCustomers(totalCount, signal.id), [totalCount, signal.id])
  const filtered = useMemo(
    () => customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase())),
    [customers, search]
  )
  const activeCount = totalCount - excluded.size

  function toggle(id: string) {
    const next = new Set(excluded)
    next.has(id) ? next.delete(id) : next.add(id)
    onExcludedChange(next)
  }

  function toggleAll() {
    if (excluded.size > 0) {
      onExcludedChange(new Set())
    } else {
      onExcludedChange(new Set(customers.map(c => c.id)))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" style={{ maxHeight: "85vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <UserMinus size={14} className="text-gray-400" />
              <p className="text-[13px] font-semibold text-gray-900">Edit Recipients</p>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              <span className="font-semibold text-gray-700">{activeCount.toLocaleString()}</span> of {totalCount.toLocaleString()} selected
              {excluded.size > 0 && (
                <span className="ml-1.5 text-amber-500">· {excluded.size} removed</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or city..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-100 bg-gray-50 text-[12px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488] focus:border-[#0D9488]"
            />
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <button onClick={toggleAll} className={cn(
            "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
            excluded.size === 0 ? "bg-[#0D9488] border-[#0D9488]" : excluded.size === customers.length ? "border-gray-300" : "bg-gray-200 border-gray-300"
          )}>
            {excluded.size === 0 && <CheckCircle size={10} className="text-white" strokeWidth={3} />}
            {excluded.size > 0 && excluded.size < customers.length && <span className="w-1.5 h-0.5 bg-gray-500 rounded-full" />}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 flex-1">Customer</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 w-20 text-right hidden sm:block">Products</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 w-16 text-right">Premium</span>
        </div>

        {/* Customer list */}
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[12px] text-gray-400">No customers match your search</div>
          ) : (
            filtered.map(c => {
              const isExcluded = excluded.has(c.id)
              return (
                <div
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-gray-50 transition-colors",
                    isExcluded ? "bg-gray-50 opacity-50" : "hover:bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                    isExcluded ? "border-gray-200 bg-white" : "bg-[#0D9488] border-[#0D9488]"
                  )}>
                    {!isExcluded && <CheckCircle size={10} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[12px] font-medium leading-tight truncate", isExcluded ? "text-gray-400 line-through" : "text-gray-800")}>{c.name}</p>
                    <p className="text-[10.5px] text-gray-400">{c.city}</p>
                  </div>
                  <span className="text-[10.5px] text-gray-400 w-20 text-right hidden sm:block truncate">{c.product}</span>
                  <span className={cn("text-[11px] font-semibold w-16 text-right", isExcluded ? "text-gray-300" : "text-gray-700")}>€{c.premium}</span>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          {excluded.size > 0 && (
            <button onClick={() => onExcludedChange(new Set())} className="text-[11.5px] text-gray-400 hover:text-gray-600 transition-colors">
              Reset all
            </button>
          )}
          <div className={cn("ml-auto")}>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-[12px] font-semibold hover:bg-gray-800 transition-colors"
            >
              <CheckCircle size={12} /> Confirm {activeCount.toLocaleString()} recipients
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Draft & Send Modal ────────────────────────────────────────────────────────
const EMAIL_TEMPLATES = ["{{voornaam}}", "{{makelaar}}", "{{product}}"]

function makeContacts(customerName: string, customerIdx: number) {
  const parts = customerName.split(" ")
  const seed = customerName.split("").reduce((a, c) => a + c.charCodeAt(0), customerIdx)
  const rng = (() => { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) / 0xffffffff } })()
  const count = Math.floor(rng() * 3) + 1
  const CONTACT_FIRST = ["Luc", "Marie", "Peter", "Sophie", "Tom", "Anna", "Bart", "Ellen"]
  const CONTACT_LAST  = ["Janssen", "Peeters", "De Smedt", "Willems", "Claes", "Maes"]
  return Array.from({ length: count }, (_, i) => {
    const first = CONTACT_FIRST[Math.floor(rng() * CONTACT_FIRST.length)]
    const last  = CONTACT_LAST[Math.floor(rng() * CONTACT_LAST.length)]
    const hasEmail = rng() > 0.25
    return {
      id: `${customerName}-contact-${i}`,
      name: `${first} ${last}`,
      email: hasEmail ? `${first.toLowerCase()}.${last.toLowerCase().replace(" ", "")}@qollabi.com` : null,
      initials: `${first[0]}${last[0]}`,
    }
  })
}

function DraftAndSendModal({ signal, timeframe, customers, excludedCustomers, onExcludedCustomersChange, onClose, onSent }: {
  signal: Signal
  timeframe: TimeframeDays
  customers: ReturnType<typeof makeCustomers>
  excludedCustomers: Set<string>
  onExcludedCustomersChange: (next: Set<string>) => void
  onClose: () => void
  onSent: () => void
}) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "with" | "without">("all")
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customers[0]?.id ?? null)
  const [excludedContacts, setExcludedContacts] = useState<Set<string>>(new Set())
  const [sent, setSent] = useState(false)

  // Build contacts per customer (memoised)
  const contactMap = useMemo(() => {
    const m: Record<string, ReturnType<typeof makeContacts>> = {}
    customers.forEach((c, i) => { m[c.id] = makeContacts(c.name, i) })
    return m
  }, [customers])

  const filtered = useMemo(() => {
    let list = customers
    if (search) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase()))
    if (filter === "with")    list = list.filter(c => contactMap[c.id]?.some(ct => ct.email))
    if (filter === "without") list = list.filter(c => !contactMap[c.id]?.some(ct => ct.email))
    return list
  }, [customers, search, filter, contactMap])

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)
  const selectedContacts = selectedCustomerId ? (contactMap[selectedCustomerId] ?? []) : []

  function toggleCustomer(id: string) {
    const next = new Set(excludedCustomers)
    next.has(id) ? next.delete(id) : next.add(id)
    onExcludedCustomersChange(next)
  }

  function toggleContact(id: string) {
    const next = new Set(excludedContacts)
    next.has(id) ? next.delete(id) : next.add(id)
    setExcludedContacts(next)
  }

  const activeCustomerCount = customers.length - excludedCustomers.size
  const totalContacts = customers.reduce((acc, c) => acc + (contactMap[c.id]?.filter(ct => ct.email).length ?? 0), 0)
  const activeContacts = totalContacts - excludedContacts.size

  const personaliseBody = (name: string) =>
    signal.campaignBody
      .replace("{{voornaam}}", name.split(" ")[0])
      .replace("{{makelaar}}", "Uw makelaar")
      .replace("{{product}}", "verzekering")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden" style={{ maxWidth: 900, maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Send size={14} className="text-gray-400" />
              <p className="text-[13px] font-semibold text-gray-900">Draft & Send</p>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              <span className="font-semibold text-gray-700">{activeCustomerCount}</span> customers ·{" "}
              <span className="font-semibold text-gray-700">{activeContacts}</span> contacts selected
              {excludedCustomers.size > 0 && <span className="ml-1.5 text-amber-500">· {excludedCustomers.size} customers removed</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        {/* Body — two panes */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — Customer list */}
          <div className="w-64 flex-shrink-0 border-r border-gray-100 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-[11.5px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
            </div>
            {/* Filters */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100">
              {(["all", "with", "without"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn("px-2 py-1 rounded-md text-[10px] font-semibold transition-colors",
                    filter === f ? "bg-[#0D9488] text-white" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}>
                  {f === "all" ? "All" : f === "with" ? "With contacts" : "No contacts"}
                </button>
              ))}
            </div>
            {/* List */}
            <div className="overflow-y-auto flex-1">
              {filtered.map(c => {
                const isExcluded = excludedCustomers.has(c.id)
                const contacts = contactMap[c.id] ?? []
                const withEmail = contacts.filter(ct => ct.email).length
                const isSelected = selectedCustomerId === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-b border-gray-50 transition-colors",
                      isSelected ? "bg-gray-50 border-l-2 border-l-[#0D9488]" : "hover:bg-gray-50 border-l-2 border-l-transparent",
                      isExcluded && "opacity-40"
                    )}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleCustomer(c.id) }}
                      className={cn("w-4 h-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        isExcluded ? "border-gray-200 bg-white" : "bg-[#0D9488] border-[#0D9488]")}
                    >
                      {!isExcluded && <CheckCircle size={9} className="text-white" strokeWidth={3} />}
                    </button>
                    {/* Icon */}
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Users size={12} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-[11.5px] font-semibold truncate", isExcluded ? "text-gray-300 line-through" : "text-gray-800")}>{c.name}</p>
                      <p className="text-[10px] text-gray-400">{withEmail} contact{withEmail !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT — Contacts + email preview */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {!selectedCustomer ? (
              <div className="flex-1 flex items-center justify-center text-[12px] text-gray-300">Select a customer</div>
            ) : (
              <>
                {/* Customer header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Users size={15} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-[11px] text-gray-400">{selectedContacts.length} contact{selectedContacts.length !== 1 ? "s" : ""} · {selectedCustomer.city} · {selectedCustomer.product}</p>
                  </div>
                </div>

                {/* Contact cards */}
                <div className="px-6 py-4 space-y-3">
                  {selectedContacts.map(contact => {
                    const isExcluded = excludedContacts.has(contact.id)
                    const hasEmail = !!contact.email
                    return (
                      <div key={contact.id} className={cn(
                        "rounded-xl border transition-all",
                        isExcluded ? "border-gray-100 bg-gray-50 opacity-50" : hasEmail ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"
                      )}>
                        {/* Contact row */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => hasEmail && toggleContact(contact.id)}
                            disabled={!hasEmail}
                            className={cn("w-4 h-4 rounded-[4px] border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                              !hasEmail ? "border-gray-200 bg-white cursor-not-allowed" :
                              isExcluded ? "border-gray-200 bg-white" : "bg-[#0D9488] border-[#0D9488]")}
                          >
                            {hasEmail && !isExcluded && <CheckCircle size={9} className="text-white" strokeWidth={3} />}
                          </button>
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-gray-500">{contact.initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn("text-[12.5px] font-semibold", isExcluded ? "text-gray-400 line-through" : "text-gray-800")}>{contact.name}</p>
                              {hasEmail ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-green-50 text-green-600 border border-green-100">
                                  Information complete
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                                  No email address
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">{contact.email ?? "No email address"}</p>
                          </div>
                        </div>

                        {/* Email preview */}
                        {hasEmail && !isExcluded && (
                          <div className="mx-4 mb-3 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
                            <p className="text-[9.5px] font-bold uppercase tracking-widest text-gray-300 mb-1">Preview</p>
                            <p className="text-[11px] text-gray-500 mb-1.5">
                              <span className="font-semibold text-gray-600">Subject: </span>{signal.campaignSubject}
                            </p>
                            <p className="text-[10.5px] text-gray-500 leading-relaxed whitespace-pre-line line-clamp-4">
                              {personaliseBody(contact.name)}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button onClick={onClose} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-white transition-colors">
            <BookmarkPlus size={12} /> Save draft
          </button>
          {sent ? (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-50 border border-teal-100">
              <CheckCircle size={13} className="text-[#0D9488]" />
              <span className="text-[12px] font-semibold text-[#0D9488]">Campaign queued</span>
            </div>
          ) : (
            <button
              onClick={() => { setSent(true); setTimeout(() => { onSent(); onClose() }, 1200) }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-[12px] font-semibold hover:bg-gray-800 transition-colors"
            >
              <Send size={12} /> Send to {activeContacts} contacts
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Campaign Modal (simple copy preview) ─────────────────────────────────────
function CampaignModal({ signal, timeframe, onClose, onSent }: {
  signal: Signal; timeframe: TimeframeDays; onClose: () => void; onSent: () => void
}) {
  const [sent, setSent] = useState(false)
  const tf = signal.timeframes.find(t => t.days === timeframe) ?? signal.timeframes.at(-1)!

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0D9488] to-[#0F766E] flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-900">AI Campaign Draft</p>
              <p className="text-[11px] text-gray-400">{fmtCount(tf.clientCount)} customers · {fmtEuro(tf.totalPremiumImpact)} potential</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-1.5">Subject</p>
            <div className="bg-gray-50 rounded-xl px-4 py-2.5 text-[13px] text-gray-700 border border-gray-100">{signal.campaignSubject}</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Message</p>
              <span className="flex items-center gap-1 text-[10px] text-[#0D9488] font-medium"><Sparkles size={9} /> AI generated</span>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-[12px] text-gray-600 leading-relaxed border border-gray-100 whitespace-pre-line max-h-52 overflow-y-auto">
              {signal.campaignBody}
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-2.5">
          {sent ? (
            <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-50 border border-teal-100">
              <CheckCircle size={14} className="text-[#0D9488]" />
              <span className="text-[12px] font-semibold text-[#0D9488]">Campaign queued</span>
            </div>
          ) : (
            <>
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                <BookmarkPlus size={12} /> Save draft
              </button>
              <button onClick={() => { setSent(true); setTimeout(() => { onSent(); onClose() }, 1200) }}
                className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-[12px] font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5">
                <Send size={12} /> Send now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Action Panel (4-step) ─────────────────────────────────────────────────────
function ActionPanel({ signal, timeframe, onCreateSmartList, onLaunched, onClose }: {
  signal: Signal; timeframe: TimeframeDays
  onCreateSmartList?: (name: string, count: number) => void
  onLaunched: () => void
  onClose: () => void
}) {
  const [step, setStep] = useState(1)
  const [showDraftSend, setShowDraftSend] = useState(false)
  const [showRecipients, setShowRecipients] = useState(false)
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [automated, setAutomated] = useState(false)
  const tf = signal.timeframes.find(t => t.days === timeframe) ?? signal.timeframes.at(-1)!
  const activeCount = tf.clientCount - excluded.size
  const activePremium = Math.round(tf.totalPremiumImpact * (activeCount / tf.clientCount))
  const customers = useMemo(() => makeCustomers(tf.clientCount, signal.id), [tf.clientCount, signal.id])

  const STEPS = [{ n: 1, label: "List" }, { n: 2, label: "Copy" }, { n: 3, label: "Review" }, { n: 4, label: "Launch" }]

  return (
    <>
      {showDraftSend && (
        <DraftAndSendModal
          signal={signal}
          timeframe={timeframe}
          customers={customers.filter(c => !excluded.has(c.id))}
          excludedCustomers={excluded}
          onExcludedCustomersChange={setExcluded}
          onClose={() => setShowDraftSend(false)}
          onSent={() => { setStep(4); onLaunched() }}
        />
      )}
      {showRecipients && (
        <RecipientsDialog
          signal={signal}
          totalCount={tf.clientCount}
          excluded={excluded}
          onExcludedChange={setExcluded}
          onClose={() => setShowRecipients(false)}
        />
      )}
      <div className="mt-3 rounded-xl border border-gray-100 bg-[#FAFAFA] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Step bar */}
        <div className="flex items-center border-b border-gray-100 px-4 py-2.5 bg-white">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center">
              <div className={cn("flex items-center gap-1.5 text-[11px] font-semibold",
                step === s.n ? "text-gray-900" : s.n < step ? "text-[#0D9488]" : "text-gray-300")}>
                <span className={cn("w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0",
                  step === s.n ? "bg-gray-900 text-white" : s.n < step ? "bg-[#0D9488] text-white" : "bg-gray-100 text-gray-400")}>
                  {s.n < step ? <CheckCircle size={9} /> : s.n}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight size={11} className="mx-1.5 text-gray-200 flex-shrink-0" />}
            </div>
          ))}
          <button onClick={onClose} className="ml-auto text-gray-300 hover:text-gray-500"><X size={13} /></button>
        </div>

        {/* Step 1 — Create List */}
        {step === 1 && (
          <div className="px-4 py-4">
            <p className="text-[12px] font-semibold text-gray-800 mb-0.5">{signal.suggestedSmartList}</p>
            <p className="text-[11.5px] text-gray-400 mb-3">{fmtCount(tf.clientCount)} customers · {fmtEuro(tf.totalPremiumImpact)} potential</p>
            <button onClick={() => { onCreateSmartList?.(signal.suggestedSmartList, tf.clientCount); setStep(2) }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-semibold hover:bg-gray-800 transition-colors">
              <ListPlus size={12} /> Create Smart List
            </button>
          </div>
        )}

        {/* Step 2 — Review Copy */}
        {step === 2 && (
          <div className="px-4 py-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <CheckCircle size={12} className="text-[#0D9488]" />
              <span className="text-[11px] text-[#0D9488] font-semibold">List added to My Lists</span>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 px-3 py-2.5 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-0.5">Subject</p>
              <p className="text-[12px] text-gray-700">{signal.campaignSubject}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowDraftSend(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-[11.5px] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <Sparkles size={11} className="text-[#0D9488]" /> Edit copy
              </button>
              <button onClick={() => setStep(3)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-[11.5px] font-semibold hover:bg-gray-800 transition-colors">
                Next <ChevronRight size={11} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Audience Review */}
        {step === 3 && (
          <div className="px-4 py-4">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white rounded-lg border border-gray-100 px-3 py-2.5">
                <p className="text-[22px] font-bold text-gray-900 leading-none mb-0.5">{fmtCount(activeCount)}</p>
                <p className="text-[10.5px] text-gray-400">customers{excluded.size > 0 && <span className="ml-1 text-amber-500">({excluded.size} removed)</span>}</p>
              </div>
              <div className="bg-teal-50 rounded-lg border border-teal-100 px-3 py-2.5">
                <p className="text-[22px] font-bold text-[#0D9488] leading-none mb-0.5">{fmtEuro(activePremium)}</p>
                <p className="text-[10.5px] text-teal-500">potential</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {signal.keyReasons.map(r => (
                <span key={r} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-100 text-[10.5px] text-gray-500">
                  <Sparkles size={8} className="text-gray-300 flex-shrink-0" /> {r}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDraftSend(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-[11.5px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <UserMinus size={12} className="text-gray-400" />
                Edit recipients
                {excluded.size > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-semibold">{excluded.size}</span>
                )}
              </button>
              <button onClick={() => setShowDraftSend(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-[11.5px] font-semibold hover:bg-gray-800 transition-colors">
                Looks good <ChevronRight size={11} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Launch */}
        {step === 4 && (
          <div className="px-4 py-4">
            <p className="text-[12px] font-semibold text-gray-800 mb-0.5">Ready to launch</p>
            <p className="text-[11.5px] text-gray-400 mb-3">
              Campaign goes to <span className="text-gray-600 font-medium">{fmtCount(activeCount)} customers</span> from{" "}
              <span className="text-gray-600 font-medium">{signal.suggestedSmartList}</span>.
              {excluded.size > 0 && <span className="ml-1 text-amber-500">{excluded.size} removed.</span>}
            </p>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setShowCampaign(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-[11.5px] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <BookmarkPlus size={11} /> Save draft
              </button>
              <button
                onClick={() => { onLaunched() }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white text-[11.5px] font-semibold hover:opacity-90 transition-opacity">
                <Megaphone size={11} /> Launch Campaign
              </button>
            </div>

            {/* Agentic automation */}
            <div className={cn("rounded-xl border px-3.5 py-3 transition-all", automated ? "bg-teal-50 border-teal-200" : "bg-white border-gray-100")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Zap size={12} className={automated ? "text-[#0D9488]" : "text-gray-400"} />
                    <p className={cn("text-[12px] font-semibold", automated ? "text-[#0D9488]" : "text-gray-700")}>
                      {automated ? "Automation active" : "Automate this signal"}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    {automated
                      ? "Next time this signal fires, the list and campaign run automatically."
                      : "Next time this signal fires, skip the steps and run everything automatically."}
                  </p>
                </div>
                <button onClick={() => setAutomated(!automated)}
                  className={cn("relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200 mt-0.5", automated ? "bg-[#0D9488]" : "bg-gray-200")}>
                  <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200", automated ? "translate-x-4" : "translate-x-0")} />
                </button>
              </div>
              {automated && (
                <button onClick={() => setAutomated(false)} className="mt-2 flex items-center gap-1 text-[10.5px] text-gray-400 hover:text-gray-600 transition-colors">
                  <ZapOff size={10} /> Stop automation
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Signal Card ───────────────────────────────────────────────────────────────
function SignalCard({ signal, timeframe, onCreateSmartList, usedAt }: {
  signal: Signal; timeframe: TimeframeDays
  onCreateSmartList?: (name: string, count: number) => void
  usedAt?: Date
}) {
  const [expanded, setExpanded] = useState(false)
  const [launched, setLaunched] = useState(!!usedAt)
  const [automated, setAutomated] = useState(false)
  const tf = signal.timeframes.find(t => t.days === timeframe) ?? signal.timeframes.at(-1)!
  const catColor = SIGNAL_CATEGORIES.find(c => c.type === signal.categoryType)?.color ?? "#0D9488"
  const IconComp = ICON_MAP[signal.icon] ?? Sparkles
  const confidence = CONFIDENCE[signal.id] ?? 80

  const timeSince = usedAt
    ? (() => {
        const mins = Math.floor((Date.now() - usedAt.getTime()) / 60000)
        if (mins < 60) return `${mins}m ago`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs}h ago`
        return `${Math.floor(hrs / 24)}d ago`
      })()
    : null

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={cn(
        "rounded-2xl cursor-pointer select-none transition-all duration-200 overflow-hidden",
        launched && automated
          ? "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] ring-1 ring-[#0D9488]/20 border-l-4 border-l-[#0D9488]"
          : launched
            ? "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] ring-1 ring-black/5 border-l-4 border-l-teal-200"
            : expanded
              ? "bg-white shadow-md ring-1 ring-black/5"
              : "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_3px_12px_rgba(0,0,0,0.09)] hover:ring-1 hover:ring-black/5"
      )}
    >
      <div className="flex items-start gap-4 p-5">
        {/* Gradient icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${signal.gradient[0]}, ${signal.gradient[1]})` }}
        >
          <IconComp size={19} style={{ color: catColor }} />
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                {/* Category tag */}
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-wide border"
                  style={{
                    color: catColor,
                    backgroundColor: catColor + "14",
                    borderColor: catColor + "30",
                  }}
                >
                  {SIGNAL_CATEGORIES.find(c => c.type === signal.categoryType)?.label ?? signal.categoryType}
                </span>
              </div>
              <p className="text-[13.5px] font-semibold leading-snug text-gray-900">
                {signal.name}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {launched ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-[10px] font-semibold text-[#0D9488] whitespace-nowrap">
                  <CheckCircle size={9} /> Done {timeSince}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-gray-300">{confidence}% confidence</span>
              )}
              <ChevronDown size={14} className={cn("text-gray-300 transition-transform flex-shrink-0", expanded && "rotate-180")} />
            </div>
          </div>

          <p className="text-[12px] text-gray-500 leading-relaxed mb-3 line-clamp-2">{signal.description}</p>

          <div className="flex items-center gap-3">
            <span className="text-[13px] font-bold text-gray-800">
              {fmtCount(tf.clientCount)}{" "}
              <span className="text-[11px] font-normal text-gray-400">customers</span>
            </span>
            <span className="w-px h-3.5 bg-gray-100 block" />
            <span className="text-[13px] font-bold" style={{ color: catColor }}>
              {fmtEuro(tf.totalPremiumImpact)}{" "}
              <span className="text-[11px] font-normal text-gray-400">potential</span>
            </span>
          </div>
        </div>
      </div>

      {/* Launched — post-action panel */}
      {expanded && launched && (
        <div className="px-5 pb-4 pt-0" onClick={e => e.stopPropagation()}>
          {/* Status row */}
          <div className="flex items-center gap-3 mb-3 px-3 py-2.5 rounded-xl bg-teal-50 border border-teal-100">
            <CheckCircle size={14} className="text-[#0D9488] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-teal-800">Campaign sent {timeSince}</p>
              <p className="text-[11px] text-teal-600">Smart list created and campaign launched to {fmtCount(tf.clientCount)} customers.</p>
            </div>
            <button
              onClick={() => setLaunched(false)}
              className="flex items-center gap-1 text-[10.5px] font-medium text-teal-500 hover:text-teal-700 whitespace-nowrap transition-colors"
            >
              <RotateCcw size={10} /> Run again
            </button>
          </div>

          {/* Automation toggle */}
          <div className={cn(
            "flex items-start justify-between gap-3 px-3 py-2.5 rounded-xl border transition-colors",
            automated ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
          )}>
            <div className="flex items-start gap-2.5">
              <Zap size={13} className={cn("flex-shrink-0 mt-0.5", automated ? "text-yellow-400" : "text-gray-400")} />
              <div>
                <p className={cn("text-[12px] font-semibold", automated ? "text-white" : "text-gray-700")}>
                  {automated ? "Automation active" : "Automate this signal"}
                </p>
                <p className={cn("text-[10.5px] leading-relaxed", automated ? "text-gray-400" : "text-gray-400")}>
                  {automated
                    ? "Next time this signal fires, the list and campaign will run automatically."
                    : "Next time this signal fires, skip the steps and run automatically."}
                </p>
                {automated && (
                  <button
                    onClick={() => setAutomated(false)}
                    className="mt-1.5 flex items-center gap-1 text-[10.5px] text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <ZapOff size={10} /> Stop automation
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setAutomated(!automated)}
              className={cn(
                "relative w-9 h-5 rounded-full flex-shrink-0 mt-0.5 transition-colors duration-200",
                automated ? "bg-yellow-400" : "bg-gray-200"
              )}
            >
              <span className={cn(
                "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                automated ? "translate-x-4" : "translate-x-0"
              )} />
            </button>
          </div>
        </div>
      )}

      {/* Action panel — only for non-launched */}
      {expanded && !launched && (
        <div className="px-5 pb-5 pt-0" onClick={e => e.stopPropagation()}>
          <ActionPanel
            signal={signal}
            timeframe={timeframe}
            onCreateSmartList={onCreateSmartList}
            onLaunched={() => setLaunched(true)}
            onClose={() => setExpanded(false)}
          />
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TIMEFRAMES: { label: string; days: TimeframeDays }[] = [
  { label: "7d", days: 7 }, { label: "30d", days: 30 },
  { label: "60d", days: 60 }, { label: "90d", days: 90 },
]

// ── Belgian insurance filter data ─────────────────────────────────────────────
const DOMEINEN = [
  "Auto", "Brand", "BA / Familiale", "Hospitalisatie",
  "Schuldsaldo", "Rechtsbijstand", "Pensioen",
  "Inkomen / Arbeidsongeschiktheid", "Leven", "Cyber",
]

const POLISTYPES = [
  "TAK-21", "TAK-23", "TAK-26",
  "Omnium", "Mini-omnium", "BA Motorvoertuig",
  "Groepsverzekering", "VAPZ", "IPT", "Eenmalige premie",
]

// ── Reusable multi-select dropdown ────────────────────────────────────────────
function FilterDropdown({ label, options, selected, onToggle, onClear, open, onOpen, renderOption }: {
  label: string
  options: string[]
  selected: Set<string>
  onToggle: (v: string) => void
  onClear: () => void
  open: boolean
  onOpen: () => void
  renderOption?: (v: string) => React.ReactNode
}) {
  const active = selected.size > 0
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={onOpen}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border whitespace-nowrap",
          open || active
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
        )}
      >
        {label}
        {active && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/25 text-[9px] font-bold">
            {selected.size}
          </span>
        )}
        <ChevronDown size={11} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-60 bg-white rounded-xl border border-gray-100 shadow-xl z-40 py-1 overflow-y-auto max-h-80">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-300">{label}</span>
            {active && (
              <button onClick={onClear} className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                Clear all
              </button>
            )}
          </div>
          <div className="border-t border-gray-50 mb-0.5" />
          {options.map(opt => {
            const checked = selected.has(opt)
            return (
              <button
                key={opt}
                onClick={() => onToggle(opt)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-[11.5px] transition-colors text-left",
                  checked ? "bg-gray-50 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <span className={cn(
                  "w-3.5 h-3.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                  checked ? "bg-gray-900 border-gray-900" : "border-gray-300"
                )}>
                  {checked && <CheckCircle size={8} className="text-white" strokeWidth={3} />}
                </span>
                <span className="flex-1 min-w-0 truncate">
                  {renderOption ? renderOption(opt) : opt}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface AISignalsProps {
  initialFilter?: string
  onCreateSmartList?: (name: string, clientCount: number) => void
}

export default function AISignals({ onCreateSmartList }: AISignalsProps) {
  const [timeframe, setTimeframe] = useState<TimeframeDays>(30)
  const [signalFilter, setSignalFilter] = useState<Set<string>>(new Set())
  const [domeinFilter, setDomeinFilter] = useState<Set<string>>(new Set())
  const [polistypeFilter, setPolistypeFilter] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>("urgency")
  const [openDropdown, setOpenDropdown] = useState<"signal" | "domein" | "polistype" | null>(null)

  function toggleSignal(v: string) { setSignalFilter(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n }) }
  function toggleDomein(v: string) { setDomeinFilter(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n }) }
  function togglePolistype(v: string) { setPolistypeFilter(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n }) }

  const signalOptions = SIGNAL_CATEGORIES.map(c => c.type)

  const sorted = [...ALL_SIGNALS]
    .filter(s => signalFilter.size === 0 || signalFilter.has(s.categoryType))
    // domein + polistype filters are display-only hints for now (signals don't yet have domain metadata)
    .sort((a, b) => {
      if (sortKey === "urgency") return (URGENCY_ORDER[a.urgency] ?? 9) - (URGENCY_ORDER[b.urgency] ?? 9)
      const tfA = a.timeframes.find(t => t.days === timeframe) ?? a.timeframes.at(-1)!
      const tfB = b.timeframes.find(t => t.days === timeframe) ?? b.timeframes.at(-1)!
      if (sortKey === "potential") return tfB.totalPremiumImpact - tfA.totalPremiumImpact
      return (CONFIDENCE[b.id] ?? 80) - (CONFIDENCE[a.id] ?? 80)
    })

  const totalActive = signalFilter.size + domeinFilter.size + polistypeFilter.size

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]" onClick={() => setOpenDropdown(null)}>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-6 pt-4 pb-3 flex-shrink-0 flex-wrap bg-white">

        {/* --- Three filter dropdowns --- */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">

          {/* 1. Signal type */}
          <FilterDropdown
            label="Signal"
            options={signalOptions}
            selected={signalFilter}
            onToggle={toggleSignal}
            onClear={() => setSignalFilter(new Set())}
            open={openDropdown === "signal"}
            onOpen={() => setOpenDropdown(openDropdown === "signal" ? null : "signal")}
            renderOption={v => {
              const cat = SIGNAL_CATEGORIES.find(c => c.type === v)
              return (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.color ?? "#888" }} />
                  {cat?.label ?? v}
                </span>
              )
            }}
          />

          {/* 2. Domein */}
          <FilterDropdown
            label="Domein"
            options={DOMEINEN}
            selected={domeinFilter}
            onToggle={toggleDomein}
            onClear={() => setDomeinFilter(new Set())}
            open={openDropdown === "domein"}
            onOpen={() => setOpenDropdown(openDropdown === "domein" ? null : "domein")}
          />

          {/* 3. Polistype */}
          <FilterDropdown
            label="Polistype"
            options={POLISTYPES}
            selected={polistypeFilter}
            onToggle={togglePolistype}
            onClear={() => setPolistypeFilter(new Set())}
            open={openDropdown === "polistype"}
            onOpen={() => setOpenDropdown(openDropdown === "polistype" ? null : "polistype")}
          />

          {/* Active filter chips */}
          {[...signalFilter].map(v => {
            const cat = SIGNAL_CATEGORIES.find(c => c.type === v)
            return (
              <span key={v} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[10.5px] font-semibold border"
                style={{ color: cat?.color, backgroundColor: (cat?.color ?? "#888") + "18", borderColor: (cat?.color ?? "#888") + "35" }}>
                {cat?.label ?? v}
                <button onClick={e => { e.stopPropagation(); toggleSignal(v) }} className="ml-0.5 rounded-full hover:bg-black/10 p-0.5"><X size={9} /></button>
              </span>
            )
          })}
          {[...domeinFilter].map(v => (
            <span key={v} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 border border-blue-100 text-blue-600">
              {v}
              <button onClick={e => { e.stopPropagation(); toggleDomein(v) }} className="ml-0.5 rounded-full hover:bg-blue-100 p-0.5"><X size={9} /></button>
            </span>
          ))}
          {[...polistypeFilter].map(v => (
            <span key={v} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[10.5px] font-semibold bg-violet-50 border border-violet-100 text-violet-600">
              {v}
              <button onClick={e => { e.stopPropagation(); togglePolistype(v) }} className="ml-0.5 rounded-full hover:bg-violet-100 p-0.5"><X size={9} /></button>
            </span>
          ))}

          {/* Clear all */}
          {totalActive > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setSignalFilter(new Set()); setDomeinFilter(new Set()); setPolistypeFilter(new Set()) }}
              className="text-[10.5px] text-gray-400 hover:text-gray-600 transition-colors px-1"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <ArrowUpDown size={11} className="text-gray-300" />
          {(["urgency", "potential", "confidence"] as SortKey[]).map(k => (
            <button key={k} onClick={() => setSortKey(k)}
              className={cn("px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap",
                sortKey === k ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700")}>
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>

        {/* Timeframe */}
        <div className="flex items-center gap-0 bg-white rounded-lg border border-gray-200 p-0.5 flex-shrink-0">
          {TIMEFRAMES.map(tf => (
            <button key={tf.days} onClick={() => setTimeframe(tf.days)}
              className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap",
                timeframe === tf.days ? "bg-gray-900 text-white shadow-sm" : "text-gray-400 hover:text-gray-700")}>
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 bg-card">
        <div className="space-y-2.5">
          {sorted.map(signal => (
            <SignalCard
              key={signal.id}
              signal={signal}
              timeframe={timeframe}
              onCreateSmartList={onCreateSmartList}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
