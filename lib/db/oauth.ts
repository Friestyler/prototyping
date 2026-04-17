import { sql } from "./client"

export interface OAuthCodeRecord {
  code: string
  userId: string
  clientId: string
  redirectUri: string
  codeChallenge: string
  codeChallengeMethod: string
  scope: string
  resource: string | null
  expiresAt: string
  usedAt: string | null
}

interface CodeRow {
  code: string
  user_id: string
  client_id: string
  redirect_uri: string
  code_challenge: string
  code_challenge_method: string
  scope: string
  resource: string | null
  expires_at: string
  used_at: string | null
}

function rowToCode(r: CodeRow): OAuthCodeRecord {
  return {
    code: r.code,
    userId: r.user_id,
    clientId: r.client_id,
    redirectUri: r.redirect_uri,
    codeChallenge: r.code_challenge,
    codeChallengeMethod: r.code_challenge_method,
    scope: r.scope,
    resource: r.resource,
    expiresAt: r.expires_at,
    usedAt: r.used_at,
  }
}

export interface IssueCodeInput {
  code: string
  userId: string
  clientId: string
  redirectUri: string
  codeChallenge: string
  codeChallengeMethod: string
  scope?: string
  resource?: string | null
  ttlSeconds?: number
}

export async function issueCode(input: IssueCodeInput): Promise<void> {
  const ttl = input.ttlSeconds ?? 300
  await sql`
    insert into oauth_codes (
      code, user_id, client_id, redirect_uri,
      code_challenge, code_challenge_method, scope, resource, expires_at
    ) values (
      ${input.code}, ${input.userId}, ${input.clientId}, ${input.redirectUri},
      ${input.codeChallenge}, ${input.codeChallengeMethod},
      ${input.scope ?? ""}, ${input.resource ?? null},
      now() + (${ttl} || ' seconds')::interval
    )
  `
}

/**
 * Atomically claim an authorization code: marks it used and returns the row
 * iff the code exists, hasn't been used, and isn't expired. Subsequent calls
 * with the same code return null.
 */
export async function consumeCode(code: string): Promise<OAuthCodeRecord | null> {
  const rows = (await sql`
    update oauth_codes
       set used_at = now()
     where code = ${code}
       and used_at is null
       and expires_at > now()
     returning *
  `) as CodeRow[]
  return rows.length > 0 ? rowToCode(rows[0]) : null
}

export async function purgeExpiredCodes(): Promise<void> {
  await sql`delete from oauth_codes where expires_at < now() - interval '1 hour'`
}
