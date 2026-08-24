import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { locationStocks } from "@/lib/inventory-units"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        menuItem: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ ...item, ...locationStocks(item) })
  } catch (error) {
    console.error("Failed to fetch inventory item:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory item" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    const data = await request.json()

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

    const existing = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const storeStock =
      data.storeStock !== undefined ? parseFloat(data.storeStock) : existing.storeStock
    const barStock =
      data.barStock !== undefined ? parseFloat(data.barStock) : existing.barStock

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        unit: data.unit,
        storeStock,
        barStock,
        currentStock: (storeStock || 0) + (barStock || 0),
        goodStockLevel:
          data.goodStockLevel !== undefined ? parseFloat(data.goodStockLevel) : undefined,
        lowStockLevel:
          data.lowStockLevel !== undefined ? parseFloat(data.lowStockLevel) : undefined,
        criticalStockLevel:
          data.criticalStockLevel !== undefined ? parseFloat(data.criticalStockLevel) : undefined,
        unitPrice: data.unitPrice !== undefined ? parseFloat(data.unitPrice) : undefined,
        storageLocation: data.storageLocation !== undefined ? data.storageLocation : undefined,
        trackExpiry: data.trackExpiry !== undefined ? data.trackExpiry : undefined,
        expiryDate:
          data.expiryDate !== undefined
            ? data.expiryDate
              ? new Date(data.expiryDate)
              : null
            : undefined,
        expiryAlertDays:
          data.expiryAlertDays !== undefined ? parseInt(data.expiryAlertDays) : undefined,
        menuItemId:
          data.menuItemId !== undefined
            ? data.menuItemId
              ? parseInt(data.menuItemId)
              : null
            : undefined,
      },
    })

    return NextResponse.json(item)
  } catch (error: any) {
    console.error("Failed to update inventory item:", error)

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "An item with this name already exists, or this menu item is already linked" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)

    await prisma.inventoryItem.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Item deleted successfully" })
  } catch (error: any) {
    console.error("Failed to delete inventory item:", error)

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    )
  }
}
