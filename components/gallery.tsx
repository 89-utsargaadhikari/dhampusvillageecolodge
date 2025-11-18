"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
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
    <section id="gallery" className="pt-20 pb-0 md:pt-32 bg-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-16">
          <p className="text-accent font-medium uppercase tracking-widest mb-3">Visual Journey</p>
          <h2 className="font-display text-4xl md:text-5xl text-primary mb-6">Gallery</h2>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {galleryItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className="relative overflow-hidden rounded-xl group cursor-pointer aspect-square"
            >
              <img
                src={(item as any).image || item.src || "/placeholder.svg"}
                alt={(item as any).title || item.alt || "Gallery image"}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white font-display text-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.category}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Lightbox */}
        {selectedId !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelectedId(null)}
          >
            <button
              className="absolute top-4 right-4 text-white hover:text-accent transition-colors"
              onClick={() => setSelectedId(null)}
            >
              <X size={32} />
            </button>
            <img
              src={(galleryItems.find((item) => item.id === selectedId) as any)?.image || galleryItems.find((item) => item.id === selectedId)?.src || "/placeholder.svg"}
              alt="Full size"
              className="max-w-3xl max-h-[80vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </section>
  )
}
