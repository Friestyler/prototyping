/**
 * Streamable HTTP MCP endpoint at /api/mcp.
 *
 * Auth: Bearer api_key (resolved against the `users` table). The web app does
 * not call this endpoint — it goes through /api/smart-lists directly.
 */

import { createMcpHandler, withMcpAuth } from "mcp-handler"
import { z } from "zod"
import { ALL_MASTER_CUSTOMERS } from "@/lib/customer-database"
import { SMART_LIST_USE_CASES, findSmartListUseCase } from "@/lib/smart-list-use-cases"
import { customerToWire, filterCustomers } from "@/lib/customer-filter"
import {
  createSmartList,
  deleteSmartList,
  getSmartList,
  listSmartLists,
  updateSmartList,
} from "@/lib/db/smart-lists"
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
} from "@/lib/db/campaign-templates"
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  updateCampaign,
} from "@/lib/db/campaigns"
import { findUserByApiKey } from "@/lib/db/users"
import { leads as STATIC_LEADS } from "@/lib/lc-data/leads"

export const runtime = "nodejs"
export const maxDuration = 60

const customerFilterShape = {
  query: z.string().optional().describe("Case-insensitive substring against name, address, dossier, email."),
  customerType: z.enum(["Natural person", "Legal entity"]).optional(),
  productsAny: z.array(z.string()).optional().describe("Match if customer carries ANY of these products."),
  productsAll: z.array(z.string()).optional().describe("Match only if customer carries ALL of these products."),
  productsNone: z.array(z.string()).optional().describe("Exclude customers carrying ANY of these products."),
  minPremium: z.number().optional().describe("Minimum annual premium in EUR."),
  maxPremium: z.number().optional().describe("Maximum annual premium in EUR."),
  bornAfter: z.string().optional().describe("YYYY-MM-DD lower bound for date of birth."),
  bornBefore: z.string().optional().describe("YYYY-MM-DD upper bound for date of birth."),
  limit: z.number().int().min(1).max(500).optional(),
}

function asJson(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] }
}

function asError(message: string) {
  return { isError: true, content: [{ type: "text" as const, text: message }] }
}

function userIdFrom(extra: { authInfo?: { extra?: Record<string, unknown> } }): string | null {
  const id = extra.authInfo?.extra?.userId
  return typeof id === "string" ? id : null
}

const mcpHandler = createMcpHandler(
  (server) => {
    // ─── Catalogue / read-only tools ─────────────────────────────────────────

    server.registerTool(
      "list_smart_lists",
      {
        description:
          "List the built-in Priority Recommendations smart-list use cases. Returns id, title, type (prevents_churn / drives_growth), match %, client count, at-risk / growth-potential EUR, description.",
      },
      async () =>
        asJson(
          SMART_LIST_USE_CASES.map((uc) => ({
            id: uc.id,
            title: uc.title,
            type: uc.type,
            matchPct: uc.matchPct,
            clientCount: uc.clientCount,
            atRiskEuros: uc.atRiskEuros,
            growthPotentialEuros: uc.growthPotentialEuros,
            description: uc.description,
            comingSoon: uc.comingSoon ?? false,
            sourceUseCase: uc.sourceUseCase,
          })),
        ),
    )

    server.registerTool(
      "get_smart_list",
      {
        description:
          "Fetch a built-in smart list by id with the full roster of matching customers.",
        inputSchema: {
          id: z.string().describe(
            "One of: payment-reminders, first-car-teen-drivers, no-life-insurance, price-increase-no-contact, top-50-churn-ml.",
          ),
        },
      },
      async ({ id }) => {
        const uc = findSmartListUseCase(id)
        if (!uc) {
          return asError(
            `No built-in smart list with id '${id}'. Valid ids: ${SMART_LIST_USE_CASES.map((u) => u.id).join(", ")}.`,
          )
        }
        return asJson({
          id: uc.id,
          title: uc.title,
          type: uc.type,
          description: uc.description,
          matchPct: uc.matchPct,
          clientCount: uc.clientCount,
          atRiskEuros: uc.atRiskEuros,
          growthPotentialEuros: uc.growthPotentialEuros,
          comingSoon: uc.comingSoon ?? false,
          sourceUseCase: uc.sourceUseCase,
          customers: uc.customers.map(customerToWire),
        })
      },
    )

    server.registerTool(
      "search_customers",
      {
        description:
          "Search the customer pool with composable filters (substring, customer type, products carried, premium range, age range). All filters optional.",
        inputSchema: customerFilterShape,
      },
      async (args) => {
        const matches = filterCustomers({ ...args, limit: args.limit ?? 50 })
        return asJson({
          total: matches.length,
          poolSize: ALL_MASTER_CUSTOMERS.length,
          customers: matches.map(customerToWire),
        })
      },
    )

    server.registerTool(
      "preview_filter",
      {
        description:
          "Resolve a filter to its matching customer ids and a count, WITHOUT saving anything. Use to validate a smart-list definition before calling create_smart_list.",
        inputSchema: customerFilterShape,
      },
      async (args) => {
        const matches = filterCustomers({ ...args, limit: args.limit ?? 500 })
        return asJson({
          count: matches.length,
          customerIds: matches.map((c) => String(c.recordId)),
        })
      },
    )

    // ─── User-scoped CRUD on saved smart lists ───────────────────────────────

    server.registerTool(
      "list_my_smart_lists",
      {
        description: "List smart lists the authenticated user has saved.",
        inputSchema: {},
      },
      async (_args, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")
        const lists = await listSmartLists(userId)
        return asJson({
          lists: lists.map((l) => ({
            id: l.id,
            name: l.name,
            type: l.type,
            description: l.description,
            customerCount: l.customerIds.length,
            sourceUseCaseId: l.sourceUseCaseId,
            sourceTitle: l.sourceTitle,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
          })),
        })
      },
    )

    server.registerTool(
      "get_my_smart_list",
      {
        description: "Fetch one of the user's saved smart lists, including the full customer roster.",
        inputSchema: {
          id: z.string().describe("Smart-list id (returned by list_my_smart_lists or create_smart_list)."),
        },
      },
      async ({ id }, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")
        const list = await getSmartList(userId, id)
        if (!list) return asError(`No smart list with id '${id}' for this user.`)
        const byRecordId = new Map(ALL_MASTER_CUSTOMERS.map((c) => [String(c.recordId), c]))
        const customers = list.customerIds
          .map((rid) => byRecordId.get(rid))
          .filter((c): c is NonNullable<typeof c> => Boolean(c))
        return asJson({
          id: list.id,
          name: list.name,
          type: list.type,
          description: list.description,
          customerCount: list.customerIds.length,
          sourceUseCaseId: list.sourceUseCaseId,
          sourceTitle: list.sourceTitle,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
          customers: customers.map(customerToWire),
        })
      },
    )

    server.registerTool(
      "create_smart_list",
      {
        description:
          "Save a new smart list for the authenticated user. Provide either an explicit `customerIds` array OR a `filter` object (the server resolves the filter to matching customers). Use `type: 'dynamic'` if the membership should be re-evaluated each time the list is opened (re-run the filter), or `'static'` to freeze the current customer set.",
        inputSchema: {
          name: z.string().min(1).max(120),
          type: z.enum(["dynamic", "static"]).default("static"),
          description: z.string().max(2000).optional(),
          customerIds: z.array(z.string()).optional().describe("Explicit list of recordIds (as strings)."),
          filter: z.object(customerFilterShape).optional().describe("Filter criteria — alternative to customerIds."),
          sourceUseCaseId: z.string().optional().describe("Optional id of a built-in smart list this was derived from."),
          sourceTitle: z.string().optional(),
          iconBg: z.string().optional(),
          iconColor: z.string().optional(),
        },
      },
      async (args, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")

        let customerIds = args.customerIds
        if ((!customerIds || customerIds.length === 0) && args.filter) {
          customerIds = filterCustomers(args.filter).map((c) => String(c.recordId))
        }
        if (!customerIds || customerIds.length === 0) {
          return asError("Provide at least one customerId, or a filter that matches customers.")
        }

        const list = await createSmartList(userId, {
          name: args.name,
          type: args.type,
          description: args.description,
          customerIds,
          sourceUseCaseId: args.sourceUseCaseId ?? null,
          sourceTitle: args.sourceTitle ?? null,
          iconBg: args.iconBg ?? null,
          iconColor: args.iconColor ?? null,
        })
        return asJson({
          id: list.id,
          name: list.name,
          type: list.type,
          customerCount: list.customerIds.length,
          createdAt: list.createdAt,
        })
      },
    )

    server.registerTool(
      "update_smart_list",
      {
        description:
          "Update fields on one of the user's saved smart lists. Pass `filter` to recompute the customer membership from new criteria, or `customerIds` to set membership explicitly.",
        inputSchema: {
          id: z.string(),
          name: z.string().min(1).max(120).optional(),
          type: z.enum(["dynamic", "static"]).optional(),
          description: z.string().max(2000).optional(),
          customerIds: z.array(z.string()).optional(),
          filter: z.object(customerFilterShape).optional(),
        },
      },
      async (args, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")

        let customerIds = args.customerIds
        if (!customerIds && args.filter) {
          customerIds = filterCustomers(args.filter).map((c) => String(c.recordId))
        }

        const list = await updateSmartList(userId, args.id, {
          name: args.name,
          type: args.type,
          description: args.description,
          customerIds,
        })
        if (!list) return asError(`No smart list with id '${args.id}' for this user.`)
        return asJson({
          id: list.id,
          name: list.name,
          type: list.type,
          description: list.description,
          customerCount: list.customerIds.length,
          updatedAt: list.updatedAt,
        })
      },
    )

    server.registerTool(
      "delete_smart_list",
      {
        description: "Delete one of the user's saved smart lists.",
        inputSchema: { id: z.string() },
      },
      async ({ id }, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")
        const ok = await deleteSmartList(userId, id)
        if (!ok) return asError(`No smart list with id '${id}' for this user.`)
        return asJson({ ok: true, id })
      },
    )

    // ─── Lead pool (read-only seed for "Leads" target campaigns) ───────────────

    server.registerTool(
      "list_leads",
      {
        description:
          "List the available lead records (read-only seed pool). Use these ids as recipientIds when creating a campaign with targetGroup='Leads'.",
        inputSchema: {},
      },
      async () =>
        asJson({
          total: STATIC_LEADS.length,
          leads: STATIC_LEADS.map((l) => ({
            id: l.id,
            firstName: l.firstName ?? null,
            lastName: l.lastName ?? null,
            email: l.email ?? null,
            company: l.company ?? null,
            source: l.source ?? null,
            owner: l.owner ?? null,
          })),
        }),
    )

    // ─── Campaign templates ───────────────────────────────────────────────────

    const iconEnum = z.enum(["check", "star", "text", "mail"])
    const targetGroupEnum = z.enum(["Customers", "Leads"])

    const templateContentShape = {
      name: z.string().min(1).max(120).describe("Template name shown in the campaign-template list."),
      targetGroup: targetGroupEnum.describe("Whether this template targets existing Customers or external Leads."),
      description: z.string().max(2000).optional(),
      subject: z.string().max(500).optional().describe("Email subject line."),
      body: z.string().max(20000).optional().describe("Email body. Plain text or simple HTML."),
      icon: iconEnum.optional(),
      iconBg: z.string().optional().describe("Hex colour, e.g. '#ECFDF5'."),
      iconColor: z.string().optional().describe("Hex colour, e.g. '#059669'."),
    }

    server.registerTool(
      "list_campaign_templates",
      {
        description: "List the user's saved campaign templates (reusable name + email subject + body).",
        inputSchema: {},
      },
      async (_args, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")
        const templates = await listTemplates(userId)
        return asJson({
          templates: templates.map((t) => ({
            id: t.id,
            name: t.name,
            targetGroup: t.targetGroup,
            description: t.description,
            subject: t.subject,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          })),
        })
      },
    )

    server.registerTool(
      "get_campaign_template",
      {
        description: "Fetch one of the user's saved campaign templates, including subject + body.",
        inputSchema: { id: z.string() },
      },
      async ({ id }, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")
        const template = await getTemplate(userId, id)
        if (!template) return asError(`No campaign template with id '${id}' for this user.`)
        return asJson(template)
      },
    )

    server.registerTool(
      "create_campaign_template",
      {
        description:
          "Create a reusable campaign template (name + email subject + body). Generated content (e.g. drafted by Claude) goes here so it can be reused across campaigns.",
        inputSchema: templateContentShape,
      },
      async (args, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")
        const template = await createTemplate(userId, args)
        return asJson({ id: template.id, name: template.name, targetGroup: template.targetGroup, createdAt: template.createdAt })
      },
    )

    server.registerTool(
      "update_campaign_template",
      {
        description: "Patch fields on one of the user's saved campaign templates.",
        inputSchema: {
          id: z.string(),
          name: z.string().min(1).max(120).optional(),
          targetGroup: targetGroupEnum.optional(),
          description: z.string().max(2000).optional(),
          subject: z.string().max(500).optional(),
          body: z.string().max(20000).optional(),
          icon: iconEnum.optional(),
          iconBg: z.string().optional(),
          iconColor: z.string().optional(),
        },
      },
      async (args, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")
        const { id, ...patch } = args
        const template = await updateTemplate(userId, id, patch)
        if (!template) return asError(`No campaign template with id '${id}' for this user.`)
        return asJson({
          id: template.id,
          name: template.name,
          targetGroup: template.targetGroup,
          updatedAt: template.updatedAt,
        })
      },
    )

    server.registerTool(
      "delete_campaign_template",
      {
        description: "Delete one of the user's saved campaign templates.",
        inputSchema: { id: z.string() },
      },
      async ({ id }, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")
        const ok = await deleteTemplate(userId, id)
        if (!ok) return asError(`No campaign template with id '${id}' for this user.`)
        return asJson({ ok: true, id })
      },
    )

    // ─── Campaigns ────────────────────────────────────────────────────────────

    server.registerTool(
      "list_campaigns",
      {
        description:
          "List the user's saved campaigns. Status is always 'Draft' from the MCP — sending happens through the web UI.",
        inputSchema: {},
      },
      async (_args, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")
        const campaigns = await listCampaigns(userId)
        return asJson({
          campaigns: campaigns.map((c) => ({
            id: c.id,
            name: c.name,
            targetGroup: c.targetGroup,
            status: c.status,
            description: c.description,
            recipientCount: c.recipientIds.length,
            templateId: c.templateId,
            smartListId: c.smartListId,
            subject: c.subject,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          })),
        })
      },
    )

    server.registerTool(
      "get_campaign",
      {
        description:
          "Fetch a single campaign with its full email subject + body and the resolved recipient roster.",
        inputSchema: { id: z.string() },
      },
      async ({ id }, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")
        const c = await getCampaign(userId, id)
        if (!c) return asError(`No campaign with id '${id}' for this user.`)

        let recipients: unknown[] = []
        if (c.targetGroup === "Customers") {
          const byRecord = new Map(ALL_MASTER_CUSTOMERS.map((cust) => [String(cust.recordId), cust]))
          recipients = c.recipientIds
            .map((rid) => byRecord.get(rid))
            .filter((cust): cust is NonNullable<typeof cust> => Boolean(cust))
            .map(customerToWire)
        } else {
          const byLead = new Map(STATIC_LEADS.map((l) => [l.id, l]))
          recipients = c.recipientIds.map((rid) => byLead.get(rid)).filter(Boolean)
        }

        return asJson({
          id: c.id,
          name: c.name,
          targetGroup: c.targetGroup,
          status: c.status,
          description: c.description,
          subject: c.subject,
          body: c.body,
          templateId: c.templateId,
          smartListId: c.smartListId,
          recipientCount: c.recipientIds.length,
          recipients,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })
      },
    )

    server.registerTool(
      "create_campaign",
      {
        description:
          "Create a new campaign as a Draft. Recipients can be specified three ways (later overrides earlier): explicit `recipientIds`, derived from a `smartListId` (Customers only — copies the list's current customers), derived from a customer `filter` (Customers only). Email content can be inlined as `subject`/`body` OR pulled from a `templateId`. Status stays 'Draft' — sending must happen through the web UI.",
        inputSchema: {
          name: z.string().min(1).max(120),
          targetGroup: targetGroupEnum,
          description: z.string().max(2000).optional(),
          templateId: z.string().nullable().optional().describe("Pull subject + body from this template."),
          smartListId: z.string().nullable().optional().describe("Customers target only — recipient set is the smart list's customers as of now."),
          filter: z.object(customerFilterShape).optional().describe("Customers target only — derive recipients by filter."),
          recipientIds: z.array(z.string()).optional().describe("Customer recordIds (Customers target) or lead ids (Leads target)."),
          subject: z.string().max(500).optional(),
          body: z.string().max(20000).optional(),
          icon: iconEnum.optional(),
          iconBg: z.string().optional(),
          iconColor: z.string().optional(),
        },
      },
      async (args, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")

        let recipientIds = args.recipientIds ?? []
        let smartListId = args.smartListId ?? null

        if (args.targetGroup === "Customers") {
          if (recipientIds.length === 0 && smartListId) {
            const list = await getSmartList(userId, smartListId)
            if (!list) return asError(`Smart list '${smartListId}' not found for this user.`)
            recipientIds = list.customerIds
          }
          if (recipientIds.length === 0 && args.filter) {
            recipientIds = filterCustomers(args.filter).map((c) => String(c.recordId))
          }
        } else {
          // Leads target — only recipientIds is meaningful. Reject smartListId/filter.
          if (smartListId || args.filter) {
            return asError("smartListId and filter are only valid for targetGroup='Customers'. For Leads, pass recipientIds.")
          }
          // Validate against the static lead pool.
          const leadIds = new Set(STATIC_LEADS.map((l) => l.id))
          const unknown = recipientIds.filter((id) => !leadIds.has(id))
          if (unknown.length > 0) {
            return asError(`Unknown lead ids: ${unknown.join(", ")}. Use list_leads to see valid ids.`)
          }
        }

        let subject = args.subject
        let body = args.body
        if (args.templateId) {
          const tpl = await getTemplate(userId, args.templateId)
          if (!tpl) return asError(`Template '${args.templateId}' not found for this user.`)
          subject = subject ?? tpl.subject
          body = body ?? tpl.body
        }

        const campaign = await createCampaign(userId, {
          name: args.name,
          targetGroup: args.targetGroup,
          description: args.description,
          templateId: args.templateId ?? null,
          smartListId,
          recipientIds,
          subject: subject ?? "",
          body: body ?? "",
          icon: args.icon,
          iconBg: args.iconBg,
          iconColor: args.iconColor,
        })

        return asJson({
          id: campaign.id,
          name: campaign.name,
          targetGroup: campaign.targetGroup,
          status: campaign.status,
          recipientCount: campaign.recipientIds.length,
          createdAt: campaign.createdAt,
        })
      },
    )

    server.registerTool(
      "update_campaign",
      {
        description:
          "Patch fields on one of the user's campaigns. Recipients can be replaced via `recipientIds`, `smartListId` (Customers, copies current members), or a customer `filter`. Status stays in 'Draft'/'Active'/'Stopped' — actual sending is always done through the web UI.",
        inputSchema: {
          id: z.string(),
          name: z.string().min(1).max(120).optional(),
          targetGroup: targetGroupEnum.optional(),
          description: z.string().max(2000).optional(),
          status: z.enum(["Draft", "Active", "Stopped"]).optional(),
          templateId: z.string().nullable().optional(),
          smartListId: z.string().nullable().optional(),
          filter: z.object(customerFilterShape).optional(),
          recipientIds: z.array(z.string()).optional(),
          subject: z.string().max(500).optional(),
          body: z.string().max(20000).optional(),
          icon: iconEnum.optional(),
          iconBg: z.string().optional(),
          iconColor: z.string().optional(),
        },
      },
      async (args, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")

        const existing = await getCampaign(userId, args.id)
        if (!existing) return asError(`No campaign with id '${args.id}' for this user.`)

        const targetGroup = args.targetGroup ?? existing.targetGroup
        let recipientIds = args.recipientIds
        if (recipientIds === undefined) {
          if (args.smartListId !== undefined && args.smartListId !== null && targetGroup === "Customers") {
            const list = await getSmartList(userId, args.smartListId)
            if (!list) return asError(`Smart list '${args.smartListId}' not found for this user.`)
            recipientIds = list.customerIds
          } else if (args.filter && targetGroup === "Customers") {
            recipientIds = filterCustomers(args.filter).map((c) => String(c.recordId))
          }
        }

        if (targetGroup === "Leads" && recipientIds) {
          const leadIds = new Set(STATIC_LEADS.map((l) => l.id))
          const unknown = recipientIds.filter((id) => !leadIds.has(id))
          if (unknown.length > 0) {
            return asError(`Unknown lead ids: ${unknown.join(", ")}.`)
          }
        }

        const campaign = await updateCampaign(userId, args.id, {
          name: args.name,
          targetGroup: args.targetGroup,
          description: args.description,
          status: args.status,
          templateId: args.templateId,
          smartListId: args.smartListId,
          recipientIds,
          subject: args.subject,
          body: args.body,
          icon: args.icon,
          iconBg: args.iconBg,
          iconColor: args.iconColor,
        })
        if (!campaign) return asError(`No campaign with id '${args.id}' for this user.`)
        return asJson({
          id: campaign.id,
          name: campaign.name,
          targetGroup: campaign.targetGroup,
          status: campaign.status,
          recipientCount: campaign.recipientIds.length,
          updatedAt: campaign.updatedAt,
        })
      },
    )

    server.registerTool(
      "delete_campaign",
      {
        description: "Delete one of the user's campaigns.",
        inputSchema: { id: z.string() },
      },
      async ({ id }, extra) => {
        const userId = userIdFrom(extra)
        if (!userId) return asError("Not authenticated.")
        const ok = await deleteCampaign(userId, id)
        if (!ok) return asError(`No campaign with id '${id}' for this user.`)
        return asJson({ ok: true, id })
      },
    )
  },
  {
    serverInfo: { name: "qollabi-portfolio-intelligence", version: "0.3.0" },
  },
  {
    basePath: "/api",
    disableSse: true,
    verboseLogs: process.env.NODE_ENV !== "production",
  },
)

const authedHandler = withMcpAuth(
  mcpHandler,
  async (_req, bearerToken) => {
    if (!bearerToken) return undefined
    const user = await findUserByApiKey(bearerToken)
    if (!user) return undefined
    return {
      token: bearerToken,
      clientId: user.id,
      scopes: [],
      extra: { userId: user.id, email: user.email },
    }
  },
  { required: true },
)

export { authedHandler as GET, authedHandler as POST, authedHandler as DELETE }

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
      "access-control-allow-headers": "Authorization, Content-Type, MCP-Protocol-Version, MCP-Session-Id",
      "access-control-expose-headers": "WWW-Authenticate, MCP-Session-Id",
      "access-control-max-age": "86400",
    },
  })
}
