import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// DELETE hero media
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId)
    
    await prisma.heroMedia.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting hero media:", error)
    return NextResponse.json({ error: "Failed to delete hero media" }, { status: 500 })
  }
}

// PUT update hero media
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId)
    const body = await request.json()
    const { type, url, order } = body

    const media = await prisma.heroMedia.update({
      where: { id },
      data: {
        type,
        url,
        order,
      },
    })

    return NextResponse.json(media)
  } catch (error) {
    console.error("Error updating hero media:", error)
    return NextResponse.json({ error: "Failed to update hero media" }, { status: 500 })
  }
}



