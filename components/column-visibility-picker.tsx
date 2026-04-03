"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Columns as ViewColumns, Eye, EyeOff, Search } from "lucide-react"
import { useEffect, useMemo, useState, useCallback } from "react"

type Field = {
  id: string
  label: string
  lock?: boolean
  isCheckbox?: boolean
  available?: boolean
}

type Props = {
  userId: string
  routeKey: string
  entityType: string
  fields: Field[]
  defaultVisibleIds: string[]
  onChange: (vis: Record<string, boolean>) => void
}

export default function ColumnVisibilityPicker({
  userId,
  routeKey,
  entityType,
  fields = [],
  defaultVisibleIds = [],
  onChange,
}: Props) {
  const storageKey = `qai:colvis:v1:${userId}:${routeKey}:${entityType}`

  const cleanFields = useMemo(() => {
    if (!Array.isArray(fields)) return []
    return fields.filter((f) => !f.isCheckbox && f.available !== false)
  }, [fields])

  const initialVisibility = useMemo(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved) as Record<string, boolean>
    } catch {}

    // Default: name/locked columns true; others true if in defaultVisibleIds
    const base: Record<string, boolean> = {}
    cleanFields.forEach((f) => {
      base[f.id] = f.lock ? true : defaultVisibleIds.includes(f.id)
    })
    return base
  }, [storageKey, cleanFields, defaultVisibleIds])

  const [visibility, setVisibility] = useState<Record<string, boolean>>(initialVisibility)
  const [query, setQuery] = useState("")

  const updateVisibility = useCallback(
    (newVisibility: Record<string, boolean>) => {
      setVisibility(newVisibility)
      // Save to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(newVisibility))
      } catch {
        // Show toast about localStorage failure in real implementation
      }
      // Notify parent
      onChange?.(newVisibility)
    },
    [storageKey, onChange],
  )

  useEffect(() => {
    onChange?.(visibility)
  }, []) // Empty dependency array - only run on mount

  const filtered = useMemo(() => {
    if (!Array.isArray(cleanFields)) return []
    return cleanFields.filter((f) => f.label?.toLowerCase().includes(query.toLowerCase()))
  }, [cleanFields, query])

  const setAll = useCallback(
    (value: boolean) => {
      const next = { ...visibility }
      cleanFields.forEach((f) => {
        next[f.id] = f.lock ? true : value
      })
      updateVisibility(next)
    },
    [cleanFields, visibility, updateVisibility],
  )

  const resetDefaults = useCallback(() => {
    updateVisibility(initialVisibility)
  }, [initialVisibility, updateVisibility])

  const handleItemChange = useCallback(
    (fieldId: string, checked: boolean) => {
      const next = { ...visibility, [fieldId]: checked }
      updateVisibility(next)
    },
    [visibility, updateVisibility],
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <ViewColumns className="h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2" onCloseAutoFocus={(e) => e.preventDefault()}>
        <div className="px-1 pb-2" onClick={(e) => e.stopPropagation()}>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setAll(true)
              }}
              className="w-full justify-start gap-2 h-8 px-2 text-sm font-normal"
            >
              <Eye className="h-4 w-4" />
              Show all columns
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setAll(false)
              }}
              className="w-full justify-start gap-2 h-8 px-2 text-sm font-normal"
            >
              <EyeOff className="h-4 w-4" />
              Hide all columns
            </Button>
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-auto" onClick={(e) => e.stopPropagation()}>
          {filtered.map((f) => (
            <DropdownMenuCheckboxItem
              key={f.id}
              checked={!!visibility[f.id]}
              onCheckedChange={(checked) => !f.lock && handleItemChange(f.id, !!checked)}
              disabled={!!f.lock}
              onClick={(e) => e.stopPropagation()}
            >
              {f.label}
              {f.lock ? " (always on)" : ""}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
