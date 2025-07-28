'use client'

import React, { useState, useEffect } from 'react'
import styles from './Terminal.module.css'
import { useTheme } from '@/contexts/ThemeContext'

interface TerminalProps {
  children: React.ReactNode
  title?: string
  showHeader?: boolean
}

export default function Terminal({ children, title, showHeader = true }: TerminalProps) {
  const { currentTheme } = useTheme()
  const displayTitle = title || currentTheme.ui.mainTitle
  const [time, setTime] = useState('')
  const [isFlickering, setIsFlickering] = useState(false)

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      const now = new Date()
      setTime(now.toUTCString().slice(-12, -4))
    }, 1000)

    // Random flicker effect
    const flickerTimer = setInterval(() => {
      if (Math.random() < 0.05) { // 5% chance every second
        setIsFlickering(true)
        setTimeout(() => setIsFlickering(false), 150)
      }
    }, 1000)

    return () => {
      clearInterval(timer)
      clearInterval(flickerTimer)
    }
  }, [])

  return (
    <div className={`crt-container ${isFlickering ? 'crt-flicker' : ''}`}>
      <div className="terminal-window">
        {showHeader && (
          <div className="terminal-header">
            <div className="terminal-title text-glow">
              <span className={styles.plotcraftLabel}>PLOTCRAFT &gt; </span>
              {displayTitle}
            </div>
            <div className="terminal-status">
              <span>{currentTheme.ui.statusText}</span>
              <span className="alert-amber">{currentTheme.id === 'scp' ? 'LVL-3' : 'ACTIVE'}</span>
              <span>{time} UTC</span>
            </div>
          </div>
        )}
        <div className={styles.terminalContent}>
          {children}
        </div>
      </div>
    </div>
  )
}