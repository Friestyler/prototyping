"use client"

import { useState } from "react"
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { MasterCustomer } from "@/lib/customer-database"
import { getCarrierEntries, type CarrierEntry } from "@/lib/carrier-entries-store"

type SortKey =
  | "dossierNumber"
  | "customerType"
  | "firstName"
  | "lastName"
  | "dateOfBirth"
  | "address"
  | "products"
  | "insurer"
  | "policy"
  | "openAmount"
  | "paymentStatus"
type SortDir = "asc" | "desc"

interface ColumnDef {
  key: SortKey
  label: string
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: "dossierNumber", label: "Customer ID" },
  { key: "customerType", label: "Customer Type" },
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "dateOfBirth", label: "Date of Birth" },
  { key: "address", label: "Address" },
  { key: "products", label: "Products" },
]

/**
 * Compact column set used by the shared "Payment reminders & churn" list, so
 * the broker sees the carrier signal (insurer + policy number) at a glance
 * instead of scrolling past portfolio columns that aren't relevant for this
 * cohort. The Customer ID column is dropped because synthesized rows have
 * generated IDs that aren't useful here.
 */
const PAYMENT_REMINDER_COLUMNS: ColumnDef[] = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "insurer", label: "Insurer" },
  { key: "policy", label: "Policy" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "openAmount", label: "Open Amount" },
  { key: "address", label: "Address" },
]

export type CustomerTableVariant = "default" | "payment-reminders"

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const PREVIEW_VISIBLE_ROWS = 12

interface CustomerTableProps {
  customers: MasterCustomer[]
  /**
   * Read-only preview: first 12 rows visible, remainder faded under a gradient.
   * No sorting or pagination — used by the Priority Recommendations cards.
   */
  previewMode?: boolean
  /** Retained for backward compatibility; no longer rendered inside the table. */
  onSave?: () => void
  /**
   * Switches to the payment-reminders column set (Insurer + Policy w/ "+N"
   * suffix). Driven by the carrier-entries sidecar — each customer can carry
   * any number of `(insurer, policy)` pairs.
   */
  variant?: CustomerTableVariant
}

export function CustomerTable({
  customers,
  previewMode = false,
  variant = "default",
}: CustomerTableProps) {
  if (previewMode) return <PreviewTable customers={customers} variant={variant} />
  return <FullTable customers={customers} variant={variant} />
}

function pickColumns(variant: CustomerTableVariant): ColumnDef[] {
  return variant === "payment-reminders" ? PAYMENT_REMINDER_COLUMNS : DEFAULT_COLUMNS
}

function carrierEntriesFor(c: MasterCustomer): CarrierEntry[] {
  return getCarrierEntries(c.recordId)
}

function uniqueInsurers(entries: CarrierEntry[]): string {
  const seen = new Set<string>()
  const out: string[] = []
  for (const e of entries) {
    if (!seen.has(e.insurer)) {
      seen.add(e.insurer)
      out.push(e.insurer)
    }
  }
  return out.join(", ") || "—"
}

/** Format the policy column: first policy number, plus "+N" if there are more. */
function formatPolicies(entries: CarrierEntry[]): string {
  if (entries.length === 0) return "—"
  if (entries.length === 1) return entries[0].policyNumber
  return `${entries[0].policyNumber} +${entries.length - 1}`
}

/**
 * Show the most recent payment status; if multiple distinct statuses exist
 * across this customer's policies, append "+N" so the broker can see at a
 * glance that there's variation worth drilling into.
 */
function formatPaymentStatus(entries: CarrierEntry[]): string {
  const statuses = entries.map((e) => e.status?.trim()).filter((s): s is string => !!s)
  if (statuses.length === 0) return "—"
  const unique = Array.from(new Set(statuses))
  if (unique.length === 1) return unique[0]
  return `${unique[0]} +${unique.length - 1}`
}

/** Sum of open amounts across all carrier entries for the customer. */
function totalOpenAmount(entries: CarrierEntry[]): { total: number; currency: string } | null {
  let total = 0
  let currency = ""
  let any = false
  for (const e of entries) {
    if (typeof e.openAmount === "number") {
      total += e.openAmount
      currency = currency || e.currency || "EUR"
      any = true
    }
  }
  return any ? { total, currency: currency || "EUR" } : null
}

function formatOpenAmount(entries: CarrierEntry[]): string {
  const sum = totalOpenAmount(entries)
  if (!sum) return "—"
  try {
    return new Intl.NumberFormat("fr-BE", {
      style: "currency",
      currency: sum.currency,
      maximumFractionDigits: 2,
    }).format(sum.total)
  } catch {
    return `${sum.total.toFixed(2)} ${sum.currency}`
  }
}

function PreviewTable({
  customers,
  variant,
}: {
  customers: MasterCustomer[]
  variant: CustomerTableVariant
}) {
  const visible = customers.slice(0, PREVIEW_VISIBLE_ROWS)
  const hidden = Math.max(0, customers.length - visible.length)
  const columns = pickColumns(variant)

  return (
    <div>
      <div className="relative">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5 w-10">
                <Checkbox disabled />
              </TableHead>
              {columns.map((col) => (
                <TableHead key={col.key} className="select-none">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((c) => {
              const entries = carrierEntriesFor(c)
              return (
                <TableRow key={c.id}>
                  <TableCell className="pl-5">
                    <Checkbox disabled />
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cellClass(col.key)}>
                      {renderCell(c, col.key, entries)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {hidden > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/85 to-transparent" />
        )}
      </div>
    </div>
  )
}

function cellClass(key: SortKey): string {
  switch (key) {
    case "dossierNumber":
      return "font-medium text-gray-900 tabular-nums"
    case "firstName":
    case "lastName":
      return "text-gray-900"
    case "dateOfBirth":
    case "policy":
      return "text-gray-600 tabular-nums"
    case "openAmount":
      return "text-gray-900 tabular-nums"
    default:
      return "text-gray-600"
  }
}

function sortValue(c: MasterCustomer, key: SortKey): string {
  switch (key) {
    case "products":
      return c.products.join(", ")
    case "insurer":
      return uniqueInsurers(carrierEntriesFor(c))
    case "policy":
      return formatPolicies(carrierEntriesFor(c))
    case "openAmount": {
      const sum = totalOpenAmount(carrierEntriesFor(c))
      // Pad so the numeric-aware string compare orders by magnitude across
      // mixed currencies (rare here — the carrier files all use EUR).
      return sum ? sum.total.toFixed(2).padStart(15, "0") : ""
    }
    case "paymentStatus":
      return formatPaymentStatus(carrierEntriesFor(c))
    default:
      return String(c[key as keyof MasterCustomer] ?? "")
  }
}

function renderCell(c: MasterCustomer, key: SortKey, entries: CarrierEntry[]) {
  switch (key) {
    case "dossierNumber":
      return c.dossierNumber
    case "customerType":
      return c.customerType
    case "firstName":
      return c.firstName
    case "lastName":
      return c.lastName || <span className="text-gray-400">—</span>
    case "dateOfBirth":
      return c.dateOfBirth || <span className="text-gray-400">—</span>
    case "address":
      return c.address || <span className="text-gray-400">—</span>
    case "products":
      return c.products.join(", ") || <span className="text-gray-400">—</span>
    case "insurer":
      return uniqueInsurers(entries)
    case "policy":
      return formatPolicies(entries)
    case "openAmount":
      return formatOpenAmount(entries)
    case "paymentStatus": {
      const text = formatPaymentStatus(entries)
      return text === "—" ? <span className="text-gray-400">—</span> : text
    }
  }
}

function FullTable({
  customers,
  variant,
}: {
  customers: MasterCustomer[]
  variant: CustomerTableVariant
}) {
  const columns = pickColumns(variant)
  const [sortKey, setSortKey] = useState<SortKey>(columns[0].key)
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const sorted = [...customers].sort((a, b) => {
    const av = sortValue(a, sortKey)
    const bv = sortValue(b, sortKey)
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" })
    return sortDir === "asc" ? cmp : -cmp
  })

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, total)
  const rows = sorted.slice(from - 1, to)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setPage(1)
  }

  const toggleRow = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const allVisibleSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const toggleAll = () => {
    const next = new Set(selected)
    if (allVisibleSelected) {
      rows.forEach((r) => next.delete(r.id))
    } else {
      rows.forEach((r) => next.add(r.id))
    }
    setSelected(next)
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 text-gray-400" />
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-primary" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary" />
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5 w-10">
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
            </TableHead>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className="cursor-pointer select-none"
                onClick={() => toggleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                  {col.label}
                  <SortIcon col={col.key} />
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => {
            const isSelected = selected.has(c.id)
            const entries = carrierEntriesFor(c)
            return (
              <TableRow key={c.id} data-state={isSelected ? "selected" : undefined}>
                <TableCell className="pl-5">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleRow(c.id)}
                    aria-label={`Select ${c.firstName} ${c.lastName}`}
                  />
                </TableCell>
                {columns.map((col) => (
                  <TableCell key={col.key} className={cellClass(col.key)}>
                    {renderCell(c, col.key, entries)}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-gray-100 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v))
              setPage(1)
            }}
          >
            <SelectTrigger size="sm" className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>Items per page</span>
        </div>

        <div className="text-gray-600 tabular-nums">
          {from} – {to} <span className="text-gray-400">of</span> {total}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(1)}
            disabled={currentPage <= 1}
            aria-label="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setPage(totalPages)}
            disabled={currentPage >= totalPages}
            aria-label="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
