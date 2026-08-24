"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { isCountableUnit } from "@/lib/inventory-units"

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
}

interface InventoryItemFormProps {
  item: InventoryItem | null
  onClose: () => void
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

const UNITS = [
  "kg",
  "grams",
  "liters",
  "ml",
  "pieces",
  "bottles",
  "boxes",
  "packets",
  "cans",
  "bags",
  "dozen"
]

export default function InventoryItemForm({ item, onClose }: InventoryItemFormProps) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    category: item?.category || "",
    unit: item?.unit || "",
    storeStock: item?.storeStock ?? item?.currentStock ?? 0,
    barStock: item?.barStock ?? 0,
    currentStock: item?.currentStock || 0,
    goodStockLevel: item?.goodStockLevel || 50,
    lowStockLevel: item?.lowStockLevel || 20,
    criticalStockLevel: item?.criticalStockLevel || 5,
    unitPrice: item?.unitPrice || 0,
    storageLocation: item?.storageLocation || "",
    trackExpiry: item?.trackExpiry || false,
    expiryDate: item?.expiryDate ? item.expiryDate.split('T')[0] : "",
    expiryAlertDays: item?.expiryAlertDays || 7,
    menuItemId: item?.menuItemId ? String(item.menuItemId) : "none"
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [menuItems, setMenuItems] = useState<{ id: number; name: string; category: string }[]>([])

  useEffect(() => {
    fetch("/api/restaurant/menu")
      .then((res) => res.json())
      .then((data) => setMenuItems(Array.isArray(data) ? data : []))
      .catch(() => setMenuItems([]))
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Item name is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (!formData.unit) newErrors.unit = "Unit is required"
    if (formData.currentStock < 0) newErrors.currentStock = "Stock cannot be negative"
    if (formData.goodStockLevel <= formData.lowStockLevel) {
      newErrors.goodStockLevel = "Good stock level must be higher than low stock level"
    }
    if (formData.lowStockLevel <= formData.criticalStockLevel) {
      newErrors.lowStockLevel = "Low stock level must be higher than critical level"
    }
    if (formData.criticalStockLevel < 0) {
      newErrors.criticalStockLevel = "Critical level cannot be negative"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const url = item ? `/api/inventory/${item.id}` : "/api/inventory"
      const method = item ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          menuItemId: formData.menuItemId === "none" ? null : formData.menuItemId,
          expiryDate: formData.trackExpiry && formData.expiryDate 
            ? new Date(formData.expiryDate).toISOString() 
            : null
        })
      })

      if (response.ok) {
        onClose()
      } else {
        const data = await response.json()
        alert(`Error: ${data.error || "Failed to save item"}`)
      }
    } catch (error) {
      console.error("Failed to save item:", error)
      alert("Failed to save item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {item ? "Edit Inventory Item" : "Add New Inventory Item"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
            
            <div>
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Rice, Cooking Oil, Sugar"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
              </div>

              <div>
                <Label htmlFor="unit">Unit of Measurement *</Label>
                <Select value={formData.unit} onValueChange={(val) => setFormData({ ...formData, unit: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit && <p className="text-red-600 text-sm mt-1">{errors.unit}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="storageLocation">Storage Location (Optional)</Label>
              <Input
                id="storageLocation"
                value={formData.storageLocation}
                onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                placeholder="e.g., Main Pantry, Cold Storage, Bar"
              />
            </div>

            <div>
              <Label>Link to RMS menu item (for countable stock)</Label>
              <Select value={formData.menuItemId} onValueChange={(val) => setFormData({ ...formData, menuItemId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Not linked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked</SelectItem>
                  {menuItems.map((menuItem) => (
                    <SelectItem key={menuItem.id} value={String(menuItem.id)}>
                      {menuItem.name} ({menuItem.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600 mt-1">
                {isCountableUnit(formData.unit)
                  ? "When this menu item is sold, 1 unit is deducted from bar stock (bottles, pieces, cans, etc)."
                  : "Choose a countable unit such as bottles or pieces to auto-deduct RMS sales."}
              </p>
            </div>
          </div>

          {/* Stock Levels */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Stock Levels</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeStock">Store / warehouse stock</Label>
                <Input
                  id="storeStock"
                  type="number"
                  step="0.01"
                  value={formData.storeStock}
                  onChange={(e) => setFormData({ ...formData, storeStock: parseFloat(e.target.value) || 0, currentStock: (parseFloat(e.target.value) || 0) + formData.barStock })}
                />
              </div>
              <div>
                <Label htmlFor="barStock">Bar stock</Label>
                <Input
                  id="barStock"
                  type="number"
                  step="0.01"
                  value={formData.barStock}
                  onChange={(e) => setFormData({ ...formData, barStock: parseFloat(e.target.value) || 0, currentStock: formData.storeStock + (parseFloat(e.target.value) || 0) })}
                />
              </div>

              <div>
                <Label htmlFor="unitPrice">Unit Price (NPR)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <p className="text-sm font-medium text-gray-700">Stock Alert Thresholds</p>
              
              <div>
                <Label htmlFor="goodStockLevel" className="flex items-center gap-2">
                  🟢 Good Stock Level (Green Zone)
                </Label>
                <Input
                  id="goodStockLevel"
                  type="number"
                  step="0.01"
                  value={formData.goodStockLevel}
                  onChange={(e) => setFormData({ ...formData, goodStockLevel: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-600 mt-1">Stock above this level = Everything is good</p>
                {errors.goodStockLevel && <p className="text-red-600 text-sm mt-1">{errors.goodStockLevel}</p>}
              </div>

              <div>
                <Label htmlFor="lowStockLevel" className="flex items-center gap-2">
                  🟠 Low Stock Level (Orange Zone)
                </Label>
                <Input
                  id="lowStockLevel"
                  type="number"
                  step="0.01"
                  value={formData.lowStockLevel}
                  onChange={(e) => setFormData({ ...formData, lowStockLevel: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-600 mt-1">Stock at or below this = Warning notification</p>
                {errors.lowStockLevel && <p className="text-red-600 text-sm mt-1">{errors.lowStockLevel}</p>}
              </div>

              <div>
                <Label htmlFor="criticalStockLevel" className="flex items-center gap-2">
                  🔴 Critical Stock Level (Red Zone)
                </Label>
                <Input
                  id="criticalStockLevel"
                  type="number"
                  step="0.01"
                  value={formData.criticalStockLevel}
                  onChange={(e) => setFormData({ ...formData, criticalStockLevel: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-600 mt-1">Stock at or below this = Critical alert</p>
                {errors.criticalStockLevel && <p className="text-red-600 text-sm mt-1">{errors.criticalStockLevel}</p>}
              </div>
            </div>
          </div>

          {/* Expiry Tracking */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Expiry Tracking (Optional)</h3>
            
            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
              <div>
                <Label htmlFor="trackExpiry" className="text-base">Track expiry date for this item?</Label>
                <p className="text-sm text-gray-600">Enable for perishable items</p>
              </div>
              <Switch
                id="trackExpiry"
                checked={formData.trackExpiry}
                onCheckedChange={(checked) => setFormData({ ...formData, trackExpiry: checked })}
              />
            </div>

            {formData.trackExpiry && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="expiryAlertDays">Alert Days Before Expiry</Label>
                  <Input
                    id="expiryAlertDays"
                    type="number"
                    value={formData.expiryAlertDays}
                    onChange={(e) => setFormData({ ...formData, expiryAlertDays: parseInt(e.target.value) || 7 })}
                  />
                  <p className="text-xs text-gray-600 mt-1">Get notified X days before expiry</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading ? "Saving..." : item ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
