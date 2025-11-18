// Notification Management System

export interface Notification {
  id: string
  type: "booking" | "order" | "inventory" | "checkout" | "payment" | "info"
  title: string
  message: string
  timestamp: string
  read: boolean
  link?: string // Optional link to related page
  priority: "low" | "medium" | "high"
}

const STORAGE_KEY = "admin_notifications"

// Get all notifications
export const getNotifications = (): Notification[] => {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

// Save notifications
const saveNotifications = (notifications: Notification[]): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
}

// Add new notification
export const addNotification = (
  type: Notification["type"],
  title: string,
  message: string,
  priority: Notification["priority"] = "medium",
  link?: string
): void => {
  const notifications = getNotifications()
  const newNotification: Notification = {
    id: Date.now().toString(),
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false,
    link,
    priority
  }
  
  // Add to beginning of array (newest first)
  notifications.unshift(newNotification)
  
  // Keep only last 50 notifications
  if (notifications.length > 50) {
    notifications.splice(50)
  }
  
  saveNotifications(notifications)
  
  // Dispatch custom event for real-time updates
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("notificationAdded"))
  }
}

// Mark notification as read
export const markAsRead = (id: string): void => {
  const notifications = getNotifications()
  const notification = notifications.find(n => n.id === id)
  if (notification) {
    notification.read = true
    saveNotifications(notifications)
    window.dispatchEvent(new Event("notificationRead"))
  }
}

// Mark all as read
export const markAllAsRead = (): void => {
  const notifications = getNotifications()
  notifications.forEach(n => n.read = true)
  saveNotifications(notifications)
  window.dispatchEvent(new Event("notificationRead"))
}

// Delete notification
export const deleteNotification = (id: string): void => {
  const notifications = getNotifications()
  const filtered = notifications.filter(n => n.id !== id)
  saveNotifications(filtered)
  window.dispatchEvent(new Event("notificationDeleted"))
}

// Clear all notifications
export const clearAllNotifications = (): void => {
  saveNotifications([])
  window.dispatchEvent(new Event("notificationDeleted"))
}

// Get unread count
export const getUnreadCount = (): number => {
  return getNotifications().filter(n => !n.read).length
}

// Auto-generate notifications based on system events
export const checkAndNotify = (): void => {
  if (typeof window === "undefined") return
  
  // Check for new bookings
  const bookings = JSON.parse(localStorage.getItem("hotel_bookings") || "[]")
  const pendingBookings = bookings.filter((b: any) => b.status === "Pending")
  
  if (pendingBookings.length > 0) {
    const existingNotifications = getNotifications()
    const hasPendingNotification = existingNotifications.some(
      n => n.type === "booking" && n.message.includes("pending approval")
    )
    
    if (!hasPendingNotification && pendingBookings.length > 0) {
      addNotification(
        "booking",
        "Pending Bookings",
        `${pendingBookings.length} booking(s) pending approval`,
        "high",
        "bookings"
      )
    }
  }
  
  // Check for low stock
  const menuItems = JSON.parse(localStorage.getItem("restaurant_menu") || "[]")
  const lowStockItems = menuItems.filter(
    (item: any) => item.category === "bar" && item.stock <= item.minStock
  )
  
  if (lowStockItems.length > 0) {
    const existingNotifications = getNotifications()
    const hasStockNotification = existingNotifications.some(
      n => n.type === "inventory" && n.message.includes("low stock")
    )
    
    if (!hasStockNotification) {
      addNotification(
        "inventory",
        "Low Stock Alert",
        `${lowStockItems.length} item(s) need restocking`,
        "high",
        "restaurant"
      )
    }
  }
  
  // Check for today's checkouts
  const today = new Date().toISOString().split("T")[0]
  const todayCheckouts = bookings.filter(
    (b: any) => b.status === "Confirmed" && b.checkout === today
  )
  
  if (todayCheckouts.length > 0) {
    const existingNotifications = getNotifications()
    const hasCheckoutNotification = existingNotifications.some(
      n => n.type === "checkout" && n.message.includes("checking out today")
    )
    
    if (!hasCheckoutNotification) {
      addNotification(
        "checkout",
        "Checkouts Today",
        `${todayCheckouts.length} guest(s) checking out today`,
        "medium",
        "billing"
      )
    }
  }
}


