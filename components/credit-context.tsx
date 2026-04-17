"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { FEATURES } from "@/lib/feature-flags"

interface CreditTransaction {
  id: string
  amount: number
  listName: string
  timestamp: Date
  type: "smart_list" | "campaign_template" | "email" // Updated to support multiple transaction types
}

interface CreditContextType {
  creditBalance: number
  creditsUsed: number
  useCredits: (
    amount: number,
    listName: string,
    transactionType: "smart_list" | "campaign_template" | "email",
  ) => boolean
  getCreditBalance: () => number
  getCreditsUsed: () => number
  transactions: CreditTransaction[]
  unlockedTemplates: Set<string>
  unlockTemplate: (templateId: string) => void
  isTemplateUnlocked: (templateId: string) => boolean
}

const CreditContext = createContext<CreditContextType | undefined>(undefined)

const INITIAL_CREDITS = 2000
const BILLING_DAY = 1 // 1st of each month

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const [creditBalance, setCreditBalance] = useState<number>(INITIAL_CREDITS)
  const [creditsUsed, setCreditsUsed] = useState<number>(0)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [unlockedTemplates, setUnlockedTemplates] = useState<Set<string>>(new Set())

  // Load credit data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("credit-data")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setCreditBalance(parsed.balance ?? INITIAL_CREDITS)
        setCreditsUsed(parsed.used ?? 0)
        setTransactions(
          (parsed.transactions || []).map((t: any) => ({
            ...t,
            timestamp: new Date(t.timestamp),
          })),
        )
        setUnlockedTemplates(new Set(parsed.unlockedTemplates || []))
      } catch (e) {
        console.error("Failed to parse credit data", e)
      }
    }
  }, [])

  // Save to localStorage whenever credit state changes
  useEffect(() => {
    const data = {
      balance: creditBalance,
      used: creditsUsed,
      transactions: transactions.map((t) => ({
        ...t,
        timestamp: t.timestamp.toISOString(),
      })),
      unlockedTemplates: Array.from(unlockedTemplates),
    }
    localStorage.setItem("credit-data", JSON.stringify(data))
  }, [creditBalance, creditsUsed, transactions, unlockedTemplates])

  const deductCredits = (
    amount: number,
    listName: string,
    transactionType: "smart_list" | "campaign_template" | "email" = "smart_list",
  ): boolean => {
    if (!FEATURES.credits) return true
    const newBalance = creditBalance - amount
    const newUsed = creditsUsed + amount

    setCreditBalance(newBalance)
    setCreditsUsed(newUsed)

    const transaction: CreditTransaction = {
      id: `tx-${Date.now()}`,
      amount,
      listName,
      timestamp: new Date(),
      type: transactionType,
    }
    setTransactions((prev) => [transaction, ...prev])

    return true
  }

  const unlockTemplate = (templateId: string) => {
    setUnlockedTemplates((prev) => {
      const next = new Set(prev)
      next.add(templateId)
      return next
    })
  }

  const isTemplateUnlocked = (templateId: string) => {
    if (!FEATURES.credits) return true
    return unlockedTemplates.has(templateId)
  }

  const getCreditBalance = () => creditBalance
  const getCreditsUsed = () => creditsUsed

  return (
    <CreditContext.Provider
      value={{
        creditBalance,
        creditsUsed,
        useCredits: deductCredits,
        getCreditBalance,
        getCreditsUsed,
        transactions,
        unlockedTemplates,
        unlockTemplate,
        isTemplateUnlocked,
      }}
    >
      {children}
    </CreditContext.Provider>
  )
}

export function useCredits() {
  const context = useContext(CreditContext)
  if (!context) {
    throw new Error("useCredits must be used within CreditProvider")
  }
  return context
}
