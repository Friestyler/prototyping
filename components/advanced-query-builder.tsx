"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { X, Plus, GripVertical, Filter, Users, Check, ChevronDown } from "lucide-react"

export interface FilterCondition {
  id: string
  field: string
  operator: string
  value: string
  fieldType: "text" | "number" | "currency" | "percentage" | "date" | "select" | "tags"
  unit?: string
}

export interface FilterGroup {
  id: string
  logic: "AND" | "OR"
  conditions: FilterCondition[]
}

interface Props {
  onFilterChange: (filter: FilterGroup | null) => void
  availableFields: Array<{
    id: string
    label: string
    type: "text" | "number" | "currency" | "percentage" | "date" | "select" | "tags"
    unit?: string
    options?: string[]
  }>
  filter?: FilterGroup | null
}

const OPERATORS = {
  text: [
    { value: "equals", label: "Is" },
    { value: "not_equals", label: "Is not" },
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Does not contain" },
    { value: "contains_any", label: "Contains any of" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  tags: [
    { value: "contains", label: "Contains" },
    { value: "contains_any", label: "Contains any of" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  number: [
    { value: "equals", label: "Is" },
    { value: "not_equals", label: "Is not" },
    { value: "greater_than", label: "Greater than" },
    { value: "greater_equal", label: "Greater than or equal to" },
    { value: "less_than", label: "Less than" },
    { value: "less_equal", label: "Less than or equal to" },
    { value: "between", label: "Between" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  currency: [
    { value: "equals", label: "Is" },
    { value: "not_equals", label: "Is not" },
    { value: "greater_than", label: "Greater than" },
    { value: "greater_equal", label: "Greater than or equal to" },
    { value: "less_than", label: "Less than" },
    { value: "less_equal", label: "Less than or equal to" },
    { value: "between", label: "Between" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  percentage: [
    { value: "equals", label: "Is" },
    { value: "not_equals", label: "Is not" },
    { value: "greater_than", label: "Greater than" },
    { value: "greater_equal", label: "Greater than or equal to" },
    { value: "less_than", label: "Less than" },
    { value: "less_equal", label: "Less than or equal to" },
    { value: "between", label: "Between" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  date: [
    { value: "equals", label: "Is" },
    { value: "not_equals", label: "Is not" },
    { value: "before", label: "Before" },
    { value: "after", label: "After" },
    { value: "between", label: "Between" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  select: [
    { value: "equals", label: "Is" },
    { value: "not_equals", label: "Is not" },
    { value: "in", label: "Is any of" },
    { value: "not_in", label: "Is none of" },
  ],
}

const MOCK_USERS = [
  { id: "without-user", name: "Without user", initials: "", avatar: null, isSpecial: true },
  { id: "user-1", name: "John Smith", initials: "JS", avatar: "#3b82f6" },
  { id: "user-2", name: "Sarah Johnson", initials: "SJ", avatar: "#ef4444" },
  { id: "user-3", name: "Mike Davis", initials: "MD", avatar: "#10b981" },
  { id: "user-4", name: "Emily Brown", initials: "EB", avatar: "#f59e0b" },
  { id: "user-5", name: "David Wilson", initials: "DW", avatar: "#8b5cf6" },
  { id: "user-6", name: "Lisa Anderson", initials: "LA", avatar: "#ec4899" },
]

const MOCK_TAGS = {
  categories: [
    {
      id: "financial",
      label: "Financial",
      tags: [
        { id: "revenue-growth", label: "Revenue Growth" },
        { id: "cost-reduction", label: "Cost Reduction" },
        { id: "profitability", label: "Profitability" },
        { id: "market-expansion", label: "Market Expansion" },
      ],
    },
    {
      id: "customer",
      label: "Customer",
      tags: [
        { id: "satisfaction", label: "Customer Satisfaction" },
        { id: "retention", label: "Customer Retention" },
        { id: "acquisition", label: "Customer Acquisition" },
        { id: "support", label: "Customer Support" },
      ],
    },
    {
      id: "operational",
      label: "Operational",
      tags: [
        { id: "efficiency", label: "Operational Efficiency" },
        { id: "quality", label: "Quality Improvement" },
        { id: "innovation", label: "Innovation" },
        { id: "compliance", label: "Compliance" },
      ],
    },
  ],
}

export default function AdvancedQueryBuilder({ onFilterChange, availableFields, filter: initialFilter }: Props) {
  const [filter, setFilter] = useState<FilterGroup>(
    initialFilter || {
      id: "root",
      logic: "AND",
      conditions: [],
    },
  )

  useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter)
    } else {
      setFilter({
        id: "root",
        logic: "AND",
        conditions: [],
      })
    }
  }, [initialFilter])

  const addCondition = (groupId = "root") => {
    const newCondition: FilterCondition = {
      id: `condition-${Date.now()}`,
      field: "", // Start with empty field
      operator: "contains",
      value: "",
      fieldType: "text", // Default type
      unit: undefined,
    }

    const newFilter = {
      ...filter,
      conditions: [...filter.conditions, newCondition],
    }

    setFilter(newFilter)
    onFilterChange(hasActiveFilters(newFilter) ? newFilter : null)
  }

  const updateCondition = (conditionId: string, updates: Partial<FilterCondition>) => {
    const newFilter = {
      ...filter,
      conditions: filter.conditions.map((c) => (c.id === conditionId ? { ...c, ...updates } : c)),
    }

    setFilter(newFilter)
    onFilterChange(hasActiveFilters(newFilter) ? newFilter : null)
  }

  const removeCondition = (conditionId: string) => {
    const newFilter = {
      ...filter,
      conditions: filter.conditions.filter((c) => c.id !== conditionId),
    }

    setFilter(newFilter)
    onFilterChange(hasActiveFilters(newFilter) ? newFilter : null)
  }

  const toggleLogic = (groupId = "root") => {
    const newFilter = {
      ...filter,
      logic: filter.logic === "AND" ? "OR" : "AND",
    }

    setFilter(newFilter)
    onFilterChange(hasActiveFilters(newFilter) ? newFilter : null)
  }

  const clearAllFilters = () => {
    const clearedFilter = {
      id: "root",
      logic: "AND" as const,
      conditions: [],
    }
    setFilter(clearedFilter)
    onFilterChange(null)
  }

  const hasActiveFilters = (group: FilterGroup): boolean => {
    return group.conditions.length > 0
  }

  const formatValue = (value: string, fieldType: string, unit?: string) => {
    if (!value) return value

    switch (fieldType) {
      case "currency":
        return value.startsWith("$") ? value : `$${value}`
      case "percentage":
        return value.endsWith("%") ? value : `${value}%`
      default:
        return value
    }
  }

  const getFieldPlaceholder = (fieldType: string, unit?: string) => {
    switch (fieldType) {
      case "currency":
        return "Enter amount"
      case "percentage":
        return "Enter percentage"
      case "number":
        return "Enter number"
      case "date":
        return "Select date"
      default:
        return "Enter value"
    }
  }

  const getOperatorsForField = (fieldId: string, fieldType: string) => {
    // Custom operators for specific fields
    if (fieldId === "partner") {
      return [
        { value: "equals", label: "Is" },
        { value: "not_equals", label: "Is not" },
        { value: "contains", label: "Contains" },
        { value: "not_contains", label: "Does not contain" },
        { value: "contains_any", label: "Contains any of" },
        { value: "is_empty", label: "Is empty" },
        { value: "is_not_empty", label: "Is not empty" },
      ]
    }

    if (fieldId === "team") {
      return [
        { value: "equals", label: "Is" },
        { value: "is_not_empty", label: "Is not empty" },
        { value: "is_empty", label: "Is empty" },
      ]
    }

    if (fieldId === "tags") {
      return [
        { value: "contains", label: "Contains" },
        { value: "contains_any", label: "Contains any of" },
        { value: "is_empty", label: "Is empty" },
        { value: "is_not_empty", label: "Is not empty" },
      ]
    }

    // Default operators based on field type
    return OPERATORS[fieldType] || OPERATORS.text
  }

  const UserSelector = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
    const [open, setOpen] = useState(false)
    const selectedUserIds = value ? value.split(",") : []
    const selectedUsers = MOCK_USERS.filter((user) => selectedUserIds.includes(user.id))

    const toggleUser = (userId: string) => {
      const currentIds = selectedUserIds.filter((id) => id)
      const newIds = currentIds.includes(userId) ? currentIds.filter((id) => id !== userId) : [...currentIds, userId]
      onChange(newIds.join(","))
    }

    const removeUser = (userId: string) => {
      const newIds = selectedUserIds.filter((id) => id !== userId)
      onChange(newIds.join(","))
    }

    const displayUsers = selectedUsers.slice(0, 10)
    const remainingCount = selectedUsers.length - 10

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-48 min-h-8 h-auto justify-between text-left font-normal bg-transparent"
          >
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {selectedUsers.length === 0 ? (
                <span className="text-muted-foreground text-sm">Select users</span>
              ) : (
                <div className="flex items-center gap-1 flex-wrap py-1">
                  {displayUsers.map((user) => (
                    <Badge key={user.id} variant="secondary" className="text-xs h-5 px-1.5">
                      <div className="flex items-center gap-1">
                        {user.isSpecial ? (
                          <Users className="h-3 w-3" />
                        ) : (
                          <Avatar className="h-3 w-3">
                            <AvatarFallback
                              className="text-[8px] text-white font-medium"
                              style={{ backgroundColor: user.avatar }}
                            >
                              {user.initials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="truncate max-w-16">{user.name}</span>
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeUser(user.id)
                          }}
                        />
                      </div>
                    </Badge>
                  ))}
                  {remainingCount > 0 && (
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      +{remainingCount}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search or enter email..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {MOCK_USERS.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.name}
                    onSelect={() => toggleUser(user.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-4 h-4">
                      {selectedUserIds.includes(user.id) && <Check className="h-4 w-4" />}
                    </div>
                    {user.isSpecial ? (
                      <Users className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback
                          className="text-xs text-white font-medium"
                          style={{ backgroundColor: user.avatar }}
                        >
                          {user.initials}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="flex-1">{user.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  const MultiCriteriaInput = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
    const [inputValue, setInputValue] = useState("")
    const criteria = value ? value.split(",").filter(Boolean) : []

    const addCriteria = () => {
      if (inputValue.trim()) {
        const newCriteria = [...criteria, inputValue.trim()]
        onChange(newCriteria.join(","))
        setInputValue("")
      }
    }

    const removeCriteria = (index: number) => {
      const newCriteria = criteria.filter((_, i) => i !== index)
      onChange(newCriteria.join(","))
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        addCriteria()
      }
    }

    return (
      <div className="w-48 min-h-8 border rounded-md p-2 bg-background">
        {criteria.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {criteria.map((criterion, index) => (
              <Badge key={index} variant="secondary" className="text-xs h-5 px-1.5 max-w-32">
                <span className="truncate" title={criterion}>
                  {criterion}
                </span>
                <X
                  className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                  onClick={() => removeCriteria(index)}
                />
              </Badge>
            ))}
          </div>
        )}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={criteria.length === 0 ? "Type and press Enter" : "Add more..."}
          className="border-0 p-0 h-6 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
    )
  }

  const TagSelector = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const selectedTagIds = value ? value.split(",") : []

    const allTags = MOCK_TAGS.categories.flatMap((category) =>
      category.tags.map((tag) => ({ ...tag, categoryLabel: category.label })),
    )
    const selectedTags = allTags.filter((tag) => selectedTagIds.includes(tag.id))

    const filteredCategories = MOCK_TAGS.categories
      .map((category) => ({
        ...category,
        tags: category.tags.filter((tag) => tag.label.toLowerCase().includes(searchTerm.toLowerCase())),
      }))
      .filter((category) => category.tags.length > 0)

    const toggleTag = (tagId: string) => {
      const currentIds = selectedTagIds.filter((id) => id)
      const newIds = currentIds.includes(tagId) ? currentIds.filter((id) => id !== tagId) : [...currentIds, tagId]
      onChange(newIds.join(","))
    }

    const toggleCategory = (categoryId: string) => {
      const category = MOCK_TAGS.categories.find((c) => c.id === categoryId)
      if (!category) return

      const categoryTagIds = category.tags.map((tag) => tag.id)
      const allSelected = categoryTagIds.every((id) => selectedTagIds.includes(id))

      let newIds = selectedTagIds.filter((id) => id)
      if (allSelected) {
        // Remove all category tags
        newIds = newIds.filter((id) => !categoryTagIds.includes(id))
      } else {
        // Add all category tags
        categoryTagIds.forEach((id) => {
          if (!newIds.includes(id)) {
            newIds.push(id)
          }
        })
      }
      onChange(newIds.join(","))
    }

    const removeTag = (tagId: string) => {
      const newIds = selectedTagIds.filter((id) => id !== tagId)
      onChange(newIds.join(","))
    }

    const displayTags = selectedTags.slice(0, 10)
    const remainingCount = selectedTags.length - 10

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-48 min-h-8 h-auto justify-between text-left font-normal bg-transparent"
          >
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {selectedTags.length === 0 ? (
                <span className="text-muted-foreground text-sm">Select tags</span>
              ) : (
                <div className="flex items-center gap-1 flex-wrap py-1">
                  {displayTags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs h-5 px-1.5 max-w-24">
                      <span className="truncate" title={tag.label}>
                        {tag.label}
                      </span>
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeTag(tag.id)
                        }}
                      />
                    </Badge>
                  ))}
                  {remainingCount > 0 && (
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      +{remainingCount}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." value={searchTerm} onValueChange={setSearchTerm} />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              {filteredCategories.map((category) => {
                const categoryTagIds = category.tags.map((tag) => tag.id)
                const allSelected = categoryTagIds.every((id) => selectedTagIds.includes(id))
                const someSelected = categoryTagIds.some((id) => selectedTagIds.includes(id))

                return (
                  <CommandGroup
                    key={category.id}
                    heading={
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
                        onClick={() => toggleCategory(category.id)}
                      >
                        <div className="flex items-center justify-center w-4 h-4">
                          {allSelected && <Check className="h-4 w-4" />}
                          {someSelected && !allSelected && <div className="w-2 h-2 bg-current rounded-full" />}
                        </div>
                        <span className="font-medium">{category.label}</span>
                      </div>
                    }
                  >
                    {category.tags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.label}
                        onSelect={() => toggleTag(tag.id)}
                        className="flex items-center gap-2 cursor-pointer pl-6"
                      >
                        <div className="flex items-center justify-center w-4 h-4">
                          {selectedTagIds.includes(tag.id) && <Check className="h-4 w-4" />}
                        </div>
                        <span className="flex-1">{tag.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  const renderCondition = (condition: FilterCondition, index: number, groupLogic: string, groupId: string) => {
    const field = availableFields.find((f) => f.id === condition.field)
    const operators = condition.field ? getOperatorsForField(condition.field, condition.fieldType) : []

    return (
      <div key={condition.id} className="space-y-2">
        {index > 0 && (
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-medium bg-muted/50 cursor-default"
              disabled
            >
              and
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-background border rounded-lg">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-48 h-8 justify-between font-normal bg-transparent">
                {condition.field ? (
                  <div className="flex items-center gap-2">
                    <span>{field?.label}</span>
                    {field?.unit && (
                      <Badge variant="outline" className="text-xs">
                        {field.unit}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Select filter</span>
                )}
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search filters..." />
                <CommandList>
                  <CommandEmpty>No filters found.</CommandEmpty>
                  <CommandGroup>
                    {availableFields.map((availableField) => (
                      <CommandItem
                        key={availableField.id}
                        value={availableField.label}
                        onSelect={() => {
                          updateCondition(condition.id, {
                            field: availableField.id,
                            fieldType: availableField.type,
                            unit: availableField.unit,
                            operator:
                              getOperatorsForField(availableField.id, availableField.type)[0]?.value || "contains",
                            value: "",
                          })
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div className="flex items-center justify-center w-4 h-4">
                          {condition.field === availableField.id && <Check className="h-4 w-4" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{availableField.label}</span>
                          {availableField.unit && (
                            <Badge variant="outline" className="text-xs">
                              {availableField.unit}
                            </Badge>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {condition.field && (
            <>
              <Select
                value={condition.operator}
                onValueChange={(value) => updateCondition(condition.id, { operator: value })}
              >
                <SelectTrigger className="w-48 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!["is_empty", "is_not_empty"].includes(condition.operator) &&
                (condition.field === "team" && condition.operator === "equals" ? (
                  <UserSelector
                    value={condition.value}
                    onChange={(value) => updateCondition(condition.id, { value })}
                  />
                ) : condition.field === "partner" && condition.operator === "contains_any" ? (
                  <MultiCriteriaInput
                    value={condition.value}
                    onChange={(value) => updateCondition(condition.id, { value })}
                  />
                ) : condition.field === "tags" && ["contains", "contains_any"].includes(condition.operator) ? (
                  <TagSelector value={condition.value} onChange={(value) => updateCondition(condition.id, { value })} />
                ) : condition.fieldType === "date" && condition.operator === "between" ? (
                  /* Added date range picker for between operator */
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={condition.value.split(",")[0] || ""}
                      onChange={(e) => {
                        const endDate = condition.value.split(",")[1] || ""
                        updateCondition(condition.id, { value: `${e.target.value},${endDate}` })
                      }}
                      className="w-24 h-8"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="date"
                      value={condition.value.split(",")[1] || ""}
                      onChange={(e) => {
                        const startDate = condition.value.split(",")[0] || ""
                        updateCondition(condition.id, { value: `${startDate},${e.target.value}` })
                      }}
                      className="w-24 h-8"
                    />
                  </div>
                ) : condition.fieldType === "date" ? (
                  /* Added single date picker for other date operators */
                  <Input
                    type="date"
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                    className="w-48 h-8"
                  />
                ) : condition.fieldType === "select" && field?.options ? (
                  <Select value={condition.value} onValueChange={(value) => updateCondition(condition.id, { value })}>
                    <SelectTrigger className="w-48 h-8">
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                    placeholder={getFieldPlaceholder(condition.fieldType, condition.unit)}
                    className="w-48 h-8"
                  />
                ))}
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeCondition(condition.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const renderGroup = (group: FilterGroup) => {
    return (
      <div className="space-y-3">
        {group.conditions.map((condition, index) => renderCondition(condition, index, group.logic, group.id))}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addCondition(group.id)}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add filter
          </Button>
        </div>
      </div>
    )
  }

  const countActiveConditions = (group: FilterGroup): number => {
    return group.conditions.length
  }

  const activeConditionsCount = countActiveConditions(filter)

  return (
    <Card className="w-full max-w-4xl">
      <CardContent className="p-4">
        {renderGroup(filter)}

        {activeConditionsCount === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No filters applied</p>
            <p className="text-xs">Click "Add filter" to start filtering</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
