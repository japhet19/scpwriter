'use client'

import React, { useEffect, useRef, useState } from 'react'
import styles from './Backgrounds.module.css'

interface SCPBackgroundProps {
  isStreaming?: boolean
}

interface RedactedDocument {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  vr: number
  width: number
  height: number
  redactionLevel: number
}

interface SecurityCamera {
  x: number
  y: number
  glitchLevel: number
  scanLine: number
  active: boolean
}

interface WarningLight {
  x: number
  y: number
  active: boolean
  pulsePhase: number
}

export default function SCPBackground({ isStreaming = false }: SCPBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gridCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const documentsRef = useRef<RedactedDocument[]>([])
  const camerasRef = useRef<SecurityCamera[]>([])
  const lightsRef = useRef<WarningLight[]>([])
  const [reducedMotion, setReducedMotion] = useState(false)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Initialize redacted documents
  const initializeDocuments = (canvas: HTMLCanvasElement) => {
    const documents: RedactedDocument[] = []
    const docCount = 8
    
    for (let i = 0; i < docCount; i++) {
      documents.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.01,
        width: 150 + Math.random() * 100,
        height: 200 + Math.random() * 100,
        redactionLevel: Math.random()
      })
    }
    
    documentsRef.current = documents
  }

  // Initialize security cameras
  const initializeCameras = (canvas: HTMLCanvasElement) => {
    const cameras: SecurityCamera[] = []
    const cameraCount = 4
    
    for (let i = 0; i < cameraCount; i++) {
      cameras.push({
        x: (canvas.width / cameraCount) * i + canvas.width / (cameraCount * 2),
        y: 50,
        glitchLevel: 0,
        scanLine: 0,
        active: true
      })
    }
    
    camerasRef.current = cameras
  }

  // Initialize warning lights
  const initializeLights = (canvas: HTMLCanvasElement) => {
    const lights: WarningLight[] = []
    
    // Corner warning lights
    lights.push(
      { x: 50, y: 50, active: true, pulsePhase: 0 },
      { x: canvas.width - 50, y: 50, active: true, pulsePhase: Math.PI / 2 },
      { x: 50, y: canvas.height - 50, active: true, pulsePhase: Math.PI },
      { x: canvas.width - 50, y: canvas.height - 50, active: true, pulsePhase: Math.PI * 1.5 }
    )
    
    lightsRef.current = lights
  }

  // Draw security grid
  const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)'
    ctx.lineWidth = 1
    
    // Hexagonal grid pattern
    const hexSize = 30
    const hexHeight = hexSize * Math.sqrt(3)
    
    for (let row = 0; row < canvas.height / hexHeight + 1; row++) {
      for (let col = 0; col < canvas.width / (hexSize * 1.5) + 1; col++) {
        const x = col * hexSize * 1.5
        const y = row * hexHeight + (col % 2 ? hexHeight / 2 : 0)
        
        drawHexagon(ctx, x, y, hexSize)
      }
    }
  }

  // Draw hexagon
  const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const px = x + size * Math.cos(angle)
      const py = y + size * Math.sin(angle)
      
      if (i === 0) {
        ctx.moveTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    }
    ctx.closePath()
    ctx.stroke()
  }

  // Update documents
  const updateDocuments = (canvas: HTMLCanvasElement) => {
    documentsRef.current.forEach(doc => {
      doc.x += doc.vx
      doc.y += doc.vy
      doc.rotation += doc.vr
      
      // Bounce off edges
      if (doc.x < 0 || doc.x > canvas.width - doc.width) doc.vx *= -1
      if (doc.y < 0 || doc.y > canvas.height - doc.height) doc.vy *= -1
      
      // Keep in bounds
      doc.x = Math.max(0, Math.min(canvas.width - doc.width, doc.x))
      doc.y = Math.max(0, Math.min(canvas.height - doc.height, doc.y))
    })
  }

  // Update cameras
  const updateCameras = () => {
    camerasRef.current.forEach(camera => {
      camera.scanLine = (camera.scanLine + 2) % 100
      
      // Random glitch effect
      if (Math.random() < 0.02) {
        camera.glitchLevel = Math.random()
      } else {
        camera.glitchLevel *= 0.9
      }
    })
  }

  // Update warning lights
  const updateLights = () => {
    lightsRef.current.forEach(light => {
      light.pulsePhase += 0.05
      light.active = isStreaming || Math.sin(light.pulsePhase) > 0
    })
  }

  // Draw redacted documents
  const drawDocuments = (ctx: CanvasRenderingContext2D) => {
    documentsRef.current.forEach(doc => {
      ctx.save()
      ctx.translate(doc.x + doc.width / 2, doc.y + doc.height / 2)
      ctx.rotate(doc.rotation)
      
      // Document background
      ctx.fillStyle = 'rgba(200, 200, 200, 0.1)'
      ctx.fillRect(-doc.width / 2, -doc.height / 2, doc.width, doc.height)
      
      // Document border
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)'
      ctx.strokeRect(-doc.width / 2, -doc.height / 2, doc.width, doc.height)
      
      // Redaction bars
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      const barHeight = 8
      const barCount = Math.floor(doc.height / (barHeight * 3) * doc.redactionLevel)
      
      for (let i = 0; i < barCount; i++) {
        const y = -doc.height / 2 + 20 + i * barHeight * 3
        ctx.fillRect(-doc.width / 2 + 10, y, doc.width - 20, barHeight)
      }
      
      // Classification stamp
      ctx.fillStyle = 'rgba(139, 0, 0, 0.6)'
      ctx.font = 'bold 12px monospace'
      ctx.fillText('CLASSIFIED', -doc.width / 2 + 10, -doc.height / 2 + 15)
      
      ctx.restore()
    })
  }

  // Draw security cameras
  const drawCameras = (ctx: CanvasRenderingContext2D) => {
    camerasRef.current.forEach(camera => {
      // Camera body
      ctx.fillStyle = 'rgba(50, 50, 50, 0.8)'
      ctx.fillRect(camera.x - 30, camera.y - 15, 60, 30)
      
      // Camera lens
      ctx.beginPath()
      ctx.arc(camera.x, camera.y, 10, 0, Math.PI * 2)
      ctx.fillStyle = camera.active ? 'rgba(255, 0, 0, 0.8)' : 'rgba(100, 100, 100, 0.8)'
      ctx.fill()
      
      // Scan line effect
      if (camera.active) {
        ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + camera.glitchLevel * 0.5})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(camera.x, camera.y)
        const scanAngle = (camera.scanLine / 100) * Math.PI * 2
        ctx.lineTo(
          camera.x + Math.cos(scanAngle) * 100,
          camera.y + Math.sin(scanAngle) * 100
        )
        ctx.stroke()
      }
      
      // Glitch effect
      if (camera.glitchLevel > 0.5) {
        ctx.fillStyle = `rgba(255, 0, 0, ${camera.glitchLevel * 0.3})`
        ctx.fillRect(
          camera.x - 35 + Math.random() * 10,
          camera.y - 20 + Math.random() * 10,
          70,
          40
        )
      }
    })
  }

  // Draw warning lights
  const drawLights = (ctx: CanvasRenderingContext2D) => {
    lightsRef.current.forEach(light => {
      if (light.active) {
        const intensity = (Math.sin(light.pulsePhase) + 1) / 2
        
        // Light glow
        const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 30)
        gradient.addColorStop(0, `rgba(255, 176, 0, ${intensity * 0.8})`)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.fillRect(light.x - 30, light.y - 30, 60, 60)
        
        // Light core
        ctx.beginPath()
        ctx.arc(light.x, light.y, 8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 176, 0, ${intensity})`
        ctx.fill()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.stroke()
      }
    })
  }

  // Draw static overlay
  const drawStatic = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 20
      data[i] += noise     // red
      data[i + 1] += noise // green
      data[i + 2] += noise // blue
    }
    
    ctx.putImageData(imageData, 0, 0)
  }

  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    
    if (!canvas || !ctx || reducedMotion) return
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw layers
    drawDocuments(ctx)
    drawCameras(ctx)
    drawLights(ctx)
    
    // Update animations only when not streaming
    if (!isStreaming) {
      updateDocuments(canvas)
      updateCameras()
    }
    
    // Always update warning lights
    updateLights()
    
    // Add static effect
    if (Math.random() < 0.1) {
      drawStatic(ctx, canvas)
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }

  // Handle canvas resize
  const resizeCanvas = () => {
    const canvas = canvasRef.current
    const gridCanvas = gridCanvasRef.current
    
    if (!canvas || !gridCanvas) return
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    gridCanvas.width = window.innerWidth
    gridCanvas.height = window.innerHeight
    
    // Redraw static grid
    const gridCtx = gridCanvas.getContext('2d')
    if (gridCtx) {
      drawGrid(gridCtx, gridCanvas)
    }
    
    initializeDocuments(canvas)
    initializeCameras(canvas)
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
      {/* Static grid layer */}
      <canvas
        ref={gridCanvasRef}
        className={styles.scpGridCanvas}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          opacity: 0.3,
          pointerEvents: 'none'
        }}
      />
      
      {/* Animated elements layer */}
      <canvas
        ref={canvasRef}
        className={styles.scpCanvas}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: isStreaming ? 2 : 3,
          opacity: isStreaming ? 0.5 : 1,
          transition: 'opacity 0.5s ease',
          pointerEvents: 'none'
        }}
      />
      
      {/* Security overlay */}
      <div 
        className={styles.scpOverlay}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `linear-gradient(to bottom, 
            transparent 0%, 
            rgba(0, 0, 0, 0.1) 50%, 
            transparent 100%)`,
          zIndex: 2,
          pointerEvents: 'none',
          opacity: isStreaming ? 0.3 : 0.5,
          transition: 'opacity 0.5s ease'
        }}
      />
    </>
  )
}