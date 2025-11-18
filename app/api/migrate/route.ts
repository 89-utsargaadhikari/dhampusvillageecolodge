import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/migrate - Migrate localStorage data to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rooms, bookings, roomInventory, gallery, heroSettings, siteSettings } = body
    
    const results = {
      rooms: 0,
      bookings: 0,
      roomInventory: 0,
      gallery: 0,
      settings: 0
    }
    
    // Step 1: Migrate Rooms first
    if (rooms && Array.isArray(rooms)) {
      for (const room of rooms) {
        await prisma.room.create({
          data: {
            id: room.id,
            name: room.name,
            price: room.price,
            description: room.description,
            capacity: room.capacity,
            status: room.status,
            features: JSON.stringify(room.features || []),
            rating: room.rating,
            image: room.image,
            roomNumbers: room.roomNumbers ? room.roomNumbers.join(', ') : ''
          }
        })
        results.rooms++
      }
    }
    
    // Step 2: Migrate Room Inventory (must be before bookings)
    if (roomInventory && Array.isArray(roomInventory)) {
      for (const item of roomInventory) {
        try {
          await prisma.roomInventory.create({
            data: {
              roomNumber: item.roomNumber,
              roomType: item.roomType,
              roomTypeId: item.roomTypeId,
              floor: item.floor,
              notes: item.notes
            }
          })
          results.roomInventory++
        } catch (err) {
          console.log(`Skipping duplicate room number: ${item.roomNumber}`)
        }
      }
    }
    
    // Step 3: Migrate Bookings (after room inventory exists)
    if (bookings && Array.isArray(bookings)) {
      // Get all existing room numbers for validation
      const existingRoomNumbers = await prisma.roomInventory.findMany({
        select: { roomNumber: true }
      })
      const validRoomNumbers = new Set(existingRoomNumbers.map(r => r.roomNumber))
      
      for (const booking of bookings) {
        // Only include roomNumber if it exists in inventory or is null
        const roomNumber = booking.roomNumber && validRoomNumbers.has(booking.roomNumber) 
          ? booking.roomNumber 
          : null
        
        try {
          await prisma.booking.create({
            data: {
              id: booking.id,
              guest: booking.guest,
              email: booking.email,
              phone: booking.phone,
              room: booking.room,
              roomNumber: roomNumber,
              checkin: booking.checkin,
              checkout: booking.checkout,
              price: booking.price,
              status: booking.status,
              bookingSource: booking.bookingSource || 'phone'
            }
          })
          results.bookings++
        } catch (err) {
          console.log(`Skipping booking ${booking.id}: ${err}`)
        }
      }
    }
    
    // Migrate Gallery
    if (gallery && Array.isArray(gallery)) {
      for (const item of gallery) {
        await prisma.galleryItem.create({
          data: {
            image: item.image,
            title: item.title,
            category: item.category || 'general',
            order: item.order || 0
          }
        })
        results.gallery++
      }
    }
    
    // Migrate Hero Settings
    if (heroSettings) {
      await prisma.heroSettings.create({
        data: {
          backgroundType: heroSettings.backgroundType || 'image',
          backgroundUrl: heroSettings.backgroundUrl,
          title: heroSettings.title || 'Welcome to Dhampus Eco Lodge',
          subtitle: heroSettings.subtitle || 'Experience luxury in the heart of the Himalayas'
        }
      })
      results.settings++
    }
    
    // Migrate Site Settings
    if (siteSettings) {
      await prisma.siteSettings.create({
        data: {
          logo: siteSettings.logo,
          siteName: siteSettings.siteName || 'Dhampus Eco Lodge'
        }
      })
      results.settings++
    }
    
    return NextResponse.json({
      success: true,
      message: 'Data migrated successfully',
      results
    })
  } catch (error) {
    console.error('Error migrating data:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to migrate data', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

