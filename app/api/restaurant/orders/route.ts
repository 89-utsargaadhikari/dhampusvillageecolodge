import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateInclusiveVat } from '@/lib/vat'
import { deductOrderStock } from '@/lib/inventory-stock'

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

    const inclusiveSubtotal = (body.items || []).reduce(
      (sum: number, item: any) => sum + parseFloat(item.price) * parseInt(item.quantity),
      0
    )
    const totals = calculateInclusiveVat({
      inclusiveSubtotal,
      vatPercent: body.taxPercentage ? parseFloat(body.taxPercentage) : 13,
      discountType: body.discountType,
      discountValue: body.discountValue
    })

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.restaurantOrder.create({
        data: {
          orderNumber: body.orderNumber,
          orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
          roomNumber: body.roomNumber,
          guestName: body.guestName,
          bookingId: body.bookingId || null,
          subtotal: totals.inclusiveSubtotal,
          discountType: body.discountType || null,
          discountValue: body.discountValue || 0,
          discountAmount: totals.discountAmount,
          tax: totals.vatAmount,
          taxPercentage: body.taxPercentage ? parseFloat(body.taxPercentage) : 13,
          total: totals.total,
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
              subtotal: parseInt(item.quantity) * parseFloat(item.price)
            }))
          }
        },
        include: {
          items: true
        }
      })

      await deductOrderStock(tx, created.orderNumber, body.items || [])

      return created
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Failed to create order:', error)
    return NextResponse.json({ error: 'Failed to create order', details: error }, { status: 500 })
  }
}

