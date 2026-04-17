#!/usr/bin/env node
/**
 * One-shot anonymizer for the static customer / lead / mock-data pool.
 *
 * Replaces every person-name and email field in:
 *   - lib/customer-database.ts (62 master customer entries)
 *   - lib/okr-data.ts          (40 legacy company records + team members)
 *   - lib/lc-data/leads.ts     (lead contact info)
 *   - lib/lc-data/users.ts     (sales-rep names)
 *   - components/ai-signals.tsx (synthetic name generator constants)
 *
 * Address fragments, dossier numbers, dates of birth, products and premiums
 * are left in place — they're synthetic Belgian fixtures with no link to any
 * real person.
 *
 * Run: node scripts/anonymize-customers.mjs
 */

import fs from "node:fs"
import path from "node:path"

function rewrite(filePath, transform) {
  const abs = path.resolve(filePath)
  if (!fs.existsSync(abs)) return { file: filePath, changed: 0, missing: true }
  const src = fs.readFileSync(abs, "utf8")
  const { out, changed } = transform(src)
  if (out !== src) fs.writeFileSync(abs, out)
  return { file: filePath, changed }
}

// ─── lib/customer-database.ts ────────────────────────────────────────────────
//
// The single-line MASTER_CUSTOMERS records.

const customerDb = rewrite("lib/customer-database.ts", (src) => {
  const entryRe = /\{\s*id:\s*"[^"]+",\s*recordId:\s*(\d+),([\s\S]*?)\}/g
  let count = 0
  const out = src.replace(entryRe, (_match, recordId, body) => {
    count++
    const next = body
      .replace(/firstName:\s*"[^"]*"/g, `firstName: "Customer"`)
      .replace(/lastName:\s*"[^"]*"/g, `lastName: "${recordId}"`)
      .replace(/email:\s*"[^"]*"/g, `email: "customer-${recordId}@example.com"`)
    return `{ id: "anon-${recordId}", recordId: ${recordId},${next}}`
  })
  return { out, changed: count }
})

// ─── lib/okr-data.ts ─────────────────────────────────────────────────────────
//
// Per-record `name`, `owner`, and team-member arrays. We don't know which
// `name` field belongs to which top-level partner — but every Partner block
// starts with `id: <number>,` so we use that as the seed.

const okrData = rewrite("lib/okr-data.ts", (src) => {
  // Partner-level name + owner.
  let partnerCount = 0
  let out = src.replace(/(\bid:\s*(\d+),\s*\n\s*idVnemer:[^\n]*,\s*\n\s*name:\s*)"[^"]*"/g, (_m, head, id) => {
    partnerCount++
    return `${head}"Customer ${id}"`
  })

  // Owner fields anywhere — replace with a generic role.
  let ownerCount = 0
  out = out.replace(/(\bowner:\s*)"[^"]*"/g, (_m, prefix) => {
    ownerCount++
    return `${prefix}"Internal"`
  })

  // Email VALUES inside OKR items: { label: "Email", value: "x@y.be", … }.
  let emailCount = 0
  out = out.replace(
    /(label:\s*"Email"[^}]*?value:\s*)"[^"]*"/g,
    (_m, prefix) => {
      emailCount++
      return `${prefix}""`
    },
  )
  // Top-level `email:` fields on Partner objects.
  out = out.replace(/(\bemail:\s*)"[^"]*"/g, (_m, prefix) => {
    emailCount++
    return `${prefix}""`
  })

  // Team member names — clear them so legacy renderers don't show real people.
  let teamCount = 0
  out = out.replace(
    /(\{\s*name:\s*)"[^"]*"(\s*,\s*role:\s*"[^"]*")/g,
    (_m, prefix, suffix) => {
      teamCount++
      return `${prefix}"Member"${suffix}`
    },
  )

  return {
    out,
    changed: partnerCount + ownerCount + emailCount + teamCount,
  }
})

// ─── lib/lc-data/leads.ts ────────────────────────────────────────────────────

const leads = rewrite("lib/lc-data/leads.ts", (src) => {
  // Each lead block starts with id: "L-NNN".
  const leadRe = /\{\s*id:\s*"(L-\d+)",([\s\S]*?)\}/g
  let count = 0
  const out = src.replace(leadRe, (_m, leadId, body) => {
    count++
    const next = body
      .replace(/firstName:\s*"[^"]*"/g, `firstName: "Lead"`)
      .replace(/lastName:\s*"[^"]*"/g, `lastName: "${leadId}"`)
      .replace(/email:\s*"[^"]*"/g, `email: "lead-${leadId.toLowerCase()}@example.com"`)
      .replace(/company:\s*"[^"]*"/g, `company: "Company ${leadId}"`)
      .replace(/owner:\s*"[^"]*"/g, `owner: "Internal"`)
      .replace(/attachmentLink:\s*"[^"]*"/g, `attachmentLink: ""`)
    return `{ id: "${leadId}",${next}}`
  })
  return { out, changed: count }
})

// ─── lib/lc-data/users.ts ────────────────────────────────────────────────────

const usersFile = rewrite("lib/lc-data/users.ts", (src) => {
  // Replace the entire userMap with a generic three-rep map. The component
  // renders initials + colour from the user record — generic names look fine.
  const replacement = `const userMap: Record<string, User> = {
  "User 1": { name: "User 1", initials: "U1", color: "#5B5BD6" },
  "User 2": { name: "User 2", initials: "U2", color: "#059669" },
  "User 3": { name: "User 3", initials: "U3", color: "#D97706" },
};`
  const out = src.replace(/const userMap[\s\S]*?\};/, replacement)
  return { out, changed: out === src ? 0 : 1 }
})

// ─── components/ai-signals.tsx (synthetic name generator) ────────────────────

const aiSignals = rewrite("components/ai-signals.tsx", (src) => {
  let changed = 0
  const out = src
    .replace(
      /const FIRST_NAMES\s*=\s*\[[^\]]*\]/,
      () => {
        changed++
        return `const FIRST_NAMES = ["Customer"]`
      },
    )
    .replace(
      /const LAST_NAMES\s*=\s*\[[^\]]*\]/,
      () => {
        changed++
        return `const LAST_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]`
      },
    )
  return { out, changed }
})

const results = [customerDb, okrData, leads, usersFile, aiSignals]
for (const r of results) {
  if (r.missing) console.log(`- ${r.file}: NOT FOUND`)
  else console.log(`✓ ${r.file}: ${r.changed} replacements`)
}
