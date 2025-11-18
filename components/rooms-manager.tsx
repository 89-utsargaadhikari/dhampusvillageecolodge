"use client"

import { useState, useEffect } from "react"
import { Trash2, Edit, Plus, X, Upload, Image as ImageIcon } from "lucide-react"
import { convertImageToBase64, type Room } from "@/lib/storage"
import { fetchRooms, createRoom, updateRoom as updateRoomAPI, deleteRoom as deleteRoomAPI } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RoomsManager() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    capacity: "2",
    status: "Available" as "Available" | "Booked",
    features: "",
    rating: "4.5",
    image: "",
    roomNumbers: "",
  })

  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      const roomsData = await fetchRooms()
      setRooms(roomsData)
    } catch (error) {
      console.error('Failed to load rooms:', error)
      alert('Failed to load rooms data')
    }
  }

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room)
      setFormData({
        name: room.name,
        price: room.price,
        description: room.description,
        capacity: room.capacity.toString(),
        status: room.status,
        features: room.features.join(", "),
        rating: room.rating.toString(),
        image: room.image,
        roomNumbers: room.roomNumbers?.join(", ") || "",
      })
      setImagePreview(room.image)
    } else {
      setEditingRoom(null)
      setFormData({
        name: "",
        price: "",
        description: "",
        capacity: "2",
        status: "Available",
        features: "",
        rating: "4.5",
        image: "",
        roomNumbers: "",
      })
      setImagePreview("")
    }
    setIsDialogOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const base64 = await convertImageToBase64(file)
        setFormData({ ...formData, image: base64 })
        setImagePreview(base64)
      } catch (error) {
        console.error("Error uploading image:", error)
        alert("Failed to upload image. Please try again.")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Parse room numbers
    const roomNumbersArray = formData.roomNumbers
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean)
    
    console.log('🔢 Parsed room numbers:', roomNumbersArray)

    const roomData = {
      name: formData.name,
      price: formData.price,
      description: formData.description,
      capacity: parseInt(formData.capacity),
      status: formData.status,
      features: formData.features.split(",").map((f) => f.trim()).filter(Boolean),
      rating: parseFloat(formData.rating),
      image: formData.image || "/placeholder.svg",
      roomNumbers: roomNumbersArray,
    }

    try {
      if (editingRoom) {
        await updateRoomAPI(editingRoom.id, roomData)
      } else {
        await createRoom(roomData)
      }

      await loadData()
      setIsDialogOpen(false)
      setEditingRoom(null)
    } catch (error) {
      console.error('Error saving room:', error)
      alert('Failed to save room')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this room?")) {
      try {
        await deleteRoomAPI(id)
        await loadData()
      } catch (error) {
        console.error('Failed to delete room:', error)
        alert('Failed to delete room')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Rooms Management</h2>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus size={20} />
          Add Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="relative h-48 bg-gray-100">
              <img
                src={room.image || "/placeholder.svg"}
                alt={room.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                <p className="text-sm text-gray-500">Capacity: {room.capacity} guests</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  room.status === "Available" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                }`}
              >
                {room.status}
              </span>
            </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{room.description}</p>
            <div className="flex justify-between items-center border-t pt-4">
                <p className="text-2xl font-bold text-primary">${room.price}</p>
              <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenDialog(room)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                  <Edit size={18} />
                </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                  <Trash2 size={18} />
                </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Room Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Room Image</Label>
              <div className="flex flex-col gap-4">
                {imagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview("")
                        setFormData({ ...formData, image: "" })
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("image")?.click()}
                    className="w-full"
                  >
                    <Upload size={16} className="mr-2" />
                    {imagePreview ? "Change Image" : "Upload Image"}
                  </Button>
                  
                  <div className="text-center text-xs text-gray-500">OR</div>
                  
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image && !formData.image.startsWith("data:") ? formData.image : ""}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value })
                      setImagePreview(e.target.value)
                    }}
                  />
                  <p className="text-xs text-gray-500">Use external image URL (saves storage space)</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Room Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (per night) *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating *</Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as "Available" | "Booked" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Booked">Booked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Input
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="e.g. Mountain View, WiFi, Fireplace"
              />
              <p className="text-xs text-gray-500">Separate features with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomNumbers">Room Numbers (comma-separated) *</Label>
              <Input
                id="roomNumbers"
                value={formData.roomNumbers}
                onChange={(e) => setFormData({ ...formData, roomNumbers: e.target.value })}
                placeholder="e.g. 101, 102, 103"
                required
              />
              <p className="text-xs text-gray-500">
                Specify individual room numbers for this room type (e.g., 101, 102, 103)
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingRoom ? "Update Room" : "Add Room"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
