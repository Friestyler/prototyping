"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCredits } from "@/components/credit-context"
import { Zap, Coins, Calendar, List, AlertTriangle, CheckCircle2, Mail, Layers } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CreditDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreditDetailsModal({ open, onOpenChange }: CreditDetailsModalProps) {
  const { creditBalance, creditsUsed, transactions } = useCredits()

  const getNextBillingDate = () => {
    const now = new Date()
    const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1
    const year = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
    return new Date(year, nextMonth, 1)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTransactionInfo = (tx: any) => {
    if (tx.type === "campaign_template") {
      return { badge: "Campaign Template", icon: Layers, color: "bg-purple-100 text-purple-700" }
    } else if (tx.type === "email") {
      return { badge: "Email sent", icon: Mail, color: "bg-blue-100 text-blue-700" }
    } else {
      return { badge: "Smart List", icon: List, color: "bg-primary/10 text-primary" }
    }
  }

  const nextBilling = getNextBillingDate()
  const isNegative = creditBalance < 0

  const mockTransactions = [
    {
      id: "demo-1",
      listName: "Customer Renewal Campaign",
      amount: 1000,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: "campaign_template" as const,
    },
    {
      id: "demo-2",
      listName: "john.doe@example.com",
      amount: 1,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      type: "email" as const,
    },
    {
      id: "demo-3",
      listName: "Premium Cross-sell Campaign",
      amount: 1000,
      timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
      type: "campaign_template" as const,
    },
    {
      id: "demo-4",
      listName: "sarah.smith@example.com",
      amount: 1,
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      type: "email" as const,
    },
  ]

  const displayTransactions = [...transactions, ...mockTransactions].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[896px] max-h-[85vh] flex flex-col">
        <DialogHeader className="space-y-1 pb-4">
          <DialogTitle className="text-2xl font-semibold tracking-tight">Credits</DialogTitle>
          <p className="text-sm text-muted-foreground">Manage your credit balance and view transaction history</p>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-6">
            {/* Current Balance Card */}
            <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isNegative ? "bg-red-50" : "bg-primary/10"}`}>
                    <Zap className={`h-4 w-4 ${isNegative ? "text-red-600" : "text-primary"}`} />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Balance</span>
                </div>
                <div>
                  <p className={`text-3xl font-bold tracking-tight ${isNegative ? "text-red-600" : "text-foreground"}`}>
                    {creditBalance.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">credits available</p>
                </div>
              </div>
              {isNegative && (
                <div className="absolute top-3 right-3">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              )}
            </div>

            {/* Used This Period Card */}
            <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-muted">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Used</span>
                </div>
                <div>
                  <p className="text-3xl font-bold tracking-tight text-foreground">{creditsUsed.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">this billing period</p>
                </div>
              </div>
              {creditsUsed > 0 && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
          </div>

          {isNegative && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-red-900">Over credit limit</p>
                <p className="text-sm text-red-800 leading-relaxed">
                  You'll be charged <span className="font-semibold">€{Math.abs(creditBalance)}</span> on your next
                  invoice ({formatDate(nextBilling)})
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Transaction History</h3>
                <p className="text-sm text-muted-foreground">Recent credit usage activity</p>
              </div>
            </div>

            {displayTransactions.length > 0 ? (
              <ScrollArea className="h-[280px] rounded-xl border bg-muted/30">
                <div className="p-3 space-y-2">
                  {displayTransactions.map((tx) => {
                    const info = getTransactionInfo(tx)
                    const IconComponent = info.icon

                    return (
                      <div
                        key={tx.id}
                        className="flex items-start gap-4 p-4 bg-background rounded-lg border hover:shadow-sm transition-all"
                      >
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-lg ${info.color} flex-shrink-0`}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground leading-tight">{tx.listName}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant="secondary" className="text-xs font-normal px-2 py-0">
                                  {info.badge}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-base font-semibold text-red-600">-{tx.amount}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDateTime(tx.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border-2 border-dashed bg-muted/30">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Coins className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No transactions yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                  When you unlock smart lists with credits, they'll appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
