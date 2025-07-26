'use client'

import React, { useEffect, useRef, useState } from 'react'
import styles from './Backgrounds.module.css'

interface StarfieldBackgroundProps {
  isStreaming?: boolean
}

export default function StarfieldBackground({ isStreaming = false }: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  
  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reducedMotion) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    // Star properties
    const stars: Array<{x: number, y: number, z: number, prevZ: number}> = []
    const numStars = 200
    const baseSpeed = 0.005
    
    // Nebula properties
    const nebulas: Array<{x: number, y: number, size: number, color: string, opacity: number}> = []
    const numNebulas = 3
    
    // Shooting stars
    const shootingStars: Array<{x: number, y: number, vx: number, vy: number, trail: Array<{x: number, y: number}>, active: boolean}> = []
    
    // Galaxies
    const galaxies: Array<{x: number, y: number, size: number, rotation: number, arms: number}> = []
    const numGalaxies = 2
    
    // Planet silhouettes
    const planets: Array<{x: number, y: number, radius: number, color: string}> = []
    const numPlanets = 2
    
    // Initialize stars
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        z: Math.random() * 1000,
        prevZ: 0
      })
    }
    
    // Initialize nebulas
    for (let i = 0; i < numNebulas; i++) {
      const colors = ['rgba(0, 229, 255, 0.1)', 'rgba(124, 77, 255, 0.1)', 'rgba(100, 255, 218, 0.1)']
      nebulas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 300 + 200,
        color: colors[i % colors.length],
        opacity: Math.random() * 0.3 + 0.1
      })
    }
    
    // Initialize galaxies
    for (let i = 0; i < numGalaxies; i++) {
      galaxies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 50 + 30,
        rotation: Math.random() * Math.PI * 2,
        arms: Math.floor(Math.random() * 3) + 2
      })
    }
    
    // Initialize planets
    for (let i = 0; i < numPlanets; i++) {
      const side = Math.random() < 0.5 ? 0 : 1 // Left or right edge
      planets.push({
        x: side ? canvas.width - Math.random() * 100 : Math.random() * 100,
        y: Math.random() * canvas.height,
        radius: Math.random() * 150 + 100,
        color: i === 0 ? 'rgba(124, 77, 255, 0.1)' : 'rgba(0, 229, 255, 0.1)'
      })
    }
    
    // Function to spawn shooting star
    const spawnShootingStar = () => {
      if (shootingStars.filter(s => s.active).length < 2) {
        const angle = Math.random() * Math.PI * 2
        const speed = 15 + Math.random() * 10
        shootingStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.5,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          trail: [],
          active: true
        })
      }
    }
    
    // Function to draw galaxy
    const drawGalaxy = (galaxy: typeof galaxies[0]) => {
      ctx.save()
      ctx.translate(galaxy.x, galaxy.y)
      
      // Update rotation
      if (!isStreaming) {
        galaxy.rotation += 0.0001
      }
      ctx.rotate(galaxy.rotation)
      
      // Draw spiral arms
      for (let arm = 0; arm < galaxy.arms; arm++) {
        const armAngle = (Math.PI * 2 / galaxy.arms) * arm
        ctx.rotate(armAngle)
        
        // Draw spiral using dots
        for (let i = 0; i < 50; i++) {
          const angle = i * 0.2
          const radius = i * galaxy.size / 50
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius * 0.5
          
          const opacity = (1 - i / 50) * 0.3
          ctx.fillStyle = `rgba(224, 247, 250, ${opacity})`
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fill()
        }
        
        ctx.rotate(-armAngle)
      }
      
      // Draw galactic core
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxy.size * 0.3)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)')
      gradient.addColorStop(0.5, 'rgba(100, 255, 218, 0.3)')
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(0, 0, galaxy.size * 0.3, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()
    }
    
    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 8, 20, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw planets (furthest background)
      planets.forEach(planet => {
        const gradient = ctx.createRadialGradient(
          planet.x, planet.y, planet.radius * 0.7,
          planet.x, planet.y, planet.radius
        )
        gradient.addColorStop(0, planet.color)
        gradient.addColorStop(0.8, planet.color.replace('0.1', '0.05'))
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2)
        ctx.fill()
        
        // Add subtle atmosphere glow
        const glowGradient = ctx.createRadialGradient(
          planet.x, planet.y, planet.radius,
          planet.x, planet.y, planet.radius * 1.2
        )
        glowGradient.addColorStop(0, 'transparent')
        glowGradient.addColorStop(0.5, planet.color.replace('0.1', '0.02'))
        glowGradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(planet.x, planet.y, planet.radius * 1.2, 0, Math.PI * 2)
        ctx.fill()
      })
      
      // Draw nebulas (background layer)
      nebulas.forEach(nebula => {
        const gradient = ctx.createRadialGradient(
          nebula.x, nebula.y, 0,
          nebula.x, nebula.y, nebula.size
        )
        gradient.addColorStop(0, nebula.color.replace('0.1', String(nebula.opacity)))
        gradient.addColorStop(0.5, nebula.color.replace('0.1', String(nebula.opacity * 0.5)))
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.fillRect(
          nebula.x - nebula.size,
          nebula.y - nebula.size,
          nebula.size * 2,
          nebula.size * 2
        )
        
        // Update nebula position (very slow drift)
        if (!isStreaming) {
          nebula.x += 0.01
          nebula.y += 0.005
          
          // Wrap around
          if (nebula.x > canvas.width + nebula.size) nebula.x = -nebula.size
          if (nebula.y > canvas.height + nebula.size) nebula.y = -nebula.size
        }
      })
      
      // Draw galaxies
      galaxies.forEach(galaxy => {
        drawGalaxy(galaxy)
      })
      
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const speed = isStreaming ? baseSpeed * 0.5 : baseSpeed * 2
      
      // Draw stars
      stars.forEach(star => {
        star.prevZ = star.z
        star.z -= speed * 1000
        
        if (star.z <= 0) {
          star.x = Math.random() * 2000 - 1000
          star.y = Math.random() * 2000 - 1000
          star.z = 1000
          star.prevZ = star.z
        }
        
        // Project star position
        const x = (star.x / star.z) * 1000 + centerX
        const y = (star.y / star.z) * 1000 + centerY
        const prevX = (star.x / star.prevZ) * 1000 + centerX
        const prevY = (star.y / star.prevZ) * 1000 + centerY
        
        const size = (1 - star.z / 1000) * 2
        const opacity = 1 - star.z / 1000
        
        ctx.strokeStyle = `rgba(224, 247, 250, ${opacity})`
        ctx.lineWidth = size
        ctx.beginPath()
        ctx.moveTo(prevX, prevY)
        ctx.lineTo(x, y)
        ctx.stroke()
      })
      
      // Spawn shooting stars occasionally
      if (!isStreaming && Math.random() < 0.002) {
        spawnShootingStar()
      }
      
      // Update and draw shooting stars
      shootingStars.forEach(shootingStar => {
        if (!shootingStar.active) return
        
        // Update position
        shootingStar.x += shootingStar.vx
        shootingStar.y += shootingStar.vy
        
        // Add to trail
        shootingStar.trail.push({ x: shootingStar.x, y: shootingStar.y })
        if (shootingStar.trail.length > 20) {
          shootingStar.trail.shift()
        }
        
        // Draw trail
        ctx.strokeStyle = 'rgba(100, 255, 218, 0.8)'
        ctx.lineWidth = 3
        ctx.beginPath()
        shootingStar.trail.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.lineTo(point.x, point.y)
          }
        })
        ctx.stroke()
        
        // Draw head
        ctx.fillStyle = 'rgba(255, 255, 255, 1)'
        ctx.beginPath()
        ctx.arc(shootingStar.x, shootingStar.y, 3, 0, Math.PI * 2)
        ctx.fill()
        
        // Deactivate if out of bounds
        if (shootingStar.x < -50 || shootingStar.x > canvas.width + 50 ||
            shootingStar.y < -50 || shootingStar.y > canvas.height + 50) {
          shootingStar.active = false
        }
      })
      
      // Clean up inactive shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        if (!shootingStars[i].active) {
          shootingStars.splice(i, 1)
        }
      }
      
      animationId = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [isStreaming, reducedMotion])
  
  return <canvas ref={canvasRef} className={styles.backgroundCanvas} />
}