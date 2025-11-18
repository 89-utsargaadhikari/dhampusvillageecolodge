import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    const body = await request.json()
    
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) updateData.price = parseFloat(body.price)
    if (body.category !== undefined) updateData.category = body.category
    if (body.image !== undefined) updateData.image = body.image
    if (body.available !== undefined) updateData.available = body.available
    
    const menuItem = await prisma.restaurantMenuItem.update({
      where: { id: parseInt(paramId) },
      data: updateData
    })
    return NextResponse.json(menuItem)
  } catch (error) {
    console.error('Failed to update menu item:', error)
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    await prisma.restaurantMenuItem.delete({
      where: { id: parseInt(paramId) }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete menu item:', error)
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 })
  }
}

