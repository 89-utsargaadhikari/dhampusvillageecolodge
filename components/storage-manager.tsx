"use client"

import { useState, useEffect } from "react"
import { Database, HardDrive, AlertCircle, CheckCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  fetchBookings, 
  fetchRooms, 
  fetchRoomInventory,
  fetchGallery,
  fetchRestaurantMenu,
  fetchRestaurantOrders,
  fetchAccountTransactions,
  fetchCreditAccounts
} from "@/lib/api"

export default function StorageManager() {
  const [dbStats, setDbStats] = useState({
    bookings: 0,
    rooms: 0,
    roomInventory: 0,
    gallery: 0,
    menuItems: 0,
    orders: 0,
    transactions: 0,
    creditAccounts: 0,
    totalRecords: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDatabaseStats()
  }, [])

  const loadDatabaseStats = async () => {
    try {
      setLoading(true)
      const [
        bookings,
        rooms,
        inventory,
        gallery,
        menu,
        orders,
        transactions,
        credits
      ] = await Promise.all([
        fetchBookings(),
        fetchRooms(),
        fetchRoomInventory(),
        fetchGallery(),
        fetchRestaurantMenu(),
        fetchRestaurantOrders(),
        fetchAccountTransactions(),
        fetchCreditAccounts()
      ])

      const stats = {
        bookings: bookings.length,
        rooms: rooms.length,
        roomInventory: inventory.length,
        gallery: gallery.length,
        menuItems: menu.length,
        orders: orders.length,
        transactions: transactions.length,
        creditAccounts: credits.length,
        totalRecords: bookings.length + rooms.length + inventory.length + gallery.length + 
                     menu.length + orders.length + transactions.length + credits.length
      }

      setDbStats(stats)
    } catch (error) {
      console.error('Failed to load database stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Database Management</h2>
        <Button onClick={loadDatabaseStats} variant="outline" className="w-full sm:w-auto">
          Refresh Stats
        </Button>
      </div>

      {/* Migration Success Notice */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">✅ Database Migration Complete!</p>
              <p className="text-sm text-green-700 mt-1">
                All data has been successfully migrated from localStorage to SQLite database. 
                Your system is now using a proper database for all operations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4 text-gray-500">Loading database stats...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-3xl font-bold text-blue-600">{dbStats.totalRecords}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Bookings</p>
                <p className="text-3xl font-bold text-purple-600">{dbStats.bookings}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Rooms</p>
                <p className="text-3xl font-bold text-green-600">{dbStats.rooms}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Room Inventory</p>
                <p className="text-3xl font-bold text-orange-600">{dbStats.roomInventory}</p>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-600">Gallery Images</p>
                <p className="text-3xl font-bold text-pink-600">{dbStats.gallery}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Menu Items</p>
                <p className="text-3xl font-bold text-yellow-600">{dbStats.menuItems}</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm text-gray-600">Restaurant Orders</p>
                <p className="text-3xl font-bold text-indigo-600">{dbStats.orders}</p>
              </div>
              <div className="p-4 bg-teal-50 rounded-lg">
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-3xl font-bold text-teal-600">{dbStats.transactions}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Credit Accounts</p>
                <p className="text-3xl font-bold text-red-600">{dbStats.creditAccounts}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Database Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">Prisma Studio</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Visual database browser to view and edit all records directly
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Run in terminal: <code className="bg-gray-100 px-2 py-1 rounded">npx prisma studio</code>
                </p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">Database File</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Location: <code className="bg-gray-100 px-2 py-1 rounded">prisma/dev.db</code>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  SQLite database file - can be backed up by copying this file
                </p>
              </div>
              <HardDrive className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Database Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>✅ <strong>All data is now stored in SQLite database</strong></p>
          <p>✅ <strong>localStorage is only used for admin authentication</strong></p>
          <p>✅ <strong>Data persists between browser sessions</strong></p>
          <p>✅ <strong>Database supports multiple concurrent users</strong></p>
          <p>💡 <strong>Backup Tip:</strong> Copy <code className="bg-blue-100 px-1">prisma/dev.db</code> file regularly</p>
          <p>💡 <strong>Migration Tip:</strong> Use Prisma migrations for schema changes</p>
        </CardContent>
      </Card>
    </div>
  )
}
