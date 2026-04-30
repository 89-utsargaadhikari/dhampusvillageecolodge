"use client"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Hero from "@/components/hero"
import About from "@/components/about"
import Rooms from "@/components/rooms"
import Gallery from "@/components/gallery"
import TreeBorder from "@/components/tree-border"
import Cta from "@/components/cta"
import ScrollProgress from "@/components/scroll-progress"

export default function Home() {
  return (
    <main className="min-h-screen m-0 p-0">
      <ScrollProgress />
      <Header />
      <Hero />
      <About />
      <Rooms />
      <Gallery />
      <TreeBorder />
      <Cta />
      <Footer />
    </main>
  )
}
