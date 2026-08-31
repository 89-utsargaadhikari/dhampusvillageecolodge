import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId)
    const body = await request.json()

    const amount = parseFloat(body.amount)
    const exchangeRate = body.exchangeRate ? parseFloat(body.exchangeRate) : 1
    const amountNPR = body.currency === 'NPR' || !body.currency
      ? amount
      : amount * exchangeRate

    const transaction = await prisma.accountTransaction.update({
      where: { id },
      data: {
        date: body.date,
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
        taxAmount: body.taxAmount ? parseFloat(body.taxAmount) : 0,
        taxPercentage: body.taxPercentage ? parseFloat(body.taxPercentage) : 0,
        notes: body.notes || ''
      }
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Failed to update transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction', details: error }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId)

    await prisma.accountTransaction.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Transaction deleted' })
  } catch (error) {
    console.error('Failed to delete transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}

