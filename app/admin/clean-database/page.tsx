"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, AlertTriangle } from "lucide-react"

export default function CleanDatabasePage() {
  const [cleaning, setCleaning] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleClean = async () => {
    if (!confirm("⚠️ WARNING: This will DELETE ALL DATA from the database!\n\nAre you absolutely sure?")) {
      return
    }

    if (!confirm("🚨 FINAL WARNING: This CANNOT be undone!\n\nType 'YES' in your mind and click OK to proceed.")) {
      return
    }

    setCleaning(true)
    setResult(null)

    try {
      const response = await fetch("/api/clean-database", {
        method: "POST"
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        alert("✅ Database cleaned successfully!\n\nAll data has been deleted. The database is now empty.")
      } else {
        alert(`❌ Failed to clean database: ${data.error}`)
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
      setResult({ success: false, error: error.message })
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            Clean Database - Delete All Data
          </CardTitle>
          <CardDescription>
            Permanently delete ALL data from the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>⚠️ DANGER ZONE</strong>
              <p className="mt-2">This will permanently delete:</p>
              <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                <li>All bookings</li>
                <li>All rooms and room numbers</li>
                <li>All restaurant menu items and orders</li>
                <li>All account transactions</li>
                <li>All gallery images</li>
                <li>All settings</li>
              </ul>
              <p className="mt-3 font-bold">This action CANNOT be undone!</p>
            </AlertDescription>
          </Alert>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">📝 Note:</h3>
            <p className="text-sm text-yellow-800">
              This only cleans the <strong>database</strong>. Your localStorage data will NOT be affected.
              After cleaning, you can:
            </p>
            <ul className="mt-2 text-sm text-yellow-800 list-disc list-inside">
              <li>Start fresh and add new data</li>
              <li>Re-run migration from localStorage if needed</li>
            </ul>
          </div>

          <Button
            onClick={handleClean}
            disabled={cleaning}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            <Trash2 className="mr-2 h-5 w-5" />
            {cleaning ? "Cleaning Database..." : "Delete All Data"}
          </Button>

          {result && (
            <Alert className={result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                {result.success ? (
                  <>
                    <strong>✅ Success!</strong>
                    <p className="mt-1">{result.message}</p>
                  </>
                ) : (
                  <>
                    <strong>❌ Error</strong>
                    <p className="mt-1">{result.error}</p>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

