"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, MapPin, Phone, Mail, Instagram, Facebook, Sparkles, ArrowRight, Mountain } from "lucide-react"
import { getSiteSettings, type SiteSettings } from "@/lib/storage"
import { fetchSiteSettings } from "@/lib/api"

const navItems = [
  { label: "Home", href: "#home", id: "home" },
  { label: "About", href: "#about", id: "about" },
  { label: "Rooms", href: "#rooms", id: "rooms" },
  { label: "Gallery", href: "#gallery", id: "gallery" },
  { label: "Contact", href: "#contact", id: "contact" },
]

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.04 0C5.496 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.94 11.94 0 005.725 1.458h.005c6.544 0 11.88-5.335 11.883-11.893C23.92 5.335 18.584 0 12.04 0zm0 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374A9.86 9.86 0 012.164 11.89c.003-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.885-9.887 9.885z" />
    </svg>
  )
}

function TripAdvisorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.006 4.356c-2.106 0-4.14.35-6.046 1.042l-1.782-2.4H0l2.59 3.488c-2.106 1.588-3.488 4.094-3.488 6.888 0 4.77 3.872 8.642 8.642 8.642 2.176 0 4.164-.806 5.67-2.14.35.175.771.28 1.216.28s.866-.105 1.216-.28c1.506 1.334 3.494 2.14 5.67 2.14 4.77 0 8.642-3.872 8.642-8.642 0-2.794-1.382-5.3-3.488-6.888L24 2.998h-4.178l-1.782 2.4c-1.906-.692-3.94-1.042-6.046-1.042h.012zM8.69 8.712a4.338 4.338 0 110 8.676 4.338 4.338 0 010-8.676zm6.632 0a4.338 4.338 0 110 8.676 4.338 4.338 0 010-8.676zM8.69 10.79a2.26 2.26 0 100 4.52 2.26 2.26 0 000-4.52zm6.632 0a2.26 2.26 0 100 4.52 2.26 2.26 0 000-4.52z" />
    </svg>
  )
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeId, setActiveId] = useState("home")
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ logoImage: "", siteName: "Dhampus" })

  useEffect(() => {
    const load = async () => {
      const local = getSiteSettings()
      try {
        const data = await fetchSiteSettings()
        setSiteSettings({
          siteName: data?.siteName || local.siteName || "Dhampus",
          logoImage: data?.logoImage || data?.logo || local.logoImage || "",
        })
      } catch {
        setSiteSettings(local)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("hashchange", onScroll)
    const timer = window.setTimeout(onScroll, 80)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("hashchange", onScroll)
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const ids = navItems.map((item) => item.id)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target.id) setActiveId(visible.target.id)
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.2, 0.5, 0.8] }
    )

    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`border-b transition-all duration-500 ${
          scrolled ? "nav-glass-bar" : "border-[#E4B84A]/35 bg-black/35 backdrop-blur-md"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[11px] sm:px-6 lg:px-8 ${
            scrolled ? "text-[#1a1408]/80" : "text-white/85"
          }`}
        >
          <div className="flex min-w-0 items-center gap-4 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <a
              href="https://maps.google.com/?q=Dhampus+Village+Kaski+Nepal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[#E4B84A]"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#E4B84A]" />
              <span>Dhampus Village, Kaski, Nepal</span>
            </a>
            <a href="tel:+9779865366436" className="inline-flex items-center gap-1.5 hover:text-[#E4B84A]">
              <Phone className="h-3.5 w-3.5 shrink-0 text-[#E4B84A]" />
              <span>+977 9865366436</span>
            </a>
            <a
              href="mailto:dhampusecolodge@gmail.com"
              className="hidden items-center gap-1.5 hover:text-[#E4B84A] md:inline-flex"
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-[#E4B84A]" />
              <span>dhampusecolodge@gmail.com</span>
            </a>
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            <div className="flex items-center gap-3 text-[#E4B84A]">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className={scrolled ? "hover:text-[#004d31]" : "hover:text-white"}
              >
                <Instagram className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className={scrolled ? "hover:text-[#004d31]" : "hover:text-white"}
              >
                <Facebook className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://www.tripadvisor.com/Search?q=Dhampus%20Village%20Eco%20Lodge"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TripAdvisor"
                className={scrolled ? "hover:text-[#004d31]" : "hover:text-white"}
              >
                <TripAdvisorIcon className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://wa.me/9779865366436"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className={scrolled ? "hover:text-[#004d31]" : "hover:text-white"}
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
              </a>
            </div>
            <span
              className={`inline-flex items-center gap-2 text-[11px] italic ${
                scrolled ? "text-[#1a1408]/70" : "text-white/80"
              }`}
            >
              Your Himalayan Escape Awaits
              <Mountain className="h-3.5 w-3.5 text-[#E4B84A]" />
            </span>
          </div>
        </div>
      </div>

      <div className="px-3 pt-3 sm:px-6 lg:px-8">
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border px-3 py-2 transition-all duration-500 sm:px-5 sm:py-2.5 ${
            scrolled
              ? "nav-glass-pill"
              : "border-[#E4B84A]/45 bg-black/30 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          }`}
        >
          <Link href="/" className="flex min-w-0 shrink-0 items-center" aria-label={siteSettings.siteName}>
            {siteSettings.logoImage ? (
              <img
                src={siteSettings.logoImage}
                alt={siteSettings.siteName}
                className="h-11 w-auto object-contain md:h-14"
              />
            ) : (
              <div className="px-1">
                <p
                  className={`font-display text-xl font-semibold leading-none sm:text-2xl ${
                    scrolled ? "text-[#1a1408]" : "text-white"
                  }`}
                >
                  {siteSettings.siteName}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold tracking-[0.28em] text-[#E4B84A]">ECO LODGE</p>
              </div>
            )}
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex lg:gap-1">
            {navItems.map((item) => {
              const active = activeId === item.id
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`relative px-2.5 py-2 text-sm font-medium tracking-wide transition-colors lg:px-4 ${
                    scrolled
                      ? active
                        ? "text-[#004d31]"
                        : "text-[#1a1408]/70 hover:text-[#004d31]"
                      : active
                        ? "text-white"
                        : "text-white/75 hover:text-white"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0 left-1/2 h-px w-8 -translate-x-1/2 bg-[#E4B84A] transition-opacity ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </a>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/booking"
              className="group hidden items-center gap-2 rounded-full bg-[#E4B84A] px-5 py-2.5 text-sm font-semibold text-[#1a1408] shadow-[0_8px_24px_rgba(228,184,74,0.35)] transition-all hover:bg-[#f0c75a] hover:shadow-[0_10px_28px_rgba(228,184,74,0.5)] sm:inline-flex"
            >
              <Sparkles className="h-4 w-4" />
              Book Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              className={`rounded-full p-2 md:hidden ${
                scrolled ? "text-[#1a1408] hover:bg-black/5" : "text-white hover:bg-white/10"
              }`}
              onClick={() => setIsOpen((open) => !open)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="px-3 pt-3 lg:hidden">
          <nav
            className={`mx-auto max-w-7xl space-y-1 rounded-3xl border p-3 md:hidden ${
              scrolled ? "nav-glass-menu" : "border-[#E4B84A]/30 bg-black/80 backdrop-blur-xl"
            }`}
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`block rounded-2xl px-4 py-3 text-sm font-medium ${
                  scrolled
                    ? activeId === item.id
                      ? "bg-[#004d31]/10 text-[#004d31]"
                      : "text-[#1a1408]/80 hover:bg-black/5 hover:text-[#004d31]"
                    : activeId === item.id
                      ? "bg-white/10 text-[#E4B84A]"
                      : "text-white/85 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/booking"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#E4B84A] px-6 py-3 text-sm font-semibold text-[#1a1408]"
              onClick={() => setIsOpen(false)}
            >
              <Sparkles className="h-4 w-4" />
              Book Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
