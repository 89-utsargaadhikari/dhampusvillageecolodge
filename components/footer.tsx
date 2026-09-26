import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="relative bg-[#0d0b08] text-white pt-16 pb-8 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url(/footer-mountain-silhouette-dusk.jpg)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0b08] via-[#0d0b08]/95 to-[#0d0b08]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          {/* Brand */}
          <div className="animate-in fade-in slide-in-from-bottom duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#E4B84A] flex items-center justify-center">
                <span className="font-display font-semibold text-[#1a1408] text-xl">D</span>
              </div>
              <div>
                <p className="font-display text-xl text-white">Dhampus</p>
                <p className="text-xs text-white/50 tracking-[0.2em]">ECO LODGE</p>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Luxury mountain retreat in the heart of the Himalayas, where sustainable elegance meets authentic
              Nepali hospitality.
            </p>
          </div>

          {/* Quick Links */}
          <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-100">
            <h4 className="font-display text-lg mb-6 text-[#E4B84A]">Company</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><a href="#about" className="hover:text-[#E4B84A] transition-colors">About</a></li>
              <li><a href="#rooms" className="hover:text-[#E4B84A] transition-colors">Rooms</a></li>
              <li><a href="#gallery" className="hover:text-[#E4B84A] transition-colors">Gallery</a></li>
              <li><a href="#contact" className="hover:text-[#E4B84A] transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-200">
            <h4 className="font-display text-lg mb-6 text-[#E4B84A]">Legal</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><a href="#" className="hover:text-[#E4B84A] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#E4B84A] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#E4B84A] transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-[#E4B84A] transition-colors">Cancellation Policy</a></li>
            </ul>
          </div>

          {/* Social */}
          <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            <h4 className="font-display text-lg mb-6 text-[#E4B84A]">Follow Us</h4>
            <div className="flex gap-3 mb-6">
              <a href="#" className="bg-white/5 hover:bg-[#E4B84A] text-white hover:text-[#1a1408] p-3 rounded-full transition-all duration-300 border border-white/10">
                <Facebook size={18} />
              </a>
              <a href="#" className="bg-white/5 hover:bg-[#E4B84A] text-white hover:text-[#1a1408] p-3 rounded-full transition-all duration-300 border border-white/10">
                <Instagram size={18} />
              </a>
              <a href="#" className="bg-white/5 hover:bg-[#E4B84A] text-white hover:text-[#1a1408] p-3 rounded-full transition-all duration-300 border border-white/10">
                <Twitter size={18} />
              </a>
              <a href="#" className="bg-white/5 hover:bg-[#E4B84A] text-white hover:text-[#1a1408] p-3 rounded-full transition-all duration-300 border border-white/10">
                <Linkedin size={18} />
              </a>
            </div>
            <p className="text-xs text-white/40">Share your experience with #DhampusEcoLodge</p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center animate-in fade-in duration-700 delay-500">
          <p className="text-sm text-white/50 mb-2">
            &copy; 2025 Dhampus Eco Lodge. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Crafted with <span className="text-red-400">❤️</span> & luxury in mind • Powered by sustainable tourism
          </p>
        </div>
      </div>
    </footer>
  )
}
