import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    await prisma.accountTransaction.delete({
      where: { id: parseInt(paramId) }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}

