"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Star, Wifi, Mountain, Flame, Droplet } from "lucide-react"
import { type Room } from "@/lib/storage"
import { fetchRooms } from "@/lib/api"
import { currencySymbol, isGuestFacingRoom } from "@/lib/hotel"

const featureIcons: Record<string, React.ReactNode> = {
  "Mountain View": <Mountain size={14} />,
  "360° Views": <Mountain size={14} />,
  "Garden View": <Mountain size={14} />,
  WiFi: <Wifi size={14} />,
  Fireplace: <Flame size={14} />,
  "Rain Shower": <Droplet size={14} />,
}

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [hoveredRoom, setHoveredRoom] = useState<number | null>(null)

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      const roomsData = await fetchRooms()
      setRooms(roomsData.filter(isGuestFacingRoom))
    } catch (error) {
      console.error('Failed to load rooms:', error)
    }
  }

  return (
    <section id="rooms" className="scroll-mt-28 py-24 md:py-32 bg-[#f8f7f4] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14 md:mb-20 animate-in fade-in slide-in-from-top duration-700">
          <div className="mb-5 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-[#E4B84A]" />
            <p className="text-xs font-semibold tracking-[0.4em] text-[#E4B84A]">ACCOMMODATIONS</p>
            <span className="h-px w-10 bg-[#E4B84A]" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-[#1a1408] mb-4 sm:mb-6">
            Exquisite Luxury Rooms
          </h2>
          <p className="text-base sm:text-xl text-[#1a1408]/60 max-w-3xl mx-auto leading-relaxed">
            Each room is a carefully designed sanctuary featuring premium furnishings, modern amenities, and
            unobstructed views of the Himalayan peaks
          </p>
        </div>

        <div className={`grid gap-8 ${
          rooms.length === 1
            ? "md:grid-cols-1 max-w-md mx-auto"
            : rooms.length === 2
              ? "md:grid-cols-2 max-w-4xl mx-auto"
              : "md:grid-cols-3"
        }`}>
          {rooms.map((room, index) => (
            <div
              key={room.id}
              onMouseEnter={() => setHoveredRoom(room.id)}
              onMouseLeave={() => setHoveredRoom(null)}
              className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-500 transform hover:-translate-y-1 animate-in fade-in slide-in-from-bottom ${
                hoveredRoom === room.id
                  ? "border-[#E4B84A]/60 shadow-2xl shadow-[#1a1408]/10"
                  : "border-[#1a1408]/10 shadow-md hover:shadow-xl"
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Image Container */}
              <div className="relative overflow-hidden h-56 sm:h-80 bg-[#f0efe9]">
                <img
                  src={room.image || "/placeholder.svg"}
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Rating Badge */}
                <div className="absolute top-4 right-4 bg-[#1a1408]/80 backdrop-blur px-3.5 py-2 rounded-full flex items-center gap-1.5 shadow-xl">
                  <Star size={15} className="fill-[#E4B84A] text-[#E4B84A]" />
                  <span className="font-semibold text-sm text-white">{room.rating}</span>
                </div>

                {/* Capacity Badge */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-2 rounded-full shadow-lg">
                  <span className="text-xs font-semibold text-[#1a1408]/80">Up to {room.capacity} guests</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <h3 className="font-display text-2xl text-[#1a1408]">
                  {room.name}
                </h3>
                <p className="text-[#1a1408]/60 text-sm leading-relaxed line-clamp-2">{room.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {room.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-1.5 text-xs bg-[#f8f7f4] px-3 py-1.5 rounded-full text-[#1a1408]/70 border border-[#1a1408]/10"
                    >
                      {featureIcons[feature] || <Wifi size={13} />}
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[#1a1408]/10">
                  <div>
                    <p className="text-xs text-[#1a1408]/50 mb-1">Starting from</p>
                    <p className="font-display text-2xl sm:text-3xl text-[#004d31]">
                      {currencySymbol(room.currency)} {room.price}
                    </p>
                    <p className="text-xs text-[#1a1408]/50">per night</p>
                  </div>
                  <Link href="/booking" className="bg-[#E4B84A] hover:bg-[#f0c75a] text-[#1a1408] px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl text-center w-full sm:w-auto">
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
