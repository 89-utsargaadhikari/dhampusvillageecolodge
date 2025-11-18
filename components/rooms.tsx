"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Star, Wifi, Mountain, Flame, Droplet } from "lucide-react"
import { getRooms, type Room } from "@/lib/storage"

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

  useEffect(() => {
    setRooms(getRooms())
  }, [])

  return (
    <section id="rooms" className="py-24 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-accent font-medium text-sm uppercase tracking-widest mb-3">Accommodations</p>
          <h2 className="font-display text-4xl md:text-5xl text-primary mb-6">Exquisite Rooms</h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
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
          {rooms.map((room) => (
            <div
              key={room.id}
              className="group bg-background rounded-xl overflow-hidden border border-gray-200 hover:border-accent/50 transition-all duration-300 hover:shadow-2xl"
            >
              {/* Image Container */}
              <div className="relative overflow-hidden h-80 bg-gray-100">
                <img
                  src={room.image || "/placeholder.svg"}
                  alt={room.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-2 rounded-full flex items-center gap-1 shadow-lg">
                  <Star size={16} className="fill-accent text-accent" />
                  <span className="font-semibold text-sm text-dark">{room.rating}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <h3 className="font-display text-2xl text-primary">{room.name}</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">{room.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 pt-4">
                  {room.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-xs bg-light px-3 py-2 rounded-full text-foreground/70 border border-border/50"
                    >
                      {featureIcons[feature] || <Wifi size={14} />}
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-6 border-t border-border">
                  <p className="font-display text-2xl text-primary">${room.price}</p>
                  <Link href="/booking" className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary-dark transition-colors shadow-md">
                    Book Room
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
