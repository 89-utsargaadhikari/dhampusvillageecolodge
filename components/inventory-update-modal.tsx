"use client"

import { useState } from "react"
import { X, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

interface InventoryItem {
  id: number
  name: string
  unit: string
  currentStock: number
  goodStockLevel: number
  lowStockLevel: number
  criticalStockLevel: number
}

interface InventoryUpdateModalProps {
  item: InventoryItem
  onClose: () => void
}

export default function InventoryUpdateModal({ item, onClose }: InventoryUpdateModalProps) {
  const [customAmount, setCustomAmount] = useState<string>("")
  const [transactionType, setTransactionType] = useState<string>("purchase")
  const [notes, setNotes] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleQuickUpdate = async (amount: number) => {
    await updateStock(amount)
  }

  const handleCustomUpdate = async () => {
    const amount = parseFloat(customAmount)
    if (isNaN(amount) || amount === 0) {
      alert("Please enter a valid amount")
      return
    }
    await updateStock(amount)
  }

  const updateStock = async (changeAmount: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/inventory/${item.id}/update-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeAmount,
          transactionType,
          notes: notes.trim() || undefined
        })
      })

      if (response.ok) {
        onClose()
      } else {
        const data = await response.json()
        alert(`Error: ${data.error || "Failed to update stock"}`)
      }
    } catch (error) {
      console.error("Failed to update stock:", error)
      alert("Failed to update stock")
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = () => {
    if (item.currentStock <= item.criticalStockLevel) {
      return { color: "text-red-600", icon: "🔴", label: "Critical" }
    } else if (item.currentStock <= item.lowStockLevel) {
      return { color: "text-orange-600", icon: "🟠", label: "Low Stock" }
    } else {
      return { color: "text-green-600", icon: "🟢", label: "Good" }
    }
  }

  const status = getStockStatus()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold">Update Stock</h2>
            <p className="text-blue-100 text-sm">{item.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Stock Display */}
          <div className="bg-gray-50 p-4 rounded-lg border-2">
            <p className="text-sm text-gray-600 mb-1">Current Stock</p>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-bold">
                {item.currentStock} <span className="text-lg font-normal text-gray-600">{item.unit}</span>
              </p>
              <div className="text-right">
                <p className={`text-lg font-semibold ${status.color}`}>
                  {status.icon} {status.label}
                </p>
                <p className="text-xs text-gray-600">
                  Good: ≥{item.goodStockLevel} | Low: ≤{item.lowStockLevel} | Critical: ≤{item.criticalStockLevel}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Buttons */}
          <div>
            <Label className="mb-3 block">Quick Actions</Label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickUpdate(-10)}
                disabled={loading || item.currentStock < 10}
                className="flex items-center justify-center gap-1"
              >
                <Minus className="w-4 h-4" />
                10
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickUpdate(-5)}
                disabled={loading || item.currentStock < 5}
                className="flex items-center justify-center gap-1"
              >
                <Minus className="w-4 h-4" />
                5
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickUpdate(-1)}
                disabled={loading || item.currentStock < 1}
                className="flex items-center justify-center gap-1"
              >
                <Minus className="w-4 h-4" />
                1
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickUpdate(1)}
                disabled={loading}
                className="flex items-center justify-center gap-1 border-green-300 hover:bg-green-50"
              >
                <Plus className="w-4 h-4" />
                1
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickUpdate(5)}
                disabled={loading}
                className="flex items-center justify-center gap-1 border-green-300 hover:bg-green-50"
              >
                <Plus className="w-4 h-4" />
                5
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickUpdate(10)}
                disabled={loading}
                className="flex items-center justify-center gap-1 border-green-300 hover:bg-green-50"
              >
                <Plus className="w-4 h-4" />
                10
              </Button>
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <Label htmlFor="customAmount">Or Enter Custom Amount</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="customAmount"
                type="number"
                step="0.01"
                placeholder={`Enter amount in ${item.unit}`}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleCustomUpdate()
                  }
                }}
              />
              <Button
                onClick={handleCustomUpdate}
                disabled={loading || !customAmount}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Update
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Use positive numbers to add stock, negative to reduce (e.g., -5.5)
            </p>
          </div>

          {/* Transaction Type */}
          <div>
            <Label className="mb-3 block">Reason for Update</Label>
            <RadioGroup value={transactionType} onValueChange={setTransactionType}>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="purchase" id="purchase" />
                  <Label htmlFor="purchase" className="cursor-pointer flex-1">
                    📦 Purchase (Stock In)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="usage" id="usage" />
                  <Label htmlFor="usage" className="cursor-pointer flex-1">
                    🍳 Usage (Stock Out)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="waste" id="waste" />
                  <Label htmlFor="waste" className="cursor-pointer flex-1">
                    🗑️ Waste/Spoilage
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="adjustment" id="adjustment" />
                  <Label htmlFor="adjustment" className="cursor-pointer flex-1">
                    ⚙️ Adjustment
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Close Button */}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
