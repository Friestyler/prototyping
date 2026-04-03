"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  TrendingUp,
  Calendar,
  Target,
  Users,
  User,
  UserCheck,
  Building2,
  Car,
  X,
  Search,
  Briefcase,
  DollarSign,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  AlertCircle,
  Award,
  Bell,
  BookOpen,
  Clock,
  FileText,
  Filter,
  Flag,
  Gift,
  Globe,
  Heart,
  Home,
  Mail,
  MapPin,
  Phone,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  Zap,
  Shield,
  Percent,
  CreditCard,
  Package,
  Layers,
  Archive,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Bookmark,
  Box,
  Camera,
  CheckCircle,
  ChevronRight,
  Clipboard,
  Cloud,
  Code,
  Coffee,
  Compass,
  Copy,
  Database,
  Download,
  Edit,
  Eye,
  Facebook,
  Folder,
  Github,
  Grid,
  Hash,
  Headphones,
  ImageIcon,
  Inbox,
  Info,
  Key,
  Link,
  List,
  Lock,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Mic,
  Monitor,
  Moon,
  MoreHorizontal,
  Music,
  Navigation,
  Paperclip,
  Play,
  Plus,
  Power,
  Printer,
  RefreshCw,
  Repeat,
  Save,
  Send,
  Server,
  Share,
  Smartphone,
  Sun,
  Tablet,
  ThumbsUp,
  Trash,
  Twitter,
  Umbrella,
  Unlock,
  Video,
  Volume2,
  Wifi,
  XCircle,
  Youtube,
  Anchor,
  Aperture,
  AtSign,
  Battery,
  Bluetooth,
  Calculator,
  Cast,
  Chrome,
  Cpu,
  Crosshair,
  Disc,
  Droplet,
  Feather,
  Film,
  Flame,
  Gamepad,
  Gem,
  Glasses,
  Hammer,
  HardDrive,
  Headset,
  Hexagon,
  Laptop,
  LifeBuoy,
  Lightbulb,
  Map,
  Maximize,
  Medal,
  Megaphone,
  Minimize,
  Mountain,
  Palette,
  Pen,
  Plane,
  Pocket,
  Radio,
  Rocket,
  Rss,
  Scissors,
  Shuffle,
  Sidebar,
  Sliders,
  Speaker,
  Square,
  Sunrise,
  Sunset,
  Thermometer,
  ToggleLeft,
  Tv,
  Type,
  Underline,
  Watch,
  Wind,
  Wrench,
} from "lucide-react"

interface SmartListTemplate {
  id?: string
  name: string
  description: string
  enabled: boolean
  sqlQuery: string
  minListSize: number
  maxListSize: number
  updateFrequency: "daily" | "weekly" | "monthly" | "manual"
  icon?: React.ReactNode
  iconName?: string // Store icon name for selection
  logoUrl?: string
  category?: "Offered" | "Market Radar"
  expirationDate?: string
}

interface SmartListTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: SmartListTemplate
  onSave: (template: SmartListTemplate) => void
}

const iconOptions = [
  { name: "TrendingUp", icon: TrendingUp, label: "Trending Up" },
  { name: "TrendingDown", icon: TrendingDown, label: "Trending Down" },
  { name: "Calendar", icon: Calendar, label: "Calendar" },
  { name: "Target", icon: Target, label: "Target" },
  { name: "Users", icon: Users, label: "Users" },
  { name: "User", icon: User, label: "User" },
  { name: "UserCheck", icon: UserCheck, label: "User Check" },
  { name: "Building2", icon: Building2, label: "Building" },
  { name: "Car", icon: Car, label: "Car" },
  { name: "Briefcase", icon: Briefcase, label: "Briefcase" },
  { name: "DollarSign", icon: DollarSign, label: "Dollar Sign" },
  { name: "BarChart3", icon: BarChart3, label: "Bar Chart" },
  { name: "PieChart", icon: PieChart, label: "Pie Chart" },
  { name: "Activity", icon: Activity, label: "Activity" },
  { name: "AlertCircle", icon: AlertCircle, label: "Alert" },
  { name: "Award", icon: Award, label: "Award" },
  { name: "Bell", icon: Bell, label: "Bell" },
  { name: "BookOpen", icon: BookOpen, label: "Book" },
  { name: "Clock", icon: Clock, label: "Clock" },
  { name: "FileText", icon: FileText, label: "File" },
  { name: "Filter", icon: Filter, label: "Filter" },
  { name: "Flag", icon: Flag, label: "Flag" },
  { name: "Gift", icon: Gift, label: "Gift" },
  { name: "Globe", icon: Globe, label: "Globe" },
  { name: "Heart", icon: Heart, label: "Heart" },
  { name: "Home", icon: Home, label: "Home" },
  { name: "Mail", icon: Mail, label: "Mail" },
  { name: "MapPin", icon: MapPin, label: "Location" },
  { name: "Phone", icon: Phone, label: "Phone" },
  { name: "Settings", icon: Settings, label: "Settings" },
  { name: "ShoppingCart", icon: ShoppingCart, label: "Shopping Cart" },
  { name: "Star", icon: Star, label: "Star" },
  { name: "Tag", icon: Tag, label: "Tag" },
  { name: "Truck", icon: Truck, label: "Truck" },
  { name: "Zap", icon: Zap, label: "Zap" },
  { name: "Shield", icon: Shield, label: "Shield" },
  { name: "Percent", icon: Percent, label: "Percent" },
  { name: "CreditCard", icon: CreditCard, label: "Credit Card" },
  { name: "Package", icon: Package, label: "Package" },
  { name: "Layers", icon: Layers, label: "Layers" },
  { name: "Archive", icon: Archive, label: "Archive" },
  { name: "ArrowRight", icon: ArrowRight, label: "Arrow Right" },
  { name: "ArrowLeft", icon: ArrowLeft, label: "Arrow Left" },
  { name: "ArrowUp", icon: ArrowUp, label: "Arrow Up" },
  { name: "ArrowDown", icon: ArrowDown, label: "Arrow Down" },
  { name: "Bookmark", icon: Bookmark, label: "Bookmark" },
  { name: "Box", icon: Box, label: "Box" },
  { name: "Camera", icon: Camera, label: "Camera" },
  { name: "CheckCircle", icon: CheckCircle, label: "Check Circle" },
  { name: "ChevronRight", icon: ChevronRight, label: "Chevron Right" },
  { name: "Clipboard", icon: Clipboard, label: "Clipboard" },
  { name: "Cloud", icon: Cloud, label: "Cloud" },
  { name: "Code", icon: Code, label: "Code" },
  { name: "Coffee", icon: Coffee, label: "Coffee" },
  { name: "Compass", icon: Compass, label: "Compass" },
  { name: "Copy", icon: Copy, label: "Copy" },
  { name: "Database", icon: Database, label: "Database" },
  { name: "Download", icon: Download, label: "Download" },
  { name: "Edit", icon: Edit, label: "Edit" },
  { name: "Eye", icon: Eye, label: "Eye" },
  { name: "Facebook", icon: Facebook, label: "Facebook" },
  { name: "Folder", icon: Folder, label: "Folder" },
  { name: "Github", icon: Github, label: "Github" },
  { name: "Grid", icon: Grid, label: "Grid" },
  { name: "Hash", icon: Hash, label: "Hash" },
  { name: "Headphones", icon: Headphones, label: "Headphones" },
  { name: "Image", icon: ImageIcon, label: "Image" },
  { name: "Inbox", icon: Inbox, label: "Inbox" },
  { name: "Info", icon: Info, label: "Info" },
  { name: "Key", icon: Key, label: "Key" },
  { name: "Link", icon: Link, label: "Link" },
  { name: "List", icon: List, label: "List" },
  { name: "Lock", icon: Lock, label: "Lock" },
  { name: "LogIn", icon: LogIn, label: "Log In" },
  { name: "LogOut", icon: LogOut, label: "Log Out" },
  { name: "Menu", icon: Menu, label: "Menu" },
  { name: "MessageCircle", icon: MessageCircle, label: "Message" },
  { name: "Mic", icon: Mic, label: "Microphone" },
  { name: "Monitor", icon: Monitor, label: "Monitor" },
  { name: "Moon", icon: Moon, label: "Moon" },
  { name: "MoreHorizontal", icon: MoreHorizontal, label: "More" },
  { name: "Music", icon: Music, label: "Music" },
  { name: "Navigation", icon: Navigation, label: "Navigation" },
  { name: "Paperclip", icon: Paperclip, label: "Paperclip" },
  { name: "Play", icon: Play, label: "Play" },
  { name: "Plus", icon: Plus, label: "Plus" },
  { name: "Power", icon: Power, label: "Power" },
  { name: "Printer", icon: Printer, label: "Printer" },
  { name: "RefreshCw", icon: RefreshCw, label: "Refresh" },
  { name: "Repeat", icon: Repeat, label: "Repeat" },
  { name: "Save", icon: Save, label: "Save" },
  { name: "Send", icon: Send, label: "Send" },
  { name: "Server", icon: Server, label: "Server" },
  { name: "Share", icon: Share, label: "Share" },
  { name: "Smartphone", icon: Smartphone, label: "Smartphone" },
  { name: "Sun", icon: Sun, label: "Sun" },
  { name: "Tablet", icon: Tablet, label: "Tablet" },
  { name: "ThumbsUp", icon: ThumbsUp, label: "Thumbs Up" },
  { name: "Trash", icon: Trash, label: "Trash" },
  { name: "Twitter", icon: Twitter, label: "Twitter" },
  { name: "Umbrella", icon: Umbrella, label: "Umbrella" },
  { name: "Unlock", icon: Unlock, label: "Unlock" },
  { name: "Video", icon: Video, label: "Video" },
  { name: "Volume2", icon: Volume2, label: "Volume" },
  { name: "Wifi", icon: Wifi, label: "Wifi" },
  { name: "XCircle", icon: XCircle, label: "X Circle" },
  { name: "Youtube", icon: Youtube, label: "Youtube" },
  { name: "Anchor", icon: Anchor, label: "Anchor" },
  { name: "Aperture", icon: Aperture, label: "Aperture" },
  { name: "AtSign", icon: AtSign, label: "At Sign" },
  { name: "Battery", icon: Battery, label: "Battery" },
  { name: "Bluetooth", icon: Bluetooth, label: "Bluetooth" },
  { name: "Calculator", icon: Calculator, label: "Calculator" },
  { name: "Cast", icon: Cast, label: "Cast" },
  { name: "Chrome", icon: Chrome, label: "Chrome" },
  { name: "Cpu", icon: Cpu, label: "CPU" },
  { name: "Crosshair", icon: Crosshair, label: "Crosshair" },
  { name: "Disc", icon: Disc, label: "Disc" },
  { name: "Droplet", icon: Droplet, label: "Droplet" },
  { name: "Feather", icon: Feather, label: "Feather" },
  { name: "Film", icon: Film, label: "Film" },
  { name: "Flame", icon: Flame, label: "Flame" },
  { name: "Gamepad", icon: Gamepad, label: "Gamepad" },
  { name: "Gem", icon: Gem, label: "Gem" },
  { name: "Glasses", icon: Glasses, label: "Glasses" },
  { name: "Hammer", icon: Hammer, label: "Hammer" },
  { name: "HardDrive", icon: HardDrive, label: "Hard Drive" },
  { name: "Headset", icon: Headset, label: "Headset" },
  { name: "Hexagon", icon: Hexagon, label: "Hexagon" },
  { name: "Laptop", icon: Laptop, label: "Laptop" },
  { name: "LifeBuoy", icon: LifeBuoy, label: "Life Buoy" },
  { name: "Lightbulb", icon: Lightbulb, label: "Lightbulb" },
  { name: "Map", icon: Map, label: "Map" },
  { name: "Maximize", icon: Maximize, label: "Maximize" },
  { name: "Medal", icon: Medal, label: "Medal" },
  { name: "Megaphone", icon: Megaphone, label: "Megaphone" },
  { name: "Minimize", icon: Minimize, label: "Minimize" },
  { name: "Mountain", icon: Mountain, label: "Mountain" },
  { name: "Palette", icon: Palette, label: "Palette" },
  { name: "Pen", icon: Pen, label: "Pen" },
  { name: "Plane", icon: Plane, label: "Plane" },
  { name: "Pocket", icon: Pocket, label: "Pocket" },
  { name: "Radio", icon: Radio, label: "Radio" },
  { name: "Rocket", icon: Rocket, label: "Rocket" },
  { name: "Rss", icon: Rss, label: "RSS" },
  { name: "Scissors", icon: Scissors, label: "Scissors" },
  { name: "Shuffle", icon: Shuffle, label: "Shuffle" },
  { name: "Sidebar", icon: Sidebar, label: "Sidebar" },
  { name: "Sliders", icon: Sliders, label: "Sliders" },
  { name: "Speaker", icon: Speaker, label: "Speaker" },
  { name: "Square", icon: Square, label: "Square" },
  { name: "Sunrise", icon: Sunrise, label: "Sunrise" },
  { name: "Sunset", icon: Sunset, label: "Sunset" },
  { name: "Thermometer", icon: Thermometer, label: "Thermometer" },
  { name: "ToggleLeft", icon: ToggleLeft, label: "Toggle" },
  { name: "Tv", icon: Tv, label: "TV" },
  { name: "Type", icon: Type, label: "Type" },
  { name: "Underline", icon: Underline, label: "Underline" },
  { name: "Watch", icon: Watch, label: "Watch" },
  { name: "Wind", icon: Wind, label: "Wind" },
  { name: "Wrench", icon: Wrench, label: "Wrench" },
]

export function SmartListTemplateDialog({ open, onOpenChange, template, onSave }: SmartListTemplateDialogProps) {
  const [formData, setFormData] = useState<SmartListTemplate>({
    name: "",
    description: "",
    enabled: true,
    sqlQuery: "SELECT * FROM customers WHERE ...",
    minListSize: 10,
    maxListSize: 1000,
    updateFrequency: "weekly",
    iconName: "TrendingUp",
    category: undefined,
    expirationDate: "",
  })

  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [iconSearch, setIconSearch] = useState("")

  useEffect(() => {
    if (template) {
      setFormData(template)
      if (template.logoUrl) {
        setLogoPreview(template.logoUrl)
      }
    } else {
      setFormData({
        name: "",
        description: "",
        enabled: true,
        sqlQuery: "SELECT * FROM customers WHERE ...",
        minListSize: 10,
        maxListSize: 1000,
        updateFrequency: "weekly",
        iconName: "TrendingUp",
        category: undefined,
        expirationDate: "",
      })
      setLogoPreview(null)
    }
  }, [template, open])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setLogoPreview(result)
        setFormData({ ...formData, logoUrl: result, iconName: undefined })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setFormData({ ...formData, logoUrl: undefined, iconName: "TrendingUp" })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.category === "Market Radar" && !formData.expirationDate) {
      alert("Expiration date is required for Market Radar templates")
      return
    }

    const selectedIcon = iconOptions.find((opt) => opt.name === formData.iconName)
    const IconComponent = selectedIcon?.icon
    onSave({
      ...formData,
      icon: IconComponent ? <IconComponent className="h-5 w-5" /> : undefined,
    })
  }

  const currentIcon = iconOptions.find((opt) => opt.name === formData.iconName)
  const CurrentIconComponent = currentIcon?.icon

  const filteredIcons = iconOptions.filter((option) => option.label.toLowerCase().includes(iconSearch.toLowerCase()))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Smart List Template</DialogTitle>
          <DialogDescription>
            View and edit template settings. The SQL query is read-only and cannot be modified.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-1">Template Status</h3>
              </div>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Template Icon</Label>

            <div className="flex items-center gap-3">
              {/* Preview */}
              <div className="w-12 h-12 rounded-lg border border-border flex items-center justify-center overflow-hidden bg-white flex-shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview || "/placeholder.svg"}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                ) : CurrentIconComponent ? (
                  <CurrentIconComponent className="h-6 w-6 text-blue-600" />
                ) : null}
              </div>

              {/* Icon Picker or Logo Upload */}
              {logoPreview ? (
                <Button type="button" variant="outline" size="sm" onClick={handleRemoveLogo}>
                  <X className="h-4 w-4 mr-1" />
                  Remove image
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Grid-based Icon Picker */}
                  <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="justify-start bg-transparent">
                        <Search className="h-4 w-4 mr-2" />
                        {currentIcon ? currentIcon.label : "Select Icon"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[420px] p-0" align="start">
                      <div className="p-3 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search"
                            value={iconSearch}
                            onChange={(e) => setIconSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <div className="p-3 max-h-[320px] overflow-y-auto">
                        <div className="grid grid-cols-8 gap-2">
                          {filteredIcons.map((option) => {
                            const IconComponent = option.icon
                            const isSelected = formData.iconName === option.name
                            return (
                              <button
                                key={option.name}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, iconName: option.name })
                                  setIconPickerOpen(false)
                                  setIconSearch("")
                                }}
                                className={`
                                  w-10 h-10 rounded-md flex items-center justify-center
                                  hover:bg-accent transition-colors
                                  ${isSelected ? "bg-accent ring-2 ring-primary" : ""}
                                `}
                                title={option.label}
                              >
                                <IconComponent className="h-5 w-5 text-muted-foreground" />
                              </button>
                            )
                          })}
                        </div>
                        {filteredIcons.length === 0 && (
                          <div className="text-center py-8 text-sm text-muted-foreground">No icons found</div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("logo-upload")?.click()}
                  >
                    Upload Image
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </Label>

            <Select
              value={formData.category || "none"}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  category: value === "none" ? undefined : (value as "Offered" | "Market Radar"),
                  expirationDate: value !== "Market Radar" ? "" : formData.expirationDate,
                })
              }
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Category</SelectItem>
                <SelectItem value="Market Radar">Market Radar</SelectItem>
                <SelectItem value="Offered">Offered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.category === "Market Radar" && (
            <div className="space-y-2">
              <Label htmlFor="expirationDate" className="text-sm font-medium">
                Expiration Date <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">Set when this market radar data expires</p>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                required
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              {/* Smart List Name */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="name" className="text-sm font-medium">
                  Template Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter template name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this template does"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">SQL Query</Label>
            <div className="bg-muted/50 rounded-lg p-4 border-2 border-border shadow-sm">
              <pre className="font-mono text-sm text-foreground whitespace-pre-wrap break-words">
                {formData.sqlQuery}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground italic">
              This query is read-only. Contact your administrator to update the query logic.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
