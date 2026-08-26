export const DEFAULT_VAT_PERCENT = 13

export interface InclusiveTotals {
  inclusiveSubtotal: number
  exclusiveAmount: number
  discountAmount: number
  discountedExclusive: number
  vatAmount: number
  total: number
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function exclusiveFromInclusive(inclusive: number, vatPercent = DEFAULT_VAT_PERCENT) {
  const safeInclusive = Math.max(0, inclusive || 0)
  if (vatPercent <= 0) return safeInclusive
  return safeInclusive / (1 + vatPercent / 100)
}

export function requestedDiscountAmount(options: {
  exclusiveAmount: number
  discountType?: "percentage" | "amount" | string | null
  discountValue?: number | null
}) {
  if ((options.discountValue || 0) <= 0) return 0
  if (options.discountType === "amount") return options.discountValue || 0
  return (options.exclusiveAmount * (options.discountValue || 0)) / 100
}

export function isDiscountTooLarge(options: {
  inclusiveSubtotal: number
  vatPercent?: number
  discountType?: "percentage" | "amount" | string | null
  discountValue?: number | null
}) {
  const exclusiveAmount = exclusiveFromInclusive(options.inclusiveSubtotal, options.vatPercent ?? DEFAULT_VAT_PERCENT)
  return requestedDiscountAmount({
    exclusiveAmount,
    discountType: options.discountType,
    discountValue: options.discountValue,
  }) > exclusiveAmount + 0.001
}

export function orderInclusiveSubtotal(order: { subtotal?: number | null; total?: number | null }) {
  if (typeof order.subtotal === "number" && Number.isFinite(order.subtotal)) return order.subtotal
  return order.total || 0
}

export function referencedVatPercent(orders: { taxPercentage?: number | null }[]) {
  const referenced = orders.find((order) => (order.taxPercentage ?? 0) > 0)
  return referenced?.taxPercentage ?? DEFAULT_VAT_PERCENT
}

/** Menu prices are VAT-inclusive. Discount applies to the exclusive amount. */
export function calculateInclusiveVat(options: {
  inclusiveSubtotal: number
  vatPercent?: number
  discountType?: "percentage" | "amount" | string | null
  discountValue?: number | null
}): InclusiveTotals {
  const inclusiveSubtotal = Math.max(0, options.inclusiveSubtotal || 0)
  const vatPercent = options.vatPercent ?? DEFAULT_VAT_PERCENT
  const exclusiveAmount = exclusiveFromInclusive(inclusiveSubtotal, vatPercent)
  const discountAmount = requestedDiscountAmount({
    exclusiveAmount,
    discountType: options.discountType,
    discountValue: options.discountValue,
  })

  const discountedExclusive = Math.max(0, exclusiveAmount - discountAmount)
  const vatAmount = discountedExclusive * (Math.max(0, vatPercent) / 100)
  const total = discountedExclusive + vatAmount

  return {
    inclusiveSubtotal: roundMoney(inclusiveSubtotal),
    exclusiveAmount: roundMoney(exclusiveAmount),
    discountAmount: roundMoney(Math.min(discountAmount, exclusiveAmount)),
    discountedExclusive: roundMoney(discountedExclusive),
    vatAmount: roundMoney(vatAmount),
    total: roundMoney(total),
  }
}
