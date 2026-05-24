import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/staff - Get all staff
export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

// POST /api/staff - Create new staff
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const staff = await prisma.staff.create({
      data: {
        name: body.name,
        role: body.role,
        active: body.active !== undefined ? body.active : true
      }
    })
    
    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
  }
}
