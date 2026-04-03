"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface VoucherContextType {
  unlockedTemplates: Set<string>
  unlockTemplate: (templateId: string) => void
  isTemplateLocked: (templateId: string) => boolean
}

const VoucherContext = createContext<VoucherContextType | undefined>(undefined)

const LOCKED_TEMPLATE_IDS = ["1", "axa-cross-sell", "baloise-renewals"] // Allianz, AXA, Baloise

export function VoucherProvider({ children }: { children: React.ReactNode }) {
  const [unlockedTemplates, setUnlockedTemplates] = useState<Set<string>>(new Set())

  // Load unlocked templates from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("unlocked-templates")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUnlockedTemplates(new Set(parsed))
      } catch (e) {
        console.error("Failed to parse unlocked templates", e)
      }
    }
  }, [])

  const unlockTemplate = (templateId: string) => {
    setUnlockedTemplates((prev) => {
      const next = new Set(prev)
      next.add(templateId)
      // Save to localStorage
      localStorage.setItem("unlocked-templates", JSON.stringify(Array.from(next)))
      return next
    })
  }

  const isTemplateLocked = (templateId: string) => {
    return LOCKED_TEMPLATE_IDS.includes(templateId) && !unlockedTemplates.has(templateId)
  }

  return (
    <VoucherContext.Provider value={{ unlockedTemplates, unlockTemplate, isTemplateLocked }}>
      {children}
    </VoucherContext.Provider>
  )
}

export function useVoucher() {
  const context = useContext(VoucherContext)
  if (!context) {
    throw new Error("useVoucher must be used within VoucherProvider")
  }
  return context
}
