import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/business/[id]/rates - Get all rate cards for a business
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const businessId = parseInt(paramId)
    
    const rates = await prisma.businessRateCard.findMany({
      where: { businessId },
      orderBy: [{ roomType: 'asc' }, { mealPlan: 'asc' }]
    })
    
    return NextResponse.json(rates)
  } catch (error) {
    console.error('Error fetching rate cards:', error)
    return NextResponse.json({ error: 'Failed to fetch rate cards' }, { status: 500 })
  }
}

// POST /api/business/[id]/rates - Create or update rate card
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const businessId = parseInt(paramId)
    const body = await request.json()
    
    const rateCard = await prisma.businessRateCard.upsert({
      where: {
        businessId_roomType_mealPlan: {
          businessId,
          roomType: body.roomType,
          mealPlan: body.mealPlan
        }
      },
      create: {
        businessId,
        roomType: body.roomType,
        mealPlan: body.mealPlan,
        sglRate: body.sglRate ? parseFloat(body.sglRate) : null,
        dblRate: body.dblRate ? parseFloat(body.dblRate) : null,
        trplRate: body.trplRate ? parseFloat(body.trplRate) : null
      },
      update: {
        sglRate: body.sglRate ? parseFloat(body.sglRate) : null,
        dblRate: body.dblRate ? parseFloat(body.dblRate) : null,
        trplRate: body.trplRate ? parseFloat(body.trplRate) : null
      }
    })
    
    return NextResponse.json(rateCard, { status: 201 })
  } catch (error: any) {
    console.error('Error saving rate card:', error)
    return NextResponse.json({ 
      error: 'Failed to save rate card',
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE /api/business/[id]/rates/[rateId]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const url = new URL(request.url)
    const rateId = url.searchParams.get('rateId')
    
    if (!rateId) {
      return NextResponse.json({ error: 'Rate ID required' }, { status: 400 })
    }
    
    await prisma.businessRateCard.delete({
      where: { id: parseInt(rateId) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rate card:', error)
    return NextResponse.json({ error: 'Failed to delete rate card' }, { status: 500 })
  }
}



