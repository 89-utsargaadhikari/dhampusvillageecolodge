import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/settings/site
export async function GET() {
  try {
    let settings = await prisma.siteSettings.findFirst()
    
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          siteName: 'Dhampus Eco Lodge'
        }
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return NextResponse.json({ error: 'Failed to fetch site settings' }, { status: 500 })
  }
}

// PUT /api/settings/site
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received site settings update:', body)
    
    // Build update data with only valid fields
    const updateData: any = {}
    if (body.siteName) updateData.siteName = body.siteName
    if (body.logoImage !== undefined) updateData.logoImage = body.logoImage || null
    
    console.log('Update data:', updateData)
    
    const existing = await prisma.siteSettings.findFirst()
    
    let settings
    if (existing) {
      settings = await prisma.siteSettings.update({
        where: { id: existing.id },
        data: updateData
      })
    } else {
      settings = await prisma.siteSettings.create({
        data: {
          siteName: updateData.siteName || 'Dhampus Eco Lodge',
          logoImage: updateData.logoImage || null
        }
      })
    }
    
    console.log('Settings saved:', settings)
    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error updating site settings:', error)
    console.error('Error details:', error.message, error.code)
    return NextResponse.json({ 
      error: 'Failed to update site settings',
      details: error.message 
    }, { status: 500 })
  }
}


