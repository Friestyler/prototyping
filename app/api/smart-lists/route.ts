import { NextResponse } from "next/server"
import { z } from "zod"
import { resolveUser } from "@/lib/auth"
import { createSmartList, listSmartLists } from "@/lib/db/smart-lists"

export const runtime = "nodejs"

const createBody = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(["dynamic", "static"]),
  customerIds: z.array(z.string()).default([]),
  description: z.string().max(2000).optional(),
  sourceUseCaseId: z.string().nullable().optional(),
  sourceTitle: z.string().nullable().optional(),
  iconBg: z.string().nullable().optional(),
  iconColor: z.string().nullable().optional(),
})

export async function GET(request: Request) {
  const user = await resolveUser(request)
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const lists = await listSmartLists(user.id)
  return NextResponse.json({ lists })
}

export async function POST(request: Request) {
  const user = await resolveUser(request)
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = createBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 })
  }

  const list = await createSmartList(user.id, parsed.data)
  return NextResponse.json({ list }, { status: 201 })
}
