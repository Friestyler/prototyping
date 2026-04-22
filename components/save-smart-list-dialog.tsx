"use client"

import { useEffect, useState } from "react"
import { Zap, List as ListIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { UserSavedListType } from "@/lib/user-saved-lists"

interface SaveSmartListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultName: string
  onConfirm: (name: string, type: UserSavedListType) => void
  /**
   * "list" (default) renders the full Save-Smart-List flow with a
   * dynamic/static toggle. "agent" renames the Name field to "Agent Name",
   * drops the "List Type" header and the Static option (agents are always
   * dynamic), and updates CTA copy accordingly.
   */
  variant?: "list" | "agent"
}

export function SaveSmartListDialog({
  open,
  onOpenChange,
  defaultName,
  onConfirm,
  variant = "list",
}: SaveSmartListDialogProps) {
  const isAgent = variant === "agent"
  const [name, setName] = useState(defaultName)
  const [type, setType] = useState<UserSavedListType>("dynamic")

  useEffect(() => {
    if (open) {
      setName(defaultName)
      setType("dynamic")
    }
  }, [open, defaultName])

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onConfirm(trimmed, isAgent ? "dynamic" : type)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isAgent ? "Save Agent" : "Save Smart List"}</DialogTitle>
          {!isAgent && (
            <DialogDescription>
              Choose how you want to save this smart list and give it a name.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="smart-list-name">
              {isAgent ? "Agent Name" : "List Name"} <span className="text-red-600">*</span>
            </Label>
            <Input
              id="smart-list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isAgent ? "Give your agent a name" : "Give your list a name"}
            />
          </div>

          <div className="grid gap-2">
            {!isAgent && <Label>List Type</Label>}
            <div className="grid gap-3">
              <TypeOption
                selected={type === "dynamic"}
                onSelect={() => setType("dynamic")}
                icon={<Zap className="w-4 h-4" />}
                title="Advanced Dynamic List"
                description="Automatically updates as customers meet or no longer meet the criteria. Always shows current matches based on real-time data."
              />
              {!isAgent && (
                <TypeOption
                  selected={type === "static"}
                  onSelect={() => setType("static")}
                  icon={<ListIcon className="w-4 h-4" />}
                  title="Static List"
                  description="Saves the current snapshot of customers. The list remains fixed even if customer data changes over time."
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            {isAgent ? "Save Agent" : "Save List"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TypeOption({
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  selected: boolean
  onSelect: () => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all flex items-start gap-3",
        selected
          ? "border-primary bg-[rgb(238,240,254)] ring-1 ring-primary/30"
          : "border-gray-200 bg-white hover:border-gray-300",
      )}
    >
      <span
        className={cn(
          "mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
          selected ? "border-primary" : "border-gray-300",
        )}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span className={cn("text-gray-500", selected && "text-primary")}>{icon}</span>
          {title}
        </div>
        <p className="mt-1 text-sm text-gray-600 leading-relaxed">{description}</p>
      </div>
    </button>
  )
}
