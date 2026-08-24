export const MEAL_PLANS = [
  { value: "EP", label: "EP — European Plan (Room only)" },
  { value: "CP", label: "CP — Continental Plan (Room + continental breakfast)" },
  { value: "BB", label: "BB — Bed & Breakfast" },
  { value: "MAP", label: "MAP — Modified American Plan (Breakfast + dinner or lunch)" },
  { value: "AP", label: "AP — American Plan (Breakfast, lunch & dinner)" },
  { value: "AI", label: "AI — All Inclusive" },
] as const

export const OCCUPANCY_TYPES = [
  { value: "SGL", label: "SGL — Single" },
  { value: "DBL", label: "DBL — Double" },
  { value: "TRPL", label: "TRPL — Triple" },
] as const

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
