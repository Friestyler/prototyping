"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronDown, Plug } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const StarIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const DatabaseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
)

const SendIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
)

interface SidebarNavigationProps {
  activeMenu: string
  onMenuChange: (menu: string) => void
  forceCollapsed?: boolean
}

export default function SidebarNavigation({ activeMenu, onMenuChange }: SidebarNavigationProps) {
  const [isDataOpen, setIsDataOpen] = useState(true)

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] w-[240px] font-sans">
      <div className="flex items-center justify-start pt-5 pb-6 px-4">
        <img src="/images/image.png" alt="Logo" className="w-[48px] h-[48px] rounded-full" />
      </div>

      <div className="px-3 pb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-[42px] justify-between bg-white hover:bg-gray-50 border-gray-300 rounded-lg px-3 shadow-none font-normal"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-medium">E</span>
                </div>
                <span className="text-[#1F2937] text-[15px]">Brand Broker</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-600 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[216px]">
            <DropdownMenuItem>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">E</span>
                </div>
                <span>Brand Broker</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <nav className="space-y-0.5">
          {/* Broker Hub — top-level item */}
          <Button
            variant="ghost"
            className={cn(
              "w-full h-[38px] justify-start font-normal text-[15px] px-2.5 rounded-lg",
              activeMenu === "broker-hub"
                ? "bg-[#E0E7FF] text-[#4F46E5] font-medium"
                : "text-[#1F2937] hover:bg-gray-200/50",
            )}
            onClick={() => onMenuChange("broker-hub")}
          >
            <StarIcon />
            <span className="ml-2.5">Broker Hub</span>
          </Button>

          {/* Portfolio Insights — top-level item */}
          <Button
            variant="ghost"
            className={cn(
              "w-full h-[38px] justify-start font-normal text-[15px] px-2.5 rounded-lg",
              activeMenu === "portfolio-insights"
                ? "bg-[#E0E7FF] text-[#4F46E5] font-medium"
                : "text-[#1F2937] hover:bg-gray-200/50",
            )}
            onClick={() => onMenuChange("portfolio-insights")}
          >
            <DatabaseIcon />
            <span className="ml-2.5">{"My Portfolio"}</span>
          </Button>

          {/* Smart Lists Section */}
          <Collapsible open={isDataOpen} onOpenChange={setIsDataOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-[38px] justify-start text-[#1F2937] hover:bg-gray-200/50 font-normal text-[15px] px-2.5 rounded-lg"
              >
                <SendIcon />
                <span className="ml-2.5 flex-1 text-left">Smart Lists</span>
                <ChevronDown
                  className={cn("h-4 w-4 text-gray-600 transition-transform duration-200", isDataOpen && "rotate-180")}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-0.5">
              <div className="relative pl-[30px] space-y-0.5">
                <div className="absolute left-[11px] top-0 bottom-0 w-[1px] bg-gray-300" />
                <button
                  className={cn(
                    "relative w-full h-[34px] text-left px-3 text-[15px] font-normal rounded-md transition-colors",
                    activeMenu === "customers"
                      ? "bg-[#E0E7FF] text-[#4F46E5] font-medium"
                      : "text-[#1F2937] hover:bg-gray-200/50",
                  )}
                  onClick={() => onMenuChange("customers")}
                >
                  Customers
                </button>
                <button
                  className={cn(
                    "relative w-full h-[34px] text-left px-3 text-[15px] font-normal rounded-md transition-colors",
                    activeMenu === "leads"
                      ? "bg-[#E0E7FF] text-[#4F46E5] font-medium"
                      : "text-[#1F2937] hover:bg-gray-200/50",
                  )}
                  onClick={() => onMenuChange("leads")}
                >
                  Leads
                </button>
                <button
                  className="relative w-full h-[34px] text-left px-3 text-[15px] font-normal text-[#1F2937] hover:bg-gray-200/50 rounded-md transition-colors"
                  onClick={() => onMenuChange("products")}
                >
                  Products
                </button>
                <button
                  className="relative w-full h-[34px] text-left px-3 text-[15px] font-normal text-[#1F2937] hover:bg-gray-200/50 rounded-md transition-colors"
                  onClick={() => onMenuChange("contacts")}
                >
                  Contacts
                </button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Campaigns — top-level item */}
          <Button
            variant="ghost"
            className={cn(
              "w-full h-[38px] justify-start font-normal text-[15px] px-2.5 rounded-lg",
              activeMenu === "campaigns"
                ? "bg-[#E0E7FF] text-[#4F46E5] font-medium"
                : "text-[#1F2937] hover:bg-gray-200/50",
            )}
            onClick={() => onMenuChange("campaigns")}
          >
            <SendIcon />
            <span className="ml-2.5">Campaigns</span>
          </Button>
        </nav>
      </div>

      {/* Profile menu — bottom of sidebar */}
      <div className="px-3 pb-4 pt-2 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-[42px] justify-start px-2.5 rounded-lg hover:bg-gray-200/50 font-normal"
            >
              <div className="w-7 h-7 rounded-full bg-[#4F46E5] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[12px] font-medium">K</span>
              </div>
              <span className="ml-2.5 text-[15px] text-[#1F2937] flex-1 text-left">Kamelia</span>
              <ChevronDown className="h-4 w-4 text-gray-600 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-[216px]">
            <DropdownMenuItem onClick={() => onMenuChange("mcp-setup")}>
              <Plug className="h-4 w-4 mr-2" />
              <span>Connect to Claude (MCP)</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <span className="text-[13px] text-gray-500">Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
