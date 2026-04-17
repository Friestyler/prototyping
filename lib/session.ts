/**
 * Tiny signed-cookie helpers for the app's password gate.
 *
 * The cookie value is `base64url(payload).base64url(hmac-sha256(payload))`.
 * Verification recomputes the HMAC and checks the embedded `exp` timestamp.
 * Designed to run in both Node and Edge runtimes (uses Web Crypto only).
 *
 * This is NOT user identity — it just proves "the visitor knows the shared
 * password". User-level auth for MCP / data isolation lives in the `users`
 * table and is unaffected.
 */

export const SESSION_COOKIE = "bb_session"
export const SESSION_TTL_DAYS = 30

interface Payload {
  exp: number
}

function getSecret(): string {
  const s = process.env.APP_SESSION_SECRET || process.env.APP_PASSWORD
  if (!s) {
    throw new Error("APP_SESSION_SECRET or APP_PASSWORD must be set in env to sign sessions.")
  }
  return s
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = ""
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(s.length + ((4 - (s.length % 4)) % 4), "=")
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message))
  return new Uint8Array(sig)
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export async function signSession(ttlDays: number = SESSION_TTL_DAYS): Promise<string> {
  const payload: Payload = { exp: Date.now() + ttlDays * 24 * 60 * 60 * 1000 }
  const payloadB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const sig = await hmac(getSecret(), payloadB64)
  return `${payloadB64}.${b64urlEncode(sig)}`
}

export async function verifySession(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 2) return false
  const [payloadB64, sigB64] = parts
  try {
    const expected = await hmac(getSecret(), payloadB64)
    const provided = b64urlDecode(sigB64)
    if (!constantTimeEqual(expected, provided)) return false
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64))) as Payload
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return false
    return true
  } catch {
    return false
  }
}

/** Compare a candidate password to APP_PASSWORD in constant time. */
export function checkPassword(candidate: string): boolean {
  const expected = process.env.APP_PASSWORD
  if (!expected) return false
  if (candidate.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}
