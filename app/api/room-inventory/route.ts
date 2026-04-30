import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
    console.log('Creating room inventory:', body)
    
    const item = await prisma.roomInventory.create({
      data: {
        roomNumber: body.roomNumber,
        roomType: body.roomType,
        roomTypeId: parseInt(body.roomTypeId),
        floor: body.floor || null,
        notes: body.notes || null
      }
    })
    
    console.log('Created:', item)
    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    console.error('Error creating room inventory item:', error)
    console.error('Error details:', error.message, error.code)
    return NextResponse.json({ 
      error: 'Failed to create room inventory item',
      details: error.message 
    }, { status: 500 })
  }
}

// PUT /api/room-inventory - For bulk updates
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Bulk updating room inventory:', body)
    
    // Delete all and recreate (simple approach)
    await prisma.roomInventory.deleteMany({})
    
    // Validate and format data
    const formattedData = body.map((item: any) => ({
      roomNumber: item.roomNumber,
      roomType: item.roomType,
      roomTypeId: parseInt(item.roomTypeId),
      floor: item.floor || null,
      notes: item.notes || null
    }))
    
    const items = await prisma.roomInventory.createMany({
      data: formattedData
    })
    
    console.log('Created items:', items)
    return NextResponse.json(items)
  } catch (error: any) {
    console.error('Error updating room inventory:', error)
    console.error('Error details:', error.message, error.code)
    return NextResponse.json({ 
      error: 'Failed to update room inventory',
      details: error.message 
    }, { status: 500 })
  }
}


