import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { resolveBookingPrice } from '@/lib/apply-partner-rate'
import { normalizeCurrency } from '@/lib/rate-cards'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    const body = await request.json()

    const updateData: any = {}
    if (body.guest !== undefined) updateData.guest = body.guest
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.room !== undefined) updateData.room = body.room
    if (body.roomNumber !== undefined) updateData.roomNumber = body.roomNumber || null
    if (body.checkin !== undefined) updateData.checkin = body.checkin
    if (body.checkout !== undefined) updateData.checkout = body.checkout
    if (body.price !== undefined && String(body.price).trim() !== "") updateData.price = String(body.price)
    if (body.status !== undefined) updateData.status = body.status
    if (body.bookingSource !== undefined) updateData.bookingSource = body.bookingSource
    if (body.businessId !== undefined) updateData.businessId = body.businessId ? parseInt(body.businessId) : null
    if (body.numberOfGuests !== undefined) updateData.numberOfGuests = body.numberOfGuests ? parseInt(body.numberOfGuests) : 1
    if (body.bookingType !== undefined) updateData.bookingType = body.bookingType
    if (body.occupancy !== undefined) updateData.occupancy = body.occupancy || null
    if (body.currency !== undefined) updateData.currency = normalizeCurrency(body.currency)
    if (body.price !== undefined && String(body.price).trim() === "") {
      updateData.price = await resolveBookingPrice({
        ...body,
        businessId: body.businessId ?? (await prisma.booking.findUnique({ where: { id }, select: { businessId: true } }))?.businessId,
      })
    }
    if (body.extraBed !== undefined) updateData.extraBed = Boolean(body.extraBed)
    if (body.groupId !== undefined) updateData.groupId = body.groupId || null

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        business: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(booking)
  } catch (error: any) {
    console.error('Error updating booking:', error)
    return NextResponse.json({
      error: 'Failed to update booking',
      details: error.message,
      code: error.code
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)

    await prisma.$transaction(async (tx) => {
      await tx.restaurantOrder.updateMany({
        where: { bookingId: id },
        data: { bookingId: null }
      })
      await tx.booking.delete({
        where: { id }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({
      error: 'Failed to delete booking',
      details: error.message
    }, { status: 500 })
  }
}
