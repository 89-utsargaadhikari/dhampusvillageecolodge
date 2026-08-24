import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function bookingPayload(body: any) {
  return {
    guest: body.guest,
    email: body.email || null,
    phone: body.phone || null,
    room: body.room,
    roomNumber: body.roomNumber || null,
    checkin: body.checkin,
    checkout: body.checkout,
    price: body.price === undefined || body.price === null ? "0" : String(body.price),
    numberOfGuests: body.numberOfGuests ? parseInt(body.numberOfGuests) : 1,
    bookingType: body.bookingType || "EP",
    occupancy: body.occupancy || null,
    currency: body.currency || "NPR",
    extraBed: Boolean(body.extraBed),
    groupId: body.groupId || null,
    status: body.status || 'Pending',
    bookingSource: body.bookingSource || 'phone',
    businessId: body.businessId ? parseInt(body.businessId) : null
  }
}

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        business: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    let bookingId = ''
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      const year = new Date().getFullYear()
      const count = await prisma.booking.count()
      bookingId = `BK-${year}-${String(count + 1 + attempts).padStart(4, '0')}`

      const existing = await prisma.booking.findUnique({
        where: { bookingId }
      })

      if (!existing) break
      attempts++
    }

    const booking = await prisma.booking.create({
      data: {
        bookingId,
        ...bookingPayload(body)
      },
      include: {
        business: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    console.error('Error creating booking:', error)
    return NextResponse.json({
      error: 'Failed to create booking',
      details: error.message
    }, { status: 500 })
  }
}
