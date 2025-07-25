'use client'

import React, { useEffect, useRef } from 'react'
import styles from './Backgrounds.module.css'

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
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
    const speed = 0.005
    
    // Initialize stars
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        z: Math.random() * 1000,
        prevZ: 0
      })
    }
    
    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 8, 20, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      
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
      
      animationId = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])
  
  return <canvas ref={canvasRef} className={styles.backgroundCanvas} />
}