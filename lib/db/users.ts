import { sql } from "./client"

export interface DbUser {
  id: string
  email: string
  apiKey: string
}

export const DEMO_USER_ID = "demo"

export async function findUserByApiKey(apiKey: string): Promise<DbUser | null> {
  const rows = (await sql`
    select id, email, api_key from users where api_key = ${apiKey} limit 1
  `) as Array<{ id: string; email: string; api_key: string }>
  if (rows.length === 0) return null
  return { id: rows[0].id, email: rows[0].email, apiKey: rows[0].api_key }
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const rows = (await sql`
    select id, email, api_key from users where id = ${id} limit 1
  `) as Array<{ id: string; email: string; api_key: string }>
  if (rows.length === 0) return null
  return { id: rows[0].id, email: rows[0].email, apiKey: rows[0].api_key }
}
