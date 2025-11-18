import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId)
    const body = await request.json()

    const creditAccount = await prisma.creditAccount.update({
      where: { id },
      data: {
        status: body.status,
        lastReminderSent: body.lastReminderSent ? new Date(body.lastReminderSent) : undefined,
        notes: body.notes
      }
    })
    
    return NextResponse.json(creditAccount)
  } catch (error) {
    console.error('Failed to update credit account:', error)
    return NextResponse.json({ error: 'Failed to update credit account' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId)

    // Delete associated payments first
    await prisma.creditPayment.deleteMany({
      where: { creditAccountId: id }
    })

    // Delete the credit account
    await prisma.creditAccount.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Credit account deleted' })
  } catch (error) {
    console.error('Failed to delete credit account:', error)
    return NextResponse.json({ error: 'Failed to delete credit account' }, { status: 500 })
  }
}

