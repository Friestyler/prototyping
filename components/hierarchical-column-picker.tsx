"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Columns as ViewColumns, Search, ChevronRight, ChevronDown, Eye, EyeOff, Check } from "lucide-react"
import { useEffect, useMemo, useState, useCallback } from "react"

type PartnerAttribute = {
  id: string
  label: string
  lock?: boolean
  type: "partner"
}

type SubMetric = {
  id: string
  label: string
  subMetrics?: SubMetric[]
  startDate?: Date
  endDate?: Date
}

type Metric = {
  id: string
  label: string
  subMetrics?: SubMetric[]
  startDate?: Date
  endDate?: Date
}

type Tag = {
  id: string
  label: string
  metrics: Metric[]
}

type TagCategory = {
  id: string
  label: string
  tags: Tag[]
}

type KeyMetricStructure = {
  categories: TagCategory[]
}

type Field =
  | PartnerAttribute
  | {
      id: string
      label: string
      type: "keyMetric"
      structure: KeyMetricStructure
    }

type Props = {
  userId: string
  routeKey: string
  entityType: string
  partnerAttributes: PartnerAttribute[]
  keyMetricStructure: KeyMetricStructure
  defaultVisibleIds: string[]
  visibility?: Record<string, boolean>
  onChange: (vis: Record<string, boolean>) => void
  hideInSmartListPreview?: boolean
}

export default function HierarchicalColumnPicker({
  userId,
  routeKey,
  entityType,
  partnerAttributes = [],
  keyMetricStructure,
  defaultVisibleIds = [],
  visibility: externalVisibility,
  onChange,
  hideInSmartListPreview = false,
}: Props) {
  const storageKey = `qai:colvis:v2:${userId}:${routeKey}:${entityType}`

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set())
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set())
  const [expandedSubMetrics, setExpandedSubMetrics] = useState<Set<string>>(new Set())
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  const [query, setQuery] = useState("")
  const [mainQuery, setMainQuery] = useState("")

  const allFieldIds = useMemo(() => {
    const ids: string[] = []

    partnerAttributes.forEach((attr) => ids.push(attr.id))

    const addMetricIds = (metrics: (Metric | SubMetric)[]) => {
      metrics.forEach((metric) => {
        ids.push(metric.id)
        if (metric.subMetrics) {
          addMetricIds(metric.subMetrics)
        }
      })
    }

    keyMetricStructure.categories.forEach((category) => {
      category.tags.forEach((tag) => {
        ids.push(tag.id) // Add product ID itself
        addMetricIds(tag.metrics)
      })
    })

    return ids
  }, [partnerAttributes, keyMetricStructure])

  const initialVisibility = useMemo(() => {
    if (externalVisibility) {
      return externalVisibility
    }

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved) as Record<string, boolean>
    } catch {}

    const base: Record<string, boolean> = {}
    allFieldIds.forEach((id) => {
      const isPartnerAttr = partnerAttributes.find((attr) => attr.id === id)?.lock
      base[id] = isPartnerAttr ? true : defaultVisibleIds.includes(id)
    })
    return base
  }, [storageKey, allFieldIds, partnerAttributes, defaultVisibleIds, externalVisibility])

  const [visibility, setVisibility] = useState<Record<string, boolean>>(initialVisibility)

  useEffect(() => {
    if (externalVisibility) {
      setVisibility(externalVisibility)
    }
  }, [externalVisibility])

  const updateVisibility = useCallback(
    (newVisibility: Record<string, boolean>) => {
      setVisibility(newVisibility)
      try {
        localStorage.setItem(storageKey, JSON.stringify(newVisibility))
      } catch {}
      onChange?.(newVisibility)
    },
    [storageKey, onChange],
  )

  useEffect(() => {
    onChange?.(visibility)
  }, [])

  const setAll = useCallback(
    (value: boolean) => {
      const next = { ...visibility }
      allFieldIds.forEach((id) => {
        const isLocked = partnerAttributes.find((attr) => attr.id === id)?.lock
        next[id] = isLocked ? true : value
      })
      updateVisibility(next)
    },
    [allFieldIds, partnerAttributes, visibility, updateVisibility],
  )

  const handleItemChange = useCallback(
    (fieldId: string, checked: boolean) => {
      const next = { ...visibility, [fieldId]: checked }
      updateVisibility(next)
    },
    [visibility, updateVisibility],
  )

  const isMetricInDateRange = useCallback(
    (metric: Metric | SubMetric) => {
      if (!dateRange.from && !dateRange.to) return true

      const metricStart = metric.startDate
      const metricEnd = metric.endDate

      if (!metricStart) return true

      if (dateRange.from && metricEnd && metricEnd < dateRange.from) return false
      if (dateRange.to && metricStart && metricStart > dateRange.to) return false

      return true
    },
    [dateRange],
  )

  const matchesQuery = useCallback(
    (text: string) => {
      return text.toLowerCase().includes(query.toLowerCase())
    },
    [query],
  )

  const MetricItem = ({ metric, level = 0 }: { metric: Metric | SubMetric; level?: number }) => {
    const hasSubMetrics = metric.subMetrics && metric.subMetrics.length > 0
    const isExpanded = expandedMetrics.has(metric.id) || expandedSubMetrics.has(metric.id)
    const paddingLeft = level * 24 + 16

    if (!isMetricInDateRange(metric)) return null

    if (query && !matchesQuery(metric.label) && !hasSubMetrics) return null

    return (
      <div key={metric.id}>
        <div className="flex items-center" style={{ paddingLeft }}>
          {hasSubMetrics && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 mr-1"
              onClick={(e) => {
                e.stopPropagation()
                const setToUpdate = level === 0 ? setExpandedMetrics : setExpandedSubMetrics
                const currentSet = level === 0 ? expandedMetrics : expandedSubMetrics
                const newSet = new Set(currentSet)
                if (newSet.has(metric.id)) {
                  newSet.delete(metric.id)
                } else {
                  newSet.add(metric.id)
                }
                setToUpdate(newSet)
              }}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
          <div
            className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 rounded-md cursor-pointer flex-1"
            onClick={(e) => {
              e.stopPropagation()
              handleItemChange(metric.id, !visibility[metric.id])
            }}
          >
            <div className="flex items-center justify-center w-4 h-4">
              {visibility[metric.id] && <Check className="h-3 w-3 text-primary" />}
            </div>
            <span className="flex-1 text-left text-sm">{metric.label}</span>
          </div>
        </div>
        {hasSubMetrics && isExpanded && (
          <div>
            {metric.subMetrics!.filter(isMetricInDateRange).map((subMetric) => (
              <MetricItem key={subMetric.id} metric={subMetric} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      const category = keyMetricStructure.categories.find((c) => c.id === categoryId)
      if (!category) return

      const next = { ...visibility }
      const newSelectedCategories = new Set(selectedCategories)

      // Get all metric IDs from this category
      const getAllMetricIds = (metrics: (Metric | SubMetric)[]): string[] => {
        const ids: string[] = []
        metrics.forEach((metric) => {
          if (isMetricInDateRange(metric)) {
            ids.push(metric.id)
            if (metric.subMetrics) {
              ids.push(...getAllMetricIds(metric.subMetrics))
            }
          }
        })
        return ids
      }

      const categoryMetricIds: string[] = []
      category.tags.forEach((tag) => {
        categoryMetricIds.push(...getAllMetricIds(tag.metrics))
      })

      // Toggle category selection
      if (selectedCategories.has(categoryId)) {
        // Deselect category - hide all its metrics
        newSelectedCategories.delete(categoryId)
        categoryMetricIds.forEach((id) => {
          next[id] = false
        })
      } else {
        // Select category - show all its metrics and expand all tags
        newSelectedCategories.add(categoryId)
        categoryMetricIds.forEach((id) => {
          next[id] = true
        })

        // Auto-expand the category and all its tags
        setExpandedCategories((prev) => new Set([...prev, categoryId]))
        const tagIds = category.tags.map((tag) => tag.id)
        setExpandedTags((prev) => new Set([...prev, ...tagIds]))
      }

      setSelectedCategories(newSelectedCategories)
      updateVisibility(next)
    },
    [keyMetricStructure, visibility, selectedCategories, isMetricInDateRange, updateVisibility],
  )

  const handleTagBulkSelect = useCallback(
    (tagId: string) => {
      const tag = keyMetricStructure.categories.flatMap((c) => c.tags).find((t) => t.id === tagId)
      if (!tag) return

      const next = { ...visibility }

      const isCurrentlyVisible = visibility[tagId]
      next[tagId] = !isCurrentlyVisible

      console.log("[v0] Product toggled:", tag.label, "ID:", tagId, "New visibility:", !isCurrentlyVisible)

      updateVisibility(next)
    },
    [keyMetricStructure, visibility, updateVisibility],
  )

  const handleCategoryBulkSelect = useCallback(
    (categoryId: string) => {
      const category = keyMetricStructure.categories.find((c) => c.id === categoryId)
      if (!category) return

      const next = { ...visibility }

      // Get all metric IDs from this category
      const getAllMetricIds = (metrics: (Metric | SubMetric)[]): string[] => {
        const ids: string[] = []
        metrics.forEach((metric) => {
          // Only include metrics that pass the date range filter
          if (isMetricInDateRange(metric)) {
            ids.push(metric.id)
            if (metric.subMetrics) {
              ids.push(...getAllMetricIds(metric.subMetrics))
            }
          }
        })
        return ids
      }

      const categoryMetricIds: string[] = []
      category.tags.forEach((tag) => {
        categoryMetricIds.push(...getAllMetricIds(tag.metrics))
      })

      // Check if all metrics in category are currently visible
      const allVisible = categoryMetricIds.every((id) => visibility[id])

      // Toggle all metrics in category
      categoryMetricIds.forEach((id) => {
        next[id] = !allVisible
      })

      // Auto-expand the category and all its tags when selecting
      if (!allVisible) {
        setExpandedCategories((prev) => new Set([...prev, categoryId]))
        const tagIds = category.tags.map((tag) => tag.id)
        setExpandedTags((prev) => new Set([...prev, ...tagIds]))
      }

      updateVisibility(next)
    },
    [keyMetricStructure, visibility, isMetricInDateRange, updateVisibility],
  )

  const setPartnerAttributes = useCallback(
    (value: boolean) => {
      const next = { ...visibility }
      partnerAttributes.forEach((attr) => {
        if (!attr.lock) {
          next[attr.id] = value
        }
      })
      updateVisibility(next)
    },
    [partnerAttributes, visibility, updateVisibility],
  )

  const setKeyMetrics = useCallback(
    (value: boolean) => {
      console.log("[v0] setKeyMetrics called with value:", value)
      const next = { ...visibility }

      let totalProductsProcessed = 0
      keyMetricStructure.categories.forEach((category) => {
        category.tags.forEach((tag) => {
          console.log("[v0] Setting product", tag.label, "visibility to", value, "was:", next[tag.id])
          next[tag.id] = value
          totalProductsProcessed++
        })
      })

      console.log("[v0] Total products processed:", totalProductsProcessed)
      console.log("[v0] Updated visibility:", next)
      updateVisibility(next)
    },
    [keyMetricStructure, visibility, updateVisibility],
  )

  const filteredPartnerAttributes = useMemo(() => {
    if (!mainQuery) return partnerAttributes
    return partnerAttributes.filter((attr) => attr.label.toLowerCase().includes(mainQuery.toLowerCase()))
  }, [partnerAttributes, mainQuery])

  // Helper functions to check if all children are selected
  const isTagFullySelected = useCallback(
    (tag: Tag) => {
      return visibility[tag.id] === true
    },
    [visibility],
  )

  const isCategoryFullySelected = useCallback(
    (category: TagCategory) => {
      return category.tags.length > 0 && category.tags.every((tag) => isTagFullySelected(tag))
    },
    [isTagFullySelected],
  )

  const MainView = () => (
    <div className="space-y-4">
      <div className="pb-2">
        <h3 className="text-base font-semibold text-foreground tracking-tight">Customer Attributes</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Manage customer-specific data columns</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search customer attributes"
          value={mainQuery}
          onChange={(e) => setMainQuery(e.target.value)}
          className="pl-10"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-8 px-3 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            setPartnerAttributes(true)
          }}
        >
          <Eye className="h-3 w-3" />
          <span>Show all customer attributes</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-8 px-3 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            setPartnerAttributes(false)
          }}
        >
          <EyeOff className="h-3 w-3" />
          <span>Hide all customer attributes</span>
        </Button>
      </div>

      <div className="space-y-1">
        {filteredPartnerAttributes.map((attr) => (
          <div key={attr.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 rounded-md cursor-pointer">
            <div
              className="flex items-center justify-center w-4 h-4"
              onClick={(e) => {
                e.stopPropagation()
                if (!attr.lock) {
                  console.log(
                    "[v0] Customer attribute clicked:",
                    attr.id,
                    "current visibility:",
                    visibility[attr.id],
                    "will toggle to:",
                    !visibility[attr.id],
                  )
                  handleItemChange(attr.id, !visibility[attr.id])
                }
              }}
            >
              {visibility[attr.id] && <Check className="h-3 w-3 text-primary" />}
            </div>
            <span
              className="flex-1 text-left text-sm cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                if (!attr.lock) {
                  console.log(
                    "[v0] Customer attribute clicked:",
                    attr.id,
                    "current visibility:",
                    visibility[attr.id],
                    "will toggle to:",
                    !visibility[attr.id],
                  )
                  handleItemChange(attr.id, !visibility[attr.id])
                }
              }}
            >
              {attr.label}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-border my-3" />

      <div className="space-y-4">
        <div className="pb-2">
          <h3 className="text-base font-semibold text-foreground tracking-tight">Products</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Select products to display in the table</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search for new or existing fields"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-8 px-3 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              setKeyMetrics(true)
            }}
          >
            <Eye className="h-3 w-3" />
            <span>Show all products</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-8 px-3 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              setKeyMetrics(false)
            }}
          >
            <EyeOff className="h-3 w-3" />
            <span>Hide all products</span>
          </Button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {keyMetricStructure.categories.map((category) => {
            const isCategoryExpanded = expandedCategories.has(category.id)
            const filteredTags = category.tags.filter((tag) => !query || matchesQuery(tag.label))

            if (filteredTags.length === 0 && query) return null

            return (
              <div key={category.id}>
                {/* Category Header */}
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 mr-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      const newSet = new Set(expandedCategories)
                      if (newSet.has(category.id)) {
                        newSet.delete(category.id)
                      } else {
                        newSet.add(category.id)
                      }
                      setExpandedCategories(newSet)
                    }}
                  >
                    {isCategoryExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Button>
                  <div
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 rounded-md cursor-pointer flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCategoryBulkSelect(category.id)
                    }}
                  >
                    <div className="flex items-center justify-center w-4 h-4">
                      {isCategoryFullySelected(category) && <Check className="h-3 w-3 text-primary" />}
                    </div>
                    <span className="flex-1 text-left text-sm font-medium">{category.label}</span>
                  </div>
                </div>

                {/* Products (Tags) under Category */}
                {isCategoryExpanded && (
                  <div className="ml-6 space-y-1 mt-1">
                    {filteredTags.map((tag) => {
                      const hasAttributes = tag.metrics && tag.metrics.length > 0
                      const isExpanded = expandedTags.has(tag.id)

                      return (
                        <div key={tag.id}>
                          <div className="flex items-center">
                            {hasAttributes && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 mr-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const newSet = new Set(expandedTags)
                                  if (newSet.has(tag.id)) {
                                    newSet.delete(tag.id)
                                  } else {
                                    newSet.add(tag.id)
                                  }
                                  setExpandedTags(newSet)
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                            <div
                              className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 rounded-md cursor-pointer flex-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTagBulkSelect(tag.id)
                              }}
                            >
                              <div className="flex items-center justify-center w-4 h-4">
                                {isTagFullySelected(tag) && <Check className="h-3 w-3 text-primary" />}
                              </div>
                              <span className="flex-1 text-left text-sm">{tag.label}</span>
                            </div>
                          </div>
                          {hasAttributes && isExpanded && (
                            <div className="ml-6">
                              {tag.metrics
                                .filter((metric) => metric.label !== "Name")
                                .map((metric) => (
                                  <MetricItem key={metric.id} metric={metric} level={0} />
                                ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  if (hideInSmartListPreview) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <ViewColumns className="h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-96 p-4 max-h-[600px] overflow-y-auto"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="px-1 pb-2" onClick={(e) => e.stopPropagation()}>
          <MainView />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
