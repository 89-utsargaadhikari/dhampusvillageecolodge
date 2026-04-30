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
    console.log("Creating booking with data:", body)
    
    // Generate booking ID with retry logic for uniqueness
    let bookingId = ''
    let attempts = 0
    const maxAttempts = 5
    
    while (attempts < maxAttempts) {
      const year = new Date().getFullYear()
      const count = await prisma.booking.count()
      bookingId = `BK-${year}-${String(count + 1 + attempts).padStart(4, '0')}`
      
      // Check if this ID already exists
      const existing = await prisma.booking.findUnique({
        where: { bookingId }
      })
      
      if (!existing) break
      attempts++
    }
    
    const booking = await prisma.booking.create({
      data: {
        bookingId,
        guest: body.guest,
        email: body.email || null,
        phone: body.phone || null,
        room: body.room,
        roomNumber: body.roomNumber || null,
        checkin: body.checkin,
        checkout: body.checkout,
        price: body.price,
        numberOfGuests: body.numberOfGuests ? parseInt(body.numberOfGuests) : null,
        bookingType: body.bookingType || null,
        status: body.status || 'Pending',
        bookingSource: body.bookingSource || 'phone',
        businessId: body.businessId ? parseInt(body.businessId) : null
      }
    })
    
    console.log("Booking created successfully:", booking)
    
    // Add notification for website bookings
    if (body.bookingSource === 'website') {
      console.log('🔔 New website booking received - Notification needed!')
    }
    
    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    console.error('Error creating booking:', error)
    console.error('Error details:', error.message, error.stack)
    return NextResponse.json({ 
      error: 'Failed to create booking',
      details: error.message 
    }, { status: 500 })
  }
}


