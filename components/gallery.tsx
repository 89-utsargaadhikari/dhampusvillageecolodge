"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { type GalleryItem } from "@/lib/storage"
import { fetchGallery } from "@/lib/api"

const defaultGalleryItems: GalleryItem[] = [
  { id: -1, src: "/luxury-mountain-lodge-exterior.jpg", alt: "Lodge Exterior", category: "Exterior" },
  { id: -2, src: "/luxury-suite-annapurna-view-nepal.jpg", alt: "Luxury Suite", category: "Suites" },
  { id: -3, src: "/gallery-outdoor-dining-candlelight.jpg", alt: "Outdoor Dining", category: "Dining" },
  { id: -4, src: "/garden-terrace-lodge-relaxation.jpg", alt: "Garden Terrace", category: "Terrace" },
  { id: -5, src: "/spa-wellness-center-luxury.jpg", alt: "Spa & Wellness", category: "Wellness" },
  { id: -6, src: "/sunset-annapurna-himalayan-peak.jpg", alt: "Annapurna Sunset", category: "Views" },
]

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(defaultGalleryItems)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    loadGallery()
  }, [])

  const loadGallery = async () => {
    try {
      const items = await fetchGallery()
      if (Array.isArray(items) && items.length > 0) {
        setGalleryItems(items)
      }
    } catch (error) {
      console.error('Failed to load gallery:', error)
    }
  }

  return (
    <section id="gallery" className="scroll-mt-28 pt-20 pb-0 md:pt-32 bg-[#f8f7f4] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
        <div className="text-center mb-10 md:mb-16 animate-in fade-in slide-in-from-top duration-700">
          <div className="mb-5 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-[#E4B84A]" />
            <p className="text-xs font-semibold tracking-[0.4em] text-[#E4B84A]">VISUAL JOURNEY</p>
            <span className="h-px w-10 bg-[#E4B84A]" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-[#1a1408] mb-4">
            Moments of Paradise
          </h2>
          <p className="text-lg text-[#1a1408]/60">Discover the beauty that awaits you</p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {galleryItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className="relative overflow-hidden rounded-2xl group cursor-pointer aspect-square border border-[#1a1408]/10 hover:border-[#E4B84A]/60 transition-all duration-500 shadow-md hover:shadow-2xl animate-in fade-in zoom-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <img
                src={(item as any).image || item.src || "/placeholder.svg"}
                alt={(item as any).title || item.alt || "Gallery image"}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <p className="text-white font-display text-xl">
                  {item.category}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Lightbox */}
        {selectedId !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setSelectedId(null)}
          >
            <button
              className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white hover:text-[#E4B84A] transition-all duration-300 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-2 sm:p-3"
              onClick={() => setSelectedId(null)}
            >
              <X size={32} />
            </button>
            <img
              src={(galleryItems.find((item) => item.id === selectedId) as any)?.image || galleryItems.find((item) => item.id === selectedId)?.src || "/placeholder.svg"}
              alt="Full size"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in duration-500 border border-[#E4B84A]/40"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </section>
  )
}
