#!/usr/bin/env node
/**
 * Rebrand the customer-visible UI strings + the synthetic email domain from
 * "Qollabi" / "@qollabi.com" to "Brand Broker" / "@brandbroker.com".
 *
 * Code identifiers, file paths, env-var names, db column names, the MCP
 * api-key prefix (`qol_`), the npm package name and the deploy host are
 * NOT touched — they're internal, not branding.
 *
 * Run: node scripts/rebrand-to-brand-broker.mjs
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

// ─── 1. Email domain rewrite (anywhere) ──────────────────────────────────────
const EMAIL_TARGETS = [
  "lib/customer-database.ts",
  "lib/okr-data.ts",
  "lib/lc-data/leads.ts",
  "components/ai-signals.tsx",
  "components/leads-campaigns/step-settings.tsx",
]

const emailLiteralRe = /"([A-Za-z0-9._%+\-]+)@qollabi\.com"/g
const emailTemplateRe = /@qollabi\.com/g

for (const f of EMAIL_TARGETS) {
  const r = rewrite(f, (src) => {
    let count = 0
    let out = src.replace(emailLiteralRe, (_m, local) => {
      count++
      return `"${local}@brandbroker.com"`
    })
    out = out.replace(emailTemplateRe, () => {
      count++
      return "@brandbroker.com"
    })
    return { out, changed: count }
  })
  if (r.missing) console.log(`- ${f}: NOT FOUND`)
  else console.log(`✓ ${f}: ${r.changed} email replacement(s)`)
}

// ─── 2. UI text — replace "Qollabi" → "Brand Broker" in user-facing strings ──
//
// Done file-by-file with targeted patterns so we don't accidentally hit
// internal identifiers (the MCP server name is renamed separately).

function uiReplace(filePath, pairs) {
  return rewrite(filePath, (src) => {
    let count = 0
    let out = src
    for (const [from, to] of pairs) {
      const before = out
      out = out.split(from).join(to)
      if (out !== before) count++
    }
    return { out, changed: count }
  })
}

const UI_CHANGES = [
  [
    "components/sidebar-navigation.tsx",
    [
      [`>Qollabi<`, `>Brand Broker<`],
    ],
  ],
  [
    "components/lists-2-view.tsx",
    [
      [`"Qollabi AI"`, `"Brand Broker AI"`],
      [`"Qollabi AI"`, `"Brand Broker AI"`], // safe redundant
    ],
  ],
  [
    "components/leads-campaigns/step-draft-send.tsx",
    [
      [`(via Qollabi)`, `(via Brand Broker)`],
    ],
  ],
  [
    "components/leads-campaigns/leads-page.tsx",
    [
      [`Qollabi Templates`, `Brand Broker Templates`],
    ],
  ],
  [
    "components/mcp-setup-page.tsx",
    [
      [`"qollabi": {`, `"brand-broker": {`],
      [`http qollabi \\`, `http brand-broker \\`],
      [`Connect Qollabi to Claude`, `Connect Brand Broker to Claude`],
      [`Use the Qollabi MCP server`, `Use the Brand Broker MCP server`],
      [`<code>Qollabi</code>`, `<code>Brand Broker</code>`],
      [`<code>qollabi</code>`, `<code>brand-broker</code>`],
    ],
  ],
  [
    "app/oauth/authorize/page.tsx",
    [
      [`Connect to Qollabi`, `Connect to Brand Broker`],
      [`Paste your Qollabi api key`, `Paste your Brand Broker api key`],
      [`Open Qollabi`, `Open Brand Broker`],
    ],
  ],
  [
    "app/api/agent/insights/route.ts",
    [
      [`embedded portfolio analyst inside Qollabi`, `embedded portfolio analyst inside Brand Broker`],
    ],
  ],
]

for (const [file, pairs] of UI_CHANGES) {
  const r = uiReplace(file, pairs)
  if (r.missing) console.log(`- ${file}: NOT FOUND`)
  else console.log(`✓ ${file}: ${r.changed} UI text replacement(s)`)
}
