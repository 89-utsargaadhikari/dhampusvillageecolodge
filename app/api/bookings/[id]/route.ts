import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/bookings/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    const body = await request.json()
    
    console.log('🔄 Updating booking:', id, 'with data:', body)
    
    // Only include allowed fields, skip undefined
    const updateData: any = {}
    if (body.guest) updateData.guest = body.guest
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.room) updateData.room = body.room
    if (body.roomNumber !== undefined) updateData.roomNumber = body.roomNumber
    if (body.checkin) updateData.checkin = body.checkin
    if (body.checkout) updateData.checkout = body.checkout
    if (body.price) updateData.price = body.price
    if (body.status) updateData.status = body.status
    if (body.bookingSource) updateData.bookingSource = body.bookingSource
    
    console.log('📝 Update data:', updateData)
    
    const booking = await prisma.booking.update({
      where: { id },
      data: updateData
    })
    
    console.log('✅ Booking updated:', booking)
    
    return NextResponse.json(booking)
  } catch (error: any) {
    console.error('❌ Error updating booking:', error)
    console.error('Error details:', error.message, error.stack)
    return NextResponse.json({ 
      error: 'Failed to update booking', 
      details: error.message,
      code: error.code 
    }, { status: 500 })
  }
}

// DELETE /api/bookings/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    
    await prisma.booking.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 })
  }
}


