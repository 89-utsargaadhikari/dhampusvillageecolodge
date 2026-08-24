import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { locationStocks } from "@/lib/inventory-units"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid item id" }, { status: 400 })
    }

    const data = await request.json()
    let changeAmount = parseFloat(data.changeAmount)
    const transactionType = data.transactionType || "adjustment"
    const notes = data.notes

    if (!Number.isFinite(changeAmount) || changeAmount === 0) {
      return NextResponse.json(
        { error: "Change amount is required and cannot be zero" },
        { status: 400 }
      )
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const location = data.location === "bar" ? "bar" : "store"
    const stocks = locationStocks(item)
    const currentLocationStock = location === "bar" ? stocks.barStock : stocks.storeStock
    const nextLocationStock = currentLocationStock + changeAmount

    if (nextLocationStock < 0) {
      return NextResponse.json(
        { error: `Cannot reduce ${location} stock below zero` },
        { status: 400 }
      )
    }

    const nextStore = location === "store" ? nextLocationStock : stocks.storeStock
    const nextBar = location === "bar" ? nextLocationStock : stocks.barStock

    const [updatedItem, transaction] = await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id },
        data: {
          storeStock: nextStore,
          barStock: nextBar,
          currentStock: nextStore + nextBar,
        },
      }),
      prisma.inventoryTransaction.create({
        data: {
          inventoryItemId: id,
          type: transactionType,
          quantity: changeAmount,
          unitPrice: item.unitPrice,
          totalCost: Math.abs(changeAmount) * item.unitPrice,
          notes: notes || undefined,
          performedBy: "admin",
        },
      }),
    ])

    return NextResponse.json({
      item: updatedItem,
      transaction,
    })
  } catch (error) {
    console.error("Failed to update stock:", error)
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    )
  }
}
