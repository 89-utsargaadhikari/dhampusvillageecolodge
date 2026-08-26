import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { resolveBookingPrice } from '@/lib/apply-partner-rate'
import { normalizeCurrency } from '@/lib/rate-cards'

async function bookingPayload(body: any) {
  return {
    guest: body.guest || "",
    email: body.email || null,
    phone: body.phone || null,
    room: body.room || "Unassigned",
    roomNumber: body.roomNumber || null,
    checkin: body.checkin || "",
    checkout: body.checkout || "",
    price: await resolveBookingPrice(body),
    numberOfGuests: body.numberOfGuests ? parseInt(body.numberOfGuests) : 1,
    bookingType: body.bookingType || "EP",
    occupancy: body.occupancy || null,
    currency: normalizeCurrency(body.currency),
    extraBed: Boolean(body.extraBed),
    groupId: body.groupId || null,
    status: body.status || 'Pending',
    bookingSource: body.bookingSource || 'phone',
    businessId: body.businessId ? parseInt(body.businessId) : null
  }
}

async function nextBookingIds(tx: { booking: typeof prisma.booking }, count: number) {
  const year = new Date().getFullYear()
  const prefix = `BK-${year}-`
  const latest = await tx.booking.findFirst({
    where: { bookingId: { startsWith: prefix } },
    orderBy: { bookingId: "desc" },
    select: { bookingId: true },
  })

  let suffix = 1
  const parsed = latest?.bookingId ? parseInt(latest.bookingId.slice(prefix.length), 10) : NaN
  if (Number.isFinite(parsed) && parsed >= 0) suffix = parsed + 1

  return Array.from({ length: count }, (_, index) => {
    const value = suffix + index
    if (value > 9999) return `${prefix}${Date.now()}-${index}`
    return `${prefix}${String(value).padStart(4, "0")}`
  })
}

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        business: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const roomEntries = Array.isArray(body.rooms) && body.rooms.length > 0 ? body.rooms : [body]
    const groupId = roomEntries.length > 1 ? (body.groupId || `GRP-${Date.now()}`) : (body.groupId || null)

    const created = await prisma.$transaction(async (tx) => {
      const bookingIds = await nextBookingIds(tx, roomEntries.length)
      const payloads = await Promise.all(roomEntries.map((room: any) => bookingPayload({ ...body, ...room, groupId })))
      await tx.booking.createMany({
        data: payloads.map((payload, index) => ({
          bookingId: bookingIds[index],
          ...payload,
        })),
      })

      return tx.booking.findMany({
        where: { bookingId: { in: bookingIds } },
        include: {
          business: {
            select: { id: true, name: true },
          },
        },
        orderBy: { id: "asc" },
      })
    }, {
      maxWait: 15000,
      timeout: 30000,
    })

    if (!Array.isArray(body.rooms) || body.rooms.length === 0) {
      return NextResponse.json(created[0], { status: 201 })
    }

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    console.error('Error creating booking:', error)
    return NextResponse.json({
      error: 'Failed to create booking',
      details: error.message
    }, { status: 500 })
  }
}
