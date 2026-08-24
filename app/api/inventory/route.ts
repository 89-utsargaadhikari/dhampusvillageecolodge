import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { locationStocks } from "@/lib/inventory-units"

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: {
        menuItem: {
          select: { id: true, name: true, category: true, price: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const normalized = items.map((item) => ({
      ...item,
      ...locationStocks(item)
    }))

    return NextResponse.json(normalized)
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
  let requestedName = ""
  let requestedMenuItemId: number | null = null
  try {
    const data = await request.json()
    requestedName = data.name || ""
    requestedMenuItemId = data.menuItemId ? parseInt(data.menuItemId) : null

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

    const storeStock = parseFloat(data.storeStock ?? data.currentStock) || 0
    const barStock = parseFloat(data.barStock) || 0
    const menuItemId = requestedMenuItemId

    const item = await prisma.inventoryItem.create({
      data: {
        name: data.name,
        category: data.category,
        unit: data.unit,
        storeStock,
        barStock,
        currentStock: storeStock + barStock,
        menuItemId,
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
      const existing = requestedName
        ? await prisma.inventoryItem.findUnique({ where: { name: requestedName } })
        : null
      if (existing && requestedMenuItemId && !existing.menuItemId) {
        const linked = await prisma.inventoryItem.update({
          where: { id: existing.id },
          data: { menuItemId: requestedMenuItemId }
        })
        return NextResponse.json(linked)
      }
      return NextResponse.json(
        { error: "An item with this name already exists, or this menu item is already linked" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    )
  }
}
