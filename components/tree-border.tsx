"use client"

import { useMemo } from "react"

export default function TreeBorder() {
  // Match the primary green color from footer (#006b47)
  const greenShades = [
    '#004d31', '#005a3d', '#006b47', '#007851', 
    '#00855b', '#009265', '#009f6f', '#00ac79', '#00b983'
  ]
  
  // Generate tree data once to avoid hydration mismatch
  const treeData = useMemo(() => {
    const pines = Array.from({ length: 60 }, (_, i) => ({
      height: 80 + (i * 0.7) % 60,
      width: 40 + (i * 0.5) % 30,
      left: (i / 60) * 105 - 2.5,
      delay: (i * 0.1) % 6,
      duration: 5 + (i * 0.05) % 3,
      colorIndex: i % 3,
    }))
    
    const canopies = Array.from({ length: 80 }, (_, i) => ({
      canopySize: 50 + (i * 0.6) % 50,
      left: (i / 80) * 105 - 2.5,
      delay: (i * 0.08) % 6,
      duration: 4 + (i * 0.04) % 3,
    }))
    
    const shrubs = Array.from({ length: 100 }, (_, i) => ({
      height: 40 + (i * 0.5) % 50,
      width: 30 + (i * 0.4) % 35,
      left: (i / 100) * 105 - 2.5,
      delay: (i * 0.06) % 6,
      duration: 3 + (i * 0.03) % 3,
    }))
    
    return { pines, canopies, shrubs }
  }, [])
  
  return (
    <div className="relative w-full h-32 overflow-hidden bg-gradient-to-b from-[#f8f7f4] to-[#006b47]">
      {/* Background layer - solid green base to cover white */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#004d31] via-[#006b47] to-transparent" />
      
      {/* Dense tree forest */}
      <div className="absolute inset-0">
        {/* Back layer - Pine trees */}
        {treeData.pines.map((tree, i) => (
          <div
            key={`pine-${i}`}
            className="absolute tree-pine"
            style={{
              left: `${tree.left}%`,
              bottom: `-20px`,
              width: `${tree.width}px`,
              height: `${tree.height}px`,
              animationDelay: `${tree.delay}s`,
              animationDuration: `${tree.duration}s`,
              opacity: 0.7,
              filter: 'blur(0.5px)',
            }}
          >
            {/* Pine tree shape - triangular layers */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: `${tree.width * 0.5}px solid transparent`,
              borderRight: `${tree.width * 0.5}px solid transparent`,
              borderBottom: `${tree.height * 0.4}px solid ${greenShades[tree.colorIndex]}`,
            }} />
            <div style={{
              position: 'absolute',
              bottom: `${tree.height * 0.25}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: `${tree.width * 0.45}px solid transparent`,
              borderRight: `${tree.width * 0.45}px solid transparent`,
              borderBottom: `${tree.height * 0.35}px solid ${greenShades[1 + tree.colorIndex]}`,
            }} />
            <div style={{
              position: 'absolute',
              bottom: `${tree.height * 0.45}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: `${tree.width * 0.35}px solid transparent`,
              borderRight: `${tree.width * 0.35}px solid transparent`,
              borderBottom: `${tree.height * 0.35}px solid ${greenShades[2 + tree.colorIndex]}`,
            }} />
          </div>
        ))}
        
        {/* Middle layer - Deciduous trees with canopies */}
        {treeData.canopies.map((tree, i) => (
          <div
            key={`tree-${i}`}
            className="absolute tree-canopy"
            style={{
              left: `${tree.left}%`,
              bottom: `-10px`,
              animationDelay: `${tree.delay}s`,
              animationDuration: `${tree.duration}s`,
            }}
          >
            {/* Irregular canopy - multiple circles */}
            <div style={{ position: 'relative', width: `${tree.canopySize}px`, height: `${tree.canopySize}px` }}>
              <div style={{
                position: 'absolute',
                width: `${tree.canopySize * 0.7}px`,
                height: `${tree.canopySize * 0.7}px`,
                backgroundColor: greenShades[3 + (i % 4)],
                borderRadius: '50% 40% 45% 55%',
                left: '15%',
                top: '10%',
              }} />
              <div style={{
                position: 'absolute',
                width: `${tree.canopySize * 0.6}px`,
                height: `${tree.canopySize * 0.6}px`,
                backgroundColor: greenShades[4 + (i % 4)],
                borderRadius: '45% 55% 50% 40%',
                right: '10%',
                top: '20%',
              }} />
              <div style={{
                position: 'absolute',
                width: `${tree.canopySize * 0.5}px`,
                height: `${tree.canopySize * 0.5}px`,
                backgroundColor: greenShades[5 + (i % 3)],
                borderRadius: '55% 45% 60% 40%',
                left: '30%',
                bottom: '5%',
              }} />
            </div>
          </div>
        ))}
        
        {/* Front layer - Dense small trees and shrubs */}
        {treeData.shrubs.map((tree, i) => (
          <div
            key={`shrub-${i}`}
            className="absolute tree-canopy"
            style={{
              left: `${tree.left}%`,
              bottom: `-15px`,
              animationDelay: `${tree.delay}s`,
              animationDuration: `${tree.duration}s`,
            }}
          >
            {/* Shrub/small tree with irregular top */}
            <div style={{
              width: `${tree.width}px`,
              height: `${tree.height}px`,
              backgroundColor: greenShades[6 + (i % 3)],
              clipPath: 'polygon(50% 0%, 80% 20%, 90% 50%, 75% 80%, 100% 100%, 0% 100%, 25% 80%, 10% 50%, 20% 20%)',
            }} />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes sway-tree {
          0%, 100% {
            transform: rotate(0deg) translateX(0);
          }
          33% {
            transform: rotate(1.5deg) translateX(2px);
          }
          66% {
            transform: rotate(-1.5deg) translateX(-2px);
          }
        }
        
        @keyframes sway-tree-strong {
          0%, 100% {
            transform: rotate(0deg) translateX(0);
          }
          33% {
            transform: rotate(3deg) translateX(3px);
          }
          66% {
            transform: rotate(-3deg) translateX(-3px);
          }
        }
        
        .tree-pine, .tree-canopy {
          animation: sway-tree 6s ease-in-out infinite;
          transform-origin: bottom center;
        }
        
        .tree-pine:nth-child(3n), .tree-canopy:nth-child(3n) {
          animation-name: sway-tree-strong;
        }
        
        .tree-pine:nth-child(5n) {
          animation-duration: 5s;
        }
        
        .tree-canopy:nth-child(7n) {
          animation-duration: 4.5s;
        }
      `}</style>
    </div>
  )
}

