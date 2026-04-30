import Link from "next/link"
import { Sparkles, Phone, Mail, MapPin } from "lucide-react"

export default function CTA() {
  return (
    <section id="contact" className="pt-20 pb-16 bg-gradient-to-br from-green-700 via-green-600 to-yellow-600 text-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-64 h-64 bg-yellow-400 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-green-400 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        <Sparkles className="absolute top-20 left-32 w-8 h-8 text-yellow-300 animate-pulse" />
        <Sparkles className="absolute bottom-32 right-40 w-6 h-6 text-yellow-200 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-block mb-6">
            <span className="text-yellow-300 font-bold text-sm uppercase tracking-[0.3em] border-2 border-yellow-300/40 px-6 py-2 rounded-full backdrop-blur-md bg-white/10">
              ✨ Ready for Paradise? ✨
            </span>
          </div>
          
          <h2 className="font-display text-5xl md:text-6xl font-bold mb-6 drop-shadow-2xl">
            Your Himalayan Adventure Awaits
          </h2>
          
          <p className="text-xl text-white/95 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
            Book your stay at Dhampus Eco Lodge and experience luxury immersed in the breathtaking beauty of the Himalayas
          </p>

          <div className="max-w-2xl mx-auto mb-12">
            <Link href="/booking" className="inline-block w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold text-lg py-5 px-12 rounded-full transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-yellow-500/50">
              <span className="flex items-center justify-center gap-3">
                <Sparkles className="w-6 h-6" />
                Book Your Luxury Stay Now
              </span>
            </Link>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t-2 border-white/20 pt-12 mt-12">
          <a 
            href="https://wa.me/9779865366436?text=Hi%20Dhampus%20Eco%20Lodge,%20I%27d%20like%20to%20inquire%20about%20booking%20a%20room" 
            target="_blank"
            rel="noopener noreferrer"
            className="group hover:scale-110 transition-all duration-300"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-white/20 hover:border-yellow-300 hover:bg-white/20 transition-all duration-300 shadow-lg cursor-pointer">
              <Phone className="w-8 h-8 text-yellow-300 mx-auto mb-3 group-hover:animate-bounce" />
              <p className="text-yellow-300 font-bold mb-2">WhatsApp Us</p>
              <p className="text-sm">+977 9865366436</p>
              <p className="text-xs text-white/60 mt-2">Click to chat</p>
            </div>
          </a>
          
          <div className="group hover:scale-110 transition-all duration-300">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-white/20 hover:border-yellow-300 hover:bg-white/20 transition-all duration-300 shadow-lg">
              <Mail className="w-8 h-8 text-yellow-300 mx-auto mb-3 group-hover:animate-bounce" />
              <p className="text-yellow-300 font-bold mb-2">Email Us</p>
              <p className="text-sm break-all">dhampusecolodge@gmail.com</p>
            </div>
          </div>
          
          <div className="group hover:scale-110 transition-all duration-300">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-white/20 hover:border-yellow-300 hover:bg-white/20 transition-all duration-300 shadow-lg">
              <MapPin className="w-8 h-8 text-yellow-300 mx-auto mb-3 group-hover:animate-bounce" />
              <p className="text-yellow-300 font-bold mb-2">Visit Us</p>
              <p className="text-sm">Dhampus Village, Nepal</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
