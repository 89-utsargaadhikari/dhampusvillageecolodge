"use client"

import { useState, useEffect } from "react"
import { Plus, Package, AlertTriangle, AlertCircle, Calendar, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import InventoryItemForm from "./inventory-item-form"
import InventoryUpdateModal from "./inventory-update-modal"

interface InventoryItem {
  id: number
  name: string
  category: string
  unit: string
  currentStock: number
  storeStock?: number
  barStock?: number
  goodStockLevel: number
  lowStockLevel: number
  criticalStockLevel: number
  unitPrice: number
  storageLocation?: string
  trackExpiry: boolean
  expiryDate?: string
  expiryAlertDays?: number
  menuItemId?: number | null
  menuItem?: { id: number; name: string } | null
  createdAt: string
  updatedAt: string
}

const CATEGORIES = [
  "Fresh Produce",
  "Dry Goods",
  "Beverages",
  "Dairy",
  "Meat/Protein",
  "Condiments & Spices",
  "Cleaning Supplies",
  "Paper Products",
  "Other"
]

export default function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [updatingItem, setUpdatingItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [transferQty, setTransferQty] = useState<Record<number, string>>({})

  useEffect(() => {
    fetchItems()
  }, [])

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredItems(items)
    } else {
      setFilteredItems(items.filter(item => item.category === selectedCategory))
    }
  }, [selectedCategory, items])

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/inventory")
      const data = await response.json()
      const itemsArray = Array.isArray(data) ? data : []
      setItems(itemsArray)
      setFilteredItems(itemsArray)
    } catch (error) {
      console.error("Failed to fetch inventory items:", error)
      setItems([])
      setFilteredItems([])
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock <= item.criticalStockLevel) {
      return { status: "critical", color: "bg-red-500", icon: "🔴", label: "Critical" }
    } else if (item.currentStock <= item.lowStockLevel) {
      return { status: "low", color: "bg-orange-500", icon: "🟠", label: "Low Stock" }
    } else {
      return { status: "good", color: "bg-green-500", icon: "🟢", label: "Good" }
    }
  }

  const getExpiryStatus = (item: InventoryItem) => {
    if (!item.trackExpiry || !item.expiryDate) return null

    const today = new Date()
    const expiry = new Date(item.expiryDate)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return { status: "expired", label: "Expired", color: "text-red-600" }
    } else if (daysUntilExpiry <= (item.expiryAlertDays || 7)) {
      return { status: "expiring", label: `Expires in ${daysUntilExpiry} days`, color: "text-orange-600" }
    }
    return null
  }

  const stats = {
    total: items.length,
    critical: items.filter(item => item.currentStock <= item.criticalStockLevel).length,
    low: items.filter(item => item.currentStock > item.criticalStockLevel && item.currentStock <= item.lowStockLevel).length,
    expiringSoon: items.filter(item => {
      if (!item.trackExpiry || !item.expiryDate) return false
      const daysUntilExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry >= 0 && daysUntilExpiry <= (item.expiryAlertDays || 7)
    }).length
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleUpdate = (item: InventoryItem) => {
    setUpdatingItem(item)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingItem(null)
    fetchItems()
  }

  const handleUpdateClose = () => {
    setUpdatingItem(null)
    fetchItems()
  }

  const handleTransfer = async (item: InventoryItem) => {
    const quantity = parseFloat(transferQty[item.id] || "0")
    if (!quantity || quantity <= 0) {
      alert("Enter how many units to move from store to bar")
      return
    }
    try {
      const response = await fetch("/api/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, quantity })
      })
      const data = await response.json()
      if (!response.ok) {
        alert(data.error || "Transfer failed")
        return
      }
      setTransferQty({ ...transferQty, [item.id]: "" })
      fetchItems()
    } catch (error) {
      console.error("Failed to transfer stock:", error)
      alert("Failed to transfer stock")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: "DELETE"
      })
      if (response.ok) {
        fetchItems()
      }
    } catch (error) {
      console.error("Failed to delete item:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto mb-4 animate-pulse text-green-600" />
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Inventory Management</h2>
          <p className="text-gray-600 mt-1">Track store and bar stock separately</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null)
            setShowForm(true)
          }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Package className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Critical Stock</p>
                <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Low Stock</p>
                <p className="text-3xl font-bold text-orange-600">{stats.low}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-500 opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Expiring Soon</p>
                <p className="text-3xl font-bold text-purple-600">{stats.expiringSoon}</p>
              </div>
              <Calendar className="w-10 h-10 text-purple-500 opacity-30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-medium">Filter by Category:</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">
              Showing {filteredItems.length} of {items.length} items
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 text-lg mb-2">No inventory items yet</p>
            <p className="text-gray-500 text-sm mb-4">
              {selectedCategory === "all" 
                ? "Start by adding your first inventory item"
                : "No items in this category"}
            </p>
            {selectedCategory === "all" && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => {
            const stockStatus = getStockStatus(item)
            const expiryStatus = getExpiryStatus(item)
            const stockPercentage = Math.min(100, (item.currentStock / item.goodStockLevel) * 100)

            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{stockStatus.icon}</span>
                        <div>
                          <h3 className="text-lg font-semibold">{item.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Badge variant="outline">{item.category}</Badge>
                            {item.menuItem && (
                              <Badge className="bg-emerald-600 text-white">RMS: {item.menuItem.name}</Badge>
                            )}
                            {item.storageLocation && (
                              <span className="text-xs">📍 {item.storageLocation}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Store / Bar / Total</p>
                          <p className="text-lg sm:text-2xl font-bold">
                            {item.storeStock ?? 0} / {item.barStock ?? 0} / {item.currentStock} <span className="text-sm font-normal text-gray-600">{item.unit}</span>
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className={`h-2 rounded-full ${stockStatus.color}`}
                              style={{ width: `${stockPercentage}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Stock Levels</p>
                          <div className="space-y-1 text-sm">
                            <p>🟢 Good: ≥ {item.goodStockLevel} {item.unit}</p>
                            <p>🟠 Low: ≤ {item.lowStockLevel} {item.unit}</p>
                            <p>🔴 Critical: ≤ {item.criticalStockLevel} {item.unit}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Status & Info</p>
                          <div className="space-y-1">
                            <Badge className={stockStatus.color + " text-white"}>
                              {stockStatus.label}
                            </Badge>
                            {expiryStatus && (
                              <p className={`text-sm font-medium ${expiryStatus.color}`}>
                                ⏰ {expiryStatus.label}
                              </p>
                            )}
                            {item.unitPrice > 0 && (
                              <p className="text-sm text-gray-600">
                                Value: NPR {(item.currentStock * item.unitPrice).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:ml-4 w-full lg:w-auto">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Qty"
                          value={transferQty[item.id] || ""}
                          onChange={(e) => setTransferQty({ ...transferQty, [item.id]: e.target.value })}
                          className="w-24 rounded-md border px-2 text-sm"
                        />
                        <Button variant="outline" onClick={() => handleTransfer(item)}>
                          Store → Bar
                        </Button>
                      </div>
                      <Button
                        onClick={() => handleUpdate(item)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Update Stock
                      </Button>
                      <Button
                        onClick={() => handleEdit(item)}
                        variant="outline"
                      >
                        Edit Details
                      </Button>
                      <Button
                        onClick={() => handleDelete(item.id)}
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <InventoryItemForm
          item={editingItem}
          onClose={handleFormClose}
        />
      )}

      {/* Update Modal */}
      {updatingItem && (
        <InventoryUpdateModal
          item={updatingItem}
          onClose={handleUpdateClose}
        />
      )}
    </div>
  )
}
