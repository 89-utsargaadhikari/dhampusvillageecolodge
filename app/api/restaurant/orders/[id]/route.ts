import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { restoreOrderStock, syncOrderStock } from '@/lib/inventory-stock'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId)

    const order = await prisma.restaurantOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    
    return NextResponse.json(order)
  } catch (error) {
    console.error('Failed to fetch order:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId)
    const body = await request.json()

    if (body.items !== undefined && (!Array.isArray(body.items) || body.items.length === 0)) {
      return NextResponse.json({ error: 'Order must have at least one item' }, { status: 400 })
    }

    const existing = await prisma.restaurantOrder.findUnique({
      where: { id },
      include: { items: true }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = await prisma.$transaction(async (tx) => {
      if (body.items) {
        await tx.orderItem.deleteMany({
          where: { orderId: id }
        })
        await tx.orderItem.createMany({
          data: body.items.map((item: any) => ({
            orderId: id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
            name: item.name
          }))
        })
      }

      const updateData: any = {}
      if (body.status !== undefined) updateData.status = body.status
      if (body.guestName !== undefined) updateData.guestName = body.guestName
      if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus
      if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod
      if (body.subtotal !== undefined) updateData.subtotal = body.subtotal
      if (body.discountType !== undefined) updateData.discountType = body.discountType
      if (body.discountValue !== undefined) updateData.discountValue = body.discountValue
      if (body.discountAmount !== undefined) updateData.discountAmount = body.discountAmount
      if (body.tax !== undefined) updateData.tax = body.tax
      if (body.taxPercentage !== undefined) updateData.taxPercentage = body.taxPercentage
      if (body.total !== undefined) updateData.total = body.total

      const updated = await tx.restaurantOrder.update({
        where: { id },
        data: updateData,
        include: {
          items: {
            include: {
              menuItem: true
            }
          }
        }
      })

      const nextStatus = body.status ?? existing.status
      try {
        if (nextStatus === "cancelled") {
          await restoreOrderStock(tx, existing.orderNumber)
        } else {
          await syncOrderStock(tx, existing.orderNumber, updated.items)
        }
      } catch (stockError) {
        console.error('Stock sync failed during order update:', stockError)
      }

      return updated
    })
    
    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Failed to update order:', error)
    return NextResponse.json({ error: 'Failed to update order', details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId, 10)

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
    }

    const existing = await prisma.restaurantOrder.findUnique({
      where: { id }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    try {
      await prisma.$transaction(async (tx) => {
        await restoreOrderStock(tx, existing.orderNumber)
      })
    } catch (stockError) {
      console.error('Stock restore failed, continuing with order delete:', stockError)
    }

    try {
      await prisma.inventoryTransaction.deleteMany({
        where: {
          referenceType: "order",
          referenceId: existing.orderNumber
        }
      })
    } catch (txError) {
      console.error('Inventory transaction cleanup failed, continuing with order delete:', txError)
    }

    try {
      await prisma.restaurantOrder.update({
        where: { id },
        data: { bookingId: null }
      })
    } catch (unlinkError) {
      console.error('Could not unlink booking from order, continuing with delete:', unlinkError)
    }

    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({
        where: { orderId: id }
      })
      await tx.restaurantOrder.delete({
        where: { id }
      })
    })
    
    return NextResponse.json({ message: 'Order deleted' })
  } catch (error: any) {
    console.error('Failed to delete order:', error)
    return NextResponse.json({
      error: 'Failed to delete order',
      details: error.message,
      code: error.code
    }, { status: 500 })
  }
}
