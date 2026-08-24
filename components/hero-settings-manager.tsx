"use client"

import { useState, useEffect, useRef } from "react"
import { Upload, X, Save, Plus, Trash2, Image as ImageIcon, Video as VideoIcon } from "lucide-react"
import { convertImageToBase64, type HeroSettings } from "@/lib/storage"
import { fetchHeroSettings, updateHeroSettings } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface HeroMedia {
  id: number
  type: "image" | "video"
  url: string
  order: number
}

export default function HeroSettingsManager() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings] = useState<HeroSettings>({
    backgroundImage: "",
    videoUrl: "",
    title: "",
    subtitle: "",
  })
  const [imagePreview, setImagePreview] = useState<string>("")
  const [videoPreview, setVideoPreview] = useState<string>("")
  const [isSaved, setIsSaved] = useState(false)
  const [heroMedia, setHeroMedia] = useState<HeroMedia[]>([])
  const [newMedia, setNewMedia] = useState({
    type: "image" as "image" | "video",
    url: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSettings()
    fetchHeroMedia()
  }, [])
  
  const loadSettings = async () => {
    try {
      const data = await fetchHeroSettings()
      if (data) {
        setSettings(data)
        setImagePreview(data.backgroundImage)
        setVideoPreview(data.videoUrl || "")
      }
    } catch (error) {
      console.error('Failed to load hero settings:', error)
    }
  }

  const fetchHeroMedia = async () => {
    try {
      const response = await fetch("/api/hero-media")
      const data = await response.json()
      // Ensure data is an array
      setHeroMedia(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch hero media:", error)
      setHeroMedia([])
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const base64 = await convertImageToBase64(file)
        setSettings({ ...settings, backgroundImage: base64 })
        setImagePreview(base64)
      } catch (error) {
        console.error("Error uploading image:", error)
        alert("Failed to upload image. Please try again.")
      }
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const base64 = await convertImageToBase64(file)
        setSettings({ ...settings, videoUrl: base64 })
        setVideoPreview(base64)
      } catch (error) {
        console.error("Error uploading video:", error)
        alert("Failed to upload video. Please try again.")
      }
    }
  }

  const handleSave = async () => {
    try {
      await updateHeroSettings(settings)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save hero settings:', error)
      alert('Failed to save settings')
    }
  }

  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const base64 = await convertImageToBase64(file)
      setNewMedia({ ...newMedia, url: base64 })
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Failed to upload file")
    }
  }

  const handleAddMedia = async () => {
    if (!newMedia.url.trim()) {
      alert("Please upload a file")
      return
    }

    setLoading(true)
    try {
      console.log("Adding media:", newMedia)
      const response = await fetch("/api/hero-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newMedia,
          order: heroMedia.length,
        }),
      })

      const result = await response.json()
      console.log("Add media response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to add media")
      }

      await fetchHeroMedia()
      setNewMedia({ type: "image", url: "" })
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      alert("✅ Media added successfully!")
    } catch (error) {
      console.error("Failed to add media:", error)
      alert(`❌ Failed to add media: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMedia = async (id: number) => {
    if (!confirm("Delete this media?")) return

    try {
      const response = await fetch(`/api/hero-media/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchHeroMedia()
        alert("✅ Media deleted!")
      }
    } catch (error) {
      console.error("Failed to delete media:", error)
      alert("❌ Failed to delete media")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Hero Section Settings</h2>
          <p className="text-sm text-gray-600">Manage images, videos, and text for the hero section</p>
        </div>
        <Button onClick={handleSave} className="flex items-center justify-center gap-2 bg-green-600 w-full sm:w-auto">
          <Save size={20} />
          {isSaved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* SLIDESHOW SECTION - Multiple Images/Videos */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            🎬 Hero Slideshow (Multiple Images/Videos)
          </CardTitle>
          <CardDescription>
            Add multiple images or videos that will play in random order or as a slideshow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Media */}
          <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
            <h4 className="font-semibold mb-3">Add New Media</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Media Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={newMedia.type === "image" ? "default" : "outline"}
                    className={newMedia.type === "image" ? "bg-green-600" : ""}
                    onClick={() => setNewMedia({ ...newMedia, type: "image", url: "" })}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Image
                  </Button>
                  <Button
                    type="button"
                    variant={newMedia.type === "video" ? "default" : "outline"}
                    className={newMedia.type === "video" ? "bg-green-600" : ""}
                    onClick={() => setNewMedia({ ...newMedia, type: "video", url: "" })}
                  >
                    <VideoIcon className="w-4 h-4 mr-2" />
                    Video
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Upload File</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept={newMedia.type === "image" ? "image/*" : "video/*"}
                  onChange={handleMediaFileUpload}
                  className="border-green-300"
                />
              </div>
            </div>

            {newMedia.url && (
              <div className="mt-4 border-2 border-green-200 rounded-lg p-4 bg-white">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                {newMedia.type === "image" ? (
                  <img src={newMedia.url} alt="Preview" className="w-full max-h-48 object-cover rounded" />
                ) : (
                  <video src={newMedia.url} className="w-full max-h-48 object-cover rounded" controls />
                )}
              </div>
            )}

            <Button
              onClick={handleAddMedia}
              disabled={loading || !newMedia.url}
              className="w-full mt-4 bg-gradient-to-r from-green-600 to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading ? "Adding..." : "Add to Slideshow"}
            </Button>
          </div>

          {/* Current Media List */}
          <div>
            <h4 className="font-semibold mb-3">Current Slideshow Media ({Array.isArray(heroMedia) ? heroMedia.length : 0})</h4>
            {!Array.isArray(heroMedia) || heroMedia.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500">No media added yet. Add images or videos above.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {heroMedia.map((media) => (
                  <div
                    key={media.id}
                    className="group relative border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-all"
                  >
                    {media.type === "image" ? (
                      <img src={media.url} alt="Hero media" className="w-full h-48 object-cover" />
                    ) : (
                      <video src={media.url} className="w-full h-48 object-cover" />
                    )}
                    
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      {media.type === "image" ? <ImageIcon className="w-3 h-3" /> : <VideoIcon className="w-3 h-3" />}
                      {media.type}
                    </div>

                    <button
                      onClick={() => handleDeleteMedia(media.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
            <strong>💡 How it works:</strong> Videos play until finished, images show for 5 seconds. Order is randomized on each page load!
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Background Image */}
        <Card>
          <CardHeader>
            <CardTitle>Background Image</CardTitle>
            <CardDescription>Upload the hero section background image</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {imagePreview && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview("")
                    setSettings({ ...settings, backgroundImage: "" })
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                id="background-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("background-image")?.click()}
                className="w-full"
              >
                <Upload size={16} className="mr-2" />
                {imagePreview ? "Change Background" : "Upload Background"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Intro Video */}
        <Card>
          <CardHeader>
            <CardTitle>Intro Video (Optional)</CardTitle>
            <CardDescription>Upload a video to play in the hero section</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {videoPreview && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                <video src={videoPreview} className="w-full h-full object-cover" controls />
                <button
                  type="button"
                  onClick={() => {
                    setVideoPreview("")
                    setSettings({ ...settings, videoUrl: "" })
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                id="intro-video"
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("intro-video")?.click()}
                className="w-full"
              >
                <Upload size={16} className="mr-2" />
                {videoPreview ? "Change Video" : "Upload Video"}
              </Button>
            </div>
            <p className="text-xs text-gray-500">Note: Large video files may take time to upload</p>
          </CardContent>
        </Card>
      </div>

      {/* Text Content */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Text Content</CardTitle>
          <CardDescription>Customize the title and subtitle displayed on the hero section</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              placeholder="e.g. Dhampus Eco Lodge"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Textarea
              id="subtitle"
              value={settings.subtitle}
              onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
              rows={3}
              placeholder="Enter a compelling description..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Preview how the hero section will look</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-64 rounded-lg overflow-hidden">
            {settings.videoUrl ? (
              <video
                src={settings.videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
              />
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${settings.backgroundImage || "/placeholder.svg"})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />
            <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-4">
              <div className="space-y-4">
                <h1 className="font-display text-4xl font-light">{settings.title || "Your Lodge Name"}</h1>
                <p className="text-sm text-gray-200 max-w-md">
                  {settings.subtitle || "Your compelling subtitle goes here..."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



