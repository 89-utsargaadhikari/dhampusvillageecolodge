import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const transactions = await prisma.accountTransaction.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Calculate amountNPR if currency is not NPR
    const amountNPR = body.currency === 'NPR' || !body.currency
      ? body.amount
      : body.amount * (body.exchangeRate || 1)

    const transaction = await prisma.accountTransaction.create({
      data: {
        date: new Date(body.date),
        type: body.type,
        category: body.category,
        description: body.description || '',
        amount: body.amount,
        currency: body.currency || 'NPR',
        amountNPR: amountNPR,
        exchangeRate: body.exchangeRate || 1,
        paymentMethod: body.paymentMethod || null,
        referenceType: body.referenceType || 'manual',
        referenceId: body.referenceId || null,
        taxAmount: body.taxAmount || 0,
        taxPercentage: body.taxPercentage || 0,
        notes: body.notes || ''
      }
    })
    
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction', details: error }, { status: 500 })
  }
}

