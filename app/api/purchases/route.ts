import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/purchases - Get all purchases
export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        vendor: true
      },
      orderBy: { purchaseDate: 'desc' }
    })
    
    return NextResponse.json(purchases)
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

// POST /api/purchases - Create new purchase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Calculate amounts
    const subtotal = body.subtotal || 0
    const vatPercent = body.vatPercent || 13
    const nonVatAmount = body.nonVatAmount || 0
    const vatAmount = (subtotal * vatPercent) / 100
    const total = subtotal + vatAmount + nonVatAmount
    
    const purchase = await prisma.purchase.create({
      data: {
        invoiceNo: body.invoiceNo,
        vendorId: body.vendorId,
        vendorName: body.vendorName,
        purchaseDate: new Date(body.purchaseDate),
        month: body.month,
        dateBS: body.dateBS,
        subtotal,
        vatAmount,
        vatPercent,
        nonVatAmount,
        total,
        paymentMode: body.paymentMode || 'CREDIT',
        paymentStatus: body.paymentStatus || 'unpaid',
        paidAmount: body.paidAmount || 0,
        category: body.category,
        description: body.description,
        notes: body.notes
      }
    })
    
    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase:', error)
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
  }
}
