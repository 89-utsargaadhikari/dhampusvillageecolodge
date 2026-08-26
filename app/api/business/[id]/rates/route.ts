import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { canonicalizeRoomTypeName } from '@/lib/hotel'
import { normalizeCurrency, normalizeMealPlan, parseRateInput } from '@/lib/rate-cards'

function rateRowsFromBody(body: any) {
  const roomType = canonicalizeRoomTypeName(body.roomType || "")
  const mealPlan = normalizeMealPlan(body.mealPlan)
  const incoming = Array.isArray(body.rates)
    ? body.rates
    : [{ currency: body.currency, sglRate: body.sglRate, dblRate: body.dblRate, trplRate: body.trplRate }]

  return incoming
    .map((row: any) => ({
      roomType,
      mealPlan,
      currency: normalizeCurrency(row.currency),
      sglRate: parseRateInput(row.sglRate),
      dblRate: parseRateInput(row.dblRate),
      trplRate: parseRateInput(row.trplRate),
    }))
    .filter((row: { roomType: string }) => Boolean(row.roomType))
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const businessId = parseInt(paramId)

    const rates = await prisma.businessRateCard.findMany({
      where: { businessId },
      orderBy: [{ roomType: 'asc' }, { mealPlan: 'asc' }, { currency: 'asc' }]
    })

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Error fetching rate cards:', error)
    return NextResponse.json({ error: 'Failed to fetch rate cards' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const businessId = parseInt(paramId)
    const body = await request.json()
    const rows = rateRowsFromBody(body)

    if (!rows.length) {
      return NextResponse.json({ error: 'Room type is required' }, { status: 400 })
    }

    const saved = await prisma.$transaction(async (tx) => {
      const results = []
      for (const row of rows) {
        results.push(await tx.businessRateCard.upsert({
          where: {
            businessId_roomType_mealPlan_currency: {
              businessId,
              roomType: row.roomType,
              mealPlan: row.mealPlan,
              currency: row.currency,
            }
          },
          create: { businessId, ...row },
          update: {
            sglRate: row.sglRate,
            dblRate: row.dblRate,
            trplRate: row.trplRate,
          }
        }))
      }

      const keepCurrencies = rows.map((row) => row.currency)
      if (body.replaceGroup) {
        await tx.businessRateCard.deleteMany({
          where: {
            businessId,
            roomType: rows[0].roomType,
            mealPlan: rows[0].mealPlan,
            currency: { notIn: keepCurrencies },
          }
        })
      }

      return results
    })

    return NextResponse.json(saved.length === 1 ? saved[0] : saved, { status: 201 })
  } catch (error: any) {
    console.error('Error saving rate card:', error)
    return NextResponse.json({
      error: 'Failed to save rate card',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const businessId = parseInt(paramId)
    const url = new URL(request.url)
    const rateId = url.searchParams.get('rateId')
    const roomType = url.searchParams.get('roomType')
    const mealPlan = url.searchParams.get('mealPlan')

    if (rateId) {
      await prisma.businessRateCard.delete({
        where: { id: parseInt(rateId) }
      })
      return NextResponse.json({ success: true })
    }

    if (roomType && mealPlan) {
      await prisma.businessRateCard.deleteMany({
        where: {
          businessId,
          roomType: canonicalizeRoomTypeName(roomType),
          mealPlan: normalizeMealPlan(mealPlan),
        }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Rate ID or room type + meal plan required' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting rate card:', error)
    return NextResponse.json({ error: 'Failed to delete rate card' }, { status: 500 })
  }
}
