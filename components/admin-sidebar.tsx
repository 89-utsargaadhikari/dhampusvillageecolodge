"use client"

import { useState } from "react"
import { LayoutDashboard, Calendar, CalendarDays, Bed, ImageIcon, ArrowLeft, Video, Settings, DoorOpen, Hash, HardDrive, UtensilsCrossed, Wallet, Receipt, X, Building2, Briefcase, Package, TrendingUp, Search, ChevronDown } from "lucide-react"
import Link from "next/link"
import { matchesSearch } from "@/components/admin-search"

type AdminTab = "overview" | "bookings" | "calendar" | "rooms" | "room-inventory" | "room-status" | "restaurant" | "inventory" | "billing" | "accounts" | "financial-reports" | "business-partners" | "business-bookings" | "gallery" | "hero" | "settings" | "storage"

interface AdminSidebarProps {
  activeTab: AdminTab
  setActiveTab: (tab: AdminTab) => void
  isOpen: boolean
  onClose: () => void
}

export default function AdminSidebar({ activeTab, setActiveTab, isOpen, onClose }: AdminSidebarProps) {
  const [navSearch, setNavSearch] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const menuItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "rooms", label: "Rooms", icon: Bed },
    { id: "room-inventory", label: "Room Numbers", icon: Hash },
    { id: "room-status", label: "Room Status", icon: DoorOpen },
    {
      id: "business-bookings",
      label: "Business Bookings",
      icon: Briefcase,
      children: [
        { id: "business-partners", label: "Business Partners", icon: Building2 },
      ],
    },
    { id: "restaurant", label: "Restaurant (RMS)", icon: UtensilsCrossed },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "billing", label: "Billing & Checkout", icon: Receipt },
    { id: "accounts", label: "Accounts (AMS)", icon: Wallet },
    { id: "financial-reports", label: "Financial Reports", icon: TrendingUp },
    { id: "gallery", label: "Gallery", icon: ImageIcon },
    { id: "hero", label: "Hero & Media", icon: Video },
    { id: "settings", label: "Site Settings", icon: Settings },
    { id: "storage", label: "Storage Manager", icon: HardDrive },
  ] as const

  const matchesItem = (item: (typeof menuItems)[number]) =>
    matchesSearch(navSearch, item.label) ||
    ("children" in item && item.children.some((child) => matchesSearch(navSearch, child.label)))

  const visibleItems = menuItems.filter(matchesItem)

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
        w-[min(18rem,85vw)] md:w-64 lg:w-64
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

        <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-8 space-y-1 sm:space-y-2 overflow-y-auto">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search pages..."
              className="w-full bg-gray-800 text-white text-sm rounded-lg pl-9 pr-3 py-2 placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>
          {visibleItems.length === 0 && (
            <p className="px-4 py-2 text-sm text-gray-500">No pages match “{navSearch}”.</p>
          )}
          {visibleItems.map((item) => {
            const children = "children" in item ? item.children : []
            const hasChildren = children.length > 0
            const isExpanded = navSearch ? true : !!expanded[item.id]
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id)
                    if (hasChildren) {
                      setExpanded((prev) => ({ ...prev, [item.id]: !isExpanded }))
                    }
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id ? "bg-green-600 text-white" : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <item.icon size={20} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {hasChildren && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  )}
                </button>
                {hasChildren && isExpanded && (
                  <div className="mt-1 ml-4 pl-3 border-l border-gray-700 space-y-1">
                    {children
                      .filter((child) => matchesSearch(navSearch, child.label))
                      .map((child) => (
                        <button
                          key={child.id}
                          onClick={() => setActiveTab(child.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            activeTab === child.id ? "bg-green-600 text-white" : "text-gray-300 hover:text-white hover:bg-gray-800"
                          }`}
                        >
                          <child.icon size={16} />
                          <span>{child.label}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
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
