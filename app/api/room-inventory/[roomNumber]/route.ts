import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/room-inventory/[roomNumber]
export async function DELETE(request: NextRequest, { params }: { params: { roomNumber: string } }) {
  try {
    const { roomNumber } = params
    
    await prisma.roomInventory.delete({
      where: { roomNumber }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting room inventory item:', error)
    return NextResponse.json({ error: 'Failed to delete room inventory item' }, { status: 500 })
  }
}


