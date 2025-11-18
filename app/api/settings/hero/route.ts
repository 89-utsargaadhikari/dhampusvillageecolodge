import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/settings/hero
export async function GET() {
  try {
    let settings = await prisma.heroSettings.findFirst()
    
    if (!settings) {
      settings = await prisma.heroSettings.create({
        data: {
          backgroundType: 'image',
          title: 'Welcome to Dhampus Eco Lodge',
          subtitle: 'Experience luxury in the heart of the Himalayas'
        }
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching hero settings:', error)
    return NextResponse.json({ error: 'Failed to fetch hero settings' }, { status: 500 })
  }
}

// PUT /api/settings/hero
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const existing = await prisma.heroSettings.findFirst()
    
    let settings
    if (existing) {
      settings = await prisma.heroSettings.update({
        where: { id: existing.id },
        data: body
      })
    } else {
      settings = await prisma.heroSettings.create({
        data: body
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating hero settings:', error)
    return NextResponse.json({ error: 'Failed to update hero settings' }, { status: 500 })
  }
}


