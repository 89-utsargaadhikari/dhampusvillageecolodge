"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function SyncRoomsPage() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<string>("")
  const router = useRouter()

  const handleSync = async () => {
    setSyncing(true)
    setResult("")
    
    try {
      const response = await fetch("/api/sync-room-numbers", {
        method: "POST"
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(`✅ Success! Synced ${data.created} room numbers to inventory.`)
        setTimeout(() => {
          router.push("/admin")
        }, 2000)
      } else {
        setResult(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🔄 Sync Room Numbers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">What does this do?</h3>
              <p className="text-sm text-yellow-800">
                This will take all room numbers you added in the "Rooms" page (comma-separated like "101,102,103")
                and create individual entries in the Room Inventory table so they show up in booking assignments.
              </p>
            </div>

            {result && (
              <div className={`p-4 rounded-lg ${
                result.startsWith('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-900' 
                  : 'bg-red-50 border border-red-200 text-red-900'
              }`}>
                {result}
              </div>
            )}

            <Button 
              onClick={handleSync} 
              disabled={syncing}
              className="w-full"
              size="lg"
            >
              {syncing ? "Syncing..." : "🚀 Sync Room Numbers Now"}
            </Button>

            <Button 
              variant="outline"
              onClick={() => router.push("/admin")}
              className="w-full"
            >
              ← Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

