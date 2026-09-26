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

    const updateData: any = {}
    if (body.label !== undefined) updateData.label = body.label
    if (body.payerName !== undefined) updateData.payerName = body.payerName
    if (body.payerEmail !== undefined) updateData.payerEmail = body.payerEmail
    if (body.payerPhone !== undefined) updateData.payerPhone = body.payerPhone
    if (body.businessId !== undefined) updateData.businessId = body.businessId
    if (body.discountType !== undefined) updateData.discountType = body.discountType
    if (body.discountValue !== undefined) updateData.discountValue = body.discountValue
    if (body.vatPercent !== undefined) updateData.vatPercent = body.vatPercent
    if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod
    if (body.notes !== undefined) updateData.notes = body.notes

    const split = await prisma.billSplit.update({
      where: { id },
      data: updateData,
      include: { allocations: true, business: true },
    })
    return NextResponse.json(split)
  } catch (error) {
    console.error('Failed to update bill split:', error)
    return NextResponse.json({ error: 'Failed to update bill split' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId)
    await prisma.billSplit.delete({ where: { id } })
    return NextResponse.json({ message: 'Bill split deleted' })
  } catch (error) {
    console.error('Failed to delete bill split:', error)
    return NextResponse.json({ error: 'Failed to delete bill split' }, { status: 500 })
  }
}
