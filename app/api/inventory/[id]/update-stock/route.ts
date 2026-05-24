import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// POST - Update stock level with transaction tracking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { changeAmount, transactionType, notes } = data

    if (changeAmount === undefined || changeAmount === 0) {
      return NextResponse.json(
        { error: "Change amount is required and cannot be zero" },
        { status: 400 }
      )
    }

    // Get current item
    const item = await prisma.inventoryItem.findUnique({
      where: { id: parseInt(params.id) }
    })

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    const newStock = item.currentStock + parseFloat(changeAmount)

    if (newStock < 0) {
      return NextResponse.json(
        { error: "Cannot reduce stock below zero" },
        { status: 400 }
      )
    }

    // Update stock in a transaction
    const [updatedItem, transaction] = await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: parseInt(params.id) },
        data: {
          currentStock: newStock
        }
      }),
      prisma.inventoryTransaction.create({
        data: {
          inventoryItemId: parseInt(params.id),
          type: transactionType || "adjustment",
          quantity: parseFloat(changeAmount),
          unitPrice: item.unitPrice,
          totalCost: Math.abs(parseFloat(changeAmount)) * item.unitPrice,
          notes: notes || undefined,
          performedBy: "admin" // TODO: Get from session
        }
      })
    ])

    return NextResponse.json({
      item: updatedItem,
      transaction
    })
  } catch (error) {
    console.error("Failed to update stock:", error)
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    )
  }
}
