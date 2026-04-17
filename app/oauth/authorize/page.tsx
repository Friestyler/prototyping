/**
 * OAuth 2.0 authorization endpoint UI.
 *
 * Claude redirects the user's browser here with the standard query params.
 * We render a minimal "sign in with your api key" form. The form POSTs back
 * to /api/oauth/authorize, which validates the key, mints an authorization
 * code, and redirects to redirect_uri?code=...&state=....
 */

import Link from "next/link"

interface SearchParams {
  response_type?: string
  client_id?: string
  redirect_uri?: string
  code_challenge?: string
  code_challenge_method?: string
  state?: string
  scope?: string
  resource?: string
  error?: string
}

export const dynamic = "force-dynamic"

export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const issue = checkParams(params)
  if (issue) {
    return <InvalidRequest message={issue} />
  }

  const error = params.error

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="space-y-1 mb-6">
          <h1 className="text-[22px] font-semibold text-[#111827]">Connect to Brand Broker</h1>
          <p className="text-[14px] text-[#6B7280]">
            <strong className="text-[#111827]">{params.client_id?.startsWith("client_") ? "An app" : params.client_id}</strong>{" "}
            is requesting access to your portfolio. Paste your Brand Broker api key to authorize.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error === "invalid_key"
              ? "That api key wasn't recognised. Double-check and try again."
              : error === "missing_key"
              ? "Please enter your api key."
              : error}
          </div>
        )}

        <form method="POST" action="/api/oauth/authorize" className="space-y-4">
          <input type="hidden" name="response_type" value={params.response_type ?? ""} />
          <input type="hidden" name="client_id" value={params.client_id ?? ""} />
          <input type="hidden" name="redirect_uri" value={params.redirect_uri ?? ""} />
          <input type="hidden" name="code_challenge" value={params.code_challenge ?? ""} />
          <input
            type="hidden"
            name="code_challenge_method"
            value={params.code_challenge_method ?? "S256"}
          />
          <input type="hidden" name="state" value={params.state ?? ""} />
          <input type="hidden" name="scope" value={params.scope ?? ""} />
          <input type="hidden" name="resource" value={params.resource ?? ""} />

          <label className="block">
            <span className="block text-[13px] font-medium text-[#374151] mb-1.5">Api key</span>
            <input
              type="password"
              name="api_key"
              required
              autoFocus
              autoComplete="off"
              placeholder="qol_…"
              className="w-full h-10 px-3 rounded-lg border border-gray-300 text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-[#4F46E5]"
            />
          </label>

          <button
            type="submit"
            className="w-full h-10 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[14px] font-medium transition-colors"
          >
            Authorize
          </button>

          <p className="text-[12px] text-[#6B7280] text-center pt-2">
            Don't have a key?{" "}
            <Link href="/" className="text-[#4F46E5] hover:underline">
              Open Brand Broker
            </Link>{" "}
            and grab it from the profile menu.
          </p>
        </form>
      </div>
    </div>
  )
}

function checkParams(p: SearchParams): string | null {
  if (p.response_type !== "code") return "response_type must be 'code'."
  if (!p.client_id) return "client_id is required."
  if (!p.redirect_uri) return "redirect_uri is required."
  if (!p.code_challenge) return "code_challenge is required (PKCE)."
  if ((p.code_challenge_method ?? "plain") !== "S256")
    return "code_challenge_method must be 'S256'."
  try {
    new URL(p.redirect_uri)
  } catch {
    return "redirect_uri must be an absolute URL."
  }
  return null
}

function InvalidRequest({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-2">
        <h1 className="text-[18px] font-semibold text-[#111827]">Invalid request</h1>
        <p className="text-[14px] text-[#6B7280]">{message}</p>
      </div>
    </div>
  )
}
