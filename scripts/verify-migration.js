const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyMigration() {
  console.log('\n🔍 VERIFYING POSTGRESQL MIGRATION\n')
  
  const results = {
    success: true,
    tables: []
  }

  try {
    // Check all tables
    const tables = [
      { name: 'Room', expected: 1 },
      { name: 'RoomInventory', expected: 4 },
      { name: 'Booking', expected: 4 },
      { name: 'SiteSettings', expected: 1 },
      { name: 'HeroSettings', expected: 1 },
      { name: 'GalleryItem', expected: 2 },
      { name: 'RestaurantMenuItem', expected: 1 },
      { name: 'RestaurantOrder', expected: 3 },
      { name: 'AccountTransaction', expected: 41 }
    ]

    for (const { name, expected } of tables) {
      const count = await prisma[name.charAt(0).toLowerCase() + name.slice(1)].count()
      const match = count === expected
      
      console.log(`${match ? '✅' : '❌'} ${name}: ${count} / ${expected} records`)
      
      results.tables.push({ name, count, expected, match })
      
      if (!match) results.success = false
    }

    // Check sample data integrity
    console.log('\n📊 SAMPLE DATA CHECK:\n')
    
    const sampleBooking = await prisma.booking.findFirst()
    console.log(`✅ Booking: ${sampleBooking?.guest} - Room ${sampleBooking?.roomNumber}`)
    
    const sampleOrder = await prisma.restaurantOrder.findFirst({ include: { items: true } })
    console.log(`✅ Restaurant Order: ${sampleOrder?.orderNumber} - ${sampleOrder?.items?.length} items`)
    
    const transactionCount = await prisma.accountTransaction.count()
    console.log(`✅ Transactions: ${transactionCount} records`)

    console.log('\n' + '='.repeat(50))
    if (results.success) {
      console.log('✅ MIGRATION VERIFIED! All data intact!')
    } else {
      console.log('⚠️  WARNING: Some data counts don\'t match!')
    }
    console.log('='.repeat(50) + '\n')

    return results

  } catch (error) {
    console.error('❌ Verification failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

verifyMigration()
  .then((results) => {
    process.exit(results.success ? 0 : 1)
  })
  .catch(() => {
    process.exit(1)
  })

