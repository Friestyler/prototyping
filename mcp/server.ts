/**
 * Qollabi Portfolio Intelligence MCP server.
 *
 * Exposes the in-memory customer pool and smart-list catalogue from this repo
 * to any MCP host (Claude Desktop, Claude Code, Cursor, …). Read-only for now —
 * write tools can be added once a persistence layer is introduced.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { ALL_MASTER_CUSTOMERS } from "../lib/customer-database.js"
import { SMART_LIST_USE_CASES, findSmartListUseCase } from "../lib/smart-list-use-cases.js"

const SERVER_NAME = "qollabi-portfolio-intelligence"
const SERVER_VERSION = "0.1.0"

const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {}, resources: {} } },
)

// ─── Tool catalogue ───────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "list_smart_lists",
    description:
      "List every Priority Recommendations smart-list use case (payment reminders, first-car teen drivers, no life insurance, price increase + no contact, ML top-50 churn). Returns id, title, type (prevents_churn / drives_growth), description, match/risk percentage, client count, and at-risk / growth-potential Euros.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_smart_list",
    description:
      "Fetch a single smart list with the full roster of customers that match its criteria. Returns the same metadata as list_smart_lists plus the customer records (Customer ID, Customer Type, First Name, Last Name, Date of Birth, Address, Products, Annual Premium).",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description:
            "Smart list id. One of: payment-reminders, first-car-teen-drivers, no-life-insurance, price-increase-no-contact, top-50-churn-ml.",
        },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "search_customers",
    description:
      "Search the customer pool. Supports substring match against name, address, dossier number, and email (case-insensitive), plus exact-match filters for customer type and product carried. All parameters optional — with none, returns the full pool (up to limit).",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Case-insensitive substring match against first+last name, address, dossier number, and email.",
        },
        customerType: {
          type: "string",
          enum: ["Natural person", "Legal entity"],
          description: "Filter by customer type.",
        },
        product: {
          type: "string",
          description: "Only return customers who carry this product (e.g. 'Auto', 'Home', 'Life', 'Hospitalisatie').",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 500,
          default: 50,
          description: "Maximum number of customers to return (default 50, max 500).",
        },
      },
      additionalProperties: false,
    },
  },
]

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

// ─── Tool implementations ────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: rawArgs } = req.params
  const args = (rawArgs ?? {}) as Record<string, unknown>

  switch (name) {
    case "list_smart_lists": {
      const rows = SMART_LIST_USE_CASES.map((uc) => ({
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
      }))
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }] }
    }

    case "get_smart_list": {
      const id = String(args.id ?? "")
      const uc = findSmartListUseCase(id)
      if (!uc) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `No smart list with id '${id}'. Valid ids: ${SMART_LIST_USE_CASES.map((u) => u.id).join(", ")}.`,
            },
          ],
        }
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
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
                customers: uc.customers.map(serializeCustomer),
              },
              null,
              2,
            ),
          },
        ],
      }
    }

    case "search_customers": {
      const query = typeof args.query === "string" ? args.query.toLowerCase().trim() : ""
      const customerType = typeof args.customerType === "string" ? args.customerType : undefined
      const product = typeof args.product === "string" ? args.product.toLowerCase() : undefined
      const limit = typeof args.limit === "number" ? Math.min(Math.max(1, args.limit), 500) : 50

      const matches = ALL_MASTER_CUSTOMERS.filter((c) => {
        if (customerType && c.customerType !== customerType) return false
        if (product && !c.products.some((p) => p.toLowerCase() === product)) return false
        if (query) {
          const hay = [
            c.firstName,
            c.lastName,
            c.address,
            c.dossierNumber,
            c.email ?? "",
          ]
            .join(" ")
            .toLowerCase()
          if (!hay.includes(query)) return false
        }
        return true
      }).slice(0, limit)

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                total: matches.length,
                limit,
                customers: matches.map(serializeCustomer),
              },
              null,
              2,
            ),
          },
        ],
      }
    }

    default:
      return {
        isError: true,
        content: [{ type: "text", text: `Unknown tool '${name}'.` }],
      }
  }
})

// ─── Resources ────────────────────────────────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "qollabi://customers/all",
      name: "All customers",
      description: `The complete unified customer pool (${ALL_MASTER_CUSTOMERS.length} records).`,
      mimeType: "application/json",
    },
    {
      uri: "qollabi://smart-lists/catalogue",
      name: "Smart list catalogue",
      description: "Metadata for every Priority Recommendations smart-list use case.",
      mimeType: "application/json",
    },
  ],
}))

server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
  const uri = req.params.uri

  if (uri === "qollabi://customers/all") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(ALL_MASTER_CUSTOMERS.map(serializeCustomer), null, 2),
        },
      ],
    }
  }

  if (uri === "qollabi://smart-lists/catalogue") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(
            SMART_LIST_USE_CASES.map((uc) => ({
              id: uc.id,
              title: uc.title,
              type: uc.type,
              description: uc.description,
              matchPct: uc.matchPct,
              clientCount: uc.clientCount,
              atRiskEuros: uc.atRiskEuros,
              growthPotentialEuros: uc.growthPotentialEuros,
              comingSoon: uc.comingSoon ?? false,
            })),
            null,
            2,
          ),
        },
      ],
    }
  }

  throw new Error(`Unknown resource '${uri}'.`)
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function serializeCustomer(c: (typeof ALL_MASTER_CUSTOMERS)[number]) {
  return {
    customerId: c.dossierNumber,
    recordId: c.recordId,
    customerType: c.customerType,
    firstName: c.firstName,
    lastName: c.lastName,
    dateOfBirth: c.dateOfBirth || null,
    address: c.address,
    products: c.products,
    annualPremium: c.annualPremium,
    email: c.email ?? null,
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error(`[${SERVER_NAME}] v${SERVER_VERSION} connected via stdio`)
}

main().catch((err) => {
  console.error(`[${SERVER_NAME}] fatal:`, err)
  process.exit(1)
})
