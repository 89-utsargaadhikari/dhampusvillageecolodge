import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const menuItems = await prisma.restaurantMenuItem.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(menuItems)
  } catch (error) {
    console.error('Failed to fetch menu:', error)
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('📝 Creating menu item:', body)
    
    const menuItem = await prisma.restaurantMenuItem.create({
      data: {
        name: body.name,
        description: body.description || null,
        price: parseFloat(body.price),
        category: body.category,
        image: body.image || null,
        available: body.available !== undefined ? body.available : true,
      }
    })
    
    console.log('✅ Menu item created:', menuItem)
    return NextResponse.json(menuItem)
  } catch (error: any) {
    console.error('❌ Failed to create menu item:', error)
    console.error('Error details:', error.message)
    return NextResponse.json({ 
      error: 'Failed to create menu item', 
      details: error.message 
    }, { status: 500 })
  }
}

