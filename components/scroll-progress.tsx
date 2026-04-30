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
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200/50 z-[100]">
        <div
          className="h-full bg-gradient-to-r from-green-600 via-yellow-500 to-green-600 transition-all duration-150 ease-out shadow-lg"
          style={{ 
            width: `${scrollProgress}%`,
            boxShadow: '0 0 10px rgba(234, 179, 8, 0.5)'
          }}
        />
      </div>
    </>
  )
}



