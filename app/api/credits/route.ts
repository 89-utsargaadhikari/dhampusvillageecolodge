import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const creditAccounts = await prisma.creditAccount.findMany({
      include: {
        payments: {
          orderBy: {
            paymentDate: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(creditAccounts)
  } catch (error) {
    console.error('Failed to fetch credit accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch credit accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const creditAccount = await prisma.creditAccount.create({
      data: {
        guestName: body.guestName,
        guestEmail: body.guestEmail || null,
        guestPhone: body.guestPhone,
        guestAddress: body.guestAddress || null,
        creditAmount: parseFloat(body.creditAmount),
        paidAmount: body.paidAmount ? parseFloat(body.paidAmount) : 0,
        outstandingBalance: parseFloat(body.outstandingBalance || body.creditAmount - (body.paidAmount || 0)),
        creditDate: new Date(body.creditDate),
        dueDate: new Date(body.dueDate),
        status: body.status || 'unpaid',
        bookingId: body.bookingId ? parseInt(body.bookingId) : null,
        businessId: body.businessId ? parseInt(body.businessId) : null,
        notes: body.notes || null,
        lastReminderSent: body.lastReminderSent ? new Date(body.lastReminderSent) : null
      }
    })
    
    return NextResponse.json(creditAccount)
  } catch (error) {
    console.error('Failed to create credit account:', error)
    return NextResponse.json({ error: 'Failed to create credit account', details: error }, { status: 500 })
  }
}

