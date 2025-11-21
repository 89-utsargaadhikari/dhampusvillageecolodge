import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const results: any = {
      restaurant: { menu: 0, orders: 0 },
      accounts: { transactions: 0 },
      errors: []
    }

    // Migrate Restaurant Menu
    if (body.restaurantMenu && Array.isArray(body.restaurantMenu)) {
      for (const item of body.restaurantMenu) {
        try {
          await prisma.restaurantMenuItem.create({
            data: {
              name: item.name,
              price: parseFloat(item.price),
              category: item.category,
              stock: item.stock !== undefined ? (item.stock === null ? null : parseInt(item.stock)) : null,
              minStock: item.minStock !== undefined ? (item.minStock === null ? null : parseInt(item.minStock)) : null,
            }
          })
          results.restaurant.menu++
        } catch (error) {
          results.errors.push(`Menu item "${item.name}": ${error}`)
        }
      }
    }

    // Migrate Restaurant Orders
    if (body.restaurantOrders && Array.isArray(body.restaurantOrders)) {
      for (const order of body.restaurantOrders) {
        try {
          await prisma.restaurantOrder.create({
            data: {
              orderNumber: order.orderNumber,
              roomNumber: order.roomNumber,
              guestName: order.guestName,
              subtotal: parseFloat(order.subtotal || 0),
              tax: parseFloat(order.tax || 0),
              taxPercentage: parseFloat(order.taxPercentage || 13),
              total: parseFloat(order.total),
              status: order.status || 'pending',
              items: {
                create: order.items.map((item: any) => ({
                  menuItemId: item.menuItemId,
                  quantity: item.quantity,
                  price: parseFloat(item.price)
                }))
              }
            }
          })
          results.restaurant.orders++
        } catch (error) {
          results.errors.push(`Order "${order.orderNumber}": ${error}`)
        }
      }
    }

    // Migrate Account Transactions
    if (body.accountTransactions && Array.isArray(body.accountTransactions)) {
      for (const txn of body.accountTransactions) {
        try {
          await prisma.accountTransaction.create({
            data: {
              date: new Date(txn.date),
              type: txn.type,
              category: txn.category,
              description: txn.description,
              amount: parseFloat(txn.amount),
              currency: txn.currency || 'NPR',
              paymentMethod: txn.paymentMethod
            }
          })
          results.accounts.transactions++
        } catch (error) {
          results.errors.push(`Transaction: ${error}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Data migration completed',
      results
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

