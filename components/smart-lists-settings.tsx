"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, TrendingUp, Calendar, Target, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SmartListTemplateDialog } from "@/components/smart-list-template-dialog"
import { SettingsSidebar } from "@/components/settings-sidebar"

interface SmartListTemplate {
  id: string
  name: string
  description: string
  enabled: boolean
  sqlQuery: string
  minListSize: number
  maxListSize: number
  updateFrequency: "daily" | "weekly" | "monthly" | "manual"
  icon?: React.ReactNode
  logoUrl?: string
  category?: "Offered" | "Market Radar"
  expirationDate?: string // Added expiration date field for Offered templates
}

interface SmartListsSettingsProps {
  onBack: () => void
}

export default function SmartListsSettings({ onBack }: SmartListsSettingsProps) {
  const [templates, setTemplates] = useState<SmartListTemplate[]>([
    {
      id: "1",
      name: "High-Value Prospects",
      description: "Identify customers with high revenue potential based on demographics and behavior",
      enabled: true,
      sqlQuery: "SELECT * FROM customers WHERE revenue_potential > 10000",
      minListSize: 10,
      maxListSize: 1000,
      updateFrequency: "weekly",
      icon: <TrendingUp className="h-5 w-5" />,
      category: "Market Radar",
      expirationDate: "2024-12-31", // Added expiration date field for Offered templates
    },
    {
      id: "2",
      name: "Renewal Risk Analysis",
      description: "Customers at risk of not renewing their policies",
      enabled: true,
      sqlQuery: "SELECT * FROM customers WHERE renewal_date < DATE_ADD(NOW(), INTERVAL 30 DAY)",
      minListSize: 10,
      maxListSize: 1000,
      updateFrequency: "weekly",
      icon: <Calendar className="h-5 w-5" />,
      category: "Market Radar",
      expirationDate: "2024-06-30", // Added expiration date field for Offered templates
    },
    {
      id: "3",
      name: "Cross-sell Opportunities",
      description: "Existing customers who could benefit from additional products",
      enabled: false,
      sqlQuery: "SELECT * FROM customers WHERE product_count < 3",
      minListSize: 10,
      maxListSize: 1000,
      updateFrequency: "weekly",
      icon: <Target className="h-5 w-5" />,
      category: "Market Radar",
      expirationDate: "2024-09-30", // Added expiration date for deactivated Market Radar template
    },
    {
      id: "4",
      name: "Two-Product Cross-sell",
      description: "Customers with exactly two products ready for third product upsell",
      enabled: true,
      sqlQuery: `SELECT 
  c.id as customer_id,
  c.name as customer_name,
  p1.name as product_1,
  p1.value as product_1_value,
  p1.category as product_1_category,
  p2.name as product_2,
  p2.value as product_2_value,
  p2.category as product_2_category
FROM customers c
JOIN products p1 ON c.id = p1.customer_id
JOIN products p2 ON c.id = p2.customer_id AND p2.id > p1.id
WHERE (
  SELECT COUNT(*) FROM products WHERE customer_id = c.id
) = 2
ORDER BY c.name`,
      minListSize: 10,
      maxListSize: 1000,
      updateFrequency: "weekly",
      icon: <Users className="h-5 w-5" />,
      category: "Offered",
    },
  ])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<SmartListTemplate | undefined>()

  const handleToggleTemplate = (id: string) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)))
  }

  const handleEditTemplate = (template: SmartListTemplate) => {
    setEditingTemplate(template)
    setDialogOpen(true)
  }

  const handleSaveTemplate = (template: SmartListTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.id === template.id ? template : t)))
    setDialogOpen(false)
    setEditingTemplate(undefined)
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Settings Sidebar */}
      <SettingsSidebar
        activeItem="smart-lists"
        onBack={onBack}
        onNavigate={(item) => {
          // Handle navigation to other settings pages
          console.log("[v0] Navigate to:", item)
        }}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border bg-white">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-semibold text-foreground">Smart List Templates</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Discover hidden revenue opportunities with intelligent customer segmentation. Our smart list templates
              continuously analyze your customer base to identify high-value prospects, renewal risks, and cross-sell
              potential.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                    Active
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                    Expiration Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <Switch checked={template.enabled} onCheckedChange={() => handleToggleTemplate(template.id)} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {template.logoUrl ? (
                          <div className="w-10 h-10 rounded-lg bg-branded-muted/50 border border-branded-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img
                              src={template.logoUrl || "/placeholder.svg"}
                              alt=""
                              className="w-6 h-6 object-contain"
                            />
                          </div>
                        ) : template.icon ? (
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              template.category === "Offered"
                                ? "bg-branded-muted/50 border border-branded-border text-branded"
                                : "bg-blue-50/50 border border-blue-100 text-blue-600"
                            }`}
                          >
                            {template.icon}
                          </div>
                        ) : null}
                        <div className="text-sm font-medium text-foreground">{template.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {template.category && (
                        <Badge
                          variant="secondary"
                          className={
                            template.category === "Offered"
                              ? "bg-branded-muted/30 text-branded border-branded-border"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }
                        >
                          {template.category}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {template.category === "Market Radar" && template.expirationDate && (
                        <div className="text-sm text-foreground">{template.expirationDate}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-muted-foreground">{template.description}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          template.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {template.enabled ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                            Edit smart list template
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Template Dialog */}
      <SmartListTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  )
}
