"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminHeader from "@/components/admin-header"
import AdminSidebar from "@/components/admin-sidebar"
import DashboardOverview from "@/components/dashboard-overview"
import BookingsManager from "@/components/bookings-manager"
import RoomsManager from "@/components/rooms-manager"
import RoomStatusDashboard from "@/components/room-status-dashboard"
import RoomInventoryManager from "@/components/room-inventory-manager"
import GalleryManager from "@/components/gallery-manager"
import HeroSettingsManager from "@/components/hero-settings-manager"
import SiteSettingsManager from "@/components/site-settings-manager"
import StorageManager from "@/components/storage-manager"
import RestaurantManager from "@/components/restaurant-manager"
import InventoryManager from "@/components/inventory-manager"
import AccountsManager from "@/components/accounts-manager"
import BillingManager from "@/components/billing-manager"
import BusinessPartners from "@/components/business-partners"
import BusinessBookings from "@/components/business-bookings"
import FinancialReports from "@/components/financial-reports"

type AdminTab = "overview" | "bookings" | "rooms" | "room-inventory" | "room-status" | "restaurant" | "inventory" | "billing" | "accounts" | "financial-reports" | "business-partners" | "business-bookings" | "gallery" | "hero" | "settings" | "storage"

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AdminTab>("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check authentication
    const isLoggedIn = sessionStorage.getItem("admin_logged_in")
    if (isLoggedIn !== "true") {
      router.push("/admin/login")
      return
    }
    setIsAuthenticated(true)

    // Open sidebar by default on desktop
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab)
          // Close sidebar on mobile after selecting a tab
          if (window.innerWidth < 768) {
            setSidebarOpen(false)
          }
        }} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onTabChange={(tab) => setActiveTab(tab as AdminTab)}
        />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 min-w-0">
          {activeTab === "overview" && <DashboardOverview key="overview" />}
          {activeTab === "bookings" && <BookingsManager key="bookings" />}
          {activeTab === "rooms" && <RoomsManager key="rooms" />}
          {activeTab === "room-inventory" && <RoomInventoryManager key="room-inventory" />}
          {activeTab === "room-status" && <RoomStatusDashboard key="room-status" />}
          {activeTab === "business-partners" && <BusinessPartners key="business-partners" />}
          {activeTab === "business-bookings" && <BusinessBookings key="business-bookings" />}
          {activeTab === "restaurant" && <RestaurantManager key="restaurant" />}
          {activeTab === "inventory" && <InventoryManager key="inventory" />}
          {activeTab === "billing" && <BillingManager key="billing" />}
          {activeTab === "accounts" && <AccountsManager key="accounts" />}
          {activeTab === "financial-reports" && <FinancialReports key="financial-reports" />}
          {activeTab === "gallery" && <GalleryManager key="gallery" />}
          {activeTab === "hero" && <HeroSettingsManager key="hero" />}
          {activeTab === "settings" && <SiteSettingsManager key="settings" />}
          {activeTab === "storage" && <StorageManager key="storage" />}
        </main>
      </div>
    </div>
  )
}
