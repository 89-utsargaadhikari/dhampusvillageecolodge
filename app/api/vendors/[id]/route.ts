import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PUT /api/vendors/[id] - Update vendor
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    const body = await request.json()

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        name: body.name.trim(),
        contactPerson: body.contactPerson || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        irdNumber: body.irdNumber || null,
        active: body.active !== undefined ? body.active : undefined,
        notes: body.notes || null
      }
    })

    return NextResponse.json(vendor)
  } catch (error: any) {
    console.error('Error updating vendor:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A vendor with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update vendor', details: error.message }, { status: 500 })
  }
}

// DELETE /api/vendors/[id] - Delete vendor
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)

    await prisma.vendor.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting vendor:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Cannot delete vendor with existing purchases. Deactivate it instead.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to delete vendor', details: error.message }, { status: 500 })
  }
}
