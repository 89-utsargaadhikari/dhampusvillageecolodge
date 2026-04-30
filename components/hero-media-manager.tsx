"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Image as ImageIcon, Video, Upload, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface HeroMedia {
  id: number
  type: "image" | "video"
  url: string
  order: number
}

export default function HeroMediaManager() {
  const [heroMedia, setHeroMedia] = useState<HeroMedia[]>([])
  const [newMedia, setNewMedia] = useState({
    type: "image" as "image" | "video",
    url: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchHeroMedia()
  }, [])

  const fetchHeroMedia = async () => {
    try {
      const response = await fetch("/api/hero-media")
      const data = await response.json()
      setHeroMedia(data)
    } catch (error) {
      console.error("Failed to fetch hero media:", error)
    }
  }

  const handleAdd = async () => {
    if (!newMedia.url.trim()) {
      alert("Please enter a URL")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/hero-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newMedia,
          order: heroMedia.length,
        }),
      })

      if (response.ok) {
        await fetchHeroMedia()
        setNewMedia({ type: "image", url: "" })
        alert("✅ Hero media added successfully!")
      }
    } catch (error) {
      console.error("Failed to add hero media:", error)
      alert("❌ Failed to add hero media")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this media item?")) return

    try {
      const response = await fetch(`/api/hero-media/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchHeroMedia()
        alert("✅ Media deleted successfully!")
      }
    } catch (error) {
      console.error("Failed to delete hero media:", error)
      alert("❌ Failed to delete media")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setNewMedia({ ...newMedia, url: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Hero Section Media</h2>
        <p className="text-gray-600">
          Manage videos and images for the hero slideshow. Media will play/show in random order or as a slideshow.
        </p>
      </div>

      {/* Add New Media */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Plus className="w-5 h-5" />
            Add New Media
          </CardTitle>
          <CardDescription>Upload images or add video URLs for the hero section</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Media Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newMedia.type === "image" ? "default" : "outline"}
                  className={newMedia.type === "image" ? "bg-green-600" : ""}
                  onClick={() => setNewMedia({ ...newMedia, type: "image" })}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Image
                </Button>
                <Button
                  type="button"
                  variant={newMedia.type === "video" ? "default" : "outline"}
                  className={newMedia.type === "video" ? "bg-green-600" : ""}
                  onClick={() => setNewMedia({ ...newMedia, type: "video" })}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Video
                </Button>
              </div>
            </div>

            {newMedia.type === "image" && (
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload Image</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="border-green-300"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL {newMedia.type === "video" && "(Video URL)"}</Label>
            <Input
              id="url"
              value={newMedia.url}
              onChange={(e) => setNewMedia({ ...newMedia, url: e.target.value })}
              placeholder={newMedia.type === "image" ? "Or paste image URL" : "https://example.com/video.mp4"}
              className="border-green-300"
            />
          </div>

          {newMedia.url && (
            <div className="border-2 border-green-200 rounded-lg p-4 bg-white">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              {newMedia.type === "image" ? (
                <img src={newMedia.url} alt="Preview" className="w-full max-h-48 object-cover rounded" />
              ) : (
                <video src={newMedia.url} className="w-full max-h-48 object-cover rounded" controls />
              )}
            </div>
          )}

          <Button
            onClick={handleAdd}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            {loading ? "Adding..." : "Add Media"}
          </Button>
        </CardContent>
      </Card>

      {/* Media List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Hero Media ({heroMedia.length})</CardTitle>
          <CardDescription>
            These will display in {heroMedia.length > 1 ? "random order or as slideshow" : "the hero section"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {heroMedia.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hero media added yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {heroMedia.map((media) => (
                <div
                  key={media.id}
                  className="group relative border-2 border-gray-200 rounded-lg overflow-hidden hover:border-yellow-400 transition-all"
                >
                  {media.type === "image" ? (
                    <img src={media.url} alt="Hero media" className="w-full h-48 object-cover" />
                  ) : (
                    <video src={media.url} className="w-full h-48 object-cover" />
                  )}
                  
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    {media.type === "image" ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                    {media.type}
                  </div>

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      onClick={() => handleDelete(media.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Videos will play until finished, then move to the next item. Images will show for 5 seconds each. 
          The order will be randomized on each page load!
        </p>
      </div>
    </div>
  )
}



