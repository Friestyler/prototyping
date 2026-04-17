#!/usr/bin/env node
/**
 * Rewrite every email-shaped string in the prototype's static fixtures so the
 * domain is @qollabi.com. Leaves the local part (e.g. "h.janssens") intact so
 * the data still looks like real people but never sends to a real address.
 *
 * Run: node scripts/use-qollabi-emails.mjs
 */

import fs from "node:fs"
import path from "node:path"

const TARGETS = [
  "lib/customer-database.ts",
  "lib/okr-data.ts",
  "lib/lc-data/leads.ts",
  "components/ai-signals.tsx",
]

// Match an email INSIDE a string literal: "x@y.tld" → "x@qollabi.com".
// Keeps the local part. Domains with hyphens, multiple dots all handled.
const emailRe = /"([A-Za-z0-9._%+\-]+)@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}"/g

let total = 0
for (const rel of TARGETS) {
  const abs = path.resolve(rel)
  if (!fs.existsSync(abs)) {
    console.log(`- ${rel}: NOT FOUND`)
    continue
  }
  const src = fs.readFileSync(abs, "utf8")
  let count = 0
  const out = src.replace(emailRe, (_m, local) => {
    count++
    return `"${local}@qollabi.com"`
  })
  if (out !== src) fs.writeFileSync(abs, out)
  total += count
  console.log(`✓ ${rel}: ${count} email(s) rewritten`)
}

// Template-literal email in ai-signals.tsx — handled separately because it's
// built at runtime, not a string literal.
const aiPath = path.resolve("components/ai-signals.tsx")
if (fs.existsSync(aiPath)) {
  const src = fs.readFileSync(aiPath, "utf8")
  const out = src.replace(/@gmail\.com/g, "@qollabi.com")
  if (out !== src) {
    fs.writeFileSync(aiPath, out)
    console.log(`✓ components/ai-signals.tsx: gmail.com → qollabi.com in template literal`)
  }
}

console.log(`\nTotal: ${total} email-literal replacements.`)
