import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { orderInclusiveSubtotal } from '@/lib/vat'

const EPSILON = 0.01

async function sourceTotalAndAllocated(
  sourceType: string,
  bookingId: number | null | undefined,
  orderId: number | null | undefined,
  excludeAllocationId?: number
) {
  if (sourceType === 'room') {
    if (!bookingId) throw new Error('bookingId is required for a room allocation')
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) throw new Error('Booking not found')
    const total = parseFloat(booking.price) || 0
    const existing = await prisma.billSplitAllocation.findMany({
      where: { sourceType: 'room', bookingId, id: excludeAllocationId ? { not: excludeAllocationId } : undefined },
    })
    const allocated = existing.reduce((sum, item) => sum + item.amount, 0)
    return { total, allocated }
  }

  if (sourceType === 'order') {
    if (!orderId) throw new Error('orderId is required for an order allocation')
    const order = await prisma.restaurantOrder.findUnique({ where: { id: orderId } })
    if (!order) throw new Error('Order not found')
    const total = orderInclusiveSubtotal(order)
    const existing = await prisma.billSplitAllocation.findMany({
      where: { sourceType: 'order', orderId, id: excludeAllocationId ? { not: excludeAllocationId } : undefined },
    })
    const allocated = existing.reduce((sum, item) => sum + item.amount, 0)
    return { total, allocated }
  }

  throw new Error('sourceType must be "room" or "order"')
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const billSplitId = parseInt(paramId)
    const body = await request.json()
    const { sourceType, bookingId, orderId, description, amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'amount must be greater than 0' }, { status: 400 })
    }

    const { total, allocated } = await sourceTotalAndAllocated(sourceType, bookingId, orderId)
    if (allocated + amount > total + EPSILON) {
      return NextResponse.json(
        { error: `Allocation exceeds remaining amount. Remaining: ${(total - allocated).toFixed(2)}` },
        { status: 400 }
      )
    }

    const allocation = await prisma.billSplitAllocation.create({
      data: {
        billSplitId,
        sourceType,
        bookingId: sourceType === 'room' ? bookingId : null,
        orderId: sourceType === 'order' ? orderId : null,
        description: description || null,
        amount,
      },
    })
    return NextResponse.json(allocation)
  } catch (error: any) {
    console.error('Failed to create bill split allocation:', error)
    return NextResponse.json({ error: error.message || 'Failed to create allocation' }, { status: 400 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { allocationId, amount, billSplitId } = body
    if (!allocationId) {
      return NextResponse.json({ error: 'allocationId is required' }, { status: 400 })
    }

    const existing = await prisma.billSplitAllocation.findUnique({ where: { id: allocationId } })
    if (!existing) {
      return NextResponse.json({ error: 'Allocation not found' }, { status: 404 })
    }

    if (amount !== undefined) {
      const { total, allocated } = await sourceTotalAndAllocated(
        existing.sourceType,
        existing.bookingId,
        existing.orderId,
        existing.id
      )
      if (allocated + amount > total + EPSILON) {
        return NextResponse.json(
          { error: `Allocation exceeds remaining amount. Remaining: ${(total - allocated).toFixed(2)}` },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (amount !== undefined) updateData.amount = amount
    if (billSplitId !== undefined) updateData.billSplitId = billSplitId

    const allocation = await prisma.billSplitAllocation.update({
      where: { id: allocationId },
      data: updateData,
    })
    return NextResponse.json(allocation)
  } catch (error: any) {
    console.error('Failed to update bill split allocation:', error)
    return NextResponse.json({ error: error.message || 'Failed to update allocation' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const allocationId = request.nextUrl.searchParams.get('allocationId')
    if (!allocationId) {
      return NextResponse.json({ error: 'allocationId is required' }, { status: 400 })
    }
    await prisma.billSplitAllocation.delete({ where: { id: parseInt(allocationId) } })
    return NextResponse.json({ message: 'Allocation removed' })
  } catch (error) {
    console.error('Failed to delete bill split allocation:', error)
    return NextResponse.json({ error: 'Failed to delete allocation' }, { status: 500 })
  }
}
