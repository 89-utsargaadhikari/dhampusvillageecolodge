import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/sales - Get all sales
export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        staff: true
      },
      orderBy: { saleDate: 'desc' }
    })
    
    return NextResponse.json(sales)
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}

// POST /api/sales - Create new sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Calculate amounts
    const subtotal = body.subtotal || 0
    const vatPercent = body.vatPercent || 13
    const nonVatAmount = body.nonVatAmount || 0
    const vatAmount = (subtotal * vatPercent) / 100
    const total = subtotal + vatAmount + nonVatAmount
    
    const sale = await prisma.sale.create({
      data: {
        saleDate: new Date(body.saleDate),
        month: body.month,
        dateBS: body.dateBS,
        staffId: body.staffId,
        staffName: body.staffName,
        subtotal,
        vatAmount,
        vatPercent,
        nonVatAmount,
        total,
        paymentMode: body.paymentMode || 'CASH',
        category: body.category,
        description: body.description,
        invoiceNo: body.invoiceNo,
        customerName: body.customerName
      }
    })
    
    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
  }
}
