import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

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

    const storeStock = item.storeStock || 0
    if (storeStock < amount) {
      return NextResponse.json({ error: "Not enough store stock to transfer" }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          storeStock: storeStock - amount,
          barStock: (item.barStock || 0) + amount,
          currentStock: (item.currentStock || storeStock + (item.barStock || 0))
        }
      })

      await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          currentStock: (next.storeStock || 0) + (next.barStock || 0)
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

      return tx.inventoryItem.findUnique({ where: { id: item.id } })
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to transfer stock:", error)
    return NextResponse.json({ error: "Failed to transfer stock" }, { status: 500 })
  }
}
