import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const credits = await prisma.creditAccount.findMany({
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(credits)
  } catch (error) {
    console.error('Failed to fetch credit accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch credit accounts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const credit = await prisma.creditAccount.create({
      data: {
        guestName: body.guestName,
        guestContact: body.guestContact,
        guestEmail: body.guestEmail || null,
        creditAmount: parseFloat(body.creditAmount),
        paidAmount: parseFloat(body.paidAmount) || 0,
        outstandingBalance: parseFloat(body.outstandingBalance),
        creditDate: body.creditDate,
        dueDate: body.dueDate,
        status: body.status || 'pending',
        linkedBookingId: body.linkedBookingId || null,
        notes: body.notes || null,
        lastReminderSent: body.lastReminderSent || null,
      },
      include: {
        payments: true
      }
    })
    return NextResponse.json(credit)
  } catch (error) {
    console.error('Failed to create credit account:', error)
    return NextResponse.json({ error: 'Failed to create credit account' }, { status: 500 })
  }
}

