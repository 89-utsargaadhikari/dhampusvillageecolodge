"use client"

import { useState, useEffect } from "react"

export default function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const progress = (window.scrollY / totalHeight) * 100
      setScrollProgress(progress)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 z-[100] h-0.5 w-full bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-[#C9A227] via-[#E4B84A] to-[#C9A227] transition-all duration-150 ease-out"
          style={{
            width: `${scrollProgress}%`,
            boxShadow: "0 0 10px rgba(228, 184, 74, 0.55)",
          }}
        />
      </div>
    </>
  )
}



