"use client"

import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  User,
  Users,
  Shield,
  Mail,
  List,
  TrendingUp,
  Building2,
  UserCircle,
  Users2,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsSidebarProps {
  activeItem?: string
  onBack?: () => void
  onNavigate?: (item: string) => void
}

export function SettingsSidebar({ activeItem = "smart-lists", onBack, onNavigate }: SettingsSidebarProps) {
  const menuSections = [
    {
      title: "MY ACCOUNT",
      items: [{ id: "profile", label: "Profile", icon: User }],
    },
    {
      title: "ORGANIZATION",
      items: [
        { id: "general", label: "General", icon: Users2 },
        { id: "users", label: "Users", icon: Users },
        { id: "roles", label: "Roles", icon: Shield },
      ],
    },
    {
      title: "CAMPAIGNS",
      items: [{ id: "senders", label: "Senders", icon: Mail }],
    },
    {
      title: "AI SETTINGS",
      items: [{ id: "smart-lists", label: "Smart Lists", icon: List }],
    },
    {
      title: "ENTITIES",
      items: [
        { id: "opportunities", label: "Opportunities", icon: TrendingUp },
        { id: "partners", label: "Partners", icon: Building2 },
        { id: "customers", label: "Customers", icon: UserCircle },
        { id: "contacts", label: "Contacts", icon: Users2 },
      ],
    },
    {
      title: "SYSTEM",
      items: [{ id: "activity", label: "Activity", icon: Activity }],
    },
  ]

  return (
    <div className="w-[230px] h-screen bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">Settings</h2>
        {onBack && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-200" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {menuSections.map((section) => (
          <div key={section.title} className="mb-6">
            <div className="px-4 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{section.title}</h3>
            </div>
            <div className="space-y-1 px-2">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = activeItem === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate?.(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive ? "bg-gray-200 text-gray-900 font-medium" : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
