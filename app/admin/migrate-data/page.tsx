"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Database } from "lucide-react"
import Link from "next/link"

export default function MigrateDataPage() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Data Migration Tool
          </CardTitle>
          <CardDescription>
            Database migration status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>✅ Migration Complete!</strong>
              <p className="mt-2">
                All data has been successfully migrated to the database. This system now uses SQLite with Prisma ORM for all data operations.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-semibold text-blue-900">Database Features</h3>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>✅ All HMS data (Bookings, Rooms, Inventory)</li>
                <li>✅ All RMS data (Menu, Orders)</li>
                <li>✅ All AMS data (Transactions, Credit Accounts)</li>
                <li>✅ Site content (Gallery, Settings)</li>
                <li>✅ Real-time synchronization across all pages</li>
                <li>✅ Multi-user support</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Database Tools</h3>
              <p className="text-sm text-gray-600 mt-1">
                To view and manage your database directly:
              </p>
              <div className="mt-3 p-3 bg-gray-100 rounded">
                <code className="text-sm">npx prisma studio</code>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Run this command in your terminal to open Prisma Studio
              </p>
            </div>
          </div>

          <Link href="/admin">
            <Button className="w-full" size="lg">
              Return to Admin Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
