import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/gallery
export async function GET() {
  try {
    const items = await prisma.galleryItem.findMany({
      orderBy: { order: 'asc' }
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching gallery:', error)
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 })
  }
}

// POST /api/gallery
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Creating gallery item:', { hasImage: !!body.src, alt: body.alt, category: body.category })
    
    // Get the highest order number and add 1
    const maxOrder = await prisma.galleryItem.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    })
    
    const item = await prisma.galleryItem.create({
      data: {
        image: body.src || body.image, // Accept both field names
        title: body.alt || body.title || 'Untitled', // Accept both field names
        category: body.category || 'general',
        order: (maxOrder?.order || 0) + 1
      }
    })
    
    console.log('✅ Gallery item created:', item.id)
    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    console.error('❌ Error creating gallery item:', error)
    console.error('Error details:', error.message)
    return NextResponse.json({ 
      error: 'Failed to create gallery item',
      details: error.message 
    }, { status: 500 })
  }
}

// PUT /api/gallery - Bulk update
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    await prisma.galleryItem.deleteMany({})
    const items = await prisma.galleryItem.createMany({ data: body })
    
    return NextResponse.json(items)
  } catch (error) {
    console.error('Error updating gallery:', error)
    return NextResponse.json({ error: 'Failed to update gallery' }, { status: 500 })
  }
}


