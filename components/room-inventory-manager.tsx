"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, DoorOpen, Save } from "lucide-react"
import { type Room, type RoomInventoryItem } from "@/lib/storage"
import { 
  fetchRooms, 
  fetchRoomInventory, 
  createRoom,
  createRoomInventoryItem,
  bulkUpdateRoomInventory, 
  deleteRoomInventoryItem 
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canonicalizeRoomTypeName, isCatalogRoomType } from "@/lib/hotel"
import RoomTypeCombobox from "@/components/room-type-combobox"
import { AdminSearch, matchesSearch } from "@/components/admin-search"
import { AdminLoading, useAdminLoader } from "@/components/admin-loading"

export default function RoomInventoryManager() {
  const [roomTypes, setRoomTypes] = useState<Room[]>([])
  const [inventory, setInventory] = useState<RoomInventoryItem[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { loading, run } = useAdminLoader()
  const [editingItem, setEditingItem] = useState<RoomInventoryItem | null>(null)
  const [formData, setFormData] = useState({
    roomNumber: "",
    roomTypeId: "",
    floor: "",
    notes: "",
  })

  // Load data
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      await run(async () => {
        const [roomsData, inventoryData] = await Promise.all([
          fetchRooms(),
          fetchRoomInventory()
        ])
        setRoomTypes(roomsData)
        setInventory(inventoryData)
      })
    } catch (error) {
      console.error('Failed to load inventory data:', error)
      alert('Failed to load inventory data')
    }
  }

  const handleOpenDialog = (item?: RoomInventoryItem, presetTypeId?: string) => {
    fetchRooms()
      .then(setRoomTypes)
      .catch(() => {})

    if (item) {
      setEditingItem(item)
      setFormData({
        roomNumber: item.roomNumber,
        roomTypeId: item.roomTypeId.toString(),
        floor: item.floor || "",
        notes: item.notes || "",
      })
    } else {
      setEditingItem(null)
      setFormData({
        roomNumber: "",
        roomTypeId: presetTypeId || "",
        floor: "",
        notes: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleCreateRoomType = async (name: string) => {
    try {
      const created = await createRoom({ name: canonicalizeRoomTypeName(name) || name })
      setRoomTypes((prev) => prev.some((room) => room.id === created.id) ? prev : [...prev, created])
      setFormData((prev) => ({ ...prev, roomTypeId: String(created.id) }))
    } catch (error) {
      try {
        const roomsData = await fetchRooms()
        setRoomTypes(roomsData)
        const match = roomsData.find(
          (room: Room) => room.name.toLowerCase() === name.toLowerCase()
        )
        if (match) {
          setFormData((prev) => ({ ...prev, roomTypeId: String(match.id) }))
        }
      } catch {
        // Keep the original create error
      }
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const selectedRoom = roomTypes.find((r) => r.id.toString() === formData.roomTypeId)
    if (!selectedRoom) {
      alert("Please select or create a room type")
      return
    }

    const newItem = {
      roomNumber: formData.roomNumber,
      roomType: selectedRoom.name,
      roomTypeId: selectedRoom.id,
      floor: formData.floor,
      notes: formData.notes,
    }

    try {
      if (editingItem) {
        // For updates, we use bulk update
        const updatedInventory = inventory.map((item) =>
          item.roomNumber === editingItem.roomNumber ? newItem : item
        )
        updatedInventory.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
        await bulkUpdateRoomInventory(updatedInventory)
      } else {
        // Add new
        if (inventory.find((item) => item.roomNumber === formData.roomNumber)) {
          alert("This room number already exists!")
          return
        }
        await createRoomInventoryItem(newItem)
      }

      await loadData()
      setIsDialogOpen(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Failed to save room inventory:', error)
      alert('Failed to save room inventory')
    }
  }

  const handleDelete = async (roomNumber: string) => {
    if (confirm(`Delete room ${roomNumber}?`)) {
      try {
        await deleteRoomInventoryItem(roomNumber)
        await loadData()
      } catch (error) {
        console.error('Failed to delete room inventory:', error)
        alert('Failed to delete room inventory')
      }
    }
  }

  // Group inventory by room type
  const inventoryByType = roomTypes
    .map((type) => ({
      ...type,
      rooms: inventory.filter((item) =>
        item.roomTypeId === type.id &&
        matchesSearch(searchQuery, item.roomNumber, type.name, item.floor, item.notes)
      ),
    }))
    .filter((type) => {
      const hasRooms = type.rooms.length > 0
      if (searchQuery.trim()) return hasRooms
      return isCatalogRoomType(type.name) || hasRooms
    })

  if (loading) return <AdminLoading label="Loading room numbers..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Room Inventory</h2>
          <p className="text-sm text-gray-600">Manage individual room numbers and their assignments</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus size={20} />
          Add Room Number
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{inventory.length}</p>
              <p className="text-sm text-gray-600">Total Room Numbers</p>
            </div>
          </CardContent>
        </Card>
        {roomTypes.slice(0, 4).map((type) => {
          const count = inventory.filter((item) => item.roomTypeId === type.id).length
          return (
            <Card key={type.id}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{count}</p>
                  <p className="text-sm text-gray-600">{type.name}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AdminSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search room numbers, types, floors..."
      />

      {/* Inventory by Room Type */}
      <div className="space-y-6">
        {inventoryByType.length === 0 && searchQuery && (
          <p className="text-center text-gray-500 py-6">No rooms match “{searchQuery}”.</p>
        )}
        {inventoryByType.map((type) => (
          <Card key={type.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{type.name}</span>
                <span className="text-sm font-normal text-gray-600">{type.rooms.length} rooms</span>
              </CardTitle>
              <CardDescription>Individual room numbers assigned to this type</CardDescription>
            </CardHeader>
            <CardContent>
              {type.rooms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DoorOpen className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No room numbers assigned yet</p>
                  <Button
                    onClick={() => handleOpenDialog(undefined, type.id.toString())}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Add First Room
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {type.rooms.map((room) => (
                    <div
                      key={room.roomNumber}
                      className="relative border-2 border-gray-200 rounded-lg p-4 hover:border-primary transition-all bg-white"
                    >
                      <div className="text-center space-y-2">
                        <DoorOpen className="w-8 h-8 mx-auto text-primary" />
                        <p className="font-bold text-xl">{room.roomNumber}</p>
                        {room.floor && <p className="text-xs text-gray-500">Floor {room.floor}</p>}
                        {room.notes && (
                          <p className="text-xs text-gray-600 truncate" title={room.notes}>
                            {room.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 mt-3 justify-center">
                        <button
                          onClick={() => handleOpenDialog(room)}
                          className="flex-1 text-blue-600 hover:text-blue-800 p-1 rounded"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(room.roomNumber)}
                          className="flex-1 text-red-600 hover:text-red-800 p-1 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All Rooms Table View */}
      <Card>
        <CardHeader>
          <CardTitle>All Room Numbers</CardTitle>
          <CardDescription>Complete inventory list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Room Number</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Room Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Floor</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Notes</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No room numbers added yet. Click "Add Room Number" to get started.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.roomNumber} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-primary">{item.roomNumber}</td>
                      <td className="px-4 py-3">{item.roomType}</td>
                      <td className="px-4 py-3 text-gray-600">{item.floor || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.notes || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenDialog(item)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.roomNumber)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Room Number" : "Add New Room Number"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number *</Label>
              <Input
                id="roomNumber"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="e.g. 102, 108, 201"
                required
                disabled={!!editingItem}
              />
              <p className="text-xs text-gray-500">Enter the physical room number</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomType">Room Type *</Label>
              <RoomTypeCombobox
                roomTypes={roomTypes}
                value={formData.roomTypeId}
                onChange={(roomTypeId) => setFormData({ ...formData, roomTypeId })}
                onCreate={handleCreateRoomType}
              />
              <p className="text-xs text-gray-500">Choose Standard Room or Deluxe Room. Occupancy (SGL/DBL/TRPL) is chosen on the booking.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">Floor (optional)</Label>
              <Input
                id="floor"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="e.g. 1, 2, Ground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Corner room, Accessible, Balcony"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex items-center gap-2">
                <Save size={16} />
                {editingItem ? "Update" : "Add"} Room
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900">💡 How to Use Room Inventory</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Click "Add Room Number" to add a physical door (101, 102, 201)</li>
              <li>Assign it to Standard Room or Deluxe Room</li>
              <li>On the booking, pick occupancy (SGL, DBL, or TRPL) for that stay</li>
              <li>When checking a guest in, only rooms of that type are offered</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

