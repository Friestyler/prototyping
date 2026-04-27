"use client"

import { useRef, useState } from "react"
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  detectInsurer as detectViviumInsurer,
  extractFor as extractVivium,
  parseDelimited,
  type PaymentReminderRow,
} from "@/lib/payment-reminder-extractors"
import { savePaymentReminderUpload } from "@/lib/payment-reminders-store"
import {
  detectAxaChutes,
  extractAxaChutes,
  type AxaChuteRow,
} from "@/lib/axa-chutes-extractor"
import { saveAxaChutesUpload } from "@/lib/axa-chutes-store"
import {
  resolveOrImportCustomers,
  type ImportCandidate,
} from "@/lib/imported-customers-store"
import {
  PAYMENT_REMINDER_LISTS,
  computeListCustomerIds,
} from "@/lib/payment-reminder-lists"

/**
 * Supported carrier-file formats. Each one binds an extractor + matcher; the
 * AXA logic is preserved here even though the AXA-specific upload card was
 * removed — the broker drops any payment-reminder file into this single
 * block and we route it based on detection.
 */
type FileKind = "vivium" | "axa-chutes"

interface FileFormat {
  kind: FileKind
  label: string
  /** Shown under the dropdown when this format is the active choice. */
  hint?: string
}

const FORMATS: FileFormat[] = [
  { kind: "vivium", label: "Vivium · Payment reminders" },
  { kind: "axa-chutes", label: "AXA · Chutes (churned policies)" },
]

interface PendingFile {
  filename: string
  allRows: string[][]
  detected: FileKind | null
  confidence: number
}

interface Props {
  onOpenSavedList?: (listId: string) => void
}

export function PaymentRemindersUpload({ onOpenSavedList }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pending, setPending] = useState<PendingFile | null>(null)
  const [chosenKind, setChosenKind] = useState<FileKind>("vivium")

  const openPicker = () => inputRef.current?.click()

  async function handleFile(file: File) {
    setParsing(true)
    try {
      const name = file.name.toLowerCase()
      if (!name.endsWith(".csv")) {
        toast({
          title: "Format not yet supported",
          description: "Upload the CSV export — PDF/Excel parsing is on the roadmap.",
        })
        return
      }
      const text = await readCarrierFile(file)
      const allRows = parseDelimited(text)
      if (allRows.length === 0) {
        toast({ title: "Couldn't read the file", description: "File looks empty." })
        return
      }
      // AXA Chutes has a multi-row preamble + a very specific header signature,
      // so test it first. Vivium's signature lives in row 0 and is checked next.
      const axa = detectAxaChutes(allRows, file.name)
      const vivium = detectViviumInsurer(allRows, file.name)
      let detected: FileKind | null = null
      let confidence = 0
      if (axa.confidence >= vivium.confidence && axa.matched) {
        detected = "axa-chutes"
        confidence = axa.confidence
      } else if (vivium.insurer === "vivium" && vivium.confidence >= 0.5) {
        detected = "vivium"
        confidence = vivium.confidence
      }
      setChosenKind(detected ?? "vivium")
      setPending({ filename: file.name, allRows, detected, confidence })
    } finally {
      setParsing(false)
    }
  }

  async function confirmExtract() {
    if (!pending) return
    setSaving(true)
    try {
      const result =
        chosenKind === "axa-chutes"
          ? await runAxaChutes(pending)
          : await runVivium(pending)

      if (!result) return

      setPending(null)
      const { customerIds, matchedFromPortfolio, label } = result
      const imported = customerIds.length - matchedFromPortfolio
      toast({
        title: `Imported ${customerIds.length} customer${customerIds.length === 1 ? "" : "s"} from ${label}`,
        description: `${matchedFromPortfolio} matched portfolio, ${imported} new. Customers now flow into the Payment Reminder lists based on their status.`,
      })
      onOpenSavedList?.(pickRedirectListId())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/20 p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center">
          <Bell className="h-4 w-4 text-amber-700" />
        </div>
        <span className="text-[11px] font-semibold tracking-wide uppercase text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
          Payment reminders
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Reminders</h3>
      <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">
        Upload the payment reminder document from the insurer here (Vivium, AXA…).
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={async (e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) await handleFile(f)
        }}
        className={cn(
          "rounded-xl border-2 border-dashed py-8 flex flex-col items-center justify-center mb-3 transition-colors",
          dragOver ? "border-amber-400 bg-amber-50" : "border-amber-300 bg-amber-50/40",
        )}
      >
        {parsing ? (
          <>
            <Loader2 className="h-5 w-5 text-amber-700 mb-1.5 animate-spin" />
            <span className="text-sm font-medium text-amber-800">Reading file…</span>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-amber-700 mb-1.5" />
            <span className="text-sm font-medium text-amber-800">
              Drag a CSV, PDF, or Excel file here
            </span>
            <span className="text-[11px] text-amber-700/80 mt-1">
              CSV parsing is live · PDF/Excel coming soon
            </span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.pdf,.xls,.xlsx"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) await handleFile(f)
          e.target.value = ""
        }}
      />
      <Button
        className="w-full bg-amber-600 hover:bg-amber-700"
        onClick={openPicker}
        disabled={parsing}
      >
        Or Browse Files
      </Button>

      <Dialog open={!!pending} onOpenChange={(v) => !v && setPending(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-700" />
              Confirm the insurer
            </DialogTitle>
          </DialogHeader>
          {pending && (
            <div className="space-y-3 pt-1">
              <div className="text-[12.5px] text-muted-foreground">
                <span className="font-medium text-foreground">{pending.filename}</span>
                <span> · {pending.allRows.length} rows</span>
              </div>

              {pending.detected ? (
                <div className="flex items-start gap-2 text-[13px] bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg px-3 py-2.5">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    We found that this document is a{" "}
                    <span className="font-semibold">{labelFor(pending.detected)}</span>{" "}
                    file. Is this correct, or choose another?
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-[13px] bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    We couldn&apos;t confidently identify the insurer. Please pick one.
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[12px] font-medium">Format</label>
                <Select value={chosenKind} onValueChange={(v) => setChosenKind(v as FileKind)}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f.kind} value={f.kind}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={confirmExtract} disabled={saving}>
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Extract &amp; update list
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function labelFor(kind: FileKind): string {
  return FORMATS.find((f) => f.kind === kind)?.label ?? kind
}

/**
 * Read a carrier file as text, falling back to Windows-1252 (Latin-1) when
 * the bytes don't decode as UTF-8. Belgian carriers ship CSVs in Windows-1252
 * — without this, every accented character becomes "�" and breaks both the
 * extracted names ("Gérard" → "G�rard") and the classifier's regexes
 * ("Dernière lettre de rappel").
 */
async function readCarrierFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder("windows-1252").decode(buffer)
  }
}

interface ExtractionOutcome {
  customerIds: number[]
  matchedFromPortfolio: number
  label: string
}

async function runVivium(pending: PendingFile): Promise<ExtractionOutcome | null> {
  const extracted = extractVivium("vivium", pending.allRows)
  if (extracted.length === 0) {
    toast({
      title: "No rows extracted",
      description: "We couldn't map Vivium's columns to our schema.",
    })
    return null
  }

  const { customerIds, matchedFromPortfolio } = resolveOrImportCustomers(
    viviumCandidates(extracted),
    matchByEmail,
  )

  savePaymentReminderUpload({
    savedListId: "preset-payment-reminders",
    insurer: "vivium",
    insurerLabel: "Vivium",
    filename: pending.filename,
    uploadedAt: new Date().toISOString(),
    rows: extracted,
  })

  return { customerIds, matchedFromPortfolio, label: "Vivium" }
}

async function runAxaChutes(pending: PendingFile): Promise<ExtractionOutcome | null> {
  const extracted = extractAxaChutes(pending.allRows)
  if (extracted.length === 0) {
    toast({
      title: "No rows extracted",
      description:
        "We couldn't find the AXA Chutes columns (No de contrat, Statut, Date de fin).",
    })
    return null
  }

  const { customerIds, matchedFromPortfolio } = resolveOrImportCustomers(
    axaCandidates(extracted),
    matchByName,
  )

  saveAxaChutesUpload({
    savedListId: "preset-payment-reminders",
    filename: pending.filename,
    uploadedAt: new Date().toISOString(),
    rows: extracted,
  })

  return { customerIds, matchedFromPortfolio, label: "AXA" }
}

/**
 * Pick the preset list with the most newly-imported customers — the most
 * useful destination for the redirect after an upload. Falls back to PR1.
 */
function pickRedirectListId(): string {
  let best: { id: string; count: number } = {
    id: PAYMENT_REMINDER_LISTS[0].id,
    count: -1,
  }
  for (const spec of PAYMENT_REMINDER_LISTS) {
    const count = computeListCustomerIds(spec).length
    if (count > best.count) best = { id: spec.id, count }
  }
  return best.id
}

// ── Vivium candidate + matcher ─────────────────────────────────────────────
function viviumCandidates(rows: PaymentReminderRow[]): ImportCandidate[] {
  const uploadedAt = new Date().toISOString()
  return rows.map((r) => {
    const email = r.email?.trim().toLowerCase()
    const dossierNumber = email
      ? `VIVIUM-EMAIL-${email}`
      : `VIVIUM-POLICY-${r.policyExternalId}`
    return {
      dossierNumber,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email || undefined,
      address: r.address,
      products: ["Vivium"],
      customerType: "Natural person",
      carrierEntry: {
        insurer: "Vivium",
        policyNumber: r.policyExternalId,
        uploadedAt,
        status: r.etatNonPaiement || undefined,
        actionDate: r.dateAction || undefined,
      },
    }
  })
}

const matchByEmail: (
  candidate: ImportCandidate,
  portfolio: ReadonlyArray<{ email?: string; recordId: number }>,
) => number | null = (candidate, portfolio) => {
  const key = (candidate.email ?? "").toLowerCase().trim()
  if (!key) return null
  for (const c of portfolio) {
    if (c.email && c.email.toLowerCase().trim() === key) return c.recordId
  }
  return null
}

// ── AXA candidate + matcher ────────────────────────────────────────────────
function axaCandidates(rows: AxaChuteRow[]): ImportCandidate[] {
  const uploadedAt = new Date().toISOString()
  return rows.map((r) => {
    const fn = r.firstName.toLowerCase().trim()
    const ln = r.lastName.toLowerCase().trim()
    const dossierNumber = r.firstName
      ? `AXA-NAME-${ln}-${fn}`
      : `AXA-POLICY-${r.policyExternalId}`
    return {
      dossierNumber,
      firstName: r.firstName || r.fullName || "Unknown",
      lastName: r.lastName || "",
      email: undefined,
      products: r.product ? [r.product] : [],
      customerType: !r.firstName && !!r.lastName ? "Legal entity" : "Natural person",
      carrierEntry: {
        insurer: "AXA",
        policyNumber: r.policyExternalId,
        uploadedAt,
        status: r.statusDescription || undefined,
        actionDate: r.churnDate || undefined,
      },
    }
  })
}

const matchByName: (
  candidate: ImportCandidate,
  portfolio: ReadonlyArray<{ firstName?: string; lastName?: string; recordId: number }>,
) => number | null = (candidate, portfolio) => {
  if (!candidate.firstName || !candidate.lastName) return null
  const fn = candidate.firstName.toLowerCase().trim()
  const ln = candidate.lastName.toLowerCase().trim()
  for (const c of portfolio) {
    if (
      (c.firstName ?? "").toLowerCase().trim() === fn &&
      (c.lastName ?? "").toLowerCase().trim() === ln
    ) {
      return c.recordId
    }
  }
  return null
}
