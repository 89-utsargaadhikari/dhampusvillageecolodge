"use client"

import { useRouter } from "next/navigation"
import { Menu, LogOut, User } from "lucide-react"
import { useState, useEffect } from "react"
import NotificationPanel from "@/components/notification-panel"
import { checkAndNotify } from "@/lib/notifications"

interface AdminHeaderProps {
  onMenuClick: () => void
  onTabChange?: (tab: string) => void
}

export default function AdminHeader({ onMenuClick, onTabChange }: AdminHeaderProps) {
  const router = useRouter()
  const [username, setUsername] = useState("")

  useEffect(() => {
    const savedUsername = sessionStorage.getItem("admin_username")
    if (savedUsername) {
      setUsername(savedUsername)
    }

    // Check for notifications on mount
    checkAndNotify()

    // Check periodically
    const interval = setInterval(() => {
      checkAndNotify()
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem("admin_logged_in")
    sessionStorage.removeItem("admin_username")
    router.push("/admin/login")
  }

  const handleNotificationClick = (link: string) => {
    if (onTabChange) {
      onTabChange(link)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-3 sm:px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-gray-600 hover:text-primary">
          <Menu size={24} />
        </button>
        <h1 className="hidden sm:block text-lg font-semibold text-gray-800">Admin Dashboard</h1>
      </div>
      <div className="flex items-center gap-3 sm:gap-6">
        {username && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <User size={16} />
            <span>{username}</span>
          </div>
        )}
        <NotificationPanel onNotificationClick={handleNotificationClick} />
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} className="sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
