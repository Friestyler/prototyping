import { NextResponse } from "next/server"
import { z } from "zod"
import { resolveUser } from "@/lib/auth"
import { deleteCampaign, getCampaign, updateCampaign } from "@/lib/db/campaigns"

export const runtime = "nodejs"

const iconEnum = z.enum(["check", "star", "text", "mail"])
const patchBody = z.object({
  name: z.string().min(1).max(120).optional(),
  targetGroup: z.enum(["Customers", "Leads"]).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["Draft", "Active", "Stopped"]).optional(),
  templateId: z.string().nullable().optional(),
  smartListId: z.string().nullable().optional(),
  recipientIds: z.array(z.string()).optional(),
  subject: z.string().max(500).optional(),
  body: z.string().max(20000).optional(),
  icon: iconEnum.optional(),
  iconBg: z.string().optional(),
  iconColor: z.string().optional(),
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await resolveUser(request)
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const campaign = await getCampaign(user.id, id)
  if (!campaign) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ campaign })
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

  const campaign = await updateCampaign(user.id, id, parsed.data)
  if (!campaign) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ campaign })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await resolveUser(request)
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const ok = await deleteCampaign(user.id, id)
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
