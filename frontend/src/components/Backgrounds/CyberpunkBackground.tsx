'use client'

import React, { useEffect, useRef, useState } from 'react'
import styles from './Backgrounds.module.css'

interface CyberpunkBackgroundProps {
  isStreaming?: boolean
}

interface DigitalRainDrop {
  x: number
  y: number
  speed: number
  length: number
  opacity: number
  char: string
}

interface NeonParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  glow: number
  pulsePhase: number
}

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()<>?[]{}|+-=_'
const NEON_COLORS = ['#00ffff', '#ff00ff', '#ff0080', '#00ff88', '#8000ff']

export default function CyberpunkBackground({ isStreaming = false }: CyberpunkBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const dropsRef = useRef<DigitalRainDrop[]>([])
  const particlesRef = useRef<NeonParticle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const [reducedMotion, setReducedMotion] = useState(false)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Initialize digital rain drops
  const initializeRain = (canvas: HTMLCanvasElement) => {
    const drops: DigitalRainDrop[] = []
    const columns = Math.floor(canvas.width / 20)
    
    for (let i = 0; i < columns; i++) {
      drops.push({
        x: i * 20 + 10,
        y: Math.random() * canvas.height,
        speed: 2 + Math.random() * 3,
        length: 10 + Math.random() * 20,
        opacity: 0.1 + Math.random() * 0.5,
        char: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
      })
    }
    
    dropsRef.current = drops
  }

  // Initialize neon particles
  const initializeParticles = (canvas: HTMLCanvasElement) => {
    const particles: NeonParticle[] = []
    const particleCount = 30
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 2 + Math.random() * 4,
        color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
        glow: 10 + Math.random() * 20,
        pulsePhase: Math.random() * Math.PI * 2
      })
    }
    
    particlesRef.current = particles
  }

  // Update digital rain
  const updateRain = (canvas: HTMLCanvasElement) => {
    dropsRef.current.forEach(drop => {
      drop.y += drop.speed
      
      // Reset drop when it goes off screen
      if (drop.y > canvas.height + drop.length * 20) {
        drop.y = -drop.length * 20
        drop.char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
      }
      
      // Change character occasionally
      if (Math.random() < 0.01) {
        drop.char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
      }
    })
  }

  // Update neon particles
  const updateParticles = (canvas: HTMLCanvasElement) => {
    particlesRef.current.forEach(particle => {
      // Mouse attraction effect
      const dx = mouseRef.current.x - particle.x
      const dy = mouseRef.current.y - particle.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 150) {
        const force = (150 - distance) / 150 * 0.02
        particle.vx += (dx / distance) * force
        particle.vy += (dy / distance) * force
      }
      
      // Update position
      particle.x += particle.vx
      particle.y += particle.vy
      
      // Apply damping
      particle.vx *= 0.98
      particle.vy *= 0.98
      
      // Wrap around edges
      if (particle.x < 0) particle.x = canvas.width
      if (particle.x > canvas.width) particle.x = 0
      if (particle.y < 0) particle.y = canvas.height
      if (particle.y > canvas.height) particle.y = 0
      
      // Update pulse
      particle.pulsePhase += 0.05
    })
  }

  // Render digital rain
  const renderRain = (ctx: CanvasRenderingContext2D) => {
    dropsRef.current.forEach(drop => {
      // Draw trail
      for (let i = 0; i < drop.length; i++) {
        const y = drop.y - i * 20
        const opacity = drop.opacity * (1 - i / drop.length) * (isStreaming ? 0.3 : 1)
        
        ctx.fillStyle = `rgba(0, 255, 255, ${opacity})`
        ctx.font = '16px "Share Tech Mono", monospace'
        ctx.fillText(drop.char, drop.x, y)
        
        // Add glow effect for the leading character
        if (i === 0) {
          ctx.shadowBlur = isStreaming ? 5 : 10
          ctx.shadowColor = '#00ffff'
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
          ctx.fillText(drop.char, drop.x, y)
          ctx.shadowBlur = 0
        }
      }
    })
  }

  // Render neon particles
  const renderParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach(particle => {
      const pulse = Math.sin(particle.pulsePhase) * 0.5 + 0.5
      const opacity = isStreaming ? 0.4 : 0.8
      
      // Draw glow
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size + particle.glow * pulse, 0, Math.PI * 2)
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size + particle.glow * pulse
      )
      gradient.addColorStop(0, `${particle.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(1, `${particle.color}00`)
      ctx.fillStyle = gradient
      ctx.fill()
      
      // Draw core
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.fill()
    })
  }

  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    
    if (!canvas || !ctx || reducedMotion) return
    
    // Clear with fade effect
    ctx.fillStyle = 'rgba(10, 0, 20, 0.1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Update and render
    if (!isStreaming) {
      updateRain(canvas)
      updateParticles(canvas)
    }
    
    renderRain(ctx)
    renderParticles(ctx)
    
    // Draw grid overlay
    ctx.strokeStyle = `rgba(0, 255, 255, ${isStreaming ? 0.02 : 0.05})`
    ctx.lineWidth = 1
    const gridSize = 100
    
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }

  // Handle canvas resize
  const resizeCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    initializeRain(canvas)
    initializeParticles(canvas)
  }

  // Handle mouse movement
  const handleMouseMove = (e: MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY }
  }

  // Setup and cleanup
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reducedMotion) return
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('mousemove', handleMouseMove)
    
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isStreaming, reducedMotion])

  return (
    <>
      <canvas
        ref={canvasRef}
        className={styles.cyberpunkCanvas}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: isStreaming ? 1 : 3,
          opacity: isStreaming ? 0.3 : 1,
          transition: 'opacity 0.5s ease',
          pointerEvents: 'none'
        }}
      />
      
      {/* Neon city overlay */}
      <div 
        className={styles.neonCityOverlay}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '40%',
          background: `linear-gradient(to top, 
            rgba(255, 0, 128, 0.1) 0%, 
            rgba(0, 255, 255, 0.05) 20%, 
            transparent 100%)`,
          zIndex: 2,
          pointerEvents: 'none',
          opacity: isStreaming ? 0.3 : 0.7,
          transition: 'opacity 0.5s ease'
        }}
      />
      
      {/* Scan lines effect */}
      <div 
        className={styles.scanLines}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 255, 0.03) 2px,
            rgba(0, 255, 255, 0.03) 4px
          )`,
          zIndex: 2,
          pointerEvents: 'none',
          opacity: isStreaming ? 0.5 : 1,
          animation: isStreaming ? 'none' : 'scanMove 8s linear infinite'
        }}
      />
    </>
  )
}