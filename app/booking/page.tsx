"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, Users, Mail, Phone, User, CreditCard, CheckCircle } from "lucide-react"
import { getRooms, addBooking, type Room } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function BookingPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingId, setBookingId] = useState<string>("")
  const [formData, setFormData] = useState({
    guest: "",
    email: "",
    phone: "",
    checkin: "",
    checkout: "",
    guests: "1",
    specialRequests: "",
  })

  useEffect(() => {
    const availableRooms = getRooms().filter((r) => r.status === "Available")
    setRooms(availableRooms)
  }, [])

  const calculateNights = () => {
    if (!formData.checkin || !formData.checkout) return 0
    const start = new Date(formData.checkin)
    const end = new Date(formData.checkout)
    const diff = end.getTime() - start.getTime()
    return Math.ceil(diff / (1000 * 3600 * 24))
  }

  const calculateTotal = () => {
    if (!selectedRoom) return 0
    const nights = calculateNights()
    return nights * parseFloat(selectedRoom.price)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedRoom) {
      alert("⚠️ Please select a room")
      return
    }

    // Validate dates
    const checkinDate = new Date(formData.checkin)
    const checkoutDate = new Date(formData.checkout)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    checkinDate.setHours(0, 0, 0, 0)
    checkoutDate.setHours(0, 0, 0, 0)

    // Check if dates are provided
    if (!formData.checkin || !formData.checkout) {
      alert("⚠️ Please select check-in and check-out dates")
      return
    }

    // Check if checkout is after checkin
    if (checkoutDate <= checkinDate) {
      alert("⚠️ Check-out date must be after check-in date!")
      return
    }

    // Check if dates are in the past
    if (checkinDate < today) {
      alert("⚠️ Check-in date cannot be in the past!")
      return
    }

    // Calculate minimum 1 night stay
    const nights = calculateNights()
    if (nights < 1) {
      alert("⚠️ Minimum stay is 1 night!")
      return
    }

    // Validate guest capacity
    const guestCount = parseInt(formData.guests)
    if (guestCount > selectedRoom.capacity) {
      alert(`⚠️ This room can accommodate a maximum of ${selectedRoom.capacity} guests. Please select a different room or reduce the number of guests.`)
      return
    }

    // Validate contact information
    if (!formData.email.includes("@")) {
      alert("⚠️ Please enter a valid email address")
      return
    }

    if (formData.phone.length < 10) {
      alert("⚠️ Please enter a valid phone number")
      return
    }

    const totalPrice = calculateTotal().toString()
    
    const newBooking = addBooking({
      guest: formData.guest,
      email: formData.email,
      phone: formData.phone,
      room: selectedRoom.name,
      checkin: formData.checkin,
      checkout: formData.checkout,
      price: totalPrice,
      status: "Pending",
      bookingSource: "website",
    })

    setBookingId(newBooking.id.toString())
    setBookingComplete(true)
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Booking Request Submitted!</CardTitle>
            <CardDescription>Your booking is pending confirmation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-gray-600">Booking Reference:</p>
              <p className="text-2xl font-bold text-primary">#{bookingId}</p>
            </div>
            
            <div className="space-y-2">
              <p className="font-semibold">What's Next?</p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>We'll review your booking request</li>
                <li>You'll receive a confirmation email within 24 hours</li>
                <li>Check your booking status anytime</li>
              </ul>
            </div>

            <div className="pt-4 space-y-2">
              <Link href={`/booking/status?email=${encodeURIComponent(formData.email)}`} className="block">
                <Button className="w-full" variant="outline">
                  Check Booking Status
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button className="w-full">Return to Homepage</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <span className="text-white font-display text-lg font-bold">D</span>
            </div>
            <div>
              <p className="font-display font-semibold text-primary">Dhampus Eco Lodge</p>
            </div>
          </Link>
          <Link href="/booking/status">
            <Button variant="outline" size="sm">Check Booking Status</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary mb-4">Book Your Stay</h1>
          <p className="text-lg text-gray-600">Experience luxury in the heart of the Himalayas</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>Fill in your information to reserve your room</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Guest Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <User size={20} />
                      Guest Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="guest">Full Name *</Label>
                        <Input
                          id="guest"
                          value={formData.guest}
                          onChange={(e) => setFormData({ ...formData, guest: e.target.value })}
                          required
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guests">Number of Guests *</Label>
                        <Select value={formData.guests} onValueChange={(value) => setFormData({ ...formData, guests: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? "Guest" : "Guests"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Stay Dates */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Calendar size={20} />
                      Stay Dates
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkin">Check-in Date *</Label>
                        <Input
                          id="checkin"
                          type="date"
                          value={formData.checkin}
                          onChange={(e) => setFormData({ ...formData, checkin: e.target.value })}
                          min={new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkout">Check-out Date *</Label>
                        <Input
                          id="checkout"
                          type="date"
                          value={formData.checkout}
                          onChange={(e) => setFormData({ ...formData, checkout: e.target.value })}
                          min={formData.checkin || new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>
                    </div>
                    {calculateNights() > 0 && (
                      <p className="text-sm text-gray-600">
                        Total nights: <span className="font-semibold">{calculateNights()}</span>
                      </p>
                    )}
                  </div>

                  {/* Room Selection */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Select Your Room *</h3>
                    <div className="grid gap-4">
                      {rooms.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No rooms available at the moment.</p>
                      ) : (
                        rooms.map((room) => (
                          <div
                            key={room.id}
                            onClick={() => setSelectedRoom(room)}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                              selectedRoom?.id === room.id
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <img
                                src={room.image}
                                alt={room.name}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{room.name}</h4>
                                <p className="text-sm text-gray-600 mb-2">{room.description}</p>
                                <div className="flex items-center gap-4">
                                  <p className="text-xl font-bold text-primary">${room.price}/night</p>
                                  <p className="text-sm text-gray-500">Capacity: {room.capacity} guests</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div className="space-y-2">
                    <Label htmlFor="requests">Special Requests (Optional)</Label>
                    <textarea
                      id="requests"
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Any special requirements or requests..."
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={!selectedRoom}>
                    Submit Booking Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedRoom ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Selected Room</p>
                      <p className="font-semibold">{selectedRoom.name}</p>
                    </div>
                    {formData.checkin && formData.checkout && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Dates</p>
                          <p className="text-sm">
                            {new Date(formData.checkin).toLocaleDateString()} - {new Date(formData.checkout).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Nights</p>
                          <p className="font-semibold">{calculateNights()}</p>
                        </div>
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm">Room Rate</p>
                            <p className="text-sm">${selectedRoom.price} x {calculateNights()}</p>
                          </div>
                          <div className="flex justify-between items-center text-lg font-bold">
                            <p>Total</p>
                            <p className="text-primary">${calculateTotal()}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-center text-gray-500 py-8">Select a room to see pricing</p>
                )}

                <div className="border-t pt-4 space-y-2">
                  <p className="text-xs text-gray-600">
                    ✓ Free cancellation up to 24 hours before check-in
                  </p>
                  <p className="text-xs text-gray-600">✓ No payment required now</p>
                  <p className="text-xs text-gray-600">✓ Confirmation within 24 hours</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

