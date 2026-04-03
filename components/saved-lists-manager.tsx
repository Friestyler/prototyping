"use client"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import { useState, useMemo, useEffect } from "react"
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Plus,
  Zap,
  List,
  Bookmark,
  MoreHorizontal,
  Edit,
  X,
  Settings,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  ChevronLeft,
  Link,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Opportunity {
  id: string
  code: string
  name: string
  industry: string
  size: string
  region: string
  status: string
  customers: number
  opportunities: number
  contacts: number
  template: string
}

interface SavedList {
  id: string
  name: string
  type: "static" | "dynamic"
  opportunityCount: number
  filters?: FilterState
  opportunityIds?: string[]
  value: number
}

interface FilterState {
  status: string
  type: string
  size: string
  stage: string
  region?: string
  priority?: string
}

interface SavedView {
  id: string
  name: string
  filters: FilterState
  createdAt: Date
  columnVisibility?: Record<string, boolean>
}

interface ShareRecipient {
  id: string
  email: string
  permission: "viewer" | "commenter" | "editor"
  note: string
}

interface ShareDialogState {
  isOpen: boolean
  listId: string | null
  listName: string
  recipients: ShareRecipient[]
  newEmail: string
  currentPermission: "viewer" | "commenter" | "editor"
  message: string
  step: "initial" | "compose"
}

const mockOpportunities: Opportunity[] = [
  {
    id: "1",
    code: "WB",
    name: "Willis B.V",
    industry: "Insurance",
    size: "medium",
    region: "North",
    status: "active",
    customers: 16,
    opportunities: 0,
    contacts: 172,
    template: "No templates",
  },
  {
    id: "2",
    code: "QIS",
    name: "Quick Insurance Solutions",
    industry: "Other",
    size: "medium",
    region: "North",
    status: "active",
    customers: 3,
    opportunities: 0,
    contacts: 172,
    template: "No templates",
  },
  {
    id: "3",
    code: "PRM",
    name: "Premium Risk Management",
    industry: "Other",
    size: "medium",
    region: "Central",
    status: "active",
    customers: 0,
    opportunities: 0,
    contacts: 172,
    template: "No templates",
  },
  {
    id: "4",
    code: "RIP",
    name: "Regional Insurance Opportunities",
    industry: "Insurance",
    size: "medium",
    region: "Central",
    status: "active",
    customers: 0,
    opportunities: 0,
    contacts: 172,
    template: "No templates",
  },
  {
    id: "5",
    code: "IIA",
    name: "Independent Insurance Advisors",
    industry: "Other",
    size: "medium",
    region: "South",
    status: "active",
    customers: 0,
    opportunities: 0,
    contacts: 172,
    template: "No templates",
  },
  {
    id: "6",
    code: "AM",
    name: "Aon (v.h.Meeus)",
    industry: "Insurance",
    size: "medium",
    region: "Central",
    status: "active",
    customers: 1,
    opportunities: 1,
    contacts: 172,
    template: "No templates",
  },
  {
    id: "7",
    code: "HRB",
    name: "HDB Risicobeheer BV",
    industry: "Other",
    size: "medium",
    region: "Central",
    status: "active",
    customers: 2,
    opportunities: 2,
    contacts: 172,
    template: "No templates",
  },
  {
    id: "8",
    code: "KB",
    name: "Klap B.V.",
    industry: "Insurance",
    size: "medium",
    region: "Central",
    status: "active",
    customers: 2,
    opportunities: 2,
    contacts: 172,
    template: "No templates",
  },
  {
    id: "9",
    code: "INS-SML",
    name: "Small Insurance Co.",
    industry: "Insurance",
    size: "small",
    region: "North",
    status: "inactive",
    customers: 5,
    opportunities: 1,
    contacts: 50,
    template: "No templates",
  },
  {
    id: "10",
    code: "OTH-LRG",
    name: "Large Tech Solutions",
    industry: "Other",
    size: "large",
    region: "South",
    status: "active",
    customers: 100,
    opportunities: 15,
    contacts: 500,
    template: "No templates",
  },
  {
    id: "11",
    code: "MED-PRO",
    name: "Prospect Brokers Inc.",
    industry: "Insurance",
    size: "medium",
    region: "East",
    status: "active",
    customers: 0,
    opportunities: 0,
    contacts: 20,
    template: "No templates",
  },
  {
    id: "12",
    code: "INACT-OTH",
    name: "Inactive Services Ltd.",
    industry: "Other",
    size: "small",
    region: "West",
    status: "inactive",
    customers: 1,
    opportunities: 0,
    contacts: 10,
    template: "No templates",
  },
  {
    id: "13",
    code: "BIG-INS",
    name: "Global Insurance Group",
    industry: "Insurance",
    size: "large",
    region: "Global",
    status: "active",
    customers: 200,
    opportunities: 30,
    contacts: 1000,
    template: "No templates",
  },
  {
    id: "14",
    code: "NEW-PROS",
    name: "New Horizon Prospects",
    industry: "Other",
    size: "medium",
    region: "North",
    status: "inactive",
    customers: 0,
    opportunities: 0,
    contacts: 5,
    template: "No templates",
  },
]

const initialSavedLists: SavedList[] = [
  {
    id: "1",
    name: "All Opportunities",
    type: "dynamic",
    opportunityCount: 37,
    value: 0,
    filters: { status: "all", type: "all", size: "all", stage: "all", region: "all", priority: "all" },
  },
  { id: "2", name: "Concordia Offices", type: "static", opportunityCount: 8, value: 0, opportunityIds: ["1", "2"] },
  {
    id: "3",
    name: "Insurance Opportunities",
    type: "dynamic",
    opportunityCount: 5,
    value: 0,
    filters: { status: "all", type: "insurance", size: "all", stage: "all", region: "all", priority: "all" },
  },
  { id: "4", name: "Team list", type: "static", opportunityCount: 13, value: 0, opportunityIds: ["1", "3", "5"] },
  {
    id: "5",
    name: "Brokers with 5+ opportunities",
    type: "dynamic",
    value: 0,
    opportunityCount: 6,
    filters: { status: "active", type: "all", size: "all", stage: "all", region: "all", priority: "all" },
  },
  {
    id: "6",
    name: "Medium-Size Brokers",
    type: "dynamic",
    opportunityCount: 16,
    value: 0,
    filters: { status: "all", type: "all", size: "medium", stage: "all", region: "all", priority: "all" },
  },
]

export default function SavedListsManager() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([])
  const [savedLists, setSavedLists] = useState<SavedList[]>(initialSavedLists)
  const [savedListsExpanded, setSavedListsExpanded] = useState(true)
  const [savedListsViewMode, setSavedListsViewMode] = useState<"cards" | "list">("cards")
  const [selectedListId, setSelectedListId] = useState<string>("1")
  const [showAddListDialog, setShowAddListDialog] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showDynamicListDialog, setShowDynamicListDialog] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    type: "all",
    size: "all",
    stage: "all",
    region: "all",
    priority: "all",
  })

  const [newListForm, setNewListForm] = useState({
    name: "",
    type: "static" as "static" | "dynamic",
    addToExisting: false,
    existingListId: "",
  })

  const [dynamicListForm, setDynamicListForm] = useState({
    name: "",
  })

  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [showSaveViewDialog, setShowSaveViewDialog] = useState(false)
  const [saveViewForm, setSaveViewForm] = useState({
    name: "",
  })

  const [shareDialog, setShareDialog] = useState<ShareDialogState>({
    isOpen: false,
    listId: null,
    listName: "",
    recipients: [],
    newEmail: "",
    currentPermission: "viewer",
    message: "",
    step: "initial" | "compose",
  })

  const [peopleWithAccess, setPeopleWithAccess] = useState<ShareRecipient[]>([
    { id: "owner", email: "Account Manager", permission: "editor", note: "" },
  ])

  // State for editing lists
  const [showEditListDialog, setShowEditListDialog] = useState(false)
  const [listToEdit, setListToEdit] = useState<SavedList | null>(null)

  // State for deleting lists
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false)
  const [listToDeleteId, setListToDeleteId] = useState<string | null>(null)

  // State for list content editing mode (static lists)
  const [isEditingListContent, setIsEditingListContent] = useState(false)
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editModeSelectedOpportunities, setEditModeSelectedOpportunities] = useState<string[]>([])
  const [editModeSearchTerm, setEditModeSearchTerm] = useState("")
  const [editModeFilters, setEditModeFilters] = useState<FilterState>({
    status: "all",
    type: "all",
    size: "all",
    stage: "all",
    region: "all",
    priority: "all",
  })
  const [showEditModeFilters, setShowEditModeFilters] = useState(false)
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  // State for dynamic list editing mode
  const [isEditingDynamicList, setIsEditingDynamicList] = useState(false)
  const [editingDynamicListId, setEditingDynamicListId] = useState<string | null>(null)
  const [editDynamicFilters, setEditDynamicFilters] = useState<FilterState>({
    status: "all",
    type: "all",
    size: "all",
    stage: "all",
    region: "all",
    priority: "all",
  })
  const [originalDynamicFilters, setOriginalDynamicFilters] = useState<FilterState>({
    status: "all",
    type: "all",
    size: "all",
    stage: "all",
    region: "all",
    priority: "all",
  })

  // State for editing views
  const [showEditViewDialog, setShowEditViewDialog] = useState(false)
  const [viewToEdit, setViewToEdit] = useState<SavedView | null>(null)

  // State for deleting views
  const [showConfirmDeleteViewDialog, setShowConfirmDeleteViewViewDialog] = useState(false)
  const [viewToDeleteId, setViewToDeleteId] = useState<string | null>(null)

  // State for editing view content
  const [isEditingViewContent, setIsEditingViewContent] = useState(false)
  const [editingViewId, setEditingViewId] = useState<string | null>(null)
  const [editViewFilters, setEditViewFilters] = useState<FilterState>({
    status: "all",
    type: "all",
    size: "all",
    stage: "all",
    region: "all",
    priority: "all",
  })
  const [originalViewFilters, setOriginalViewFilters] = useState<FilterState>({
    status: "all",
    type: "all",
    size: "all",
    stage: "all",
    region: "all",
    priority: "all",
  })

  // State for sorting
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Opportunity | null
    direction: "asc" | "desc"
  }>({ key: null, direction: "asc" })

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // State for bulk delete
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  const [showColumnConfigInView, setShowColumnConfigInView] = useState(false)
  const [viewColumnVisibility, setViewColumnVisibility] = useState<Record<string, boolean>>({})
  const [columnVisibility, setColumnVisibility] = useState({
    partner: true,
    industry: true,
    size: true,
    region: true,
    status: true,
    customers: true,
    opportunities: true,
    contacts: true,
    template: true,
  })

  const selectedList = savedLists.find((list) => list.id === selectedListId)
  const editingList = savedLists.find((list) => list.id === editingListId)
  const editingDynamicList = savedLists.find((list) => list.id === editingDynamicListId)

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => value !== "all")
  }, [filters])

  const hasActiveEditModeFilters = useMemo(() => {
    return Object.values(editModeFilters).some((value) => value !== "all")
  }, [editModeFilters])

  const hasActiveDynamicEditFilters = useMemo(() => {
    return Object.values(editDynamicFilters).some((value) => value !== "all")
  }, [editDynamicFilters])

  const filteredOpportunities = useMemo(() => {
    let opportunitiesToFilter = mockOpportunities

    // If we're in static list edit mode, use edit mode filters and search
    if (isEditingListContent) {
      opportunitiesToFilter = mockOpportunities.filter((opportunity) => {
        const matchesSearch =
          opportunity.name.toLowerCase().includes(editModeSearchTerm.toLowerCase()) ||
          opportunity.code.toLowerCase().includes(editModeSearchTerm.toLowerCase())

        const matchesFilters =
          (editModeFilters.status === "all" || opportunity.status === editModeFilters.status) &&
          (editModeFilters.type === "all" ||
            opportunity.industry.toLowerCase() === editModeFilters.type.toLowerCase()) &&
          (editModeFilters.size === "all" || opportunity.size === editModeFilters.size) &&
          (editModeFilters.stage === "all" || opportunity.status === editModeFilters.stage)

        return matchesSearch && matchesFilters
      })
    } else if (isEditingDynamicList) {
      // If we're in dynamic list edit mode, use dynamic edit filters
      opportunitiesToFilter = mockOpportunities.filter((opportunity) => {
        const matchesSearch =
          opportunity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opportunity.code.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesFilters =
          (editDynamicFilters.status === "all" || opportunity.status === editDynamicFilters.status) &&
          (editDynamicFilters.type === "all" ||
            opportunity.industry.toLowerCase() === editDynamicFilters.type.toLowerCase()) &&
          (editDynamicFilters.size === "all" || opportunity.size === editDynamicFilters.size) &&
          (editDynamicFilters.stage === "all" || opportunity.status === editDynamicFilters.stage)

        return matchesSearch && matchesFilters
      })
    } else {
      // If a list is selected, filter based on the list
      if (selectedList) {
        if (selectedList.type === "static" && selectedList.opportunityIds) {
          opportunitiesToFilter = mockOpportunities.filter((opportunity) =>
            selectedList.opportunityIds!.includes(opportunity.id),
          )
        } else if (selectedList.type === "dynamic" && selectedList.filters) {
          const listFilters = selectedList.filters
          opportunitiesToFilter = mockOpportunities.filter((opportunity) => {
            return (
              (listFilters.status === "all" || opportunity.status === listFilters.status) &&
              (listFilters.type === "all" || opportunity.industry.toLowerCase() === listFilters.type.toLowerCase()) &&
              (listFilters.size === "all" || opportunity.size === listFilters.size) &&
              (listFilters.stage === "all" || opportunity.status === listFilters.stage)
            )
          })
        }
      }

      // Apply search term
      opportunitiesToFilter = opportunitiesToFilter.filter((opportunity) => {
        const matchesSearch =
          opportunity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opportunity.code.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesSearch
      })
    }

    // Apply sorting
    if (sortConfig.key) {
      opportunitiesToFilter.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]

        if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue.localeCompare(bValue)
          return sortConfig.direction === "asc" ? comparison : -comparison
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          const comparison = aValue - bValue
          return sortConfig.direction === "asc" ? comparison : -comparison
        }

        return 0
      })
    }

    return opportunitiesToFilter
  }, [
    searchTerm,
    selectedList,
    isEditingListContent,
    editModeSearchTerm,
    editModeFilters,
    isEditingDynamicList,
    editDynamicFilters,
    sortConfig,
  ])

  // Pagination calculations
  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOpportunities = filteredOpportunities.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredOpportunities.length])

  const hasUnsavedChanges = useMemo(() => {
    if (isEditingListContent && editingList && editingList.type === "static") {
      const originalOpportunityIds = editingList.opportunityIds || []
      const currentOpportunityIds = editModeSelectedOpportunities

      if (originalOpportunityIds.length !== currentOpportunityIds.length) return true

      return (
        !originalOpportunityIds.every((id) => currentOpportunityIds.includes(id)) ||
        !currentOpportunityIds.every((id) => originalOpportunityIds.includes(id))
      )
    }

    if (isEditingDynamicList) {
      return JSON.stringify(editDynamicFilters) !== JSON.stringify(originalDynamicFilters)
    }

    if (isEditingViewContent) {
      return JSON.stringify(editViewFilters) !== JSON.stringify(originalViewFilters)
    }

    return false
  }, [
    isEditingListContent,
    editingList,
    editModeSelectedOpportunities,
    isEditingDynamicList,
    editDynamicFilters,
    originalDynamicFilters,
    isEditingViewContent,
    editViewFilters,
    originalViewFilters,
  ])

  const handleOpportunitySelect = (opportunityId: string) => {
    if (isEditingListContent) {
      setEditModeSelectedOpportunities((prev) =>
        prev.includes(opportunityId) ? prev.filter((id) => id !== opportunityId) : [...prev, opportunityId],
      )
    } else {
      setSelectedOpportunities((prev) =>
        prev.includes(opportunityId) ? prev.filter((id) => id !== opportunityId) : [...prev, opportunityId],
      )
    }
  }

  const handleSelectAll = () => {
    if (isEditingListContent) {
      if (editModeSelectedOpportunities.length === filteredOpportunities.length) {
        setEditModeSelectedOpportunities([])
      } else {
        setEditModeSelectedOpportunities(filteredOpportunities.map((p) => p.id))
      }
    } else {
      if (selectedOpportunities.length === filteredOpportunities.length) {
        setSelectedOpportunities([])
      } else {
        setSelectedOpportunities(filteredOpportunities.map((p) => p.id))
      }
    }
  }

  const clearSelection = () => {
    setSelectedOpportunities([])
  }

  const clearFilters = () => {
    setFilters({
      status: "all",
      type: "all",
      size: "all",
      stage: "all",
      region: "all",
      priority: "all",
    })
  }

  const clearEditModeFilters = () => {
    setEditModeFilters({
      status: "all",
      type: "all",
      size: "all",
      stage: "all",
      region: "all",
      priority: "all",
    })
  }

  const clearEditDynamicFilters = () => {
    setEditDynamicFilters({
      status: "all",
      type: "all",
      size: "all",
      stage: "all",
      region: "all",
      priority: "all",
    })
  }

  const handleListSelect = (listId: string) => {
    if (hasUnsavedChanges) {
      setPendingAction(() => () => performListSelect(listId))
      setShowUnsavedChangesDialog(true)
      return
    }
    performListSelect(listId)
  }

  const performListSelect = (listId: string) => {
    setSelectedListId(listId)
    const list = savedLists.find((l) => l.id === listId)

    // If it's a dynamic list, apply its filters
    if (list && list.type === "dynamic" && list.filters) {
      setFilters(list.filters)
    } else {
      // If it's a static list or "All Opportunities", clear filters
      clearFilters()
    }

    // Clear opportunity selection when switching lists
    setSelectedOpportunities([])
  }

  const handleCreateList = () => {
    if (newListForm.addToExisting && newListForm.existingListId) {
      // Add to existing list
      setSavedLists((prev) =>
        prev.map((list) =>
          list.id === newListForm.existingListId
            ? {
                ...list,
                opportunityCount: list.opportunityCount + selectedOpportunities.length,
                opportunityIds:
                  list.type === "static"
                    ? [...(list.opportunityIds || []), ...selectedOpportunities]
                    : list.opportunityIds,
              }
            : list,
        ),
      )
    } else if (!newListForm.addToExisting && newListForm.name.trim()) {
      // Create new static list
      const newList: SavedList = {
        id: Date.now().toString(),
        name: newListForm.name,
        type: "static",
        opportunityCount: selectedOpportunities.length,
        value: 0,
        opportunityIds: selectedOpportunities,
      }

      // Insert after "All Opportunities" (index 0)
      setSavedLists((prev) => {
        const newLists = [...prev]
        newLists.splice(1, 0, newList)
        return newLists
      })
    }

    setShowAddListDialog(false)
    setNewListForm({ name: "", type: "static", addToExisting: false, existingListId: "" })
    clearSelection()
  }

  const handleCreateDynamicList = () => {
    const newList: SavedList = {
      id: Date.now().toString(),
      name: dynamicListForm.name,
      type: "dynamic",
      opportunityCount: filteredOpportunities.length,
      value: 0,
      filters: { ...filters },
    }

    // Insert after "All Opportunities" (index 0)
    setSavedLists((prev) => {
      const newLists = [...prev]
      newLists.splice(1, 0, newList)
      return newLists
    })
    setShowDynamicListDialog(false)
    setDynamicListForm({ name: "" })
  }

  useEffect(() => {
    if (showSaveViewDialog) {
      setViewColumnVisibility(columnVisibility)
      setShowColumnConfigInView(false)
    }
  }, [showSaveViewDialog, columnVisibility])

  const handleCreateView = () => {
    const newView: SavedView = {
      id: Date.now().toString(),
      name: saveViewForm.name,
      filters: { ...filters },
      columnVisibility: showColumnConfigInView ? { ...viewColumnVisibility } : { ...columnVisibility },
      createdAt: new Date(),
    }

    setSavedViews((prev) => [...prev, newView])
    setShowSaveViewDialog(false)
    setSaveViewForm({ name: "" })
    setShowColumnConfigInView(false)
    setViewColumnVisibility({})
  }

  const handleApplyView = (view: SavedView) => {
    setFilters(view.filters)
  }

  // Handlers for editing views
  const handleOpenEditViewDialog = (view: SavedView) => {
    setViewToEdit(view)
    setShowEditViewDialog(true)
  }

  const handleSaveEditedView = () => {
    if (viewToEdit) {
      setSavedViews((prev) =>
        prev.map((view) =>
          view.id === viewToEdit.id
            ? {
                ...view,
                name: viewToEdit.name,
              }
            : view,
        ),
      )
      setShowEditViewDialog(false)
      setViewToEdit(null)
    }
  }

  // Handlers for deleting views
  const handleOpenDeleteViewConfirm = (viewId: string) => {
    setViewToDeleteId(viewId)
    setShowConfirmDeleteViewViewDialog(true)
  }

  const handleDeleteViewConfirmed = () => {
    if (viewToDeleteId) {
      setSavedViews((prev) => prev.filter((view) => view.id !== viewToDeleteId))
      setShowConfirmDeleteViewViewDialog(false)
      setViewToDeleteId(null)
    }
  }

  const [viewMode, setViewMode] = useState("table")
  const [visibleFields, setVisibleFields] = useState({
    partner: true,
    industry: true,
    size: true,
    region: true,
    status: true,
    customers: true,
    opportunities: true,
    contacts: true,
    template: true,
  })

  // Calculate summary metrics
  const totalOpportunities = mockOpportunities.length
  const totalOpportunitiesOpportunities = mockOpportunities.reduce((sum, p) => sum + p.opportunities, 0)
  const totalCustomers = mockOpportunities.reduce((sum, p) => sum + p.customers, 0)
  // Assuming these values are hardcoded as 0 based on the image, as no calculation logic is provided
  const totalValueOpportunities = 0
  const weightedValueOpportunities = 0

  const handleOpenShareDialog = (listId: string, listName: string) => {
    setShareDialog({
      isOpen: true,
      listId,
      listName,
      recipients: [],
      newEmail: "",
      currentPermission: "viewer",
      message: "",
      step: "initial",
    })
  }

  const handleCloseShareDialog = () => {
    setShareDialog({
      isOpen: false,
      listId: null,
      listName: "",
      recipients: [],
      newEmail: "",
      currentPermission: "viewer",
      message: "",
      step: "initial",
    })
  }

  const handleAddRecipient = () => {
    if (shareDialog.newEmail && shareDialog.newEmail.includes("@")) {
      const newRecipient: ShareRecipient = {
        id: Date.now().toString(),
        email: shareDialog.newEmail,
        permission: shareDialog.currentPermission,
        note: "",
      }
      setShareDialog((prev) => ({
        ...prev,
        recipients: [newRecipient],
        step: "compose",
      }))
    }
  }

  const handleGoToCompose = (recipient: ShareRecipient) => {
    setShareDialog((prev) => ({
      ...prev,
      recipients: [recipient],
      step: "compose",
      message: "",
    }))
  }

  const handleBackToInitial = () => {
    setShareDialog((prev) => ({
      ...prev,
      step: "initial",
      recipients: [],
      message: "",
    }))
  }

  const handleUpdateAccessPermission = (id: string, newPermission: "viewer" | "commenter" | "editor") => {
    setPeopleWithAccess((prev) => prev.map((p) => (p.id === id ? { ...p, permission: newPermission } : p)))
  }

  const handleRemoveAccess = (id: string) => {
    setPeopleWithAccess((prev) => prev.filter((p) => p.id !== id))
  }

  const handleSendShares = () => {
    // Here you would implement the actual email sending logic
    console.log("Sharing list:", shareDialog.listName)
    console.log("Recipients:", shareDialog.recipients)
    console.log("Message:", shareDialog.message)

    // Add the recipient to the peopleWithAccess list with the message
    if (shareDialog.recipients.length > 0) {
      setPeopleWithAccess((prev) => [...prev, { ...shareDialog.recipients[0], note: shareDialog.message }])
    }

    // Reset share dialog to initial state
    setShareDialog((prev) => ({
      ...prev,
      recipients: [],
      newEmail: "",
      currentPermission: "viewer",
      message: "",
      step: "initial",
    }))

    // You could show a success toast here
  }

  // Handlers for editing lists
  const handleOpenEditListDialog = (list: SavedList) => {
    setListToEdit(list)
    setShowEditListDialog(true)
  }

  const handleSaveEditedList = () => {
    if (listToEdit) {
      setSavedLists((prev) =>
        prev.map((list) =>
          list.id === listToEdit.id
            ? {
                ...list,
                name: listToEdit.name,
              }
            : list,
        ),
      )
      setShowEditListDialog(false)
      setListToEdit(null)
    }
  }

  // Handlers for deleting lists
  const handleOpenDeleteConfirm = (listId: string) => {
    setListToDeleteId(listId)
    setShowConfirmDeleteDialog(true)
  }

  const handleDeleteConfirmed = () => {
    if (listToDeleteId) {
      setSavedLists((prev) => prev.filter((list) => list.id !== listToDeleteId))
      if (selectedListId === listToDeleteId) {
        setSelectedListId("1") // Default to "All Opportunities" if the deleted list was selected
        clearFilters() // Also clear filters if a dynamic list
      }
      setShowConfirmDeleteDialog(false)
      setListToDeleteId(null)
    }
  }

  // Handlers for static list content editing
  const handleStartEditingListContent = (listId: string) => {
    if (hasUnsavedChanges) {
      setPendingAction(() => () => performStartEditingListContent(listId))
      setShowUnsavedChangesDialog(true)
      return
    }
    performStartEditingListContent(listId)
  }

  const performStartEditingListContent = (listId: string) => {
    const list = savedLists.find((l) => l.id === listId)
    if (list && list.type === "static") {
      setIsEditingListContent(true)
      setEditingListId(listId)
      setEditModeSelectedOpportunities(list.opportunityIds || [])
      setEditModeSearchTerm("")
      clearEditModeFilters()
      setShowEditModeFilters(false)
      setSavedListsExpanded(false) // Collapse saved lists section
    }
  }

  const handleSaveListContent = () => {
    if (editingListId) {
      setSavedLists((prev) =>
        prev.map((list) =>
          list.id === editingListId
            ? {
                ...list,
                opportunityIds: editModeSelectedOpportunities,
                opportunityCount: editModeSelectedOpportunities.length,
              }
            : list,
        ),
      )

      // If we're editing the currently selected list, update the main view
      if (editingListId === selectedListId) {
        setSelectedOpportunities([])
      }

      handleCancelEditingListContent()
    }
  }

  const handleCancelEditingListContent = () => {
    setIsEditingListContent(false)
    setEditingListId(null)
    setEditModeSelectedOpportunities([])
    setEditModeSearchTerm("")
    clearEditModeFilters()
    setShowEditModeFilters(false)
  }

  // Handlers for dynamic list content editing
  const handleStartEditingDynamicListContent = (listId: string) => {
    if (hasUnsavedChanges) {
      setPendingAction(() => () => performStartEditingDynamicListContent(listId))
      setShowUnsavedChangesDialog(true)
      return
    }
    performStartEditingDynamicListContent(listId)
  }

  const performStartEditingDynamicListContent = (listId: string) => {
    const list = savedLists.find((l) => l.id === listId)
    if (list && list.type === "dynamic" && list.filters) {
      setIsEditingDynamicList(true)
      setEditingDynamicListId(listId)
      setEditDynamicFilters(list.filters)
      setOriginalDynamicFilters(list.filters)
      setShowFilters(true) // Show filters panel when editing dynamic list
      setSavedListsExpanded(false) // Collapse saved lists section
    }
  }

  const handleSaveDynamicListContent = () => {
    if (editingDynamicListId) {
      setSavedLists((prev) =>
        prev.map((list) =>
          list.id === editingDynamicListId
            ? {
                ...list,
                filters: editDynamicFilters,
                opportunityCount: filteredOpportunities.length,
              }
            : list,
        ),
      )

      // If we're editing the currently selected list, update the main filters
      if (editingDynamicListId === selectedListId) {
        setFilters(editDynamicFilters)
      }

      handleCancelEditingDynamicListContent()
    }
  }

  const handleCancelEditingDynamicListContent = () => {
    setIsEditingDynamicList(false)
    setEditingDynamicListId(null)
    setEditDynamicFilters({
      status: "all",
      type: "all",
      size: "all",
      stage: "all",
      region: "all",
      priority: "all",
    })
    setOriginalDynamicFilters({
      status: "all",
      type: "all",
      size: "all",
      stage: "all",
      region: "all",
      priority: "all",
    })
    setShowFilters(false)
  }

  const handleUnsavedChangesConfirm = () => {
    setShowUnsavedChangesDialog(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  const handleUnsavedChangesCancel = () => {
    setShowUnsavedChangesDialog(false)
    setPendingAction(null)
  }

  // Prevent navigation away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Handlers for view content editing
  const handleStartEditingViewContent = (view: SavedView) => {
    if (hasUnsavedChanges) {
      setPendingAction(() => () => performStartEditingViewContent(view))
      setShowUnsavedChangesDialog(true)
      return
    }
    performStartEditingViewContent(view)
  }

  const performStartEditingViewContent = (view: SavedView) => {
    setIsEditingViewContent(true)
    setEditingViewId(view.id)
    setEditViewFilters(view.filters)
    setOriginalViewFilters(view.filters)
    setShowFilters(true) // Show filters panel when editing view
    setSavedListsExpanded(false) // Collapse saved lists section
  }

  const handleSaveViewContent = () => {
    if (editingViewId) {
      setSavedViews((prev) =>
        prev.map((view) =>
          view.id === editingViewId
            ? {
                ...view,
                filters: editViewFilters,
              }
            : view,
        ),
      )

      handleCancelEditingViewContent()
    }
  }

  const handleCancelEditingViewContent = () => {
    setIsEditingViewContent(false)
    setEditingViewId(null)
    setEditViewFilters({
      status: "all",
      type: "all",
      size: "all",
      stage: "all",
      region: "all",
      priority: "all",
    })
    setOriginalViewFilters({
      status: "all",
      type: "all",
      size: "all",
      stage: "all",
      region: "all",
      priority: "all",
    })
    setShowFilters(false)
  }

  const handleSort = (key: keyof Opportunity) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc",
    }))
  }

  const getSortIcon = (key: keyof Opportunity) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />
    }
    return sortConfig.direction === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
  }

  const handleBulkDelete = () => {
    if (isEditingListContent && editingListId) {
      // Remove selected opportunities from the list being edited
      setEditModeSelectedOpportunities((prev) => prev.filter((id) => !selectedOpportunities.includes(id)))
    }
    setSelectedOpportunities([])
    setShowBulkDeleteDialog(false)
  }

  const activeView = useMemo(() => {
    return savedViews.find((view) => JSON.stringify(view.filters) === JSON.stringify(filters))
  }, [savedViews, filters])

  return (
    <TooltipProvider>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Edit Mode Alerts */}
        {isEditingListContent && editingList && (
          <Alert className="mb-4 border-purple-200 bg-purple-50">
            <Edit className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800 text-sm">
              <strong>Edit Mode:</strong> You are currently editing the content of "{editingList.name}". Select or
              deselect opportunities below, then click "Save Changes" to update the list.
            </AlertDescription>
          </Alert>
        )}

        {isEditingDynamicList && editingDynamicList && (
          <Alert className="mb-4 border-purple-200 bg-purple-50">
            <Edit className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800 text-sm">
              <strong>Edit Mode:</strong> You are currently editing the filter criteria for "{editingDynamicList.name}".
              Adjust the filters below, then click "Save Changes" to update the dynamic list.
            </AlertDescription>
          </Alert>
        )}

        {isEditingViewContent && savedViews.find((v) => v.id === editingViewId) && (
          <Alert className="mb-4 border-purple-200 bg-purple-50">
            <Settings className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800 text-sm">
              <strong>Edit Mode:</strong> You are currently editing the filter criteria for view "
              {savedViews.find((v) => v.id === editingViewId)?.name}". Adjust the filters below, then click "Save
              Changes" to update the view.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-4">
          <Card className="flex flex-col items-start justify-center py-2 px-3">
            <div className="text-2xl font-bold text-gray-900">{totalOpportunities}</div>
            <div className="text-sm text-gray-600">Total Opportunities</div>
          </Card>
          <Card className="flex flex-col items-start justify-center py-2 px-3">
            <div className="text-2xl font-bold text-gray-900">€ {totalValueOpportunities}</div>
            <div className="text-sm text-gray-600">Total Value Opportunities</div>
          </Card>
          <Card className="flex flex-col items-start justify-center py-2 px-3">
            <div className="text-2xl font-bold text-gray-900">€ {weightedValueOpportunities}</div>
            <div className="text-sm text-gray-600">Weighted Value Opportunities</div>
          </Card>
        </div>

        {/* Saved Lists Section */}
        <Collapsible open={savedListsExpanded} onOpenChange={setSavedListsExpanded}>
          <div className="flex items-center gap-4 mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="p-0 h-7 font-semibold text-lg hover:bg-gray-100 rounded-md px-2 -mx-2">
                {savedListsExpanded ? (
                  <ChevronDown className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2" />
                )}
                Saved Lists ({savedLists.length})
              </Button>
            </CollapsibleTrigger>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <Button
                variant={savedListsViewMode === "cards" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 rounded-r-none",
                  savedListsViewMode === "cards"
                    ? "bg-purple-700 text-white border-purple-700 hover:bg-purple-700 hover:text-white"
                    : "hover:bg-purple-100 hover:text-purple-600",
                )}
                onClick={() => setSavedListsViewMode("cards")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={savedListsViewMode === "list" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 rounded-l-none",
                  savedListsViewMode === "list"
                    ? "bg-purple-700 text-white border-purple-700 hover:bg-purple-700 hover:text-white"
                    : "hover:bg-purple-100 hover:text-purple-600",
                )}
                onClick={() => setSavedListsViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            {selectedList && (
              <div className="px-3 py-1 bg-purple-50 border border-purple-200 rounded-md">
                <span className="text-sm font-medium text-purple-800">Currently viewing: {selectedList.name}</span>
              </div>
            )}
          </div>

          <CollapsibleContent>
            <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-4 mb-4">
              {savedListsViewMode === "cards" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedLists.map((list) => {
                    // Calculate live opportunity count for dynamic lists
                    const liveOpportunityCount =
                      list.type === "dynamic" && list.filters
                        ? mockOpportunities.filter((opportunity) => {
                            const listFilters = list.filters!
                            return (
                              (listFilters.status === "all" || opportunity.status === listFilters.status) &&
                              (listFilters.type === "all" ||
                                opportunity.industry.toLowerCase() === listFilters.type.toLowerCase()) &&
                              (listFilters.size === "all" || opportunity.size === listFilters.size) &&
                              (listFilters.stage === "all" || opportunity.status === listFilters.stage)
                            )
                          }).length
                        : list.opportunityCount

                    const isSelected = selectedListId === list.id

                    return (
                      <Card
                        key={list.id}
                        className={`flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group ${
                          isSelected ? "ring-2 ring-purple-500 bg-purple-50/50" : ""
                        }`}
                        onClick={() => handleListSelect(list.id)}
                      >
                        <CardHeader className="pt-3 px-3 pb-1">
                          {/* Title Row */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3
                                className={`font-medium text-base leading-tight break-words mb-2 ${
                                  isSelected ? "text-purple-700" : ""
                                }`}
                              >
                                {list.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                {list.id !== "1" && ( // Conditionally render badge for "All Opportunities"
                                  <Badge
                                    variant={list.type === "dynamic" ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {list.type === "dynamic" ? (
                                      <>
                                        <Zap className="w-3 h-3 mr-1" />
                                        Dynamic
                                      </>
                                    ) : (
                                      <>
                                        <List className="w-3 h-3 mr-1" />
                                        Static
                                      </>
                                    )}
                                  </Badge>
                                )}
                                <span className={`text-sm ${isSelected ? "text-purple-600" : "text-muted-foreground"}`}>
                                  {liveOpportunityCount} opportunities
                                </span>
                              </div>
                            </div>

                            {/* Actions - Top Right */}
                            {list.id !== "1" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleOpenEditListDialog(list)}>
                                    Edit Name
                                  </DropdownMenuItem>
                                  {list.type === "static" && (
                                    <DropdownMenuItem onClick={() => handleStartEditingListContent(list.id)}>
                                      Edit List Content
                                    </DropdownMenuItem>
                                  )}
                                  {list.type === "dynamic" && (
                                    <DropdownMenuItem onClick={() => handleStartEditingDynamicListContent(list.id)}>
                                      Edit List Content
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleOpenDeleteConfirm(list.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-3 px-3 pb-1"></CardContent>
                        <CardFooter className="py-2 px-3 flex justify-end"></CardFooter>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden bg-white">
                  {savedLists.map((list) => {
                    const liveOpportunityCount =
                      list.type === "dynamic" && list.filters
                        ? mockOpportunities.filter((opportunity) => {
                            const listFilters = list.filters!
                            return (
                              (listFilters.status === "all" || opportunity.status === listFilters.status) &&
                              (listFilters.type === "all" ||
                                opportunity.industry.toLowerCase() === listFilters.type.toLowerCase()) &&
                              (listFilters.size === "all" || opportunity.size === listFilters.size) &&
                              (listFilters.stage === "all" || opportunity.status === listFilters.stage)
                            )
                          }).length
                        : list.opportunityCount

                    const isSelected = selectedListId === list.id

                    return (
                      <div
                        key={list.id}
                        className={`flex items-center justify-between pt-3 px-3 pb-1 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer group transition-all ${
                          isSelected ? "bg-purple-50 border-purple-200" : ""
                        }`}
                        onClick={() => handleListSelect(list.id)}
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className={`font-medium text-base ${isSelected ? "text-purple-700" : ""}`}>
                              {list.name}
                            </h3>
                            {list.id !== "1" && ( // Conditionally render badge for "All Opportunities"
                              <Badge variant={list.type === "dynamic" ? "default" : "secondary"} className="text-xs">
                                {list.type === "dynamic" ? (
                                  <>
                                    <Zap className="w-3 h-3 mr-1" />
                                    Dynamic
                                  </>
                                ) : (
                                  <>
                                    <List className="w-3 h-3 mr-1" />
                                    Static
                                  </>
                                )}
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm ${isSelected ? "text-purple-600" : "text-muted-foreground"} mb-0.5`}>
                            {liveOpportunityCount} opportunities
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {list.id !== "1" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-60 hover:opacity-100">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEditListDialog(list)}>
                                  Edit Name
                                </DropdownMenuItem>
                                {list.type === "static" && (
                                  <DropdownMenuItem onClick={() => handleStartEditingListContent(list.id)}>
                                    Edit List Content
                                  </DropdownMenuItem>
                                )}
                                {list.type === "dynamic" && (
                                  <DropdownMenuItem onClick={() => handleStartEditingDynamicListContent(list.id)}>
                                    Edit List Content
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleOpenDeleteConfirm(list.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-4 mb-4">
          {/* Top Row: Search and Right-aligned display/filter controls */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search opportunities..."
                value={isEditingListContent ? editModeSearchTerm : searchTerm}
                onChange={(e) =>
                  isEditingListContent ? setEditModeSearchTerm(e.target.value) : setSearchTerm(e.target.value)
                }
                className="pl-10 text-sm h-7"
              />
            </div>

            {/* Right-aligned group: Filter, View, Fields, Opportunity Count */}
            {!isEditingListContent && !isEditingDynamicList && !isEditingViewContent && (
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-sm h-7"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {Object.values(filters).filter((value) => value !== "all").length}
                    </Badge>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent text-sm h-7">
                      <Bookmark className="w-4 h-4" />
                      {activeView?.name || "View"}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {savedViews.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Saved Views</div>
                        {savedViews.map((view) => (
                          <div key={view.id} className="relative group">
                            <DropdownMenuItem onClick={() => handleApplyView(view)} className="text-sm pr-8">
                              <div className="flex items-center gap-2 w-full">
                                <Filter className="w-4 h-4 text-blue-600" />
                                <div className="flex-1">
                                  <div className="font-medium">{view.name}</div>
                                </div>
                              </div>
                            </DropdownMenuItem>
                            <div className="absolute right-2 top-0 h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleOpenEditViewDialog(view)}>
                                    Edit Name
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStartEditingViewContent(view)}>
                                    Edit View Content
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleOpenDeleteViewConfirm(view.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {activeView && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={clearFilters} className="text-destructive focus:text-destructive">
                          <X className="w-4 h-4 mr-2" />
                          Clear view
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {(isEditingListContent || isEditingDynamicList) && (
              <div className="flex items-center gap-2 ml-auto">
                {isEditingListContent && (
                  <Button
                    variant={showEditModeFilters ? "default" : "outline"}
                    onClick={() => setShowEditModeFilters(!showEditModeFilters)}
                    className="flex items-center gap-2 text-sm h-7"
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                    {hasActiveEditModeFilters && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {Object.values(editModeFilters).filter((value) => value !== "all").length}
                      </Badge>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {(showFilters ||
          (isEditingListContent && showEditModeFilters) ||
          isEditingDynamicList ||
          isEditingViewContent) && (
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Select
                    value={
                      isEditingViewContent
                        ? editViewFilters.status
                        : isEditingDynamicList
                          ? editDynamicFilters.status
                          : isEditingListContent
                            ? editModeFilters.status
                            : filters.status
                    }
                    onValueChange={(value) => {
                      if (isEditingViewContent) {
                        setEditViewFilters((prev) => ({ ...prev, status: value }))
                      } else if (isEditingDynamicList) {
                        setEditDynamicFilters((prev) => ({ ...prev, status: value }))
                      } else if (isEditingListContent) {
                        setEditModeFilters((prev) => ({ ...prev, status: value }))
                      } else {
                        setFilters((prev) => ({ ...prev, status: value }))
                      }
                    }}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-sm">
                        All
                      </SelectItem>
                      <SelectItem value="active" className="text-sm">
                        Active
                      </SelectItem>
                      <SelectItem value="inactive" className="text-sm">
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Select
                    value={
                      isEditingViewContent
                        ? editViewFilters.type
                        : isEditingDynamicList
                          ? editDynamicFilters.type
                          : isEditingListContent
                            ? editModeFilters.type
                            : filters.type
                    }
                    onValueChange={(value) => {
                      if (isEditingViewContent) {
                        setEditViewFilters((prev) => ({ ...prev, type: value }))
                      } else if (isEditingDynamicList) {
                        setEditDynamicFilters((prev) => ({ ...prev, type: value }))
                      } else if (isEditingListContent) {
                        setEditModeFilters((prev) => ({ ...prev, type: value }))
                      } else {
                        setFilters((prev) => ({ ...prev, type: value }))
                      }
                    }}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-sm">
                        All
                      </SelectItem>
                      <SelectItem value="insurance" className="text-sm">
                        Insurance
                      </SelectItem>
                      <SelectItem value="other" className="text-sm">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Size</Label>
                  <Select
                    value={
                      isEditingViewContent
                        ? editViewFilters.size
                        : isEditingDynamicList
                          ? editDynamicFilters.size
                          : isEditingListContent
                            ? editModeFilters.size
                            : filters.size
                    }
                    onValueChange={(value) => {
                      if (isEditingViewContent) {
                        setEditViewFilters((prev) => ({ ...prev, size: value }))
                      } else if (isEditingDynamicList) {
                        setEditDynamicFilters((prev) => ({ ...prev, size: value }))
                      } else if (isEditingListContent) {
                        setEditModeFilters((prev) => ({ ...prev, size: value }))
                      } else {
                        setFilters((prev) => ({ ...prev, size: value }))
                      }
                    }}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-sm">
                        All
                      </SelectItem>
                      <SelectItem value="small" className="text-sm">
                        Small
                      </SelectItem>
                      <SelectItem value="medium" className="text-sm">
                        Medium
                      </SelectItem>
                      <SelectItem value="large" className="text-sm">
                        Large
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Stage</Label>
                  <Select
                    value={
                      isEditingViewContent
                        ? editViewFilters.stage
                        : isEditingDynamicList
                          ? editDynamicFilters.stage
                          : isEditingListContent
                            ? editModeFilters.stage
                            : filters.stage
                    }
                    onValueChange={(value) => {
                      if (isEditingViewContent) {
                        setEditViewFilters((prev) => ({ ...prev, stage: value }))
                      } else if (isEditingDynamicList) {
                        setEditDynamicFilters((prev) => ({ ...prev, stage: value }))
                      } else if (isEditingListContent) {
                        setEditModeFilters((prev) => ({ ...prev, stage: value }))
                      } else {
                        setFilters((prev) => ({ ...prev, stage: value }))
                      }
                    }}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-sm">
                        All
                      </SelectItem>
                      <SelectItem value="prospect" className="text-sm">
                        Prospect
                      </SelectItem>
                      <SelectItem value="active" className="text-sm">
                        Active
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Region</Label>
                  <Select
                    value={
                      isEditingViewContent
                        ? editViewFilters.region || "all"
                        : isEditingDynamicList
                          ? editDynamicFilters.region || "all"
                          : isEditingListContent
                            ? editModeFilters.region || "all"
                            : filters.region || "all"
                    }
                    onValueChange={(value) => {
                      if (isEditingViewContent) {
                        setEditViewFilters((prev) => ({ ...prev, region: value }))
                      } else if (isEditingDynamicList) {
                        setEditDynamicFilters((prev) => ({ ...prev, region: value }))
                      } else if (isEditingListContent) {
                        setEditModeFilters((prev) => ({ ...prev, region: value }))
                      } else {
                        setFilters((prev) => ({ ...prev, region: value }))
                      }
                    }}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-sm">
                        All
                      </SelectItem>
                      <SelectItem value="North" className="text-sm">
                        North
                      </SelectItem>
                      <SelectItem value="Central" className="text-sm">
                        Central
                      </SelectItem>
                      <SelectItem value="South" className="text-sm">
                        South
                      </SelectItem>
                      <SelectItem value="East" className="text-sm">
                        East
                      </SelectItem>
                      <SelectItem value="West" className="text-sm">
                        West
                      </SelectItem>
                      <SelectItem value="Global" className="text-sm">
                        Global
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Select
                    value={
                      isEditingViewContent
                        ? editViewFilters.priority || "all"
                        : isEditingDynamicList
                          ? editDynamicFilters.priority || "all"
                          : isEditingListContent
                            ? editModeFilters.priority || "all"
                            : filters.priority || "all"
                    }
                    onValueChange={(value) => {
                      if (isEditingViewContent) {
                        setEditViewFilters((prev) => ({ ...prev, priority: value }))
                      } else if (isEditingDynamicList) {
                        setEditDynamicFilters((prev) => ({ ...prev, priority: value }))
                      } else if (isEditingListContent) {
                        setEditModeFilters((prev) => ({ ...prev, priority: value }))
                      } else {
                        setFilters((prev) => ({ ...prev, priority: value }))
                      }
                    }}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-sm">
                        All
                      </SelectItem>
                      <SelectItem value="high" className="text-sm">
                        High
                      </SelectItem>
                      <SelectItem value="medium" className="text-sm">
                        Medium
                      </SelectItem>
                      <SelectItem value="low" className="text-sm">
                        Low
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {((isEditingViewContent && Object.values(editViewFilters).some((value) => value !== "all")) ||
                (isEditingDynamicList && hasActiveDynamicEditFilters) ||
                (isEditingListContent && hasActiveEditModeFilters) ||
                (!isEditingViewContent && !isEditingDynamicList && !isEditingListContent && hasActiveFilters)) && (
                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isEditingViewContent) {
                        setEditViewFilters({
                          status: "all",
                          type: "all",
                          size: "all",
                          stage: "all",
                          region: "all",
                          priority: "all",
                        })
                      } else if (isEditingDynamicList) {
                        clearEditDynamicFilters()
                      } else if (isEditingListContent) {
                        clearEditModeFilters()
                      } else {
                        clearFilters()
                      }
                    }}
                    className="text-sm bg-transparent h-7"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Save Actions Row - Grouped together for better UX */}
        {!isEditingListContent &&
          !isEditingDynamicList &&
          !isEditingViewContent &&
          hasActiveFilters &&
          selectedListId === "1" && (
            <div className="flex items-center justify-end gap-3 mb-4">
              {hasActiveFilters && (
                <>
                  <Button
                    onClick={() => setShowSaveViewDialog(true)}
                    className="flex items-center gap-2 text-sm h-7"
                    variant="outline"
                  >
                    <Bookmark className="w-4 h-4" />
                    Save as View
                  </Button>

                  <Button
                    onClick={() => setShowDynamicListDialog(true)}
                    className="flex items-center gap-2 text-sm h-7"
                    variant="default"
                  >
                    <Zap className="w-4 h-4" />
                    Save as Dynamic List
                  </Button>
                </>
              )}
            </div>
          )}

        {/* Bulk Actions Bar */}
        {isEditingListContent ? (
          <div className="bg-purple-50 border border-purple-200 rounded-md px-4 py-2.5 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-purple-900">
                  {editModeSelectedOpportunities.length} opportunity
                  {editModeSelectedOpportunities.length !== 1 ? "s" : ""} selected for "{editingList?.name}"
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEditingListContent}
                  className="text-sm bg-transparent h-8 px-3 text-purple-900 border-purple-300 hover:bg-purple-100"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveListContent}
                  disabled={!hasUnsavedChanges}
                  className="text-sm h-8 px-3 bg-purple-600 hover:bg-purple-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        ) : isEditingDynamicList ? (
          <div className="bg-purple-50 border border-purple-200 rounded-md px-4 py-2.5 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-purple-900">
                  Editing filter criteria for "{editingDynamicList?.name}"
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEditingDynamicListContent}
                  className="text-sm bg-transparent h-8 px-3 text-purple-900 border-purple-300 hover:bg-purple-100"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveDynamicListContent}
                  disabled={!hasUnsavedChanges}
                  className="text-sm h-8 px-3 bg-purple-600 hover:bg-purple-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        ) : isEditingViewContent ? (
          <div className="bg-purple-50 border border-purple-200 rounded-md px-4 py-2.5 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-purple-900">
                  Editing filter criteria for "{savedViews.find((v) => v.id === editingViewId)?.name}"
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEditingViewContent}
                  className="text-sm bg-transparent h-8 px-3 text-purple-900 border-purple-300 hover:bg-purple-100"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveViewContent}
                  disabled={!hasUnsavedChanges}
                  className="text-sm h-8 px-3 bg-purple-600 hover:bg-purple-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        ) : selectedOpportunities.length > 0 ? (
          <div className="bg-purple-50 border border-purple-200 rounded-md px-4 py-2.5 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-purple-900">
                  {selectedOpportunities.length} opportunity{selectedOpportunities.length !== 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#E1E4FB] text-purple-900 border-0 hover:bg-[#BFC6F5] h-8 px-3 text-sm rounded-md"
                  >
                    Update stage
                  </Button>
                  <Dialog open={showAddListDialog} onOpenChange={setShowAddListDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-[#E1E4FB] text-purple-900 border-0 hover:bg-[#BFC6F5] h-8 px-3 text-sm rounded-md"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to list
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-purple-700 hover:bg-purple-100 h-8 px-3 text-sm rounded-md"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        ) : null}

        {/* Opportunity Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Checkbox
                    id="select-all"
                    checked={
                      isEditingListContent
                        ? editModeSelectedOpportunities.length === filteredOpportunities.length &&
                          filteredOpportunities.length > 0
                        : selectedOpportunities.length === filteredOpportunities.length &&
                          filteredOpportunities.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                    disabled={isEditingDynamicList}
                  />
                </th>
                {visibleFields.partner && (
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Partner
                      {getSortIcon("name")}
                    </div>
                  </th>
                )}
                {visibleFields.industry && (
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("industry")}
                  >
                    <div className="flex items-center gap-2">
                      Industry
                      {getSortIcon("industry")}
                    </div>
                  </th>
                )}
                {visibleFields.size && (
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("size")}
                  >
                    <div className="flex items-center gap-2">
                      Size
                      {getSortIcon("size")}
                    </div>
                  </th>
                )}
                {visibleFields.region && (
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("region")}
                  >
                    <div className="flex items-center gap-2">
                      Region
                      {getSortIcon("region")}
                    </div>
                  </th>
                )}
                {visibleFields.status && (
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {getSortIcon("status")}
                    </div>
                  </th>
                )}
                {visibleFields.customers && (
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("customers")}
                  >
                    <div className="flex items-center gap-2">
                      Customers
                      {getSortIcon("customers")}
                    </div>
                  </th>
                )}
                {visibleFields.opportunities && (
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("opportunities")}
                  >
                    <div className="flex items-center gap-2">
                      Opportunities
                      {getSortIcon("opportunities")}
                    </div>
                  </th>
                )}
                {visibleFields.contacts && (
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("contacts")}
                  >
                    <div className="flex items-center gap-2">
                      Contacts
                      {getSortIcon("contacts")}
                    </div>
                  </th>
                )}
                {visibleFields.template && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedOpportunities.map((opportunity) => (
                <tr key={opportunity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Checkbox
                      id={`opportunity-${opportunity.id}`}
                      checked={
                        isEditingListContent
                          ? editModeSelectedOpportunities.includes(opportunity.id)
                          : selectedOpportunities.includes(opportunity.id)
                      }
                      onCheckedChange={() => handleOpportunitySelect(opportunity.id)}
                      disabled={isEditingDynamicList}
                    />
                  </td>
                  {visibleFields.partner && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{opportunity.name}</div>
                      <div className="text-sm text-gray-500">{opportunity.code}</div>
                    </td>
                  )}
                  {visibleFields.industry && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{opportunity.industry}</div>
                    </td>
                  )}
                  {visibleFields.size && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="capitalize">
                        {opportunity.size}
                      </Badge>
                    </td>
                  )}
                  {visibleFields.region && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{opportunity.region}</div>
                    </td>
                  )}
                  {visibleFields.status && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={opportunity.status === "active" ? "default" : "secondary"}>
                        {opportunity.status}
                      </Badge>
                    </td>
                  )}
                  {visibleFields.customers && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{opportunity.customers}</div>
                    </td>
                  )}
                  {visibleFields.opportunities && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{opportunity.opportunities}</div>
                    </td>
                  )}
                  {visibleFields.contacts && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{opportunity.contacts}</div>
                    </td>
                  )}
                  {visibleFields.template && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{opportunity.template}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredOpportunities.length)} of{" "}
                {filteredOpportunities.length} results
              </div>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-700">per page</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8"
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* All Dialogs */}
        <Dialog open={showDynamicListDialog} onOpenChange={setShowDynamicListDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Dynamic List</DialogTitle>
            </DialogHeader>
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <Zap className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Dynamic Lists automatically update as opportunities match your selected filters.
              </AlertDescription>
            </Alert>
            <div className="grid gap-4 pt-0 pb-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={dynamicListForm.name}
                  onChange={(e) => setDynamicListForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Active Insurance Opportunities"
                />
              </div>

              {/* Filter Preview Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Includes opportunities with</Label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(filters).map(([key, value]) => {
                      if (value === "all") return null
                      const displayKey = key.charAt(0).toUpperCase() + key.slice(1)
                      const displayValue = value.charAt(0).toUpperCase() + value.slice(1)
                      return (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {displayKey}: {displayValue}
                        </Badge>
                      )
                    })}
                    {Object.values(filters).every((value) => value === "all") && (
                      <span className="text-xs text-gray-500 italic">
                        No filters applied - all opportunities will be included
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setShowDynamicListDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleCreateDynamicList}>
                Create List
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddListDialog} onOpenChange={setShowAddListDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add to list</DialogTitle>
              <DialogDescription>
                Add the selected opportunities to an existing list or create a new one.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm font-medium">
                  {selectedOpportunities.length} opportunity{selectedOpportunities.length !== 1 ? "s" : ""} will be
                  added to this list
                </p>
              </div>

              {/* Choose an option */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base">Choose an option</h3>

                <RadioGroup
                  value={newListForm.addToExisting ? "existing" : "new"}
                  onValueChange={(value) => {
                    setNewListForm((prev) => ({
                      ...prev,
                      addToExisting: value === "existing",
                      name: value === "existing" ? "" : prev.name,
                    }))
                  }}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="new" id="create-new" />
                    <Label htmlFor="create-new" className="font-medium text-sm">
                      Create new list
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="existing" id="add-existing" />
                    <Label htmlFor="add-existing" className="font-medium text-sm">
                      Add to existing list
                    </Label>
                  </div>
                </RadioGroup>

                {/* Conditional content based on selection */}
                {!newListForm.addToExisting ? (
                  <div className="space-y-2">
                    <Label htmlFor="new-list-name" className="text-sm font-semibold">
                      New list name
                    </Label>
                    <Input
                      id="new-list-name"
                      value={newListForm.name}
                      onChange={(e) => setNewListForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter list name"
                      className="text-sm"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="existing-list" className="text-sm font-semibold">
                      Select existing list
                    </Label>
                    <Select onValueChange={(value) => setNewListForm((prev) => ({ ...prev, existingListId: value }))}>
                      <SelectTrigger id="existing-list" className="text-sm">
                        <SelectValue placeholder="Choose a list" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedLists
                          .filter((list) => list.type === "static")
                          .map((list) => (
                            <SelectItem key={list.id} value={list.id}>
                              {list.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateList}
                className="bg-[#5567E5] hover:bg-[#4556D4] text-white"
                disabled={!newListForm.addToExisting ? !newListForm.name.trim() : !newListForm.existingListId}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showSaveViewDialog} onOpenChange={setShowSaveViewDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create View</DialogTitle>
              <DialogDescription>Save your current filters as a view for easy access later.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={saveViewForm.name}
                  onChange={(e) => setSaveViewForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Active Insurance Opportunities"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Column Configuration</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowColumnConfigInView(!showColumnConfigInView)}
                    className="text-xs"
                  >
                    {showColumnConfigInView ? "Hide" : "Customize"}
                  </Button>
                </div>

                {showColumnConfigInView && (
                  <div className="border rounded-lg p-4 space-y-4 max-h-64 overflow-y-auto">
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Partner Fields</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: "partner", label: "Partner Name" },
                          { key: "team", label: "Team" },
                          { key: "industry", label: "Industry" },
                          { key: "region", label: "Region" },
                          { key: "partnerType", label: "Partner Type" },
                          { key: "contractValue", label: "Contract Value" },
                          { key: "partnershipDuration", label: "Partnership Duration" },
                          { key: "contractDate", label: "Contract Date" },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={`view-column-${key}`}
                              checked={viewColumnVisibility[key] ?? true}
                              onCheckedChange={(checked) => {
                                setViewColumnVisibility((prev) => ({
                                  ...prev,
                                  [key]: !!checked,
                                }))
                              }}
                            />
                            <Label htmlFor={`view-column-${key}`} className="text-xs">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Key Metrics</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: "revenue", label: "Revenue" },
                          { key: "satisfaction", label: "Satisfaction" },
                          { key: "expansion", label: "Expansion" },
                          { key: "leads", label: "Leads" },
                          { key: "retention", label: "Retention" },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={`view-column-${key}`}
                              checked={viewColumnVisibility[key] ?? true}
                              onCheckedChange={(checked) => {
                                setViewColumnVisibility((prev) => ({
                                  ...prev,
                                  [key]: !!checked,
                                }))
                              }}
                            />
                            <Label htmlFor={`view-column-${key}`} className="text-xs">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateView} className="bg-purple-500 text-white hover:bg-purple-600">
                Create View
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditListDialog} onOpenChange={setShowEditListDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit List Name</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={listToEdit?.name || ""}
                  onChange={(e) => setListToEdit((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                  placeholder="Concordia Offices"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleSaveEditedList}
                className="bg-purple-500 text-white hover:bg-purple-600"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditViewDialog} onOpenChange={setShowEditViewDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit View Name</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={viewToEdit?.name || ""}
                  onChange={(e) => setViewToEdit((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                  placeholder="Active Insurance Opportunities"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSaveEditedView}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showConfirmDeleteDialog} onOpenChange={setShowConfirmDeleteDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete List</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this list? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setShowConfirmDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirmed}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showConfirmDeleteViewDialog} onOpenChange={setShowConfirmDeleteViewViewDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete View</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this view? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setShowConfirmDeleteViewViewDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteViewConfirmed}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Unsaved Changes</DialogTitle>
              <DialogDescription>You have unsaved changes. Are you sure you want to continue?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={handleUnsavedChangesCancel}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleUnsavedChangesConfirm}>
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={shareDialog.isOpen} onOpenChange={handleCloseShareDialog}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {shareDialog.step === "compose" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToInitial}
                    className="p-0 h-auto hover:bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                )}
                Share "{shareDialog.listName}"
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Share this list with others by adding their email addresses or copying a shareable link
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {shareDialog.step === "initial" ? (
                <>
                  {/* Add people section */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Add people, groups, or opportunities"
                        value={shareDialog.newEmail}
                        onChange={(e) => setShareDialog((prev) => ({ ...prev, newEmail: e.target.value }))}
                        className="focus:border-blue-600 border"
                      />
                    </div>
                    <Select
                      value={shareDialog.currentPermission}
                      onValueChange={(value) =>
                        setShareDialog((prev) => ({
                          ...prev,
                          currentPermission: value as "viewer" | "commenter" | "editor",
                        }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="commenter">Commenter</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleAddRecipient}
                      disabled={!shareDialog.newEmail.includes("@")}
                      className="bg-[#5567E5] hover:bg-[#4556D4] text-white"
                    >
                      Send
                    </Button>
                  </div>

                  {/* People with access section */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">People with access</h3>
                    {peopleWithAccess.map((person) => (
                      <div key={person.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {person.id === "owner" ? "A" : person.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{person.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {person.id === "owner" ? (
                            <span className="text-gray-500 text-sm">Owner</span>
                          ) : (
                            <>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-gray-700 hover:bg-gray-100">
                                    {person.permission.charAt(0).toUpperCase() + person.permission.slice(1)}
                                    <ChevronDown className="w-4 h-4 ml-1" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateAccessPermission(person.id, "viewer")}
                                    className="flex items-center gap-2"
                                  >
                                    {person.permission === "viewer" && <span className="text-blue-600">✓</span>}
                                    Viewer
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateAccessPermission(person.id, "commenter")}
                                    className="flex items-center gap-2"
                                  >
                                    {person.permission === "commenter" && <span className="text-blue-600">✓</span>}
                                    Commenter
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateAccessPermission(person.id, "editor")}
                                    className="flex items-center gap-2"
                                  >
                                    {person.permission === "editor" && <span className="text-blue-600">✓</span>}
                                    Editor
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveAccess(person.id)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    Remove access
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Copy link section */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <Link className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">Copy link</span>
                    </div>
                    <Button className="bg-[#5567E5] hover:bg-[#4556D4] text-white">Done</Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Compose step */}
                  {shareDialog.recipients.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {shareDialog.recipients[0].email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{shareDialog.recipients[0].email}</div>
                        </div>
                        <Select
                          value={shareDialog.recipients[0].permission}
                          onValueChange={(value) =>
                            setShareDialog((prev) => ({
                              ...prev,
                              recipients: prev.recipients.map((r) => ({ ...r, permission: value as any })),
                            }))
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="commenter">Commenter</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-900">Message</Label>
                    <Textarea
                      placeholder="Add a message (optional)"
                      value={shareDialog.message}
                      onChange={(e) => setShareDialog((prev) => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-3">
                      <Link className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" onClick={handleBackToInitial}>
                        Cancel
                      </Button>
                      <Button onClick={handleSendShares} className="bg-[#5567E5] hover:bg-[#4556D4] text-white">
                        Send
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
