"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2, X } from "lucide-react"
import {
  fetchBillSplits,
  createBillSplit,
  updateBillSplit,
  deleteBillSplit,
  addBillSplitAllocation,
  deleteBillSplitAllocation,
  completeSplitCheckout,
} from "@/lib/api"
import { calculateInclusiveVat, orderInclusiveSubtotal, roundMoney } from "@/lib/vat"
import { formatMoney, stayNightsCount } from "@/lib/hotel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PartnerCombobox } from "@/components/partner-combobox"
import { Spinner } from "@/components/ui/spinner"

interface Charge {
  sourceType: "room" | "order"
  bookingId?: number
  orderId?: number
  description: string
  total: number
}

interface BillSplitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupKey: string
  bookings: any[]
  orders: any[]
  businesses: any[]
  onCompleted: () => void
}

function allocatedAmount(allocations: any[], charge: Charge) {
  return allocations
    .filter((a: any) =>
      charge.sourceType === "room" ? a.sourceType === "room" && a.bookingId === charge.bookingId : a.sourceType === "order" && a.orderId === charge.orderId
    )
    .reduce((sum: number, a: any) => sum + a.amount, 0)
}

export function BillSplitDialog({ open, onOpenChange, groupKey, bookings, orders, businesses, onCompleted }: BillSplitDialogProps) {
  const [splits, setSplits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [assignTargets, setAssignTargets] = useState<Record<string, { splitId: string; amount: string }>>({})

  useEffect(() => {
    if (!open) return
    load()
  }, [open, groupKey])

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchBillSplits(groupKey)
      setSplits(data)
    } catch (error) {
      console.error("Failed to load bill splits:", error)
    } finally {
      setLoading(false)
    }
  }

  const allAllocations = useMemo(() => splits.flatMap((s) => s.allocations || []), [splits])

  const charges: Charge[] = useMemo(() => {
    const roomCharges: Charge[] = bookings.map((booking) => ({
      sourceType: "room",
      bookingId: booking.id,
      description: `Room ${booking.roomNumber} — ${booking.guest} (${stayNightsCount(booking.checkin, booking.checkout)} nights)`,
      total: parseFloat(booking.price) || 0,
    }))
    const orderCharges: Charge[] = orders.map((order) => ({
      sourceType: "order",
      orderId: order.id,
      description: `Order ${order.orderNumber} (${order.roomNumber || order.guestName || ""})`,
      total: orderInclusiveSubtotal(order),
    }))
    return [...roomCharges, ...orderCharges]
  }, [bookings, orders])

  const chargeKey = (charge: Charge) => (charge.sourceType === "room" ? `room-${charge.bookingId}` : `order-${charge.orderId}`)

  const unassignedCharges = charges
    .map((charge) => ({ charge, remaining: roundMoney(charge.total - allocatedAmount(allAllocations, charge)) }))
    .filter((item) => item.remaining > 0.01)

  const splitTotals = (split: any) => {
    const inclusiveSubtotal = (split.allocations || []).reduce((sum: number, a: any) => sum + a.amount, 0)
    return calculateInclusiveVat({
      inclusiveSubtotal,
      vatPercent: split.vatPercent ?? 13,
      discountType: split.discountType,
      discountValue: split.discountValue ?? 0,
    })
  }

  const addSplit = async () => {
    setSaving(true)
    try {
      const label = `Split ${splits.length + 1}`
      const created = await createBillSplit({ groupKey, label })
      setSplits((current) => [...current, created])
    } catch (error: any) {
      alert(error.message || "Failed to add split bill")
    } finally {
      setSaving(false)
    }
  }

  const patchSplit = async (id: number, patch: Record<string, unknown>) => {
    setSplits((current) => current.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    try {
      await updateBillSplit(id, patch)
    } catch (error) {
      console.error("Failed to update split:", error)
    }
  }

  const removeSplit = async (id: number) => {
    const split = splits.find((s) => s.id === id)
    if (split?.allocations?.length && !confirm("This split still has charges assigned. Delete it anyway? Those charges return to Unassigned.")) return
    try {
      await deleteBillSplit(id)
      setSplits((current) => current.filter((s) => s.id !== id))
    } catch (error) {
      console.error("Failed to delete split:", error)
    }
  }

  const assignCharge = async (charge: Charge, remaining: number) => {
    const key = chargeKey(charge)
    const target = assignTargets[key]
    const splitId = target?.splitId ? parseInt(target.splitId) : splits[0]?.id
    if (!splitId) {
      alert("Add a split bill first.")
      return
    }
    const amount = target?.amount ? parseFloat(target.amount) : remaining
    if (!amount || amount <= 0 || amount > remaining + 0.01) {
      alert(`Amount must be between 0 and ${remaining.toFixed(2)}`)
      return
    }
    try {
      const allocation = await addBillSplitAllocation(splitId, {
        sourceType: charge.sourceType,
        bookingId: charge.bookingId,
        orderId: charge.orderId,
        description: charge.description,
        amount,
      })
      setSplits((current) =>
        current.map((s) => (s.id === splitId ? { ...s, allocations: [...(s.allocations || []), allocation] } : s))
      )
      setAssignTargets((current) => ({ ...current, [key]: { splitId: "", amount: "" } }))
    } catch (error: any) {
      alert(error.message || "Failed to assign charge")
    }
  }

  const unassignAllocation = async (splitId: number, allocationId: number) => {
    try {
      await deleteBillSplitAllocation(splitId, allocationId)
      setSplits((current) =>
        current.map((s) => (s.id === splitId ? { ...s, allocations: (s.allocations || []).filter((a: any) => a.id !== allocationId) } : s))
      )
    } catch (error) {
      console.error("Failed to unassign charge:", error)
    }
  }

  const allFullyAllocated = unassignedCharges.length === 0
  const allPaymentStatusSet = splits.length > 0 && splits.every((s) => (s.allocations || []).length === 0 || s.paymentStatus === "paid" || s.paymentStatus === "credit")
  const canCheckout = splits.length > 0 && allFullyAllocated && allPaymentStatusSet && !saving

  const handleCompleteCheckout = async () => {
    const eligibleSplits = splits.filter((s) => (s.allocations || []).length > 0)
    if (eligibleSplits.length === 0) {
      alert("Assign at least one charge to a split bill first.")
      return
    }
    setSaving(true)
    try {
      await completeSplitCheckout({
        groupKey,
        splits: eligibleSplits.map((s) => ({
          billSplitId: s.id,
          paymentStatus: s.paymentStatus === "credit" ? "credit" : "paid",
          paymentMethod: s.paymentStatus === "credit" ? null : s.paymentMethod || "cash",
        })),
      })
      alert("Split checkout complete!")
      onOpenChange(false)
      onCompleted()
    } catch (error: any) {
      alert(error.message || "Failed to complete split checkout")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Split Bill — {groupKey}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10 text-center"><Spinner className="size-6 mx-auto" /></div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Unassigned Charges</CardTitle>
                <Button size="sm" variant="outline" onClick={addSplit} disabled={saving}>
                  <Plus className="w-4 h-4 mr-1" /> Add Split Bill
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {unassignedCharges.length === 0 ? (
                  <p className="text-sm text-gray-500">Everything is assigned to a split bill.</p>
                ) : (
                  unassignedCharges.map(({ charge, remaining }) => {
                    const key = chargeKey(charge)
                    const target = assignTargets[key] || { splitId: "", amount: "" }
                    return (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 border rounded-lg p-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{charge.description}</p>
                          <p className="text-xs text-gray-500">Remaining: NPR {remaining.toFixed(2)}</p>
                        </div>
                        <Select
                          value={target.splitId}
                          onValueChange={(value) => setAssignTargets((c) => ({ ...c, [key]: { ...target, splitId: value } }))}
                        >
                          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Assign to..." /></SelectTrigger>
                          <SelectContent>
                            {splits.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={remaining.toFixed(2)}
                          value={target.amount}
                          onChange={(e) => setAssignTargets((c) => ({ ...c, [key]: { ...target, amount: e.target.value } }))}
                          className="w-full sm:w-28"
                        />
                        <Button size="sm" onClick={() => assignCharge(charge, remaining)} disabled={splits.length === 0}>
                          Assign
                        </Button>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              {splits.map((split) => {
                const totals = splitTotals(split)
                return (
                  <Card key={split.id} className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={split.label}
                          onChange={(e) => patchSplit(split.id, { label: e.target.value })}
                          className="h-8 font-semibold"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Payer name"
                            value={split.payerName || ""}
                            onChange={(e) => patchSplit(split.id, { payerName: e.target.value })}
                            className="h-8 text-sm"
                          />
                          <Input
                            placeholder="Phone"
                            value={split.payerPhone || ""}
                            onChange={(e) => patchSplit(split.id, { payerPhone: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <PartnerCombobox
                          partners={businesses}
                          value={split.businessId ? String(split.businessId) : ""}
                          onChange={(value) => patchSplit(split.id, { businessId: value ? parseInt(value) : null })}
                          placeholder="Bill to a business (optional)"
                          clearLabel="N/A"
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeSplit(split.id)} aria-label={`Remove ${split.label}`}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        {(split.allocations || []).length === 0 ? (
                          <p className="text-xs text-gray-500">No charges assigned yet.</p>
                        ) : (
                          split.allocations.map((allocation: any) => (
                            <div key={allocation.id} className="flex justify-between items-center text-sm border-b pb-1">
                              <span>{allocation.description}</span>
                              <span className="flex items-center gap-2">
                                NPR {allocation.amount.toFixed(2)}
                                <button
                                  type="button"
                                  onClick={() => unassignAllocation(split.id, allocation.id)}
                                  className="text-gray-400 hover:text-red-600"
                                  aria-label="Unassign"
                                >
                                  <X className="size-3.5" />
                                </button>
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Discount</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={split.discountValue ?? 0}
                            onChange={(e) => patchSplit(split.id, { discountValue: parseFloat(e.target.value) || 0 })}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">VAT %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={split.vatPercent ?? 13}
                            onChange={(e) => patchSplit(split.id, { vatPercent: parseFloat(e.target.value) || 0 })}
                            className="h-8"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between font-semibold text-primary">
                        <span>Total</span>
                        <span>NPR {totals.total.toFixed(2)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Select value={split.paymentStatus} onValueChange={(value) => patchSplit(split.id, { paymentStatus: value })}>
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                            <SelectItem value="paid">✅ Paid</SelectItem>
                            <SelectItem value="credit">⏳ Credit</SelectItem>
                          </SelectContent>
                        </Select>
                        {split.paymentStatus === "paid" && (
                          <Select value={split.paymentMethod || "cash"} onValueChange={(value) => patchSplit(split.id, { paymentMethod: value })}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">💵 Cash</SelectItem>
                              <SelectItem value="card">💳 Card</SelectItem>
                              <SelectItem value="qr">📱 QR/UPI</SelectItem>
                              <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      {split.status === "checked_out" && <Badge variant="outline">Checked out</Badge>}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button
                onClick={handleCompleteCheckout}
                disabled={!canCheckout}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? <Spinner className="size-4 mr-2" /> : null}
                Complete Split Checkout
              </Button>
            </div>
            {!allFullyAllocated && (
              <p className="text-xs text-amber-600 text-right">Assign all remaining charges before checking out.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
