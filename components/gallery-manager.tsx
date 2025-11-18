"use client"

import { useState, useEffect } from "react"
import { Trash2, Plus, Upload, X } from "lucide-react"
import { convertImageToBase64, type GalleryItem } from "@/lib/storage"
import { fetchGallery, createGalleryItem, deleteGalleryItem as deleteGalleryAPI } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function GalleryManager() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [formData, setFormData] = useState({
    alt: "",
    category: "Building",
    src: "",
  })

  useEffect(() => {
    loadGallery()
  }, [])
  
  const loadGallery = async () => {
    try {
      const items = await fetchGallery()
      setGalleryItems(items)
    } catch (error) {
      console.error('Failed to load gallery:', error)
    }
  }

  const handleOpenDialog = () => {
    setFormData({
      alt: "",
      category: "Building",
      src: "",
    })
    setImagePreview("")
    setIsDialogOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const base64 = await convertImageToBase64(file)
        setFormData({ ...formData, src: base64 })
        setImagePreview(base64)
      } catch (error) {
        console.error("Error uploading image:", error)
        alert("Failed to upload image. Please try again.")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.src) {
      alert("Please upload an image")
      return
    }

    try {
      await createGalleryItem({
        src: formData.src,
        alt: formData.alt,
        category: formData.category,
      })

      await loadGallery()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to add gallery item:', error)
      alert('Failed to add gallery item')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this image?")) {
      try {
        await deleteGalleryAPI(id)
        await loadGallery()
      } catch (error) {
        console.error('Failed to delete gallery item:', error)
        alert('Failed to delete gallery item')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gallery Management</h2>
        <Button onClick={handleOpenDialog} className="flex items-center gap-2">
          <Plus size={20} />
          Add Image
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {galleryItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden group">
            <div className="relative overflow-hidden h-48">
              <img
                src={(item as any).image || item.src || "/placeholder.svg"}
                alt={(item as any).title || item.alt || "Gallery image"}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="bg-white text-red-600 p-2 rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">{(item as any).title || item.alt}</p>
              <p className="text-xs text-gray-500">{item.category}</p>
            </div>
          </div>
        ))}

        {/* Upload new placeholder */}
        <div
          onClick={handleOpenDialog}
          className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors h-[280px]"
        >
          <Plus size={32} className="text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-600">Add New Image</p>
        </div>
      </div>

      {/* Add Image Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Image</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Image *</Label>
              <div className="flex flex-col gap-4">
                {imagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview("")
                        setFormData({ ...formData, src: "" })
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
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
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alt">Image Title *</Label>
              <Input
                id="alt"
                value={formData.alt}
                onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                placeholder="e.g. Mountain View at Sunset"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Building">Building</SelectItem>
                  <SelectItem value="Rooms">Rooms</SelectItem>
                  <SelectItem value="Dining">Dining</SelectItem>
                  <SelectItem value="Amenities">Amenities</SelectItem>
                  <SelectItem value="Views">Views</SelectItem>
                  <SelectItem value="Activities">Activities</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Image</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
