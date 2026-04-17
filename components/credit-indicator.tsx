"use client"

import { useState } from "react"
import { Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCredits } from "@/components/credit-context"
import { CreditDetailsModal } from "@/components/credit-details-modal"
import { FEATURES } from "@/lib/feature-flags"

export function CreditIndicator() {
  const { creditBalance } = useCredits()
  const [showDetails, setShowDetails] = useState(false)

  if (!FEATURES.credits) return null

  const getColorClass = () => {
    if (creditBalance < 0) return "text-red-600"
    if (creditBalance < 20) return "text-amber-600"
    return "text-gray-700"
  }

  const getBgClass = () => {
    if (creditBalance < 0) return "bg-red-50 hover:bg-red-100 border-red-200"
    if (creditBalance < 20) return "bg-amber-50 hover:bg-amber-100 border-amber-200"
    return "bg-white hover:bg-gray-50 border-gray-200"
  }

  return (
    <>
      <Button
        variant="ghost"
        className={cn("gap-2 h-9 px-3 transition-colors border rounded-md", getBgClass())}
        onClick={() => setShowDetails(true)}
      >
        <Coins className={cn("h-4 w-4", getColorClass())} />
        <span className={cn("text-sm font-medium", getColorClass())}>{creditBalance.toLocaleString()}</span>
      </Button>

      <CreditDetailsModal open={showDetails} onOpenChange={setShowDetails} />
    </>
  )
}
