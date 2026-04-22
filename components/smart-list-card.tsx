"use client"

import type { ReactNode } from "react"
import { Star, Users, Bookmark, Send, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CardAction {
  label: string
  onClick: () => void
  icon?: ReactNode
}

export interface SmartListCardProps {
  name: string
  description?: string
  byLabel?: string
  badge?: string
  /** Optional colour overrides for `badge` (e.g. urgency pills). */
  badgeStyle?: { bg: string; text: string; border?: string }
  rating?: number

  /** Square logo image URL — takes priority over `iconNode`. */
  logoUrl?: string
  /** React element rendered inside the icon container when no logo. */
  iconNode?: ReactNode
  /** Background colour for the icon container. Defaults to brand-tinted. */
  iconBg?: string
  /** Foreground colour for the icon container content. */
  iconColor?: string

  customerCount?: number
  /** Noun shown after the count (e.g. "customers", "leads"). */
  countLabel?: string
  /** Annual EUR amount surfaced in the footer next to the count. */
  dollarValue?: number
  /** Trailing footer text shown after the metrics (e.g. "Edited 17/04/2026"). */
  metaText?: string

  selected?: boolean
  onClick?: () => void

  primaryAction?: CardAction
  secondaryAction?: CardAction

  /** Optional refine-with-AI handler. When provided, wires up the icon's click. */
  onRefine?: () => void
}

function formatNumberCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

export default function SmartListCard({
  name,
  description,
  byLabel,
  badge,
  badgeStyle,
  rating,
  logoUrl,
  iconNode,
  iconBg = "var(--color-brand-light, #EEF2FF)",
  iconColor = "var(--color-primary, #4F46E5)",
  customerCount,
  countLabel = "customers",
  dollarValue,
  metaText,
  selected = false,
  onClick,
  primaryAction,
  secondaryAction,
  onRefine,
}: SmartListCardProps) {
  const showFooter = primaryAction || secondaryAction
  const showMetrics = metaText !== undefined || customerCount !== undefined || dollarValue !== undefined

  return (
    <Card
      className={cn(
        "group relative cursor-pointer transition-all rounded-2xl overflow-hidden border h-full flex flex-col",
        selected
          ? "ring-2 ring-primary ring-offset-2 shadow-xl -translate-y-1 border-transparent"
          : "border-gray-200 hover:shadow-xl hover:-translate-y-1",
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRefine?.()
            }}
            title="Refine with AI"
            aria-label="Refine with AI"
            className="h-7 w-7 inline-flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
          {badge && (
            <Badge
              className="rounded-lg border"
              style={
                badgeStyle
                  ? {
                      backgroundColor: badgeStyle.bg,
                      color: badgeStyle.text,
                      borderColor: badgeStyle.border ?? "transparent",
                    }
                  : undefined
              }
            >
              {badge}
            </Badge>
          )}
        </div>

        {/* Icon / logo */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border border-gray-100 overflow-hidden flex-shrink-0"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={byLabel ? `${byLabel} logo` : `${name} logo`}
              className="w-full h-full object-contain p-2"
            />
          ) : (
            iconNode ?? <Bookmark className="h-6 w-6" />
          )}
        </div>

        {/* Title + description */}
        <h3 className="font-semibold text-base mb-2 line-clamp-2 leading-tight text-gray-900">{name}</h3>
        {description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-snug">{description}</p>
        )}

        {byLabel && (
          <p className="text-xs text-primary font-medium mb-3">{byLabel}</p>
        )}

        {rating !== undefined && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i < Math.floor(rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200",
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{rating}</span>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3">
          {showMetrics && (
            <div className="flex items-center gap-3 text-sm pt-2">
              {customerCount !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-xs">
                    {customerCount.toLocaleString()} {countLabel}
                  </span>
                </div>
              )}
              {dollarValue !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">€</span>
                  <span className="font-medium text-xs">
                    {formatNumberCompact(dollarValue)}
                  </span>
                </div>
              )}
              {metaText !== undefined && (
                <span className="text-xs text-gray-500 ml-auto">{metaText}</span>
              )}
            </div>
          )}

          {showFooter && (
            <div className="flex items-center gap-2">
              {primaryAction && (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    primaryAction.onClick()
                  }}
                >
                  {primaryAction.icon ?? <Bookmark className="h-3 w-3" />}
                  {primaryAction.label}
                </Button>
              )}
              {secondaryAction && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    secondaryAction.onClick()
                  }}
                >
                  {secondaryAction.icon ?? <Send className="h-3 w-3" />}
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
