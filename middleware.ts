/**
 * Password gate for the web app.
 *
 * Routes left open (no session required):
 *   /login, /api/auth/*               — the login flow itself
 *   /api/mcp                          — Bearer-auth, used by Claude / MCP clients
 *   /api/oauth/*, /oauth/*            — OAuth flow used by Claude's Add Connector
 *   /.well-known/*                    — OAuth metadata
 *   /_next/*, /favicon.ico, /images/* — Next assets
 *
 * Everything else (the UI + REST endpoints the UI calls) requires a valid
 * session cookie. Missing cookie → redirect to /login (HTML pages) or 401
 * (XHR / API requests).
 */

import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, verifySession } from "@/lib/session"

const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth",
  "/api/mcp",
  "/api/oauth",
  "/oauth",
  "/.well-known",
  "/_next",
  "/favicon.ico",
  "/images",
  "/api/[transport]", // matches /api/mcp via the catch-all in production routing
]

function isPublic(pathname: string): boolean {
  for (const p of PUBLIC_PREFIXES) {
    if (pathname === p || pathname.startsWith(p + "/")) return true
  }
  return false
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  // If APP_PASSWORD isn't set, leave everything open (lets the operator boot
  // the prototype without auth, then add the env var to enable the gate).
  if (!process.env.APP_PASSWORD) return NextResponse.next()

  const token = req.cookies.get(SESSION_COOKIE)?.value
  const ok = await verifySession(token)
  if (ok) return NextResponse.next()

  const wantsHtml = (req.headers.get("accept") ?? "").includes("text/html")
  if (!wantsHtml) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = "/login"
  loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Run on every request except the heaviest static-asset paths
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
}
