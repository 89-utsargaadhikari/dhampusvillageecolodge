import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PUT /api/rooms/[id] - Update room
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
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
    
    // Sync room inventory: Delete old entries and create new ones
    await prisma.roomInventory.deleteMany({
      where: { roomTypeId: id }
    })
    
    if (body.roomNumbers && body.roomNumbers.length > 0) {
      const inventoryData = body.roomNumbers.map((roomNumber: string) => ({
        roomNumber: roomNumber.trim(),
        roomType: body.name,
        roomTypeId: room.id,
        floor: null,
        notes: null
      }))
      
      await prisma.roomInventory.createMany({
        data: inventoryData,
        skipDuplicates: true
      })
    }
    
    return NextResponse.json(room)
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

// DELETE /api/rooms/[id] - Delete room
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    
    await prisma.room.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}


