import { Facebook, Instagram, Linkedin, Twitter, Sparkles } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 text-white pt-16 pb-8 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-10 right-20 w-96 h-96 bg-yellow-400 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-72 h-72 bg-green-400 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          {/* Brand */}
          <div className="animate-in fade-in slide-in-from-bottom duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
                <span className="font-display font-bold text-gray-900 text-xl">D</span>
              </div>
              <div>
                <p className="font-display font-bold text-xl bg-gradient-to-r from-yellow-300 to-green-300 bg-clip-text text-transparent">Dhampus</p>
                <p className="text-xs text-white/60 font-medium">Luxury Eco Lodge</p>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              Luxury mountain retreat in the heart of the Himalayas, where sustainable elegance meets authentic Nepali hospitality.
            </p>
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>

          {/* Quick Links */}
          <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-100">
            <h4 className="font-bold text-lg mb-6 text-yellow-300">Company</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <a href="#about" className="hover:text-yellow-300 transition-all duration-300 hover:translate-x-2 inline-block">
                  → About
                </a>
              </li>
              <li>
                <a href="#rooms" className="hover:text-yellow-300 transition-all duration-300 hover:translate-x-2 inline-block">
                  → Rooms
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-yellow-300 transition-all duration-300 hover:translate-x-2 inline-block">
                  → Gallery
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-yellow-300 transition-all duration-300 hover:translate-x-2 inline-block">
                  → Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-200">
            <h4 className="font-bold text-lg mb-6 text-yellow-300">Legal</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <a href="#" className="hover:text-yellow-300 transition-all duration-300 hover:translate-x-2 inline-block">
                  → Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-300 transition-all duration-300 hover:translate-x-2 inline-block">
                  → Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-300 transition-all duration-300 hover:translate-x-2 inline-block">
                  → Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-300 transition-all duration-300 hover:translate-x-2 inline-block">
                  → Cancellation Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            <h4 className="font-bold text-lg mb-6 text-yellow-300">Follow Us</h4>
            <div className="flex gap-4 mb-6">
              <a href="#" className="bg-white/10 hover:bg-yellow-400 text-white hover:text-gray-900 p-3 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm">
                <Facebook size={22} />
              </a>
              <a href="#" className="bg-white/10 hover:bg-yellow-400 text-white hover:text-gray-900 p-3 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm">
                <Instagram size={22} />
              </a>
              <a href="#" className="bg-white/10 hover:bg-yellow-400 text-white hover:text-gray-900 p-3 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm">
                <Twitter size={22} />
              </a>
              <a href="#" className="bg-white/10 hover:bg-yellow-400 text-white hover:text-gray-900 p-3 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm">
                <Linkedin size={22} />
              </a>
            </div>
            <p className="text-xs text-white/60">Share your experience with #DhampusEcoLodge</p>
          </div>
        </div>

        <div className="border-t-2 border-white/10 pt-8 text-center animate-in fade-in duration-700 delay-500">
          <p className="text-sm text-white/60 mb-2">
            &copy; 2025 Dhampus Eco Lodge. All rights reserved.
          </p>
          <p className="text-xs text-white/40">
            Crafted with <span className="text-red-400">❤️</span> & luxury in mind • Powered by sustainable tourism
          </p>
        </div>
      </div>
    </footer>
  )
}
