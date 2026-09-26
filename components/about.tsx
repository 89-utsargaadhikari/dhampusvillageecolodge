import { Star } from "lucide-react"

export default function About() {
  return (
    <section id="about" className="scroll-mt-28 py-20 md:py-32 bg-[#f8f7f4] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-10 md:gap-20 items-center">
          {/* Image */}
          <div className="relative animate-in fade-in slide-in-from-left duration-700">
            <div className="relative">
              <div className="overflow-hidden rounded-[1.75rem] border border-[#1a1408]/10 shadow-[0_30px_60px_-20px_rgba(26,20,8,0.25)]">
                <img
                  src="/about-lodge-fireplace-mountain-view.jpg"
                  alt="Dhampus Lodge Interior"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <div className="pointer-events-none absolute inset-3 rounded-[1.4rem] border border-white/40 sm:inset-4" />
            </div>

            {/* Rating Badge */}
            <div className="absolute -bottom-6 left-6 flex items-center gap-3 rounded-2xl border border-[#1a1408]/10 bg-white px-5 py-4 shadow-xl sm:-left-8">
              <div className="flex items-center gap-0.5 text-[#E4B84A]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <div className="h-8 w-px bg-[#1a1408]/10" />
              <p className="text-sm font-semibold text-[#1a1408]">5.0 Excellence</p>
            </div>
          </div>

          {/* Content */}
          <div className="animate-in fade-in slide-in-from-right duration-700 delay-200">
            <div className="mb-6 flex items-center gap-4">
              <span className="h-px w-10 bg-[#E4B84A]" />
              <p className="text-xs font-semibold tracking-[0.4em] text-[#E4B84A]">ABOUT US</p>
            </div>

            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mb-6 text-[#1a1408]">
              Himalayan <span className="italic text-[#004d31]">Sanctuary</span>
            </h2>

            <p className="text-lg text-[#1a1408]/70 mb-4 leading-relaxed">
              Nestled at <span className="font-semibold text-[#004d31]">1,650 meters</span> above sea level in the
              picturesque Dhampus village, our lodge represents the pinnacle of luxury eco-tourism in Nepal. Built in
              2013, we seamlessly blend modern comfort with authentic Himalayan hospitality.
            </p>

            <p className="text-lg text-[#1a1408]/70 mb-10 leading-relaxed">
              Each of our <span className="font-semibold text-[#004d31]">15 meticulously designed rooms</span> offers
              stunning vistas of the Annapurna range and the golden rice terraces. We are committed to sustainable
              practices while providing an unforgettable retreat for the discerning traveler.
            </p>

            <div className="grid grid-cols-2 gap-4 border-t border-[#1a1408]/10 pt-8 sm:gap-6">
              {[
                { number: "15+", label: "Luxury Rooms" },
                { number: "1,650m", label: "Altitude" },
                { number: "360°", label: "Mountain Views" },
                { number: "12y+", label: "Excellence" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                  <p className="font-display text-3xl text-[#004d31] sm:text-4xl">{stat.number}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#1a1408]/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
