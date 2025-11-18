"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, ShoppingCart, Package, AlertCircle } from "lucide-react"
import { fetchBookings } from "@/lib/api"
import { 
  fetchRestaurantMenu, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  fetchRestaurantOrders,
  createRestaurantOrder,
  updateRestaurantOrder,
  deleteRestaurantOrder
} from "@/lib/api"
import { addNotification } from "@/lib/notifications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface MenuItem {
  id: number
  name: string
  description?: string | null
  price: number
  category: string
  image?: string | null
  available: boolean
}

interface Order {
  id: number
  orderNumber: string
  roomNumber: string
  guestName: string
  items: { menuItemId: number; name: string; quantity: number; price: number }[]
  subtotal: number
  tax: number
  taxPercentage: number
  total: number
  status: string
  createdAt: string
}

export default function RestaurantManager() {
  const [activeTab, setActiveTab] = useState<"menu" | "orders" | "inventory">("menu")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<{ menuItemId: number; name: string; quantity: number; price: number }[]>([])
  const [taxPercentage, setTaxPercentage] = useState(13) // Default 13% VAT for Nepal

  // Load data from database
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      const [menu, orders, allBookings] = await Promise.all([
        fetchRestaurantMenu(),
        fetchRestaurantOrders(),
        fetchBookings()
      ])
      
      setMenuItems(menu)
      setOrders(orders)
      
      // ONLY "Checked In" guests can order from restaurant
      const checkedInBookings = allBookings.filter((b: any) => 
        b.status === "Checked In" && b.roomNumber
      )
      
      console.log('🍽️ Restaurant System - Data Sync:')
      console.log('  Total bookings:', allBookings.length)
      console.log('  Checked In guests:', checkedInBookings.length)
      console.log('  Available for orders:', checkedInBookings.map((b: any) => `${b.guest} - Room ${b.roomNumber}`))
      
      setBookings(checkedInBookings)
    } catch (error) {
      console.error('Failed to load data:', error)
      alert('Failed to load restaurant data')
    }
  }

  // Menu Management
  const handleAddMenuItem = async (item: Omit<MenuItem, "id">) => {
    try {
      await createMenuItem(item)
      await loadData()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to add menu item:', error)
      alert('Failed to add menu item')
    }
  }

  const handleDeleteMenuItem = async (id: number) => {
    if (confirm("Delete this menu item?")) {
      try {
        await deleteMenuItem(id)
        await loadData()
      } catch (error) {
        console.error('Failed to delete menu item:', error)
        alert('Failed to delete menu item')
      }
    }
  }


  // Order Management
  const handleCreateOrder = async (orderData: any) => {
    try {
      console.log('🔵 Frontend: Starting order creation', orderData)
      
      const subtotal = orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
      const tax = (subtotal * orderData.taxPercentage) / 100
      const total = subtotal + tax
      
      const orderPayload = {
        orderNumber: `ORD-${Date.now()}`,
        roomNumber: orderData.roomNumber,
        guestName: orderData.guestName,
        bookingId: bookings.find((b: any) => b.roomNumber === orderData.roomNumber)?.id || null,
        items: orderData.items,
        subtotal,
        tax,
        taxPercentage: orderData.taxPercentage,
        total,
        status: "pending"
      }
      
      console.log('🔵 Frontend: Sending payload to API', orderPayload)
      
      const result = await createRestaurantOrder(orderPayload)
      console.log('✅ Frontend: Order created successfully', result)
      
      // Add notification for new restaurant order
      addNotification(
        "order",
        "New Restaurant Order",
        `Order #${orderPayload.orderNumber} - Room ${orderPayload.roomNumber} (${orderPayload.guestName}) - NPR ${total.toFixed(2)}`,
        "high",
        "restaurant"
      )
      
      // TODO: Inventory deduction will be implemented with the inventory management system
      
      await loadData()
      setIsOrderDialogOpen(false)
      setSelectedItems([])
      alert('✅ Order created successfully!')
    } catch (error: any) {
      console.error('❌ Frontend: Failed to create order:', error)
      console.error('Error details:', error.message)
      alert(`❌ Failed to create order: ${error.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Restaurant Management System (RMS)</h2>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "menu" ? "default" : "outline"}
            onClick={() => setActiveTab("menu")}
          >
            Menu
          </Button>
          <Button
            variant={activeTab === "orders" ? "default" : "outline"}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </Button>
          <Button
            variant={activeTab === "inventory" ? "default" : "outline"}
            onClick={() => setActiveTab("inventory")}
          >
            Inventory
          </Button>
        </div>
      </div>

      {/* MENU TAB */}
      {activeTab === "menu" && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-semibold">Menu Items</h3>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {menuItems.map(item => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{item.name}</span>
                    <Badge>{item.category}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-primary">NPR {item.price}</p>
                    <p className="text-sm text-gray-600">Category: {item.category}</p>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="flex-1"
                        onClick={() => handleDeleteMenuItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-semibold">Orders</h3>
            <Button onClick={() => setIsOrderDialogOpen(true)}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No orders yet. Click "New Order" to create one.
                </CardContent>
              </Card>
            ) : (
              orders.map(order => (
                <Card key={order.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-lg">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Room {order.roomNumber}</span> • {order.guestName}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">NPR {order.total.toFixed(2)}</p>
                        <Badge>{order.status}</Badge>
                      </div>
                    </div>
                    <div className="border-t pt-3 space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-medium">NPR {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span>NPR {order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax ({order.taxPercentage}%):</span>
                          <span>NPR {order.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span className="text-primary">NPR {order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Inventory Management</h3>
            <Badge className="bg-blue-600">
              {menuItems.length} Total Items
            </Badge>
          </div>
          
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900">Inventory System Coming Soon</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Advanced inventory tracking with stock levels, alerts, and automated deductions will be available in the next update.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Item</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{item.category}</Badge>
                    </td>
                    <td className="px-6 py-4 font-bold">NPR {item.price}</td>
                    <td className="px-6 py-4">
                      {item.available ? (
                        <Badge className="bg-green-600">Available</Badge>
                      ) : (
                        <Badge variant="destructive">Unavailable</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Menu Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const category = formData.get("category") as string
            handleAddMenuItem({
              name: formData.get("name") as string,
              price: parseFloat(formData.get("price") as string),
              category: category,
              description: "",
              available: true
            })
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (NPR) *</Label>
                <Input id="price" name="price" type="number" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  name="category" 
                  required
                  onValueChange={(value) => {
                    const stockFields = document.getElementById("stockFields")
                    if (stockFields) {
                      stockFields.style.display = value === "bar" ? "grid" : "none"
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="drinks">Drinks</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="snacks">Snacks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div id="stockFields" className="grid grid-cols-2 gap-4" style={{ display: 'none' }}>
              <div className="space-y-2">
                <Label htmlFor="stock">Initial Stock (Bar items only)</Label>
                <Input id="stock" name="stock" type="number" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Min Stock Alert</Label>
                <Input id="minStock" name="minStock" type="number" defaultValue="0" />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">Add Item</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            {bookings.length === 0 && (
              <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded mt-2">
                ⚠️ No checked-in guests available. Please check in a guest from the Bookings page first.
              </p>
            )}
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            
            if (selectedItems.length === 0) {
              alert("Please add at least one item to the order")
              return
            }
            
            handleCreateOrder({
              roomNumber: formData.get("roomNumber") as string,
              guestName: formData.get("guestName") as string,
              items: selectedItems,
              taxPercentage: parseFloat(formData.get("taxPercentage") as string)
            })
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number *</Label>
                <Select 
                  name="roomNumber" 
                  required
                  onValueChange={(value) => {
                    // Auto-populate guest name when room is selected
                    const selectedBooking = bookings.find(b => b.roomNumber === value)
                    if (selectedBooking) {
                      const guestNameInput = document.getElementById("guestName") as HTMLInputElement
                      if (guestNameInput) {
                        guestNameInput.value = selectedBooking.guest
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.length > 0 ? (
                      bookings.map((booking) => (
                        <SelectItem key={booking.id} value={booking.roomNumber!}>
                          Room {booking.roomNumber} - {booking.guest}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No checked-in guests available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestName">Guest Name *</Label>
                <Input id="guestName" name="guestName" required readOnly className="bg-gray-50" />
              </div>
            </div>

            {/* Menu Items Selection */}
            <div className="space-y-2">
              <Label>Add Items to Order</Label>
              <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                {menuItems.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No menu items available. Please add menu items first.</p>
                ) : (
                  menuItems.filter(item => item.available).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">NPR {item.price} • {item.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          defaultValue="0"
                          className="w-20"
                          onChange={(e) => {
                            const quantity = parseInt(e.target.value) || 0
                            if (quantity > 0) {
                              const existing = selectedItems.find(i => i.menuItemId === item.id)
                              if (existing) {
                                setSelectedItems(selectedItems.map(i => 
                                  i.menuItemId === item.id ? { ...i, quantity } : i
                                ))
                              } else {
                                setSelectedItems([...selectedItems, {
                                  menuItemId: item.id,
                                  name: item.name,
                                  quantity,
                                  price: item.price
                                }])
                              }
                            } else {
                              setSelectedItems(selectedItems.filter(i => i.menuItemId !== item.id))
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Order Summary */}
            {selectedItems.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4 space-y-2">
                  <p className="font-semibold">Order Summary:</p>
                  {selectedItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>NPR {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-blue-300 pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>NPR {selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span>Tax:</span>
                      <div className="flex items-center gap-2">
                        <Input
                          name="taxPercentage"
                          type="number"
                          step="0.01"
                          defaultValue={taxPercentage}
                          className="w-20 h-8"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-1">
                      <span>Total:</span>
                      <span className="text-primary">
                        NPR {(selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * (1 + taxPercentage / 100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsOrderDialogOpen(false)
                setSelectedItems([])
              }} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={selectedItems.length === 0}>
                Create Order
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


    </div>
  )
}

