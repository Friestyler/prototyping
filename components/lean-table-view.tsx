"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown } from "lucide-react"
import { Search, MoreHorizontal, Target, Network, GitBranch, Eye, X, Filter, Bookmark, Plus, List } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { initialPartners, type Partner } from "@/lib/okr-data"
import HierarchicalColumnPicker from "./hierarchical-column-picker"
import AdvancedQueryBuilder, { type FilterGroup } from "./advanced-query-builder"

type Props = {
  data?: Partner[]
  onChange?: (next: Partner[]) => void
}

type SavedView = {
  id: string
  name: string
  filters: FilterGroup | null
  columnVisibility: Record<string, boolean>
  createdAt: Date
}

interface SavedList {
  id: string
  name: string
  type: "dynamic" | "static"
  partnerCount: number
  partnerIds?: string[] // For static lists - specific partner IDs
  searchTerm?: string
  filters?: {
    status: string
    type: string
    size: string
    stage: string
  }
}

const mockSavedLists: SavedList[] = [
  {
    id: "1",
    name: "All Partners",
    type: "static",
    partnerCount: 33,
    partnerIds: Array.from({ length: 33 }, (_, i) => (i + 1).toString()), // All partner IDs 1-33
  },
  {
    id: "2",
    name: "High Priority",
    type: "dynamic",
    partnerCount: 25,
    searchTerm: "priority",
    filters: { status: "active", type: "all", size: "all", stage: "all" },
  },
  {
    id: "3",
    name: "Tech Companies",
    type: "static",
    partnerCount: 3,
    partnerIds: ["1", "4", "6"], // Manually selected tech companies
  },
]

const formatEuropeanNumber = (value: number, unit?: string): string => {
  if (value === undefined || value === null) return "-"

  // Format number with European style: periods for thousands, commas for decimals
  const formatted = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)

  if (unit === "currency") return `${formatted} €`
  if (unit === "percentage") return `${formatted}%`
  if (unit === "#") return `${formatted} #`
  if (unit === "number") return formatted

  return formatted
}

export default function LeanTableView({ data: dataProp, onChange }: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [advancedFilter, setAdvancedFilter] = useState<FilterGroup | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPartners, setSelectedPartners] = useState<Set<string>>(new Set())
  const [selectedOKR, setSelectedOKR] = useState<any>(null)
  const [showOKRModal, setShowOKRModal] = useState(false)
  const [editingCell, setEditingCell] = useState<string | null>(null)

  const [savedViews, setSavedViews] = useState<SavedView[]>([
    {
      id: "default",
      name: "Default Board",
      filters: null,
      columnVisibility: {
        partner: true,
        team: true,
        revenue: true,
        satisfaction: true,
        expansion: false,
        leads: false,
        retention: false,
      },
      createdAt: new Date(),
    },
  ])
  const [currentViewId, setCurrentViewId] = useState<string>("default")
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [newViewName, setNewViewName] = useState("")
  const [isLoadingView, setIsLoadingView] = useState(false)

  const partnerAttributes = [
    { id: "partner", label: "Partner", type: "partner" as const },
    { id: "team", label: "Team", type: "partner" as const },
  ]

  const keyMetricStructure = {
    categories: [
      {
        id: "financial",
        label: "Financial Metrics",
        tags: [
          {
            id: "revenue-tag",
            label: "Revenue & Growth",
            metrics: [
              {
                id: "revenue",
                label: "Revenue Growth",
                unit: "currency" as const,
                subMetrics: [
                  { id: "revenue-q1", label: "Q1 Revenue", unit: "currency" as const },
                  { id: "revenue-q2", label: "Q2 Revenue", unit: "currency" as const },
                  { id: "revenue-q3", label: "Q3 Revenue", unit: "currency" as const },
                  { id: "revenue-q4", label: "Q4 Revenue", unit: "currency" as const },
                ],
              },
              {
                id: "expansion",
                label: "Market Expansion",
                unit: "percentage" as const,
                subMetrics: [
                  { id: "expansion-new-markets", label: "New Markets Entered", unit: "number" as const },
                  { id: "expansion-market-share", label: "Market Share Growth", unit: "percentage" as const },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "customer",
        label: "Customer Metrics",
        tags: [
          {
            id: "satisfaction-tag",
            label: "Customer Experience",
            metrics: [
              {
                id: "satisfaction",
                label: "Customer Satisfaction",
                unit: "percentage" as const,
                subMetrics: [
                  { id: "satisfaction-nps", label: "Net Promoter Score", unit: "number" as const },
                  { id: "satisfaction-csat", label: "Customer Satisfaction Score", unit: "percentage" as const },
                ],
              },
              {
                id: "retention",
                label: "Customer Retention",
                unit: "percentage" as const,
                subMetrics: [
                  { id: "retention-rate", label: "Retention Rate", unit: "percentage" as const },
                  { id: "retention-churn", label: "Churn Rate", unit: "percentage" as const },
                ],
              },
            ],
          },
          {
            id: "acquisition-tag",
            label: "Customer Acquisition",
            metrics: [
              {
                id: "leads",
                label: "Lead Generation",
                unit: "#" as const,
                subMetrics: [
                  { id: "leads-qualified", label: "Qualified Leads", unit: "#" as const },
                  { id: "leads-conversion", label: "Lead Conversion Rate", unit: "percentage" as const },
                ],
              },
            ],
          },
        ],
      },
    ],
  }

  const availableFields = [
    { id: "partner", label: "Partner Name", type: "text" as const },
    { id: "team", label: "Team", type: "number" as const },
    { id: "tags", label: "Tags", type: "tags" as const },
    {
      id: "status",
      label: "OKR Status",
      type: "select" as const,
      options: ["success", "warning", "error", "undefined"],
    },
  ]

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    partner: true,
    team: true,
    revenue: true,
    satisfaction: true,
    expansion: true,
    leads: true,
    retention: true,
  })

  const [editValue, setEditValue] = useState("")
  const [internal, setInternal] = useState<Partner[]>(dataProp ?? initialPartners)

  const data = dataProp ?? internal
  const setData = (next: Partner[]) => (onChange ? onChange(next) : setInternal(next))

  const applyAdvancedFilter = (partner: Partner, filter: FilterGroup) => {
    const evaluateCondition = (condition: any) => {
      const { field, operator, value } = condition

      if (field === "partner") {
        const partnerName = partner.name.toLowerCase()
        const searchValue = value.toLowerCase()

        switch (operator) {
          case "contains":
            return partnerName.includes(searchValue)
          case "equals":
            return partnerName === searchValue
          case "not_equals":
            return partnerName !== searchValue
          case "starts_with":
            return partnerName.startsWith(searchValue)
          case "ends_with":
            return partnerName.endsWith(searchValue)
          default:
            return false
        }
      }

      if (field === "team") {
        const teamSize = partner.team.length
        const numValue = Number.parseFloat(value)
        if (isNaN(numValue)) return false

        switch (operator) {
          case "equals":
            return teamSize === numValue
          case "not_equals":
            return teamSize !== numValue
          case "greater_than":
            return teamSize > numValue
          case "less_than":
            return teamSize < numValue
          case "greater_equal":
            return teamSize >= numValue
          case "less_equal":
            return teamSize <= numValue
          default:
            return false
        }
      }

      if (field === "tags") {
        const allOkrTags = Object.values(partner.okrs)
          .flatMap((okr) => okr.tags || [])
          .map((tag) => tag.toLowerCase())

        const searchValues = Array.isArray(value)
          ? value.map((v) => v.toLowerCase())
          : value
              .toLowerCase()
              .split(",")
              .filter(Boolean)
              .map((v: string) => v.trim())

        switch (operator) {
          case "contains":
            return searchValues.some((searchValue) => allOkrTags.includes(searchValue))
          case "contains_any":
            return searchValues.some((searchValue) => allOkrTags.includes(searchValue))
          case "is_empty":
            return allOkrTags.length === 0
          case "is_not_empty":
            return allOkrTags.length > 0
          default:
            return false
        }
      }

      return false
    }

    const { conditions, logic } = filter

    if (logic === "AND") {
      return conditions.every(evaluateCondition)
    } else {
      return conditions.some(evaluateCondition)
    }
  }

  const visibleOKRColumns = keyMetricStructure.categories
    .flatMap((category) => category.tags)
    .flatMap((tag) => tag.metrics)
    .filter((metric) => columnVisibility[metric.id])

  const getOKRIcon = (okr: any) => {
    if (okr.type === "Objective") return <Target className="h-3 w-3 text-blue-600" />
    return okr.level === 1 ? (
      <Network className="h-3 w-3 text-purple-600" />
    ) : (
      <GitBranch className="h-3 w-3 text-purple-400" />
    )
  }

  const handleEdit = (partnerId: string, okrId: string, field: "realized" | "target", currentValue: number) => {
    setEditingCell(`${partnerId}-${okrId}-${field}`)
    setEditValue((currentValue ?? "").toString())
  }

  const handleSave = (partnerId: string, okrId: string, field: "realized" | "target") => {
    const numericValue = Number.parseFloat(editValue.replace(/[^\d.-]/g, ""))
    if (!isNaN(numericValue)) {
      setData(
        data.map((partner) =>
          partner.id === partnerId
            ? { ...partner, okrs: { ...partner.okrs, [okrId]: { ...partner.okrs[okrId], [field]: numericValue } } }
            : partner,
        ),
      )
    }
    setEditingCell(null)
    setEditValue("")
  }

  const handleStatusChange = (partnerId: string, okrId: string, newStatus: string) => {
    setData(
      data.map((partner) =>
        partner.id === partnerId
          ? { ...partner, okrs: { ...partner.okrs, [okrId]: { ...partner.okrs[okrId], status: newStatus as any } } }
          : partner,
      ),
    )
  }

  const handleColumnVisibilityChange = (newVisibility: Record<string, boolean>) => {
    setColumnVisibility(newVisibility)
  }

  const saveCurrentView = () => {
    if (!newViewName.trim()) return

    const newView: SavedView = {
      id: Date.now().toString(),
      name: newViewName.trim(),
      filters: advancedFilter,
      columnVisibility: { ...columnVisibility },
      createdAt: new Date(),
    }

    setSavedViews((prev) => [...prev, newView])
    setCurrentViewId(newView.id)
    setNewViewName("")
    setShowViewDialog(false)
  }

  const loadView = (viewId: string) => {
    const view = savedViews.find((v) => v.id === viewId)
    if (!view) return

    setIsLoadingView(true)
    setAdvancedFilter(view.filters)
    setColumnVisibility(view.columnVisibility)
    setCurrentViewId(viewId)

    setTimeout(() => setIsLoadingView(false), 100)
  }

  const deleteView = (viewId: string) => {
    if (viewId === "default") return // Don't allow deleting default view

    setSavedViews((prev) => prev.filter((v) => v.id !== viewId))
    if (currentViewId === viewId) {
      setCurrentViewId("default")
      loadView("default")
    }
  }

  const getCurrentViewName = () => {
    return savedViews.find((v) => v.id === currentViewId)?.name || "Current Board"
  }

  const getOKRTagName = (okrId: string): string => {
    for (const category of keyMetricStructure.categories) {
      for (const tag of category.tags) {
        const metric = tag.metrics.find((m) => m.id === okrId)
        if (metric) {
          return tag.label
        }
      }
    }
    return "Unknown Tag"
  }

  const [selectedListId, setSelectedListId] = useState<string | null>("1")
  const [savedLists] = useState<SavedList[]>(mockSavedLists)

  const getListFilteredPartners = (partners: Partner[]) => {
    const selectedList = savedLists.find((list) => list.id === selectedListId)
    if (!selectedList) return partners

    console.log("[v0] Filtering partners for list:", selectedList.name, selectedList)
    console.log("[v0] Total partners before filtering:", partners.length)

    if (selectedList.type === "static" && selectedList.partnerIds) {
      // Static list - show only the manually selected partners
      const result = partners.filter((partner) => selectedList.partnerIds!.includes(partner.id.toString()))
      console.log("[v0] Static list filtered partners:", result.length)
      return result
    }

    if (selectedList.type === "dynamic" && selectedList.filters) {
      // Dynamic list - apply filters automatically
      const result = partners.filter((partner) => {
        const listFilters = selectedList.filters!
        const listSearchTerm = selectedList.searchTerm || ""

        const matchesListSearch =
          !listSearchTerm ||
          partner.name.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
          partner.code?.toLowerCase().includes(listSearchTerm.toLowerCase())

        const matchesListFilters =
          (listFilters.status === "all" || partner.status === listFilters.status) &&
          (listFilters.size === "all" || partner.teamSize === listFilters.size)

        const matches = matchesListSearch && matchesListFilters
        if (matches) {
          console.log(
            "[v0] Partner matches:",
            partner.name,
            "status:",
            partner.status,
            "search:",
            matchesListSearch,
            "filters:",
            matchesListFilters,
          )
        }
        return matches
      })
      console.log("[v0] Dynamic list filtered partners:", result.length)
      return result
    }

    return partners
  }

  const getEffectiveColumnVisibility = () => {
    return columnVisibility
  }

  const effectiveColumnVisibility = getEffectiveColumnVisibility()

  const filteredData = useMemo(() => {
    let result = data.filter((partner) => {
      const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesAdvancedFilter = advancedFilter ? applyAdvancedFilter(partner, advancedFilter) : true
      return matchesSearch && matchesAdvancedFilter
    })

    // Apply list filtering
    result = getListFilteredPartners(result)

    return result
  }, [data, searchTerm, advancedFilter, selectedListId, savedLists])

  useEffect(() => {
    if (isLoadingView || currentViewId === "default") return

    const currentView = savedViews.find((v) => v.id === currentViewId)
    if (!currentView) return

    setSavedViews((prev) =>
      prev.map((view) =>
        view.id === currentViewId
          ? { ...view, filters: advancedFilter, columnVisibility: { ...columnVisibility } }
          : view,
      ),
    )
  }, [advancedFilter, columnVisibility, currentViewId, isLoadingView])

  const activeFilterCount = advancedFilter ? advancedFilter.conditions.length : 0

  const visibleColumns = keyMetricStructure.categories
    .flatMap((category) => category.tags)
    .flatMap((tag) => tag.metrics)
    .filter((metric) => effectiveColumnVisibility[metric.id])

  const getCurrentListName = () => {
    return savedLists.find((list) => list.id === selectedListId)?.name || "All Partners"
  }

  return (
    <div className="space-y-4">
      {/* Primary Actions Section - Board Management */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter op naam"
              className="pl-8 h-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent h-9">
                <Bookmark className="h-4 w-4" />
                {getCurrentViewName()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Saved Boards</div>
              <DropdownMenuSeparator />
              {savedViews.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => loadView(view.id)}
                >
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-3 w-3" />
                    <span className={currentViewId === view.id ? "font-medium" : ""}>{view.name}</span>
                  </div>
                  {view.id !== "default" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteView(view.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowViewDialog(true)}>
                <Plus className="h-3 w-3 mr-2" />
                Create New Board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent h-9">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[800px]">
              <Card className="border-0 shadow-none">
                <CardContent className="p-4">
                  <AdvancedQueryBuilder
                    filters={advancedFilter}
                    onFiltersChange={setAdvancedFilter}
                    availableFields={availableFields}
                  />
                </CardContent>
              </Card>
            </DropdownMenuContent>
          </DropdownMenu>

          <HierarchicalColumnPicker
            userId="user1"
            routeKey="pulse-board"
            entityType="partner"
            partnerAttributes={partnerAttributes}
            keyMetricStructure={keyMetricStructure}
            defaultVisibleIds={["partner", "team", "revenue", "satisfaction", "expansion", "leads"]}
            visibility={effectiveColumnVisibility}
            onChange={setColumnVisibility}
          />
        </div>
      </div>

      {/* Secondary Actions Section - List Filtering */}
      <div className="flex items-center justify-between mb-6 py-2 px-2 rounded border-l-2 border-l-muted">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by list:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                <List className="h-3 w-3" />
                {getCurrentListName()}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {mockSavedLists.map((list) => (
                <DropdownMenuItem
                  key={list.id}
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => {
                    setSelectedListId(list.id === "1" ? null : list.id)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${list.type === "dynamic" ? "bg-purple-500" : "bg-gray-400"}`}
                    />
                    <span>{list.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{list.partnerCount}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {selectedPartners.size > 0 && (
        <div className="bg-[#F5F5FF] border rounded-lg p-4 flex items-center justify-between border-[#D8D8FF]">
          <div className="flex items-center gap-4">
            <span className="text-[#4A4A8A] font-medium text-sm">{selectedPartners.size} partners selected</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOKRModal(true)}
                className="text-[#4A4A8A] hover:bg-[#BFC6F5] bg-[rgba(225,228,251,1)] border-0"
              >
                <Target className="h-4 w-4 mr-2" />+ Assign key metric
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPartners(new Set())}
            className="text-[#4A4A8A] hover:text-[#6A6ABF]"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-max">
              <thead className="border-b bg-muted/30 sticky top-0 z-10">
                <tr>
                  <th className="text-left p-3 w-4"> </th>
                  {effectiveColumnVisibility.partner && <th className="text-left p-3 min-w-[250px]">Partner</th>}
                  {effectiveColumnVisibility.team && <th className="text-left p-3 w-32">Team</th>}
                  {visibleColumns.map((column) => (
                    <TableHead key={column.id} className="text-center p-3 min-w-[120px]">
                      <div className="flex items-center gap-2 justify-center">
                        {getOKRIcon(column)}
                        <div
                          className="text-xs font-medium max-w-[250px] truncate cursor-help"
                          title={getOKRTagName(column.id)}
                        >
                          {column.label}
                        </div>
                      </div>
                    </TableHead>
                  ))}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {filteredData.map((partner) => (
                  <tr key={partner.id} className="border-b hover:bg-muted/20 h-16">
                    <td className="p-3">
                      <Checkbox
                        checked={selectedPartners.has(partner.id)}
                        onCheckedChange={() => {
                          const next = new Set(selectedPartners)
                          if (next.has(partner.id)) next.delete(partner.id)
                          else next.add(partner.id)
                          setSelectedPartners(next)
                        }}
                      />
                    </td>
                    {effectiveColumnVisibility.partner && (
                      <td className="p-3">
                        <div className="font-medium text-sm">{partner.name}</div>
                      </td>
                    )}
                    {effectiveColumnVisibility.team && (
                      <td className="p-3">
                        <div className="flex gap-1">
                          {partner.team.map((m, i) => (
                            <Avatar key={i} className="h-5 w-5">
                              <AvatarFallback className={`${m.color} text-white text-xs`}>{m.initials}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </td>
                    )}

                    {visibleColumns.map((column) => {
                      const okr = partner.okrs[column.id]
                      return (
                        <td key={column.id} className="p-3 text-center min-w-[120px]">
                          {okr ? (
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-1 justify-end">
                                {editingCell === `${partner.id}-${column.id}-realized` ? (
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-24 h-7 text-xs"
                                    onBlur={() => handleSave(partner.id, column.id, "realized")}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSave(partner.id, column.id, "realized")
                                      if (e.key === "Escape") {
                                        setEditingCell(null)
                                        setEditValue("")
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <button
                                    onClick={() => handleEdit(partner.id, column.id, "realized", okr.realized)}
                                    className="text-sm hover:bg-muted/50 px-1 py-0.5 rounded font-normal"
                                  >
                                    {formatEuropeanNumber(okr.realized, column.unit)}
                                  </button>
                                )}

                                <span className="text-muted-foreground text-sm">/</span>
                                {editingCell === `${partner.id}-${column.id}-target` ? (
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-24 h-7 text-xs"
                                    onBlur={() => handleSave(partner.id, column.id, "target")}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSave(partner.id, column.id, "target")
                                      if (e.key === "Escape") {
                                        setEditingCell(null)
                                        setEditValue("")
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <button
                                    onClick={() => handleEdit(partner.id, column.id, "target", okr.target || 0)}
                                    className="text-sm hover:bg-muted/50 px-1 py-0.5 rounded font-normal"
                                  >
                                    {okr.target ? formatEuropeanNumber(okr.target, column.unit) : "-"}
                                  </button>
                                )}
                              </div>

                              <div className="flex-shrink-0">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-52">
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 cursor-pointer"
                                      onClick={() =>
                                        setSelectedOKR({ partner, okr: { ...okr, name: column.label, id: column.id } })
                                      }
                                    >
                                      <Eye className="w-4 h-4 text-muted-foreground" />
                                      <span>View details</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-3">
                              <span className="text-sm text-muted-foreground">-</span>
                            </div>
                          )}
                        </td>
                      )
                    })}

                    <td className="p-3">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedOKR && (
        <Dialog open={!!selectedOKR} onOpenChange={() => setSelectedOKR(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getOKRIcon(selectedOKR.okr)}
                {selectedOKR.okr.name} - {selectedOKR.partner.name}
              </DialogTitle>
              <DialogDescription>
                {selectedOKR.okr.type} {selectedOKR.okr.level && `• Level ${selectedOKR.okr.level}`} •{" "}
                {selectedOKR.okr.target ? "Target & Realized" : "Realized Only"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Current Realized</div>
                    <div className="text-2xl font-bold">
                      {formatEuropeanNumber(selectedOKR.okr.realized, "currency")}
                    </div>
                  </CardContent>
                </Card>
                {typeof selectedOKR.okr.target !== "undefined" && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Target</div>
                      <div className="text-2xl font-bold">
                        {formatEuropeanNumber(selectedOKR.okr.target, "currency")}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">Milestones</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Milestone</TableHead>
                      <TableHead>Realized</TableHead>
                      <TableHead>Target</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOKR.okr.milestones.map((m: any) => (
                      <TableRow key={m.year}>
                        <TableCell className="font-medium">{m.year}</TableCell>
                        <TableCell>{formatEuropeanNumber(m.realized, "currency")}</TableCell>
                        <TableCell>
                          {typeof m.target !== "undefined" ? formatEuropeanNumber(m.target, "currency") : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedOKR.okr.opportunities && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Related Opportunities</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Opportunity</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOKR.okr.opportunities.map((opp: any) => (
                        <TableRow key={opp.id}>
                          <TableCell className="font-medium">{opp.name}</TableCell>
                          <TableCell>{formatEuropeanNumber(opp.value, "currency")}</TableCell>
                          <TableCell>
                            <Badge variant={opp.status === "Closed Won" ? "default" : "outline"}>{opp.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>Save your current filter and column settings as a reusable board.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Board Name</label>
              <Input
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="Enter board name..."
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveCurrentView()
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveCurrentView} disabled={!newViewName.trim()}>
                Save Board
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
