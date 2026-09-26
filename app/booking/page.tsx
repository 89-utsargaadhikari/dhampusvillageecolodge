"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, Users, Mail, Phone, User, CheckCircle, Sparkles, Star, Plus, Trash2, UtensilsCrossed, BedDouble } from "lucide-react"
import { type Room } from "@/lib/storage"
import { fetchRooms, createBooking } from "@/lib/api"
import { currencySymbol, isGuestFacingRoom, MEAL_PLANS, OCCUPANCY_TYPES } from "@/lib/hotel"
import { addNotification } from "@/lib/notifications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ScrollProgress from "@/components/scroll-progress"

type CartLine = {
  key: string
  room: Room
  occupancy: string
  guests: number
  extraBed: boolean
}

function occupancyOptionsForRoom(room: Room) {
  return OCCUPANCY_TYPES.filter((option) => option.pax <= room.capacity)
}

function defaultOccupancyForRoom(room: Room) {
  const options = occupancyOptionsForRoom(room)
  return options.find((option) => option.value === "DBL")?.value || options[0]?.value || "SGL"
}

export default function BookingPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingRef, setBookingRef] = useState<string>("")
  const [formData, setFormData] = useState({
    guest: "",
    email: "",
    phone: "",
    checkin: "",
    checkout: "",
    bookingType: "EP",
    specialRequests: "",
  })

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      const roomsData = await fetchRooms()
      const availableRooms = roomsData.filter((r: Room) => r.status === "Available" && isGuestFacingRoom(r))
      setRooms(availableRooms)
    } catch (error) {
      console.error('Failed to load rooms:', error)
    }
  }

  const calculateNights = () => {
    if (!formData.checkin || !formData.checkout) return 0
    const start = new Date(formData.checkin)
    const end = new Date(formData.checkout)
    const diff = end.getTime() - start.getTime()
    return Math.ceil(diff / (1000 * 3600 * 24))
  }

  const lineTotal = (line: CartLine) => calculateNights() * parseFloat(line.room.price)

  const calculateTotal = () => cart.reduce((sum, line) => sum + lineTotal(line), 0)

  const totalGuests = () => cart.reduce((sum, line) => sum + line.guests, 0)

  const cartCurrency = cart[0]?.room.currency || "NPR"

  const addRoomToCart = (room: Room) => {
    if (cart.length > 0 && (cart[0].room.currency || "NPR") !== (room.currency || "NPR")) {
      alert(`⚠️ All rooms in one booking must use the same currency (${currencySymbol(cart[0].room.currency)}). Please submit a separate booking for rooms priced in a different currency.`)
      return
    }
    setCart((prev) => [
      ...prev,
      {
        key: `${room.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        room,
        occupancy: defaultOccupancyForRoom(room),
        guests: Math.min(2, room.capacity),
        extraBed: false,
      },
    ])
  }

  const removeCartLine = (key: string) => {
    setCart((prev) => prev.filter((line) => line.key !== key))
  }

  const updateCartLine = (key: string, patch: Partial<CartLine>) => {
    setCart((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cart.length === 0) {
      alert("⚠️ Please add at least one room to your booking")
      return
    }

    const checkinDate = new Date(formData.checkin)
    const checkoutDate = new Date(formData.checkout)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    checkinDate.setHours(0, 0, 0, 0)
    checkoutDate.setHours(0, 0, 0, 0)

    if (!formData.checkin || !formData.checkout) {
      alert("⚠️ Please select check-in and check-out dates")
      return
    }

    if (checkoutDate <= checkinDate) {
      alert("⚠️ Check-out date must be after check-in date!")
      return
    }

    if (checkinDate < today) {
      alert("⚠️ Check-in date cannot be in the past!")
      return
    }

    const nights = calculateNights()
    if (nights < 1) {
      alert("⚠️ Minimum stay is 1 night!")
      return
    }

    for (const line of cart) {
      if (line.guests > line.room.capacity) {
        alert(`⚠️ ${line.room.name} can accommodate a maximum of ${line.room.capacity} guests.`)
        return
      }
    }

    if (!formData.email.includes("@")) {
      alert("⚠️ Please enter a valid email address")
      return
    }

    if (formData.phone.length < 10) {
      alert("⚠️ Please enter a valid phone number")
      return
    }

    const roomsPayload = cart.map((line) => ({
      room: line.room.name,
      occupancy: line.occupancy,
      numberOfGuests: line.guests,
      extraBed: line.extraBed,
      price: String(lineTotal(line)),
    }))

    const sharedFields = {
      guest: formData.guest,
      email: formData.email,
      phone: formData.phone,
      checkin: formData.checkin,
      checkout: formData.checkout,
      status: "Pending",
      bookingSource: "website",
      bookingType: formData.bookingType,
      currency: cartCurrency,
      numberOfGuests: totalGuests(),
      notes: formData.specialRequests || null,
    }

    const payload = cart.length > 1
      ? { ...sharedFields, rooms: roomsPayload }
      : { ...sharedFields, ...roomsPayload[0] }

    try {
      const result = await createBooking(payload)
      const created = Array.isArray(result) ? result : [result]
      const reference = created.length > 1
        ? created[0]?.groupId || created.map((b: any) => b.bookingId).join(", ")
        : created[0]?.bookingId || created[0]?.id

      const roomSummary = cart.map((line) => line.room.name).join(", ")
      addNotification(
        "booking",
        "🌐 New Website Booking",
        `${formData.guest} - ${roomSummary} (${formData.checkin} to ${formData.checkout})`,
        "high",
        "bookings"
      )

      setBookingRef(String(reference))
      setBookingComplete(true)
    } catch (error) {
      console.error('Failed to create booking:', error)
      alert('Failed to create booking. Please try again.')
    }
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-50 flex items-center justify-center p-4 animate-in fade-in duration-700">
        <ScrollProgress />
        <Card className="max-w-lg w-full shadow-2xl border-2 border-green-100 animate-in zoom-in duration-500">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-700 delay-200 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white animate-pulse" />
            </div>
            <CardTitle className="text-3xl font-display bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent animate-in slide-in-from-bottom duration-500 delay-300">
              Booking Request Submitted!
            </CardTitle>
            <CardDescription className="text-lg mt-2 animate-in slide-in-from-bottom duration-500 delay-400">
              Your journey to paradise begins
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 animate-in slide-in-from-bottom duration-500 delay-500">
            <div className="bg-gradient-to-br from-green-50 to-yellow-50 rounded-xl p-6 space-y-3 border-2 border-green-200 shadow-inner">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Booking Reference
              </p>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
                #{bookingRef}
              </p>
            </div>

            <div className="space-y-3 bg-white rounded-xl p-6 border border-green-100">
              <p className="font-semibold flex items-center gap-2 text-green-700">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                What's Next?
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>We'll review your booking request</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Confirmation email within 24 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Check your booking status anytime</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 space-y-3">
              <Link href={`/booking/status?email=${encodeURIComponent(formData.email)}`} className="block">
                <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-300" size="lg">
                  Check Booking Status
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button className="w-full" variant="outline" size="lg">
                  Return to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-50">
      <ScrollProgress />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-600 to-yellow-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 shrink-0">
              <span className="text-white font-display text-xl font-bold">D</span>
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-green-700 text-sm sm:text-lg truncate">Dhampus Eco Lodge</p>
              <p className="text-xs text-yellow-600 hidden sm:block">Luxury Himalayan Retreat</p>
            </div>
          </Link>
          <Link href="/booking/status" className="shrink-0">
            <Button variant="outline" size="sm" className="border-green-600 text-green-700 hover:bg-green-50 transition-all duration-300">
              Status
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-block mb-4">
            <span className="text-yellow-500 text-4xl animate-pulse">✨</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-display font-bold bg-gradient-to-r from-green-700 via-yellow-600 to-green-700 bg-clip-text text-transparent mb-4 animate-in slide-in-from-bottom duration-700 delay-100">
            Book Your Himalayan Escape
          </h1>
          <p className="text-base sm:text-xl text-gray-600 animate-in slide-in-from-bottom duration-700 delay-200">
            Experience luxury nestled in the heart of the Himalayas
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 animate-in fade-in slide-in-from-left duration-700 delay-300">
            <Card className="shadow-2xl border-2 border-green-100 hover:shadow-3xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-green-50 to-yellow-50 border-b border-green-100">
                <CardTitle className="text-2xl flex items-center gap-2 text-green-700">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  Booking Details
                </CardTitle>
                <CardDescription>Fill in your information to reserve your luxurious stay</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Guest Information */}
                  <div className="space-y-4 p-6 bg-gradient-to-br from-green-50/50 to-yellow-50/50 rounded-xl border border-green-100">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-green-700">
                      <User size={20} className="text-yellow-600" />
                      Guest Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="guest" className="text-gray-700">Full Name *</Label>
                        <Input
                          id="guest"
                          value={formData.guest}
                          onChange={(e) => setFormData({ ...formData, guest: e.target.value })}
                          required
                          placeholder="John Doe"
                          className="border-green-200 focus:border-green-500 focus:ring-green-500 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          placeholder="john@example.com"
                          className="border-green-200 focus:border-green-500 focus:ring-green-500 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="phone" className="text-gray-700">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          placeholder="+1 234 567 8900"
                          className="border-green-200 focus:border-green-500 focus:ring-green-500 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stay Dates */}
                  <div className="space-y-4 p-6 bg-gradient-to-br from-yellow-50/50 to-green-50/50 rounded-xl border border-yellow-100">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-green-700">
                      <Calendar size={20} className="text-yellow-600" />
                      Stay Dates
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkin" className="text-gray-700">Check-in Date *</Label>
                        <Input
                          id="checkin"
                          type="date"
                          value={formData.checkin}
                          onChange={(e) => setFormData({ ...formData, checkin: e.target.value })}
                          min={new Date().toISOString().split("T")[0]}
                          required
                          className="border-yellow-200 focus:border-yellow-500 focus:ring-yellow-500 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkout" className="text-gray-700">Check-out Date *</Label>
                        <Input
                          id="checkout"
                          type="date"
                          value={formData.checkout}
                          onChange={(e) => setFormData({ ...formData, checkout: e.target.value })}
                          min={formData.checkin || new Date().toISOString().split("T")[0]}
                          required
                          className="border-yellow-200 focus:border-yellow-500 focus:ring-yellow-500 transition-all duration-300"
                        />
                      </div>
                    </div>
                    {calculateNights() > 0 && (
                      <div className="bg-white rounded-lg p-4 border-2 border-green-200 animate-in fade-in slide-in-from-left duration-300">
                        <p className="text-sm text-gray-600 flex items-center justify-between">
                          <span>Total nights:</span>
                          <span className="text-2xl font-bold text-green-600">{calculateNights()}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Meal Plan */}
                  <div className="space-y-3 p-6 bg-gradient-to-br from-green-50/50 to-yellow-50/50 rounded-xl border border-green-100">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-green-700">
                      <UtensilsCrossed size={20} className="text-yellow-600" />
                      Meal Plan
                    </h3>
                    <Select
                      value={formData.bookingType}
                      onValueChange={(value) => setFormData({ ...formData, bookingType: value })}
                    >
                      <SelectTrigger className="border-green-200 focus:border-green-500 focus:ring-green-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEAL_PLANS.map((plan) => (
                          <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Room rate shown below is for accommodation only — our team will confirm any meal plan surcharge with you.
                    </p>
                  </div>

                  {/* Room Selection */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-xl flex items-center gap-2 text-green-700">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      Choose Your Rooms *
                    </h3>
                    <div className="grid gap-4">
                      {rooms.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No rooms available at the moment.</p>
                      ) : (
                        rooms.map((room) => (
                          <div
                            key={room.id}
                            className="group border-2 rounded-xl p-5 transition-all duration-300 border-gray-200 hover:border-green-300 hover:shadow-md"
                          >
                            <div className="flex items-start gap-4">
                              <img
                                src={room.image}
                                alt={room.name}
                                className="w-32 h-32 object-cover rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300"
                              />
                              <div className="flex-1">
                                <h4 className="font-bold text-xl text-green-700 mb-2">{room.name}</h4>
                                <p className="text-sm text-gray-600 mb-3">{room.description}</p>
                                <div className="flex flex-wrap items-center gap-4">
                                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
                                    {currencySymbol(room.currency)} {room.price}<span className="text-base text-gray-500">/night</span>
                                  </p>
                                  <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Users size={16} />
                                    {room.capacity} guests
                                  </p>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => addRoomToCart(room)}
                                    className="ml-auto bg-green-600 hover:bg-green-700"
                                  >
                                    <Plus size={16} className="mr-1" />
                                    Add Room
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Selected Rooms Cart */}
                  {cart.length > 0 && (
                    <div className="space-y-4 p-6 bg-gradient-to-br from-yellow-50/50 to-green-50/50 rounded-xl border-2 border-green-200">
                      <h3 className="font-semibold text-lg flex items-center gap-2 text-green-700">
                        <BedDouble size={20} className="text-yellow-600" />
                        Your Selected Rooms
                      </h3>
                      <div className="space-y-3">
                        {cart.map((line, index) => (
                          <div key={line.key} className="bg-white rounded-xl border border-green-100 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-green-700">Room {index + 1}: {line.room.name}</p>
                              <button
                                type="button"
                                onClick={() => removeCartLine(line.key)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                                aria-label={`Remove ${line.room.name}`}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                            <div className="grid sm:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Occupancy</Label>
                                <Select
                                  value={line.occupancy}
                                  onValueChange={(value) => updateCartLine(line.key, { occupancy: value })}
                                >
                                  <SelectTrigger className="border-green-200 h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {occupancyOptionsForRoom(line.room).map((option) => (
                                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Guests in this room</Label>
                                <Select
                                  value={String(line.guests)}
                                  onValueChange={(value) => updateCartLine(line.key, { guests: parseInt(value) })}
                                >
                                  <SelectTrigger className="border-green-200 h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: line.room.capacity }, (_, i) => i + 1).map((num) => (
                                      <SelectItem key={num} value={String(num)}>{num} {num === 1 ? "Guest" : "Guests"}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-end pb-1">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={line.extraBed}
                                    onChange={(e) => updateCartLine(line.key, { extraBed: e.target.checked })}
                                    className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                                  />
                                  Add extra bed
                                </label>
                              </div>
                            </div>
                            {calculateNights() > 0 && (
                              <p className="text-right text-sm text-gray-600">
                                Subtotal: <span className="font-semibold text-green-700">{currencySymbol(line.room.currency)} {lineTotal(line)}</span>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Extra bed charges (if any) will be confirmed by our team based on room type.
                      </p>
                    </div>
                  )}

                  {/* Special Requests */}
                  <div className="space-y-2">
                    <Label htmlFor="requests" className="text-gray-700 text-lg">Special Requests (Optional)</Label>
                    <textarea
                      id="requests"
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      className="w-full min-h-[100px] px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                      placeholder="Dietary preferences, celebrations/occasions, expected arrival time, transport or activity requests, or anything else we should know..."
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    size="lg"
                    disabled={cart.length === 0}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Submit Booking Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1 animate-in fade-in slide-in-from-right duration-700 delay-400">
            <Card className="sticky top-24 shadow-2xl border-2 border-green-100">
              <CardHeader className="bg-gradient-to-r from-green-50 to-yellow-50 border-b border-green-100">
                <CardTitle className="text-xl text-green-700">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {cart.length > 0 ? (
                  <>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-yellow-50 rounded-xl border border-green-200 space-y-2">
                      <p className="text-sm text-gray-600">Selected Rooms</p>
                      {cart.map((line) => (
                        <p key={line.key} className="font-bold text-green-700">
                          {line.room.name} <span className="font-normal text-sm text-gray-600">({line.occupancy}{line.extraBed ? " + extra bed" : ""})</span>
                        </p>
                      ))}
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-green-100 flex justify-between items-center">
                      <p className="text-sm text-gray-600">Meal Plan</p>
                      <p className="font-semibold text-green-700">{formData.bookingType}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-green-100 flex justify-between items-center">
                      <p className="text-sm text-gray-600">Total Guests</p>
                      <p className="font-semibold text-green-700">{totalGuests()}</p>
                    </div>
                    {formData.checkin && formData.checkout && (
                      <>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-100">
                            <p className="text-sm text-gray-600">Check-in</p>
                            <p className="font-semibold text-green-700">
                              {new Date(formData.checkin).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-100">
                            <p className="text-sm text-gray-600">Check-out</p>
                            <p className="font-semibold text-green-700">
                              {new Date(formData.checkout).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg border-2 border-yellow-200">
                            <p className="text-sm text-gray-600">Nights</p>
                            <p className="font-bold text-xl text-green-700">{calculateNights()}</p>
                          </div>
                        </div>
                        <div className="border-t-2 border-green-100 pt-4 space-y-3">
                          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-600 to-yellow-600 rounded-xl shadow-lg">
                            <p className="text-white font-bold text-lg">Total</p>
                            <p className="text-white font-bold text-2xl">{currencySymbol(cartCurrency)} {calculateTotal()}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-3 animate-pulse" />
                    <p className="text-gray-500">Add a room to see pricing</p>
                  </div>
                )}

                <div className="border-t-2 border-green-100 pt-4 space-y-3">
                  <p className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Free cancellation up to 24 hours before check-in</span>
                  </p>
                  <p className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>No payment required now</span>
                  </p>
                  <p className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Confirmation within 24 hours</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
