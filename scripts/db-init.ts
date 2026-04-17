/**
 * Idempotent DB bootstrap: applies schema.sql, ensures the demo user exists,
 * prints the demo api key on stdout. Safe to re-run.
 *
 *   npm run db:init
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config()

import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { neon } from "@neondatabase/serverless"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local and try again.")
  process.exit(1)
}

const sql = neon(url)

async function main() {
  const schemaPath = path.resolve("lib/db/schema.sql")
  const schema = fs.readFileSync(schemaPath, "utf8")

  // Neon's HTTP driver doesn't support multi-statement queries in a single
  // tagged-template call, so split on semicolons (schema is plain DDL).
  const statements = schema
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean)

  for (const stmt of statements) {
    await sql.query(stmt)
  }
  console.log(`✓ schema applied (${statements.length} statements)`)

  const demoId = "demo"
  const demoEmail = "demo@qollabi.app"
  const existing = await sql`select id, api_key from users where id = ${demoId}`
  if (existing.length > 0) {
    console.log(`✓ demo user already exists (api_key: ${existing[0].api_key})`)
    return
  }

  const apiKey = `qol_${crypto.randomBytes(24).toString("hex")}`
  await sql`
    insert into users (id, email, api_key)
    values (${demoId}, ${demoEmail}, ${apiKey})
  `
  console.log(`✓ demo user created`)
  console.log(``)
  console.log(`  api_key: ${apiKey}`)
  console.log(``)
  console.log(`  Add this to your MCP host config to authenticate as the demo user.`)
}

main().catch((err) => {
  console.error("db-init failed:", err)
  process.exit(1)
})
