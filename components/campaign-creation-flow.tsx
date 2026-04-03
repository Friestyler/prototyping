"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Target,
  Mail,
  Zap,
  CheckCircle,
  User,
  AlertTriangle,
} from "lucide-react"
import { initialPartners, type Partner } from "@/lib/okr-data" // Fixed import path from @/data/partners to @/lib/okr-data

interface SavedList {
  id: string
  name: string
  type: "static" | "dynamic"
  customerCount: number
  advancedFilters: any
  createdAt: string
  customers?: Partner[] // Add actual customer records
}

interface Customer {
  id: string
  name: string
  hasContacts: boolean
  type: "Customer"
  email?: string
  company?: string
  contacts: any[] // Added contact details for display
}

interface CampaignCreationFlowProps {
  preSelectedList?: SavedList
  onBack: () => void
}

export default function CampaignCreationFlow({ preSelectedList, onBack }: CampaignCreationFlowProps) {
  const [currentStep, setCurrentStep] = useState(3) // Start at "Select Recipients" step
  const [selectedLists, setSelectedLists] = useState<SavedList[]>(preSelectedList ? [preSelectedList] : [])
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set())
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())

  const steps = [
    {
      number: 1,
      title: "Campaign Details",
      subtitle: "Configure campaign name and details",
      completed: true,
    },
    {
      number: 2,
      title: "Choose Target Group",
      subtitle: "Select Customers", // Changed from "Select Opportunities" to "Select Customers"
      completed: true,
    },
    {
      number: 3,
      title: "Select Recipients",
      subtitle: "Select campaign recipients",
      completed: false,
      active: true,
    },
    {
      number: 4,
      title: "Flow Builder",
      subtitle: "Subject: subject 2",
      completed: false,
    },
    {
      number: 5,
      title: "Settings",
      subtitle: "Configure campaign settings",
      completed: false,
    },
    {
      number: 6,
      title: "Drafts & Send",
      subtitle: "Save and manage drafts",
      completed: false,
    },
  ]

  // Mock data for dynamic lists
  const dynamicLists = [
    {
      id: "all-customers", // Changed from "all-opportunities" to "all-customers"
      name: "All Customers", // Changed from "All Opportunities" to "All Customers"
      type: "dynamic" as const,
      customerCount: 8440,
      advancedFilters: null,
      createdAt: new Date().toISOString(),
    },
    ...(preSelectedList
      ? [
          {
            ...preSelectedList,
            // Ensure the name is properly set - fallback to a descriptive name if missing
            name: preSelectedList.name || `Smart List ${preSelectedList.id}`,
          },
        ]
      : []),
  ]

  const totalCustomers = selectedLists.reduce((sum, list) => sum + list.customerCount, 0)
  const totalRecipients = totalCustomers
  const missingContacts = totalRecipients // Assuming all are missing email for demo

  const handleListToggle = (list: SavedList) => {
    setSelectedLists((prev) => {
      const isSelected = prev.some((l) => l.id === list.id)
      if (isSelected) {
        return prev.filter((l) => l.id !== list.id)
      } else {
        return [...prev, list]
      }
    })
  }

  const toggleListExpansion = (listId: string) => {
    setExpandedLists((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(listId)) {
        newSet.delete(listId)
      } else {
        newSet.add(listId)
      }
      return newSet
    })
  }

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(contactId)) {
        newSet.delete(contactId)
      } else {
        newSet.add(contactId)
      }
      return newSet
    })
  }

  const convertPartnersToCustomers = (partners: Partner[]): Customer[] => {
    return partners.map((partner) => ({
      id: partner.id.toString(),
      name: partner.name,
      hasContacts: partner.team && partner.team.length > 0, // Check if partner has team members (contacts)
      type: "Customer" as const,
      company: partner.name,
      contacts: partner.team || [],
    }))
  }

  const getCustomersForList = (listId: string): Customer[] => {
    if (listId === "all-customers") {
      // For "All Customers", return a subset of all available customers
      return convertPartnersToCustomers(initialPartners.slice(0, 10)) // Show first 10 for demo
    }

    // For the preselected list, use the actual filtered customers
    if (preSelectedList && preSelectedList.id === listId && preSelectedList.customers) {
      return convertPartnersToCustomers(preSelectedList.customers)
    }

    return []
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                      step.completed
                        ? "bg-blue-600 border-blue-600 text-white"
                        : step.active
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-gray-300 text-gray-500"
                    }`}
                  >
                    {step.completed ? <CheckCircle className="h-5 w-5" /> : step.number}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${step.active ? "text-blue-600" : "text-gray-900"}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{step.subtitle}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      steps[index + 1].completed || steps[index + 1].active ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack} className="flex items-center bg-transparent">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button className="flex items-center bg-blue-600 hover:bg-blue-700">
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Selected Targets */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <Target className="h-5 w-5 mr-2" />
                Selected Targets
              </CardTitle>
              <p className="text-sm text-green-600">Overview of your selections</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Customers</span>
                <Badge variant="secondary" className="bg-white text-gray-900">
                  {totalCustomers}
                </Badge>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total Recipients</span>
                  <Badge className="bg-gray-900 text-white">{totalRecipients}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Status */}
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <Mail className="h-5 w-5 mr-2" />
                Contact Status
              </CardTitle>
              <p className="text-sm text-orange-600">Some contacts missing</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">With Email</span>
                <Badge variant="secondary" className="bg-white text-gray-900">
                  0
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Missing Contacts</span>
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  {missingContacts}
                </Badge>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total Recipients</span>
                  <Badge className="bg-gray-900 text-white">{totalRecipients}</Badge>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full text-orange-600 border-orange-300 hover:bg-orange-100 bg-transparent"
                >
                  Go to Drafts & Send to add or upload contacts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lists Selection */}
        <div className="mt-8">
          <div className="bg-white rounded-lg border">
            {/* Tabs */}
            <div className="border-b">
              <div className="flex space-x-8 px-6">
                <button className="py-4 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700">
                  Static lists
                </button>
                <button className="py-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                  Dynamic lists
                </button>
                <button className="py-4 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700">
                  Selected ({selectedLists.length})
                </button>
              </div>
            </div>

            {/* Dynamic Lists Content */}
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <Zap className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Dynamic Lists</h3>
                </div>
                <p className="text-sm text-gray-600">
                  When you select a dynamic list, every record that enters that list will be automatically included in
                  the campaign. You can still approve or reject them before an email is sent.
                </p>
              </div>

              <div className="space-y-3">
                {dynamicLists.map((list) => (
                  <div key={list.id} className="border rounded-lg">
                    <div
                      className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                        selectedLists.some((l) => l.id === list.id)
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                      onClick={() => toggleListExpansion(list.id)} // Made entire row clickable for expansion
                    >
                      <div
                        className="flex items-center flex-1"
                        onClick={(e) => {
                          e.stopPropagation() // Prevent expansion when clicking checkbox area
                          handleListToggle(list)
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedLists.some((l) => l.id === list.id)}
                          onChange={() => handleListToggle(list)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{list.name}</div>
                          <div className="text-sm text-blue-600">{list.customerCount.toLocaleString()} customers</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {" "}
                        {/* Added wrapper for better icon alignment */}
                        {expandedLists.has(list.id) ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {expandedLists.has(list.id) && (
                      <div className="border-t bg-white">
                        {getCustomersForList(list.id).map((customer) => (
                          <div key={customer.id} className="px-8 py-3 border-b last:border-b-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={true}
                                  onChange={() => {}} // Added empty onChange handler to prevent React warning
                                  className="h-4 w-4 text-blue-600 rounded border-gray-300 mr-3"
                                />
                                <div className="flex items-center">
                                  <User className="h-4 w-4 text-green-600 mr-2" />
                                  <span className="font-medium text-gray-900">{customer.name}</span>
                                  <Badge variant="outline" className="ml-2 text-green-700 border-green-300">
                                    {customer.type}
                                  </Badge>
                                  {!customer.hasContacts && <AlertTriangle className="h-4 w-4 text-orange-500 ml-2" />}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 ml-7">
                              {customer.hasContacts && customer.contacts && customer.contacts.length > 0 ? (
                                // Show each contact as a separate selectable row
                                customer.contacts.map((contact: any, index: number) => {
                                  const contactId = `${customer.id}-${index}`
                                  return (
                                    <div key={contactId} className="flex items-center py-2">
                                      <input
                                        type="checkbox"
                                        checked={selectedContacts.has(contactId)}
                                        onChange={() => handleContactToggle(contactId)}
                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 mr-3"
                                      />
                                      <Mail className="h-4 w-4 text-blue-500 mr-2" />
                                      <span className="text-gray-900 font-medium">{contact.name}</span>
                                      <span className="text-gray-500 ml-2">({contact.role})</span>
                                      {contact.email && (
                                        <span className="text-blue-600 ml-2 text-sm">{contact.email}</span>
                                      )}
                                    </div>
                                  )
                                })
                              ) : (
                                // Show "no contact records found" message when customer has no contacts
                                <div className="flex items-center text-sm py-2">
                                  <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                                  <span className="text-orange-700">No contact records found</span>
                                  <Badge variant="outline" className="ml-2 text-orange-700 border-orange-300">
                                    Missing contacts
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
