"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, ShoppingCart, Package } from "lucide-react"
import { getBookings } from "@/lib/storage"
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
  price: number
  category: string
  stock: number
  minStock: number
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
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false)
  const [restockingItem, setRestockingItem] = useState<MenuItem | null>(null)

  // Load data from localStorage
  useEffect(() => {
    const savedMenu = localStorage.getItem("restaurant_menu")
    const savedOrders = localStorage.getItem("restaurant_orders")
    
    if (savedMenu) setMenuItems(JSON.parse(savedMenu))
    if (savedOrders) setOrders(JSON.parse(savedOrders))
    
    // Load active bookings
    const allBookings = getBookings()
    const activeBookings = allBookings.filter(b => 
      b.status === "Confirmed" && b.roomNumber
    )
    setBookings(activeBookings)
  }, [])

  // Save to localStorage
  const saveMenu = (items: MenuItem[]) => {
    localStorage.setItem("restaurant_menu", JSON.stringify(items))
    setMenuItems(items)
  }

  const saveOrders = (orders: Order[]) => {
    localStorage.setItem("restaurant_orders", JSON.stringify(orders))
    setOrders(orders)
  }

  // Menu Management
  const handleAddMenuItem = (item: Omit<MenuItem, "id">) => {
    const newItem = { ...item, id: Date.now() }
    saveMenu([...menuItems, newItem])
    setIsDialogOpen(false)
  }

  const handleDeleteMenuItem = (id: number) => {
    if (confirm("Delete this menu item?")) {
      saveMenu(menuItems.filter(item => item.id !== id))
    }
  }

  const handleUpdateStock = (itemId: number, newStock: number) => {
    const updated = menuItems.map(item => 
      item.id === itemId ? { ...item, stock: newStock } : item
    )
    saveMenu(updated)
    setIsRestockDialogOpen(false)
    setRestockingItem(null)
  }

  // Order Management
  const handleCreateOrder = (orderData: any) => {
    const subtotal = orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const tax = (subtotal * orderData.taxPercentage) / 100
    const total = subtotal + tax
    
    const newOrder: Order = {
      id: Date.now(),
      orderNumber: `ORD-${Date.now()}`,
      roomNumber: orderData.roomNumber,
      guestName: orderData.guestName,
      items: orderData.items,
      subtotal,
      tax,
      taxPercentage: orderData.taxPercentage,
      total,
      status: "pending",
      createdAt: new Date().toISOString()
    }
    
    // Deduct from inventory (only for bar items)
    orderData.items.forEach((orderItem: any) => {
      const menuItem = menuItems.find(m => m.id === orderItem.menuItemId)
      if (menuItem && menuItem.category === "bar") {
        menuItem.stock -= orderItem.quantity
        if (menuItem.stock < 0) menuItem.stock = 0
      }
    })
    
    saveMenu([...menuItems])
    saveOrders([newOrder, ...orders])
    setIsOrderDialogOpen(false)
    setSelectedItems([])
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
                    {item.category === "bar" && (
                      <div className="flex justify-between text-sm">
                        <span>Stock: {item.stock}</span>
                        {item.stock <= item.minStock && (
                          <Badge variant="destructive">Low Stock!</Badge>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="flex-1"
                        onClick={() => handleDeleteMenuItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
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
            <h3 className="text-lg font-semibold">Stock Levels (Bar Items Only)</h3>
            <Badge className="bg-blue-600">
              {menuItems.filter(i => i.category === "bar").length} Bar Items
            </Badge>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Item</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Current Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Min Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.filter(item => item.category === "bar").map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{item.category}</Badge>
                    </td>
                    <td className="px-6 py-4 font-bold">{item.stock}</td>
                    <td className="px-6 py-4">{item.minStock}</td>
                    <td className="px-6 py-4">
                      {item.stock <= item.minStock ? (
                        <Badge variant="destructive">Low Stock</Badge>
                      ) : (
                        <Badge className="bg-green-600">In Stock</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setRestockingItem(item)
                          setIsRestockDialogOpen(true)
                        }}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Update Stock
                      </Button>
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
              stock: category === "bar" ? parseInt(formData.get("stock") as string || "0") : 999999,
              minStock: category === "bar" ? parseInt(formData.get("minStock") as string || "0") : 0
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
                          Room {booking.roomNumber}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No active bookings</SelectItem>
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
                {menuItems.filter(item => item.stock > 0).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">NPR {item.price} • Stock: {item.stock}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max={item.stock}
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
                ))}
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

      {/* Update Stock Dialog */}
      <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock - {restockingItem?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const newStock = parseInt(formData.get("newStock") as string)
            if (restockingItem) {
              handleUpdateStock(restockingItem.id, newStock)
            }
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Stock</Label>
              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-2xl font-bold">{restockingItem?.stock} units</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newStock">New Stock Quantity *</Label>
              <Input 
                id="newStock" 
                name="newStock" 
                type="number" 
                required 
                defaultValue={restockingItem?.stock}
                min="0"
              />
              <p className="text-xs text-gray-500">Set the new total stock quantity</p>
            </div>

            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById("newStock") as HTMLInputElement
                    if (input && restockingItem) {
                      input.value = (restockingItem.stock + 10).toString()
                    }
                  }}
                >
                  +10
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById("newStock") as HTMLInputElement
                    if (input && restockingItem) {
                      input.value = (restockingItem.stock + 50).toString()
                    }
                  }}
                >
                  +50
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const input = document.getElementById("newStock") as HTMLInputElement
                    if (input && restockingItem) {
                      input.value = (restockingItem.stock + 100).toString()
                    }
                  }}
                >
                  +100
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsRestockDialogOpen(false)
                  setRestockingItem(null)
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Update Stock
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

