import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET - Fetch single inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error("Failed to fetch inventory item:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory item" },
      { status: 500 }
    )
  }
}

// PUT - Update inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()

    // Validate stock levels if provided
    if (data.goodStockLevel && data.lowStockLevel && data.goodStockLevel <= data.lowStockLevel) {
      return NextResponse.json(
        { error: "Good stock level must be higher than low stock level" },
        { status: 400 }
      )
    }

    if (data.lowStockLevel && data.criticalStockLevel && data.lowStockLevel <= data.criticalStockLevel) {
      return NextResponse.json(
        { error: "Low stock level must be higher than critical stock level" },
        { status: 400 }
      )
    }

    const item = await prisma.inventoryItem.update({
      where: { id: parseInt(params.id) },
      data: {
        name: data.name,
        category: data.category,
        unit: data.unit,
        currentStock: data.currentStock !== undefined ? parseFloat(data.currentStock) : undefined,
        goodStockLevel: data.goodStockLevel !== undefined ? parseFloat(data.goodStockLevel) : undefined,
        lowStockLevel: data.lowStockLevel !== undefined ? parseFloat(data.lowStockLevel) : undefined,
        criticalStockLevel: data.criticalStockLevel !== undefined ? parseFloat(data.criticalStockLevel) : undefined,
        unitPrice: data.unitPrice !== undefined ? parseFloat(data.unitPrice) : undefined,
        storageLocation: data.storageLocation !== undefined ? data.storageLocation : undefined,
        trackExpiry: data.trackExpiry !== undefined ? data.trackExpiry : undefined,
        expiryDate: data.expiryDate !== undefined ? (data.expiryDate ? new Date(data.expiryDate) : null) : undefined,
        expiryAlertDays: data.expiryAlertDays !== undefined ? parseInt(data.expiryAlertDays) : undefined
      }
    })

    return NextResponse.json(item)
  } catch (error: any) {
    console.error("Failed to update inventory item:", error)

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "An item with this name already exists" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    )
  }
}

// DELETE - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.inventoryItem.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ message: "Item deleted successfully" })
  } catch (error: any) {
    console.error("Failed to delete inventory item:", error)

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    )
  }
}
