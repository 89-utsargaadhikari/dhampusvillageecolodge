const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function exportAllData() {
  console.log('🔍 Exporting all data from SQLite database...\n')
  
  const backup = {
    timestamp: new Date().toISOString(),
    data: {}
  }

  try {
    // Export all tables
    const tables = [
      'room',
      'roomInventory', 
      'booking',
      'siteSettings',
      'heroSettings',
      'galleryItem',
      'restaurantMenuItem',
      'restaurantOrder',
      'accountTransaction',
      'creditAccount',
      'user'
    ]

    for (const table of tables) {
      try {
        const data = await prisma[table].findMany()
        backup.data[table] = data
        console.log(`✅ ${table}: ${data.length} records`)
      } catch (error) {
        console.log(`⚠️  ${table}: Table doesn't exist or is empty`)
        backup.data[table] = []
      }
    }

    // Save to file
    const backupDir = path.join(__dirname, '../backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const filename = `backup-${Date.now()}.json`
    const filepath = path.join(backupDir, filename)
    
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2))
    
    console.log(`\n✅ Backup saved: ${filepath}`)
    console.log(`\n📊 TOTAL RECORDS:`)
    
    let total = 0
    Object.entries(backup.data).forEach(([table, records]) => {
      if (records.length > 0) {
        console.log(`   ${table}: ${records.length}`)
        total += records.length
      }
    })
    
    console.log(`\n   TOTAL: ${total} records\n`)
    
    return filepath
  } catch (error) {
    console.error('❌ Export failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

exportAllData()
  .then((filepath) => {
    console.log('✅ Export complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Export failed:', error)
    process.exit(1)
  })

