"use client"

import type React from "react"
import { useState } from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Lock, Coins, Loader2 } from "lucide-react"

interface CreditConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: {
    name: string
    description: string
    icon?: React.ReactNode
    logoUrl?: string
  }
  creditCost: number
  currentBalance: number
  onConfirm: () => void
}

export function CreditConfirmationDialog({
  open,
  onOpenChange,
  template,
  creditCost,
  currentBalance,
  onConfirm,
}: CreditConfirmationDialogProps) {
  const [isUnlocking, setIsUnlocking] = useState(false)

  const remainingBalance = currentBalance - creditCost
  const isOverLimit = remainingBalance < 0

  const handleUnlock = async () => {
    setIsUnlocking(true)

    await new Promise((resolve) => setTimeout(resolve, 800))

    onConfirm()
    setIsUnlocking(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {/* Template Header */}
        <DialogHeader className="space-y-4">
          <div className="flex items-start gap-4">
            {/* Template Icon */}
            {template.logoUrl ? (
              <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={template.logoUrl || "/placeholder.svg"} alt="" className="w-10 h-10 object-contain" />
              </div>
            ) : template.icon ? (
              <div className="bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 text-blue-600 h-12 w-12 rounded-xl">
                {template.icon}
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
            )}

            {/* Template Info */}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold mb-2 text-slate-900">{template.name}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-slate-600 text-slate-600">
                {template.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Divider */}
        <div className="border-t border-border my-4" />

        {/* Unlock Required Section */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 h-9 w-9">
              <Lock className="text-slate-600 h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1 text-slate-900 text-sm">Unlock Required</h3>
              <p className="text-sm leading-relaxed text-slate-700">
                This template requires a one-time unlock. After unlocking, you can use it unlimited times with your
                contacts.
              </p>
            </div>
          </div>

          {/* Credit Breakdown */}
          <div className="border border-gray-200 rounded-lg p-6 py-4 px-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Current balance</span>
              <span className="font-semibold text-sm text-slate-900">{currentBalance.toLocaleString()} credits</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Unlock cost</span>
              <span className="font-semibold text-sm text-slate-900">-{creditCost.toLocaleString()} credits</span>
            </div>

            <div className="border-t border-gray-300 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-900 font-medium">Remaining balance</span>
                <span
                  className={`font-bold text-base text-slate-900 ${isOverLimit ? "text-red-600" : "text-foreground"}`}
                >
                  {remainingBalance.toLocaleString()} credits
                </span>
              </div>
            </div>
          </div>

          {/* Over Limit Warning */}
          {isOverLimit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                You'll be charged for the additional credits in your next billing period.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isUnlocking}>
            Cancel
          </Button>
          <Button
            onClick={handleUnlock}
            className="flex-1 bg-[#1a1f2e] hover:bg-[#2a2f3e] text-white"
            disabled={isUnlocking}
          >
            {isUnlocking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Unlocking...
              </>
            ) : (
              <>
                <Coins className="h-4 w-4 mr-2" />
                Unlock
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
