import Link from "next/link"

export default function CTA() {
  return (
    <section id="contact" className="py-20 md:py-32 bg-primary text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-accent font-medium uppercase tracking-widest mb-4">Ready?</p>
        <h2 className="font-display text-4xl md:text-5xl mb-6">Escape to Paradise</h2>
        <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
          Book your stay at Dhampus Eco Lodge and experience luxury immersed in the beauty of the Himalayas
        </p>

        <div className="max-w-2xl mx-auto space-y-4 mb-8">
          <Link href="/booking" className="block w-full bg-accent hover:bg-accent-light text-dark font-semibold py-4 rounded-full transition-colors">
            Book Your Stay Now
          </Link>
          </div>

        <div className="grid grid-cols-3 gap-4 text-sm border-t border-white/20 pt-10">
          <div>
            <p className="text-accent font-semibold mb-2">Call</p>
            <p>+977 9865366436</p>
          </div>
          <div>
            <p className="text-accent font-semibold mb-2">Email</p>
            <p>dhampusecolodge@gmail.com</p>
          </div>
          <div>
            <p className="text-accent font-semibold mb-2">Location</p>
            <p>Dhampus Village, Nepal</p>
          </div>
        </div>
      </div>
    </section>
  )
}
