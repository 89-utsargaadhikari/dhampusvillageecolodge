import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Create payment record
    const payment = await prisma.creditPayment.create({
      data: {
        creditAccountId: body.creditAccountId,
        amount: body.amount,
        paymentDate: new Date(body.paymentDate || new Date()),
        paymentMethod: body.paymentMethod,
        description: body.description || ''
      }
    })

    // Update credit account
    const creditAccount = await prisma.creditAccount.findUnique({
      where: { id: body.creditAccountId }
    })

    if (creditAccount) {
      const newPaidAmount = creditAccount.paidAmount + body.amount
      const newOutstandingBalance = creditAccount.creditAmount - newPaidAmount

      await prisma.creditAccount.update({
        where: { id: body.creditAccountId },
        data: {
          paidAmount: newPaidAmount,
          outstandingBalance: newOutstandingBalance,
          status: newOutstandingBalance <= 0 ? 'paid' : 
                  newOutstandingBalance < creditAccount.creditAmount ? 'partial' : 
                  'unpaid'
        }
      })
    }
    
    return NextResponse.json(payment)
  } catch (error) {
    console.error('Failed to add payment:', error)
    return NextResponse.json({ error: 'Failed to add payment', details: error }, { status: 500 })
  }
}

