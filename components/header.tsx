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
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            {siteSettings.logoImage ? (
              <img src={siteSettings.logoImage} alt={siteSettings.siteName} className="h-12 object-contain" />
            ) : (
              <>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                  <span className="text-white font-display text-xl font-bold">{siteSettings.siteName.charAt(0)}</span>
            </div>
            <div className="hidden sm:block">
                  <p className="font-display text-lg font-semibold text-primary">{siteSettings.siteName}</p>
              <p className="text-xs text-muted-foreground">Eco Lodge</p>
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
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-4">
            <Link href="/booking" className="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-primary-dark transition-colors">
              Book Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <nav className="md:hidden pb-4 space-y-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-2 text-sm font-medium text-foreground hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link href="/booking" className="block w-full bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-primary-dark text-center">
              Book Now
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
