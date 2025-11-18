// API Helper Functions - Replace localStorage with API calls

// ============================================
// ROOMS
// ============================================

export const fetchRooms = async () => {
  const res = await fetch('/api/rooms')
  if (!res.ok) throw new Error('Failed to fetch rooms')
  return res.json()
}

export const createRoom = async (roomData: any) => {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roomData)
  })
  if (!res.ok) throw new Error('Failed to create room')
  return res.json()
}

export const updateRoom = async (id: number, roomData: any) => {
  const res = await fetch(`/api/rooms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roomData)
  })
  if (!res.ok) throw new Error('Failed to update room')
  return res.json()
}

export const deleteRoom = async (id: number) => {
  const res = await fetch(`/api/rooms/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete room')
  return res.json()
}

// ============================================
// BOOKINGS
// ============================================

export const fetchBookings = async () => {
  const res = await fetch('/api/bookings')
  if (!res.ok) throw new Error('Failed to fetch bookings')
  return res.json()
}

export const createBooking = async (bookingData: any) => {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  })
  if (!res.ok) throw new Error('Failed to create booking')
  return res.json()
}

export const updateBooking = async (id: number, bookingData: any) => {
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  })
  if (!res.ok) throw new Error('Failed to update booking')
  return res.json()
}

export const deleteBooking = async (id: number) => {
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete booking')
  return res.json()
}

// ============================================
// ROOM INVENTORY
// ============================================

export const fetchRoomInventory = async () => {
  const res = await fetch('/api/room-inventory')
  if (!res.ok) throw new Error('Failed to fetch room inventory')
  return res.json()
}

export const createRoomInventoryItem = async (itemData: any) => {
  const res = await fetch('/api/room-inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData)
  })
  if (!res.ok) throw new Error('Failed to create room inventory item')
  return res.json()
}

export const bulkUpdateRoomInventory = async (items: any[]) => {
  const res = await fetch('/api/room-inventory', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items)
  })
  if (!res.ok) throw new Error('Failed to update room inventory')
  return res.json()
}

export const deleteRoomInventoryItem = async (roomNumber: string) => {
  const res = await fetch(`/api/room-inventory/${roomNumber}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete room inventory item')
  return res.json()
}

// ============================================
// GALLERY
// ============================================

export const fetchGallery = async () => {
  const res = await fetch('/api/gallery')
  if (!res.ok) throw new Error('Failed to fetch gallery')
  return res.json()
}

export const createGalleryItem = async (itemData: any) => {
  const res = await fetch('/api/gallery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData)
  })
  if (!res.ok) throw new Error('Failed to create gallery item')
  return res.json()
}

export const deleteGalleryItem = async (id: number) => {
  const res = await fetch(`/api/gallery/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete gallery item')
  return res.json()
}

// ============================================
// SETTINGS
// ============================================

export const fetchHeroSettings = async () => {
  const res = await fetch('/api/settings/hero')
  if (!res.ok) throw new Error('Failed to fetch hero settings')
  return res.json()
}

export const updateHeroSettings = async (settings: any) => {
  const res = await fetch('/api/settings/hero', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  })
  if (!res.ok) throw new Error('Failed to update hero settings')
  return res.json()
}

export const fetchSiteSettings = async () => {
  const res = await fetch('/api/settings/site')
  if (!res.ok) throw new Error('Failed to fetch site settings')
  return res.json()
}

export const updateSiteSettings = async (settings: any) => {
  const res = await fetch('/api/settings/site', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  })
  if (!res.ok) throw new Error('Failed to update site settings')
  return res.json()
}


