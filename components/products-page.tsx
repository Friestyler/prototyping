"use client"

import { useState } from "react"
import { ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Tab = "products" | "categories"

const CATEGORIES = [
  "Rechtsbijstand",
  "BA particulieren",
  "Transport & marine",
  "Objectieve aansprakelijkheid en van onroerende goederen",
  "Leven en belegging",
  "Diversen",
  "Individueel",
  "Auto",
  "Lening",
  "Brand bijzondere risico's",
  "Reis",
]

export default function ProductsPage() {
  const [tab, setTab] = useState<Tab>("categories")

  return (
    <div className="bg-white min-h-full">
      <div className="px-7 py-2.5 bg-white border-b border-border flex items-center gap-2 text-[13px] text-muted-foreground">
        <span>…</span>
        <span>/</span>
        <span className="text-brand font-medium">Products</span>
        <span>/</span>
        <span className="text-foreground font-medium">
          {tab === "categories" ? "Categories" : "All Products"}
        </span>
      </div>

      <div className="p-7">
        <div className="flex items-center gap-2 mb-6">
          <TabButton active={tab === "products"} onClick={() => setTab("products")}>
            Products
          </TabButton>
          <TabButton active={tab === "categories"} onClick={() => setTab("categories")}>
            Product Categories
          </TabButton>
        </div>

        {tab === "categories" && <Categories />}
        {tab === "products" && (
          <div className="text-sm text-muted-foreground">
            Product list view coming soon.
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center py-[7px] px-3.5 rounded-lg text-[13px] font-medium transition-colors",
        active ? "bg-brand-light text-brand" : "text-muted-foreground hover:bg-gray-50",
      )}
    >
      {children}
    </button>
  )
}

function Categories() {
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your product categories and subcategories
          </p>
        </div>
        <Button>
          <Plus className="h-[13px] w-[13px]" />
          Add Category
        </Button>
      </div>

      <div className="space-y-2 pl-1">
        {CATEGORIES.map((c) => (
          <div key={c} className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-[13px] text-indigo-700">
              {c}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
