"use client"

import { useState, useEffect } from "react"
import { Upload, X, Save } from "lucide-react"
import { convertImageToBase64, type HeroSettings } from "@/lib/storage"
import { fetchHeroSettings, updateHeroSettings } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HeroSettingsManager() {
  const [settings, setSettings] = useState<HeroSettings>({
    backgroundImage: "",
    videoUrl: "",
    title: "",
    subtitle: "",
  })
  const [imagePreview, setImagePreview] = useState<string>("")
  const [videoPreview, setVideoPreview] = useState<string>("")
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    loadSettings()
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Hero Section Settings</h2>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save size={20} />
          {isSaved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

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



