import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create default site settings
  const siteSettings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      siteName: 'Dhampus Eco Lodge',
      logo: null,
    },
  })
  console.log('✓ Site settings created')

  // Create default hero settings
  const heroSettings = await prisma.heroSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      backgroundType: 'image',
      backgroundUrl: '/luxury-mountain-lodge.jpg',
      title: 'Welcome to Dhampus Eco Lodge',
      subtitle: 'Experience luxury in the heart of the Himalayas',
    },
  })
  console.log('✓ Hero settings created')

  const rooms = [
    {
      name: 'Standard Room',
      price: '0',
      description: 'Standard room',
      capacity: 2,
      status: 'Available',
      features: JSON.stringify(['Standard Room']),
      rating: 0,
      image: '/placeholder.svg',
    },
    {
      name: 'Deluxe Room',
      price: '0',
      description: 'Deluxe room',
      capacity: 2,
      status: 'Available',
      features: JSON.stringify(['Deluxe Room']),
      rating: 0,
      image: '/placeholder.svg',
    },
  ]

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { name: room.name },
      update: room,
      create: room,
    })
  }
  console.log('✓ Rooms created')

  // Create sample gallery items
  const galleryItems = [
    {
      image: '/luxury-mountain-lodge-exterior.jpg',
      title: 'Lodge Exterior',
      category: 'exterior',
      order: 1,
    },
    {
      image: '/luxury-mountain-lodge-interior-dining.jpg',
      title: 'Dining Area',
      category: 'interior',
      order: 2,
    },
    {
      image: '/garden-terrace.jpg',
      title: 'Garden Terrace',
      category: 'facilities',
      order: 3,
    },
    {
      image: '/mountain-view-dining-experience.jpg',
      title: 'Mountain View Dining',
      category: 'dining',
      order: 4,
    },
  ]

  for (const item of galleryItems) {
    await prisma.galleryItem.create({
      data: item,
    })
  }
  console.log('✓ Gallery items created')

  // Create default admin user (password: admin123)
  const hashedPassword = 'admin123' // In production, this should be properly hashed
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    },
  })
  console.log('✓ Admin user created (username: admin, password: admin123)')

  console.log('✅ Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })




