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
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
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
   * When true, renders a read-only preview: first 12 rows visible, the rest
   * faded under a gradient, with a "Save this list to refine results" hint.
   * No sorting, no pagination — used by the Priority Recommendations cards.
   */
  previewMode?: boolean
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
              {COLUMNS.map((col, i) => (
                <TableHead key={col.key} className={cn("select-none", i === 0 && "pl-5")}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="pl-5 font-medium text-gray-900 tabular-nums">{c.dossierNumber}</TableCell>
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

      <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-gray-100 text-sm text-gray-600">
        <Lock className="w-3.5 h-3.5 text-gray-400" />
        <span>
          {hidden > 0 && (
            <>
              Showing {visible.length} of {customers.length} customers ·{" "}
            </>
          )}
          <span className="text-gray-700 font-medium">
            Save this list to view and refine all results with filters
          </span>
        </span>
      </div>
    </div>
  )
}

function FullTable({ customers }: { customers: MasterCustomer[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("dossierNumber")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)

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
            {COLUMNS.map((col, i) => (
              <TableHead
                key={col.key}
                className={cn("cursor-pointer select-none", i === 0 && "pl-5")}
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
          {rows.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="pl-5 font-medium text-gray-900 tabular-nums">{c.dossierNumber}</TableCell>
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
