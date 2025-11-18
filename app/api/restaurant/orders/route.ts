import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const orders = await prisma.restaurantOrder.findMany({
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        booking: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📝 Creating restaurant order:', JSON.stringify(body, null, 2))
    
    const order = await prisma.restaurantOrder.create({
      data: {
        orderNumber: body.orderNumber,
        roomNumber: body.roomNumber,
        guestName: body.guestName,
        bookingId: body.bookingId || null,
        subtotal: parseFloat(body.subtotal),
        tax: parseFloat(body.tax),
        taxPercentage: parseFloat(body.taxPercentage),
        total: parseFloat(body.total),
        status: body.status || 'pending',
        items: {
          create: body.items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: parseFloat(item.price),
            subtotal: parseFloat(item.price) * item.quantity
          }))
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })
    
    console.log('✅ Order created successfully:', order.id)
    return NextResponse.json(order)
  } catch (error: any) {
    console.error('❌ Failed to create order:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ 
      error: 'Failed to create order',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

