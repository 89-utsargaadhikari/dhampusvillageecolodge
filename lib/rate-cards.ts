import { CURRENCIES, canonicalizeRoomTypeName, currencySymbol, occupancyLabel } from "@/lib/hotel"

export type RateCardRow = {
  id?: number
  roomType: string
  mealPlan: string
  currency: string
  sglRate?: number | null
  dblRate?: number | null
  trplRate?: number | null
}

export type RateLookup = {
  roomType?: string | null
  mealPlan?: string | null
  currency?: string | null
  occupancy?: string | null
}

export type GroupedRateCard = {
  key: string
  roomType: string
  mealPlan: string
  currencies: RateCardRow[]
}

export function normalizeMealPlan(code?: string | null) {
  if (!code) return "EP"
  if (code === "bed_only") return "EP"
  if (code === "bed_breakfast") return "BB"
  return String(code).toUpperCase()
}

export function normalizeCurrency(code?: string | null) {
  const value = String(code || "NPR").toUpperCase()
  return CURRENCIES.some((item) => item.value === value) ? value : "NPR"
}

export function occupancyRate(card?: RateCardRow | null, occupancy?: string | null) {
  if (!card) return null
  const code = String(occupancy || "DBL").toUpperCase()
  const rate = code === "SGL" ? card.sglRate : code === "TRPL" ? card.trplRate : card.dblRate
  return typeof rate === "number" && Number.isFinite(rate) ? rate : null
}

export function findRateCard(cards: RateCardRow[] | null | undefined, lookup: RateLookup) {
  if (!cards?.length || !lookup.roomType) return null
  const roomType = canonicalizeRoomTypeName(lookup.roomType)
  const mealPlan = normalizeMealPlan(lookup.mealPlan)
  const currency = normalizeCurrency(lookup.currency)
  return (
    cards.find((card) => {
      return (
        canonicalizeRoomTypeName(card.roomType) === roomType &&
        normalizeMealPlan(card.mealPlan) === mealPlan &&
        normalizeCurrency(card.currency) === currency
      )
    }) || null
  )
}

export function lookupPartnerRate(cards: RateCardRow[] | null | undefined, lookup: RateLookup) {
  return occupancyRate(findRateCard(cards, lookup), lookup.occupancy)
}

export function partnerCurrencies(cards: RateCardRow[] | null | undefined) {
  const seen = new Set<string>()
  for (const card of cards || []) {
    seen.add(normalizeCurrency(card.currency))
  }
  return CURRENCIES.map((item) => item.value).filter((value) => seen.has(value))
}

export function preferredPartnerCurrency(cards: RateCardRow[] | null | undefined, current?: string | null) {
  const available = partnerCurrencies(cards)
  if (!available.length) return normalizeCurrency(current)
  const currentCode = normalizeCurrency(current)
  if (available.includes(currentCode)) return currentCode
  if (available.includes("NPR")) return "NPR"
  return available[0]
}

export function groupRateCards(cards: RateCardRow[] | null | undefined): GroupedRateCard[] {
  const groups = new Map<string, GroupedRateCard>()
  for (const card of cards || []) {
    const roomType = card.roomType
    const mealPlan = normalizeMealPlan(card.mealPlan)
    const key = `${canonicalizeRoomTypeName(roomType)}::${mealPlan}`
    const existing = groups.get(key)
    if (existing) {
      existing.currencies.push(card)
    } else {
      groups.set(key, { key, roomType, mealPlan, currencies: [card] })
    }
  }
  return [...groups.values()].map((group) => ({
    ...group,
    currencies: [...group.currencies].sort(
      (a, b) =>
        CURRENCIES.findIndex((item) => item.value === normalizeCurrency(a.currency)) -
        CURRENCIES.findIndex((item) => item.value === normalizeCurrency(b.currency))
    ),
  }))
}

export function parseRateInput(value: unknown) {
  if (value === undefined || value === null || value === "") return null
  const parsed = parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : null
}

export function rateSourceLabel(lookup: RateLookup) {
  const occupancy = occupancyLabel(lookup.occupancy || "DBL")
  return `${lookup.roomType || "Room"} · ${normalizeMealPlan(lookup.mealPlan)} · ${occupancy} · ${normalizeCurrency(lookup.currency)}`
}

export function formatRateValue(amount: number | null | undefined, currency?: string | null) {
  if (amount == null) return "—"
  return `${currencySymbol(currency)} ${amount.toLocaleString()}`
}

export function rateCardKey(card: Pick<RateCardRow, "roomType" | "mealPlan" | "currency">) {
  return `${canonicalizeRoomTypeName(card.roomType)}::${normalizeMealPlan(card.mealPlan)}::${normalizeCurrency(card.currency)}`
}

export function findRateCardByKey(cards: RateCardRow[] | null | undefined, key?: string | null) {
  if (!key) return null
  return (cards || []).find((card) => rateCardKey(card) === key) || null
}

export function matchingRateCardKey(
  cards: RateCardRow[] | null | undefined,
  lookup: RateLookup
) {
  const card = findRateCard(cards, lookup)
  return card ? rateCardKey(card) : ""
}

export function rateCardSelectLabel(card: RateCardRow) {
  return `${card.roomType} · ${normalizeMealPlan(card.mealPlan)} · ${normalizeCurrency(card.currency)}`
}

export function rateCardRatesSummary(card: RateCardRow) {
  return `SGL ${formatRateValue(card.sglRate, card.currency)} · DBL ${formatRateValue(card.dblRate, card.currency)} · TRPL ${formatRateValue(card.trplRate, card.currency)}`
}

export function isPartnerBookingSource(source?: string | null) {
  return source === "travel_agent" || source === "company" || source === "business"
}
