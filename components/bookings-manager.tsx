"use client"

import { useState, useEffect } from "react"
import { Trash2, Edit, Plus, CheckCircle, X, DoorOpen } from "lucide-react"
import { getBookings, addBooking, updateBooking, deleteBooking, getRooms, getAvailableRoomNumbers, type Booking } from "@/lib/storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function BookingsManager() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<string[]>([])
  const [availableRoomNumbers, setAvailableRoomNumbers] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRoomAssignDialogOpen, setIsRoomAssignDialogOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: number; status: "Confirmed" | "Pending" | "Cancelled" | "Checked Out" } | null>(null)
  const [formData, setFormData] = useState({
    guest: "",
    email: "",
    phone: "",
    room: "",
    roomNumber: "",
    checkin: "",
    checkout: "",
    price: "",
    status: "Pending" as "Confirmed" | "Pending" | "Cancelled" | "Checked Out",
    bookingSource: "phone" as "website" | "phone" | "walkin",
  })
  const [quickRoomAssign, setQuickRoomAssign] = useState("")

  useEffect(() => {
    setBookings(getBookings())
    const roomList = getRooms().map((r) => r.name)
    setRooms(roomList)
  }, [])

  // Update available room numbers when room changes
  useEffect(() => {
    if (formData.room) {
      const allRooms = getRooms()
      const selectedRoom = allRooms.find((r) => r.name === formData.room)
      if (selectedRoom) {
        const available = getAvailableRoomNumbers(
          selectedRoom.id, 
          editingBooking?.id,
          formData.checkin,
          formData.checkout
        )
        setAvailableRoomNumbers(available)
      }
    } else {
      setAvailableRoomNumbers([])
    }
  }, [formData.room, formData.checkin, formData.checkout, editingBooking])

  // Update available room numbers when quick assign dialog opens
  useEffect(() => {
    if (isRoomAssignDialogOpen && editingBooking) {
      const allRooms = getRooms()
      const selectedRoom = allRooms.find((r) => r.name === editingBooking.room)
      if (selectedRoom) {
        const available = getAvailableRoomNumbers(
          selectedRoom.id,
          editingBooking.id,
          editingBooking.checkin,
          editingBooking.checkout
        )
        setAvailableRoomNumbers(available)
      }
    }
  }, [isRoomAssignDialogOpen, editingBooking])

  const handleOpenDialog = (booking?: Booking) => {
    if (booking) {
      setEditingBooking(booking)
      setFormData({
        guest: booking.guest,
        email: booking.email || "",
        phone: booking.phone || "",
        room: booking.room,
        roomNumber: booking.roomNumber || "",
        checkin: booking.checkin,
        checkout: booking.checkout,
        price: booking.price,
        status: booking.status,
        bookingSource: booking.bookingSource || "phone",
      })
    } else {
      setEditingBooking(null)
      setFormData({
        guest: "",
        email: "",
        phone: "",
        room: rooms[0] || "",
        roomNumber: "",
        checkin: "",
        checkout: "",
        price: "",
        status: "Pending",
        bookingSource: "phone",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate dates
    const checkinDate = new Date(formData.checkin)
    const checkoutDate = new Date(formData.checkout)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    checkinDate.setHours(0, 0, 0, 0)
    checkoutDate.setHours(0, 0, 0, 0)

    // Check if checkout is after checkin
    if (checkoutDate <= checkinDate) {
      alert("⚠️ Check-out date must be after check-in date!")
      return
    }

    // Check if dates are in the past (only for new bookings)
    if (!editingBooking && checkinDate < today) {
      alert("⚠️ Check-in date cannot be in the past!")
      return
    }

    // Calculate minimum 1 night stay
    const nights = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24))
    if (nights < 1) {
      alert("⚠️ Minimum stay is 1 night!")
      return
    }

    // Validate price
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert("⚠️ Please enter a valid price!")
      return
    }

    // Validate room number if status is Confirmed
    if (formData.status === "Confirmed" && !formData.roomNumber) {
      alert("⚠️ Please assign a room number before confirming the booking!")
      return
    }

    // Check for room conflicts if room number is assigned
    if (formData.roomNumber) {
      const conflictingBooking = bookings.find((b) => {
        if (b.id === editingBooking?.id) return false // Skip current booking
        if (!b.roomNumber || b.roomNumber !== formData.roomNumber) return false
        if (b.status === "Cancelled" || b.status === "Checked Out") return false

        // Check date overlap
        const bCheckin = new Date(b.checkin)
        const bCheckout = new Date(b.checkout)
        bCheckin.setHours(0, 0, 0, 0)
        bCheckout.setHours(0, 0, 0, 0)

        return (
          (checkinDate >= bCheckin && checkinDate < bCheckout) ||
          (checkoutDate > bCheckin && checkoutDate <= bCheckout) ||
          (checkinDate <= bCheckin && checkoutDate >= bCheckout)
        )
      })

      if (conflictingBooking) {
        alert(
          `⚠️ Room ${formData.roomNumber} is already booked from ${conflictingBooking.checkin} to ${conflictingBooking.checkout}!\n\nGuest: ${conflictingBooking.guest}\nPlease select a different room or change the dates.`
        )
        return
      }
    }

    const bookingData = {
      guest: formData.guest,
      email: formData.email,
      phone: formData.phone,
      room: formData.room,
      roomNumber: formData.roomNumber,
      checkin: formData.checkin,
      checkout: formData.checkout,
      price: formData.price,
      status: formData.status,
      bookingSource: formData.bookingSource,
    }

    if (editingBooking) {
      updateBooking(editingBooking.id, bookingData)
    } else {
      addBooking(bookingData)
    }

    setBookings(getBookings())
    setIsDialogOpen(false)
    setEditingBooking(null)
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this booking?")) {
      deleteBooking(id)
      setBookings(getBookings())
    }
  }

  const handleStatusChange = (id: number, status: "Confirmed" | "Pending" | "Cancelled" | "Checked Out") => {
    // If confirming, check if room number is assigned
    if (status === "Confirmed") {
      const booking = bookings.find((b) => b.id === id)
      if (booking && !booking.roomNumber) {
        // Set states - useEffect will handle loading room numbers
        setPendingStatusChange({ id, status })
        setEditingBooking(booking)
        setIsRoomAssignDialogOpen(true)
        return
      }
    }
    
    updateBooking(id, { status })
    setBookings(getBookings())
  }

  const handleQuickRoomAssign = () => {
    if (!quickRoomAssign || !pendingStatusChange || !editingBooking) return
    
    // Assign room number and update status
    updateBooking(pendingStatusChange.id, {
      roomNumber: quickRoomAssign,
      status: pendingStatusChange.status,
    })
    
    setBookings(getBookings())
    setIsRoomAssignDialogOpen(false)
    setPendingStatusChange(null)
    setEditingBooking(null)
    setQuickRoomAssign("")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Bookings Management</h2>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus size={20} />
          Add Booking
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Guest</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Room</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Room #</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Dates</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Source</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.guest}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex flex-col">
                      {booking.email && <span className="text-xs">{booking.email}</span>}
                      {booking.phone && <span className="text-xs">{booking.phone}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{booking.room}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-primary">
                    {booking.roomNumber || <span className="text-gray-400">Not assigned</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex flex-col">
                      <span className="text-xs">{booking.checkin}</span>
                      <span className="text-xs">{booking.checkout}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">${booking.price}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      booking.bookingSource === "website" ? "bg-blue-100 text-blue-700" :
                      booking.bookingSource === "phone" ? "bg-purple-100 text-purple-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {booking.bookingSource || "phone"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Select
                      value={booking.status}
                      onValueChange={(value) =>
                        handleStatusChange(booking.id, value as "Confirmed" | "Pending" | "Cancelled" | "Checked Out")
                      }
                    >
                      <SelectTrigger className="w-[130px]">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center w-fit ${
                            booking.status === "Confirmed"
                              ? "bg-green-100 text-green-700"
                              : booking.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : booking.status === "Checked Out"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
                          }`}
                        >
                          <CheckCircle size={14} className="mr-1" />
                          {booking.status}
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                        <SelectItem value="Checked Out">Checked Out</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2 flex">
                    <button
                      onClick={() => handleOpenDialog(booking)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(booking.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBooking ? "Edit Booking" : "Add New Booking"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guest">Guest Name *</Label>
                <Input
                  id="guest"
                  value={formData.guest}
                  onChange={(e) => setFormData({ ...formData, guest: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room *</Label>
                <Select value={formData.room} onValueChange={(value) => setFormData({ ...formData, room: value, roomNumber: "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room} value={room}>
                        {room}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomNumber">
                  Room Number {formData.status === "Confirmed" && <span className="text-red-500">*</span>}
                </Label>
                <Select value={formData.roomNumber} onValueChange={(value) => setFormData({ ...formData, roomNumber: value })}>
                  <SelectTrigger className={formData.status === "Confirmed" && !formData.roomNumber ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select room #" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoomNumbers.length > 0 ? (
                      availableRoomNumbers.map((num) => (
                        <SelectItem key={num} value={num}>
                          {num}
                        </SelectItem>
                      ))
                    ) : (
                      // Use a non-empty sentinel value to satisfy Radix Select requirements
                      <SelectItem value="no-rooms" disabled>
                        No rooms available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formData.status === "Confirmed" && !formData.roomNumber && (
                  <p className="text-xs text-red-500">Room number required for confirmed bookings</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkin">Check-in *</Label>
                <Input
                  id="checkin"
                  type="date"
                  value={formData.checkin}
                  onChange={(e) => setFormData({ ...formData, checkin: e.target.value })}
                  min={editingBooking ? undefined : new Date().toISOString().split("T")[0]}
                  required
                />
                {!editingBooking && (
                  <p className="text-xs text-gray-500">Minimum: Today</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout">Check-out *</Label>
                <Input
                  id="checkout"
                  type="date"
                  value={formData.checkout}
                  onChange={(e) => setFormData({ ...formData, checkout: e.target.value })}
                  min={formData.checkin || new Date().toISOString().split("T")[0]}
                  required
                />
                <p className="text-xs text-gray-500">Must be after check-in</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Total Price *</Label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-gray-100 border border-r-0 rounded-l-md">$</span>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="rounded-l-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as "Confirmed" | "Pending" | "Cancelled" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Checked Out">Checked Out</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookingSource">Booking Source *</Label>
                <Select
                  value={formData.bookingSource}
                  onValueChange={(value) =>
                    setFormData({ ...formData, bookingSource: value as "website" | "phone" | "walkin" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="walkin">Walk-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingBooking ? "Update Booking" : "Add Booking"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Room Assignment Dialog */}
      <Dialog open={isRoomAssignDialogOpen} onOpenChange={setIsRoomAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Room Number</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingBooking && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-blue-900">Booking Details:</p>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><span className="font-medium">Guest:</span> {editingBooking.guest}</p>
                    <p><span className="font-medium">Room Type:</span> {editingBooking.room}</p>
                    <p><span className="font-medium">Dates:</span> {editingBooking.checkin} to {editingBooking.checkout}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quickRoomNumber">Select Room Number *</Label>
                  <Select value={quickRoomAssign} onValueChange={setQuickRoomAssign}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose available room..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoomNumbers.length > 0 ? (
                        availableRoomNumbers.map((num) => (
                          <SelectItem key={num} value={num}>
                            Room {num}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-rooms" disabled>
                          No rooms available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {availableRoomNumbers.length === 0 && (
                    <p className="text-xs text-red-500">
                      No rooms available for this type. Add room numbers in Room Numbers tab.
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsRoomAssignDialogOpen(false)
                      setPendingStatusChange(null)
                      setQuickRoomAssign("")
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleQuickRoomAssign}
                    disabled={!quickRoomAssign || quickRoomAssign === "no-rooms"}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Assign & Confirm
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
