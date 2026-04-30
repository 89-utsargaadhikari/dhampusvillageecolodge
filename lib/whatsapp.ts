export interface WhatsAppPayload {
  title: string
  message: string
  type?: string
  priority?: "low" | "medium" | "high"
}

const isEnabled = () => process.env.WHATSAPP_NOTIFICATIONS_ENABLED === "true"

const getPriorityEmoji = (priority?: "low" | "medium" | "high") => {
  if (priority === "high") return "🔴"
  if (priority === "medium") return "🟡"
  return "🔵"
}

const formatWhatsAppText = (payload: WhatsAppPayload) => {
  const priorityEmoji = getPriorityEmoji(payload.priority)
  const typeLabel = payload.type ? payload.type.toUpperCase() : "INFO"
  return [
    "📢 Admin Dashboard Notification",
    `${priorityEmoji} ${typeLabel}`,
    `*${payload.title}*`,
    payload.message,
    "",
    `Time: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })}`,
  ].join("\n")
}

async function sendViaTwilio(payload: WhatsAppPayload): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM
  const to = process.env.TWILIO_WHATSAPP_TO

  if (!accountSid || !authToken || !from || !to) {
    throw new Error("Twilio WhatsApp is not configured")
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const body = new URLSearchParams({
    From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
    To: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
    Body: formatWhatsAppText(payload),
  })

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Twilio API failed (${response.status}): ${text}`)
  }
}

async function sendViaWebhook(payload: WhatsAppPayload): Promise<void> {
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL
  if (!webhookUrl) {
    throw new Error("WHATSAPP_WEBHOOK_URL is not configured")
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      formattedMessage: formatWhatsAppText(payload),
      source: "admin-dashboard-notification",
      sentAt: new Date().toISOString(),
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`WhatsApp webhook failed (${response.status}): ${text}`)
  }
}

export async function sendWhatsAppNotification(payload: WhatsAppPayload): Promise<void> {
  if (!isEnabled()) return

  const hasTwilioConfig =
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    !!process.env.TWILIO_WHATSAPP_FROM &&
    !!process.env.TWILIO_WHATSAPP_TO

  const hasWebhookConfig = !!process.env.WHATSAPP_WEBHOOK_URL

  if (!hasTwilioConfig && !hasWebhookConfig) {
    throw new Error(
      "WhatsApp notifications enabled but no provider configured. Set Twilio env vars or WHATSAPP_WEBHOOK_URL.",
    )
  }

  if (hasTwilioConfig) {
    await sendViaTwilio(payload)
    return
  }

  await sendViaWebhook(payload)
}
