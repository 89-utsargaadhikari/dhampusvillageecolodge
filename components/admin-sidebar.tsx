"use client"

import { LayoutDashboard, Calendar, Bed, ImageIcon, ArrowLeft, Video, Settings, DoorOpen, Hash, HardDrive, UtensilsCrossed, Wallet, Receipt, X } from "lucide-react"
import Link from "next/link"

type AdminTab = "overview" | "bookings" | "rooms" | "room-inventory" | "room-status" | "restaurant" | "billing" | "accounts" | "gallery" | "hero" | "settings" | "storage"

interface AdminSidebarProps {
  activeTab: AdminTab
  setActiveTab: (tab: AdminTab) => void
  isOpen: boolean
  onClose: () => void
}

export default function AdminSidebar({ activeTab, setActiveTab, isOpen, onClose }: AdminSidebarProps) {
  const menuItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "rooms", label: "Rooms", icon: Bed },
    { id: "room-inventory", label: "Room Numbers", icon: Hash },
    { id: "room-status", label: "Room Status", icon: DoorOpen },
    { id: "restaurant", label: "Restaurant (RMS)", icon: UtensilsCrossed },
    { id: "billing", label: "Billing & Checkout", icon: Receipt },
    { id: "accounts", label: "Accounts (AMS)", icon: Wallet },
    { id: "gallery", label: "Gallery", icon: ImageIcon },
    { id: "hero", label: "Hero Settings", icon: Video },
    { id: "settings", label: "Site Settings", icon: Settings },
    { id: "storage", label: "Storage Manager", icon: HardDrive },
  ] as const

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        fixed md:static inset-y-0 left-0 z-50
        w-64 md:w-64 lg:w-64
        bg-gray-900 text-white 
        transition-transform duration-300 
        flex flex-col
      `}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
              <span className="font-bold text-white text-sm">D</span>
            </div>
            <span className="font-semibold">Dhampus Lodge</span>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id ? "bg-green-600 text-white" : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Site</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
