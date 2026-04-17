import { neon, neonConfig } from "@neondatabase/serverless"

neonConfig.fetchConnectionCache = true

const url = process.env.DATABASE_URL

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Provision a Neon database (or any Postgres) and add the connection string to .env.local. See lib/db/README.md.",
  )
}

export const sql = neon(url)
