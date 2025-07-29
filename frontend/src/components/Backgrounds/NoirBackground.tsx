'use client'

import React, { useEffect, useRef, useState } from 'react'
import styles from './Backgrounds.module.css'

interface NoirBackgroundProps {
  isStreaming?: boolean
}

interface RainDrop {
  x: number
  y: number
  length: number
  speed: number
  opacity: number
  streak: { x: number, y: number }[]
}

interface SmokeParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  life: number
}

interface WindowLight {
  x: number
  y: number
  width: number
  height: number
  on: boolean
  flicker: number
}

interface Building {
  x: number
  width: number
  height: number
}

export default function NoirBackground({ isStreaming = false }: NoirBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const dropsRef = useRef<RainDrop[]>([])
  const smokeRef = useRef<SmokeParticle[]>([])
  const lightsRef = useRef<WindowLight[]>([])
  const buildingsRef = useRef<Building[]>([])
  const [reducedMotion, setReducedMotion] = useState(false)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Initialize rain drops
  const initializeRain = (canvas: HTMLCanvasElement) => {
    const drops: RainDrop[] = []
    const dropCount = 100
    
    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: Math.random() * 20 + 10,
        speed: Math.random() * 4 + 2,
        opacity: Math.random() * 0.3 + 0.1,
        streak: []
      })
    }
    
    dropsRef.current = drops
  }

  // Initialize smoke particles
  const initializeSmoke = (canvas: HTMLCanvasElement) => {
    const particles: SmokeParticle[] = []
    const particleCount = 15
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height - Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.3 - 0.1,
        size: Math.random() * 100 + 50,
        opacity: Math.random() * 0.15 + 0.05,
        life: 1
      })
    }
    
    smokeRef.current = particles
  }

  // Initialize buildings
  const initializeBuildings = (canvas: HTMLCanvasElement) => {
    const buildings: Building[] = []
    const buildingCount = 8
    
    for (let i = 0; i < buildingCount; i++) {
      buildings.push({
        x: (canvas.width / buildingCount) * i,
        width: canvas.width / buildingCount - 10,
        height: Math.random() * 200 + 150
      })
    }
    
    buildingsRef.current = buildings
  }

  // Initialize city lights
  const initializeLights = (canvas: HTMLCanvasElement) => {
    const lights: WindowLight[] = []
    const buildings = buildingsRef.current
    
    buildings.forEach((building, b) => {
      const windowRows = Math.floor(building.height / 30)
      const windowCols = 3 + Math.floor(Math.random() * 3)
      
      for (let r = 0; r < windowRows; r++) {
        for (let c = 0; c < windowCols; c++) {
          lights.push({
            x: building.x + 15 + c * 25,
            y: canvas.height - building.height + r * 30 + 20,
            width: 15,
            height: 20,
            on: Math.random() > 0.3,
            flicker: Math.random() * 0.02
          })
        }
      }
    })
    
    lightsRef.current = lights
  }

  // Update rain
  const updateRain = (canvas: HTMLCanvasElement) => {
    dropsRef.current.forEach(drop => {
      drop.y += drop.speed
      
      // Add to streak
      drop.streak.push({ x: drop.x, y: drop.y })
      if (drop.streak.length > drop.length) {
        drop.streak.shift()
      }
      
      // Reset when off screen
      if (drop.y > canvas.height) {
        drop.y = -drop.length
        drop.x = Math.random() * canvas.width
        drop.streak = []
      }
    })
  }

  // Update smoke
  const updateSmoke = () => {
    smokeRef.current.forEach(particle => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.life -= 0.005
      particle.opacity = particle.life * (Math.random() * 0.15 + 0.05)
      
      // Reset when faded
      if (particle.life <= 0) {
        particle.x = Math.random() * canvasRef.current!.width
        particle.y = canvasRef.current!.height - Math.random() * 100
        particle.life = 1
      }
    })
  }

  // Update lights
  const updateLights = () => {
    lightsRef.current.forEach(light => {
      if (Math.random() < light.flicker) {
        light.on = !light.on
      }
    })
  }

  // Draw city silhouette
  const drawCity = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Draw buildings using stored data
    ctx.fillStyle = '#0a0a0a'
    buildingsRef.current.forEach(building => {
      ctx.fillRect(building.x, canvas.height - building.height, building.width, building.height)
    })
    
    // Draw windows
    lightsRef.current.forEach(light => {
      if (light.on) {
        ctx.fillStyle = `rgba(255, 235, 180, ${0.3 + Math.random() * 0.3})`
        ctx.fillRect(light.x, light.y, light.width, light.height)
      }
    })
  }

  // Draw rain
  const drawRain = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)'
    ctx.lineWidth = 1
    
    dropsRef.current.forEach(drop => {
      ctx.beginPath()
      drop.streak.forEach((point, index) => {
        const opacity = (index / drop.streak.length) * drop.opacity
        ctx.strokeStyle = `rgba(200, 200, 200, ${opacity})`
        
        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.stroke()
    })
  }

  // Draw smoke
  const drawSmoke = (ctx: CanvasRenderingContext2D) => {
    smokeRef.current.forEach(particle => {
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      )
      gradient.addColorStop(0, `rgba(150, 150, 150, ${particle.opacity})`)
      gradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = gradient
      ctx.fillRect(
        particle.x - particle.size,
        particle.y - particle.size,
        particle.size * 2,
        particle.size * 2
      )
    })
  }

  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    
    if (!canvas || !ctx || reducedMotion) return
    
    // Clear canvas with dark gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#0a0a0a')
    gradient.addColorStop(1, '#1a1a1a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw layers in order
    drawCity(ctx, canvas)
    drawSmoke(ctx)
    drawRain(ctx)
    
    // Update animations only when not streaming
    if (!isStreaming) {
      updateRain(canvas)
      updateSmoke()
      updateLights()
    }
    
    // Draw venetian blind shadows
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.fillRect(0, i, canvas.width, 10)
    }
    
    // Add film grain
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 30
      data[i] += grain     // red
      data[i + 1] += grain // green
      data[i + 2] += grain // blue
    }
    ctx.putImageData(imageData, 0, 0)
    
    animationRef.current = requestAnimationFrame(animate)
  }

  // Handle canvas resize
  const resizeCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    initializeRain(canvas)
    initializeSmoke(canvas)
    initializeBuildings(canvas)
    initializeLights(canvas)
  }

  // Setup and cleanup
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reducedMotion) return
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [isStreaming, reducedMotion])

  return (
    <>
      <canvas
        ref={canvasRef}
        className={styles.noirCanvas}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: isStreaming ? 1 : 3,
          opacity: isStreaming ? 0.5 : 1,
          transition: 'opacity 0.5s ease',
          pointerEvents: 'none'
        }}
      />
      
      {/* Additional film noir overlay */}
      <div 
        className={styles.noirOverlay}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)`,
          zIndex: 2,
          pointerEvents: 'none',
          opacity: isStreaming ? 0.3 : 0.7,
          transition: 'opacity 0.5s ease'
        }}
      />
    </>
  )
}