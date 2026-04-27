"use client"

import type { SmartListColumn, SmartListWireCustomer } from "@/components/ai-insights-context"

const COLUMN_LABELS: Record<SmartListColumn, string> = {
  products: "Products",
  age: "Age",
  email: "Email",
  premium: "Premium",
  address: "Address",
  dossierNumber: "Dossier",
  customerType: "Type",
}

function ageFromDob(dob?: string | null): string {
  if (!dob) return "—"
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return "—"
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return String(age)
}

function euro(v?: number | null): string {
  if (v == null) return "—"
  return `€${v.toLocaleString("en-BE", { maximumFractionDigits: 0 })}`
}

function cellValue(c: SmartListWireCustomer, col: SmartListColumn): string {
  switch (col) {
    case "products":
      return c.products.join(", ") || "—"
    case "age":
      return ageFromDob(c.dateOfBirth)
    case "email":
      return c.email ?? "—"
    case "premium":
      return euro(c.annualPremium)
    case "address":
      return c.address ?? "—"
    case "dossierNumber":
      return c.dossierNumber
    case "customerType":
      return c.customerType
  }
}

interface Props {
  sample: SmartListWireCustomer[]
  columns: SmartListColumn[]
  matchCount: number
  /** Visual density; the side panel uses "compact". */
  density?: "default" | "compact"
  maxRows?: number
}

/**
 * Table preview of a smart-list artefact.
 *
 * Name column is always first. Additional columns come from the agent's
 * `columns` array; when that's empty we fall back to Products so the card
 * isn't awkwardly one-column while the agent asks the user which columns
 * to show.
 */
export function SmartListPreviewTable({
  sample,
  columns,
  matchCount,
  density = "default",
  maxRows = 4,
}: Props) {
  if (sample.length === 0) return null

  const extraCols = columns.length > 0 ? columns : (["products"] as SmartListColumn[])
  const rows = sample.slice(0, maxRows)
  const rest = matchCount - rows.length

  const isCompact = density === "compact"
  const cellClass = isCompact ? "px-2 py-1 text-[11px]" : "px-3 py-2 text-xs"
  const headCellClass = isCompact
    ? "px-2 py-1 text-[10px] uppercase tracking-wide text-gray-500 font-medium"
    : "px-3 py-1.5 text-[10.5px] uppercase tracking-wide text-gray-500 font-medium"

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
      <table className="w-full border-collapse">
        <thead className="bg-gray-100/60">
          <tr>
            <th className={`${headCellClass} text-left`}>Customer</th>
            {extraCols.map((c) => (
              <th key={c} className={`${headCellClass} text-left`}>
                {COLUMN_LABELS[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((c) => (
            <tr key={c.id}>
              <td className={`${cellClass} text-gray-800 truncate max-w-[180px]`}>
                {c.firstName} {c.lastName ?? ""}
              </td>
              {extraCols.map((col) => (
                <td key={col} className={`${cellClass} text-gray-500 truncate max-w-[200px]`}>
                  {cellValue(c, col)}
                </td>
              ))}
            </tr>
          ))}
          {rest > 0 && (
            <tr>
              <td
                colSpan={1 + extraCols.length}
                className={`${cellClass} text-gray-400`}
              >
                + {rest} more
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
