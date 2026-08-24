import type { Prisma } from "@prisma/client"
import { isCountableUnit, locationStocks } from "@/lib/inventory-units"

type Tx = Prisma.TransactionClient

type OrderLine = {
  menuItemId: number | string
  quantity: number | string
  name?: string
}

export async function restoreOrderStock(tx: Tx, orderNumber: string) {
  const sales = await tx.inventoryTransaction.findMany({
    where: {
      referenceType: "order",
      referenceId: orderNumber,
      type: "sale",
    },
  })

  for (const sale of sales) {
    const item = await tx.inventoryItem.findUnique({
      where: { id: sale.inventoryItemId },
    })
    if (!item) continue

    const qty = Math.abs(sale.quantity)
    const nextBar = (item.barStock || 0) + qty
    await tx.inventoryItem.update({
      where: { id: item.id },
      data: {
        barStock: nextBar,
        currentStock: (item.storeStock || 0) + nextBar,
      },
    })
  }

  if (sales.length > 0) {
    await tx.inventoryTransaction.deleteMany({
      where: { id: { in: sales.map((sale) => sale.id) } },
    })
  }
}

export async function deductOrderStock(tx: Tx, orderNumber: string, items: OrderLine[]) {
  const alreadyDeducted = await tx.inventoryTransaction.count({
    where: {
      referenceType: "order",
      referenceId: orderNumber,
      type: "sale",
    },
  })
  if (alreadyDeducted > 0) return

  for (const line of items || []) {
    const menuItemId = parseInt(String(line.menuItemId))
    const qty = parseInt(String(line.quantity)) || 0
    if (!menuItemId || qty <= 0) continue

    const inventory = await tx.inventoryItem.findFirst({
      where: { menuItemId },
    })
    if (!inventory || !isCountableUnit(inventory.unit)) continue

    const stocks = locationStocks(inventory)
    const nextBar = Math.max(0, stocks.barStock - qty)
    const deducted = stocks.barStock - nextBar
    if (deducted <= 0) continue

    await tx.inventoryItem.update({
      where: { id: inventory.id },
      data: {
        barStock: nextBar,
        currentStock: stocks.storeStock + nextBar,
      },
    })

    await tx.inventoryTransaction.create({
      data: {
        inventoryItemId: inventory.id,
        type: "sale",
        quantity: -deducted,
        unitPrice: inventory.unitPrice,
        totalCost: deducted * inventory.unitPrice,
        referenceType: "order",
        referenceId: orderNumber,
        notes: `RMS sale: ${qty}x ${line.name || inventory.name}`,
        performedBy: "admin",
      },
    })
  }
}

export async function syncOrderStock(tx: Tx, orderNumber: string, items: OrderLine[]) {
  await restoreOrderStock(tx, orderNumber)
  await deductOrderStock(tx, orderNumber, items)
}
