"use client"

import { useState, useEffect } from "react"
import { Upload, X, Save } from "lucide-react"
import { convertImageToBase64, type SiteSettings } from "@/lib/storage"
import { fetchSiteSettings, updateSiteSettings } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SiteSettingsManager() {
  const [settings, setSettings] = useState<SiteSettings>({
    logoImage: "",
    siteName: "Dhampus Eco Lodge",
  })
  const [logoPreview, setLogoPreview] = useState<string>("")
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])
  
  const loadSettings = async () => {
    try {
      const data = await fetchSiteSettings()
      if (data) {
        setSettings(data)
        setLogoPreview(data.logoImage)
      }
    } catch (error) {
      console.error('Failed to load site settings:', error)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const base64 = await convertImageToBase64(file)
        setSettings({ ...settings, logoImage: base64 })
        setLogoPreview(base64)
      } catch (error) {
        console.error("Error uploading logo:", error)
        alert("Failed to upload logo. Please try again.")
      }
    }
  }

  const handleSave = async () => {
    try {
      await updateSiteSettings(settings)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save site settings:', error)
      alert('Failed to save settings')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Site Settings</h2>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save size={20} />
          {isSaved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Site Logo</CardTitle>
            <CardDescription>Upload your custom logo (appears in header)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logoPreview && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center border-2 border-gray-200">
                <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain p-4" />
                <button
                  type="button"
                  onClick={() => {
                    setLogoPreview("")
                    setSettings({ ...settings, logoImage: "" })
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("logo-upload")?.click()}
                className="w-full"
              >
                <Upload size={16} className="mr-2" />
                {logoPreview ? "Change Logo" : "Upload Logo"}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Recommended: PNG with transparent background, max 200x60px
            </p>
          </CardContent>
        </Card>

        {/* Site Name */}
        <Card>
          <CardHeader>
            <CardTitle>Site Name</CardTitle>
            <CardDescription>Your site name (fallback if no logo)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                placeholder="e.g. Dhampus Eco Lodge"
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Preview:</p>
              <div className="flex items-center gap-3 bg-white p-3 rounded">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-10 object-contain" />
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                      <span className="text-white font-display text-lg font-bold">
                        {settings.siteName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-display font-semibold text-primary">{settings.siteName}</p>
                      <p className="text-xs text-muted-foreground">Eco Lodge</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branding Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Branding Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-gray-900">✨ Logo Format</p>
              <p className="text-gray-600">Use PNG with transparent background for best results</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-900">📏 Size Matters</p>
              <p className="text-gray-600">Keep logo height around 40-60px for optimal display</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-900">🎨 Simplicity</p>
              <p className="text-gray-600">Simple logos work best for web headers and mobile</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

