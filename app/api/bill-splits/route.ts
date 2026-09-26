import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const groupKey = request.nextUrl.searchParams.get('groupKey')
    if (!groupKey) {
      return NextResponse.json({ error: 'groupKey is required' }, { status: 400 })
    }

    const splits = await prisma.billSplit.findMany({
      where: { groupKey },
      include: { allocations: true, business: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(splits)
  } catch (error) {
    console.error('Failed to fetch bill splits:', error)
    return NextResponse.json({ error: 'Failed to fetch bill splits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.groupKey || !body.label) {
      return NextResponse.json({ error: 'groupKey and label are required' }, { status: 400 })
    }

    const split = await prisma.billSplit.create({
      data: {
        groupKey: body.groupKey,
        label: body.label,
        payerName: body.payerName || null,
        payerEmail: body.payerEmail || null,
        payerPhone: body.payerPhone || null,
        businessId: body.businessId || null,
        discountType: body.discountType || 'amount',
        discountValue: body.discountValue || 0,
        vatPercent: body.vatPercent ?? 13,
      },
      include: { allocations: true, business: true },
    })
    return NextResponse.json(split)
  } catch (error) {
    console.error('Failed to create bill split:', error)
    return NextResponse.json({ error: 'Failed to create bill split' }, { status: 500 })
  }
}
