import { NextResponse } from "next/server"
import { z } from "zod"
import { resolveUser } from "@/lib/auth"
import { deleteSmartList, getSmartList, updateSmartList } from "@/lib/db/smart-lists"

export const runtime = "nodejs"

const patchBody = z.object({
  name: z.string().min(1).max(120).optional(),
  type: z.enum(["dynamic", "static"]).optional(),
  description: z.string().max(2000).optional(),
  customerIds: z.array(z.string()).optional(),
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await resolveUser(request)
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const list = await getSmartList(user.id, id)
  if (!list) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ list })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await resolveUser(request)
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const parsed = patchBody.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 })
  }

  const list = await updateSmartList(user.id, id, parsed.data)
  if (!list) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ list })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await resolveUser(request)
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const ok = await deleteSmartList(user.id, id)
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
