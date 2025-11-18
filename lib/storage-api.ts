// NEW Storage Layer - Uses Database API instead of localStorage
// Drop-in replacement for lib/storage.ts

export interface Room {
  id: number
  name: string
  price: string
  description: string
  capacity: number
  status: "Available" | "Booked"
  features: string[]
  rating: number
  image: string
  roomNumbers?: string[]
}

export interface Booking {
  id: number
  guest: string
  email?: string
  phone?: string
  room: string
  roomNumber?: string
  checkin: string
  checkout: string
  price: string
  status: "Pending" | "Confirmed" | "Cancelled" | "Checked Out"
  bookingSource?: "website" | "phone" | "walkin"
}

export interface RoomInventoryItem {
  roomNumber: string
  roomType: string
  roomTypeId: number
  floor?: string
  notes?: string
}

export interface GalleryItem {
  id: number
  image: string
  title: string
  category?: string
  order?: number
}

export interface HeroSettings {
  backgroundType: "image" | "video"
  backgroundUrl?: string
  title: string
  subtitle: string
}

export interface SiteSettings {
  logo?: string
  siteName: string
}

// ============================================
// ROOMS
// ============================================

export const getRooms = async (): Promise<Room[]> => {
  const res = await fetch('/api/rooms')
  if (!res.ok) return []
  return res.json()
}

export const addRoom = async (room: Omit<Room, 'id'>): Promise<Room> => {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(room)
  })
  if (!res.ok) throw new Error('Failed to add room')
  return res.json()
}

export const updateRoom = async (id: number, room: Partial<Room>): Promise<Room> => {
  const res = await fetch(`/api/rooms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(room)
  })
  if (!res.ok) throw new Error('Failed to update room')
  return res.json()
}

export const deleteRoom = async (id: number): Promise<void> => {
  const res = await fetch(`/api/rooms/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete room')
}

// ============================================
// BOOKINGS
// ============================================

export const getBookings = async (): Promise<Booking[]> => {
  const res = await fetch('/api/bookings')
  if (!res.ok) return []
  return res.json()
}

export const addBooking = async (booking: Omit<Booking, 'id'>): Promise<Booking> => {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  })
  if (!res.ok) throw new Error('Failed to add booking')
  return res.json()
}

export const updateBooking = async (id: number, booking: Partial<Booking>): Promise<Booking> => {
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  })
  if (!res.ok) throw new Error('Failed to update booking')
  return res.json()
}

export const deleteBooking = async (id: number): Promise<void> => {
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete booking')
}

// ============================================
// ROOM INVENTORY
// ============================================

export const getRoomInventory = async (): Promise<RoomInventoryItem[]> => {
  const res = await fetch('/api/room-inventory')
  if (!res.ok) return []
  return res.json()
}

export const saveRoomInventory = async (inventory: RoomInventoryItem[]): Promise<void> => {
  const res = await fetch('/api/room-inventory', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inventory)
  })
  if (!res.ok) throw new Error('Failed to save room inventory')
}

export const deleteRoomInventoryItem = async (roomNumber: string): Promise<void> => {
  const res = await fetch(`/api/room-inventory/${roomNumber}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete room inventory item')
}

// ============================================
// GALLERY
// ============================================

export const getGallery = async (): Promise<GalleryItem[]> => {
  const res = await fetch('/api/gallery')
  if (!res.ok) return []
  return res.json()
}

export const saveGallery = async (gallery: GalleryItem[]): Promise<void> => {
  const res = await fetch('/api/gallery', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gallery)
  })
  if (!res.ok) throw new Error('Failed to save gallery')
}

export const deleteGalleryItem = async (id: number): Promise<void> => {
  const res = await fetch(`/api/gallery/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete gallery item')
}

// ============================================
// SETTINGS
// ============================================

export const getHeroSettings = async (): Promise<HeroSettings> => {
  const res = await fetch('/api/settings/hero')
  if (!res.ok) return { backgroundType: 'image', title: 'Welcome', subtitle: 'Experience luxury' }
  return res.json()
}

export const saveHeroSettings = async (settings: HeroSettings): Promise<void> => {
  const res = await fetch('/api/settings/hero', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  })
  if (!res.ok) throw new Error('Failed to save hero settings')
}

export const getSiteSettings = async (): Promise<SiteSettings> => {
  const res = await fetch('/api/settings/site')
  if (!res.ok) return { siteName: 'Dhampus Eco Lodge' }
  return res.json()
}

export const saveSiteSettings = async (settings: SiteSettings): Promise<void> => {
  const res = await fetch('/api/settings/site', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  })
  if (!res.ok) throw new Error('Failed to save site settings')
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get available room numbers for booking
export const getAvailableRoomNumbers = async (
  roomId: number,
  excludeBookingId?: number,
  checkinDate?: string,
  checkoutDate?: string
): Promise<string[]> => {
  const rooms = await getRooms()
  const bookings = await getBookings()
  const inventory = await getRoomInventory()
  
  const room = rooms.find((r) => r.id === roomId)
  if (!room) return []
  
  // Helper to check if two date ranges overlap
  const datesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const s1 = new Date(start1)
    const e1 = new Date(end1)
    const s2 = new Date(start2)
    const e2 = new Date(end2)
    return s1 <= e2 && s2 <= e1
  }
  
  // Use inventory if available
  if (inventory.length > 0) {
    const inventoryRooms = inventory.filter((item) => item.roomTypeId === roomId)
    const allNumbers = inventoryRooms.map((item) => item.roomNumber)
    
    const occupied = bookings
      .filter((b) => {
        if (b.id === excludeBookingId) return false
        if (b.status === "Cancelled" || b.status === "Checked Out") return false
        if (!b.roomNumber) return false
        if (checkinDate && checkoutDate) {
          return datesOverlap(b.checkin, b.checkout, checkinDate, checkoutDate)
        }
        return b.status === "Confirmed" || b.status === "Pending"
      })
      .map((b) => b.roomNumber)
      .filter(Boolean) as string[]
    
    return allNumbers.filter((num) => !occupied.includes(num))
  }
  
  // Fallback to roomNumbers array
  if (!room.roomNumbers) return []
  
  const occupied = bookings
    .filter((b) => {
      if (b.room !== room.name) return false
      if (b.id === excludeBookingId) return false
      if (b.status === "Cancelled" || b.status === "Checked Out") return false
      if (!b.roomNumber) return false
      if (checkinDate && checkoutDate) {
        return datesOverlap(b.checkin, b.checkout, checkinDate, checkoutDate)
      }
      return b.status === "Confirmed" || b.status === "Pending"
    })
    .map((b) => b.roomNumber)
    .filter(Boolean) as string[]
  
  return room.roomNumbers.filter((num) => !occupied.includes(num))
}

// Image conversion utility (keep for now)
export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        const MAX_WIDTH = 600
        const MAX_HEIGHT = 400
        
        let width = img.width
        let height = img.height
        
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
        ctx?.drawImage(img, 0, 0, width, height)
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5)
        
        if (compressedBase64.length > 200000) {
          alert('Image is too large. Please use a smaller image or an external URL.')
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


