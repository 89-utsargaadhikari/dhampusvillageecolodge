import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST() {
  try {
    // Get all rooms with comma-separated room numbers
    const rooms = await prisma.room.findMany()
    
    let created = 0
    
    for (const room of rooms) {
      if (room.roomNumbers) {
        // Parse comma-separated room numbers
        const numbers = room.roomNumbers
          .split(',')
          .map(n => n.trim())
          .filter(n => n.length > 0)
        
        for (const roomNumber of numbers) {
          // Check if already exists
          const existing = await prisma.roomInventory.findUnique({
            where: { roomNumber }
          })
          
          if (!existing) {
            // Create room inventory entry
            await prisma.roomInventory.create({
              data: {
                roomNumber,
                roomType: room.name,
                roomTypeId: room.id,
                floor: roomNumber.length > 0 ? roomNumber[0] : null, // First digit as floor
              }
            })
            created++
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Synced ${created} room numbers to inventory`,
      created 
    })
  } catch (error) {
    console.error('Failed to sync room numbers:', error)
    return NextResponse.json({ error: 'Failed to sync room numbers' }, { status: 500 })
  }
}

