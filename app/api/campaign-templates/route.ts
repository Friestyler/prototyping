import { NextResponse } from "next/server"
import { z } from "zod"
import { resolveUser } from "@/lib/auth"
import { createTemplate, listTemplates } from "@/lib/db/campaign-templates"

export const runtime = "nodejs"

const iconEnum = z.enum(["check", "star", "text", "mail"])

const createBody = z.object({
  name: z.string().min(1).max(120),
  targetGroup: z.enum(["Customers", "Leads"]),
  description: z.string().max(2000).optional(),
  subject: z.string().max(500).optional(),
  body: z.string().max(20000).optional(),
  icon: iconEnum.optional(),
  iconBg: z.string().optional(),
  iconColor: z.string().optional(),
})

export async function GET(request: Request) {
  const user = await resolveUser(request)
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const templates = await listTemplates(user.id)
  return NextResponse.json({ templates })
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

  const template = await createTemplate(user.id, parsed.data)
  return NextResponse.json({ template }, { status: 201 })
}
