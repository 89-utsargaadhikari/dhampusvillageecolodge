import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET all hero media
export async function GET() {
  try {
    const media = await prisma.heroMedia.findMany({
      orderBy: { order: 'asc' }
    })
    return NextResponse.json(media)
  } catch (error) {
    console.error("Error fetching hero media:", error)
    return NextResponse.json({ error: "Failed to fetch hero media" }, { status: 500 })
  }
}

// POST new hero media
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("Received hero media data:", { type: body.type, order: body.order, urlLength: body.url?.length })
    const { type, url, order } = body

    if (!type || !url) {
      console.error("Missing required fields:", { type, hasUrl: !!url })
      return NextResponse.json({ error: "Missing type or url" }, { status: 400 })
    }

    console.log("Creating hero media in database...")
    const media = await prisma.heroMedia.create({
      data: {
        type,
        url,
        order: order || 0,
      },
    })

    console.log("Created hero media successfully:", media.id)
    return NextResponse.json(media)
  } catch (error) {
    console.error("Error creating hero media - FULL ERROR:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({ 
      error: "Failed to create hero media",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

