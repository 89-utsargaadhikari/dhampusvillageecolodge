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
    
    const existing = await prisma.siteSettings.findFirst()
    
    let settings
    if (existing) {
      settings = await prisma.siteSettings.update({
        where: { id: existing.id },
        data: body
      })
    } else {
      settings = await prisma.siteSettings.create({
        data: body
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating site settings:', error)
    return NextResponse.json({ error: 'Failed to update site settings' }, { status: 500 })
  }
}


