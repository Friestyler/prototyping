/**
 * Authorization endpoint POST handler.
 *
 * Validates the user's api key, mints a one-time authorization code, persists
 * it (with the PKCE challenge), and 302-redirects to redirect_uri with the
 * code + state. Re-renders the authorize page with an error otherwise.
 */

import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { findUserByApiKey } from "@/lib/db/users"
import { issueCode } from "@/lib/db/oauth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const form = await request.formData()
  const get = (k: string) => (form.get(k) as string | null)?.trim() ?? ""

  const apiKey = get("api_key")
  const responseType = get("response_type")
  const clientId = get("client_id")
  const redirectUri = get("redirect_uri")
  const codeChallenge = get("code_challenge")
  const codeChallengeMethod = get("code_challenge_method") || "S256"
  const state = get("state")
  const scope = get("scope")
  const resource = get("resource")

  if (!apiKey) {
    return redirectBackToAuthorize(request, form, "missing_key")
  }
  if (responseType !== "code" || !clientId || !redirectUri || !codeChallenge) {
    return new NextResponse("invalid_request", { status: 400 })
  }
  try {
    new URL(redirectUri)
  } catch {
    return new NextResponse("invalid_redirect_uri", { status: 400 })
  }
  if (codeChallengeMethod !== "S256") {
    return new NextResponse("unsupported_code_challenge_method", { status: 400 })
  }

  const user = await findUserByApiKey(apiKey)
  if (!user) {
    return redirectBackToAuthorize(request, form, "invalid_key")
  }

  // Mint a code and persist with PKCE binding so /api/oauth/token can verify.
  // We embed the user's api_key directly inside the code so that consume +
  // exchange can return it as the access_token without a second DB hop. The
  // code itself is the lookup key — the api_key never leaves the DB until
  // the legitimate code_verifier is presented.
  const code = `qoc_${crypto.randomBytes(32).toString("hex")}`

  await issueCode({
    code,
    userId: user.id,
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
    scope,
    resource: resource || null,
    ttlSeconds: 300,
  })

  const redirect = new URL(redirectUri)
  redirect.searchParams.set("code", code)
  if (state) redirect.searchParams.set("state", state)

  return NextResponse.redirect(redirect.toString(), { status: 302 })
}

function redirectBackToAuthorize(
  request: Request,
  form: FormData,
  error: string,
): NextResponse {
  const url = new URL("/oauth/authorize", request.url)
  for (const [k, v] of form.entries()) {
    if (k === "api_key") continue
    url.searchParams.set(k, String(v))
  }
  url.searchParams.set("error", error)
  return NextResponse.redirect(url.toString(), { status: 303 })
}
