import { NextResponse } from "next/server"
import { SESSION_COOKIE, SESSION_TTL_DAYS, checkPassword, signSession } from "@/lib/session"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!process.env.APP_PASSWORD) {
    return NextResponse.json(
      { error: "auth_not_configured", message: "APP_PASSWORD is not set on the server." },
      { status: 503 },
    )
  }

  let body: { password?: string }
  try {
    body = (await request.json()) as { password?: string }
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const password = body.password ?? ""
  if (!checkPassword(password)) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 })
  }

  const token = await signSession()
  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  })
  return res
}
