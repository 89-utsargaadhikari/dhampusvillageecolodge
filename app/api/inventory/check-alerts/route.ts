import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Check inventory for low stock and expiring items
export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany()

    const alerts = {
      critical: [] as any[],
      low: [] as any[],
      expiring: [] as any[]
    }

    const today = new Date()

    items.forEach(item => {
      // Check stock levels
      if (item.currentStock <= item.criticalStockLevel) {
        alerts.critical.push({
          id: item.id,
          name: item.name,
          currentStock: item.currentStock,
          unit: item.unit,
          level: item.criticalStockLevel,
          type: 'critical'
        })
      } else if (item.currentStock <= item.lowStockLevel) {
        alerts.low.push({
          id: item.id,
          name: item.name,
          currentStock: item.currentStock,
          unit: item.unit,
          level: item.lowStockLevel,
          type: 'low'
        })
      }

      // Check expiry dates
      if (item.trackExpiry && item.expiryDate) {
        const expiryDate = new Date(item.expiryDate)
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const alertDays = item.expiryAlertDays || 7

        if (daysUntilExpiry <= alertDays && daysUntilExpiry >= 0) {
          alerts.expiring.push({
            id: item.id,
            name: item.name,
            expiryDate: item.expiryDate,
            daysUntilExpiry,
            type: 'expiring'
          })
        } else if (daysUntilExpiry < 0) {
          alerts.critical.push({
            id: item.id,
            name: item.name,
            expiryDate: item.expiryDate,
            daysUntilExpiry,
            type: 'expired'
          })
        }
      }
    })

    return NextResponse.json({
      total: alerts.critical.length + alerts.low.length + alerts.expiring.length,
      critical: alerts.critical,
      low: alerts.low,
      expiring: alerts.expiring
    })
  } catch (error) {
    console.error("Failed to check inventory alerts:", error)
    return NextResponse.json(
      { error: "Failed to check inventory alerts" },
      { status: 500 }
    )
  }
}
