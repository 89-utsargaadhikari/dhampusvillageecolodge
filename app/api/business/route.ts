import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/business - Get all businesses
export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    })
    return NextResponse.json(businesses)
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 })
  }
}

// POST /api/business - Create new business
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const business = await prisma.business.create({
      data: {
        name: body.name,
        contactPerson: body.contactPerson || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        irdNumber: body.irdNumber || null,
        creditLimit: body.creditLimit ? parseFloat(body.creditLimit) : 0,
        currentCredit: 0,
        notes: body.notes || null,
        active: body.active !== undefined ? body.active : true
      }
    })
    
    return NextResponse.json(business, { status: 201 })
  } catch (error: any) {
    console.error('Error creating business:', error)
    return NextResponse.json({ 
      error: 'Failed to create business',
      details: error.message 
    }, { status: 500 })
  }
}

