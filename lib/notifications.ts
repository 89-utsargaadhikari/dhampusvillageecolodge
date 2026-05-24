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

const sendWhatsAppCopy = async (
  type: Notification["type"],
  title: string,
  message: string,
  priority: Notification["priority"],
) => {
  if (typeof window === "undefined") return

  try {
    await fetch("/api/notifications/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, message, priority }),
      keepalive: true,
    })
  } catch (error) {
    // Don't block normal notifications if WhatsApp delivery fails.
    console.error("WhatsApp notification failed:", error)
  }
}

// Get all notifications
export const getNotifications = (): Notification[] => {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  
  try {
    const notifications = JSON.parse(stored)
    
    // FIX: Remove duplicate IDs and regenerate unique IDs for old notifications
    const seenIds = new Set<string>()
    const fixedNotifications = notifications.map((n: Notification) => {
      // If ID already seen or doesn't have the new format (timestamp-random), regenerate it
      if (seenIds.has(n.id) || !n.id.includes('-')) {
        const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        seenIds.add(newId)
        return { ...n, id: newId }
      }
      seenIds.add(n.id)
      return n
    })
    
    // Save fixed notifications back to localStorage
    if (fixedNotifications.length !== notifications.length || 
        fixedNotifications.some((n: Notification, i: number) => n.id !== notifications[i].id)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fixedNotifications))
      console.log('✅ Fixed duplicate notification IDs')
    }
    
    return fixedNotifications
  } catch (error) {
    console.error('Failed to parse notifications:', error)
    return []
  }
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
  
  // Generate UNIQUE ID using timestamp + random string
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  
  const newNotification: Notification = {
    id: uniqueId,
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

  void sendWhatsAppCopy(type, title, message, priority)
  
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
export const checkAndNotify = async (): Promise<void> => {
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
  
  // Check inventory alerts from API
  try {
    const response = await fetch("/api/inventory/check-alerts")
    if (response.ok) {
      const alerts = await response.json()
      const existingNotifications = getNotifications()
      
      // Critical stock alerts (including expired items)
      if (alerts.critical && alerts.critical.length > 0) {
        const hasCriticalNotification = existingNotifications.some(
          n => n.type === "inventory" && n.priority === "high" && n.message.includes("critical")
        )
        
        if (!hasCriticalNotification) {
          const criticalItems = alerts.critical.map((item: any) => 
            item.type === 'expired' ? `${item.name} (expired)` : item.name
          ).join(", ")
          
          addNotification(
            "inventory",
            "🔴 Critical Inventory Alert",
            `${alerts.critical.length} item(s) critically low or expired: ${criticalItems}`,
            "high"
          )
        }
      }
      
      // Low stock alerts
      if (alerts.low && alerts.low.length > 0) {
        const hasLowNotification = existingNotifications.some(
          n => n.type === "inventory" && n.priority === "medium" && n.message.includes("running low")
        )
        
        if (!hasLowNotification) {
          const lowItems = alerts.low.map((item: any) => item.name).slice(0, 3).join(", ")
          addNotification(
            "inventory",
            "🟠 Low Stock Alert",
            `${alerts.low.length} item(s) running low: ${lowItems}${alerts.low.length > 3 ? '...' : ''}`,
            "medium"
          )
        }
      }
      
      // Expiring soon alerts
      if (alerts.expiring && alerts.expiring.length > 0) {
        const hasExpiryNotification = existingNotifications.some(
          n => n.type === "inventory" && n.message.includes("expiring soon")
        )
        
        if (!hasExpiryNotification) {
          const expiringItems = alerts.expiring.map((item: any) => 
            `${item.name} (${item.daysUntilExpiry} days)`
          ).slice(0, 2).join(", ")
          
          addNotification(
            "inventory",
            "⏰ Items Expiring Soon",
            `${alerts.expiring.length} item(s) expiring soon: ${expiringItems}${alerts.expiring.length > 2 ? '...' : ''}`,
            "medium"
          )
        }
      }
    }
  } catch (error) {
    console.error("Failed to check inventory alerts:", error)
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


