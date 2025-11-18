"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function MigratePage() {
  const [migrating, setMigrating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMigrate = async () => {
    setMigrating(true)
    setError(null)
    setResult(null)

    try {
      // Get all data from localStorage
      const data = {
        rooms: JSON.parse(localStorage.getItem("hotel_rooms") || "[]"),
        bookings: JSON.parse(localStorage.getItem("hotel_bookings") || "[]"),
        roomInventory: JSON.parse(localStorage.getItem("hotel_room_inventory") || "[]"),
        gallery: JSON.parse(localStorage.getItem("hotel_gallery") || "[]"),
        heroSettings: JSON.parse(localStorage.getItem("hotel_hero_settings") || "null"),
        siteSettings: JSON.parse(localStorage.getItem("hotel_site_settings") || "null"),
      }

      console.log("Migrating data:", data)

      const response = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setResult(result)
      } else {
        setError(result.error + (result.details ? `: ${result.details}` : ""))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Migrate to Database</CardTitle>
            <CardDescription>
              This will migrate all your localStorage data to the new SQLite database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!result && !error && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important:</h3>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>This is a one-time migration</li>
                    <li>Your localStorage data will be copied to the database</li>
                    <li>Existing database data will be preserved</li>
                    <li>You can run this multiple times if needed</li>
                  </ul>
                </div>

                <Button
                  onClick={handleMigrate}
                  disabled={migrating}
                  className="w-full"
                  size="lg"
                >
                  {migrating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Migrating...
                    </>
                  ) : (
                    "Start Migration"
                  )}
                </Button>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Migration Successful!</h3>
                  </div>
                  <div className="space-y-2 text-sm text-green-800">
                    <p>✅ {result.results.rooms} rooms migrated</p>
                    <p>✅ {result.results.bookings} bookings migrated</p>
                    <p>✅ {result.results.roomInventory} room inventory items migrated</p>
                    <p>✅ {result.results.gallery} gallery items migrated</p>
                    <p>✅ Settings migrated</p>
                  </div>
                </div>

                <Button
                  onClick={() => (window.location.href = "/admin")}
                  className="w-full"
                >
                  Go to Admin Dashboard
                </Button>
              </div>
            )}

            {error && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">Migration Failed</h3>
                  </div>
                  <p className="text-sm text-red-800">{error}</p>
                </div>

                <Button
                  onClick={() => {
                    setError(null)
                    setResult(null)
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


