import { NextResponse } from "next/server"
import { getOrigin } from "@/lib/origin"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const origin = getOrigin(request)
  return NextResponse.json(
    {
      resource: `${origin}/api/mcp`,
      authorization_servers: [origin],
      scopes_supported: ["mcp"],
      bearer_methods_supported: ["header"],
      resource_documentation: `${origin}/`,
    },
    {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "Authorization, Content-Type, MCP-Protocol-Version",
        "cache-control": "public, max-age=300",
      },
    },
  )
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "Authorization, Content-Type, MCP-Protocol-Version",
    },
  })
}
