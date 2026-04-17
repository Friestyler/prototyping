/**
 * Best-effort public origin detection.
 *
 * Vercel sets x-forwarded-host / x-forwarded-proto. Fall back to the request URL.
 * `PUBLIC_ORIGIN` env var overrides everything.
 */
export function getOrigin(request: Request): string {
  if (process.env.PUBLIC_ORIGIN) return process.env.PUBLIC_ORIGIN.replace(/\/$/, "")
  const headers = request.headers
  const host =
    headers.get("x-forwarded-host") ??
    headers.get("host") ??
    new URL(request.url).host
  const proto = headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "")
  return `${proto}://${host}`
}
