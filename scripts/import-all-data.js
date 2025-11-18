const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function importAllData(backupFile) {
  console.log('📥 Importing data to PostgreSQL...\n')
  
  const backupPath = path.join(__dirname, '..', backupFile)
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
  
  const results = {
    success: [],
    failed: []
  }

  try {
    // Import in correct order (respecting foreign keys)
    const importOrder = [
      { name: 'siteSettings', data: backup.data.siteSettings },
      { name: 'heroSettings', data: backup.data.heroSettings },
      { name: 'room', data: backup.data.room },
      { name: 'roomInventory', data: backup.data.roomInventory },
      { name: 'booking', data: backup.data.booking },
      { name: 'galleryItem', data: backup.data.galleryItem },
      { name: 'restaurantMenuItem', data: backup.data.restaurantMenuItem },
      { name: 'restaurantOrder', data: backup.data.restaurantOrder },
      { name: 'accountTransaction', data: backup.data.accountTransaction },
      { name: 'creditAccount', data: backup.data.creditAccount },
      { name: 'user', data: backup.data.user }
    ]

    for (const { name, data } of importOrder) {
      if (!data || data.length === 0) {
        console.log(`⏭️  ${name}: Skipped (no data)`)
        continue
      }

      try {
        // Delete existing data first (for clean import)
        await prisma[name].deleteMany()
        
        // Import records
        for (const record of data) {
          await prisma[name].create({ data: record })
        }
        
        console.log(`✅ ${name}: Imported ${data.length} records`)
        results.success.push({ table: name, count: data.length })
      } catch (error) {
        console.error(`❌ ${name}: Failed -`, error.message)
        results.failed.push({ table: name, error: error.message })
      }
    }

    console.log(`\n📊 IMPORT SUMMARY:`)
    console.log(`   ✅ Success: ${results.success.length} tables`)
    console.log(`   ❌ Failed: ${results.failed.length} tables\n`)

    if (results.success.length > 0) {
      console.log(`   Imported tables:`)
      results.success.forEach(({ table, count }) => {
        console.log(`      ${table}: ${count} records`)
      })
    }

    if (results.failed.length > 0) {
      console.log(`\n   ⚠️  Failed tables:`)
      results.failed.forEach(({ table, error }) => {
        console.log(`      ${table}: ${error}`)
      })
    }

    // Verify counts
    console.log(`\n🔍 VERIFICATION:`)
    const totalExpected = backup.data.room.length + 
                         backup.data.roomInventory.length +
                         backup.data.booking.length +
                         backup.data.restaurantOrder.length +
                         backup.data.accountTransaction.length +
                         backup.data.galleryItem.length +
                         backup.data.siteSettings.length +
                         backup.data.heroSettings.length +
                         backup.data.restaurantMenuItem.length

    const totalImported = results.success.reduce((sum, { count }) => sum + count, 0)

    console.log(`   Expected: ${totalExpected} records`)
    console.log(`   Imported: ${totalImported} records`)
    
    if (totalExpected === totalImported) {
      console.log(`   ✅ COUNTS MATCH! Migration successful!\n`)
    } else {
      console.log(`   ⚠️  Count mismatch! Please review.\n`)
    }

  } catch (error) {
    console.error('❌ Import failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Get backup file from command line or use latest
const backupFile = process.argv[2] || 'backups/backup-1763488258969.json'

importAllData(backupFile)
  .then(() => {
    console.log('✅ Import complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Import failed:', error)
    process.exit(1)
  })

