"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Filter, X, Plus } from "lucide-react"

export interface OKRFilterCriteria {
  id: string
  okrType: string
  unit: "currency" | "number" | "percentage" | "none"
}

export interface AdvancedOKRFilter {
  criteria: OKRFilterCriteria[]
  logic: "AND" | "OR"
}

interface Props {
  onFilterChange: (filter: AdvancedOKRFilter | null) => void
  availableOKRs: Array<{ id: string; label: string; unit: "currency" | "number" | "percentage" | "none" }>
}

export default function AdvancedOKRFilter({ onFilterChange, availableOKRs }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<AdvancedOKRFilter>({
    criteria: [],
    logic: "AND",
  })

  const addCriteria = () => {
    const newCriteria: OKRFilterCriteria = {
      id: `criteria-${Date.now()}`,
      okrType: availableOKRs[0]?.id || "revenue",
      unit: availableOKRs[0]?.unit || "currency",
    }

    const newFilter = {
      ...filter,
      criteria: [...filter.criteria, newCriteria],
    }
    setFilter(newFilter)
    onFilterChange(newFilter.criteria.length > 0 ? newFilter : null)
  }

  const updateCriteria = (id: string, updates: Partial<OKRFilterCriteria>) => {
    const newCriteria = filter.criteria.map((c) => (c.id === id ? { ...c, ...updates } : c))

    const newFilter = { ...filter, criteria: newCriteria }
    setFilter(newFilter)
    onFilterChange(newFilter.criteria.length > 0 ? newFilter : null)
  }

  const removeCriteria = (id: string) => {
    const newCriteria = filter.criteria.filter((c) => c.id !== id)
    const newFilter = { ...filter, criteria: newCriteria }
    setFilter(newFilter)
    onFilterChange(newFilter.criteria.length > 0 ? newFilter : null)
  }

  const clearAllFilters = () => {
    const clearedFilter = { criteria: [], logic: "AND" as const }
    setFilter(clearedFilter)
    onFilterChange(null)
  }

  const toggleLogic = () => {
    const newFilter = { ...filter, logic: filter.logic === "AND" ? ("OR" as const) : ("AND" as const) }
    setFilter(newFilter)
    onFilterChange(newFilter.criteria.length > 0 ? newFilter : null)
  }

  const getUnitSymbol = (unit: string) => {
    switch (unit) {
      case "currency":
        return "$"
      case "percentage":
        return "%"
      case "number":
        return "#"
      default:
        return ""
    }
  }

  const hasActiveFilters = filter.criteria.length > 0

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant={hasActiveFilters ? "default" : "outline"} size="sm" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Advanced OKR Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {filter.criteria.length}
            </Badge>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2">
        <Card className="w-96">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Advanced OKR Filters</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logic Toggle */}
            {filter.criteria.length > 1 && (
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium">Filter Logic:</Label>
                <Button
                  variant={filter.logic === "AND" ? "default" : "outline"}
                  size="sm"
                  onClick={toggleLogic}
                  className="h-6 px-2 text-xs"
                >
                  {filter.logic}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {filter.logic === "AND" ? "All conditions must match" : "Any condition can match"}
                </span>
              </div>
            )}

            {/* Filter Criteria */}
            <div className="space-y-3">
              {filter.criteria.map((criteria, index) => {
                const selectedOKR = availableOKRs.find((okr) => okr.id === criteria.okrType)
                const unit = selectedOKR?.unit || "none"

                return (
                  <Card key={criteria.id} className="p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Filter {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCriteria(criteria.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {/* OKR Selection */}
                      <div>
                        <Label className="text-xs">OKR Type</Label>
                        <Select
                          value={criteria.okrType}
                          onValueChange={(value) => {
                            const okr = availableOKRs.find((o) => o.id === value)
                            updateCriteria(criteria.id, {
                              okrType: value,
                              unit: okr?.unit || "none",
                            })
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableOKRs.map((okr) => (
                              <SelectItem key={okr.id} value={okr.id}>
                                <div className="flex items-center gap-2">
                                  <span>{okr.label}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {getUnitSymbol(okr.unit)}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Add Criteria Button */}
            <Button variant="outline" size="sm" onClick={addCriteria} className="w-full h-8 text-xs bg-transparent">
              <Plus className="h-3 w-3 mr-1" />
              Add Filter Criteria
            </Button>

            {/* Summary */}
            {hasActiveFilters && (
              <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                <strong>Active Filters:</strong> {filter.criteria.length} criteria with {filter.logic} logic
                <br />
                Show partners where {filter.logic === "AND" ? "all" : "any"} of the above conditions match.
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}
