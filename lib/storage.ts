// Data storage utility for admin dashboard
import { addNotification } from "./notifications"

export interface Room {
  id: number
  name: string
  price: string
  image: string
  description: string
  features: string[]
  rating: number
  capacity: number
  status: "Available" | "Booked"
  roomNumbers?: string[] // e.g., ["101", "102", "103"]
}

export interface Booking {
  id: number
  guest: string
  email?: string
  phone?: string
  room: string
  roomNumber?: string // Allocated room number
  checkin: string
  checkout: string
  price: string
  status: "Confirmed" | "Pending" | "Cancelled" | "Checked Out"
  bookingSource?: "website" | "phone" | "walkin" // Track where booking came from
}

export interface GalleryItem {
  id: number
  src: string
  alt: string
  category: string
}

export interface HeroSettings {
  backgroundImage: string
  videoUrl?: string
  title: string
  subtitle: string
}

export interface SiteSettings {
  logoImage: string
  siteName: string
}

// Default data
const defaultRooms: Room[] = [
  {
    id: 1,
    name: "Deluxe Room",
    price: "180",
    image: "/luxury-deluxe-room-mountain-view.jpg",
    description: "Spacious sanctuary with mountain views, marble en-suite, premium linens",
    features: ["Mountain View", "WiFi", "Fireplace", "Rain Shower"],
    rating: 4.8,
    capacity: 2,
    status: "Available",
    roomNumbers: ["101", "102", "103"],
  },
  {
    id: 2,
    name: "Premium Suite",
    price: "280",
    image: "/luxury-suite-annapurna-view-nepal.jpg",
    description: "Our flagship offering with 360° panoramic Annapurna views and private terrace",
    features: ["360° Views", "WiFi", "Fireplace", "Rain Shower"],
    rating: 5.0,
    capacity: 2,
    status: "Booked",
    roomNumbers: ["201", "202"],
  },
  {
    id: 3,
    name: "Mountain Cottage",
    price: "220",
    image: "/cottage-style-mountain-lodge-nepal.jpg",
    description: "Intimate cottages with lush garden views, perfect for romantic escapes",
    features: ["Garden View", "WiFi", "Fireplace", "Rain Shower"],
    rating: 4.9,
    capacity: 3,
    status: "Available",
    roomNumbers: ["301", "302", "303", "304"],
  },
]

const defaultBookings: Booking[] = [
  {
    id: 1,
    guest: "John Smith",
    email: "john@example.com",
    phone: "+1234567890",
    room: "Premium Suite",
    checkin: "2025-01-15",
    checkout: "2025-01-18",
    price: "840",
    status: "Confirmed",
  },
  {
    id: 2,
    guest: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1234567891",
    room: "Deluxe Room",
    checkin: "2025-01-16",
    checkout: "2025-01-20",
    price: "720",
    status: "Confirmed",
  },
  {
    id: 3,
    guest: "Mike Wilson",
    email: "mike@example.com",
    phone: "+1234567892",
    room: "Mountain Cottage",
    checkin: "2025-01-17",
    checkout: "2025-01-19",
    price: "440",
    status: "Pending",
  },
]

const defaultGallery: GalleryItem[] = [
  { id: 1, src: "/luxury-mountain-lodge-exterior.jpg", alt: "Lodge Exterior", category: "Building" },
  { id: 2, src: "/elegant-room-interior-nepal.jpg", alt: "Room Interior", category: "Rooms" },
  { id: 3, src: "/mountain-view-dining-experience.jpg", alt: "Dining", category: "Dining" },
  { id: 4, src: "/garden-terrace-lodge-relaxation.jpg", alt: "Garden Terrace", category: "Amenities" },
  { id: 5, src: "/sunset-annapurna-himalayan-peak.jpg", alt: "Sunset View", category: "Views" },
  { id: 6, src: "/spa-wellness-center-luxury.jpg", alt: "Spa & Wellness", category: "Amenities" },
]

const defaultHeroSettings: HeroSettings = {
  backgroundImage: "/luxury-mountain-lodge.jpg",
  videoUrl: "",
  title: "Dhampus Eco Lodge",
  subtitle: "Experience unparalleled luxury nestled at 1,650 meters, where pristine Himalayan vistas meet sustainable elegance and authentic Nepali hospitality",
}

const defaultSiteSettings: SiteSettings = {
  logoImage: "",
  siteName: "Dhampus Eco Lodge",
}

// Storage keys
const STORAGE_KEYS = {
  ROOMS: "lodge_rooms",
  BOOKINGS: "lodge_bookings",
  GALLERY: "lodge_gallery",
  HERO: "lodge_hero_settings",
  SITE: "lodge_site_settings",
}

// Helper to check if running in browser
const isBrowser = typeof window !== "undefined"

// Rooms Management
export const getRooms = (): Room[] => {
  if (!isBrowser) return defaultRooms
  const stored = localStorage.getItem(STORAGE_KEYS.ROOMS)
  return stored ? JSON.parse(stored) : defaultRooms
}

export const saveRooms = (rooms: Room[]): void => {
  if (isBrowser) {
    try {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms))
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        alert('❌ STORAGE FULL!\n\nGo to Admin → Storage Manager to free up space.\n\nOR use external image URLs instead of uploading.')
        throw e
      }
      throw e
    }
  }
}

export const addRoom = (room: Omit<Room, "id">): Room => {
  const rooms = getRooms()
  const newRoom = { ...room, id: Math.max(...rooms.map((r) => r.id), 0) + 1 }
  saveRooms([...rooms, newRoom])
  return newRoom
}

export const updateRoom = (id: number, updates: Partial<Room>): void => {
  const rooms = getRooms()
  const index = rooms.findIndex((r) => r.id === id)
  if (index !== -1) {
    rooms[index] = { ...rooms[index], ...updates }
    saveRooms(rooms)
  }
}

export const deleteRoom = (id: number): void => {
  const rooms = getRooms()
  saveRooms(rooms.filter((r) => r.id !== id))
}

// Bookings Management
export const getBookings = (): Booking[] => {
  if (!isBrowser) return defaultBookings
  const stored = localStorage.getItem(STORAGE_KEYS.BOOKINGS)
  return stored ? JSON.parse(stored) : defaultBookings
}

export const saveBookings = (bookings: Booking[]): void => {
  if (isBrowser) {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings))
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        alert('❌ STORAGE FULL!\n\nToo many bookings or data is corrupted.')
        throw e
      }
      throw e
    }
  }
}

export const addBooking = (booking: Omit<Booking, "id">): Booking => {
  const bookings = getBookings()
  const newBooking = { ...booking, id: Math.max(...bookings.map((b) => b.id), 0) + 1 }
  saveBookings([...bookings, newBooking])
  
  // Add notification for new booking
  if (booking.bookingSource === "website") {
    addNotification(
      "booking",
      "New Booking Received",
      `New booking from ${booking.guest} - ${booking.room}`,
      "high",
      "bookings"
    )
  }
  
  return newBooking
}

export const updateBooking = (id: number, updates: Partial<Booking>): void => {
  const bookings = getBookings()
  const index = bookings.findIndex((b) => b.id === id)
  if (index !== -1) {
    bookings[index] = { ...bookings[index], ...updates }
    saveBookings(bookings)
  }
}

export const deleteBooking = (id: number): void => {
  const bookings = getBookings()
  saveBookings(bookings.filter((b) => b.id !== id))
}

// Gallery Management
export const getGallery = (): GalleryItem[] => {
  if (!isBrowser) return defaultGallery
  const stored = localStorage.getItem(STORAGE_KEYS.GALLERY)
  return stored ? JSON.parse(stored) : defaultGallery
}

export const saveGallery = (items: GalleryItem[]): void => {
  if (isBrowser) {
    try {
      localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(items))
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        alert('❌ STORAGE FULL!\n\nGo to Admin → Storage Manager to delete old gallery images.\n\nTIP: Use external image URLs instead of uploading.')
        throw e
      }
      throw e
    }
  }
}

export const addGalleryItem = (item: Omit<GalleryItem, "id">): GalleryItem => {
  const gallery = getGallery()
  const newItem = { ...item, id: Math.max(...gallery.map((g) => g.id), 0) + 1 }
  saveGallery([...gallery, newItem])
  return newItem
}

export const deleteGalleryItem = (id: number): void => {
  const gallery = getGallery()
  saveGallery(gallery.filter((g) => g.id !== id))
}

// Hero Settings Management
export const getHeroSettings = (): HeroSettings => {
  if (!isBrowser) return defaultHeroSettings
  const stored = localStorage.getItem(STORAGE_KEYS.HERO)
  return stored ? JSON.parse(stored) : defaultHeroSettings
}

export const saveHeroSettings = (settings: HeroSettings): void => {
  if (isBrowser) {
    try {
      localStorage.setItem(STORAGE_KEYS.HERO, JSON.stringify(settings))
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        alert('❌ STORAGE FULL!\n\nUse an external URL for the hero image instead of uploading.')
        throw e
      }
      throw e
    }
  }
}

// Site Settings Management
export const getSiteSettings = (): SiteSettings => {
  if (!isBrowser) return defaultSiteSettings
  const stored = localStorage.getItem(STORAGE_KEYS.SITE)
  return stored ? JSON.parse(stored) : defaultSiteSettings
}

export const saveSiteSettings = (settings: SiteSettings): void => {
  if (isBrowser) {
    try {
      localStorage.setItem(STORAGE_KEYS.SITE, JSON.stringify(settings))
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        alert('❌ STORAGE FULL!\n\nUse an external URL for the logo instead of uploading.')
        throw e
      }
      throw e
    }
  }
}

// Room Inventory Management (new system)
export interface RoomInventoryItem {
  roomNumber: string
  roomType: string
  roomTypeId: number
  floor?: string
  notes?: string
}

const INVENTORY_KEY = "lodge_room_inventory"

export const getRoomInventory = (): RoomInventoryItem[] => {
  if (!isBrowser) return []
  const stored = localStorage.getItem(INVENTORY_KEY)
  return stored ? JSON.parse(stored) : []
}

export const saveRoomInventory = (items: RoomInventoryItem[]): void => {
  if (isBrowser) {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(items))
  }
}

// Helper to check if two date ranges overlap
const datesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const s1 = new Date(start1)
  const e1 = new Date(end1)
  const s2 = new Date(start2)
  const e2 = new Date(end2)
  
  return s1 <= e2 && s2 <= e1
}

// Get available room numbers for a specific room type (uses new inventory system first, falls back to old)
export const getAvailableRoomNumbers = (
  roomId: number, 
  excludeBookingId?: number,
  checkinDate?: string,
  checkoutDate?: string
): string[] => {
  const bookings = getBookings()
  
  // Get the booking we're editing/creating to find its dates if not provided
  let targetCheckin = checkinDate
  let targetCheckout = checkoutDate
  
  if (!targetCheckin && excludeBookingId) {
    const targetBooking = bookings.find((b) => b.id === excludeBookingId)
    if (targetBooking) {
      targetCheckin = targetBooking.checkin
      targetCheckout = targetBooking.checkout
    }
  }
  
  // Try new inventory system first
  const inventory = getRoomInventory()
  const inventoryRooms = inventory.filter((item) => item.roomTypeId === roomId)
  
  if (inventoryRooms.length > 0) {
    // Use inventory system - filter by date conflicts
    
    const occupiedNumbers = bookings
      .filter((b) => {
        // Exclude this booking, cancelled bookings, and checked out bookings
        if (b.id === excludeBookingId || b.status === "Cancelled" || b.status === "Checked Out") return false
        
        // Only consider bookings with room numbers assigned
        if (!b.roomNumber) return false
        
        // Check if dates overlap (only if we have target dates)
        if (targetCheckin && targetCheckout) {
          return datesOverlap(b.checkin, b.checkout, targetCheckin, targetCheckout)
        }
        
        // If no dates provided, consider all confirmed/pending bookings as occupied
        return b.status === "Confirmed" || b.status === "Pending"
      })
      .map((b) => b.roomNumber)
      .filter(Boolean) as string[]

    const allInventoryNumbers = inventoryRooms.map((item) => item.roomNumber)
    const available = allInventoryNumbers.filter((num) => !occupiedNumbers.includes(num))
    
    return available
  }
  
  // Fallback to old system
  const rooms = getRooms()
  const room = rooms.find((r) => r.id === roomId)
  
  if (!room || !room.roomNumbers) {
    return []
  }

  const occupiedNumbers = bookings
    .filter((b) => {
      // Must be same room type
      if (b.room !== room.name) return false
      
      // Exclude this booking, cancelled bookings, and checked out bookings
      if (b.id === excludeBookingId || b.status === "Cancelled" || b.status === "Checked Out") return false
      
      // Only consider bookings with room numbers assigned
      if (!b.roomNumber) return false
      
      // Check if dates overlap (only if we have target dates)
      if (targetCheckin && targetCheckout) {
        return datesOverlap(b.checkin, b.checkout, targetCheckin, targetCheckout)
      }
      
      // If no dates provided, consider all confirmed/pending bookings as occupied
      return b.status === "Confirmed" || b.status === "Pending"
    })
    .map((b) => b.roomNumber)
    .filter(Boolean) as string[]

  return room.roomNumbers.filter((num) => !occupiedNumbers.includes(num))
}

// Image Upload Helper (converts to base64 for localStorage with AGGRESSIVE compression)
export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Create canvas to compress image
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // SMALLER max dimensions to save more space
        const MAX_WIDTH = 600
        const MAX_HEIGHT = 400
        
        let width = img.width
        let height = img.height
        
        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = height * (MAX_WIDTH / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = width * (MAX_HEIGHT / height)
            height = MAX_HEIGHT
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Convert to base64 with 50% quality (more aggressive)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5)
        
        // Check if still too large (> 200KB)
        if (compressedBase64.length > 200000) {
          alert('Image is too large even after compression. Please use a smaller image or an external URL.')
          reject(new Error('Image too large'))
          return
        }
        
        resolve(compressedBase64)
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

