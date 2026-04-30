"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Star, Wifi, Mountain, Flame, Droplet } from "lucide-react"
import { type Room } from "@/lib/storage"
import { fetchRooms } from "@/lib/api"

const featureIcons: Record<string, React.ReactNode> = {
  "Mountain View": <Mountain size={16} />,
  "360° Views": <Mountain size={16} />,
  "Garden View": <Mountain size={16} />,
  WiFi: <Wifi size={16} />,
  Fireplace: <Flame size={16} />,
  "Rain Shower": <Droplet size={16} />,
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
      setRooms(roomsData)
    } catch (error) {
      console.error('Failed to load rooms:', error)
    }
  }

  return (
    <section id="rooms" className="py-24 md:py-32 bg-gradient-to-br from-green-50 via-yellow-50 to-green-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-300 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-block mb-4">
            <span className="text-yellow-500 font-bold text-sm uppercase tracking-[0.3em] border-2 border-yellow-500/30 px-6 py-2 rounded-full bg-yellow-50">
              ✨ Accommodations ✨
            </span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-700 via-yellow-600 to-green-700 bg-clip-text text-transparent mb-6">
            Exquisite Luxury Rooms
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
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
              className={`group bg-white rounded-2xl overflow-hidden border-2 transition-all duration-500 transform hover:-translate-y-2 animate-in fade-in slide-in-from-bottom ${
                hoveredRoom === room.id
                  ? "border-yellow-400 shadow-2xl shadow-yellow-200/50 scale-[1.02]"
                  : "border-green-200 hover:border-yellow-300 shadow-lg hover:shadow-xl"
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Image Container */}
              <div className="relative overflow-hidden h-80 bg-gradient-to-br from-green-100 to-yellow-100">
                <img
                  src={room.image || "/placeholder.svg"}
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125 group-hover:rotate-2"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Rating Badge */}
                <div className={`absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-500 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 shadow-xl transition-all duration-300 ${
                  hoveredRoom === room.id ? "scale-110" : ""
                }`}>
                  <Star size={18} className="fill-white text-white" />
                  <span className="font-bold text-sm text-white">{room.rating}</span>
                </div>

                {/* Capacity Badge */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-2 rounded-full shadow-lg">
                  <span className="text-xs font-semibold text-gray-700">Up to {room.capacity} guests</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <h3 className="font-display text-2xl font-bold bg-gradient-to-r from-green-700 to-yellow-600 bg-clip-text text-transparent">
                  {room.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{room.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 pt-4">
                  {room.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-xs bg-gradient-to-r from-green-50 to-yellow-50 px-3 py-2 rounded-full text-gray-700 border border-green-200 hover:border-yellow-400 transition-all duration-300 hover:scale-105"
                    >
                      {featureIcons[feature] || <Wifi size={14} />}
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-6 border-t-2 border-green-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Starting from</p>
                    <p className="font-display text-3xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
                      ${room.price}
                    </p>
                    <p className="text-xs text-gray-500">per night</p>
                  </div>
                  <Link href="/booking" className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-white px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110">
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
