"use client"

import {
  loadUserCampaigns,
  saveUserCampaign,
  type CampaignIcon,
  type SaveCampaignInput,
  type UserCampaign,
} from "@/lib/user-campaigns"

/**
 * Three default campaigns that mirror the preset Payment Reminder / Mise en
 * demeure smart lists. Created once per workspace via `ensurePresetCampaigns`
 * — re-runs no-op if a campaign already exists for that smartListId, so we
 * don't pile up duplicates on every page load.
 */

interface PresetCampaign extends Omit<SaveCampaignInput, "targetGroup"> {
  smartListId: string
  targetGroup: "Customers"
  icon: CampaignIcon
  iconBg: string
  iconColor: string
  subject: string
  body: string
}

/**
 * Body uses merge tags consumed by the Maily editor at render time:
 *   {{firstName}}, {{lastName}}, {{insurer}}, {{policy}}, {{amount}},
 *   {{dueDate}}, {{brokerName}}, {{brokerPhone}}.
 */
export const PRESET_CAMPAIGNS: PresetCampaign[] = [
  {
    name: "Payment Reminder 1 — Friendly nudge",
    description:
      "First reminder sent to customers whose premium has just become overdue. Tone is warm and assumes a simple oversight.",
    smartListId: "payment-reminder-1",
    targetGroup: "Customers",
    icon: "mail",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    subject: "Quick reminder: your {{insurer}} premium is due",
    body: [
      "Hi {{firstName}},",
      "",
      "Just a quick note from {{brokerName}}. Our records show that the premium for your {{insurer}} policy {{policy}} hasn't reached the insurer yet.",
      "",
      "If you've already paid in the last few days, please ignore this message — payments can take a couple of days to register. Otherwise, the easiest way to settle the {{amount}} is via direct transfer using the structured reference on your invoice.",
      "",
      "Have a question, or noticed something off with your invoice? Just reply to this email and I'll take a look.",
      "",
      "Kind regards,",
      "{{brokerName}}",
      "{{brokerPhone}}",
    ].join("\n"),
  },
  {
    name: "Payment Reminder 2 — Second notice",
    description:
      "Firmer second reminder for customers who didn't respond to the first notice. Makes the consequence of inaction clear without being aggressive.",
    smartListId: "payment-reminder-2",
    targetGroup: "Customers",
    icon: "mail",
    iconBg: "#FED7AA",
    iconColor: "#EA580C",
    subject: "Second reminder — {{insurer}} premium still outstanding",
    body: [
      "Hi {{firstName}},",
      "",
      "I'm reaching out again because the premium for your {{insurer}} policy {{policy}} ({{amount}}) is still showing as unpaid on our side.",
      "",
      "I want to make sure your cover stays active. If the invoice slipped through the cracks, settling it this week is enough to keep everything on track. If something has changed on your end — a banking change, a payment dispute, or financial pressure — please reply or call me directly so we can sort it out together.",
      "",
      "If we don't hear from you, the insurer's next step is a formal mise en demeure, which I'd much rather we avoid.",
      "",
      "Kind regards,",
      "{{brokerName}}",
      "{{brokerPhone}}",
    ].join("\n"),
  },
  {
    name: "Mise en demeure — Personal outreach",
    description:
      "Final personal touch before policy cancellation. Acknowledges the formal notice, signals you're available to help, and asks for a direct response.",
    smartListId: "mise-en-demeure",
    targetGroup: "Customers",
    icon: "mail",
    iconBg: "#FECACA",
    iconColor: "#DC2626",
    subject: "Important: your {{insurer}} policy is at risk of cancellation",
    body: [
      "Hi {{firstName}},",
      "",
      "You'll have received the formal mise en demeure from {{insurer}} regarding policy {{policy}}. I'm writing personally because I'd rather we resolve this together than let your cover lapse.",
      "",
      "The amount outstanding is {{amount}}. Settling it before {{dueDate}} keeps your policy in force and stops the cancellation process. If paying in full isn't realistic right now, there are options — a payment plan, a temporary suspension, or restructuring the cover. I can walk you through them on a quick call.",
      "",
      "Please reply to this email or call me on {{brokerPhone}} so we can find a way forward this week.",
      "",
      "Kind regards,",
      "{{brokerName}}",
    ].join("\n"),
  },
]

/**
 * Create the 3 preset campaigns if they don't already exist for this user.
 * Match is by `smartListId` — that's the stable identifier and survives
 * renames or copy edits. Failures are logged to the console so they show up
 * in DevTools when the API rejects a save (auth, validation, etc.).
 */
export async function ensurePresetCampaigns(): Promise<UserCampaign[]> {
  const existing = await loadUserCampaigns()
  const existingSmartListIds = new Set(
    existing.map((c) => c.smartListId).filter((id): id is string => !!id),
  )

  const created: UserCampaign[] = []
  const failed: string[] = []
  for (const preset of PRESET_CAMPAIGNS) {
    if (existingSmartListIds.has(preset.smartListId)) continue
    const saved = await saveUserCampaign({
      name: preset.name,
      targetGroup: preset.targetGroup,
      description: preset.description,
      smartListId: preset.smartListId,
      subject: preset.subject,
      body: preset.body,
      icon: preset.icon,
      iconBg: preset.iconBg,
      iconColor: preset.iconColor,
    })
    if (saved) {
      created.push(saved)
    } else {
      failed.push(preset.name)
    }
  }
  if (failed.length > 0 && typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.error(
      `[preset-campaigns] failed to create ${failed.length} campaign(s):`,
      failed,
    )
  }
  return created
}
