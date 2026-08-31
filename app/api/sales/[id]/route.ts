import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PUT /api/sales/[id] - Update sale
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id: paramId } = await context.params
    const id = parseInt(paramId)
    
    const sale = await prisma.sale.update({
      where: { id },
      data: {
        ...(body.saleDate && { saleDate: new Date(body.saleDate) }),
        ...(body.month && { month: body.month }),
        ...(body.dateBS && { dateBS: body.dateBS }),
        ...(body.staffId && { staffId: body.staffId }),
        ...(body.staffName && { staffName: body.staffName }),
        ...(body.subtotal !== undefined && { subtotal: body.subtotal }),
        ...(body.vatAmount !== undefined && { vatAmount: body.vatAmount }),
        ...(body.vatPercent !== undefined && { vatPercent: body.vatPercent }),
        ...(body.nonVatAmount !== undefined && { nonVatAmount: body.nonVatAmount }),
        ...(body.total !== undefined && { total: body.total }),
        ...(body.paymentMode && { paymentMode: body.paymentMode }),
        ...(body.category && { category: body.category }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.invoiceNo !== undefined && { invoiceNo: body.invoiceNo }),
        ...(body.customerName !== undefined && { customerName: body.customerName })
      }
    })
    
    return NextResponse.json(sale)
  } catch (error) {
    console.error('Error updating sale:', error)
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 })
  }
}

// DELETE /api/sales/[id] - Delete sale
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId)
    await prisma.sale.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Sale deleted successfully' })
  } catch (error) {
    console.error('Error deleting sale:', error)
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 })
  }
}
