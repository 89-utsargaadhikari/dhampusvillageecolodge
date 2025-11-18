import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const transactions = await prisma.accountTransaction.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const amount = parseFloat(body.amount)
    const currency = body.currency || 'NPR'
    const exchangeRate = body.exchangeRate || 1
    
    const transaction = await prisma.accountTransaction.create({
      data: {
        date: body.date, // Keep as string
        type: body.type,
        category: body.category,
        description: body.description,
        amount: amount,
        currency: currency,
        exchangeRate: exchangeRate,
        amountNPR: amount * exchangeRate, // Calculate NPR amount
        paymentMethod: body.paymentMethod || null,
        referenceType: body.referenceType || null,
        referenceId: body.referenceId || null,
        taxAmount: body.taxAmount || 0,
        taxPercentage: body.taxPercentage || 0,
        notes: body.notes || null,
        createdBy: body.createdBy || null
      }
    })
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction', details: String(error) }, { status: 500 })
  }
}

