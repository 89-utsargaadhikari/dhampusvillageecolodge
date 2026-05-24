import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PUT /api/purchases/[id] - Update purchase
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const id = parseInt(params.id)
    
    // Recalculate amounts if needed
    const subtotal = body.subtotal !== undefined ? body.subtotal : undefined
    const vatPercent = body.vatPercent !== undefined ? body.vatPercent : undefined
    const nonVatAmount = body.nonVatAmount !== undefined ? body.nonVatAmount : undefined
    
    let vatAmount = body.vatAmount
    let total = body.total
    
    if (subtotal !== undefined && vatPercent !== undefined) {
      vatAmount = (subtotal * vatPercent) / 100
      total = subtotal + vatAmount + (nonVatAmount || 0)
    }
    
    const purchase = await prisma.purchase.update({
      where: { id },
      data: {
        ...(body.invoiceNo && { invoiceNo: body.invoiceNo }),
        ...(body.vendorId && { vendorId: body.vendorId }),
        ...(body.vendorName && { vendorName: body.vendorName }),
        ...(body.purchaseDate && { purchaseDate: new Date(body.purchaseDate) }),
        ...(body.month && { month: body.month }),
        ...(body.dateBS && { dateBS: body.dateBS }),
        ...(subtotal !== undefined && { subtotal }),
        ...(vatAmount !== undefined && { vatAmount }),
        ...(vatPercent !== undefined && { vatPercent }),
        ...(nonVatAmount !== undefined && { nonVatAmount }),
        ...(total !== undefined && { total }),
        ...(body.paymentMode && { paymentMode: body.paymentMode }),
        ...(body.paymentStatus && { paymentStatus: body.paymentStatus }),
        ...(body.paidAmount !== undefined && { paidAmount: body.paidAmount }),
        ...(body.category && { category: body.category }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.notes !== undefined && { notes: body.notes })
      }
    })
    
    return NextResponse.json(purchase)
  } catch (error) {
    console.error('Error updating purchase:', error)
    return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 })
  }
}

// DELETE /api/purchases/[id] - Delete purchase
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    await prisma.purchase.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Purchase deleted successfully' })
  } catch (error) {
    console.error('Error deleting purchase:', error)
    return NextResponse.json({ error: 'Failed to delete purchase' }, { status: 500 })
  }
}
