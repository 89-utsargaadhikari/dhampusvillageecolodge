import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/room-inventory
export async function GET() {
  try {
    const inventory = await prisma.roomInventory.findMany({
      orderBy: { roomNumber: 'asc' }
    })
    return NextResponse.json(inventory)
  } catch (error) {
    console.error('Error fetching room inventory:', error)
    return NextResponse.json({ error: 'Failed to fetch room inventory' }, { status: 500 })
  }
}

// POST /api/room-inventory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const item = await prisma.roomInventory.create({
      data: {
        roomNumber: body.roomNumber,
        roomType: body.roomType,
        roomTypeId: body.roomTypeId,
        floor: body.floor,
        notes: body.notes
      }
    })
    
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating room inventory item:', error)
    return NextResponse.json({ error: 'Failed to create room inventory item' }, { status: 500 })
  }
}

// PUT /api/room-inventory - For bulk updates
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Delete all and recreate (simple approach)
    await prisma.roomInventory.deleteMany({})
    
    const items = await prisma.roomInventory.createMany({
      data: body
    })
    
    return NextResponse.json(items)
  } catch (error) {
    console.error('Error updating room inventory:', error)
    return NextResponse.json({ error: 'Failed to update room inventory' }, { status: 500 })
  }
}


