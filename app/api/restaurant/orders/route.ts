import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const orders = await prisma.restaurantOrder.findMany({
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: {
        orderDate: 'desc'
      }
    })
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating order with data:', body)

    const order = await prisma.restaurantOrder.create({
      data: {
        orderNumber: body.orderNumber,
        orderDate: new Date(body.orderDate),
        roomNumber: body.roomNumber,
        guestName: body.guestName,
        bookingId: body.bookingId,
        subtotal: body.subtotal,
        tax: body.tax,
        taxPercentage: body.taxPercentage || 13,
        total: body.total,
        status: body.status || 'pending',
        orderType: body.orderType || 'room_service',
        items: {
          create: body.items.map((item: any) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal || (item.quantity * item.price)
          }))
        }
      },
      include: {
        items: true
      }
    })
    
    console.log('Order created:', order)
    return NextResponse.json(order)
  } catch (error) {
    console.error('Failed to create order:', error)
    return NextResponse.json({ error: 'Failed to create order', details: error }, { status: 500 })
  }
}

