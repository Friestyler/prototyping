/**
 * OAuth 2.0 token endpoint.
 *
 * Exchanges an authorization code (+ PKCE verifier) for an access token. The
 * access token is the user's existing api_key — same value the JSON-config
 * users paste manually, so the existing withMcpAuth verifyToken path works
 * unchanged.
 */

import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { consumeCode } from "@/lib/db/oauth"
import { findUserById } from "@/lib/db/users"

export const runtime = "nodejs"

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "Authorization, Content-Type",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

export async function POST(request: Request) {
  let body: URLSearchParams
  const contentType = request.headers.get("content-type") ?? ""
  try {
    if (contentType.includes("application/json")) {
      const j = (await request.json()) as Record<string, string>
      body = new URLSearchParams(j)
    } else {
      const text = await request.text()
      body = new URLSearchParams(text)
    }
  } catch {
    return tokenError("invalid_request", "Could not parse request body.")
  }

  const grantType = body.get("grant_type") ?? ""
  if (grantType !== "authorization_code") {
    return tokenError("unsupported_grant_type", `grant_type '${grantType}' is not supported.`)
  }

  const code = body.get("code") ?? ""
  const clientId = body.get("client_id") ?? ""
  const redirectUri = body.get("redirect_uri") ?? ""
  const codeVerifier = body.get("code_verifier") ?? ""

  if (!code || !clientId || !redirectUri || !codeVerifier) {
    return tokenError("invalid_request", "code, client_id, redirect_uri and code_verifier are required.")
  }

  const record = await consumeCode(code)
  if (!record) {
    return tokenError("invalid_grant", "Code is invalid, expired, or already used.")
  }
  if (record.clientId !== clientId) {
    return tokenError("invalid_grant", "client_id does not match the original authorization request.")
  }
  if (record.redirectUri !== redirectUri) {
    return tokenError("invalid_grant", "redirect_uri does not match the original authorization request.")
  }

  const expectedChallenge = pkceS256(codeVerifier)
  if (expectedChallenge !== record.codeChallenge) {
    return tokenError("invalid_grant", "PKCE verification failed.")
  }

  const user = await findUserById(record.userId)
  if (!user) {
    return tokenError("invalid_grant", "User no longer exists.")
  }

  // The api_key IS the access_token — it's what withMcpAuth's verifyToken
  // already accepts via Bearer headers.
  return NextResponse.json(
    {
      access_token: user.apiKey,
      token_type: "Bearer",
      scope: record.scope,
    },
    { headers: { ...cors, "cache-control": "no-store", pragma: "no-cache" } },
  )
}

function pkceS256(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url")
}

function tokenError(error: string, description: string) {
  return NextResponse.json(
    { error, error_description: description },
    { status: 400, headers: cors },
  )
}
