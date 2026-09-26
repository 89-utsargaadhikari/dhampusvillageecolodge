import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateInclusiveVat, orderInclusiveSubtotal } from '@/lib/vat'

const EPSILON = 0.01

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { groupKey, splits } = body as {
      groupKey: string
      splits: { billSplitId: number; paymentStatus: 'paid' | 'credit'; paymentMethod: string | null }[]
    }

    if (!groupKey || !Array.isArray(splits) || splits.length === 0) {
      return NextResponse.json({ error: 'groupKey and splits are required' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const summaries: any[] = []
      const finalizedSplits: { split: any; entry: (typeof splits)[number] }[] = []

      for (const entry of splits) {
        const split = await tx.billSplit.findUnique({
          where: { id: entry.billSplitId },
          include: { allocations: true },
        })
        if (!split || split.groupKey !== groupKey) {
          throw new Error(`Bill split ${entry.billSplitId} not found in this group`)
        }
        finalizedSplits.push({ split, entry })

        const inclusiveSubtotal = split.allocations.reduce((sum, a) => sum + a.amount, 0)
        const totals = calculateInclusiveVat({
          inclusiveSubtotal,
          vatPercent: split.vatPercent ?? 13,
          discountType: split.discountType as any,
          discountValue: split.discountValue ?? 0,
        })

        await tx.billSplit.update({
          where: { id: split.id },
          data: {
            paymentStatus: entry.paymentStatus,
            paymentMethod: entry.paymentStatus === 'paid' ? entry.paymentMethod : 'credit',
            status: 'checked_out',
            checkedOutAt: new Date(),
          },
        })

        const roomBookingId = split.allocations.find((a) => a.sourceType === 'room')?.bookingId || null

        if (entry.paymentStatus === 'paid') {
          await tx.accountTransaction.create({
            data: {
              date: new Date().toISOString().split('T')[0],
              dateAD: new Date(),
              type: 'income',
              category: 'split_bill',
              description: `Split bill "${split.label}" (${groupKey})`,
              amount: totals.total,
              currency: 'NPR',
              paymentMethod: entry.paymentMethod || 'cash',
              partyName: split.payerName || split.label,
              referenceType: 'bill_split',
              referenceId: split.id,
            },
          })
        } else {
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 30)
          await tx.creditAccount.create({
            data: {
              guestName: split.payerName || split.label,
              guestEmail: split.payerEmail || null,
              guestPhone: split.payerPhone || 'N/A',
              creditAmount: totals.total,
              paidAmount: 0,
              outstandingBalance: totals.total,
              creditDate: new Date(),
              dueDate,
              status: 'unpaid',
              bookingId: roomBookingId,
              businessId: split.businessId || null,
              notes: `Split bill "${split.label}" (${groupKey})`,
            },
          })
        }

        summaries.push({ billSplitId: split.id, label: split.label, total: totals.total, paymentStatus: entry.paymentStatus })
      }

      // Resolve per-order payment status: "paid"/"credit" if every allocation for that
      // order is now checked out with the same outcome, "split" if outcomes differ,
      // or left unchanged if the order still has unresolved/unallocated portions.
      const finalizedSplitIds = new Set(splits.map((s) => s.billSplitId))
      const touchedOrderIds = new Set<number>()
      const touchedBookingIds = new Set<number>()
      for (const { split } of finalizedSplits) {
        for (const allocation of split.allocations) {
          if (allocation.sourceType === 'order' && allocation.orderId) touchedOrderIds.add(allocation.orderId)
          if (allocation.sourceType === 'room' && allocation.bookingId) touchedBookingIds.add(allocation.bookingId)
        }
      }

      for (const orderId of touchedOrderIds) {
        const order = await tx.restaurantOrder.findUnique({ where: { id: orderId } })
        if (!order) continue
        const allAllocations = await tx.billSplitAllocation.findMany({
          where: { sourceType: 'order', orderId },
          include: { billSplit: true },
        })
        const allocatedTotal = allAllocations.reduce((sum, a) => sum + a.amount, 0)
        const orderTotal = orderInclusiveSubtotal(order)
        if (allocatedTotal < orderTotal - EPSILON) continue // part of this order was never split off

        const allResolved = allAllocations.every(
          (a) => a.billSplit.status === 'checked_out' || finalizedSplitIds.has(a.billSplitId)
        )
        if (!allResolved) continue

        const outcomes = new Set(
          allAllocations.map((a) =>
            finalizedSplitIds.has(a.billSplitId)
              ? splits.find((s) => s.billSplitId === a.billSplitId)!.paymentStatus
              : a.billSplit.paymentStatus
          )
        )
        const nextStatus = outcomes.size === 1 ? Array.from(outcomes)[0] : 'split'
        await tx.restaurantOrder.update({ where: { id: orderId }, data: { paymentStatus: nextStatus } })
      }

      for (const bookingId of touchedBookingIds) {
        const booking = await tx.booking.findUnique({ where: { id: bookingId } })
        if (!booking) continue
        const allAllocations = await tx.billSplitAllocation.findMany({
          where: { sourceType: 'room', bookingId },
          include: { billSplit: true },
        })
        const allocatedTotal = allAllocations.reduce((sum, a) => sum + a.amount, 0)
        const roomTotal = parseFloat(booking.price) || 0
        if (allocatedTotal < roomTotal - EPSILON) continue // room isn't fully split yet

        const allResolved = allAllocations.every(
          (a) => a.billSplit.status === 'checked_out' || finalizedSplitIds.has(a.billSplitId)
        )
        if (!allResolved) continue

        await tx.booking.update({ where: { id: bookingId }, data: { status: 'Checked Out' } })
      }

      return summaries
    }, { timeout: 20000 })

    return NextResponse.json({ summaries: result })
  } catch (error: any) {
    console.error('Failed to complete split checkout:', error)
    return NextResponse.json({ error: error.message || 'Failed to complete split checkout' }, { status: 400 })
  }
}
