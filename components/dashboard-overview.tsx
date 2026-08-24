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
  fetchAccountTransactions
} from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type StatType = "bookings" | "revenue" | "guests" | "occupancy" | "restaurant" | "accounts" | null

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
    cashPayments: 0,
    cardPayments: 0,
    qrPayments: 0,
    bankTransfers: 0,
    creditPayments: 0,
    todayCheckins: 0,
    todayCheckouts: 0,
    roomsOccupied: 0,
    todayRevenue: 0,
  })
  const [bookingData, setBookingData] = useState<{ month: string; bookings: number; revenue: number }[]>([])
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [selectedStat, setSelectedStat] = useState<StatType>(null)
  const [rooms, setRooms] = useState<any[]>([])

  const [restaurantOrders, setRestaurantOrders] = useState<any[]>([])
  const [accountTransactions, setAccountTransactions] = useState<any[]>([])

  useEffect(() => {
    loadData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [bookings, roomsData, inventory, orders, transactions, inventoryItems] = await Promise.all([
        fetchBookings(),
        fetchRooms(),
        fetchRoomInventory(),
        fetchRestaurantOrders(),
        fetchAccountTransactions(),
        fetch("/api/inventory").then(res => res.json()).catch(() => [])
      ])

      setAllBookings(bookings)
      setRooms(roomsData)
      setRestaurantOrders(orders)
      setAccountTransactions(transactions)

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
      const restaurantRevenue = orders.reduce((sum: number, order: any) => sum + order.total, 0)
      
      // Calculate inventory alerts
      const lowStockItems = Array.isArray(inventoryItems) ? (
        inventoryItems.filter((item: any) => 
          item.currentStock <= item.lowStockLevel && item.currentStock > item.criticalStockLevel
        ).length + inventoryItems.filter((item: any) => 
          item.currentStock <= item.criticalStockLevel
        ).length
      ) : 0

      // Calculate AMS stats
      const accountBalance = transactions.reduce((sum: number, txn: any) => {
        return sum + (txn.type === "income" ? txn.amount : -txn.amount)
      }, 0)

      // Calculate payment method breakdown
      const incomeTransactions = transactions.filter((t: any) => t.type === "income")
      const cashPayments = incomeTransactions.filter((t: any) => t.paymentMethod?.toLowerCase().includes("cash")).reduce((sum: number, t: any) => sum + t.amount, 0)
      const cardPayments = incomeTransactions.filter((t: any) => t.paymentMethod?.toLowerCase().includes("card")).reduce((sum: number, t: any) => sum + t.amount, 0)
      const qrPayments = incomeTransactions.filter((t: any) => t.paymentMethod?.toLowerCase().includes("qr")).reduce((sum: number, t: any) => sum + t.amount, 0)
      const bankTransfers = incomeTransactions.filter((t: any) => t.paymentMethod?.toLowerCase().includes("bank") || t.paymentMethod?.toLowerCase().includes("transfer")).reduce((sum: number, t: any) => sum + t.amount, 0)
      const creditPayments = incomeTransactions.filter((t: any) => t.paymentMethod?.toLowerCase().includes("credit")).reduce((sum: number, t: any) => sum + t.amount, 0)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const isSameDay = (value?: string) => {
        if (!value) return false
        const date = new Date(value)
        date.setHours(0, 0, 0, 0)
        return date.getTime() === today.getTime()
      }
      const activeStatuses = ["Confirmed", "Checked In"]
      const todayCheckins = bookings.filter((b: any) => isSameDay(b.checkin) && b.status !== "Cancelled").length
      const todayCheckouts = bookings.filter((b: any) => isSameDay(b.checkout) && b.status !== "Cancelled").length
      const roomsOccupied = bookings.filter((b: any) => {
        if (!activeStatuses.includes(b.status)) return false
        const checkin = new Date(b.checkin)
        const checkout = new Date(b.checkout)
        checkin.setHours(0, 0, 0, 0)
        checkout.setHours(0, 0, 0, 0)
        return checkin <= today && checkout > today
      }).length
      const todayBookingRevenue = bookings
        .filter((b: any) => isSameDay(b.checkin) && b.status !== "Cancelled")
        .reduce((sum: number, b: any) => sum + parseFloat(b.price || "0"), 0)
      const todayRestaurantRevenue = orders
        .filter((order: any) => isSameDay(order.orderDate || order.createdAt))
        .reduce((sum: number, order: any) => sum + (order.total || 0), 0)

      setStats({
        totalBookings,
        totalRevenue,
        totalGuests,
        occupancyRate,
        restaurantOrders: orders.length,
        restaurantRevenue,
        lowStockItems,
        accountBalance,
        cashPayments,
        cardPayments,
        qrPayments,
        bankTransfers,
        creditPayments,
        todayCheckins,
        todayCheckouts,
        roomsOccupied,
        todayRevenue: todayBookingRevenue + todayRestaurantRevenue,
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
        .sort((a, b) => new Date(b.checkin).getTime() - new Date(a.checkin).getTime())
        .slice(0, 5)
      setRecentBookings(recent)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-green-900">
          Today you have {stats.todayCheckins} check-in{stats.todayCheckins === 1 ? "" : "s"}, {stats.todayCheckouts} check-out{stats.todayCheckouts === 1 ? "" : "s"} and {stats.roomsOccupied} room{stats.roomsOccupied === 1 ? "" : "s"} occupied.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Today's Check-ins", value: stats.todayCheckins.toString() },
          { label: "Today's Check-outs", value: stats.todayCheckouts.toString() },
          { label: "Rooms Occupied", value: stats.roomsOccupied.toString() },
          { label: "Today's Revenue", value: `NPR ${stats.todayRevenue.toLocaleString()}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg p-4 sm:p-6 shadow">
            <p className="text-gray-500 text-xs sm:text-sm mb-1">{stat.label}</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 break-words">{stat.value}</p>
          </div>
        ))}
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                className="bg-white rounded-lg p-4 sm:p-6 shadow hover:shadow-lg transition-shadow cursor-pointer text-left w-full min-w-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-gray-500 text-xs sm:text-sm mb-1">{stat.label}</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 break-words">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1 hidden sm:block">Click for details</p>
                  </div>
                  <div className={`${stat.color} p-2 sm:p-3 rounded-lg shrink-0`}>
                    <Icon size={20} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* RMS & AMS Quick Stats - Now Clickable! */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setSelectedStat("restaurant")}
          className="bg-white rounded-lg p-4 sm:p-6 shadow border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow cursor-pointer text-left w-full min-w-0"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-gray-500 text-sm mb-1">Restaurant Orders (RMS)</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.restaurantOrders}</p>
              <p className="text-sm text-green-600 mt-1 break-words">NPR {stats.restaurantRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1 hidden sm:block">Click for details</p>
            </div>
            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
              🍽️
            </div>
          </div>
        </button>

        <button
          onClick={() => setSelectedStat("accounts")}
          className="bg-white rounded-lg p-4 sm:p-6 shadow border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow cursor-pointer text-left w-full min-w-0"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-gray-500 text-sm mb-1">Account Balance (AMS)</p>
              <p className={`text-xl sm:text-2xl font-bold break-words ${stats.accountBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                NPR {stats.accountBalance.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total profit/loss</p>
              <p className="text-xs text-gray-400 mt-1">Click for breakdown</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
              💰
            </div>
          </div>
        </button>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          💳 Payment Methods Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-xs text-gray-600 mb-1">💵 Cash</p>
            <p className="text-base sm:text-xl font-bold text-green-700 break-words">NPR {stats.cashPayments.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">💳 Card</p>
            <p className="text-base sm:text-xl font-bold text-blue-700 break-words">NPR {stats.cardPayments.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-xs text-gray-600 mb-1">📱 QR/Digital</p>
            <p className="text-base sm:text-xl font-bold text-purple-700 break-words">NPR {stats.qrPayments.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-xs text-gray-600 mb-1">🏦 Bank</p>
            <p className="text-base sm:text-xl font-bold text-yellow-700 break-words">NPR {stats.bankTransfers.toLocaleString()}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-xs text-gray-600 mb-1">📊 Credit</p>
            <p className="text-base sm:text-xl font-bold text-red-700 break-words">NPR {stats.creditPayments.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow min-w-0">
          <h3 className="text-lg font-semibold mb-4">Monthly Bookings</h3>
          <div className="h-[220px] sm:h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis width={32} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#006B47" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow min-w-0">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <div className="h-[220px] sm:h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis width={40} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#F5A623" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow min-w-0">
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
              {selectedStat === "bookings" && "📅 All Bookings Breakdown"}
              {selectedStat === "revenue" && "💰 Revenue Breakdown"}
              {selectedStat === "guests" && "👥 Guest Count Breakdown"}
              {selectedStat === "occupancy" && "📊 Occupancy Details"}
              {selectedStat === "restaurant" && "🍽️ Restaurant Orders Breakdown"}
              {selectedStat === "accounts" && "💳 Accounts Breakdown"}
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
                          <p className="font-bold text-green-600">NPR {parseFloat(booking.price || "0").toLocaleString()}</p>
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
                  Total Revenue: <span className="font-bold text-green-600 text-xl">NPR {stats.totalRevenue.toLocaleString()}</span>
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
                        <p className="font-bold text-green-600 text-lg">NPR {parseFloat(booking.price || "0").toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{booking.status}</p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t-2 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-gray-900">TOTAL</p>
                      <p className="font-bold text-green-600 text-2xl">NPR {stats.totalRevenue.toLocaleString()}</p>
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
                      {rooms.reduce((sum: number, r: any) => {
                        if (typeof r.roomNumbers === 'string') {
                          return sum + (r.roomNumbers.split(',').filter((n: string) => n.trim()).length || 0)
                        }
                        return sum + (r.roomNumbers?.length || 0)
                      }, 0)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900 mb-2">Status Breakdown:</p>
                  {["Confirmed", "Checked In", "Pending", "Checked Out", "Cancelled"].map((status) => {
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

            {/* RESTAURANT */}
            {selectedStat === "restaurant" && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Total Orders: <span className="font-bold text-yellow-600 text-xl">{restaurantOrders.length}</span>
                  {' | '}
                  Total Revenue: <span className="font-bold text-green-600 text-xl">NPR {stats.restaurantRevenue.toLocaleString()}</span>
                </p>
                
                {restaurantOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">🍽️ No restaurant orders yet</p>
                    <p className="text-sm">Orders will appear here once guests place orders from the Restaurant Manager</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {restaurantOrders
                      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
                      .map((order, i) => (
                        <div key={i} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">Order #{order.orderNumber}</p>
                              <p className="text-sm text-gray-600">Room {order.roomNumber} - {order.guestName}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(order.orderDate).toLocaleDateString()} at{' '}
                                {new Date(order.orderDate).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600 text-lg">NPR {order.total.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">
                                Subtotal: NPR {order.subtotal.toFixed(2)}<br/>
                                Tax: NPR {order.tax.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Items:</p>
                            {order.items.map((item: any, idx: number) => (
                              <p key={idx} className="text-xs text-gray-600">
                                • {item.name} x{item.quantity} @ NPR {item.price} = NPR {item.subtotal}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    <div className="border-t-2 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-gray-900">TOTAL REVENUE</p>
                        <p className="font-bold text-green-600 text-2xl">NPR {stats.restaurantRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ACCOUNTS */}
            {selectedStat === "accounts" && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Account Balance: <span className={`font-bold text-xl ${stats.accountBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    NPR {stats.accountBalance.toLocaleString()}
                  </span>
                </p>

                {accountTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">💰 No transactions yet</p>
                    <p className="text-sm">Transactions will appear here when guests checkout or you add manual transactions</p>
                  </div>
                ) : (
                  <>
                    {/* Income vs Expense Summary */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Income</p>
                        <p className="text-2xl font-bold text-green-600">
                          NPR {accountTransactions
                            .filter(t => t.type === 'income')
                            .reduce((sum, t) => sum + t.amount, 0)
                            .toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {accountTransactions.filter(t => t.type === 'income').length} transactions
                        </p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-600">
                          NPR {accountTransactions
                            .filter(t => t.type === 'expense')
                            .reduce((sum, t) => sum + t.amount, 0)
                            .toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {accountTransactions.filter(t => t.type === 'expense').length} transactions
                        </p>
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="mb-6">
                      <p className="font-semibold text-gray-900 mb-3">By Category:</p>
                      <div className="space-y-2">
                        {['room_booking', 'restaurant', 'bar', 'salary', 'utilities', 'supplies', 'maintenance', 'marketing', 'other'].map((cat) => {
                          const catTransactions = accountTransactions.filter(t => t.category === cat)
                          const catTotal = catTransactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
                          if (catTransactions.length === 0) return null
                          return (
                            <div key={cat} className="border rounded-lg p-3 flex justify-between items-center">
                              <span className="font-medium capitalize">{cat.replace('_', ' ')}</span>
                              <div className="text-right">
                                <span className={`font-bold ${catTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  NPR {Math.abs(catTotal).toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">({catTransactions.length})</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Recent Transactions */}
                    <div>
                      <p className="font-semibold text-gray-900 mb-3">Recent Transactions:</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {accountTransactions
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice(0, 20)
                          .map((txn, i) => (
                            <div key={i} className="border rounded-lg p-3 hover:bg-gray-50 flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium">{txn.description}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(txn.date).toLocaleDateString()} • {txn.category}
                                  {txn.paymentMethod && ` • ${txn.paymentMethod}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                  {txn.type === 'income' ? '+' : '-'} NPR {txn.amount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
