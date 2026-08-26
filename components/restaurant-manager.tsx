"use client"

import { useState, useEffect } from "react"
import { Plus, Minus, Edit, Trash2, ShoppingCart, Search } from "lucide-react"
import { calculateInclusiveVat, DEFAULT_VAT_PERCENT } from "@/lib/vat"
import { AdminSearch, matchesSearch } from "@/components/admin-search"
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
import { COUNTABLE_UNITS, isCountableUnit } from "@/lib/inventory-units"

interface InventoryLink {
  id: number
  name: string
  unit: string
  storeStock: number
  barStock: number
  currentStock: number
}

interface MenuItem {
  id: number
  name: string
  description?: string | null
  price: number
  category: string
  image?: string | null
  available: boolean
  inventoryItem?: InventoryLink | null
}

interface OrderItem {
  menuItemId: number
  name: string
  quantity: number
  price: number
}

interface Order {
  id: number
  orderNumber: string
  roomNumber: string
  guestName: string
  items: OrderItem[]
  subtotal: number
  discountType?: string | null
  discountValue?: number | null
  discountAmount?: number | null
  tax: number
  taxPercentage: number
  total: number
  status: string
  createdAt: string
}

function matchesItemSearch(item: { name: string; category: string }, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
}

export default function RestaurantManager() {
  const [activeTab, setActiveTab] = useState<"menu" | "orders" | "inventory">("menu")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([])
  const [orderType, setOrderType] = useState<"room_service" | "walk_in">("room_service")
  const [menuSearch, setMenuSearch] = useState("")
  const [catalogSearch, setCatalogSearch] = useState("")
  const [inventorySearch, setInventorySearch] = useState("")
  const [orderSearch, setOrderSearch] = useState("")
  const [menuCategory, setMenuCategory] = useState("food")
  const [trackStock, setTrackStock] = useState(false)
  const [addStockUnit, setAddStockUnit] = useState("bottles")
  const [stockQty, setStockQty] = useState<Record<number, string>>({})
  const [linkQty, setLinkQty] = useState<Record<number, string>>({})
  const [linkUnit, setLinkUnit] = useState<Record<number, string>>({})

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
  const handleAddMenuItem = async (item: Omit<MenuItem, "id"> & { trackStock?: boolean; stock?: number; stockUnit?: string; minStock?: number }) => {
    try {
      await createMenuItem(item)
      await loadData()
      setIsDialogOpen(false)
      setMenuCategory("food")
      setTrackStock(false)
    } catch (error) {
      console.error('Failed to add menu item:', error)
      alert('Failed to add menu item')
    }
  }

  const handleTrackMenuStock = async (menuItem: MenuItem, stock: number, unit: string) => {
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: menuItem.name,
          category: menuItem.category === "food" || menuItem.category === "snacks" ? "Other" : "Beverages",
          unit,
          storeStock: 0,
          barStock: stock,
          goodStockLevel: 20,
          lowStockLevel: 5,
          criticalStockLevel: 1,
          menuItemId: menuItem.id
        })
      })
      const data = await response.json()
      if (!response.ok) {
        alert(data.error || "Failed to start tracking stock")
        return
      }
      await loadData()
    } catch (error) {
      console.error("Failed to track stock:", error)
      alert("Failed to start tracking stock")
    }
  }

  const handleUpdateBarStock = async (inventoryId: number, changeAmount: number) => {
    if (!Number.isFinite(changeAmount) || changeAmount === 0) {
      alert("Enter a quantity to add or use")
      return
    }
    try {
      const response = await fetch(`/api/inventory/${inventoryId}/update-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeAmount,
          transactionType: changeAmount > 0 ? "purchase" : "usage",
          location: "bar",
          notes: "Updated from RMS"
        })
      })
      const data = await response.json()
      if (!response.ok) {
        alert(data.error || "Failed to update stock")
        return
      }
      setStockQty({ ...stockQty, [inventoryId]: "" })
      await loadData()
    } catch (error) {
      console.error("Failed to update stock:", error)
      alert("Failed to update stock")
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
  const handleOpenEditOrder = (order: Order) => {
    setEditingOrder(order)
    setSelectedItems(order.items)
    setIsOrderDialogOpen(true)
  }

  const setItemQuantity = (item: MenuItem, quantity: number) => {
    if (quantity <= 0) {
      setSelectedItems((prev) => prev.filter((i) => i.menuItemId !== item.id))
      return
    }
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id)
      if (existing) {
        return prev.map((i) => (i.menuItemId === item.id ? { ...i, quantity } : i))
      }
      return [...prev, { menuItemId: item.id, name: item.name, quantity, price: item.price }]
    })
  }

  const changeSelectedQuantity = (menuItemId: number, delta: number) => {
    const current = selectedItems.find((i) => i.menuItemId === menuItemId)
    if (!current) return
    const nextQty = current.quantity + delta
    if (nextQty <= 0) {
      setSelectedItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId))
      return
    }
    setSelectedItems((prev) => prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: nextQty } : i)))
  }

  const orderTotals = calculateInclusiveVat({
    inclusiveSubtotal: selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  })

  const handleCreateOrder = async (orderData: any) => {
    try {
      console.log('🔵 Frontend: Starting order creation', orderData)
      
      const inclusiveSubtotal = orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
      const totals = calculateInclusiveVat({ inclusiveSubtotal })
      
      const orderPayload = {
        orderNumber: `ORD-${Date.now()}`,
        orderDate: new Date().toISOString(),
        roomNumber: orderData.orderType === "walk_in" ? (orderData.tableNumber || "Walk-in") : orderData.roomNumber,
        guestName: orderData.orderType === "walk_in" ? (orderData.guestName || "Walk-in Guest") : orderData.guestName,
        bookingId: orderData.orderType === "walk_in" ? null : (bookings.find((b: any) => b.roomNumber === orderData.roomNumber)?.id || null),
        orderType: orderData.orderType,
        items: orderData.items,
        subtotal: totals.inclusiveSubtotal,
        discountType: null,
        discountValue: 0,
        discountAmount: 0,
        tax: totals.vatAmount,
        taxPercentage: DEFAULT_VAT_PERCENT,
        total: totals.total,
        status: "pending",
        paymentStatus: "unpaid",
        paymentMethod: null
      }
      
      console.log('🔵 Frontend: Sending payload to API', orderPayload)
      
      const result = await createRestaurantOrder(orderPayload)
      console.log('✅ Frontend: Order created successfully', result)
      
      // Add notification for new restaurant order
      addNotification(
        "order",
        "New Restaurant Order",
        `Order #${orderPayload.orderNumber} - ${orderData.orderType === "walk_in" ? `Table ${orderData.tableNumber} • ${orderPayload.guestName}` : `Room ${orderPayload.roomNumber} (${orderPayload.guestName})`} - NPR ${totals.total.toFixed(2)}`,
        "high",
        "restaurant"
      )
      
      await loadData()
      setIsOrderDialogOpen(false)
      setSelectedItems([])
      setOrderType("room_service")
      alert('✅ Order created successfully!')
    } catch (error: any) {
      console.error('❌ Frontend: Failed to create order:', error)
      console.error('Error details:', error.message)
      alert(`❌ Failed to create order: ${error.message || 'Unknown error'}`)
    }
  }

  const handleUpdateOrder = async (orderData: any) => {
    if (!editingOrder) return
    
    try {
      console.log('🔵 Frontend: Starting order update', orderData)
      console.log('🔵 Editing order:', editingOrder)
      
      const inclusiveSubtotal = orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
      const totals = calculateInclusiveVat({ inclusiveSubtotal })
      
      const orderPayload = {
        items: orderData.items,
        subtotal: totals.inclusiveSubtotal,
        discountType: null,
        discountValue: 0,
        discountAmount: 0,
        tax: totals.vatAmount,
        taxPercentage: DEFAULT_VAT_PERCENT,
        total: totals.total,
      }
      
      console.log('🔵 Frontend: Sending update payload to API', orderPayload)
      
      const result = await updateRestaurantOrder(editingOrder.id, orderPayload)
      console.log('✅ Frontend: Order updated successfully', result)
      
      await loadData()
      setIsOrderDialogOpen(false)
      setSelectedItems([])
      setEditingOrder(null)
      alert('✅ Order updated successfully!')
    } catch (error: any) {
      console.error('❌ Frontend: Failed to update order:', error)
      console.error('Error details:', error.message, error)
      alert(`❌ Failed to update order: ${error.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Restaurant Management System (RMS)</h2>
        <div className="flex flex-wrap gap-2">
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
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <h3 className="text-lg font-semibold">Menu Items</h3>
            <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search menu items..."
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.filter((item) => matchesItemSearch(item, catalogSearch)).map(item => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap justify-between items-start gap-2">
                    <span>{item.name}</span>
                    <Badge>{item.category}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-primary">NPR {item.price}</p>
                    <p className="text-sm text-gray-600">Category: {item.category}</p>
                    {item.inventoryItem && isCountableUnit(item.inventoryItem.unit) && (
                      <p className="text-sm text-emerald-700">
                        Bar stock: {item.inventoryItem.barStock} {item.inventoryItem.unit}
                      </p>
                    )}
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
          {menuItems.length > 0 && menuItems.filter((item) => matchesItemSearch(item, catalogSearch)).length === 0 && (
            <p className="text-center text-gray-500 py-6">No menu items match “{catalogSearch}”.</p>
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <h3 className="text-lg font-semibold">Orders</h3>
            <Button onClick={() => setIsOrderDialogOpen(true)} className="w-full sm:w-auto">
              <ShoppingCart className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>

          <AdminSearch
            value={orderSearch}
            onChange={setOrderSearch}
            placeholder="Search orders, rooms, guests, or items..."
          />

          <div className="space-y-3">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No orders yet. Click "New Order" to create one.
                </CardContent>
              </Card>
            ) : (
              <>
              {orders.filter((order) => matchesSearch(
                orderSearch,
                order.orderNumber,
                order.roomNumber,
                order.guestName,
                order.status,
                ...(order.items || []).map((item) => item.name)
              )).length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-500">
                    No orders match “{orderSearch}”.
                  </CardContent>
                </Card>
              )}
              {orders.filter((order) => matchesSearch(
                orderSearch,
                order.orderNumber,
                order.roomNumber,
                order.guestName,
                order.status,
                ...(order.items || []).map((item) => item.name)
              )).map(order => (
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
                      </div>
                    </div>
                    
                    {/* Status and Actions */}
                    <div className="flex gap-2 mb-3">
                      <Select
                        value={order.status}
                        onValueChange={async (value) => {
                          try {
                            await updateRestaurantOrder(order.id, { status: value })
                            await loadData()
                          } catch (error) {
                            console.error('Failed to update order status:', error)
                            alert('Failed to update order status')
                          }
                        }}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                              Pending
                            </div>
                          </SelectItem>
                          <SelectItem value="preparing">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                              Preparing
                            </div>
                          </SelectItem>
                          <SelectItem value="ready">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                              Ready
                            </div>
                          </SelectItem>
                          <SelectItem value="delivered">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-gray-500 mr-2" />
                              Delivered
                            </div>
                          </SelectItem>
                          <SelectItem value="cancelled">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                              Cancelled
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleOpenEditOrder(order)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={async () => {
                          if (confirm('Delete this order?')) {
                            try {
                              await deleteRestaurantOrder(order.id)
                              await loadData()
                            } catch (error) {
                              console.error('Failed to delete order:', error)
                              alert(error instanceof Error ? error.message : 'Failed to delete order')
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                    
                    <div className="border-t pt-3 space-y-1">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-medium">NPR {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Inclusive subtotal:</span>
                          <span>NPR {order.subtotal.toFixed(2)}</span>
                        </div>
                        {order.discountValue && order.discountValue > 0 && (
                          <div className="flex justify-between text-sm text-green-700">
                            <span className="text-gray-600">
                              Discount ({order.discountType === "percentage" ? `${order.discountValue}%` : `NPR ${order.discountValue}`}):
                            </span>
                            <span>- NPR {(order.discountAmount || 0).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Exclusive Amount:</span>
                          <span>NPR {(order.total - order.tax).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">VAT amount:</span>
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
              ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <h3 className="text-lg font-semibold">RMS Stock</h3>
              <p className="text-sm text-gray-600">
                Countable items (bottles, pieces, cans) deduct from bar stock when sold. Transfer from Inventory when the bar needs more.
              </p>
            </div>
            <Badge className="bg-blue-600 w-fit">
              {menuItems.filter((item) => item.inventoryItem).length} / {menuItems.length} tracked
            </Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              placeholder="Search stock items..."
              className="pl-9"
            />
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold">Item</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold">Store / Bar</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-sm font-semibold">Update bar</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.filter((item) => matchesItemSearch(item, inventorySearch)).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 sm:px-6 py-8 text-center text-gray-500">
                      {inventorySearch ? `No stock items match “${inventorySearch}”.` : "No menu items yet."}
                    </td>
                  </tr>
                )}
                {menuItems.filter((item) => matchesItemSearch(item, inventorySearch)).map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-3 sm:px-6 py-4">
                      <Badge variant="outline">{item.category}</Badge>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      {item.inventoryItem ? (
                        <div className="text-sm">
                          <p>{item.inventoryItem.storeStock} / {item.inventoryItem.barStock} {item.inventoryItem.unit}</p>
                          {item.inventoryItem.barStock <= 5 && (
                            <p className="text-orange-600 text-xs">Low bar stock</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not tracked</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      {item.inventoryItem ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            className="w-20"
                            value={stockQty[item.inventoryItem.id] || ""}
                            onChange={(e) => setStockQty({ ...stockQty, [item.inventoryItem!.id]: e.target.value })}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateBarStock(item.inventoryItem!.id, parseFloat(stockQty[item.inventoryItem!.id] || "0"))}
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateBarStock(item.inventoryItem!.id, -parseFloat(stockQty[item.inventoryItem!.id] || "0"))}
                          >
                            Use
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <Select
                            value={linkUnit[item.id] || (item.category === "bar" || item.category === "drinks" ? "bottles" : "pieces")}
                            onValueChange={(value) => setLinkUnit({ ...linkUnit, [item.id]: value })}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTABLE_UNITS.map((unit) => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Bar qty"
                            className="w-24"
                            value={linkQty[item.id] || ""}
                            onChange={(e) => setLinkQty({ ...linkQty, [item.id]: e.target.value })}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleTrackMenuStock(
                              item,
                              parseFloat(linkQty[item.id] || "0") || 0,
                              linkUnit[item.id] || (item.category === "bar" || item.category === "drinks" ? "bottles" : "pieces")
                            )}
                          >
                            Track
                          </Button>
                        </div>
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
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) {
          setMenuCategory("food")
          setTrackStock(false)
          setAddStockUnit("bottles")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const category = menuCategory
            handleAddMenuItem({
              name: formData.get("name") as string,
              price: parseFloat(formData.get("price") as string),
              category: category,
              description: "",
              available: true,
              trackStock: trackStock || Number(formData.get("stock")) > 0,
              stock: parseFloat(formData.get("stock") as string) || 0,
              stockUnit: addStockUnit,
              minStock: parseFloat(formData.get("minStock") as string) || 5
            })
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (NPR) *</Label>
                <Input id="price" name="price" type="number" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  name="category" 
                  required
                  value={menuCategory}
                  onValueChange={(value) => {
                    setMenuCategory(value)
                    if (value === "bar" || value === "drinks") {
                      setTrackStock(true)
                      setAddStockUnit("bottles")
                    } else if (value === "food" || value === "snacks") {
                      setAddStockUnit("pieces")
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
            <div className="space-y-3 border rounded-lg p-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={trackStock}
                  onChange={(e) => setTrackStock(e.target.checked)}
                />
                Track countable stock (bottles, pieces, cans)
              </label>
              {trackStock && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stockUnit">Unit</Label>
                    <Select value={addStockUnit} onValueChange={setAddStockUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTABLE_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Bar stock now</Label>
                    <Input id="stock" name="stock" type="number" min="0" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Low stock alert</Label>
                    <Input id="minStock" name="minStock" type="number" min="0" defaultValue="5" />
                  </div>
                </div>
              )}
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

      {/* New/Edit Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={(open) => {
        setIsOrderDialogOpen(open)
        if (!open) {
          setEditingOrder(null)
          setSelectedItems([])
          setOrderType("room_service")
          setMenuSearch("")
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'Edit Order' : 'Create New Order'}</DialogTitle>
            {!editingOrder && orderType === "room_service" && bookings.length === 0 && (
              <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded mt-2">
                ⚠️ No checked-in guests available. Please check in a guest from the Bookings page first or select Walk-in order type.
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
            
            // Validate room service orders have room number
            if (!editingOrder && orderType === "room_service") {
              const roomNumber = formData.get("roomNumber") as string
              if (!roomNumber || roomNumber === "none") {
                alert("Please select a room for room service orders")
                return
              }
            }
            
            if (editingOrder) {
              handleUpdateOrder({
                items: selectedItems
              })
            } else {
              handleCreateOrder({
                orderType,
                roomNumber: formData.get("roomNumber") as string,
                guestName: orderType === "walk_in" 
                  ? (formData.get("walkInGuestName") as string)
                  : (formData.get("guestName") as string),
                tableNumber: orderType === "walk_in" ? (formData.get("tableNumber") as string) : undefined,
                items: selectedItems
              })
            }
          }} className="space-y-4">
            {/* Order Type Selection */}
            {!editingOrder && (
              <div className="space-y-2">
                <Label>Order Type *</Label>
                <Select 
                  value={orderType} 
                  onValueChange={(value: "room_service" | "walk_in") => setOrderType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room_service">🛎️ Room Service</SelectItem>
                    <SelectItem value="walk_in">🚶 Walk-in / Dine-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Room & Guest Info - Only show for room service or when editing */}
            {(orderType === "room_service" || editingOrder) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number *</Label>
                {editingOrder ? (
                  <Input 
                    id="roomNumber"
                    name="roomNumber" 
                    value={editingOrder.roomNumber}
                    disabled
                    className="bg-gray-100"
                  />
                ) : (
                  <Select 
                    name="roomNumber" 
                    required={orderType === "room_service"}
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
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestName">Guest Name *</Label>
                <Input 
                  id="guestName" 
                  name="guestName" 
                  defaultValue={editingOrder?.guestName || ''}
                  required 
                  readOnly 
                  className="bg-gray-50" 
                />
              </div>
            </div>
            )}

            {/* Walk-in specific fields */}
            {orderType === "walk_in" && !editingOrder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="walkInGuestName">Guest Name</Label>
                  <Input 
                    id="walkInGuestName" 
                    name="walkInGuestName" 
                    placeholder="Enter guest name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tableNumber">Table Number *</Label>
                  <Input 
                    id="tableNumber" 
                    name="tableNumber" 
                    placeholder="e.g., T1, T2, etc."
                    required
                  />
                </div>
              </div>
            )}

            {/* Menu Items Selection */}
            <div className="space-y-2">
              <Label>Add Items to Order</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search food or drinks..."
                  className="pl-9"
                />
              </div>
              <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                {menuItems.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No menu items available. Please add menu items first.</p>
                ) : (
                  menuItems.filter(item => item.available && matchesItemSearch(item, menuSearch)).map(item => {
                    const quantity = selectedItems.find((i) => i.menuItemId === item.id)?.quantity || 0
                    return (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">NPR {item.price} • {item.category}</p>
                        {item.inventoryItem && isCountableUnit(item.inventoryItem.unit) && (
                          <p className={`text-xs ${item.inventoryItem.barStock <= 0 ? "text-red-600" : "text-emerald-700"}`}>
                            Bar: {item.inventoryItem.barStock} {item.inventoryItem.unit}
                          </p>
                        )}
                      </div>
                      {quantity === 0 ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => setItemQuantity(item, 1)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => setItemQuantity(item, quantity - 1)}>
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-6 text-center font-medium">{quantity}</span>
                          <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => setItemQuantity(item, quantity + 1)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    )
                  })
                )}
                {menuItems.length > 0 && menuItems.filter(item => item.available && matchesItemSearch(item, menuSearch)).length === 0 && (
                  <p className="text-center text-gray-500 py-4">No items match “{menuSearch}”.</p>
                )}
              </div>
            </div>

            {/* Order Summary */}
            {selectedItems.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4 space-y-2">
                  <p className="font-semibold">Order Summary:</p>
                  {selectedItems.map((item) => (
                    <div key={item.menuItemId} className="flex items-center justify-between text-sm gap-2">
                      <span className="flex-1">{item.name}</span>
                      <div className="flex items-center gap-1">
                        <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => changeSelectedQuantity(item.menuItemId, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => changeSelectedQuantity(item.menuItemId, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="w-28 text-right">NPR {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-blue-300 pt-2 mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Inclusive subtotal:</span>
                      <span>NPR {orderTotals.inclusiveSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Exclusive Amount:</span>
                      <span>NPR {orderTotals.exclusiveAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>VAT amount:</span>
                      <span>NPR {orderTotals.vatAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-blue-300">
                      <span>Total:</span>
                      <span className="text-primary">
                        NPR {orderTotals.total.toFixed(2)}
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
                setEditingOrder(null)
              }} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={selectedItems.length === 0}>
                {editingOrder ? 'Update Order' : 'Create Order'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


    </div>
  )
}

