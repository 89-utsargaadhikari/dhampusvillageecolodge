export const DEFAULT_VAT_PERCENT = 13

export interface InclusiveTotals {
  inclusiveSubtotal: number
  exclusiveAmount: number
  discountAmount: number
  discountedExclusive: number
  vatAmount: number
  total: number
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
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
  const divisor = 1 + vatPercent / 100
  const exclusiveAmount = vatPercent > 0 ? inclusiveSubtotal / divisor : inclusiveSubtotal

  let discountAmount = 0
  if ((options.discountValue || 0) > 0) {
    discountAmount =
      options.discountType === "amount"
        ? options.discountValue || 0
        : (exclusiveAmount * (options.discountValue || 0)) / 100
  }

  const discountedExclusive = Math.max(0, exclusiveAmount - discountAmount)
  const vatAmount = discountedExclusive * (vatPercent / 100)
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
