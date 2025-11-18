import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const body = await request.json()
    const order = await prisma.restaurantOrder.update({
      where: { id: parseInt(paramId) },
      data: {
        status: body.status,
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })
    return NextResponse.json(order)
  } catch (error) {
    console.error('Failed to update order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    await prisma.restaurantOrder.delete({
      where: { id: parseInt(paramId) }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete order:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}

