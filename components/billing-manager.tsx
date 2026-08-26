"use client"

import { useEffect, useMemo, useState } from "react"
import { Receipt, Download, Printer, Check } from "lucide-react"
import { 
  fetchBookings, 
  updateBooking,
  fetchRestaurantOrders,
  fetchBusinesses,
  createAccountTransaction,
  createCreditAccount
} from "@/lib/api"
import { addNotification } from "@/lib/notifications"
import {
  calculateInclusiveVat,
  DEFAULT_VAT_PERCENT,
  isDiscountTooLarge,
  orderInclusiveSubtotal,
  referencedVatPercent,
  roundMoney,
} from "@/lib/vat"
import { mealPlanLabel, stayNightsCount, formatMoney } from "@/lib/hotel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminSearch, matchesSearch } from "@/components/admin-search"

interface Bill {
  booking: any
  roomCharges: number
  numberOfNights: number
  restaurantOrders: any[]
  restaurantInclusive: number
  restaurantTotal: number
}

function orderReference(orders: any[]) {
  const labels = orders.map((order) => order.orderNumber).filter(Boolean)
  const storedVat = orders.reduce((sum, order) => sum + (order.tax || 0), 0)
  if (orders.length === 1) {
    const order = orders[0]
    return {
      labels,
      storedVat: roundMoney(storedVat),
      discountType: (order.discountType === "percentage" ? "percentage" : "amount") as "percentage" | "amount",
      discountValue: order.discountValue || 0,
      vatPercent: order.taxPercentage || referencedVatPercent(orders),
    }
  }
  return {
    labels,
    storedVat: roundMoney(storedVat),
    discountType: "amount" as const,
    discountValue: roundMoney(orders.reduce((sum, order) => sum + (order.discountAmount || 0), 0)),
    vatPercent: referencedVatPercent(orders),
  }
}

export default function BillingManager() {
  const [bookings, setBookings] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [walkInOrders, setWalkInOrders] = useState<any[]>([])
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [showBillDialog, setShowBillDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [roomPaymentStatus, setRoomPaymentStatus] = useState<string>("paid")
  const [roomPaymentMethod, setRoomPaymentMethod] = useState<string>("cash")
  const [restaurantPaymentStatus, setRestaurantPaymentStatus] = useState<string>("paid")
  const [restaurantPaymentMethod, setRestaurantPaymentMethod] = useState<string>("cash")
  const [checkoutDiscountType, setCheckoutDiscountType] = useState<"percentage" | "amount">("amount")
  const [checkoutDiscountValue, setCheckoutDiscountValue] = useState(0)
  const [checkoutVatPercent, setCheckoutVatPercent] = useState(DEFAULT_VAT_PERCENT)
  const [searchQuery, setSearchQuery] = useState("")
  const [businesses, setBusinesses] = useState<any[]>([])
  const [companySearch, setCompanySearch] = useState("")

  const referencedOrders = selectedBill?.restaurantOrders || []
  const reference = orderReference(referencedOrders)
  const inclusiveSubtotal = selectedBill
    ? selectedBill.roomCharges + selectedBill.restaurantInclusive
    : 0
  const billTotals = useMemo(
    () =>
      calculateInclusiveVat({
        inclusiveSubtotal,
        vatPercent: checkoutVatPercent,
        discountType: checkoutDiscountType,
        discountValue: checkoutDiscountValue,
      }),
    [inclusiveSubtotal, checkoutVatPercent, checkoutDiscountType, checkoutDiscountValue]
  )
  const discountTooLarge = isDiscountTooLarge({
    inclusiveSubtotal,
    vatPercent: checkoutVatPercent,
    discountType: checkoutDiscountType,
    discountValue: checkoutDiscountValue,
  })
  const selectedBillAmounts = selectedBill
    ? {
        ...billTotals,
        restaurantTotal: selectedBill.restaurantInclusive,
        vat: billTotals.vatAmount,
        discountAmount: billTotals.discountAmount,
        exclusiveAmount: billTotals.discountedExclusive,
        totalAmount: billTotals.total,
        serviceTax: 0,
      }
    : null

  const applyOrderReference = (orders: any[]) => {
    const next = orderReference(orders)
    setCheckoutDiscountType(next.discountType)
    setCheckoutDiscountValue(next.discountValue)
    setCheckoutVatPercent(next.vatPercent)
  }

  const updateBillGuest = (patch: Record<string, unknown>) => {
    setSelectedBill((current) =>
      current
        ? { ...current, booking: { ...current.booking, ...patch } }
        : current
    )
  }

  const selectCompany = (value: string) => {
    if (value === "none") {
      updateBillGuest({ businessId: null, business: null })
      return
    }
    const partner = businesses.find((business) => String(business.id) === value)
    updateBillGuest({
      businessId: partner?.id || null,
      business: partner ? { id: partner.id, name: partner.name } : null,
    })
  }

  useEffect(() => {
    loadData()
    
    // Refresh every time component mounts (when switching tabs)
    const interval = setInterval(loadData, 5000) // Reduced frequency to 5s
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const allBookings = await fetchBookings()
      console.log("📊 Billing - All bookings:", allBookings.length)
      
      // Show bookings that are "Confirmed" OR "Checked In" with room numbers
      const activeBookings = allBookings.filter((b: any) => 
        (b.status === "Confirmed" || b.status === "Checked In") && b.roomNumber
      )
      console.log("✅ Billing - Active bookings ready for checkout:", activeBookings.length)
      console.log("Active bookings:", activeBookings.map((b: any) => `${b.guest} - Room ${b.roomNumber} - Status: ${b.status}`))
      setBookings(activeBookings)

      const [allOrders, allBusinesses] = await Promise.all([
        fetchRestaurantOrders(),
        fetchBusinesses().catch(() => []),
      ])
      console.log("🍽️ Billing - All restaurant orders:", allOrders.length)
      setOrders(allOrders)
      setBusinesses((allBusinesses || []).filter((business: any) => business.active !== false))
      
      // Separate walk-in orders (unpaid only)
      const walkIns = allOrders.filter((order: any) => 
        order.orderType === "walk_in" && 
        order.paymentStatus === "unpaid" &&
        order.status !== "cancelled"
      )
      console.log("🚶 Billing - Walk-in orders (unpaid):", walkIns.length)
      setWalkInOrders(walkIns)
    } catch (error) {
      console.error('❌ Billing - Failed to load data:', error)
    }
  }

  const generateBill = (booking: any) => {
    const nights = stayNightsCount(booking.checkin, booking.checkout)
    const roomCharges = parseFloat(booking.price) || 0
    const roomOrders = orders.filter((order) =>
      (order.bookingId === booking.id || order.roomNumber === booking.roomNumber) &&
      order.status !== "cancelled"
    )
    const restaurantInclusive = roomOrders.reduce((sum, order) => sum + orderInclusiveSubtotal(order), 0)

    applyOrderReference(roomOrders)
    setCompanySearch("")
    setRoomPaymentStatus("paid")
    setRoomPaymentMethod("cash")
    setRestaurantPaymentStatus("paid")
    setRestaurantPaymentMethod("cash")
    setSelectedBill({
      booking,
      roomCharges,
      numberOfNights: nights,
      restaurantOrders: roomOrders,
      restaurantInclusive,
      restaurantTotal: restaurantInclusive,
    })
    setShowBillDialog(true)
  }

  const generateWalkInBill = (order: any) => {
    applyOrderReference([order])
    setCompanySearch("")
    setRoomPaymentStatus("paid")
    setRoomPaymentMethod("cash")
    setRestaurantPaymentStatus("paid")
    setRestaurantPaymentMethod("cash")
    setSelectedBill({
      booking: {
        guest: order.guestName,
        email: "",
        phone: "",
        businessId: null,
        business: null,
        roomNumber: order.roomNumber,
        checkin: new Date(order.createdAt).toISOString().split("T")[0],
        checkout: new Date(order.createdAt).toISOString().split("T")[0],
        price: 0,
        status: "Walk-in",
        id: order.id,
      },
      roomCharges: 0,
      numberOfNights: 0,
      restaurantOrders: [order],
      restaurantInclusive: orderInclusiveSubtotal(order),
      restaurantTotal: orderInclusiveSubtotal(order),
    })
    setShowBillDialog(true)
  }

  const handlePrintBill = () => {
    window.print()
  }

  const handleDownloadBill = () => {
    if (!selectedBill || !selectedBillAmounts) return

    const billContent = `
DHAMPUS ECO LODGE
Invoice / Bill
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Guest Name: ${selectedBill.booking.guest}
Company: ${selectedBill.booking.business?.name || "N/A"}
Meal Plan: ${mealPlanLabel(selectedBill.booking.bookingType)}
Room Number: ${selectedBill.booking.roomNumber}
Check-in: ${selectedBill.booking.checkin}
Check-out: ${selectedBill.booking.checkout}
Number of Nights: ${selectedBill.numberOfNights}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROOM CHARGES:
${selectedBill.numberOfNights > 0 ? `${selectedBill.numberOfNights} nights @ ${(selectedBill.roomCharges / selectedBill.numberOfNights).toFixed(2)}/night` : "No room stay"}
Total Room Charges: ${formatMoney(selectedBill.roomCharges, selectedBill.booking.currency)}

RESTAURANT & BAR CHARGES:
${selectedBill.restaurantOrders.map(order => `
Order ${order.orderNumber} (${new Date(order.createdAt).toLocaleDateString()})
${(order.items || []).map((item: any) => `  ${item.quantity}x ${item.name} @ NPR ${item.price}`).join('\n')}
  Inclusive subtotal: NPR ${orderInclusiveSubtotal(order).toFixed(2)}
  Order VAT recorded: NPR ${(order.tax || 0).toFixed(2)} (${order.taxPercentage || 0}%)
  Order total: NPR ${(order.total || 0).toFixed(2)}
`).join('\n')}
Total Restaurant: NPR ${selectedBill.restaurantInclusive.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Inclusive Subtotal: NPR ${selectedBillAmounts.inclusiveSubtotal.toFixed(2)}
Discount: NPR ${selectedBillAmounts.discountAmount.toFixed(2)}
VAT exclusive: NPR ${selectedBillAmounts.exclusiveAmount.toFixed(2)}
VAT (${checkoutVatPercent}% inclusive): NPR ${selectedBillAmounts.vat.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL AMOUNT: NPR ${selectedBillAmounts.totalAmount.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for staying with us!
    `.trim()

    const blob = new Blob([billContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Bill_${selectedBill.booking.roomNumber}_${selectedBill.booking.guest.replace(/\s+/g, '_')}.txt`
    link.click()
  }

  const persistOrderCheckout = async (
    order: any,
    paymentStatus: string,
    paymentMethod: string | null,
    writeBillTotals: boolean
  ) => {
    const payload: Record<string, unknown> = {
      paymentStatus,
      paymentMethod,
      guestName: selectedBill?.booking.guest || order.guestName,
    }
    if (writeBillTotals && selectedBillAmounts) {
      payload.discountType = checkoutDiscountType
      payload.discountValue = checkoutDiscountValue
      payload.discountAmount = selectedBillAmounts.discountAmount
      payload.tax = selectedBillAmounts.vat
      payload.taxPercentage = checkoutVatPercent
      payload.total = selectedBillAmounts.totalAmount
    }
    await fetch(`/api/restaurant/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  }

  const allocatedDues = () => {
    if (!selectedBill || !selectedBillAmounts) {
      return { roomDue: 0, restaurantDue: 0 }
    }
    const sourceTotal = selectedBill.roomCharges + selectedBill.restaurantInclusive
    if (sourceTotal <= 0) {
      return { roomDue: 0, restaurantDue: selectedBillAmounts.totalAmount }
    }
    const roomDue = roundMoney(selectedBillAmounts.totalAmount * (selectedBill.roomCharges / sourceTotal))
    return {
      roomDue,
      restaurantDue: roundMoney(selectedBillAmounts.totalAmount - roomDue),
    }
  }

  const handleCheckout = async () => {
    if (!selectedBill || !selectedBillAmounts) return
    if (discountTooLarge) {
      alert("Discount cannot be larger than the VAT-exclusive amount.")
      return
    }

    try {
      const isWalkIn = selectedBill.booking.status === "Walk-in"
      const { roomDue, restaurantDue } = allocatedDues()
      
      console.log(`🔵 Starting checkout for ${isWalkIn ? 'walk-in order' : 'booking'}:`, selectedBill.booking.id)
      
      // For walk-in orders, just mark the order as paid or create credit
      if (isWalkIn) {
        const order = selectedBill.restaurantOrders[0]
        
        if (restaurantPaymentStatus === "paid") {
          // Update order payment status
          console.log('🔵 Updating order payment status...')
          await persistOrderCheckout(order, "paid", restaurantPaymentMethod, true)
          console.log('✅ Order marked as paid')
          
          // Add to accounts
          await createAccountTransaction({
            date: new Date().toISOString().split("T")[0],
            type: "income",
            category: "food_beverage",
            description: `Walk-in Order #${order.orderNumber} - ${order.roomNumber}`,
            amount: selectedBillAmounts.totalAmount,
            currency: "NPR",
            paymentMethod: restaurantPaymentMethod
          })
          console.log('✅ Transaction added to accounts')
          
          alert(`✅ Walk-in order payment completed!\n\nTotal Paid: NPR ${selectedBillAmounts.totalAmount.toFixed(2)}\nPayment Method: ${restaurantPaymentMethod.toUpperCase()}`)
        } else {
          // Credit payment - create credit account
          console.log('🔵 Creating credit account for walk-in order...')
          
          await persistOrderCheckout(order, "credit", "credit", true)
          
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 30) // 30 days credit period
          
          await createCreditAccount({
            guestName: selectedBill.booking.guest || order.guestName,
            guestPhone: selectedBill.booking.phone || order.roomNumber,
            guestEmail: selectedBill.booking.email || "",
            guestAddress: selectedBill.booking.business?.name || "",
            creditAmount: selectedBillAmounts.totalAmount,
            paidAmount: 0,
            outstandingBalance: selectedBillAmounts.totalAmount,
            creditDate: new Date().toISOString().split("T")[0],
            dueDate: dueDate.toISOString().split("T")[0],
            status: 'unpaid',
            bookingId: null,
            notes: `Walk-in Order #${order.orderNumber} - ${order.roomNumber}`
          })
          console.log('✅ Credit account created')
          
          // Add notification for new credit account
          addNotification(
            "payment",
            "New Credit Account",
            `Walk-in: ${order.guestName} - NPR ${selectedBillAmounts.totalAmount.toFixed(2)} due on ${dueDate.toISOString().split("T")[0]}`,
            "medium",
            "accounts"
          )
          
          alert(`✅ Walk-in order on credit!\n\nTotal Amount: NPR ${selectedBillAmounts.totalAmount.toFixed(2)}\nDue Date: ${dueDate.toISOString().split("T")[0]}\n\n💳 Credit account created in AMS → Credit Tracking`)
        }
        
        setShowPaymentDialog(false)
        setShowBillDialog(false)
        await loadData()
        return
      }
      
      // Regular booking checkout
      // Mark booking as checked out
      console.log('🔵 Updating booking status...')
      await updateBooking(selectedBill.booking.id, {
        status: "Checked Out",
        guest: selectedBill.booking.guest,
        email: selectedBill.booking.email || null,
        phone: selectedBill.booking.phone || null,
        businessId: selectedBill.booking.businessId || null,
      })
      console.log('✅ Booking status updated')

      await Promise.all(
        selectedBill.restaurantOrders.map((order) =>
          persistOrderCheckout(
            order,
            restaurantPaymentStatus === "paid" ? "paid" : "credit",
            restaurantPaymentStatus === "paid" ? restaurantPaymentMethod : "credit",
            false
          )
        )
      )
      
      let paidAmount = 0
      let creditAmount = 0
      const paymentSummary: string[] = []
      
      // Add room booking income if paid, or create credit account if credit
      if (roomPaymentStatus === "paid") {
        console.log('🔵 Creating room transaction...')
        await createAccountTransaction({
          date: new Date().toISOString().split("T")[0],
          type: "income",
          category: "room_booking",
          description: `Room ${selectedBill.booking.roomNumber} - ${selectedBill.booking.guest} (${selectedBill.numberOfNights} nights)`,
          amount: roomDue,
          currency: "NPR",
          paymentMethod: roomPaymentMethod
        })
        console.log('✅ Room transaction created')
        paidAmount += roomDue
        paymentSummary.push(`Room: NPR ${roomDue.toFixed(2)} (${roomPaymentMethod.toUpperCase()})`)
      } else {
        // Create credit account for room charges
        creditAmount += roomDue
        paymentSummary.push(`Room: NPR ${roomDue.toFixed(2)} (CREDIT)`)
      }
      
      // Add restaurant income if any and if paid, or add to credit
      if (restaurantDue > 0) {
        if (restaurantPaymentStatus === "paid") {
          console.log('🔵 Creating restaurant transaction...')
          await createAccountTransaction({
            date: new Date().toISOString().split("T")[0],
            type: "income",
            category: "restaurant",
            description: `Restaurant orders - Room ${selectedBill.booking.roomNumber} - ${selectedBill.booking.guest}`,
            amount: restaurantDue,
            currency: "NPR",
            paymentMethod: restaurantPaymentMethod
          })
          console.log('✅ Restaurant transaction created')
          paidAmount += restaurantDue
          paymentSummary.push(`Restaurant: NPR ${restaurantDue.toFixed(2)} (${restaurantPaymentMethod.toUpperCase()})`)
        } else {
          creditAmount += restaurantDue
          paymentSummary.push(`Restaurant: NPR ${restaurantDue.toFixed(2)} (CREDIT)`)
        }
      }
      
      // CREATE CREDIT ACCOUNT if there's any credit amount
      if (creditAmount > 0) {
        console.log('🔵 Creating credit account...')
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 30) // 30 days credit period
        
        await createCreditAccount({
          guestName: selectedBill.booking.guest,
          guestPhone: selectedBill.booking.phone || "N/A",
          guestEmail: selectedBill.booking.email || "",
          guestAddress: "",
          creditAmount: creditAmount,
          paidAmount: 0,
          outstandingBalance: creditAmount,
          creditDate: new Date().toISOString().split("T")[0],
          dueDate: dueDate.toISOString().split("T")[0],
          status: 'unpaid',
          bookingId: selectedBill.booking.id,
          notes: `Checkout credit - Room: ${roomPaymentStatus === "credit" ? `NPR ${roomDue.toFixed(2)}` : "Paid"}, Restaurant: ${restaurantPaymentStatus === "credit" && restaurantDue > 0 ? `NPR ${restaurantDue.toFixed(2)}` : "Paid"}`
        })
        console.log('✅ Credit account created')
        
        // Add notification for new credit account
        addNotification(
          "payment",
          "New Credit Account",
          `${selectedBill.booking.guest} - NPR ${creditAmount.toFixed(2)} due on ${dueDate.toISOString().split("T")[0]}`,
          "medium",
          "accounts"
        )
      }
      
      console.log('✅ Checkout completed successfully!')
      
      // Build alert message
      let alertMessage = `✅ Guest checked out successfully!\n\n`
      alertMessage += `Total Amount: NPR ${selectedBillAmounts.totalAmount.toFixed(2)}\n\n`
      alertMessage += `--- Payment Breakdown ---\n`
      paymentSummary.forEach(line => alertMessage += `${line}\n`)
      alertMessage += `\n💰 Paid: NPR ${paidAmount.toFixed(2)}`
      if (creditAmount > 0) {
        alertMessage += `\n⏳ Credit: NPR ${creditAmount.toFixed(2)}`
      }
      if (paidAmount > 0) {
        alertMessage += `\n\n✅ Transactions added to Accounts (AMS)`
      }
      if (creditAmount > 0) {
        alertMessage += `\n💳 Credit account created in AMS → Credit Tracking`
      }
      
      alert(alertMessage)
      setShowPaymentDialog(false)
      setShowBillDialog(false)
      await loadData()
    } catch (error: any) {
      console.error('❌ Failed to checkout:', error)
      console.error('Error details:', error.message, error.response)
      alert(`Failed to complete checkout: ${error.message || 'Please try again.'}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Billing & Checkout</h2>
      </div>

      <AdminSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search guest, room, or phone..."
      />

      <Card>
        <CardHeader>
          <CardTitle>Active Bookings - Ready for Checkout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No active bookings ready for checkout</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
                  <h4 className="font-semibold text-yellow-900 mb-2">ℹ️ How to Generate Bills</h4>
                  <p className="text-sm text-yellow-800 mb-2">To see bookings here, you need:</p>
                  <ol className="text-sm text-yellow-800 list-decimal list-inside space-y-1 ml-2">
                    <li>Go to <span className="font-semibold">Bookings</span> page</li>
                    <li>Create or edit a booking and set status to <span className="font-semibold">"Confirmed"</span> or <span className="font-semibold">"Checked In"</span></li>
                    <li>Assign a <span className="font-semibold">room number</span> to the booking</li>
                    <li>Optionally, add restaurant orders via <span className="font-semibold">Restaurant (RMS)</span> linked to the room</li>
                    <li>Come back here to generate the complete bill with room + restaurant + taxes</li>
                  </ol>
                  <p className="text-sm text-yellow-800 mt-3 font-semibold">
                    💡 When you checkout a guest, transactions are automatically added to Accounts (AMS)!
                  </p>
                </div>
              </div>
            ) : (
              bookings.filter((booking) => matchesSearch(searchQuery, booking.guest, booking.roomNumber, booking.room, booking.email, booking.phone, booking.status)).map((booking) => {
                const roomOrders = orders.filter(o => o.roomNumber === booking.roomNumber)
                const restaurantTotal = roomOrders.reduce((sum, order) => sum + order.total, 0)
                
                return (
                  <Card key={booking.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div>
                            <p className="text-lg font-bold">{booking.guest}</p>
                            <p className="text-sm text-gray-600">
                              Room {booking.roomNumber} • {booking.checkin} to {booking.checkout}
                            </p>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Room: </span>
                              <span className="font-semibold">{formatMoney(booking.price, booking.currency)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Restaurant: </span>
                              <span className="font-semibold">NPR {restaurantTotal.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Orders: </span>
                              <span className="font-semibold">{roomOrders.length}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div>
                            <p className="text-sm text-gray-600">Estimated Total</p>
                            <p className="text-2xl font-bold text-primary">
                              {formatMoney((parseFloat(booking.price) || 0) + restaurantTotal, booking.currency || "NPR")}
                            </p>
                            <p className="text-xs text-gray-500">(VAT inclusive)</p>
                          </div>
                          <Button onClick={() => generateBill(booking)} className="w-full">
                            <Receipt className="w-4 h-4 mr-2" />
                            Generate Bill
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Walk-in Orders Section */}
      <Card>
        <CardHeader>
          <CardTitle>🚶 Walk-in / Dine-in Orders - Pending Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {walkInOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending walk-in orders
              </div>
            ) : (
              walkInOrders.filter((order) => matchesSearch(searchQuery, order.guestName, order.roomNumber, order.orderNumber, order.status)).map((order) => (
                <Card key={order.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div>
                          <p className="text-lg font-bold">{order.guestName}</p>
                          <p className="text-sm text-gray-600">
                            {order.roomNumber} • {new Date(order.createdAt).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">Order #{order.orderNumber}</p>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Items: </span>
                            <span className="font-semibold">{order.items?.length || 0}</span>
                          </div>
                          <div>
                            <Badge variant={
                              order.status === "pending" ? "secondary" :
                              order.status === "preparing" ? "default" :
                              order.status === "ready" ? "default" :
                              "outline"
                            }>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="text-2xl font-bold text-primary">
                            NPR {order.total.toFixed(2)}
                          </p>
                        </div>
                        <Button onClick={() => generateWalkInBill(order)} className="w-full">
                          <Receipt className="w-4 h-4 mr-2" />
                          Generate Bill
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bill Dialog */}
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full">
          <DialogHeader className="print:hidden">
            <DialogTitle>Guest Bill - Checkout</DialogTitle>
          </DialogHeader>

          {selectedBill && (
            <div className="space-y-6">
              {/* Bill Header */}
              <div className="text-center border-b pb-4">
                <h1 className="text-3xl font-bold text-primary">DHAMPUS ECO LODGE</h1>
                <p className="text-sm text-gray-600">Luxury in the Heart of the Himalayas</p>
                <p className="text-xs text-gray-500 mt-2">Tax Invoice / Bill</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Guest Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="space-y-1">
                      <Label htmlFor="bill-guest-name">Name</Label>
                      <Input
                        id="bill-guest-name"
                        value={selectedBill.booking.guest || ""}
                        onChange={(e) => updateBillGuest({ guest: e.target.value })}
                        className="h-9 print:border-0 print:shadow-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="bill-guest-email">Email</Label>
                      <Input
                        id="bill-guest-email"
                        type="email"
                        placeholder="N/A"
                        value={selectedBill.booking.email || ""}
                        onChange={(e) => updateBillGuest({ email: e.target.value })}
                        className="h-9 print:border-0 print:shadow-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="bill-guest-phone">Phone</Label>
                      <Input
                        id="bill-guest-phone"
                        placeholder="N/A"
                        value={selectedBill.booking.phone || ""}
                        onChange={(e) => updateBillGuest({ phone: e.target.value })}
                        className="h-9 print:border-0 print:shadow-none"
                      />
                    </div>
                    <div className="space-y-1 print:hidden">
                      <Label>Company</Label>
                      <AdminSearch
                        value={companySearch}
                        onChange={setCompanySearch}
                        placeholder="Search business partners..."
                        className="mb-2"
                      />
                      <Select
                        value={selectedBill.booking.businessId ? String(selectedBill.booking.businessId) : "none"}
                        onValueChange={selectCompany}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select from business partners" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">N/A</SelectItem>
                          {businesses
                            .filter((business) =>
                              matchesSearch(companySearch, business.name, business.phone, business.contactPerson, business.email)
                            )
                            .map((business) => (
                              <SelectItem key={business.id} value={String(business.id)}>
                                {business.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="hidden print:block">
                      <span className="text-gray-600">Company:</span> {selectedBill.booking.business?.name || "N/A"}
                    </p>
                    <p><span className="text-gray-600">Meal plan:</span> {mealPlanLabel(selectedBill.booking.bookingType)}</p>
                    <p><span className="text-gray-600">Room:</span> <span className="font-medium">{selectedBill.booking.roomNumber}</span></p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Stay Details</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Check-in:</span> {new Date(selectedBill.booking.checkin).toLocaleDateString()}</p>
                    <p><span className="text-gray-600">Check-out:</span> {new Date(selectedBill.booking.checkout).toLocaleDateString()}</p>
                    <p><span className="text-gray-600">Number of Nights:</span> <span className="font-medium">{selectedBill.numberOfNights}</span></p>
                    <p><span className="text-gray-600">Bill Date:</span> {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {selectedBill.roomCharges > 0 && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-3">Room Charges</h3>
                  <div className="flex justify-between text-sm mb-1">
                    <span>
                      {selectedBill.numberOfNights} night{selectedBill.numberOfNights === 1 ? "" : "s"} @ {formatMoney(selectedBill.roomCharges / selectedBill.numberOfNights, selectedBill.booking.currency)}/night
                    </span>
                    <span className="font-semibold">{formatMoney(selectedBill.roomCharges, selectedBill.booking.currency)}</span>
                  </div>
                </div>
              )}

              {selectedBill.restaurantOrders.length > 0 && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-3">Restaurant & Bar Charges</h3>
                  <div className="space-y-3">
                    {selectedBill.restaurantOrders.map((order) => (
                      <div key={order.id} className="border-b pb-2">
                        <div className="flex justify-between text-sm font-medium mb-1">
                          <span>Order {order.orderNumber}</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        {(order.items || []).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs text-gray-600 ml-4">
                            <span>{item.quantity}x {item.name} @ NPR {item.price}</span>
                            <span>NPR {(item.quantity * item.price).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs text-gray-600 ml-4 mt-1">
                          <span>Order VAT recorded ({order.taxPercentage || 0}%)</span>
                          <span>NPR {(order.tax || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold ml-4 mt-1">
                          <span>Order inclusive total</span>
                          <span>NPR {orderInclusiveSubtotal(order).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold pt-2">
                      <span>Total Restaurant Charges</span>
                      <span>NPR {selectedBill.restaurantInclusive.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="border rounded-lg p-4 space-y-3 print:hidden">
                <h3 className="font-semibold">Checkout discount / VAT</h3>
                {reference.labels.length > 0 ? (
                  <p className="text-sm text-gray-600">
                    Referenced from order {reference.labels.join(", ")}. Recorded order VAT is NPR {reference.storedVat.toFixed(2)}.
                    VAT here is taken from that order and is not added on top of the inclusive prices.
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    No restaurant order to reference. Enter VAT for these inclusive prices, or leave 13%.
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Discount type</Label>
                    <Select value={checkoutDiscountType} onValueChange={(value: "percentage" | "amount") => setCheckoutDiscountType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Discount value</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={checkoutDiscountValue}
                      onChange={(e) => setCheckoutDiscountValue(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>VAT %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={checkoutVatPercent}
                      onChange={(e) => setCheckoutVatPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                </div>
                {discountTooLarge && (
                  <p className="text-sm text-red-600">Discount cannot be larger than the VAT-exclusive amount.</p>
                )}
                {reference.labels.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => applyOrderReference(selectedBill.restaurantOrders)}
                  >
                    Use order VAT & discount
                  </Button>
                )}
              </div>

              {selectedBillAmounts && (
                <div className="border-t-2 pt-4 space-y-2">
                  <div className="flex justify-between text-lg">
                    <span>Inclusive subtotal</span>
                    <span className="font-semibold">NPR {selectedBillAmounts.inclusiveSubtotal.toFixed(2)}</span>
                  </div>
                  {selectedBillAmounts.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Discount (on exclusive)</span>
                      <span>- NPR {selectedBillAmounts.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>VAT exclusive amount</span>
                    <span>NPR {selectedBillAmounts.exclusiveAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>VAT ({checkoutVatPercent}% inclusive)</span>
                    <span>NPR {selectedBillAmounts.vat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold text-primary border-t-2 pt-3 mt-3">
                    <span>TOTAL AMOUNT</span>
                    <span>NPR {selectedBillAmounts.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-sm text-gray-600 border-t pt-4">
                <p>Thank you for staying with us!</p>
                <p className="text-xs mt-2">This is a computer-generated invoice</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 print:hidden">
                <Button variant="outline" onClick={handlePrintBill} className="flex-1">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Bill
                </Button>
                <Button variant="outline" onClick={handleDownloadBill} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button 
                  onClick={() => setShowPaymentDialog(true)}
                  disabled={discountTooLarge}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Checkout Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBill && selectedBillAmounts && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary break-words">NPR {selectedBillAmounts.totalAmount.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1 break-words">
                  Inclusive prices only. VAT NPR {selectedBillAmounts.vat.toFixed(2)} is already included
                  {selectedBillAmounts.discountAmount > 0 ? `, after NPR ${selectedBillAmounts.discountAmount.toFixed(2)} discount` : ""}.
                </p>
              </div>
            )}

            {selectedBill && selectedBill.roomCharges > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <h4 className="font-semibold">🏨 Room Charges</h4>
                <p className="text-lg font-bold">NPR {allocatedDues().roomDue.toFixed(2)}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Payment Status *</Label>
                  <Select value={roomPaymentStatus} onValueChange={setRoomPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">✅ Paid</SelectItem>
                      <SelectItem value="credit">⏳ Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {roomPaymentStatus === "paid" && (
                  <div className="space-y-2">
                    <Label>Payment Method *</Label>
                    <Select value={roomPaymentMethod} onValueChange={setRoomPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">💵 Cash</SelectItem>
                        <SelectItem value="card">💳 Card</SelectItem>
                        <SelectItem value="qr">📱 QR/UPI</SelectItem>
                        <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            )}

            {selectedBill && selectedBill.restaurantInclusive > 0 && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <h4 className="font-semibold">🍽️ Restaurant & Bar</h4>
                  <p className="text-lg font-bold">NPR {allocatedDues().restaurantDue.toFixed(2)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Payment Status *</Label>
                    <Select value={restaurantPaymentStatus} onValueChange={setRestaurantPaymentStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">✅ Paid</SelectItem>
                        <SelectItem value="credit">⏳ Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {restaurantPaymentStatus === "paid" && (
                    <div className="space-y-2">
                      <Label>Payment Method *</Label>
                      <Select value={restaurantPaymentMethod} onValueChange={setRestaurantPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">💵 Cash</SelectItem>
                          <SelectItem value="card">💳 Card</SelectItem>
                          <SelectItem value="qr">📱 QR/UPI</SelectItem>
                          <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            {selectedBill && selectedBillAmounts && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">PAYMENT SUMMARY</p>
                <div className="space-y-1 text-sm">
                  {selectedBill.roomCharges > 0 && (
                    <div className="flex justify-between">
                      <span>Room ({roomPaymentStatus === "paid" ? roomPaymentMethod.toUpperCase() : "CREDIT"}):</span>
                      <span className="font-semibold">NPR {allocatedDues().roomDue.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedBill.restaurantInclusive > 0 && (
                    <div className="flex justify-between">
                      <span>Restaurant ({restaurantPaymentStatus === "paid" ? restaurantPaymentMethod.toUpperCase() : "CREDIT"}):</span>
                      <span className="font-semibold">NPR {allocatedDues().restaurantDue.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>VAT included at {checkoutVatPercent}%:</span>
                    <span>NPR {selectedBillAmounts.vat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1">
                    <span>Total</span>
                    <span>NPR {selectedBillAmounts.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowPaymentDialog(false)} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCheckout}
                disabled={discountTooLarge}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm Checkout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

