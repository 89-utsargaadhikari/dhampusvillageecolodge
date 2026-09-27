import Link from "next/link"
import { Sparkles, Phone, Mail, MapPin } from "lucide-react"

export default function CTA() {
  return (
    <section id="contact" className="scroll-mt-28 relative pt-24 pb-16 text-white overflow-hidden bg-[#0d0b08]">
      {/* Background media */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/cta-night-terrace-stars.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0b08]/90 via-[#0d0b08]/80 to-[#0d0b08]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="animate-in fade-in slide-in-from-bottom duration-700">
          <div className="mb-6 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-[#E4B84A]" />
            <p className="text-xs font-semibold tracking-[0.4em] text-[#E4B84A]">READY FOR PARADISE?</p>
            <span className="h-px w-10 bg-[#E4B84A]" />
          </div>

          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mb-6 text-white">
            Your Himalayan Adventure Awaits
          </h2>

          <p className="text-base sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Book your stay at Dhampus Eco Lodge and experience luxury immersed in the breathtaking beauty of the
            Himalayas
          </p>

          <div className="max-w-2xl mx-auto mb-12">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-[#E4B84A] hover:bg-[#f0c75a] text-[#1a1408] font-semibold text-base sm:text-lg py-4 sm:py-5 px-6 sm:px-12 rounded-full transition-all duration-300 shadow-2xl hover:shadow-[#E4B84A]/30"
            >
              <Sparkles className="w-5 h-5" />
              Book Your Luxury Stay Now
            </Link>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-white/15 pt-12 mt-4">
          <a
            href="https://wa.me/9779865366436?text=Hi%20Dhampus%20Eco%20Lodge,%20I%27d%20like%20to%20inquire%20about%20booking%20a%20room"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-[#E4B84A]/50 hover:bg-white/10 transition-all duration-300">
              <Phone className="w-7 h-7 text-[#E4B84A] mx-auto mb-3" />
              <p className="text-[#E4B84A] font-semibold mb-2 text-sm tracking-wide">WhatsApp Us</p>
              <p className="text-sm text-white/80">+977 9865366436</p>
              <p className="text-xs text-white/40 mt-2">Click to chat</p>
            </div>
          </a>

          <div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-[#E4B84A]/50 hover:bg-white/10 transition-all duration-300">
              <Mail className="w-7 h-7 text-[#E4B84A] mx-auto mb-3" />
              <p className="text-[#E4B84A] font-semibold mb-2 text-sm tracking-wide">Email Us</p>
              <p className="text-sm break-all text-white/80">dhampusecolodge@gmail.com</p>
            </div>
          </div>

          <div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-[#E4B84A]/50 hover:bg-white/10 transition-all duration-300">
              <MapPin className="w-7 h-7 text-[#E4B84A] mx-auto mb-3" />
              <p className="text-[#E4B84A] font-semibold mb-2 text-sm tracking-wide">Visit Us</p>
              <p className="text-sm text-white/80">Dhampus Village, Nepal</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
