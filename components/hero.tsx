"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Sparkles, Star } from "lucide-react"
import { type HeroSettings } from "@/lib/storage"
import { fetchHeroSettings } from "@/lib/api"

interface HeroMedia {
  id: number
  type: "image" | "video"
  url: string
  order: number
}

export default function Hero() {
  const [settings, setSettings] = useState<HeroSettings>({
    backgroundImage: "/luxury-mountain-lodge.jpg",
    videoUrl: "",
    title: "Dhampus Eco Lodge",
    subtitle: "Experience unparalleled luxury nestled at 1,650 meters, where pristine Himalayan vistas meet sustainable elegance and authentic Nepali hospitality",
  })
  const [loaded, setLoaded] = useState(false)
  const [heroMedia, setHeroMedia] = useState<HeroMedia[]>([])
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [nextMediaIndex, setNextMediaIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    loadSettings()
    loadHeroMedia()
    setTimeout(() => setLoaded(true), 100)
  }, [])

  useEffect(() => {
    if (heroMedia.length === 0) return

    // For images, auto-advance every 8 seconds
    if (heroMedia[currentMediaIndex]?.type === "image") {
      const interval = setInterval(() => {
        const nextIndex = (currentMediaIndex + 1) % heroMedia.length
        setNextMediaIndex(nextIndex)
        setIsTransitioning(true)
        
        setTimeout(() => {
          setCurrentMediaIndex(nextIndex)
          setIsTransitioning(false)
        }, 1500) // Transition duration
      }, 8000) // Show for 8 seconds
      return () => clearInterval(interval)
    }
  }, [heroMedia, currentMediaIndex])
  
  const loadSettings = async () => {
    try {
      const data = await fetchHeroSettings()
      if (data) setSettings(data)
    } catch (error) {
      console.error('Failed to load hero settings:', error)
    }
  }

  const loadHeroMedia = async () => {
    try {
      const response = await fetch("/api/hero-media")
      const data = await response.json()
      
      if (Array.isArray(data) && data.length > 0) {
        // Shuffle the media array for random order
        const shuffled = [...data].sort(() => Math.random() - 0.5)
        setHeroMedia(shuffled)
      }
    } catch (error) {
      console.error('Failed to load hero media:', error)
    }
  }

  const handleVideoEnded = () => {
    // Loop the same video instead of moving to next
    const video = document.querySelector('video') as HTMLVideoElement
    if (video) {
      video.currentTime = 0
      video.play()
    }
  }

  const currentMedia = heroMedia[currentMediaIndex]
  const nextMedia = heroMedia[nextMediaIndex]

  return (
    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Media with Slideshow */}
      {heroMedia.length > 0 ? (
        <div className="absolute inset-0">
          {/* Videos - Loop continuously */}
          {currentMedia?.type === "video" && (
            <video
              key={currentMedia.id}
              src={currentMedia.url}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          )}
          
          {/* Images - Crossfade transition */}
          {currentMedia?.type === "image" && (
            <>
              {/* Current image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]"
                style={{
                  backgroundImage: `url(${currentMedia.url})`,
                  opacity: isTransitioning ? 0 : 1,
                }}
              />
              
              {/* Next image (fading in) */}
              {isTransitioning && nextMedia?.type === "image" && (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]"
                  style={{
                    backgroundImage: `url(${nextMedia.url})`,
                    opacity: 1,
                  }}
                />
              )}
            </>
          )}
        </div>
      ) : settings.videoUrl ? (
        <video
          src={settings.videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      ) : settings.backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${settings.backgroundImage})`,
          }}
        />
      ) : null}
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />

      {/* Slideshow Indicators */}
      {heroMedia.length > 1 && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {heroMedia.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentMediaIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentMediaIndex
                  ? "bg-yellow-400 w-8"
                  : "bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Floating Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Sparkles className="absolute top-20 left-20 w-6 h-6 text-yellow-400 animate-pulse" style={{ animationDelay: '0s' }} />
        <Sparkles className="absolute top-40 right-32 w-4 h-4 text-yellow-300 animate-pulse" style={{ animationDelay: '1s' }} />
        <Star className="absolute bottom-32 left-40 w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" style={{ animationDelay: '2s' }} />
        <Star className="absolute top-1/3 right-20 w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <div className={`space-y-8 transition-all duration-1000 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-block animate-in fade-in slide-in-from-top duration-700">
            <span className="text-yellow-400 font-bold text-sm md:text-base tracking-[0.3em] uppercase border-2 border-yellow-400/40 px-6 py-3 rounded-full backdrop-blur-md bg-yellow-400/10 shadow-lg hover:shadow-yellow-400/20 hover:bg-yellow-400/20 transition-all duration-300">
              ✨ Luxury Himalayan Retreat ✨
            </span>
          </div>

          <h1 className={`font-display text-6xl md:text-7xl lg:text-8xl font-bold text-balance leading-tight transition-all duration-1000 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="text-white drop-shadow-2xl">{settings.title.split(" ")[0] || "Dhampus"}</span>
            <span className="block text-transparent bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text drop-shadow-2xl animate-gradient">
              {settings.title.split(" ").slice(1).join(" ") || "Eco Lodge"}
            </span>
          </h1>

          <p className={`text-lg md:text-xl text-gray-100 max-w-3xl mx-auto text-balance font-light leading-relaxed drop-shadow-lg transition-all duration-1000 delay-400 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {settings.subtitle}
          </p>

          <div className={`flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 transition-all duration-1000 delay-600 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <a href="#rooms" className="group bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 px-10 py-5 rounded-full font-bold text-lg transition-all transform hover:scale-110 flex items-center gap-3 shadow-2xl hover:shadow-yellow-500/50">
              Explore Luxury Rooms
              <ChevronRight size={22} className="group-hover:translate-x-2 transition-transform duration-300" />
            </a>
            <a href="#about" className="group border-3 border-white text-white hover:bg-white/20 backdrop-blur-md px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-xl">
              Discover Paradise
            </a>
          </div>

          {/* Trust Badges */}
          <div className={`flex flex-wrap items-center justify-center gap-8 pt-12 transition-all duration-1000 delay-800 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-2 text-yellow-400">
              <Star className="w-5 h-5 fill-yellow-400" />
              <Star className="w-5 h-5 fill-yellow-400" />
              <Star className="w-5 h-5 fill-yellow-400" />
              <Star className="w-5 h-5 fill-yellow-400" />
              <Star className="w-5 h-5 fill-yellow-400" />
              <span className="ml-2 text-white font-semibold">5.0 Rating</span>
            </div>
            <div className="text-white/80 text-sm">
              <span className="font-bold text-yellow-400">1,650m</span> Altitude
            </div>
            <div className="text-white/80 text-sm">
              <span className="font-bold text-green-400">Eco-Friendly</span> Lodge
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-yellow-400 hover:text-yellow-300 transition-all cursor-pointer animate-bounce">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-semibold tracking-wider uppercase">Scroll</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  )
}
