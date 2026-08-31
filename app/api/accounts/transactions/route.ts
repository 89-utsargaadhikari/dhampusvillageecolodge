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
    const amount = parseFloat(body.amount)
    const exchangeRate = body.exchangeRate ? parseFloat(body.exchangeRate) : 1
    const amountNPR = body.currency === 'NPR' || !body.currency
      ? amount
      : amount * exchangeRate

    const transaction = await prisma.accountTransaction.create({
      data: {
        date: body.date,  // Keep as string (BS date)
        dateAD: body.dateAD ? new Date(body.dateAD) : new Date(),  // Convert to DateTime
        type: body.type,
        category: body.category,
        description: body.description || '',
        amount: amount,
        currency: body.currency || 'NPR',
        amountNPR: amountNPR,
        exchangeRate: exchangeRate,
        paymentMethod: body.paymentMethod || null,
        partyName: body.partyName || null,
        invoiceNo: body.invoiceNo || null,
        referenceType: body.referenceType || 'manual',
        referenceId: body.referenceId ? parseInt(body.referenceId) : null,
        taxAmount: body.taxAmount ? parseFloat(body.taxAmount) : 0,
        taxPercentage: body.taxPercentage ? parseFloat(body.taxPercentage) : 0,
        notes: body.notes || ''
      }
    })
    
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction', details: error }, { status: 500 })
  }
}

