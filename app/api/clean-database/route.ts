import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Delete all data in order (to respect foreign keys)
    await prisma.orderItem.deleteMany()
    await prisma.restaurantOrder.deleteMany()
    await prisma.restaurantMenuItem.deleteMany()
    await prisma.accountTransaction.deleteMany()
    await prisma.booking.deleteMany()
    await prisma.roomInventory.deleteMany()
    await prisma.room.deleteMany()
    await prisma.galleryItem.deleteMany()
    await prisma.heroSettings.deleteMany()
    await prisma.siteSettings.deleteMany()

    return NextResponse.json({
      success: true,
      message: 'Database cleaned successfully - all data deleted'
    })
  } catch (error: any) {
    console.error('Clean database error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

