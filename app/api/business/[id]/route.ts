import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PUT /api/business/[id] - Update business
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    const body = await request.json()
    
    const business = await prisma.business.update({
      where: { id },
      data: {
        name: body.name,
        contactPerson: body.contactPerson || null,
        phone: body.phone,
        email: body.email || null,
        address: body.address || null,
        irdNumber: body.irdNumber || null,
        creditLimit: body.creditLimit !== undefined ? parseFloat(body.creditLimit) : undefined,
        currentCredit: body.currentCredit !== undefined ? parseFloat(body.currentCredit) : undefined,
        notes: body.notes || null,
        active: body.active !== undefined ? body.active : undefined
      }
    })
    
    return NextResponse.json(business)
  } catch (error: any) {
    console.error('Error updating business:', error)
    return NextResponse.json({ 
      error: 'Failed to update business',
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE /api/business/[id] - Delete business
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    
    await prisma.business.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting business:', error)
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 })
  }
}



