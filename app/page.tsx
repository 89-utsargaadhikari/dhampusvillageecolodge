"use client"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Hero from "@/components/hero"
import About from "@/components/about"
import Rooms from "@/components/rooms"
import Gallery from "@/components/gallery"
import Cta from "@/components/cta"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <About />
      <Rooms />
      <Gallery />
      <Cta />
      <Footer />
    </main>
  )
}
