import prisma from "@/lib/prisma"
import { lookupPartnerRate } from "@/lib/rate-cards"

export async function resolveBookingPrice(body: {
  price?: unknown
  businessId?: unknown
  room?: string | null
  bookingType?: string | null
  currency?: string | null
  occupancy?: string | null
}) {
  const explicit = body.price
  if (explicit !== undefined && explicit !== null && String(explicit).trim() !== "") {
    return String(explicit)
  }

  const businessId = body.businessId ? parseInt(String(body.businessId), 10) : NaN
  if (!Number.isFinite(businessId) || !body.room) return "0"

  const cards = await prisma.businessRateCard.findMany({ where: { businessId } })
  const rate = lookupPartnerRate(cards, {
    roomType: body.room,
    mealPlan: body.bookingType,
    currency: body.currency,
    occupancy: body.occupancy,
  })
  return rate == null ? "0" : String(rate)
}
