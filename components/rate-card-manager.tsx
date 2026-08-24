"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Save, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CURRENCIES, MEAL_PLANS, currencySymbol } from "@/lib/hotel"

interface RateCard {
  id: number
  roomType: string
  mealPlan: string
  currency?: string
  sglRate: number | null
  dblRate: number | null
  trplRate: number | null
}

interface Props {
  businessId: number
  businessName: string
  roomTypes: string[] // Pass available room types
}

export default function RateCardManager({ businessId, businessName, roomTypes }: Props) {
  const [rates, setRates] = useState<RateCard[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    roomType: "",
    mealPlan: "EP",
    currency: "NPR",
    sglRate: "",
    dblRate: "",
    trplRate: ""
  })

  useEffect(() => {
    loadRates()
  }, [businessId])

  const loadRates = async () => {
    try {
      const response = await fetch(`/api/business/${businessId}/rates`)
      const data = await response.json()
      setRates(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load rates:', error)
      setRates([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/business/${businessId}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadRates()
        setIsDialogOpen(false)
        setFormData({
          roomType: "",
          mealPlan: "EP",
          currency: "NPR",
          sglRate: "",
          dblRate: "",
          trplRate: ""
        })
        alert('✅ Rate card saved successfully!')
      } else {
        alert('Failed to save rate card')
      }
    } catch (error) {
      console.error('Failed to save rate card:', error)
      alert('Failed to save rate card')
    }
  }

  const handleDelete = async (rateId: number) => {
    if (confirm('Delete this rate card?')) {
      try {
        const response = await fetch(`/api/business/${businessId}/rates?rateId=${rateId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          await loadRates()
          alert('✅ Rate card deleted!')
        } else {
          alert('Failed to delete rate card')
        }
      } catch (error) {
        console.error('Failed to delete rate card:', error)
        alert('Failed to delete rate card')
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold">Rate Cards for {businessName}</h3>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-green-600 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Rate
        </Button>
      </div>

      {rates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8 text-gray-500">
            <div className="text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No rate cards yet. Add rates to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.isArray(rates) && rates.map((rate) => (
            <Card key={rate.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex justify-between items-start">
                  <div>
                    <div className="font-bold text-lg">{rate.roomType}</div>
                    <div className="text-sm text-blue-600 font-semibold">
                      {MEAL_PLANS.find(p => p.value === rate.mealPlan)?.label} • {rate.currency || "NPR"}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          roomType: rate.roomType,
                          mealPlan: rate.mealPlan,
                          currency: rate.currency || "NPR",
                          sglRate: rate.sglRate?.toString() || "",
                          dblRate: rate.dblRate?.toString() || "",
                          trplRate: rate.trplRate?.toString() || ""
                        })
                        setIsDialogOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rate.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rate.sglRate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Single:</span>
                    <span className="font-semibold">{currencySymbol(rate.currency)} {rate.sglRate.toLocaleString()}</span>
                  </div>
                )}
                {rate.dblRate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Double:</span>
                    <span className="font-semibold">{currencySymbol(rate.currency)} {rate.dblRate.toLocaleString()}</span>
                  </div>
                )}
                {rate.trplRate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Triple:</span>
                    <span className="font-semibold">{currencySymbol(rate.currency)} {rate.trplRate.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Rate Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Rate Card</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Room Type *</Label>
                <select
                  value={formData.roomType}
                  onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select room type</option>
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Meal Plan *</Label>
                <select
                  value={formData.mealPlan}
                  onChange={(e) => setFormData({ ...formData, mealPlan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  {MEAL_PLANS.map((plan) => (
                    <option key={plan.value} value={plan.value}>{plan.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Currency *</Label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {CURRENCIES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Single Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.sglRate}
                  onChange={(e) => setFormData({ ...formData, sglRate: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Double Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.dblRate}
                  onChange={(e) => setFormData({ ...formData, dblRate: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Triple Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.trplRate}
                  onChange={(e) => setFormData({ ...formData, trplRate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600">
                <Save className="w-4 h-4 mr-2" />
                Save Rate
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

