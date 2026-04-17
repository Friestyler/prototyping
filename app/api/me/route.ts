import { NextResponse } from "next/server"
import { resolveUser } from "@/lib/auth"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const user = await resolveUser(request)
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  return NextResponse.json({
    id: user.id,
    email: user.email,
    apiKey: user.apiKey,
  })
}
