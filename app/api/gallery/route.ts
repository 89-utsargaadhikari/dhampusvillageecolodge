import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
    
    const item = await prisma.galleryItem.create({
      data: {
        image: body.image,
        title: body.title,
        category: body.category || 'general',
        order: body.order || 0
      }
    })
    
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating gallery item:', error)
    return NextResponse.json({ error: 'Failed to create gallery item' }, { status: 500 })
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


