import { Star, Sparkles } from "lucide-react"

export default function About() {
  return (
    <section id="about" className="py-20 md:py-32 bg-gradient-to-br from-green-50 via-white to-yellow-50 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-20 right-20 w-96 h-96 bg-green-300 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-yellow-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative animate-in fade-in slide-in-from-left duration-700">
            <div className="relative group">
              <img 
                src="/luxury-mountain-lodge-interior-dining.jpg" 
                alt="Dhampus Lodge Interior" 
                className="rounded-3xl shadow-2xl border-4 border-white group-hover:scale-[1.02] transition-transform duration-500" 
              />
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-gradient-to-br from-yellow-300 to-green-300 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-green-300 to-yellow-300 rounded-full blur-2xl opacity-50" />
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -top-6 -right-6 bg-gradient-to-br from-yellow-400 to-yellow-500 text-white px-6 py-4 rounded-2xl shadow-2xl transform rotate-6 hover:rotate-0 transition-all duration-300">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-white" />
                <Star className="w-5 h-5 fill-white" />
                <Star className="w-5 h-5 fill-white" />
                <Star className="w-5 h-5 fill-white" />
                <Star className="w-5 h-5 fill-white" />
              </div>
              <p className="text-xs font-bold mt-1">5.0 Excellence</p>
            </div>
          </div>

          {/* Content */}
          <div className="animate-in fade-in slide-in-from-right duration-700 delay-200">
            <div className="inline-block mb-6">
              <span className="text-yellow-500 font-bold text-sm uppercase tracking-[0.3em] border-2 border-yellow-500/30 px-6 py-2 rounded-full bg-yellow-50 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                About Us
              </span>
            </div>
            
            <h2 className="font-display text-5xl md:text-6xl mb-6 font-bold bg-gradient-to-r from-green-700 to-yellow-600 bg-clip-text text-transparent">
              Himalayan Sanctuary
            </h2>
            
            <p className="text-lg text-gray-600 mb-4 leading-relaxed">
              Nestled at <span className="font-bold text-green-700">1,650 meters</span> above sea level in the picturesque Dhampus village, our lodge represents the
              pinnacle of luxury eco-tourism in Nepal. Built in 2013, we seamlessly blend modern comfort with authentic
              Himalayan hospitality.
            </p>
            
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Each of our <span className="font-bold text-green-700">15 meticulously designed rooms</span> offers stunning vistas of the Annapurna range and the golden
              rice terraces. We are committed to sustainable practices while providing an unforgettable retreat for the
              discerning traveler.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {[
                { number: "15+", label: "Luxury Rooms", icon: "🏡" },
                { number: "1,650m", label: "Altitude", icon: "⛰️" },
                { number: "360°", label: "Mountain Views", icon: "🌄" },
                { number: "12y+", label: "Excellence", icon: "✨" },
              ].map((stat, index) => (
                <div 
                  key={stat.label} 
                  className="group bg-gradient-to-br from-green-50 to-yellow-50 p-6 rounded-2xl border-2 border-green-200 hover:border-yellow-400 transition-all duration-300 hover:shadow-lg transform hover:scale-105 animate-in fade-in zoom-in"
                  style={{ animationDelay: `${(index + 1) * 150}ms` }}
                >
                  <div className="text-3xl mb-2 group-hover:scale-125 transition-transform duration-300">{stat.icon}</div>
                  <p className="text-4xl font-display font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                    {stat.number}
                  </p>
                  <p className="text-sm text-gray-600 font-semibold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
