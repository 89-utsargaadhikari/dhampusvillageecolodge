export const COUNTABLE_UNITS = [
  "pieces",
  "bottles",
  "boxes",
  "packets",
  "cans",
  "bags",
  "dozen",
] as const

export type CountableUnit = (typeof COUNTABLE_UNITS)[number]

export function isCountableUnit(unit?: string | null) {
  return COUNTABLE_UNITS.includes((unit || "").toLowerCase() as CountableUnit)
}

export function locationStocks(item: {
  storeStock?: number | null
  barStock?: number | null
  currentStock?: number | null
}) {
  let storeStock = Number(item.storeStock || 0)
  let barStock = Number(item.barStock || 0)
  const currentStock = Number(item.currentStock || 0)
  if (storeStock === 0 && barStock === 0 && currentStock > 0) {
    storeStock = currentStock
  }
  return {
    storeStock,
    barStock,
    currentStock: storeStock + barStock,
  }
}
