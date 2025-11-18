import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/bookings
export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

// POST /api/bookings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const booking = await prisma.booking.create({
      data: {
        guest: body.guest,
        email: body.email,
        phone: body.phone,
        room: body.room,
        roomNumber: body.roomNumber,
        checkin: body.checkin,
        checkout: body.checkout,
        price: body.price,
        status: body.status || 'Pending',
        bookingSource: body.bookingSource || 'phone'
      }
    })
    
    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}


