'use client'

import React, { useEffect, useState, useMemo } from 'react'
import styles from './Backgrounds.module.css'

interface RomanceBackgroundProps {
  isStreaming?: boolean
}

export default function RomanceBackground({ isStreaming }: RomanceBackgroundProps) {
  // Stable background image selection
  const backgroundImageIndex = useMemo(() => Math.floor(Math.random() * 3) + 1, [])
  
  // Rose petals configuration
  const [petals, setPetals] = useState<Array<{id: number, left: number, delay: number, duration: number}>>([])
  
  useEffect(() => {
    // Create a small number of rose petals for subtle effect
    const newPetals = []
    for (let i = 0; i < 5; i++) {
      newPetals.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 15,
        duration: 15 + Math.random() * 10
      })
    }
    setPetals(newPetals)
  }, [])
  
  return (
    <div className={styles.backgroundContainer}>
      {/* Base Layer: Background Image */}
      <div 
        className={styles.romanceImageLayer}
        style={{
          backgroundImage: `url(/images/romance_${backgroundImageIndex}.png)`,
          opacity: isStreaming ? 0.3 : 0.5,
          transition: 'opacity 0.5s ease-in-out'
        }}
      />
      
      {/* Middle Layer: Bokeh Light Effect */}
      <div 
        className={styles.romanceBokehLayer}
        style={{
          opacity: isStreaming ? 0.2 : 0.4
        }}
      />
      
      {/* Gradient Overlay */}
      <div 
        className={styles.romanceGradientOverlay}
        style={{
          background: 'linear-gradient(to bottom right, rgba(255,182,193,0.1), rgba(183,110,121,0.2))',
          opacity: isStreaming ? 0.3 : 0.6
        }}
      />
      
      {/* Top Layer: Rose Petals */}
      <div className={styles.romancePetalsContainer}>
        {petals.map(petal => (
          <div
            key={petal.id}
            className={styles.rosePetal}
            style={{
              left: `${petal.left}%`,
              animationDelay: `${petal.delay}s`,
              animationDuration: `${petal.duration}s`,
              animationPlayState: isStreaming ? 'paused' : 'running'
            }}
          >
            🌹
          </div>
        ))}
      </div>
    </div>
  )
}