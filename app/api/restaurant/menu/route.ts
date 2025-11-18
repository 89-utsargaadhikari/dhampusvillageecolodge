import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const menuItems = await prisma.restaurantMenuItem.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(menuItems)
  } catch (error) {
    console.error('Failed to fetch menu items:', error)
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating menu item with data:', body)

    const menuItem = await prisma.restaurantMenuItem.create({
      data: {
        name: body.name,
        description: body.description || '',
        price: body.price,
        category: body.category,
        image: body.image || '',
        available: body.available !== undefined ? body.available : true
      }
    })
    
    console.log('Menu item created:', menuItem)
    return NextResponse.json(menuItem)
  } catch (error) {
    console.error('Failed to create menu item:', error)
    return NextResponse.json({ error: 'Failed to create menu item', details: error }, { status: 500 })
  }
}

