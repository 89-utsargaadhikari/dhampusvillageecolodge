"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { getSiteSettings, type SiteSettings } from "@/lib/storage"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ logoImage: "", siteName: "Dhampus" })

  useEffect(() => {
    setSiteSettings(getSiteSettings())
  }, [])

  const navItems = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Rooms", href: "#rooms" },
    { label: "Gallery", href: "#gallery" },
    { label: "Contact", href: "#contact" },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-green-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            {siteSettings.logoImage ? (
              <img src={siteSettings.logoImage} alt={siteSettings.siteName} className="h-12 object-contain transition-transform duration-300 group-hover:scale-110" />
            ) : (
              <>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-600 to-yellow-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                  <span className="text-white font-display text-2xl font-bold">{siteSettings.siteName.charAt(0)}</span>
            </div>
            <div className="hidden sm:block">
                  <p className="font-display text-xl font-bold bg-gradient-to-r from-green-700 to-yellow-600 bg-clip-text text-transparent">{siteSettings.siteName}</p>
              <p className="text-xs text-gray-500 font-medium">Luxury Eco Lodge</p>
            </div>
              </>
            )}
          </Link>

          {/* Desktop menu */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-gray-700 hover:text-green-600 transition-all duration-300 relative group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-600 to-yellow-500 group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-4">
            <Link href="/booking" className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-white px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              ✨ Book Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-gray-700 hover:text-green-600 transition-colors" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <nav className="md:hidden pb-4 space-y-3 animate-in fade-in slide-in-from-top duration-300">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-3 text-sm font-semibold text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg px-4 transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link href="/booking" className="block w-full bg-gradient-to-r from-green-600 to-yellow-600 text-white px-6 py-3 rounded-full text-sm font-bold text-center shadow-lg">
              ✨ Book Now
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
