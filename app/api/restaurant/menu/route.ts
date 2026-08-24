import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isCountableUnit } from '@/lib/inventory-units'

export async function GET() {
  try {
    const menuItems = await prisma.restaurantMenuItem.findMany({
      include: {
        inventoryItem: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(menuItems)
  } catch (error) {
    console.error('Failed to fetch menu items:', error)
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const menuItem = await prisma.$transaction(async (tx) => {
      const created = await tx.restaurantMenuItem.create({
        data: {
          name: body.name,
          description: body.description || '',
          price: parseFloat(body.price),
          category: body.category,
          image: body.image || '',
          available: body.available !== undefined ? body.available : true
        }
      })

      const trackStock = Boolean(body.trackStock) || Number(body.stock) > 0
      if (trackStock) {
        const unit = isCountableUnit(body.stockUnit)
          ? body.stockUnit
          : (body.category === "bar" || body.category === "drinks" ? "bottles" : "pieces")
        const barStock = parseFloat(body.stock) || 0
        const category = body.category === "food" || body.category === "snacks" ? "Other" : "Beverages"

        try {
          await tx.inventoryItem.create({
            data: {
              menuItemId: created.id,
              name: created.name,
              category,
              unit,
              storeStock: 0,
              barStock,
              currentStock: barStock,
              goodStockLevel: parseFloat(body.minStock) > 0 ? parseFloat(body.minStock) * 4 : 20,
              lowStockLevel: parseFloat(body.minStock) || 5,
              criticalStockLevel: Math.max(1, Math.floor((parseFloat(body.minStock) || 5) / 2)),
              unitPrice: 0,
            }
          })
        } catch (error: any) {
          if (error.code === "P2002") {
            await tx.inventoryItem.create({
              data: {
                menuItemId: created.id,
                name: `${created.name} (RMS)`,
                category,
                unit,
                storeStock: 0,
                barStock,
                currentStock: barStock,
                goodStockLevel: 20,
                lowStockLevel: 5,
                criticalStockLevel: 1,
                unitPrice: 0,
              }
            })
          } else {
            throw error
          }
        }
      }

      return tx.restaurantMenuItem.findUnique({
        where: { id: created.id },
        include: { inventoryItem: true }
      })
    })
    
    return NextResponse.json(menuItem)
  } catch (error) {
    console.error('Failed to create menu item:', error)
    return NextResponse.json({ error: 'Failed to create menu item', details: error }, { status: 500 })
  }
}
