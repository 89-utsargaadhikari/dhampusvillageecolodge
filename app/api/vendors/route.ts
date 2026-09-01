import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/vendors - Get all vendors
export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { purchases: true }
        }
      }
    })

    return NextResponse.json(vendors)
  } catch (error: any) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json({ error: 'Failed to fetch vendors', details: error.message }, { status: 500 })
  }
}

// POST /api/vendors - Create new vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })
    }

    const vendor = await prisma.vendor.create({
      data: {
        name: body.name.trim(),
        contactPerson: body.contactPerson || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        irdNumber: body.irdNumber || null,
        active: body.active !== undefined ? body.active : true,
        notes: body.notes || null
      }
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error: any) {
    console.error('Error creating vendor:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A vendor with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create vendor', details: error.message }, { status: 500 })
  }
}
