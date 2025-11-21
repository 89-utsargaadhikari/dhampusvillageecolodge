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

  // Create sample rooms
  const rooms = [
    {
      name: 'Deluxe Room',
      price: '5000',
      description: 'Spacious room with mountain views and modern amenities',
      capacity: 2,
      status: 'Available',
      features: JSON.stringify(['King Bed', 'Mountain View', 'WiFi', 'Hot Shower']),
      rating: 4.5,
      image: '/elegant-room-interior-nepal.jpg',
    },
    {
      name: 'Luxury Suite',
      price: '8000',
      description: 'Premium suite with panoramic Annapurna views',
      capacity: 3,
      status: 'Available',
      features: JSON.stringify(['King Bed', 'Annapurna View', 'WiFi', 'Balcony', 'Mini Bar']),
      rating: 5.0,
      image: '/luxury-suite-annapurna-view-nepal.jpg',
    },
    {
      name: 'Standard Room',
      price: '3500',
      description: 'Comfortable room with essential amenities',
      capacity: 2,
      status: 'Available',
      features: JSON.stringify(['Double Bed', 'WiFi', 'Hot Shower']),
      rating: 4.0,
      image: '/cottage-style-mountain-lodge-nepal.jpg',
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

