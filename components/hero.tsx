"use client"

import { useState, useEffect } from "react"
import { ArrowRight, BedDouble, Play } from "lucide-react"
import { type HeroSettings } from "@/lib/storage"
import { fetchHeroSettings } from "@/lib/api"

interface HeroMedia {
  id: number
  type: "image" | "video"
  url: string
  order: number
}

const defaultSettings: HeroSettings = {
  backgroundImage: "/luxury-mountain-lodge.jpg",
  videoUrl: "",
  title: "Dhampus Eco Lodge",
  subtitle:
    "Experience unparalleled luxury nestled at 1,650 meters, where pristine Himalayan vistas meet sustainable elegance and authentic Nepali hospitality.",
}

function splitTitle(title: string) {
  if (/dhampus/i.test(title) && /eco lodge/i.test(title)) {
    return { primary: "Dhampus", accent: "Eco Lodge" }
  }
  const match = title.match(/^(.*?)(\s+eco lodge)$/i)
  if (match) {
    return { primary: match[1].trim() || "Dhampus", accent: "Eco Lodge" }
  }
  const parts = title.trim().split(/\s+/)
  return {
    primary: parts[0] || "Dhampus",
    accent: parts.slice(1).join(" ") || "Eco Lodge",
  }
}

const stats = [
  { value: "5.0", label: "Guest Rating" },
  { value: "1,650m", label: "Altitude" },
  { value: "15", label: "Luxury Rooms" },
  { value: "Est. 2013", label: "Eco-Friendly" },
]

export default function Hero() {
  const [settings, setSettings] = useState<HeroSettings>(defaultSettings)
  const [heroMedia, setHeroMedia] = useState<HeroMedia[]>([])
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [nextMediaIndex, setNextMediaIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    loadSettings()
    loadHeroMedia()
  }, [])

  useEffect(() => {
    if (heroMedia.length === 0) return

    if (heroMedia[currentMediaIndex]?.type === "image") {
      const interval = setInterval(() => {
        const nextIndex = (currentMediaIndex + 1) % heroMedia.length
        setNextMediaIndex(nextIndex)
        setIsTransitioning(true)

        setTimeout(() => {
          setCurrentMediaIndex(nextIndex)
          setIsTransitioning(false)
        }, 1500)
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [heroMedia, currentMediaIndex])

  const loadSettings = async () => {
    try {
      const data = await fetchHeroSettings()
      if (data) {
        const stockTitle = !data.title || /^welcome to dhampus eco lodge$/i.test(data.title)
        const stockSubtitle = !data.subtitle || /^experience luxury in the heart of the himalayas\.?$/i.test(data.subtitle)
        const backgroundUrl = data.backgroundImage || data.backgroundUrl || defaultSettings.backgroundImage
        setSettings({
          title: stockTitle ? defaultSettings.title : data.title,
          subtitle: stockSubtitle ? defaultSettings.subtitle : data.subtitle,
          backgroundImage: data.backgroundType === "video" ? defaultSettings.backgroundImage : backgroundUrl,
          videoUrl: data.videoUrl || (data.backgroundType === "video" ? data.backgroundUrl : "") || "",
        })
      }
    } catch (error) {
      console.error("Failed to load hero settings:", error)
    }
  }

  const loadHeroMedia = async () => {
    try {
      const response = await fetch("/api/hero-media")
      const data = await response.json()

      if (Array.isArray(data) && data.length > 0) {
        const shuffled = [...data].sort(() => Math.random() - 0.5)
        setHeroMedia(shuffled)
      }
    } catch (error) {
      console.error("Failed to load hero media:", error)
    }
  }

  const currentMedia = heroMedia[currentMediaIndex]
  const nextMedia = heroMedia[nextMediaIndex]
  const { primary, accent } = splitTitle(settings.title)

  return (
    <section id="home" className="relative h-dvh min-h-[620px] overflow-hidden bg-[#0d0b08]">
      {/* Background media */}
      {heroMedia.length > 0 ? (
        <div className="absolute inset-0">
          {currentMedia?.type === "video" && (
            <video
              key={currentMedia.id}
              src={currentMedia.url}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          )}

          {currentMedia?.type === "image" && (
            <>
              <div
                className="absolute inset-0 scale-105 bg-cover bg-center transition-opacity duration-[2000ms]"
                style={{
                  backgroundImage: `url(${currentMedia.url})`,
                  opacity: isTransitioning ? 0 : 1,
                }}
              />
              {isTransitioning && nextMedia?.type === "image" && (
                <div
                  className="absolute inset-0 scale-105 bg-cover bg-center"
                  style={{ backgroundImage: `url(${nextMedia.url})` }}
                />
              )}
            </>
          )}
        </div>
      ) : settings.videoUrl ? (
        <video
          src={settings.videoUrl}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      ) : settings.backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${settings.backgroundImage})` }}
        />
      ) : null}

      {/* Cinematic grading: darker left edge for copy, soft bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/15" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#0d0b08] via-black/40 to-transparent" />

      {/* Inset hairline frame */}
      <div className="pointer-events-none absolute inset-3 rounded-[1.75rem] border border-white/10 sm:inset-5" />

      {/* Vertical marker on the right edge */}
      <div className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 rotate-180 items-center gap-4 [writing-mode:vertical-rl] lg:flex">
        <span className="text-[10px] font-medium tracking-[0.45em] text-white/45">ANNAPURNA HIMALAYAS · NEPAL</span>
        <span className="h-16 w-px bg-gradient-to-b from-transparent via-[#E4B84A]/70 to-transparent" />
      </div>

      {/* Main content — editorial, left-aligned */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-10 pt-32 sm:px-10 sm:pb-14 lg:px-16">
        <div className="max-w-3xl">
          <div className="mb-5 flex items-center gap-4 sm:mb-7">
            <span className="h-px w-10 bg-[#E4B84A] sm:w-14" />
            <p className="text-[10px] font-semibold tracking-[0.4em] text-[#E4B84A] sm:text-xs">
              DHAMPUS VILLAGE · 1,650 M
            </p>
          </div>

          <h1 className="font-display text-5xl leading-[0.98] text-white sm:text-7xl lg:text-8xl">
            {primary}
            <span className="mt-1 block italic text-[#E4B84A]">{accent}</span>
          </h1>

          <p className="mt-5 max-w-xl text-sm font-light leading-relaxed text-white/80 sm:mt-7 sm:text-lg">
            {settings.subtitle}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center sm:gap-4">
            <a
              href="#rooms"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#E4B84A] px-7 py-3.5 text-sm font-semibold text-[#1a1408] transition-all hover:bg-[#f0c75a] sm:px-9 sm:py-4"
            >
              <BedDouble className="h-4.5 w-4.5" />
              Explore Luxury Rooms
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#about"
              className="group inline-flex items-center justify-center gap-3 rounded-full border border-white/40 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-[#E4B84A] hover:text-[#E4B84A] sm:px-9 sm:py-4"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Discover Paradise
            </a>
          </div>
        </div>

        {/* Stat strip — hairline separated, no boxes */}
        <div className="mt-10 border-t border-white/15 pt-5 sm:mt-14 sm:pt-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:flex md:items-center md:gap-0">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`flex flex-col gap-0.5 md:px-10 ${index === 0 ? "md:pl-0" : ""} ${
                  index > 0 ? "md:border-l md:border-white/15" : ""
                }`}
              >
                <span className="font-display text-xl text-[#E4B84A] sm:text-2xl">{stat.value}</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/55 sm:text-[11px]">
                  {stat.label}
                </span>
              </div>
            ))}

            {/* Slideshow indicators sit at the end of the strip */}
            {heroMedia.length > 1 && (
              <div className="col-span-2 flex items-center gap-2 md:ml-auto">
                {heroMedia.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMediaIndex(index)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === currentMediaIndex ? "w-8 bg-[#E4B84A]" : "w-2.5 bg-white/35 hover:bg-white/70"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
