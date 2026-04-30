import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST /api/business/import - Import businesses from Excel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const businesses = body.businesses // Array of business objects from Excel
    
    if (!Array.isArray(businesses)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }
    
    let created = 0
    let skipped = 0
    let errors: any[] = []
    
    for (const biz of businesses) {
      try {
        // Check if business already exists
        const existing = await prisma.business.findUnique({
          where: { name: biz.name }
        })
        
        if (existing) {
          skipped++
          continue
        }
        
        await prisma.business.create({
          data: {
            name: biz.name,
            contactPerson: biz.contactPerson || null,
            phone: biz.phone || null,
            email: biz.email || null,
            address: biz.address || null,
            irdNumber: biz.irdNumber || null,
            creditLimit: biz.creditLimit ? parseFloat(biz.creditLimit) : 0,
            currentCredit: 0,
            notes: biz.notes || null,
            active: true
          }
        })
        created++
      } catch (error: any) {
        errors.push({ name: biz.name, error: error.message })
      }
    }
    
    return NextResponse.json({
      success: true,
      created,
      skipped,
      errors,
      message: `${created} new businesses imported${skipped > 0 ? `, ${skipped} skipped (already exist)` : ''}${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    })
  } catch (error: any) {
    console.error('Error importing businesses:', error)
    return NextResponse.json({ 
      error: 'Failed to import businesses',
      details: error.message 
    }, { status: 500 })
  }
}

