export const MEAL_PLANS = [
  { value: "EP", label: "EP — European Plan (Room only)" },
  { value: "CP", label: "CP — Continental Plan (Room + continental breakfast)" },
  { value: "BB", label: "BB — Bed & Breakfast" },
  { value: "MAP", label: "MAP — Modified American Plan (Breakfast + dinner or lunch)" },
  { value: "AP", label: "AP — American Plan (Breakfast, lunch & dinner)" },
  { value: "AI", label: "AI — All Inclusive" },
] as const

export const OCCUPANCY_TYPES = [
  { value: "SGL", label: "SGL — Single", pax: 1 },
  { value: "TWIN", label: "TWIN — Twin", pax: 2 },
  { value: "DBL", label: "DBL — Double", pax: 2 },
  { value: "TRPL", label: "TRPL — Triple", pax: 3 },
] as const

export function paxForOccupancy(occupancy?: string | null) {
  if (occupancy === "SGL") return 1
  if (occupancy === "TRPL") return 3
  if (occupancy === "TWIN" || occupancy === "DBL") return 2
  return 1
}

export function occupancyForPax(pax: number, currentOccupancy?: string | null) {
  const count = Number.isFinite(pax) && pax > 0 ? Math.floor(pax) : 1
  if (count <= 1) return "SGL"
  if (count === 2) return currentOccupancy === "TWIN" ? "TWIN" : "DBL"
  return "TRPL"
}

/** Lodge room categories used on every room-type picklist. Occupancy is SGL/TWIN/DBL/TRPL on the booking. */
export const STANDARD_ROOM_TYPES = [
  {
    name: "Standard Room",
    code: "STD",
    capacity: 2,
    occupancy: "DBL",
    description: "Standard room",
    features: ["Standard Room"],
  },
  {
    name: "Deluxe Room",
    code: "DLX",
    capacity: 2,
    occupancy: "DBL",
    description: "Deluxe room",
    features: ["Deluxe Room"],
  },
] as const

const ROOM_TYPE_ALIASES: Record<string, string> = {
  standard: "Standard Room",
  "deluxe twin": "Deluxe Room",
  deluxe: "Deluxe Room",
}

export const CURRENCIES = [
  { value: "NPR", label: "NPR", symbol: "NPR" },
  { value: "USD", label: "USD", symbol: "$" },
  { value: "INR", label: "INR", symbol: "₹" },
] as const

export const BOOKING_SOURCES = [
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone" },
  { value: "walkin", label: "Walk-in" },
  { value: "travel_agent", label: "Travel Agent" },
  { value: "company", label: "Company" },
  { value: "business", label: "Business Partner" },
] as const

export function mealPlanLabel(code?: string | null) {
  if (!code) return "N/A"
  const normalized = code === "bed_only" ? "EP" : code === "bed_breakfast" ? "BB" : code
  return MEAL_PLANS.find((plan) => plan.value === normalized)?.label ?? normalized
}

export function occupancyLabel(code?: string | null) {
  if (!code) return "N/A"
  return OCCUPANCY_TYPES.find((item) => item.value === code)?.label ?? code
}

export function currencySymbol(code?: string | null) {
  return CURRENCIES.find((item) => item.value === code)?.symbol ?? "NPR"
}

export function normalizeRoomTypeName(name: string) {
  return name.trim().replace(/\s+/g, " ")
}

export function canonicalizeRoomTypeName(name: string) {
  const normalized = normalizeRoomTypeName(name)
  if (!normalized) return ""
  const alias = ROOM_TYPE_ALIASES[normalized.toLowerCase()]
  if (alias) return alias
  const standard = STANDARD_ROOM_TYPES.find((type) => type.name.toLowerCase() === normalized.toLowerCase())
  return standard?.name ?? normalized
}

export function isRejectedRoomTypeName(name?: string | null) {
  const key = normalizeRoomTypeName(name || "").toLowerCase()
  return key === "no bed" || key === "nobed"
}

export function standardRoomType(name?: string | null) {
  if (!name) return undefined
  const canonical = canonicalizeRoomTypeName(name)
  return STANDARD_ROOM_TYPES.find((type) => type.name === canonical)
}

export function defaultOccupancyForRoomType(name?: string | null) {
  return standardRoomType(name)?.occupancy ?? "DBL"
}

export function catalogRoomTypeNames() {
  return STANDARD_ROOM_TYPES.map((type) => type.name)
}

export function isCatalogRoomType(name?: string | null) {
  if (!name) return false
  return STANDARD_ROOM_TYPES.some((type) => type.name === name || type.name === canonicalizeRoomTypeName(name))
}

export function picklistRoomTypes<T extends { name: string }>(types: T[], selectedName?: string | null) {
  const allowed = new Set(catalogRoomTypeNames())
  if (selectedName) allowed.add(selectedName)
  return sortRoomTypes(types.filter((type) => allowed.has(type.name)))
}

export function sortRoomTypes<T extends { name: string }>(types: T[]) {
  return [...types].sort((a, b) => {
    const aIndex = STANDARD_ROOM_TYPES.findIndex((type) => type.name === canonicalizeRoomTypeName(a.name))
    const bIndex = STANDARD_ROOM_TYPES.findIndex((type) => type.name === canonicalizeRoomTypeName(b.name))
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return a.name.localeCompare(b.name)
  })
}

/** Catalog stubs stay off the public site until staff add a nightly price or a real photo. */
export function isGuestFacingRoom(room: {
  price?: string | null
  description?: string | null
  image?: string | null
}) {
  const price = Number(room.price)
  const hasPrice = Number.isFinite(price) && price > 0
  const hasCustomImage = Boolean(room.image && room.image !== "/placeholder.svg")
  return hasPrice || hasCustomImage
}

export function formatMoney(amount: number | string | null | undefined, currency?: string | null) {
  const value = typeof amount === "string" ? parseFloat(amount || "0") : amount || 0
  const symbol = currencySymbol(currency)
  return `${symbol} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function parseOptionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null
  const parsed = typeof value === "number" ? value : parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : null
}

export function parseStayDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

export function stayNightsAndDays(checkin?: string | null, checkout?: string | null) {
  if (!checkin || !checkout) return { nights: null as number | null, days: null as number | null, label: "—" }
  const start = parseStayDate(checkin)
  const end = parseStayDate(checkout)
  if (!start || !end) {
    return { nights: null as number | null, days: null as number | null, label: "—" }
  }
  const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const days = nights >= 0 ? nights + 1 : nights - 1
  const nightWord = Math.abs(nights) === 1 ? "night" : "nights"
  const dayWord = Math.abs(days) === 1 ? "day" : "days"
  return { nights, days, label: `${nights} ${nightWord} · ${days} ${dayWord}` }
}

/** Count of billable nights. Same-day / missing dates count as 1 night. */
export function stayNightsCount(checkin?: string | null, checkout?: string | null) {
  const { nights } = stayNightsAndDays(checkin, checkout)
  if (nights == null || !Number.isFinite(nights) || nights < 1) return 1
  return nights
}

export function stayTotalFromNightlyRate(
  nightlyRate: number | string | null | undefined,
  checkin?: string | null,
  checkout?: string | null
) {
  const rate = typeof nightlyRate === "number" ? nightlyRate : parseFloat(String(nightlyRate || "0"))
  const safeRate = Number.isFinite(rate) ? Math.max(0, rate) : 0
  return Math.round((safeRate * stayNightsCount(checkin, checkout) + Number.EPSILON) * 100) / 100
}

export function nightlyRateFromStayTotal(
  total: number | string | null | undefined,
  checkin?: string | null,
  checkout?: string | null
) {
  const amount = typeof total === "number" ? total : parseFloat(String(total || "0"))
  const safeTotal = Number.isFinite(amount) ? amount : 0
  const nights = stayNightsCount(checkin, checkout)
  return Math.round((safeTotal / nights + Number.EPSILON) * 100) / 100
}

export const BOOKING_STATUSES = [
  { value: "Pending", label: "Pending" },
  { value: "Checked In", label: "Checked In" },
  { value: "Checked Out", label: "Checked Out" },
  { value: "Cancelled", label: "Cancelled" },
] as const
