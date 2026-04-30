import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/site-settings
export async function GET() {
  try {
    const settings = await prisma.siteSettings.findFirst()
    return NextResponse.json(settings || { siteName: "Dhampus Eco Lodge", logoImage: "" })
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return NextResponse.json({ siteName: "Dhampus Eco Lodge", logoImage: "" })
  }
}

// PUT /api/site-settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if settings exist
    const existing = await prisma.siteSettings.findFirst()
    
    let settings
    if (existing) {
      // Update existing
      settings = await prisma.siteSettings.update({
        where: { id: existing.id },
        data: {
          siteName: body.siteName,
          logoImage: body.logoImage
        }
      })
    } else {
      // Create new
      settings = await prisma.siteSettings.create({
        data: {
          siteName: body.siteName,
          logoImage: body.logoImage
        }
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating site settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}


