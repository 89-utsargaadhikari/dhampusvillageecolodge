"use client"

import { useState, useEffect } from "react"
import { Plus, Building2, Users, X } from "lucide-react"
import { AdminSearch, matchesSearch } from "@/components/admin-search"
import { fetchBusinesses, fetchBookings, createBooking, fetchRooms, fetchRoomInventory, fetchBusinessRates } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CURRENCIES, MEAL_PLANS, OCCUPANCY_TYPES, currencySymbol, formatMoney, mealPlanLabel, picklistRoomTypes } from "@/lib/hotel"
import { lookupPartnerRate, partnerCurrencies, preferredPartnerCurrency, type RateCardRow } from "@/lib/rate-cards"
import { AdminLoading, useAdminLoader } from "@/components/admin-loading"

interface Business {
  id: number
  name: string
  phone: string
  email?: string | null
}

interface RoomBooking {
  room: string
  roomNumber: string
  price: string
}

export default function BusinessBookings() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [partnerSearch, setPartnerSearch] = useState("")
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [availableRoomNumbers, setAvailableRoomNumbers] = useState<{ [key: number]: string[] }>({})
  const [partnerRates, setPartnerRates] = useState<RateCardRow[]>([])
  const { loading, run } = useAdminLoader()
  
  const [formData, setFormData] = useState({
    businessId: "",
    guest: "",
    phone: "",
    email: "",
    numberOfGuests: "1",
    bookingType: "EP",
    occupancy: "SGL",
    currency: "NPR",
    extraBed: false,
    rooms: [{ room: "", roomNumber: "", price: "" }] as RoomBooking[],
    checkin: "",
    checkout: "",
    status: "Confirmed"
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await run(async () => {
        const [businessesData, bookingsData, roomsData] = await Promise.all([
          fetchBusinesses(),
          fetchBookings(),
          fetchRooms()
        ])
        setBusinesses(businessesData.filter((b: any) => b.active))
        setBookings(bookingsData.filter((b: any) => b.bookingSource === "business"))
        setRooms(roomsData)
      })
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const loadAvailableRoomsForIndex = async (index: number, roomName: string) => {
    if (!formData.checkin || !formData.checkout) return

    try {
      const [roomsData, inventoryData, bookingsData] = await Promise.all([
        fetchRooms(),
        fetchRoomInventory(),
        fetchBookings()
      ])
      
      const selectedRoom = roomsData.find((r: any) => r.name === roomName)
      if (!selectedRoom) return
      
      const roomNumbersForType = inventoryData
        .filter((inv: any) => inv.roomTypeId === selectedRoom.id)
        .map((inv: any) => inv.roomNumber)
      
      const checkin = new Date(formData.checkin)
      const checkout = new Date(formData.checkout)
      
      const available = roomNumbersForType.filter((roomNum: string) => {
        const hasConflict = bookingsData.some((booking: any) => {
          if (booking.status === "Cancelled" || booking.status === "Checked Out") return false
          if (booking.roomNumber !== roomNum) return false
          
          const bookingCheckin = new Date(booking.checkin)
          const bookingCheckout = new Date(booking.checkout)
          
          return checkin < bookingCheckout && checkout > bookingCheckin
        })
        
        return !hasConflict
      })
      
      setAvailableRoomNumbers(prev => ({ ...prev, [index]: available }))
    } catch (error) {
      console.error('Failed to load available rooms:', error)
    }
  }

  const handleOpenDialog = () => {
    setFormData({
      businessId: "",
      guest: "",
      phone: "",
      email: "",
      numberOfGuests: "1",
      bookingType: "EP",
      occupancy: "SGL",
      currency: "NPR",
      extraBed: false,
      rooms: [{ room: "", roomNumber: "", price: "" }],
      checkin: "",
      checkout: "",
      status: "Confirmed"
    })
    setSelectedBusiness(null)
    setPartnerRates([])
    setAvailableRoomNumbers({})
    setIsDialogOpen(true)
  }

  const rateForRoom = (roomName: string, occupancy = formData.occupancy, mealPlan = formData.bookingType, currency = formData.currency, cards = partnerRates) => {
    const rate = lookupPartnerRate(cards, { roomType: roomName, mealPlan, currency, occupancy })
    return rate == null ? "" : String(rate)
  }

  const applyRatesToRooms = (rooms: RoomBooking[], occupancy: string, mealPlan: string, currency: string, cards = partnerRates) => {
    return rooms.map((room) => ({
      ...room,
      price: room.room ? rateForRoom(room.room, occupancy, mealPlan, currency, cards) || room.price : room.price,
    }))
  }

  const handleBusinessSelect = async (businessId: string) => {
    const business = businesses.find(b => b.id.toString() === businessId)
    setSelectedBusiness(business || null)
    try {
      const cards = await fetchBusinessRates(businessId)
      setPartnerRates(cards)
      const currency = preferredPartnerCurrency(cards, formData.currency)
      setFormData({
        ...formData,
        businessId,
        currency,
        rooms: applyRatesToRooms(formData.rooms, formData.occupancy, formData.bookingType, currency, cards),
      })
    } catch {
      setPartnerRates([])
      setFormData({ ...formData, businessId })
    }
  }

  const handleRoomSelect = (index: number, roomName: string) => {
    const newRooms = [...formData.rooms]
    newRooms[index] = { ...newRooms[index], room: roomName, price: rateForRoom(roomName) }
    setFormData({ ...formData, rooms: newRooms })
    loadAvailableRoomsForIndex(index, roomName)
  }

  const handleRoomNumberSelect = (index: number, roomNumber: string) => {
    const newRooms = [...formData.rooms]
    newRooms[index] = { ...newRooms[index], roomNumber }
    setFormData({ ...formData, rooms: newRooms })
  }

  const addRoom = () => {
    setFormData({
      ...formData,
      rooms: [...formData.rooms, { room: "", roomNumber: "", price: "" }]
    })
  }

  const removeRoom = (index: number) => {
    if (formData.rooms.length > 1) {
      const newRooms = formData.rooms.filter((_, i) => i !== index)
      setFormData({ ...formData, rooms: newRooms })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.businessId) {
      alert("Please select a business partner")
      return
    }

    if (!formData.checkin || !formData.checkout) {
      alert("Please select check-in and check-out dates")
      return
    }

    const checkinDate = new Date(formData.checkin)
    const checkoutDate = new Date(formData.checkout)
    checkinDate.setHours(0, 0, 0, 0)
    checkoutDate.setHours(0, 0, 0, 0)
    if (checkoutDate <= checkinDate) {
      alert("Check-out date must be after check-in date.")
      return
    }

    try {
      const groupId = formData.rooms.length > 1 ? `GRP-${Date.now()}` : null
      const bookingPromises = formData.rooms.map(roomBooking => 
        createBooking({
          businessId: parseInt(formData.businessId),
          guest: formData.guest,
          phone: formData.phone,
          email: formData.email,
          room: roomBooking.room,
          roomNumber: roomBooking.roomNumber || null,
          checkin: formData.checkin,
          checkout: formData.checkout,
          price: String(stayTotalFromNightlyRate(roomBooking.price, formData.checkin, formData.checkout)),
          numberOfGuests: parseInt(formData.numberOfGuests),
          bookingType: formData.bookingType,
          occupancy: formData.occupancy,
          currency: formData.currency,
          extraBed: formData.extraBed,
          groupId,
          status: formData.status,
          bookingSource: "business"
        })
      )

      await Promise.all(bookingPromises)
      await loadData()
      setIsDialogOpen(false)
      alert(`${formData.rooms.length} booking(s) created successfully!`)
    } catch (error) {
      console.error('Failed to create booking:', error)
      alert('Failed to create booking')
    }
  }

  const businessBookingsCount = bookings.length
  const totalRevenue = bookings
    .filter(b => b.status !== "Cancelled")
    .reduce((sum, b) => sum + parseFloat(b.price || 0), 0)

  if (loading) return <AdminLoading label="Loading business bookings..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Business Bookings</h2>
          <p className="text-sm text-muted-foreground">Manage bookings from business partners</p>
        </div>
        <Button onClick={handleOpenDialog} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Create Business Booking
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessBookingsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(totalRevenue, "NPR")}</div>
            <p className="text-xs text-muted-foreground">Sum of stored amounts; mixed currencies are not converted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businesses.length}</div>
          </CardContent>
        </Card>
      </div>

      <AdminSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search guest, company, room..."
      />

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Business Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Guest</th>
                  <th className="text-left p-2">Business</th>
                  <th className="text-left p-2">Room</th>
                  <th className="text-left p-2">Guests</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Check-in</th>
                  <th className="text-left p-2">Check-out</th>
                  <th className="text-left p-2">Price</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.filter((booking) => matchesSearch(
                  searchQuery,
                  booking.guest,
                  booking.room,
                  booking.roomNumber,
                  booking.status,
                  booking.bookingType,
                  businesses.find(b => b.id === booking.businessId)?.name
                )).map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">{booking.guest}</td>
                    <td className="p-2">
                      {businesses.find(b => b.id === booking.businessId)?.name || "N/A"}
                    </td>
                    <td className="p-2">{booking.room} {booking.roomNumber && `#${booking.roomNumber}`}</td>
                    <td className="p-2">{booking.numberOfGuests || "-"}</td>
                    <td className="p-2">
                      {mealPlanLabel(booking.bookingType)} {booking.occupancy ? `• ${booking.occupancy}` : ""}
                    </td>
                    <td className="p-2">{booking.checkin}</td>
                    <td className="p-2">{booking.checkout}</td>
                    <td className="p-2">{formatMoney(booking.price, booking.currency || "NPR")}</td>
                    <td className="p-2">
                      <Badge variant={
                        booking.status === "Confirmed" ? "default" :
                        booking.status === "Pending" ? "secondary" :
                        booking.status === "Checked Out" ? "outline" :
                        "destructive"
                      }>
                        {booking.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No business bookings yet</p>
            )}
            {bookings.length > 0 && bookings.filter((booking) => matchesSearch(
              searchQuery,
              booking.guest,
              booking.room,
              booking.roomNumber,
              booking.status,
              booking.bookingType,
              businesses.find(b => b.id === booking.businessId)?.name
            )).length === 0 && (
              <p className="text-center text-muted-foreground py-8">No bookings match “{searchQuery}”</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Business Booking</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Business Selection */}
            <div>
              <Label htmlFor="businessId">Business Partner *</Label>
              <AdminSearch
                value={partnerSearch}
                onChange={setPartnerSearch}
                placeholder="Search partners..."
                className="mb-2"
              />
              <Select value={formData.businessId} onValueChange={handleBusinessSelect} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.filter((business) => matchesSearch(partnerSearch, business.name)).map((business) => (
                    <SelectItem key={business.id} value={business.id.toString()}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBusiness && (
              <Card className="bg-muted">
                <CardContent className="pt-4">
                  <p className="text-sm"><strong>Business:</strong> {selectedBusiness.name}</p>
                  <p className="text-sm"><strong>Contact:</strong> {selectedBusiness.phone}</p>
                </CardContent>
              </Card>
            )}

            {/* Guest Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guest">Guest/Tourist Name *</Label>
                <Input
                  id="guest"
                  value={formData.guest}
                  onChange={(e) => setFormData({ ...formData, guest: e.target.value })}
                  placeholder="Tourist name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Guest Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Tourist phone number"
                />
              </div>
              <div>
                <Label htmlFor="email">Guest Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Tourist email"
                />
              </div>
              <div>
                <Label htmlFor="numberOfGuests">Number of Guests *</Label>
                <Input
                  id="numberOfGuests"
                  type="number"
                  min="1"
                  value={formData.numberOfGuests}
                  onChange={(e) => {
                    const pax = Math.max(1, parseInt(e.target.value) || 1)
                    setFormData({
                      ...formData,
                      numberOfGuests: String(pax),
                      occupancy: occupancyForPax(pax, formData.occupancy),
                    })
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="bookingType">Meal Plan *</Label>
                <Select 
                  value={formData.bookingType} 
                  onValueChange={(value) => setFormData({ ...formData, bookingType: value, rooms: applyRatesToRooms(formData.rooms, formData.occupancy, value, formData.currency) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_PLANS.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Occupancy</Label>
                <Select
                  value={formData.occupancy}
                  onValueChange={(value) => setFormData({ ...formData, occupancy: value, rooms: applyRatesToRooms(formData.rooms, value, formData.bookingType, formData.currency) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCUPANCY_TYPES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value, rooms: applyRatesToRooms(formData.rooms, formData.occupancy, formData.bookingType, value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(partnerCurrencies(partnerRates).length ? partnerCurrencies(partnerRates) : CURRENCIES.map((item) => item.value)).map((value) => {
                      const item = CURRENCIES.find((currency) => currency.value === value) || { value, label: value }
                      return <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    })}
                    {partnerCurrencies(partnerRates).length > 0 &&
                      CURRENCIES.filter((item) => !partnerCurrencies(partnerRates).includes(item.value)).map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label} (no partner card)</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkin">Check-in Date *</Label>
                <Input
                  id="checkin"
                  type="date"
                  value={formData.checkin}
                  onChange={(e) => setFormData({ ...formData, checkin: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="checkout">Check-out Date *</Label>
                <Input
                  id="checkout"
                  type="date"
                  value={formData.checkout}
                  onChange={(e) => setFormData({ ...formData, checkout: e.target.value })}
                  required
                />
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Stay: <span className="font-semibold">{stayNightsAndDays(formData.checkin, formData.checkout).label}</span>
            </p>

            {/* Multiple Rooms */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Rooms *</Label>
                <Button type="button" size="sm" onClick={addRoom}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room
                </Button>
              </div>

              {formData.rooms.map((roomBooking, index) => (
                <Card key={index}>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">Room {index + 1}</h4>
                      {formData.rooms.length > 1 && (
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => removeRoom(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Room Type *</Label>
                        <Select 
                          value={roomBooking.room} 
                          onValueChange={(value) => handleRoomSelect(index, value)} 
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select room type" />
                          </SelectTrigger>
                          <SelectContent>
                            {picklistRoomTypes(rooms, roomBooking.room).map((room) => (
                              <SelectItem key={room.id} value={room.name}>
                                {room.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Room Number</Label>
                        <Select 
                          value={roomBooking.roomNumber || ""} 
                          onValueChange={(value) => handleRoomNumberSelect(index, value)}
                          disabled={!roomBooking.room || !formData.checkin || !formData.checkout}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Auto-assign" />
                          </SelectTrigger>
                          <SelectContent>
                            {(availableRoomNumbers[index] || []).length > 0 ? (
                              (availableRoomNumbers[index] || []).map((num) => (
                                <SelectItem key={num} value={num}>
                                  Room {num}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                {!roomBooking.room ? "Select room type first" : 
                                 !formData.checkin || !formData.checkout ? "Select dates first" : 
                                 "No rooms available"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Rate ({currencySymbol(formData.currency)}) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={roomBooking.price}
                          onChange={(e) => {
                            const newRooms = [...formData.rooms]
                            newRooms[index] = { ...newRooms[index], price: e.target.value }
                            setFormData({ ...formData, rooms: newRooms })
                          }}
                          required
                        />
                        {formData.checkin && formData.checkout ? (
                          <p className="text-xs text-muted-foreground mt-1">
                            {stayNightsCount(formData.checkin, formData.checkout)} night{stayNightsCount(formData.checkin, formData.checkout) === 1 ? "" : "s"} × {formatMoney(roomBooking.price || 0, formData.currency)} = {formatMoney(stayTotalFromNightlyRate(roomBooking.price, formData.checkin, formData.checkout), formData.currency)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {formData.checkin && formData.checkout ? (
                <div className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Stay total ({stayNightsCount(formData.checkin, formData.checkout)} night{stayNightsCount(formData.checkin, formData.checkout) === 1 ? "" : "s"})
                  </span>
                  <span className="font-semibold">
                    {formatMoney(
                      formData.rooms.reduce((sum, roomBooking) => sum + stayTotalFromNightlyRate(roomBooking.price, formData.checkin, formData.checkout), 0),
                      formData.currency
                    )}
                  </span>
                </div>
              ) : null}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Booking{formData.rooms.length > 1 ? 's' : ''}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
