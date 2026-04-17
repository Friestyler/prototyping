/**
 * Dynamic Client Registration (RFC 7591).
 *
 * We don't actually persist the client — every Claude install registers itself
 * dynamically and the resulting client_id is opaque to us. We accept whatever
 * redirect_uris the client claims; the authorize endpoint enforces the same
 * value during the code-exchange step (RFC 6749 §4.1.3).
 */

import { NextResponse } from "next/server"
import crypto from "node:crypto"

export const runtime = "nodejs"

interface RegistrationBody {
  redirect_uris?: string[]
  client_name?: string
  client_uri?: string
  token_endpoint_auth_method?: string
  grant_types?: string[]
  response_types?: string[]
  software_id?: string
  software_version?: string
}

export async function POST(request: Request) {
  let body: RegistrationBody = {}
  try {
    body = (await request.json()) as RegistrationBody
  } catch {
    // RFC 7591 allows empty bodies; fall through with defaults
  }

  const clientId = `client_${crypto.randomBytes(16).toString("hex")}`
  const issuedAt = Math.floor(Date.now() / 1000)

  return NextResponse.json(
    {
      client_id: clientId,
      client_id_issued_at: issuedAt,
      redirect_uris: body.redirect_uris ?? [],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code"],
      response_types: ["code"],
      client_name: body.client_name ?? "MCP Client",
      client_uri: body.client_uri,
      software_id: body.software_id,
      software_version: body.software_version,
    },
    {
      status: 201,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "Authorization, Content-Type",
      },
    },
  )
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "Authorization, Content-Type",
    },
  })
}
