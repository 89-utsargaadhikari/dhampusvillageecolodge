import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Create payment
    const payment = await prisma.creditPayment.create({
      data: {
        creditAccountId: body.creditAccountId,
        amount: parseFloat(body.amount),
        paymentDate: body.paymentDate,
        paymentMethod: body.paymentMethod || null,
        receivedBy: body.receivedBy || null,
        notes: body.notes || null,
      }
    })
    
    // Update credit account
    const creditAccount = await prisma.creditAccount.findUnique({
      where: { id: body.creditAccountId }
    })
    
    if (creditAccount) {
      const newPaidAmount = creditAccount.paidAmount + parseFloat(body.amount)
      const newOutstandingBalance = creditAccount.creditAmount - newPaidAmount
      const newStatus = newOutstandingBalance <= 0 ? 'paid' : 'partial'
      
      await prisma.creditAccount.update({
        where: { id: body.creditAccountId },
        data: {
          paidAmount: newPaidAmount,
          outstandingBalance: newOutstandingBalance,
          status: newStatus
        }
      })
    }
    
    return NextResponse.json(payment)
  } catch (error) {
    console.error('Failed to create payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}

