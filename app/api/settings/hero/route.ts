import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
    console.log('Received hero settings update:', body)
    
    // Build update data with only valid fields
    const updateData: any = {}
    if (body.backgroundType) updateData.backgroundType = body.backgroundType
    if (body.backgroundUrl !== undefined) updateData.backgroundUrl = body.backgroundUrl || null
    if (body.title) updateData.title = body.title
    if (body.subtitle) updateData.subtitle = body.subtitle
    
    console.log('Update data:', updateData)
    
    const existing = await prisma.heroSettings.findFirst()
    
    let settings
    if (existing) {
      settings = await prisma.heroSettings.update({
        where: { id: existing.id },
        data: updateData
      })
    } else {
      settings = await prisma.heroSettings.create({
        data: {
          backgroundType: updateData.backgroundType || 'image',
          backgroundUrl: updateData.backgroundUrl || null,
          title: updateData.title || 'Welcome to Dhampus Eco Lodge',
          subtitle: updateData.subtitle || 'Experience luxury in the heart of the Himalayas'
        }
      })
    }
    
    console.log('Settings saved:', settings)
    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error updating hero settings:', error)
    console.error('Error details:', error.message, error.code)
    return NextResponse.json({ 
      error: 'Failed to update hero settings',
      details: error.message 
    }, { status: 500 })
  }
}


