'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import StarfieldBackground from './StarfieldBackground'
import RomanceBackground from './RomanceBackground'

export default function BackgroundSwitcher() {
  const { currentTheme } = useTheme()
  
  switch (currentTheme.ui.backgroundType) {
    case 'starfield':
      return <StarfieldBackground />
    case 'rose-garden':
      return <RomanceBackground />
    case 'grid':
      return <div className="background-grid" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
    default:
      // For other backgrounds, just use CSS classes for now
      return <div className={`background-${currentTheme.ui.backgroundType}`} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
  }
}