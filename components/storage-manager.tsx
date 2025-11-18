"use client"

import { useState, useEffect } from "react"
import { Trash2, HardDrive, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRooms, getGallery, deleteRoom, getBookings } from "@/lib/storage"

export default function StorageManager() {
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 5 * 1024 * 1024, // 5MB typical localStorage limit
    percentage: 0,
  })
  const [rooms, setRooms] = useState<any[]>([])
  const [gallery, setGallery] = useState<any[]>([])

  useEffect(() => {
    calculateStorage()
    loadData()
  }, [])

  const calculateStorage = () => {
    let total = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    const percentage = Math.round((total / (5 * 1024 * 1024)) * 100)
    setStorageInfo({
      used: total,
      total: 5 * 1024 * 1024,
      percentage,
    })
  }

  const loadData = () => {
    setRooms(getRooms())
    setGallery(getGallery())
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const getImageSize = (base64: string) => {
    return base64.length
  }

  const handleRemoveRoomImage = (roomId: number) => {
    if (confirm("Remove image from this room? (Room details will be kept)")) {
      const room = rooms.find((r) => r.id === roomId)
      if (room) {
        const updatedRoom = { ...room, image: "/placeholder.svg" }
        // Update room without image
        const allRooms = getRooms().map((r) => (r.id === roomId ? updatedRoom : r))
        localStorage.setItem("lodge_rooms", JSON.stringify(allRooms))
        calculateStorage()
        loadData()
      }
    }
  }

  const handleRemoveGalleryImage = (imageId: number) => {
    if (confirm("Delete this gallery image?")) {
      const updatedGallery = gallery.filter((g) => g.id !== imageId)
      localStorage.setItem("lodge_gallery", JSON.stringify(updatedGallery))
      calculateStorage()
      loadData()
    }
  }

  const handleClearNonEssential = () => {
    if (confirm("Clear all gallery images? (Rooms and bookings will be kept)")) {
      localStorage.setItem("lodge_gallery", JSON.stringify([]))
      calculateStorage()
      loadData()
    }
  }

  const roomsWithImages = rooms.filter((r) => r.image && r.image.startsWith("data:"))
  const galleryImages = gallery.filter((g) => g.src && g.src.startsWith("data:"))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Storage Management</h2>
      </div>

      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Used</span>
              <span className="font-bold">{formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  storageInfo.percentage > 90
                    ? "bg-red-500"
                    : storageInfo.percentage > 70
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {storageInfo.percentage}% full
              {storageInfo.percentage > 80 && (
                <span className="text-red-600 font-semibold ml-2">
                  <AlertTriangle className="inline w-4 h-4 mr-1" />
                  Running low on storage!
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleClearNonEssential}
            variant="outline"
            className="w-full justify-start text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <Trash2 className="mr-2 w-4 h-4" />
            Clear All Gallery Images ({galleryImages.length} images)
          </Button>
          <p className="text-xs text-gray-500">
            This will keep all rooms and bookings but remove gallery images
          </p>
        </CardContent>
      </Card>

      {/* Room Images */}
      <Card>
        <CardHeader>
          <CardTitle>Room Images ({roomsWithImages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roomsWithImages.map((room) => (
              <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <img src={room.image} alt={room.name} className="w-16 h-16 object-cover rounded" />
                  <div>
                    <p className="font-semibold">{room.name}</p>
                    <p className="text-sm text-gray-500">{formatBytes(getImageSize(room.image))}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleRemoveRoomImage(room.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {roomsWithImages.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No room images stored</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gallery Images */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery Images ({galleryImages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {galleryImages.map((image) => (
              <div key={image.id} className="relative group">
                <img src={image.src} alt={image.alt} className="w-full h-32 object-cover rounded" />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    onClick={() => handleRemoveGalleryImage(image.id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{formatBytes(getImageSize(image.src))}</p>
              </div>
            ))}
            {galleryImages.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4 col-span-2">No gallery images stored</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Storage Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• Images are automatically compressed to 800x600px at 70% quality</p>
          <p>• Use external image URLs instead of uploading (saves storage)</p>
          <p>• Regularly clean up unused gallery images</p>
          <p>• Consider moving to a real backend with database for production</p>
        </CardContent>
      </Card>
    </div>
  )
}



