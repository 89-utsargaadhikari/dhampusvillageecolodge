import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { canonicalizeRoomTypeName, isRejectedRoomTypeName, standardRoomType } from '@/lib/hotel'
import { ensureStandardRoomTypes } from '@/lib/room-types'

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

function uniqueTargets(error: any): string[] {
  const target = error?.meta?.target
  if (Array.isArray(target)) return target.map(String)
  if (typeof target === 'string') return [target]
  return []
}

async function syncRoomIdSequence() {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Room"', 'id'), COALESCE((SELECT MAX(id) FROM "Room"), 1))`
  )
}

// GET /api/rooms - Get all rooms
export async function GET() {
  try {
    const rooms = await ensureStandardRoomTypes()
    return NextResponse.json(rooms.map(formatRoom))
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}

// POST /api/rooms - Create new room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = canonicalizeRoomTypeName(String(body.name || ''))

    if (!name) {
      return NextResponse.json({ error: 'Room type name is required' }, { status: 400 })
    }
    if (isRejectedRoomTypeName(name)) {
      return NextResponse.json({ error: 'That is not a valid room type' }, { status: 400 })
    }

    const existing = await prisma.room.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })
    if (existing) {
      return NextResponse.json(
        { error: `A room type named "${existing.name}" already exists` },
        { status: 409 }
      )
    }

    const standard = standardRoomType(name)
    const capacity = parseInt(body.capacity)
    const rating = parseFloat(body.rating)
    const data = {
      name,
      price: body.price != null && body.price !== '' ? String(body.price) : '0',
      currency: body.currency || 'NPR',
      description: body.description || standard?.description || '',
      capacity: Number.isFinite(capacity) ? capacity : standard?.capacity ?? 2,
      status: body.status || 'Available',
      features: JSON.stringify(body.features?.length ? body.features : standard?.features || []),
      rating: Number.isFinite(rating) ? rating : 0,
      image: body.image || '/placeholder.svg',
      roomNumbers: Array.isArray(body.roomNumbers) ? body.roomNumbers.join(', ') : ''
    }

    let room
    try {
      room = await prisma.room.create({ data })
    } catch (error: any) {
      if (error?.code === 'P2002' && uniqueTargets(error).includes('id')) {
        await syncRoomIdSequence()
        room = await prisma.room.create({ data })
      } else {
        throw error
      }
    }

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

    return NextResponse.json(formatRoom(room), { status: 201 })
  } catch (error: any) {
    console.error('Error creating room:', error)
    if (error?.code === 'P2002' && uniqueTargets(error).some((field) => field.toLowerCase().includes('name'))) {
      return NextResponse.json(
        { error: 'A room type with this name already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
