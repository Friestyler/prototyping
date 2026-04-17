"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Copy, ExternalLink } from "lucide-react"

interface MeResponse {
  id: string
  email: string
  apiKey: string
}

export default function MCPSetupPage() {
  const [me, setMe] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
    fetch("/api/me")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<MeResponse>
      })
      .then(setMe)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const mcpUrl = origin ? `${origin}/api/mcp` : ""
  const apiKey = me?.apiKey ?? ""

  const desktopJson = `{
  "mcpServers": {
    "brand-broker": {
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer ${apiKey}"
      }
    }
  }
}`

  const claudeCodeCmd = `claude mcp add --transport http brand-broker \\
  ${mcpUrl} \\
  --header "Authorization: Bearer ${apiKey}"`

  return (
    <div className="min-h-full bg-[#F8F9FA] py-10">
      <div className="max-w-3xl mx-auto px-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#111827]">Connect Brand Broker to Claude</h1>
          <p className="text-[15px] text-[#6B7280]">
            Use the Brand Broker MCP server to search customers, build smart lists, and manage your portfolio
            from any Claude surface — Desktop, the CLI, or claude.ai.
          </p>
        </header>

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[13px] uppercase tracking-wide text-[#6B7280]">MCP endpoint</div>
              <div className="font-mono text-[14px] text-[#111827] break-all">{mcpUrl || "—"}</div>
            </div>
            <CopyButton value={mcpUrl} disabled={!mcpUrl} />
          </div>
          <div className="border-t border-gray-200" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] uppercase tracking-wide text-[#6B7280]">Your api key</div>
              {loading ? (
                <div className="text-[14px] text-[#6B7280]">Loading…</div>
              ) : error ? (
                <div className="text-[14px] text-red-600">Couldn't load: {error}</div>
              ) : (
                <div className="font-mono text-[14px] text-[#111827] break-all">{apiKey}</div>
              )}
            </div>
            <CopyButton value={apiKey} disabled={!apiKey} />
          </div>
          <p className="text-[13px] text-[#6B7280]">
            Treat this key like a password. Anyone who has it can read and modify your saved smart lists.
          </p>
        </Card>

        <Section title="Claude Desktop / claude.ai" subtitle="Easiest — Add Custom Connector">
          <ol className="list-decimal pl-5 space-y-1.5 text-[14px] text-[#374151]">
            <li>
              In Claude, open <strong>Settings</strong> → <strong>Connectors</strong> →{" "}
              <strong>Add custom connector</strong>.
            </li>
            <li>
              Set <strong>Name</strong> = <code>Brand Broker</code>, <strong>URL</strong> ={" "}
              <span className="font-mono break-all">{mcpUrl}</span>. Leave OAuth fields blank — they're auto-discovered.
            </li>
            <li>
              Click <strong>Add</strong>. Claude opens a browser tab to{" "}
              <code>/oauth/authorize</code> on this server — paste your <strong>api key</strong> (above) and
              click <strong>Authorize</strong>.
            </li>
            <li>You'll be sent back to Claude with the connector enabled.</li>
          </ol>
          <p className="text-[13px] text-[#6B7280]">
            Custom connectors on claude.ai require a Pro / Team / Enterprise plan. Claude Desktop
            (Mac / Windows) supports them on any plan.
          </p>
        </Section>

        <Section title="Claude Desktop — manual JSON" subtitle="Alternative if Add Connector isn't available">
          <ol className="list-decimal pl-5 space-y-1.5 text-[14px] text-[#374151]">
            <li>
              Open Claude Desktop → top menu → <strong>Settings</strong> → <strong>Developer</strong> →{" "}
              <strong>Edit Config</strong>.
            </li>
            <li>Paste the snippet below into the file (merge with existing <code>mcpServers</code>).</li>
            <li>Save, fully quit Claude Desktop (Cmd+Q), and reopen.</li>
          </ol>
          <CodeBlock code={desktopJson} />
        </Section>

        <Section title="Claude Code" subtitle="CLI">
          <p className="text-[14px] text-[#374151]">Run this once in any terminal:</p>
          <CodeBlock code={claudeCodeCmd} />
          <p className="text-[13px] text-[#6B7280]">
            Then in any session, type <code>/mcp</code> to confirm <code>brand-broker</code> is connected.
          </p>
        </Section>

        <Section title="What you can ask Claude">
          <ul className="space-y-1.5 text-[14px] text-[#374151] list-disc pl-5">
            <li>"Show me the built-in smart lists."</li>
            <li>"Search customers in Brussels carrying Auto and Home insurance."</li>
            <li>
              "Create a smart list of natural-person customers with Auto + Home + Life and premium &gt; €3000,
              call it 'Top family households'."
            </li>
            <li>"List my saved smart lists." / "Delete the 'foo' list."</li>
          </ul>
          <p className="text-[13px] text-[#6B7280]">
            Lists you create through Claude appear in <strong>Customers → My Lists</strong> in this app.
          </p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[16px] font-semibold text-[#111827]">{title}</h2>
        {subtitle && <span className="text-[13px] text-[#6B7280]">{subtitle}</span>}
      </div>
      {children}
    </Card>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <pre className="bg-[#0F172A] text-[#E5E7EB] text-[13px] font-mono rounded-lg p-4 overflow-x-auto">{code}</pre>
      <div className="absolute top-2 right-2">
        <CopyButton value={code} variant="dark" />
      </div>
    </div>
  )
}

function CopyButton({
  value,
  disabled,
  variant = "light",
}: {
  value: string
  disabled?: boolean
  variant?: "light" | "dark"
}) {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }
  const dark = variant === "dark"
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onCopy}
      disabled={disabled}
      className={
        dark
          ? "h-8 bg-transparent border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white"
          : "h-8"
      }
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 mr-1.5" /> Copied
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
        </>
      )}
    </Button>
  )
}
