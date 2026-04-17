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
import { findUserByApiKey } from "@/lib/db/users"

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
  },
  {
    serverInfo: { name: "qollabi-portfolio-intelligence", version: "0.2.0" },
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
