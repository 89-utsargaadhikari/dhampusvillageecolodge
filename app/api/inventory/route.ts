import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Fetch all inventory items
export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("Failed to fetch inventory items:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory items" },
      { status: 500 }
    )
  }
}

// POST - Create new inventory item
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.category || !data.unit) {
      return NextResponse.json(
        { error: "Missing required fields: name, category, unit" },
        { status: 400 }
      )
    }

    // Validate stock levels
    if (data.goodStockLevel <= data.lowStockLevel) {
      return NextResponse.json(
        { error: "Good stock level must be higher than low stock level" },
        { status: 400 }
      )
    }

    if (data.lowStockLevel <= data.criticalStockLevel) {
      return NextResponse.json(
        { error: "Low stock level must be higher than critical stock level" },
        { status: 400 }
      )
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name: data.name,
        category: data.category,
        unit: data.unit,
        currentStock: parseFloat(data.currentStock) || 0,
        goodStockLevel: parseFloat(data.goodStockLevel) || 50,
        lowStockLevel: parseFloat(data.lowStockLevel) || 20,
        criticalStockLevel: parseFloat(data.criticalStockLevel) || 5,
        unitPrice: parseFloat(data.unitPrice) || 0,
        storageLocation: data.storageLocation || null,
        trackExpiry: data.trackExpiry || false,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        expiryAlertDays: data.trackExpiry ? (parseInt(data.expiryAlertDays) || 7) : null
      }
    })

    // Create initial transaction if starting stock > 0
    if (item.currentStock > 0) {
      await prisma.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          type: "adjustment",
          quantity: item.currentStock,
          unitPrice: item.unitPrice,
          totalCost: item.currentStock * item.unitPrice,
          notes: "Initial stock",
          performedBy: "admin"
        }
      })
    }

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create inventory item:", error)
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "An item with this name already exists" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    )
  }
}
