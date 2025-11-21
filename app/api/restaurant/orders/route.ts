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
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        roomNumber: body.roomNumber,
        guestName: body.guestName,
        bookingId: body.bookingId || null,
        subtotal: parseFloat(body.subtotal),
        tax: parseFloat(body.tax),
        taxPercentage: body.taxPercentage ? parseFloat(body.taxPercentage) : 13,
        total: parseFloat(body.total),
        status: body.status || 'pending',
        orderType: body.orderType || 'room_service',
        paymentStatus: body.paymentStatus || 'unpaid',
        paymentMethod: body.paymentMethod || null,
        notes: body.notes || null,
        items: {
          create: body.items.map((item: any) => ({
            menuItemId: parseInt(item.menuItemId),
            name: item.name,
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price),
            subtotal: item.subtotal ? parseFloat(item.subtotal) : (parseInt(item.quantity) * parseFloat(item.price))
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

