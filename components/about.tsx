export default function About() {
  return (
    <section id="about" className="py-20 md:py-32 bg-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative">
            <img src="/luxury-mountain-lodge-interior-dining.jpg" alt="Dhampus Lodge Interior" className="rounded-2xl shadow-xl" />
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
          </div>

          {/* Content */}
          <div>
            <p className="text-accent font-medium uppercase tracking-widest mb-3">About Us</p>
            <h2 className="font-display text-4xl md:text-5xl mb-6 text-primary">Himalayan Sanctuary</h2>
            <p className="text-lg text-foreground/80 mb-4 leading-relaxed">
              Nestled at 1,650 meters above sea level in the picturesque Dhampus village, our lodge represents the
              pinnacle of luxury eco-tourism in Nepal. Built in 2013, we seamlessly blend modern comfort with authentic
              Himalayan hospitality.
            </p>
            <p className="text-lg text-foreground/80 mb-8 leading-relaxed">
              Each of our 15 meticulously designed rooms offers stunning vistas of the Annapurna range and the golden
              rice terraces. We are committed to sustainable practices while providing an unforgettable retreat for the
              discerning traveler.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {[
                { number: "15+", label: "Luxury Rooms" },
                { number: "1,650m", label: "Altitude" },
                { number: "360°", label: "Mountain Views" },
                { number: "12y+", label: "Excellence" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-display font-bold text-primary mb-2">{stat.number}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
