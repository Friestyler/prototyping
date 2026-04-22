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

type SortKey =
  | "dossierNumber"
  | "customerType"
  | "firstName"
  | "lastName"
  | "dateOfBirth"
  | "address"
  | "products"
type SortDir = "asc" | "desc"

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "dossierNumber", label: "Customer ID" },
  { key: "customerType", label: "Customer Type" },
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "dateOfBirth", label: "Date of Birth" },
  { key: "address", label: "Address" },
  { key: "products", label: "Products" },
]

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
}

export function CustomerTable({ customers, previewMode = false }: CustomerTableProps) {
  if (previewMode) return <PreviewTable customers={customers} />
  return <FullTable customers={customers} />
}

function PreviewTable({ customers }: { customers: MasterCustomer[] }) {
  const visible = customers.slice(0, PREVIEW_VISIBLE_ROWS)
  const hidden = Math.max(0, customers.length - visible.length)

  return (
    <div>
      <div className="relative">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5 w-10">
                <Checkbox disabled />
              </TableHead>
              {COLUMNS.map((col) => (
                <TableHead key={col.key} className="select-none">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="pl-5">
                  <Checkbox disabled />
                </TableCell>
                <TableCell className="font-medium text-gray-900 tabular-nums">{c.dossierNumber}</TableCell>
                <TableCell className="text-gray-600">{c.customerType}</TableCell>
                <TableCell className="text-gray-900">{c.firstName}</TableCell>
                <TableCell className="text-gray-900">
                  {c.lastName || <span className="text-gray-400">—</span>}
                </TableCell>
                <TableCell className="text-gray-600 tabular-nums">{c.dateOfBirth}</TableCell>
                <TableCell className="text-gray-600">{c.address}</TableCell>
                <TableCell className="text-gray-600">{c.products.join(", ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {hidden > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/85 to-transparent" />
        )}
      </div>
    </div>
  )
}

function FullTable({ customers }: { customers: MasterCustomer[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("dossierNumber")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const sorted = [...customers].sort((a, b) => {
    const av = sortKey === "products" ? a.products.join(", ") : (a[sortKey] ?? "")
    const bv = sortKey === "products" ? b.products.join(", ") : (b[sortKey] ?? "")
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
            {COLUMNS.map((col) => (
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
            return (
              <TableRow key={c.id} data-state={isSelected ? "selected" : undefined}>
                <TableCell className="pl-5">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleRow(c.id)}
                    aria-label={`Select ${c.firstName} ${c.lastName}`}
                  />
                </TableCell>
                <TableCell className="font-medium text-gray-900 tabular-nums">{c.dossierNumber}</TableCell>
                <TableCell className="text-gray-600">{c.customerType}</TableCell>
                <TableCell className="text-gray-900">{c.firstName}</TableCell>
                <TableCell className="text-gray-900">
                  {c.lastName || <span className="text-gray-400">—</span>}
                </TableCell>
                <TableCell className="text-gray-600 tabular-nums">{c.dateOfBirth}</TableCell>
                <TableCell className="text-gray-600">{c.address}</TableCell>
                <TableCell className="text-gray-600">{c.products.join(", ")}</TableCell>
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
