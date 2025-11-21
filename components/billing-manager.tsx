"use client"

import { useState, useEffect } from "react"
import { Receipt, Download, Printer, Check } from "lucide-react"
import { 
  fetchBookings, 
  updateBooking,
  fetchRestaurantOrders,
  createAccountTransaction,
  createCreditAccount
} from "@/lib/api"
import { addNotification } from "@/lib/notifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface Bill {
  booking: any
  roomCharges: number
  numberOfNights: number
  restaurantOrders: any[]
  restaurantTotal: number
  subtotal: number
  serviceTax: number
  vat: number
  totalAmount: number
}

export default function BillingManager() {
  const [bookings, setBookings] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [showBillDialog, setShowBillDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [roomPaymentStatus, setRoomPaymentStatus] = useState<string>("paid")
  const [roomPaymentMethod, setRoomPaymentMethod] = useState<string>("cash")
  const [restaurantPaymentStatus, setRestaurantPaymentStatus] = useState<string>("paid")
  const [restaurantPaymentMethod, setRestaurantPaymentMethod] = useState<string>("cash")

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

      const allOrders = await fetchRestaurantOrders()
      console.log("🍽️ Billing - All restaurant orders:", allOrders.length)
      setOrders(allOrders)
    } catch (error) {
      console.error('❌ Billing - Failed to load data:', error)
    }
  }

  const generateBill = (booking: any) => {
    // Calculate number of nights
    const checkin = new Date(booking.checkin)
    const checkout = new Date(booking.checkout)
    const nights = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24))

    // Get room charges
    const roomCharges = parseFloat(booking.price)

    // Get restaurant orders for this booking (by booking ID OR room number)
    const roomOrders = orders.filter(order => 
      (order.bookingId === booking.id || order.roomNumber === booking.roomNumber) && 
      order.status !== "cancelled"
    )
    
    console.log(`🍽️ Orders for ${booking.guest} (Room ${booking.roomNumber}):`, roomOrders.length, "orders found")

    const restaurantTotal = roomOrders.reduce((sum, order) => sum + order.total, 0)

    // Calculate subtotal
    const subtotal = roomCharges + restaurantTotal

    // Calculate taxes (Nepal rates)
    const serviceTax = subtotal * 0.10 // 10% service charge
    const vat = (subtotal + serviceTax) * 0.13 // 13% VAT

    const totalAmount = subtotal + serviceTax + vat

    const bill: Bill = {
      booking,
      roomCharges,
      numberOfNights: nights,
      restaurantOrders: roomOrders,
      restaurantTotal,
      subtotal,
      serviceTax,
      vat,
      totalAmount
    }

    // Reset payment states to defaults
    setRoomPaymentStatus("paid")
    setRoomPaymentMethod("cash")
    setRestaurantPaymentStatus("paid")
    setRestaurantPaymentMethod("cash")
    
    setSelectedBill(bill)
    setShowBillDialog(true)
  }

  const handlePrintBill = () => {
    window.print()
  }

  const handleDownloadBill = () => {
    if (!selectedBill) return

    const billContent = `
DHAMPUS ECO LODGE
Invoice / Bill
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Guest Name: ${selectedBill.booking.guest}
Room Number: ${selectedBill.booking.roomNumber}
Check-in: ${selectedBill.booking.checkin}
Check-out: ${selectedBill.booking.checkout}
Number of Nights: ${selectedBill.numberOfNights}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROOM CHARGES:
${selectedBill.numberOfNights} nights @ NPR ${(selectedBill.roomCharges / selectedBill.numberOfNights).toFixed(2)}/night
Total Room Charges: NPR ${selectedBill.roomCharges.toFixed(2)}

RESTAURANT & BAR CHARGES:
${selectedBill.restaurantOrders.map(order => `
Order ${order.orderNumber} (${new Date(order.createdAt).toLocaleDateString()})
${order.items.map((item: any) => `  ${item.quantity}x ${item.name} @ NPR ${item.price}`).join('\n')}
  Subtotal: NPR ${order.subtotal.toFixed(2)}
  Tax: NPR ${order.tax.toFixed(2)}
  Total: NPR ${order.total.toFixed(2)}
`).join('\n')}
Total Restaurant: NPR ${selectedBill.restaurantTotal.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal: NPR ${selectedBill.subtotal.toFixed(2)}
Service Charge (10%): NPR ${selectedBill.serviceTax.toFixed(2)}
VAT (13%): NPR ${selectedBill.vat.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL AMOUNT: NPR ${selectedBill.totalAmount.toFixed(2)}
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

  const handleCheckout = async () => {
    if (!selectedBill) return

    try {
      console.log('🔵 Starting checkout for booking:', selectedBill.booking.id)
      
      // Mark booking as checked out
      console.log('🔵 Updating booking status...')
      await updateBooking(selectedBill.booking.id, { status: "Checked Out" })
      console.log('✅ Booking status updated')
      
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
          amount: selectedBill.roomCharges,
          currency: "NPR",
          paymentMethod: roomPaymentMethod
        })
        console.log('✅ Room transaction created')
        paidAmount += selectedBill.roomCharges
        paymentSummary.push(`Room: NPR ${selectedBill.roomCharges.toFixed(2)} (${roomPaymentMethod.toUpperCase()})`)
      } else {
        // Create credit account for room charges
        creditAmount += selectedBill.roomCharges
        paymentSummary.push(`Room: NPR ${selectedBill.roomCharges.toFixed(2)} (CREDIT)`)
      }
      
      // Add restaurant income if any and if paid, or add to credit
      if (selectedBill.restaurantTotal > 0) {
        if (restaurantPaymentStatus === "paid") {
          console.log('🔵 Creating restaurant transaction...')
          await createAccountTransaction({
            date: new Date().toISOString().split("T")[0],
            type: "income",
            category: "restaurant",
            description: `Restaurant orders - Room ${selectedBill.booking.roomNumber} - ${selectedBill.booking.guest}`,
            amount: selectedBill.restaurantTotal,
            currency: "NPR",
            paymentMethod: restaurantPaymentMethod
          })
          console.log('✅ Restaurant transaction created')
          paidAmount += selectedBill.restaurantTotal
          paymentSummary.push(`Restaurant: NPR ${selectedBill.restaurantTotal.toFixed(2)} (${restaurantPaymentMethod.toUpperCase()})`)
        } else {
          creditAmount += selectedBill.restaurantTotal
          paymentSummary.push(`Restaurant: NPR ${selectedBill.restaurantTotal.toFixed(2)} (CREDIT)`)
        }
      }
      
      // Add taxes as income (split proportionally if mixed payment)
      console.log('🔵 Processing taxes...')
      const taxTotal = selectedBill.serviceTax + selectedBill.vat
      if (roomPaymentStatus === "paid" && restaurantPaymentStatus === "paid") {
        // Both paid - record all taxes
        console.log('🔵 Creating tax transaction (all paid)...')
        await createAccountTransaction({
          date: new Date().toISOString().split("T")[0],
          type: "income",
          category: "other",
          description: `Service Charge & VAT - Room ${selectedBill.booking.roomNumber}`,
          amount: taxTotal,
          currency: "NPR",
          paymentMethod: roomPaymentMethod
        })
        console.log('✅ Tax transaction created')
        paidAmount += taxTotal
      } else if (roomPaymentStatus === "credit" && restaurantPaymentStatus === "credit") {
        // Both credit - no tax recorded
        console.log('🔵 Both on credit, adding tax to credit amount')
        creditAmount += taxTotal
      } else {
        // Mixed - split taxes proportionally
        console.log('🔵 Creating tax transaction (partial)...')
        const paidRatio = paidAmount / (selectedBill.roomCharges + selectedBill.restaurantTotal)
        const taxPaid = taxTotal * paidRatio
        await createAccountTransaction({
          date: new Date().toISOString().split("T")[0],
          type: "income",
          category: "other",
          description: `Service Charge & VAT (Partial) - Room ${selectedBill.booking.roomNumber}`,
          amount: taxPaid,
          currency: "NPR",
          paymentMethod: roomPaymentStatus === "paid" ? roomPaymentMethod : restaurantPaymentMethod
        })
        console.log('✅ Tax transaction created')
        paidAmount += taxPaid
        creditAmount += taxTotal - taxPaid
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
          notes: `Checkout credit - Room: ${roomPaymentStatus === "credit" ? `NPR ${selectedBill.roomCharges.toFixed(2)}` : "Paid"}, Restaurant: ${restaurantPaymentStatus === "credit" && selectedBill.restaurantTotal > 0 ? `NPR ${selectedBill.restaurantTotal.toFixed(2)}` : "Paid"}, Taxes: NPR ${(taxTotal * (creditAmount / selectedBill.totalAmount)).toFixed(2)}`
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
      alertMessage += `Total Amount: NPR ${selectedBill.totalAmount.toFixed(2)}\n\n`
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Billing & Checkout</h2>
      </div>

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
              bookings.map((booking) => {
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
                              <span className="font-semibold">NPR {parseFloat(booking.price).toFixed(2)}</span>
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
                              NPR {((parseFloat(booking.price) + restaurantTotal) * 1.23).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">(incl. taxes)</p>
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

              {/* Guest & Booking Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Guest Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Name:</span> <span className="font-medium">{selectedBill.booking.guest}</span></p>
                    <p><span className="text-gray-600">Email:</span> {selectedBill.booking.email || 'N/A'}</p>
                    <p><span className="text-gray-600">Phone:</span> {selectedBill.booking.phone || 'N/A'}</p>
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

              {/* Room Charges */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Room Charges</h3>
                <div className="flex justify-between text-sm mb-1">
                  <span>{selectedBill.numberOfNights} nights @ NPR {(selectedBill.roomCharges / selectedBill.numberOfNights).toFixed(2)}/night</span>
                  <span className="font-semibold">NPR {selectedBill.roomCharges.toFixed(2)}</span>
                </div>
              </div>

              {/* Restaurant Charges */}
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
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs text-gray-600 ml-4">
                            <span>{item.quantity}x {item.name} @ NPR {item.price}</span>
                            <span>NPR {(item.quantity * item.price).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs text-gray-600 ml-4 mt-1">
                          <span>Tax ({order.taxPercentage}%)</span>
                          <span>NPR {order.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold ml-4 mt-1">
                          <span>Order Total</span>
                          <span>NPR {order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold pt-2">
                      <span>Total Restaurant Charges</span>
                      <span>NPR {selectedBill.restaurantTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Total Calculation */}
              <div className="border-t-2 pt-4 space-y-2">
                <div className="flex justify-between text-lg">
                  <span>Subtotal</span>
                  <span className="font-semibold">NPR {selectedBill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Service Charge (10%)</span>
                  <span>NPR {selectedBill.serviceTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>VAT (13%)</span>
                  <span>NPR {selectedBill.vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold text-primary border-t-2 pt-3 mt-3">
                  <span>TOTAL AMOUNT</span>
                  <span>NPR {selectedBill.totalAmount.toFixed(2)}</span>
                </div>
              </div>

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
            {selectedBill && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-3xl font-bold text-primary">NPR {selectedBill.totalAmount.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Room: NPR {selectedBill.roomCharges.toFixed(2)} + Restaurant: NPR {selectedBill.restaurantTotal.toFixed(2)} + Taxes: NPR {(selectedBill.serviceTax + selectedBill.vat).toFixed(2)}
                </p>
              </div>
            )}

            {/* Room Payment */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">🏨 Room Charges</h4>
                <p className="text-lg font-bold">NPR {selectedBill?.roomCharges.toFixed(2)}</p>
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

            {/* Restaurant Payment */}
            {selectedBill && selectedBill.restaurantTotal > 0 && (
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">🍽️ Restaurant & Bar</h4>
                  <p className="text-lg font-bold">NPR {selectedBill.restaurantTotal.toFixed(2)}</p>
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
            {selectedBill && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">PAYMENT SUMMARY</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Room ({roomPaymentStatus === "paid" ? roomPaymentMethod.toUpperCase() : "CREDIT"}):</span>
                    <span className="font-semibold">NPR {selectedBill.roomCharges.toFixed(2)}</span>
                  </div>
                  {selectedBill.restaurantTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Restaurant ({restaurantPaymentStatus === "paid" ? restaurantPaymentMethod.toUpperCase() : "CREDIT"}):</span>
                      <span className="font-semibold">NPR {selectedBill.restaurantTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Taxes (auto-calculated):</span>
                    <span>NPR {(selectedBill.serviceTax + selectedBill.vat).toFixed(2)}</span>
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

