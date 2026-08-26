"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Trash2, X } from "lucide-react"
import { AdminSearch, matchesSearch } from "@/components/admin-search"
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  getUnreadCount,
  type Notification 
} from "@/lib/notifications"

interface NotificationPanelProps {
  onNotificationClick?: (link: string) => void
}

export default function NotificationPanel({ onNotificationClick }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  const loadNotifications = () => {
    setNotifications(getNotifications())
    setUnreadCount(getUnreadCount())
  }

  useEffect(() => {
    loadNotifications()

    // Listen for notification events
    const handleNotificationChange = () => {
      loadNotifications()
    }

    window.addEventListener("notificationAdded", handleNotificationChange)
    window.addEventListener("notificationRead", handleNotificationChange)
    window.addEventListener("notificationDeleted", handleNotificationChange)

    // GLOBAL: Refresh every 5 seconds to check for new notifications from ANY page
    const interval = setInterval(loadNotifications, 5000)

    return () => {
      window.removeEventListener("notificationAdded", handleNotificationChange)
      window.removeEventListener("notificationRead", handleNotificationChange)
      window.removeEventListener("notificationDeleted", handleNotificationChange)
      clearInterval(interval)
    }
  }, [])

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.link && onNotificationClick) {
      onNotificationClick(notification.link)
      setIsOpen(false)
    }
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
    loadNotifications()
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotification(id)
    loadNotifications()
  }

  const getIcon = (type: Notification["type"]) => {
    const iconMap = {
      booking: "📅",
      order: "🍽️",
      inventory: "📦",
      checkout: "🔔",
      payment: "💰",
      info: "ℹ️"
    }
    return iconMap[type] || "ℹ️"
  }

  const getPriorityColor = (priority: Notification["priority"]) => {
    const colorMap = {
      high: "border-l-red-500 bg-red-50",
      medium: "border-l-yellow-500 bg-yellow-50",
      low: "border-l-blue-500 bg-blue-50"
    }
    return colorMap[priority] || "border-l-gray-500 bg-gray-50"
  }

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-600 hover:text-primary transition-colors"
      >
        <Bell size={20} className="sm:w-6 sm:h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs font-semibold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 w-auto sm:w-96 max-h-[min(600px,80vh)] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Check size={14} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-gray-100">
              <AdminSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search notifications..."
              />
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[500px]">
              {notifications.filter((notification) => matchesSearch(searchQuery, notification.title, notification.message, notification.type)).length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm">{searchQuery ? `No notifications match “${searchQuery}”` : "No notifications yet"}</p>
                </div>
              ) : (
                notifications.filter((notification) => matchesSearch(searchQuery, notification.title, notification.message, notification.type)).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      p-4 border-l-4 border-b border-gray-100 cursor-pointer transition-colors
                      ${!notification.read ? getPriorityColor(notification.priority) : "bg-white hover:bg-gray-50"}
                      ${notification.link ? "hover:bg-gray-100" : ""}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-semibold ${!notification.read ? "text-gray-900" : "text-gray-600"}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}


