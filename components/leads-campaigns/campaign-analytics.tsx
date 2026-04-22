"use client"

import { Fragment, useMemo, useState } from "react"
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Mail,
  MailOpen,
  MousePointer,
  Pencil,
  Reply,
  Send,
  Users,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type EventType = "sent" | "delivered" | "opened" | "clicked" | "replied" | "bounced"

interface TimelineEvent {
  type: EventType
  at: Date
  linkUrl?: string
}

interface RecipientAnalytics {
  id: string
  firstName: string
  lastName: string
  email: string
  events: TimelineEvent[]
}

interface CampaignAnalyticsCampaign {
  id: string
  name: string
  status: string
  recipients: number
}

export interface CampaignAnalyticsProps {
  campaign: CampaignAnalyticsCampaign
  onBack: () => void
}

const SAMPLE_NAMES: Array<[string, string, string]> = [
  ["Yanier", "Y", "yanier@qollabi.com"],
  ["Raciel", "R", "raciel@qollabi.com"],
  ["Kami", "s", "kameliakolev@gmail.com"],
  ["kamii", "koleva", "kameliakoleva16@gmail.com"],
  ["bertus", "vano", "bertus.vano@gmail.com"],
  ["Kam work", "qollabi", "kamelia@qollabi.com"],
  ["O'Brien Søren", "O'Brien", "sobrien@example.com"],
  ["Lena", "Peeters", "lena.peeters@example.com"],
  ["Mark", "Janssens", "mark.janssens@example.com"],
  ["Sofie", "De Smet", "sofie.desmet@example.com"],
  ["Pieter", "Maes", "p.maes@example.com"],
  ["Isabel", "Dubois", "i.dubois@example.com"],
]

const SAMPLE_LINKS = [
  "https://qollabi.atlassian.net/jira/software/c/projects/TEC/boards/1",
  "https://brandbroker.com/products/life-insurance",
  "https://brandbroker.com/policies/renew",
  "https://brandbroker.com/contact",
]

function seedFromString(seed: string): () => number {
  // Tiny deterministic PRNG seeded from the campaign id so the same campaign
  // produces the same analytics between renders.
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) % 10000) / 10000
  }
}

function buildRecipients(campaign: CampaignAnalyticsCampaign): RecipientAnalytics[] {
  const count = Math.max(1, campaign.recipients || 0)
  const rand = seedFromString(campaign.id + ":" + count)
  const now = Date.now()

  return Array.from({ length: count }, (_, i) => {
    const seed = SAMPLE_NAMES[i % SAMPLE_NAMES.length]
    const [firstName, lastName, email] =
      i < SAMPLE_NAMES.length
        ? seed
        : [`${seed[0]} ${i + 1}`, seed[1], `${seed[2].replace("@", `+${i}@`)}`]

    const events: TimelineEvent[] = []
    const sentAt = new Date(now - Math.floor(rand() * 60 * 24 * 3600 * 1000))
    events.push({ type: "sent", at: sentAt })

    const bounced = rand() < 0.04
    if (bounced) {
      events.push({ type: "bounced", at: new Date(sentAt.getTime() + 90 * 1000) })
      return { id: `${campaign.id}-r${i}`, firstName, lastName, email, events }
    }

    const deliveredAt = new Date(sentAt.getTime() + 60 * 1000)
    events.push({ type: "delivered", at: deliveredAt })

    const opens = Math.max(0, Math.floor(rand() * 5) - 1)
    let lastOpen: Date | null = null
    for (let k = 0; k < opens; k++) {
      const at = new Date(deliveredAt.getTime() + Math.floor(rand() * 25 * 24 * 3600 * 1000))
      events.push({ type: "opened", at })
      if (!lastOpen || at > lastOpen) lastOpen = at
    }

    if (opens > 0 && rand() < 0.35) {
      const at = new Date((lastOpen ?? deliveredAt).getTime() + Math.floor(rand() * 3600 * 1000))
      events.push({
        type: "clicked",
        at,
        linkUrl: SAMPLE_LINKS[Math.floor(rand() * SAMPLE_LINKS.length)],
      })
    }

    if (opens > 0 && rand() < 0.12) {
      events.push({
        type: "replied",
        at: new Date((lastOpen ?? deliveredAt).getTime() + Math.floor(rand() * 6 * 3600 * 1000)),
      })
    }

    events.sort((a, b) => b.at.getTime() - a.at.getTime())
    return { id: `${campaign.id}-r${i}`, firstName, lastName, email, events }
  })
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatDateTime(d: Date) {
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .toUpperCase()}`
}

function pct(num: number, den: number) {
  if (den === 0) return "0.0%"
  return `${((num / den) * 100).toFixed(1)}%`
}

const EVENT_META: Record<
  EventType,
  { label: string; Icon: typeof Mail; iconBg: string; iconColor: string }
> = {
  sent: { label: "email sent", Icon: Send, iconBg: "#EEF2FF", iconColor: "#4F46E5" },
  delivered: { label: "email delivered", Icon: CheckCircle2, iconBg: "#DCFCE7", iconColor: "#16A34A" },
  opened: { label: "opened email", Icon: MailOpen, iconBg: "#EDE9FE", iconColor: "#7C3AED" },
  clicked: { label: "clicked link", Icon: MousePointer, iconBg: "#FEF3C7", iconColor: "#D97706" },
  replied: { label: "replied", Icon: Reply, iconBg: "#DBEAFE", iconColor: "#2563EB" },
  bounced: { label: "bounced", Icon: XCircle, iconBg: "#FEE2E2", iconColor: "#DC2626" },
}

export default function CampaignAnalytics({ campaign, onBack }: CampaignAnalyticsProps) {
  const recipients = useMemo(() => buildRecipients(campaign), [campaign])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const delivered = recipients.filter((r) => r.events.some((e) => e.type === "delivered")).length
  const opened = recipients.filter((r) => r.events.some((e) => e.type === "opened")).length
  const clicked = recipients.filter((r) => r.events.some((e) => e.type === "clicked")).length
  const replied = recipients.filter((r) => r.events.some((e) => e.type === "replied")).length
  const total = recipients.length

  const stats: Array<{
    label: string
    Icon: typeof Users
    iconBg: string
    iconColor: string
    value: string
    sub?: string
  }> = [
    {
      label: "Recipients",
      Icon: Users,
      iconBg: "#EDE9FE",
      iconColor: "#7C3AED",
      value: String(total),
    },
    {
      label: "Delivered",
      Icon: CheckCircle2,
      iconBg: "#DCFCE7",
      iconColor: "#16A34A",
      value: pct(delivered, total),
      sub: `(${delivered}/${total})`,
    },
    {
      label: "Opened",
      Icon: MailOpen,
      iconBg: "#EDE9FE",
      iconColor: "#7C3AED",
      value: pct(opened, total),
      sub: `(${opened}/${total})`,
    },
    {
      label: "Clicked",
      Icon: MousePointer,
      iconBg: "#FEF3C7",
      iconColor: "#D97706",
      value: pct(clicked, total),
      sub: `(${clicked}/${total})`,
    },
    {
      label: "Replied",
      Icon: Reply,
      iconBg: "#DBEAFE",
      iconColor: "#2563EB",
      value: pct(replied, total),
      sub: `(${replied}/${total})`,
    },
  ]

  return (
    <div className="bg-white min-h-full">
      <div className="px-7 py-2.5 bg-white border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <button
            type="button"
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Back"
          >
            <span className="sr-only">Back</span>
            …
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={onBack}
            className="text-brand hover:underline"
          >
            Campaigns
          </button>
          <span>/</span>
          <span className="text-foreground">{campaign.name}</span>
        </div>
      </div>

      <div className="p-7">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-[22px] font-semibold">{campaign.name}</h1>
          </div>
          <Button>
            <Pencil className="h-[13px] w-[13px]" />
            Edit Campaign
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-3.5 mb-6">
          {stats.map((s) => {
            const Icon = s.Icon
            return (
              <Card key={s.label} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: s.iconBg, color: s.iconColor }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] text-muted-foreground truncate">{s.label}</div>
                      <div className="text-[22px] font-semibold leading-tight tabular-nums">
                        {s.value}
                      </div>
                      {s.sub && (
                        <div className="text-[11px] text-muted-foreground tabular-nums">{s.sub}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10" />
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Bounced</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Clicked</TableHead>
                <TableHead>Replied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map((r) => {
                const sent = r.events.find((e) => e.type === "sent")
                const deliveredEv = r.events.find((e) => e.type === "delivered")
                const bouncedEv = r.events.find((e) => e.type === "bounced")
                const opens = r.events.filter((e) => e.type === "opened")
                const clicks = r.events.filter((e) => e.type === "clicked")
                const replies = r.events.filter((e) => e.type === "replied")
                const lastOpen = opens[0]
                const lastClick = clicks[0]
                const lastReply = replies[0]
                const isOpen = expanded.has(r.id)

                return (
                  <Fragment key={r.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => toggle(r.id)}
                      data-state={isOpen ? "selected" : undefined}
                    >
                      <TableCell className="pl-4 w-10">
                        {isOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{r.firstName}</TableCell>
                      <TableCell className="text-gray-900">{r.lastName}</TableCell>
                      <TableCell className="text-gray-600">{r.email}</TableCell>
                      <TableCell className="tabular-nums">
                        {sent ? (
                          <div>
                            <div className="font-medium text-gray-900">1</div>
                            <div className="text-[11px] text-gray-500">{formatDate(sent.at)}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {deliveredEv ? (
                          <div>
                            <div className="font-medium text-gray-900">1</div>
                            <div className="text-[11px] text-gray-500">
                              {formatDate(deliveredEv.at)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <span className={cn(bouncedEv ? "text-red-600 font-medium" : "text-gray-400")}>
                          {bouncedEv ? 1 : 0}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {opens.length > 0 ? (
                          <div>
                            <div className="font-medium text-gray-900">{opens.length}</div>
                            <div className="text-[11px] text-gray-500">
                              {formatDate(lastOpen.at)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {clicks.length > 0 ? (
                          <div>
                            <div className="font-medium text-gray-900">{clicks.length}</div>
                            <div className="text-[11px] text-gray-500">
                              {formatDate(lastClick.at)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {replies.length > 0 ? (
                          <div>
                            <div className="font-medium text-gray-900">{replies.length}</div>
                            <div className="text-[11px] text-gray-500">
                              {formatDate(lastReply.at)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={10} className="bg-gray-50/60 p-0">
                          <div className="px-10 py-4 space-y-2">
                            {r.events.map((e, i) => {
                              const meta = EVENT_META[e.type]
                              const Icon = meta.Icon
                              return (
                                <div
                                  key={i}
                                  className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3"
                                >
                                  <div
                                    className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: meta.iconBg, color: meta.iconColor }}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm text-gray-900">
                                      <span className="font-medium">
                                        {r.firstName} {r.lastName}
                                      </span>{" "}
                                      <span className="text-gray-500">({r.email})</span>{" "}
                                      <span>{meta.label}</span>
                                      {e.linkUrl && (
                                        <>
                                          {": "}
                                          <a
                                            href={e.linkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-brand hover:underline break-all"
                                          >
                                            {e.linkUrl}
                                          </a>
                                        </>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5 tabular-nums">
                                      {formatDateTime(e.at)}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
