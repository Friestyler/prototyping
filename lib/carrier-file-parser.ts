/**
 * Shared CSV parsing + header normalization used by carrier-specific
 * extractors (Vivium payment reminders, AXA Chutes, etc).
 *
 * Some carriers ship files with a multi-row preamble (metadata, totals) before
 * the actual header row, so we return ALL rows and let each extractor find its
 * own header position.
 */

/**
 * Minimal CSV parser: `;` / `,` delimiters, quoted fields, escaped quotes, BOM.
 */
export function parseDelimitedRows(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const delimiter = detectDelimiter(src)

  const out: string[][] = []
  let field = ""
  let row: string[] = []
  let inQuotes = false

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
      continue
    }
    if (ch === delimiter) {
      row.push(field)
      field = ""
      continue
    }
    if (ch === "\r") continue
    if (ch === "\n") {
      row.push(field)
      out.push(row)
      row = []
      field = ""
      continue
    }
    field += ch
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    out.push(row)
  }
  return out
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] ?? ""
  const semi = (firstLine.match(/;/g) ?? []).length
  const comma = (firstLine.match(/,/g) ?? []).length
  return semi > comma ? ";" : ","
}

export function normalizeCell(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

export function headerIndex(headers: string[], candidates: string[]): number {
  const norm = headers.map(normalizeCell)
  for (const c of candidates) {
    const i = norm.indexOf(normalizeCell(c))
    if (i !== -1) return i
  }
  return -1
}

/**
 * Scan the first N rows for one that contains every required header (case /
 * diacritic insensitive). Returns the row index, or -1 if not found.
 */
export function findHeaderRowIndex(
  rows: string[][],
  required: string[],
  maxScan = 40,
): number {
  const targets = required.map(normalizeCell)
  const limit = Math.min(rows.length, maxScan)
  for (let i = 0; i < limit; i++) {
    const row = rows[i] ?? []
    const norm = row.map(normalizeCell)
    if (targets.every((t) => norm.includes(t))) return i
  }
  return -1
}
