import { NextRequest, NextResponse } from "next/server"
import { sendWhatsAppNotification } from "@/lib/whatsapp"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body?.title || !body?.message) {
      return NextResponse.json(
        { error: "title and message are required" },
        { status: 400 },
      )
    }

    await sendWhatsAppNotification({
      title: body.title,
      message: body.message,
      type: body.type,
      priority: body.priority,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to send WhatsApp notification:", error)
    return NextResponse.json(
      { error: "Failed to send WhatsApp notification", details: error.message },
      { status: 500 },
    )
  }
}
