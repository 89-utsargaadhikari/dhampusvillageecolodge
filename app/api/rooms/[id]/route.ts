import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { canonicalizeRoomTypeName } from '@/lib/hotel'

function formatRoom(room: { features: string; roomNumbers: string | null }) {
  let features: string[] = []
  try {
    features = JSON.parse(room.features)
  } catch {
    features = []
  }

  return {
    ...room,
    features,
    roomNumbers: room.roomNumbers ? room.roomNumbers.split(',').map((n) => n.trim()).filter(Boolean) : []
  }
}

// PUT /api/rooms/[id] - Update room
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    const body = await request.json()
    
    const existing = await prisma.room.findUnique({ where: { id } })
    const name = canonicalizeRoomTypeName(String(body.name || existing?.name || ''))
    const room = await prisma.room.update({
      where: { id },
      data: {
        name,
        price: body.price,
        currency: body.currency || 'NPR',
        description: body.description,
        capacity: body.capacity,
        status: body.status,
        features: JSON.stringify(body.features || []),
        rating: body.rating,
        image: body.image,
        roomNumbers: body.roomNumbers ? body.roomNumbers.join(', ') : ''
      }
    })
    
    if (existing?.name && existing.name !== name) {
      await prisma.booking.updateMany({ where: { room: existing.name }, data: { room: name } })
      await prisma.businessRateCard.updateMany({ where: { roomType: existing.name }, data: { roomType: name } })
    }

    // Sync room inventory: Delete old entries and create new ones
    await prisma.roomInventory.deleteMany({
      where: { roomTypeId: id }
    })
    
    if (body.roomNumbers && body.roomNumbers.length > 0) {
      const inventoryData = body.roomNumbers.map((roomNumber: string) => ({
        roomNumber: roomNumber.trim(),
        roomType: name,
        roomTypeId: room.id,
        floor: null,
        notes: null
      }))
      
      await prisma.roomInventory.createMany({
        data: inventoryData,
        skipDuplicates: true
      })
    }
    
    return NextResponse.json(formatRoom(room))
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


