"use client"

import { useState, useEffect } from "react"
import { X, Sparkles } from "lucide-react"
import { type GalleryItem } from "@/lib/storage"
import { fetchGallery } from "@/lib/api"

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    loadGallery()
  }, [])
  
  const loadGallery = async () => {
    try {
      const items = await fetchGallery()
      setGalleryItems(items)
    } catch (error) {
      console.error('Failed to load gallery:', error)
    }
  }

  return (
    <section id="gallery" className="scroll-mt-28 pt-20 pb-0 md:pt-32 bg-gradient-to-br from-yellow-50 via-green-50 to-yellow-50 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-40 right-20 w-96 h-96 bg-yellow-300 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 left-20 w-72 h-72 bg-green-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 relative z-10">
        <div className="text-center mb-10 md:mb-20 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-block mb-4">
            <span className="text-yellow-500 font-bold text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.3em] border-2 border-yellow-500/30 px-4 sm:px-6 py-2 rounded-full bg-yellow-50 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Visual Journey
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-700 via-yellow-600 to-green-700 bg-clip-text text-transparent mb-4">
            Moments of Paradise
          </h2>
          <p className="text-lg text-gray-600">Discover the beauty that awaits you</p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {galleryItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className="relative overflow-hidden rounded-2xl group cursor-pointer aspect-square border-2 border-green-200 hover:border-yellow-400 transition-all duration-500 shadow-lg hover:shadow-2xl transform hover:scale-[1.05] animate-in fade-in zoom-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <img
                src={(item as any).image || item.src || "/placeholder.svg"}
                alt={(item as any).title || item.alt || "Gallery image"}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125 group-hover:rotate-3"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/80 transition-all duration-300" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-white font-display text-2xl font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                  {item.category}
                </p>
                <Sparkles className="w-6 h-6 text-yellow-400 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100" />
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
              className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white hover:text-yellow-400 transition-all duration-300 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-2 sm:p-3 hover:scale-110 transform"
              onClick={() => setSelectedId(null)}
            >
              <X size={32} />
            </button>
            <img
              src={(galleryItems.find((item) => item.id === selectedId) as any)?.image || galleryItems.find((item) => item.id === selectedId)?.src || "/placeholder.svg"}
              alt="Full size"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in duration-500 border-4 border-yellow-400"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </section>
  )
}
