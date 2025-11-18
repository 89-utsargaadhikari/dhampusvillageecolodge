"use client"

import { useState, useEffect } from "react"
import { ChevronRight } from "lucide-react"
import { getHeroSettings, type HeroSettings } from "@/lib/storage"

export default function Hero() {
  const [settings, setSettings] = useState<HeroSettings>({
    backgroundImage: "/luxury-mountain-lodge.jpg",
    videoUrl: "",
    title: "Dhampus Eco Lodge",
    subtitle: "Experience unparalleled luxury nestled at 1,650 meters, where pristine Himalayan vistas meet sustainable elegance and authentic Nepali hospitality",
  })

  useEffect(() => {
    setSettings(getHeroSettings())
  }, [])

  return (
    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video or Image with Overlay */}
      {settings.videoUrl ? (
        <video
          src={settings.videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
            backgroundImage: `url(${settings.backgroundImage || "/placeholder.svg?height=1080&width=1920"})`,
        }}
        />
      )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
        <div className="space-y-6">
          <div className="inline-block">
            <span className="text-accent font-medium text-sm md:text-base tracking-widest uppercase border border-accent/30 px-4 py-2 rounded-full backdrop-blur-sm bg-accent/5">
              Luxury Mountain Retreat
            </span>
          </div>

          <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-light text-balance leading-tight">
            {settings.title.split(" ")[0] || "Dhampus"}
            <span className="block text-accent">{settings.title.split(" ").slice(1).join(" ") || "Eco Lodge"}</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto text-balance font-light leading-relaxed">
            {settings.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button className="group bg-accent hover:bg-opacity-90 text-dark px-8 py-4 rounded-full font-semibold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg">
              Explore Rooms
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:bg-opacity-10 px-8 py-4 rounded-full font-semibold transition-all backdrop-blur-sm">
              Discover More
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white/70 hover:text-white transition-colors">
        <div className="animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  )
}
