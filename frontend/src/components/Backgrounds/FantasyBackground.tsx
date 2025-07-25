'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  opacity: number
  velocityX: number
  velocityY: number
  type: 'orb' | 'firefly' | 'sparkle' | 'dust'
  phase: number // For sine wave motion
  pulsePhase: number // For pulsing effect
}

interface FantasyBackgroundProps {
  isStreaming?: boolean
}

export default function FantasyBackground({ isStreaming = false }: FantasyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const { currentTheme } = useTheme()
  const [cursorTrail, setCursorTrail] = useState<Array<{x: number, y: number, opacity: number}>>([])
  
  // Stable background image selection - only set once on component mount
  const [backgroundImageIndex] = useState(() => Math.floor(Math.random() * 3) + 1)

  // Initialize particles
  const initializeParticles = (canvas: HTMLCanvasElement) => {
    const particles: Particle[] = []
    const particleCount = window.innerWidth < 768 ? 30 : 60 // Fewer particles on mobile
    
    for (let i = 0; i < particleCount; i++) {
      const type = Math.random() < 0.3 ? 'orb' : 
                   Math.random() < 0.5 ? 'firefly' : 
                   Math.random() < 0.8 ? 'sparkle' : 'dust'
      
      particles.push({
        id: i,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: type === 'orb' ? 3 + Math.random() * 5 : 
              type === 'firefly' ? 2 + Math.random() * 3 :
              type === 'sparkle' ? 1 + Math.random() * 2 : 
              1 + Math.random() * 1.5,
        color: type === 'orb' ? '#FFD700' : 
               type === 'firefly' ? '#FFD700' :
               type === 'sparkle' ? '#6B46C1' : 
               '#228B22',
        opacity: 0.6 + Math.random() * 0.4,
        velocityX: (Math.random() - 0.5) * 0.5,
        velocityY: type === 'sparkle' ? 0.2 + Math.random() * 0.3 : 
                   -0.1 - Math.random() * 0.2, // Most particles float upward
        type,
        phase: Math.random() * Math.PI * 2,
        pulsePhase: Math.random() * Math.PI * 2
      })
    }
    
    particlesRef.current = particles
  }

  // Update particle positions and properties
  const updateParticles = (canvas: HTMLCanvasElement, deltaTime: number) => {
    particlesRef.current.forEach(particle => {
      // Update positions with sine wave motion for orbs
      if (particle.type === 'orb') {
        particle.phase += 0.02
        particle.x += particle.velocityX + Math.sin(particle.phase) * 0.3
        particle.y += particle.velocityY
      } else {
        particle.x += particle.velocityX
        particle.y += particle.velocityY
      }

      // Firefly attraction to cursor (subtle)
      if (particle.type === 'firefly') {
        const dx = mouseRef.current.x - particle.x
        const dy = mouseRef.current.y - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 100 && distance > 0) {
          const attractionStrength = 0.002
          particle.velocityX += (dx / distance) * attractionStrength
          particle.velocityY += (dy / distance) * attractionStrength
        }
      }

      // Pulsing effect for orbs and fireflies
      if (particle.type === 'orb' || particle.type === 'firefly') {
        particle.pulsePhase += 0.03
        particle.opacity = 0.4 + Math.sin(particle.pulsePhase) * 0.3
      }

      // Sparkle twinkling
      if (particle.type === 'sparkle') {
        particle.opacity = 0.3 + Math.sin(particle.pulsePhase) * 0.7
        particle.pulsePhase += 0.1
      }

      // Wrap around screen edges
      if (particle.x < -particle.size) particle.x = canvas.width + particle.size
      if (particle.x > canvas.width + particle.size) particle.x = -particle.size
      if (particle.y < -particle.size) particle.y = canvas.height + particle.size
      if (particle.y > canvas.height + particle.size) particle.y = -particle.size

      // Limit velocity to prevent runaway particles
      particle.velocityX = Math.max(-2, Math.min(2, particle.velocityX))
      particle.velocityY = Math.max(-2, Math.min(2, particle.velocityY))
    })
  }

  // Render particles
  const renderParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach(particle => {
      ctx.save()
      ctx.globalAlpha = particle.opacity
      
      if (particle.type === 'sparkle') {
        // Draw sparkle as a star shape
        ctx.fillStyle = particle.color
        ctx.beginPath()
        const spikes = 4
        const outerRadius = particle.size
        const innerRadius = particle.size * 0.4
        
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          const angle = (i * Math.PI) / spikes
          const x = particle.x + Math.cos(angle) * radius
          const y = particle.y + Math.sin(angle) * radius
          
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.fill()
      } else {
        // Draw circular particles with glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 2
        )
        gradient.addColorStop(0, particle.color)
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2)
        ctx.fill()
        
        // Inner bright core
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
      
      ctx.restore()
    })
  }

  // Render cursor trail
  const renderCursorTrail = (ctx: CanvasRenderingContext2D) => {
    cursorTrail.forEach((point, index) => {
      if (point.opacity > 0) {
        ctx.save()
        ctx.globalAlpha = point.opacity
        
        const gradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, 8
        )
        gradient.addColorStop(0, '#FFD700')
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.restore()
      }
    })
  }

  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Only update particles if not streaming (to reduce flicker during streaming)
    if (!isStreaming) {
      updateParticles(canvas, 16) // Assume 60fps for delta time
    }
    renderParticles(ctx)
    
    // Update and render cursor trail (keep cursor trail even during streaming)
    setCursorTrail(prev => 
      prev.map(point => ({ ...point, opacity: point.opacity * 0.95 }))
          .filter(point => point.opacity > 0.01)
    )
    renderCursorTrail(ctx)

    animationRef.current = requestAnimationFrame(animate)
  }

  // Handle mouse movement
  const handleMouseMove = (e: MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    // Add to cursor trail
    setCursorTrail(prev => [
      ...prev.slice(-8), // Keep last 8 points
      { x: mouseRef.current.x, y: mouseRef.current.y, opacity: 0.8 }
    ])
  }

  // Setup canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initializeParticles(canvas)
    }

    resizeCanvas()
    animate()

    // Event listeners
    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Respect reduced motion preference
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <>
      {/* Static background image layer */}
      <div 
        className="fantasy-static-bg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          backgroundImage: `linear-gradient(rgba(26, 15, 31, 0.7), rgba(26, 15, 31, 0.8)), url(/images/fantasy_${backgroundImageIndex}.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      />
      
      {/* Animated mist layers */}
      <div className="fantasy-mist-layer-1" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '120%',
        height: '100%',
        zIndex: 2,
        background: 'linear-gradient(90deg, transparent 0%, rgba(107, 70, 193, 0.1) 50%, transparent 100%)',
        animation: isStreaming ? 'none' : 'mysticalMist1 30s linear infinite',
        opacity: isStreaming ? 0.5 : 1 // Reduce opacity during streaming
      }} />
      
      <div className="fantasy-mist-layer-2" style={{
        position: 'fixed',
        top: 0,
        left: '-20%',
        width: '120%',
        height: '100%',
        zIndex: 2,
        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.05) 50%, transparent 100%)',
        animation: isStreaming ? 'none' : 'mysticalMist2 45s linear infinite reverse',
        opacity: isStreaming ? 0.5 : 1 // Reduce opacity during streaming
      }} />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: isStreaming ? 1 : 3, // Lower z-index during streaming to reduce interference
          pointerEvents: 'none',
          opacity: isStreaming ? 0.3 : 1, // Reduce opacity during streaming for less distraction
        }}
      />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes mysticalMist1 {
          0% { transform: translateX(-20%); }
          100% { transform: translateX(0%); }
        }
        
        @keyframes mysticalMist2 {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-20%); }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .fantasy-mist-layer-1,
          .fantasy-mist-layer-2 {
            animation: none;
          }
        }
      `}</style>
    </>
  )
}