import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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

    console.log('🔵 Updating order:', id, 'with data:', body)

    // Use a transaction to ensure atomicity
    const order = await prisma.$transaction(async (tx) => {
      // If items are being updated, delete old items first
      if (body.items) {
        console.log('🗑️ Deleting old items for order:', id)
        await tx.orderItem.deleteMany({
          where: { orderId: id }
        })
        
        console.log('➕ Creating new items:', body.items)
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

      // Update order totals and status
      const updateData: any = {}
      if (body.status !== undefined) updateData.status = body.status
      if (body.subtotal !== undefined) updateData.subtotal = body.subtotal
      if (body.discountType !== undefined) updateData.discountType = body.discountType
      if (body.discountValue !== undefined) updateData.discountValue = body.discountValue
      if (body.discountAmount !== undefined) updateData.discountAmount = body.discountAmount
      if (body.tax !== undefined) updateData.tax = body.tax
      if (body.taxPercentage !== undefined) updateData.taxPercentage = body.taxPercentage
      if (body.total !== undefined) updateData.total = body.total

      console.log('📝 Updating order with:', updateData)
      
      return await tx.restaurantOrder.update({
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
    })
    
    console.log('✅ Order updated successfully:', order)
    return NextResponse.json(order)
  } catch (error) {
    console.error('❌ Failed to update order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId)

    // Delete order items first (cascade should handle this, but being explicit)
    await prisma.orderItem.deleteMany({
      where: { orderId: id }
    })

    // Delete the order
    await prisma.restaurantOrder.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Order deleted' })
  } catch (error) {
    console.error('Failed to delete order:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}

