"use client"

import { useState, useEffect } from "react"
import { Building2, BedDouble, Users, AlertCircle, CheckCircle, Clock, Wrench, Sparkles, Calendar } from "lucide-react"
import { type Room, type Booking } from "@/lib/storage"
import { fetchRooms, fetchBookings, fetchRoomInventory } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type RoomStatus = "available" | "occupied" | "checkout-today" | "checkin-today" | "maintenance" | "cleaning"

interface RoomDetail {
  roomNumber: string
  roomType: string
  roomTypeId: number
  status: RoomStatus
  booking?: Booking
  checkoutDate?: string
  checkinDate?: string
}

export default function RoomStatusDashboard() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [roomDetails, setRoomDetails] = useState<RoomDetail[]>([])
  const [selectedRoom, setSelectedRoom] = useState<RoomDetail | null>(null)
  const [dataIssues, setDataIssues] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])

  useEffect(() => {
    loadData()
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [selectedDate])
  
  const loadData = async () => {
    try {
      console.log('🔄 Room Status: Loading data from database...')
      const [allRooms, allBookings, inventory] = await Promise.all([
        fetchRooms(),
        fetchBookings(),
        fetchRoomInventory()
      ])
      console.log('✅ Loaded:', allRooms.length, 'room types,', allBookings.length, 'bookings,', inventory.length, 'room numbers')
      console.log('📋 Bookings:', allBookings)
      setRooms(allRooms)
      setBookings(allBookings)

    // Data Consistency Check
    console.log("🔍 Running Data Consistency Check...")
    const issues: string[] = []
    
    // Get all valid room numbers
    const validRoomNumbers = new Set<string>()
    if (inventory.length > 0) {
      inventory.forEach((item) => validRoomNumbers.add(item.roomNumber))
    } else {
      allRooms.forEach((room) => {
        if (room.roomNumbers) {
          room.roomNumbers.forEach((num) => validRoomNumbers.add(num))
        }
      })
    }
    
    // Check each booking
    const activeBookings = allBookings.filter(
      (b) => b.status === "Confirmed" || b.status === "Pending"
    )
    
    activeBookings.forEach((booking) => {
      // Check if booking has room number
      if (booking.status === "Confirmed" && !booking.roomNumber) {
        issues.push(`⚠️ Booking #${booking.id} (${booking.guest}) is Confirmed but has no room number assigned`)
      }
      
      // Check if room number exists in inventory
      if (booking.roomNumber && !validRoomNumbers.has(booking.roomNumber)) {
        issues.push(
          `⚠️ Booking #${booking.id} (${booking.guest}) has room number "${booking.roomNumber}" which doesn't exist in inventory`
        )
      }
      
      // Check date validity
      const checkin = new Date(booking.checkin)
      const checkout = new Date(booking.checkout)
      if (checkout <= checkin) {
        issues.push(
          `⚠️ Booking #${booking.id} (${booking.guest}) has invalid dates: checkout (${booking.checkout}) is not after checkin (${booking.checkin})`
        )
      }
    })
    
    // Check for double bookings
    const roomBookingMap = new Map<string, typeof activeBookings>()
    activeBookings.forEach((booking) => {
      if (booking.roomNumber) {
        if (!roomBookingMap.has(booking.roomNumber)) {
          roomBookingMap.set(booking.roomNumber, [])
        }
        roomBookingMap.get(booking.roomNumber)!.push(booking)
      }
    })
    
    roomBookingMap.forEach((bookingsForRoom, roomNum) => {
      if (bookingsForRoom.length > 1) {
        // Check for date overlaps
        for (let i = 0; i < bookingsForRoom.length; i++) {
          for (let j = i + 1; j < bookingsForRoom.length; j++) {
            const b1 = bookingsForRoom[i]
            const b2 = bookingsForRoom[j]
            
            const checkin1 = new Date(b1.checkin)
            const checkout1 = new Date(b1.checkout)
            const checkin2 = new Date(b2.checkin)
            const checkout2 = new Date(b2.checkout)
            
            checkin1.setHours(0, 0, 0, 0)
            checkout1.setHours(0, 0, 0, 0)
            checkin2.setHours(0, 0, 0, 0)
            checkout2.setHours(0, 0, 0, 0)
            
            // Check overlap
            if (
              (checkin1 >= checkin2 && checkin1 < checkout2) ||
              (checkout1 > checkin2 && checkout1 <= checkout2) ||
              (checkin1 <= checkin2 && checkout1 >= checkout2)
            ) {
              issues.push(
                `❌ DOUBLE BOOKING! Room ${roomNum} is booked by both:\n   • ${b1.guest} (${b1.checkin} to ${b1.checkout})\n   • ${b2.guest} (${b2.checkin} to ${b2.checkout})`
              )
            }
          }
        }
      }
    })
    
    if (issues.length > 0) {
      console.error("❌ Data Consistency Issues Found:")
      issues.forEach((issue) => console.error(issue))
      setDataIssues(issues)
    } else {
      console.log("✅ All data is consistent - no issues found")
      setDataIssues([])
    }

    // Build comprehensive room details
    const details: RoomDetail[] = []
    const viewDate = new Date(selectedDate)
    viewDate.setHours(0, 0, 0, 0) // Normalize to start of day

    // Helper function to check if a booking is active for a room on the selected date
    const getRoomStatus = (roomNumber: string): { status: RoomStatus; booking?: Booking } => {
      // Find all bookings for this room that are not cancelled or checked out
      const activeBookings = allBookings.filter(
        (b) =>
          b.roomNumber === roomNumber &&
          (b.status === "Confirmed" || b.status === "Pending" || b.status === "Checked In")
      )

      for (const booking of activeBookings) {
        const checkinDate = new Date(booking.checkin)
        const checkoutDate = new Date(booking.checkout)
        checkinDate.setHours(0, 0, 0, 0)
        checkoutDate.setHours(0, 0, 0, 0)

        // Check if occupied on selected date (date is between checkin and checkout)
        if (checkinDate <= viewDate && checkoutDate > viewDate) {
          return { status: "occupied", booking }
        }

        // Check if checking out on selected date (checkout date is the selected date)
        if (checkoutDate.getTime() === viewDate.getTime() && booking.status === "Confirmed") {
          return { status: "checkout-today", booking }
        }

        // Check if checking in on selected date (checkin date is the selected date and not yet occupied)
        if (checkinDate.getTime() === viewDate.getTime() && booking.status === "Confirmed") {
          return { status: "checkin-today", booking }
        }
      }

      return { status: "available" }
    }

    // Use inventory if available, otherwise fall back to old system
    if (inventory.length > 0) {
      inventory.forEach((item) => {
        const { status, booking } = getRoomStatus(item.roomNumber)

        details.push({
          roomNumber: item.roomNumber,
          roomType: item.roomType,
          roomTypeId: item.roomTypeId,
          status,
          booking,
          checkoutDate: booking?.checkout,
          checkinDate: booking?.checkin,
        })
      })
    } else {
      // Fallback to old system
      allRooms.forEach((room) => {
        if (room.roomNumbers && room.roomNumbers.length > 0) {
          room.roomNumbers.forEach((roomNumber) => {
            const { status, booking } = getRoomStatus(roomNumber)

            details.push({
              roomNumber,
              roomType: room.name,
              roomTypeId: room.id,
              status,
              booking,
              checkoutDate: booking?.checkout,
              checkinDate: booking?.checkin,
            })
          })
        }
      })
    }

    // Sort by room number
    details.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
    setRoomDetails(details)
    } catch (error) {
      console.error('Failed to load room status data:', error)
    }
  }

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case "available":
        return "bg-green-100 border-green-300 text-green-800"
      case "occupied":
        return "bg-red-100 border-red-300 text-red-800"
      case "checkout-today":
        return "bg-yellow-100 border-yellow-300 text-yellow-800"
      case "checkin-today":
        return "bg-blue-100 border-blue-300 text-blue-800"
      case "maintenance":
        return "bg-orange-100 border-orange-300 text-orange-800"
      case "cleaning":
        return "bg-purple-100 border-purple-300 text-purple-800"
      default:
        return "bg-gray-100 border-gray-300 text-gray-800"
    }
  }

  const getStatusIcon = (status: RoomStatus) => {
    switch (status) {
      case "available":
        return <CheckCircle size={16} />
      case "occupied":
        return <BedDouble size={16} />
      case "checkout-today":
        return <Clock size={16} />
      case "checkin-today":
        return <Clock size={16} />
      case "maintenance":
        return <Wrench size={16} />
      case "cleaning":
        return <Sparkles size={16} />
      default:
        return <AlertCircle size={16} />
    }
  }

  const getStatusLabel = (status: RoomStatus) => {
    const checkoutLabel = isToday ? "Check-out Today" : "Checking Out"
    const checkinLabel = isToday ? "Check-in Today" : "Checking In"
    
    switch (status) {
      case "available":
        return "Available"
      case "occupied":
        return "Occupied"
      case "checkout-today":
        return checkoutLabel
      case "checkin-today":
        return checkinLabel
      case "maintenance":
        return "Maintenance"
      case "cleaning":
        return "Cleaning"
      default:
        return "Unknown"
    }
  }

  // Calculate statistics per room type
  const roomTypeStats = rooms.map((room) => {
    const roomsOfType = roomDetails.filter((r) => r.roomTypeId === room.id)
    const available = roomsOfType.filter((r) => r.status === "available").length
    const occupied = roomsOfType.filter((r) => r.status === "occupied").length
    const total = roomsOfType.length

    return {
      name: room.name,
      available,
      occupied,
      total,
      percentage: total > 0 ? Math.round((available / total) * 100) : 0,
    }
  })

  // Overall statistics
  const totalRooms = roomDetails.length
  const availableRooms = roomDetails.filter((r) => r.status === "available").length
  const occupiedRooms = roomDetails.filter((r) => r.status === "occupied").length
  const checkoutToday = roomDetails.filter((r) => r.status === "checkout-today").length
  const checkinToday = roomDetails.filter((r) => r.status === "checkin-today").length

  const isToday = selectedDate === new Date().toISOString().split("T")[0]
  const selectedDateObj = new Date(selectedDate)

  return (
    <div className="space-y-6">
      {/* Header with Date Picker */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Room Status Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isToday ? "Live Status • Today" : "Historical/Future View"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label htmlFor="viewDate" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              View Date:
            </label>
            <div className="flex gap-2">
              <input
                id="viewDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                  className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium whitespace-nowrap"
                >
                  Today
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date Display Banner */}
      <Card className={isToday ? "bg-green-50 border-green-300" : "bg-blue-50 border-blue-300"}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className={`w-5 h-5 ${isToday ? "text-green-600" : "text-blue-600"}`} />
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedDateObj.toLocaleDateString("en-US", { 
                    weekday: "long", 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </p>
                <p className="text-xs text-gray-600">
                  {isToday 
                    ? "Real-time room availability" 
                    : selectedDateObj < new Date() 
                      ? "Past date - Historical view" 
                      : "Future date - Projected availability"}
                </p>
              </div>
            </div>
            {!isToday && (
              <div className="text-sm text-gray-600">
                {selectedDateObj < new Date() ? "📊 Historical" : "🔮 Future"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Consistency Alerts */}
      {dataIssues.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-900">
                  Data Consistency Issues Found ({dataIssues.length})
                </h3>
              </div>
              <div className="space-y-1 text-sm text-red-800 max-h-40 overflow-y-auto">
                {dataIssues.map((issue, idx) => (
                  <div key={idx} className="whitespace-pre-wrap bg-white/50 p-2 rounded border border-red-200">
                    {issue}
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-700">
                💡 Please review these issues in the Bookings Manager to ensure data integrity.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Building2 className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRooms}</p>
                <p className="text-xs text-gray-600">Total Rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{availableRooms}</p>
                <p className="text-xs text-gray-600">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <BedDouble className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{occupiedRooms}</p>
                <p className="text-xs text-gray-600">Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{checkoutToday}</p>
                <p className="text-xs text-gray-600">{isToday ? "Check-out Today" : "Check-out This Day"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{checkinToday}</p>
                <p className="text-xs text-gray-600">{isToday ? "Check-in Today" : "Check-in This Day"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Room Type Statistics */}
      <div className="grid md:grid-cols-3 gap-4">
        {roomTypeStats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader>
              <CardTitle className="text-lg">{stat.name}</CardTitle>
              <CardDescription>Availability Overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold text-green-600">{stat.available}</span>
                  <span className="text-sm text-gray-600">out of {stat.total} rooms</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{stat.percentage}% Available</span>
                  <span>{stat.occupied} Occupied</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Room Grid by Type */}
      {rooms.map((room) => {
        const roomsOfType = roomDetails.filter((r) => r.roomTypeId === room.id)
        if (roomsOfType.length === 0) return null

        return (
          <Card key={room.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{room.name}</span>
                <Badge variant="outline">
                  {roomsOfType.filter((r) => r.status === "available").length} / {roomsOfType.length} Available
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {roomsOfType.map((roomDetail) => (
                  <button
                    key={roomDetail.roomNumber}
                    onClick={() => setSelectedRoom(roomDetail)}
                    className={`relative p-4 border-2 rounded-lg transition-all hover:shadow-lg ${getStatusColor(
                      roomDetail.status
                    )}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {getStatusIcon(roomDetail.status)}
                      <span className="font-bold text-lg">{roomDetail.roomNumber}</span>
                      <span className="text-xs font-semibold">{getStatusLabel(roomDetail.status)}</span>
                      {roomDetail.booking && (
                        <div className="text-xs text-center mt-1">
                          <p className="font-semibold truncate w-full">{roomDetail.booking.guest}</p>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Room Details Modal/Panel - Enhanced with Full Booking History */}
      {selectedRoom && (() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Get ALL bookings for this specific room number
        const allRoomBookings = bookings.filter((b) => b.roomNumber === selectedRoom.roomNumber)
        
        // Categorize bookings
        const currentBooking = allRoomBookings.find((b) => {
          const checkin = new Date(b.checkin)
          const checkout = new Date(b.checkout)
          checkin.setHours(0, 0, 0, 0)
          checkout.setHours(0, 0, 0, 0)
          return (
            (b.status === "Confirmed" || b.status === "Pending") &&
            checkin <= today &&
            checkout > today
          )
        })
        
        const upcomingBookings = allRoomBookings
          .filter((b) => {
            const checkin = new Date(b.checkin)
            checkin.setHours(0, 0, 0, 0)
            return (
              (b.status === "Confirmed" || b.status === "Pending") &&
              checkin > today
            )
          })
          .sort((a, b) => new Date(a.checkin).getTime() - new Date(b.checkin).getTime())
        
        const pastBookings = allRoomBookings
          .filter((b) => {
            const checkout = new Date(b.checkout)
            checkout.setHours(0, 0, 0, 0)
            return (
              checkout <= today ||
              b.status === "Cancelled" ||
              b.status === "Checked Out"
            )
          })
          .sort((a, b) => new Date(b.checkout).getTime() - new Date(a.checkout).getTime())
          .slice(0, 5) // Show last 5 only
        
        return (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedRoom(null)}
          >
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="sticky top-0 bg-white z-10 border-b">
                <CardTitle className="flex items-center justify-between">
                  <span>Room {selectedRoom.roomNumber}</span>
                  <Badge className={getStatusColor(selectedRoom.status)}>
                    {getStatusLabel(selectedRoom.status)}
                  </Badge>
                </CardTitle>
                <CardDescription>{selectedRoom.roomType}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Current Booking */}
                {currentBooking ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <BedDouble className="w-5 h-5 text-red-600" />
                      Current Guest
                    </h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Guest:</span>
                        <span className="font-semibold">{currentBooking.guest}</span>
                      </div>
                      {currentBooking.email && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Email:</span>
                          <span className="text-sm">{currentBooking.email}</span>
                        </div>
                      )}
                      {currentBooking.phone && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Phone:</span>
                          <span className="text-sm">{currentBooking.phone}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Check-in:</span>
                        <span className="font-semibold">
                          {new Date(currentBooking.checkin).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Check-out:</span>
                        <span className="font-semibold">
                          {new Date(currentBooking.checkout).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="font-bold text-primary">${currentBooking.price}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge variant="outline">{currentBooking.status}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Source:</span>
                        <Badge variant="outline">{currentBooking.bookingSource || "phone"}</Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="font-semibold text-green-700">Room Available</p>
                    <p className="text-sm text-gray-600 mt-1">This room is ready for booking</p>
                  </div>
                )}

                {/* Upcoming Bookings */}
                {upcomingBookings.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Upcoming Bookings ({upcomingBookings.length})
                    </h3>
                    <div className="space-y-2">
                      {upcomingBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm space-y-1"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-semibold">{booking.guest}</span>
                            <Badge variant="outline" className="text-xs">
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="text-gray-600">
                            {new Date(booking.checkin).toLocaleDateString()} →{" "}
                            {new Date(booking.checkout).toLocaleDateString()}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">${booking.price}</span>
                            <span className="text-gray-600 text-xs">
                              {booking.bookingSource || "phone"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Bookings */}
                {pastBookings.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-600">
                      <AlertCircle className="w-4 h-4" />
                      Recent History ({pastBookings.length})
                    </h3>
                    <div className="space-y-2">
                      {pastBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs space-y-1"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-medium">{booking.guest}</span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                booking.status === "Checked Out"
                                  ? "bg-blue-100"
                                  : booking.status === "Cancelled"
                                  ? "bg-red-100"
                                  : ""
                              }`}
                            >
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="text-gray-600">
                            {new Date(booking.checkin).toLocaleDateString()} →{" "}
                            {new Date(booking.checkout).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Bookings Ever */}
                {allRoomBookings.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No bookings recorded for this room yet.</p>
                  </div>
                )}

                <button
                  onClick={() => setSelectedRoom(null)}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </CardContent>
            </Card>
          </div>
        )
      })()}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getStatusColor("available")}`} />
              <span className="text-xs">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getStatusColor("occupied")}`} />
              <span className="text-xs">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getStatusColor("checkout-today")}`} />
              <span className="text-xs">Check-out Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getStatusColor("checkin-today")}`} />
              <span className="text-xs">Check-in Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getStatusColor("maintenance")}`} />
              <span className="text-xs">Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getStatusColor("cleaning")}`} />
              <span className="text-xs">Cleaning</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

