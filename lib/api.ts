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

// ============================================
// RESTAURANT
// ============================================

export const fetchRestaurantMenu = async () => {
  const res = await fetch('/api/restaurant/menu')
  if (!res.ok) throw new Error('Failed to fetch menu')
  return res.json()
}

export const createMenuItem = async (itemData: any) => {
  const res = await fetch('/api/restaurant/menu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData)
  })
  if (!res.ok) throw new Error('Failed to create menu item')
  return res.json()
}

export const updateMenuItem = async (id: number, itemData: any) => {
  const res = await fetch(`/api/restaurant/menu/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData)
  })
  if (!res.ok) throw new Error('Failed to update menu item')
  return res.json()
}

export const deleteMenuItem = async (id: number) => {
  const res = await fetch(`/api/restaurant/menu/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete menu item')
  return res.json()
}

export const fetchRestaurantOrders = async () => {
  const res = await fetch('/api/restaurant/orders')
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}

export const createRestaurantOrder = async (orderData: any) => {
  const res = await fetch('/api/restaurant/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })
  if (!res.ok) {
    const errorText = await res.text()
    console.error('API Error Response:', errorText)
    throw new Error(`Failed to create order: ${errorText}`)
  }
  return res.json()
}

export const updateRestaurantOrder = async (id: number, orderData: any) => {
  const res = await fetch(`/api/restaurant/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })
  if (!res.ok) throw new Error('Failed to update order')
  return res.json()
}

export const deleteRestaurantOrder = async (id: number) => {
  const res = await fetch(`/api/restaurant/orders/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete order')
  return res.json()
}

// ============================================
// ACCOUNTS (AMS)
// ============================================

export const fetchAccountTransactions = async () => {
  const res = await fetch('/api/accounts/transactions')
  if (!res.ok) throw new Error('Failed to fetch transactions')
  return res.json()
}

export const createAccountTransaction = async (transactionData: any) => {
  const res = await fetch('/api/accounts/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transactionData)
  })
  if (!res.ok) throw new Error('Failed to create transaction')
  return res.json()
}

export const deleteAccountTransaction = async (id: number) => {
  const res = await fetch(`/api/accounts/transactions/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete transaction')
  return res.json()
}

// ============================================
// CREDIT ACCOUNTS
// ============================================

export const fetchCreditAccounts = async () => {
  const res = await fetch('/api/credits')
  if (!res.ok) throw new Error('Failed to fetch credit accounts')
  return res.json()
}

export const createCreditAccount = async (creditData: any) => {
  const res = await fetch('/api/credits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creditData)
  })
  if (!res.ok) throw new Error('Failed to create credit account')
  return res.json()
}

export const updateCreditAccount = async (id: number, creditData: any) => {
  const res = await fetch(`/api/credits/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creditData)
  })
  if (!res.ok) throw new Error('Failed to update credit account')
  return res.json()
}

export const deleteCreditAccount = async (id: number) => {
  const res = await fetch(`/api/credits/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete credit account')
  return res.json()
}

export const addCreditPayment = async (paymentData: any) => {
  const res = await fetch('/api/credits/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  })
  if (!res.ok) throw new Error('Failed to add payment')
  return res.json()
}


