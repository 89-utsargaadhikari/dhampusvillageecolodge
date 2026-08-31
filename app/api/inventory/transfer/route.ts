import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { locationStocks } from "@/lib/inventory-units"

export async function POST(request: NextRequest) {
  try {
    const { itemId, quantity } = await request.json()
    const amount = parseFloat(quantity)

    if (!itemId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "A positive transfer quantity is required" }, { status: 400 })
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: parseInt(itemId) }
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const stocks = locationStocks(item)
    if (stocks.storeStock < amount) {
      return NextResponse.json({ error: "Not enough store stock to transfer" }, { status: 400 })
    }

    const nextStore = stocks.storeStock - amount
    const nextBar = stocks.barStock + amount

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          storeStock: nextStore,
          barStock: nextBar,
          currentStock: nextStore + nextBar
        }
      })

      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          type: "transfer",
          quantity: amount,
          unitPrice: item.unitPrice,
          totalCost: amount * item.unitPrice,
          notes: "Store to bar transfer",
          performedBy: "admin"
        }
      })

      return next
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to transfer stock:", error)
    return NextResponse.json({ error: "Failed to transfer stock" }, { status: 500 })
  }
}
