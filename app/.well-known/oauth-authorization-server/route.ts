import { NextResponse } from "next/server"
import { getOrigin } from "@/lib/origin"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const origin = getOrigin(request)
  return NextResponse.json(
    {
      issuer: origin,
      authorization_endpoint: `${origin}/oauth/authorize`,
      token_endpoint: `${origin}/api/oauth/token`,
      registration_endpoint: `${origin}/api/oauth/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: ["mcp"],
      service_documentation: `${origin}/`,
    },
    {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "Authorization, Content-Type",
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
      "access-control-allow-headers": "Authorization, Content-Type",
    },
  })
}
