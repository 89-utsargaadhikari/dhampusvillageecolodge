"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Save, DollarSign, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CURRENCIES, MEAL_PLANS, catalogRoomTypeNames, currencySymbol, mealPlanLabel } from "@/lib/hotel"
import {
  type RateCardRow,
  formatRateValue,
  groupRateCards,
  normalizeCurrency,
  normalizeMealPlan,
  partnerCurrencies,
} from "@/lib/rate-cards"
import { AdminSearch, matchesSearch } from "@/components/admin-search"
import { deleteBusinessRate, fetchBusinessRates, saveBusinessRates } from "@/lib/api"
import { AdminLoading, useAdminLoader } from "@/components/admin-loading"
import { Spinner } from "@/components/ui/spinner"

interface Props {
  businessId: number
  businessName: string
  roomTypes: string[]
}

type CurrencyRates = {
  currency: string
  sglRate: string
  dblRate: string
  trplRate: string
}

const emptyCurrencyRates = (currency: string): CurrencyRates => ({
  currency,
  sglRate: "",
  dblRate: "",
  trplRate: "",
})

export default function RateCardManager({ businessId, businessName }: Props) {
  const [rates, setRates] = useState<RateCardRow[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPrintOpen, setIsPrintOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    roomType: "",
    mealPlan: "MAP",
    currencies: ["NPR"] as string[],
    rates: [emptyCurrencyRates("NPR")],
  })
  const [saving, setSaving] = useState(false)
  const { loading, run } = useAdminLoader()

  useEffect(() => {
    loadRates()
  }, [businessId])

  const loadRates = async () => {
    try {
      await run(async () => {
        setRates(await fetchBusinessRates(businessId))
      })
    } catch (error) {
      console.error("Failed to load rates:", error)
      setRates([])
    }
  }

  const resetForm = () => {
    setEditingKey(null)
    setFormData({
      roomType: "",
      mealPlan: "MAP",
      currencies: ["NPR"],
      rates: [emptyCurrencyRates("NPR")],
    })
  }

  const toggleCurrency = (currency: string, checked: boolean) => {
    setFormData((prev) => {
      const currencies = checked
        ? [...prev.currencies, currency]
        : prev.currencies.filter((item) => item !== currency)
      const nextRates = currencies.map((code) =>
        prev.rates.find((row) => row.currency === code) || emptyCurrencyRates(code)
      )
      return { ...prev, currencies, rates: nextRates }
    })
  }

  const updateCurrencyRate = (currency: string, field: "sglRate" | "dblRate" | "trplRate", value: string) => {
    setFormData((prev) => ({
      ...prev,
      rates: prev.rates.map((row) => (row.currency === currency ? { ...row, [field]: value } : row)),
    }))
  }

  const openCreate = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEdit = (roomType: string, mealPlan: string, cards: RateCardRow[]) => {
    const currencies = partnerCurrencies(cards)
    setEditingKey(`${roomType}::${mealPlan}`)
    setFormData({
      roomType,
      mealPlan,
      currencies,
      rates: currencies.map((currency) => {
        const card = cards.find((item) => normalizeCurrency(item.currency) === currency)
        return {
          currency,
          sglRate: card?.sglRate != null ? String(card.sglRate) : "",
          dblRate: card?.dblRate != null ? String(card.dblRate) : "",
          trplRate: card?.trplRate != null ? String(card.trplRate) : "",
        }
      }),
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.currencies.length) {
      alert("Select at least one currency (NPR, USD, or INR).")
      return
    }

    try {
      setSaving(true)
      await saveBusinessRates(businessId, {
        roomType: formData.roomType,
        mealPlan: formData.mealPlan,
        replaceGroup: Boolean(editingKey),
        rates: formData.rates.map((row) => ({
          currency: row.currency,
          sglRate: row.sglRate,
          dblRate: row.dblRate,
          trplRate: row.trplRate,
        })),
      })
      await loadRates()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Failed to save rate card:", error)
      alert(error instanceof Error ? error.message : "Failed to save rate card")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGroup = async (roomType: string, mealPlan: string) => {
    if (!confirm(`Delete all ${mealPlan} rates for ${roomType}?`)) return
    try {
      await deleteBusinessRate(businessId, { roomType, mealPlan })
      await loadRates()
    } catch (error) {
      console.error("Failed to delete rate card:", error)
      alert("Failed to delete rate card")
    }
  }

  const handleDeleteCurrency = async (rateId?: number) => {
    if (!rateId || !confirm("Delete this currency from the rate card?")) return
    try {
      await deleteBusinessRate(businessId, { rateId })
      await loadRates()
    } catch (error) {
      console.error("Failed to delete rate card:", error)
      alert("Failed to delete rate card")
    }
  }

  const groups = groupRateCards(rates).filter((group) =>
    matchesSearch(
      searchQuery,
      group.roomType,
      group.mealPlan,
      mealPlanLabel(group.mealPlan),
      ...group.currencies.map((card) => card.currency)
    )
  )
  const assignedCurrencies = partnerCurrencies(rates)

  if (loading) return <AdminLoading label="Loading rate cards..." />

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h3 className="text-lg font-semibold">Rate Cards for {businessName}</h3>
          <p className="text-sm text-muted-foreground">
            Assign NPR, USD, and INR on the same room and meal plan. Reception picks the currency when that partner sends a guest.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsPrintOpen(true)} disabled={rates.length === 0} className="w-full sm:w-auto">
            <Printer className="w-4 h-4 mr-2" />
            Print / give sheet
          </Button>
          <Button onClick={openCreate} className="bg-green-600 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Rate
          </Button>
        </div>
      </div>

      {assignedCurrencies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {assignedCurrencies.map((currency) => (
            <Badge key={currency} variant="secondary">{currency} assigned</Badge>
          ))}
        </div>
      )}

      <AdminSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search room type, meal plan, or currency..."
      />

      {rates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8 text-gray-500">
            <div className="text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No rate cards yet. Add NPR, USD, and INR rates for this partner.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.key} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex justify-between items-start gap-2">
                  <div>
                    <div className="font-bold text-lg">{group.roomType}</div>
                    <div className="text-sm text-blue-600 font-semibold">{mealPlanLabel(group.mealPlan)}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(group.roomType, group.mealPlan, group.currencies)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.roomType, group.mealPlan)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.currencies.map((card) => (
                  <div key={`${card.currency}-${card.id}`} className="rounded-md border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge>{card.currency || "NPR"}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive"
                        onClick={() => handleDeleteCurrency(card.id)}
                      >
                        Remove {card.currency}
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-gray-500">Single</div>
                        <div className="font-semibold">{formatRateValue(card.sglRate, card.currency)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Double</div>
                        <div className="font-semibold">{formatRateValue(card.dblRate, card.currency)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Triple</div>
                        <div className="font-semibold">{formatRateValue(card.trplRate, card.currency)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingKey ? "Edit Rate Card" : "Add Rate Card"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Room Type *</Label>
                <select
                  value={formData.roomType}
                  onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  disabled={Boolean(editingKey)}
                >
                  <option value="">Select room type</option>
                  {catalogRoomTypeNames().map((type) => (
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
                  disabled={Boolean(editingKey)}
                >
                  {MEAL_PLANS.map((plan) => (
                    <option key={plan.value} value={plan.value}>{plan.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Currencies for this partner *</Label>
              <p className="text-xs text-muted-foreground">
                Tick every currency this agency may send. USA guests use USD, Nepal guests use NPR, India guests use INR.
              </p>
              <div className="flex flex-wrap gap-4">
                {CURRENCIES.map((item) => (
                  <label key={item.value} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={formData.currencies.includes(item.value)}
                      onCheckedChange={(checked) => toggleCurrency(item.value, checked === true)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            {formData.rates.map((row) => (
              <div key={row.currency} className="rounded-md border p-3 space-y-3">
                <div className="font-semibold">{row.currency} rates ({currencySymbol(row.currency)})</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Single</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.sglRate}
                      onChange={(e) => updateCurrencyRate(row.currency, "sglRate", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Double</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.dblRate}
                      onChange={(e) => updateCurrencyRate(row.currency, "dblRate", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Triple</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.trplRate}
                      onChange={(e) => updateCurrencyRate(row.currency, "trplRate", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600" disabled={saving}>
                {saving ? <Spinner className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Saving..." : `Save ${formData.currencies.length > 1 ? `${formData.currencies.length} currencies` : "rate"}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle>Partner rate sheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-6" id="partner-rate-sheet">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold">Dhampus Village Eco Lodge</h2>
              <p className="text-lg font-semibold">Agent rates — {businessName}</p>
              <p className="text-sm text-muted-foreground">
                Currencies: {assignedCurrencies.join(", ") || "None"} · Meal plans shown net
              </p>
            </div>
            {assignedCurrencies.map((currency) => (
              <div key={currency} className="space-y-2">
                <h3 className="font-semibold text-lg">{currency} rates</h3>
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-2 text-left">Room</th>
                      <th className="border p-2 text-left">Meal plan</th>
                      <th className="border p-2 text-right">Single</th>
                      <th className="border p-2 text-right">Double</th>
                      <th className="border p-2 text-right">Triple</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates
                      .filter((card) => normalizeCurrency(card.currency) === currency)
                      .sort((a, b) => `${a.roomType}${a.mealPlan}`.localeCompare(`${b.roomType}${b.mealPlan}`))
                      .map((card) => (
                        <tr key={`${card.id}-${card.currency}`}>
                          <td className="border p-2">{card.roomType}</td>
                          <td className="border p-2">{normalizeMealPlan(card.mealPlan)}</td>
                          <td className="border p-2 text-right">{formatRateValue(card.sglRate, currency)}</td>
                          <td className="border p-2 text-right">{formatRateValue(card.dblRate, currency)}</td>
                          <td className="border p-2 text-right">{formatRateValue(card.trplRate, currency)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Charge the currency that matches the guest: USD for foreign/US, NPR for Nepal, INR for India. Rates are net.
            </p>
          </div>
          <div className="flex justify-end print:hidden">
            <Button onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Print sheet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
