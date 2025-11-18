"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Users, DollarSign, Calendar, TrendingUp, X } from "lucide-react"
import { type Booking } from "@/lib/storage"
import { 
  fetchBookings, 
  fetchRooms,
  fetchRoomInventory,
  fetchRestaurantOrders,
  fetchRestaurantMenu,
  fetchAccountTransactions
} from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type StatType = "bookings" | "revenue" | "guests" | "occupancy" | null

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalGuests: 0,
    occupancyRate: 0,
    restaurantOrders: 0,
    restaurantRevenue: 0,
    lowStockItems: 0,
    accountBalance: 0,
  })
  const [bookingData, setBookingData] = useState<{ month: string; bookings: number; revenue: number }[]>([])
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [selectedStat, setSelectedStat] = useState<StatType>(null)
  const [rooms, setRooms] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      const [bookings, roomsData, inventory, restaurantOrders, menuItems, accountTransactions] = await Promise.all([
        fetchBookings(),
        fetchRooms(),
        fetchRoomInventory(),
        fetchRestaurantOrders(),
        fetchRestaurantMenu(),
        fetchAccountTransactions()
      ])

      setAllBookings(bookings)
      setRooms(roomsData)

      // Calculate HMS stats
      const totalBookings = bookings.length
      const totalRevenue = bookings.reduce((sum: number, b: any) => sum + parseFloat(b.price || "0"), 0)
      const totalGuests = bookings.reduce((sum: number, b: any) => {
        const room = roomsData.find((r: any) => r.name === b.room)
        return sum + (room?.capacity || 1)
      }, 0)

      // Calculate occupancy rate
      const totalRooms = inventory.length || roomsData.reduce((sum: number, r: any) => sum + (r.roomNumbers?.length || 0), 0)
      const confirmedBookings = bookings.filter((b: any) => b.status === "Confirmed").length
      const occupancyRate = totalRooms > 0 ? Math.round((confirmedBookings / totalRooms) * 100) : 0

      // Calculate RMS stats
      const restaurantRevenue = restaurantOrders.reduce((sum: number, order: any) => sum + order.total, 0)
      
      // Calculate inventory alerts (bar items only)
      // TODO: Implement proper inventory tracking
      const lowStockItems = 0

      // Calculate AMS stats
      const accountBalance = accountTransactions.reduce((sum: number, txn: any) => {
        return sum + (txn.type === "income" ? txn.amount : -txn.amount)
      }, 0)

      setStats({
        totalBookings,
        totalRevenue,
        totalGuests,
        occupancyRate,
        restaurantOrders: restaurantOrders.length,
        restaurantRevenue,
        lowStockItems,
        accountBalance,
      })

      // Group bookings by month
      const monthlyData: Record<string, { bookings: number; revenue: number }> = {}
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      
      bookings.forEach((booking: any) => {
        const date = new Date(booking.checkin)
        const monthKey = months[date.getMonth()]
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { bookings: 0, revenue: 0 }
        }
        
        monthlyData[monthKey].bookings += 1
        monthlyData[monthKey].revenue += parseFloat(booking.price || "0")
      })

      const chartData = months.map((month) => ({
        month,
        bookings: monthlyData[month]?.bookings || 0,
        revenue: monthlyData[month]?.revenue || 0,
      }))

      setBookingData(chartData)

      // Get recent bookings (last 5)
      const recent = [...bookings]
        .sort((a: any, b: any) => new Date(b.checkin).getTime() - new Date(a.checkin).getTime())
        .slice(0, 5)
      setRecentBookings(recent)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      </div>

      {/* Quick Guide */}
      {stats.totalBookings === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">🚀 Getting Started</h4>
          <p className="text-sm text-blue-800 mb-2">Your dashboard is empty. Here's how to get started:</p>
          <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1 ml-2">
            <li>Go to <span className="font-semibold">Rooms</span> → Add room types and upload images</li>
            <li>Go to <span className="font-semibold">Room Numbers</span> → Assign specific room numbers to types</li>
            <li>Go to <span className="font-semibold">Bookings</span> → Add a booking and confirm it with a room number</li>
            <li>Go to <span className="font-semibold">Restaurant</span> → Create menu items and orders (linked to rooms)</li>
            <li>Go to <span className="font-semibold">Billing</span> → Generate bills for confirmed bookings</li>
            <li><span className="font-semibold">Accounts (AMS)</span> will automatically populate when you checkout guests!</li>
          </ol>
        </div>
      )}
      
      {/* HMS Stats Cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Hotel Management (HMS)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Bookings", value: stats.totalBookings.toString(), icon: Calendar, color: "bg-blue-100 text-blue-600", type: "bookings" as StatType },
            { label: "Room Revenue", value: `NPR ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-green-100 text-green-600", type: "revenue" as StatType },
            { label: "Total Guests", value: stats.totalGuests.toString(), icon: Users, color: "bg-purple-100 text-purple-600", type: "guests" as StatType },
            { label: "Occupancy Rate", value: `${stats.occupancyRate}%`, icon: TrendingUp, color: "bg-orange-100 text-orange-600", type: "occupancy" as StatType },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <button
                key={i}
                onClick={() => setSelectedStat(stat.type)}
                className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer text-left w-full"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">Click for details</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon size={24} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* RMS & AMS Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-6 shadow border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Restaurant Orders (RMS)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.restaurantOrders}</p>
              <p className="text-sm text-green-600 mt-1">NPR {stats.restaurantRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
              🍽️
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
              <p className="text-xs text-gray-500 mt-1">Items need restocking</p>
            </div>
            <div className="bg-red-100 text-red-600 p-3 rounded-lg">
              ⚠️
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Account Balance (AMS)</p>
              <p className={`text-2xl font-bold ${stats.accountBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                NPR {stats.accountBalance.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total profit/loss</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
              💰
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Monthly Bookings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#006B47" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bookingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#F5A623" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Guest Name</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Room</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Check-in</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Check-out</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length > 0 ? (
                recentBookings.map((booking, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{booking.guest}</td>
                  <td className="px-4 py-3 text-sm">{booking.room}</td>
                  <td className="px-4 py-3 text-sm">{booking.checkin}</td>
                  <td className="px-4 py-3 text-sm">{booking.checkout}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === "Confirmed" 
                            ? "bg-green-100 text-green-700" 
                            : booking.status === "Cancelled"
                            ? "bg-red-100 text-red-700"
                            : booking.status === "Checked Out"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No bookings yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Details Modal */}
      <Dialog open={selectedStat !== null} onOpenChange={() => setSelectedStat(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStat === "bookings" && "All Bookings Breakdown"}
              {selectedStat === "revenue" && "Revenue Breakdown"}
              {selectedStat === "guests" && "Guest Count Breakdown"}
              {selectedStat === "occupancy" && "Occupancy Details"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* BOOKINGS */}
            {selectedStat === "bookings" && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Total: <span className="font-bold text-gray-900">{allBookings.length} bookings</span>
                </p>
                <div className="space-y-2">
                  {allBookings.map((booking, i) => (
                    <div key={i} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{booking.guest}</p>
                          <p className="text-sm text-gray-600">{booking.room}</p>
                          <p className="text-xs text-gray-500">{booking.checkin} to {booking.checkout}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">${booking.price}</p>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                              booking.status === "Confirmed"
                                ? "bg-green-100 text-green-700"
                                : booking.status === "Cancelled"
                                ? "bg-red-100 text-red-700"
                                : booking.status === "Checked Out"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REVENUE */}
            {selectedStat === "revenue" && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Total Revenue: <span className="font-bold text-green-600 text-xl">${stats.totalRevenue.toLocaleString()}</span>
                </p>
                <div className="space-y-2">
                  {allBookings.map((booking, i) => (
                    <div key={i} className="border rounded-lg p-4 hover:bg-gray-50 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{booking.guest}</p>
                        <p className="text-sm text-gray-600">{booking.room}</p>
                        <p className="text-xs text-gray-500">{booking.checkin} to {booking.checkout}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-lg">${parseFloat(booking.price || "0").toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{booking.status}</p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t-2 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-gray-900">TOTAL</p>
                      <p className="font-bold text-green-600 text-2xl">${stats.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GUESTS */}
            {selectedStat === "guests" && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Total Guests: <span className="font-bold text-purple-600 text-xl">{stats.totalGuests}</span>
                </p>
                <div className="space-y-2">
                  {allBookings.map((booking, i) => {
                    const room = rooms.find((r) => r.name === booking.room)
                    const capacity = room?.capacity || 1
                    return (
                      <div key={i} className="border rounded-lg p-4 hover:bg-gray-50 flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{booking.guest}</p>
                          <p className="text-sm text-gray-600">{booking.room}</p>
                          <p className="text-xs text-gray-500">{booking.checkin} to {booking.checkout}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">{capacity} {capacity === 1 ? "guest" : "guests"}</p>
                          <p className="text-xs text-gray-500">Room capacity</p>
                        </div>
                      </div>
                    )
                  })}
                  <div className="border-t-2 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-gray-900">TOTAL</p>
                      <p className="font-bold text-purple-600 text-2xl">{stats.totalGuests} guests</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OCCUPANCY */}
            {selectedStat === "occupancy" && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Occupancy Rate: <span className="font-bold text-orange-600 text-xl">{stats.occupancyRate}%</span>
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Confirmed Bookings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {allBookings.filter((b) => b.status === "Confirmed").length}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Rooms</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {getRoomInventory().length || rooms.reduce((sum, r) => sum + (r.roomNumbers?.length || 0), 0)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900 mb-2">Status Breakdown:</p>
                  {["Confirmed", "Pending", "Checked Out", "Cancelled"].map((status) => {
                    const count = allBookings.filter((b) => b.status === status).length
                    return (
                      <div key={status} className="border rounded-lg p-3 flex justify-between items-center">
                        <span className="font-medium">{status}</span>
                        <span className="font-bold">{count} bookings</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
