import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const body = await request.json()
    const credit = await prisma.creditAccount.update({
      where: { id: parseInt(paramId) },
      data: {
        guestName: body.guestName,
        guestContact: body.guestContact,
        guestEmail: body.guestEmail || null,
        creditAmount: body.creditAmount !== undefined ? parseFloat(body.creditAmount) : undefined,
        paidAmount: body.paidAmount !== undefined ? parseFloat(body.paidAmount) : undefined,
        outstandingBalance: body.outstandingBalance !== undefined ? parseFloat(body.outstandingBalance) : undefined,
        status: body.status,
        lastReminderSent: body.lastReminderSent || null,
        notes: body.notes || undefined,
      },
      include: {
        payments: true
      }
    })
    return NextResponse.json(credit)
  } catch (error) {
    console.error('Failed to update credit account:', error)
    return NextResponse.json({ error: 'Failed to update credit account' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    await prisma.creditAccount.delete({
      where: { id: parseInt(paramId) }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete credit account:', error)
    return NextResponse.json({ error: 'Failed to delete credit account' }, { status: 500 })
  }
}

