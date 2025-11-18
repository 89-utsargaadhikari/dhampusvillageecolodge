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

    const order = await prisma.restaurantOrder.update({
      where: { id },
      data: {
        status: body.status,
        // Add other updatable fields as needed
      },
      include: {
        items: true
      }
    })
    
    return NextResponse.json(order)
  } catch (error) {
    console.error('Failed to update order:', error)
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

