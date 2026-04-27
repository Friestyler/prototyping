"use client"

import { useState } from "react"
import {
  Rocket,
  Upload,
  ChevronDown,
  Calendar,
  Phone,
  Circle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAiInsights } from "@/components/ai-insights-context"
import { PaymentRemindersUpload } from "@/components/payment-reminders-upload"

type Tab = "getting-started" | "data-upload"

const STEPS = [
  { index: 1, title: "Who will send campaigns", progress: "0/4", segments: 4 },
  { index: 2, title: "Add your voucher if you have received one", progress: "0/1", segments: 1 },
  { index: 3, title: "Connect your data from Brio, BrokerCloud, or other", progress: "0/1", segments: 1 },
  { index: 4, title: "Get your team on board", progress: "0/1", segments: 1 },
]

export default function BrokerHubPage() {
  const [tab, setTab] = useState<Tab>("getting-started")

  return (
    <div className="bg-white min-h-full">
      <div className="px-7 py-2.5 bg-white border-b border-border flex gap-2">
        <TabButton active={tab === "getting-started"} onClick={() => setTab("getting-started")} icon={<Rocket className="h-[13px] w-[13px]" />}>
          Getting Started
        </TabButton>
        <TabButton active={tab === "data-upload"} onClick={() => setTab("data-upload")} icon={<Upload className="h-[13px] w-[13px]" />}>
          Data Upload
        </TabButton>
      </div>

      {tab === "getting-started" && <GettingStarted />}
      {tab === "data-upload" && <DataUpload />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 py-[7px] px-3.5 rounded-lg text-[13px] font-medium transition-colors",
        active ? "bg-brand-light text-brand" : "text-muted-foreground hover:bg-gray-50",
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function GettingStarted() {
  return (
    <div className="p-7">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div>
          <div className="flex items-center justify-between gap-4 mb-5">
            <h1 className="text-[22px] font-semibold text-gray-900">
              Hello, Kam! You have 4 steps left to start sending campaigns.
            </h1>
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-40 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-300 rounded-full" style={{ width: "0%" }} />
              </div>
              <span className="text-sm font-medium text-gray-500 tabular-nums">0%</span>
            </div>
          </div>

          <div className="space-y-3">
            {STEPS.map((step) => (
              <div
                key={step.index}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3.5"
              >
                <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                <div className="flex-1 flex items-center gap-3">
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-gray-600 uppercase">
                    Step {step.index}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{step.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: step.segments }, (_, i) => (
                      <div key={i} className="h-1.5 w-6 rounded-full bg-gray-200" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 tabular-nums w-8">{step.progress}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="self-start rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="relative h-14 w-14 rounded-full bg-white ring-2 ring-indigo-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              <div className="h-full w-full bg-gradient-to-br from-indigo-200 to-indigo-300 flex items-center justify-center text-lg font-semibold text-indigo-800">
                B
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900">Hi, I&apos;m Bertus!</div>
              <p className="text-xs text-gray-600 leading-relaxed mt-1">
                I&apos;m here to make your onboarding smooth. Got a question or just want to talk
                through the setup?
              </p>
            </div>
          </div>

          <div className="h-px bg-indigo-200/80" />

          <div className="rounded-xl border border-gray-200 bg-white p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 truncate">Pick a time to chat</span>
            </div>
            <Button size="sm" variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
              Book call
            </Button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-gray-900">Leave your number, we&apos;ll call you</span>
            <Button size="icon-sm" variant="outline" aria-label="Leave number">
              <Phone className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900">Call us now</span>
            </div>
            <span className="text-sm font-semibold text-emerald-700 tabular-nums bg-emerald-50 rounded-md px-2 py-0.5">
              +32 2 123 45 67
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}

function DataUpload() {
  const { requestNavigation } = useAiInsights()

  return (
    <div className="p-7">
      <div className="flex items-center gap-3 mb-1">
        <Upload className="h-5 w-5 text-indigo-600" />
        <h1 className="text-[22px] font-semibold text-gray-900">Data Upload</h1>
      </div>
      <p className="text-sm text-gray-600 mb-8">
        Upload your data using intelligent templates and entity mapping
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col">
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <Upload className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Entity Data</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">
            General entity data upload with flexible mapping and validation
          </p>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Upload Entity Data</Button>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-6 flex flex-col">
          <div className="h-10 mb-4 flex items-center">
            <span className="text-2xl font-extrabold text-amber-500">
              b<span className="text-emerald-600">r</span>
              <span className="text-amber-500">i</span>
              <span className="text-amber-500">o</span>
            </span>
            <span className="ml-1 text-2xl text-amber-500">°</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Customers &amp; Products</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">
            Drop here your Brio export to import customers, products, and contacts
          </p>
          <div className="rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 py-8 flex flex-col items-center justify-center mb-3">
            <Upload className="h-5 w-5 text-indigo-600 mb-1.5" />
            <span className="text-sm font-medium text-indigo-700">Drag CSV file here</span>
          </div>
          <Button className="w-full bg-purple-600 hover:bg-purple-700">Or Browse Files</Button>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/20 p-6 flex flex-col">
          <div className="h-10 mb-4 flex items-center text-base font-semibold tracking-tight text-gray-900">
            brokercloud
            <span className="text-teal-600 ml-0.5">●</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">BrokerCloud</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">
            Drop here your BrokerCloud export to import customers, products, and contacts
          </p>
          <div className="rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/40 py-8 flex flex-col items-center justify-center mb-3">
            <Upload className="h-5 w-5 text-teal-700 mb-1.5" />
            <span className="text-sm font-medium text-teal-700">Drag CSV file here</span>
          </div>
          <Button className="w-full bg-teal-700 hover:bg-teal-800">Or Browse Files</Button>
        </div>
      </div>

      <div className="mt-8">
        <PaymentRemindersUpload
          onOpenSavedList={(listId) =>
            requestNavigation({ menu: "customers", listId })
          }
        />
      </div>
    </div>
  )
}
