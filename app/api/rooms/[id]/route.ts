import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/rooms/[id] - Update room
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    
    const room = await prisma.room.update({
      where: { id },
      data: {
        name: body.name,
        price: body.price,
        description: body.description,
        capacity: body.capacity,
        status: body.status,
        features: JSON.stringify(body.features || []),
        rating: body.rating,
        image: body.image,
        roomNumbers: body.roomNumbers ? body.roomNumbers.join(', ') : ''
      }
    })
    
    return NextResponse.json(room)
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

// DELETE /api/rooms/[id] - Delete room
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    
    await prisma.room.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}


