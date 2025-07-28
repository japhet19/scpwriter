'use client'

import React, { useMemo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import StarfieldBackground from './StarfieldBackground'
import RomanceBackground from './RomanceBackground'
import FantasyBackground from './FantasyBackground'
import CyberpunkBackground from './CyberpunkBackground'
import NoirBackground from './NoirBackground'
import SCPBackground from './SCPBackground'

interface BackgroundSwitcherProps {
  isStreaming?: boolean
}

export default function BackgroundSwitcher({ isStreaming = false }: BackgroundSwitcherProps) {
  const { currentTheme } = useTheme()
  
  // Get theme-specific background image with stable selection per theme
  const backgroundImage = useMemo(() => {
    const imageCount = currentTheme.id === 'cyberpunk' ? 2 : 3
    // Use theme ID to generate a consistent index instead of random
    const themeHash = currentTheme.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const imageIndex = (themeHash % imageCount) + 1
    return `/images/${currentTheme.id}_${imageIndex}.png`
  }, [currentTheme.id]) // Only recalculate when theme changes
  
  // For themes with special animated backgrounds, keep them
  if (currentTheme.id === 'scifi' && currentTheme.ui.backgroundType === 'starfield') {
    return <StarfieldBackground isStreaming={isStreaming} />
  }
  
  if (currentTheme.id === 'romance' && currentTheme.ui.backgroundType === 'rose-garden') {
    return <RomanceBackground isStreaming={isStreaming} />
  }
  
  if (currentTheme.id === 'fantasy' && currentTheme.ui.backgroundType === 'forest') {
    return <FantasyBackground isStreaming={isStreaming} />
  }
  
  if (currentTheme.id === 'cyberpunk' && currentTheme.ui.backgroundType === 'city-lights') {
    return <CyberpunkBackground isStreaming={isStreaming} />
  }
  
  if (currentTheme.id === 'noir' && currentTheme.ui.backgroundType === 'rain-window') {
    return <NoirBackground isStreaming={isStreaming} />
  }
  
  if (currentTheme.id === 'scp' && currentTheme.ui.backgroundType === 'containment-facility') {
    return <SCPBackground isStreaming={isStreaming} />
  }
  
  // For all other themes, use the actual theme images as backgrounds
  return (
    <div 
      className="theme-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        transition: 'all 1s ease-in-out'
      }}
    />
  )
}