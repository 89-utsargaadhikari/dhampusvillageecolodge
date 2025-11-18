import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/rooms - Get all rooms
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { id: 'asc' }
    })
    
    // Convert to format expected by frontend
    const formattedRooms = rooms.map(room => ({
      ...room,
      features: JSON.parse(room.features),
      roomNumbers: room.roomNumbers ? room.roomNumbers.split(',').map(n => n.trim()) : []
    }))
    
    return NextResponse.json(formattedRooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}

// POST /api/rooms - Create new room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const room = await prisma.room.create({
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
    
    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}


