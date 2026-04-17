import { DEMO_USER_ID, findUserByApiKey, findUserById, type DbUser } from "@/lib/db/users"

/**
 * Resolve the calling user from a request.
 *
 * - With Bearer token: looks up user by api_key. Returns null if invalid.
 * - Without Bearer: falls back to the demo user (web app is single-tenant).
 *
 * Pass `requireBearer: true` to disable the demo-user fallback (used by MCP).
 */
export async function resolveUser(
  request: Request,
  opts: { requireBearer?: boolean } = {},
): Promise<DbUser | null> {
  const auth = request.headers.get("authorization") ?? request.headers.get("Authorization")
  const bearer = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null

  if (bearer) {
    return await findUserByApiKey(bearer)
  }
  if (opts.requireBearer) return null
  return await findUserById(DEMO_USER_ID)
}
