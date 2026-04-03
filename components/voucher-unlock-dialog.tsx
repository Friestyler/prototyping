"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRound, Gift } from "lucide-react"

interface VoucherUnlockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateName: string
  templateBrand: string
  templateLogoUrl?: string
  templateDescription?: string
  onVoucherApply: (code: string) => void
}

export function VoucherUnlockDialog({
  open,
  onOpenChange,
  templateName,
  templateBrand,
  templateLogoUrl,
  templateDescription,
  onVoucherApply,
}: VoucherUnlockDialogProps) {
  const [voucherCode, setVoucherCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)

  const handleApply = async () => {
    if (!voucherCode.trim()) {
      return
    }

    setIsValidating(true)

    await new Promise((resolve) => setTimeout(resolve, 800))

    onVoucherApply(voucherCode)
    setVoucherCode("")
    onOpenChange(false)
    setIsValidating(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApply()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[620px] px-8 pb-8 pt-7 pl-8 pr-8">
        <DialogHeader>
          <div className="flex items-start gap-4 mb-6">
            {templateLogoUrl && (
              <div className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                <img
                  src={templateLogoUrl || "/placeholder.svg"}
                  alt={`${templateBrand} logo`}
                  className="w-full h-full object-contain p-2"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 tracking-tight">
              <p className="text-gray-500 uppercase font-semibold text-sm tracking-widest mb-1.5">{templateBrand}</p>
              <DialogTitle className="text-2xl text-gray-900 leading-tight font-bold tracking-tight">
                {templateName}
              </DialogTitle>
            </div>
          </div>

          {templateDescription && <p className="text-gray-600 leading-relaxed mb-6 -mt-0.5">{templateDescription}</p>}
        </DialogHeader>

        <div className="space-y-2.5 mt-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <KeyRound className="h-4 w-4 text-slate-500" />
            <h3 className="font-semibold text-base">Enter Voucher Code</h3>
          </div>

          <div className="flex gap-3">
            <Input
              id="voucher-code"
              placeholder={`${templateBrand.toUpperCase()}-2025-CAMPAIGN`}
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-base h-11"
              disabled={isValidating}
            />
            <Button
              onClick={handleApply}
              disabled={isValidating || !voucherCode.trim()}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 h-11 text-base font-medium"
            >
              {isValidating ? "Unlocking..." : "Unlock"}
            </Button>
          </div>

          <p className="text-gray-500 text-xs">Provided by {templateBrand} to access this exclusive template</p>

          <div className="border border-indigo-100 rounded-lg p-4 mt-6 bg-[rgba(237,241,255,0.5)] py-3">
            <div className="flex gap-3">
              <Gift className="text-indigo-600 flex-shrink-0 mt-0.5 w-4 h-4" />
              <p className="text-sm text-gray-700 leading-relaxed">
                Your partner created this ready-to-use campaign for you. Once unlocked, you can customize the content
                and send it to your contacts.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
