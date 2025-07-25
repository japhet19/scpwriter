'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { StoryTheme, getTheme, suggestTheme } from '@/themes/themeConfig'

interface ThemeContextType {
  currentTheme: StoryTheme
  themeId: string
  setTheme: (themeId: string) => void
  suggestThemeForStory: (description: string) => string
  isTransitioning: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  initialTheme?: string
}

export function ThemeProvider({ children, initialTheme = 'scp' }: ThemeProviderProps) {
  const [themeId, setThemeId] = useState(initialTheme)
  const [currentTheme, setCurrentTheme] = useState(getTheme(initialTheme))
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Apply theme CSS variables
  useEffect(() => {
    const theme = getTheme(themeId)
    const root = document.documentElement
    
    // Set CSS variables
    root.style.setProperty('--terminal-green', theme.ui.colors.primary)
    root.style.setProperty('--terminal-bright-green', theme.ui.colors.primary)
    root.style.setProperty('--terminal-amber', theme.ui.colors.secondary)
    root.style.setProperty('--terminal-red', theme.ui.colors.accent)
    root.style.setProperty('--terminal-blue', theme.ui.colors.secondary)
    root.style.setProperty('--terminal-bg', theme.ui.colors.background)
    root.style.setProperty('--terminal-bg-light', theme.ui.colors.backgroundLight)
    root.style.setProperty('--crt-green', `${theme.ui.colors.primary}1a`) // 10% opacity
    
    // Set scrollbar theme colors
    root.style.setProperty('--scrollbar-thumb', theme.ui.colors.primary)
    root.style.setProperty('--scrollbar-thumb-hover', theme.ui.colors.secondary)
    root.style.setProperty('--scrollbar-track', theme.ui.colors.background)
    
    // Set fonts
    root.style.setProperty('--font-main', theme.ui.fonts.main)
    root.style.setProperty('--font-accent', theme.ui.fonts.accent)
    
    // Add theme class for specific effects
    document.body.className = `theme-${themeId}`
    
    // Inject font imports
    const fontStyleId = 'theme-fonts'
    let fontStyle = document.getElementById(fontStyleId)
    if (!fontStyle) {
      fontStyle = document.createElement('style')
      fontStyle.id = fontStyleId
      document.head.appendChild(fontStyle)
    }
    fontStyle.textContent = theme.ui.fonts.import || ''
    
    setCurrentTheme(theme)
  }, [themeId])

  const setTheme = (newThemeId: string) => {
    if (newThemeId === themeId) return
    
    setIsTransitioning(true)
    
    // Add transition class
    document.body.classList.add('theme-transitioning')
    
    // Wait for fade out
    setTimeout(() => {
      setThemeId(newThemeId)
      
      // Wait for theme to apply
      setTimeout(() => {
        document.body.classList.remove('theme-transitioning')
        setIsTransitioning(false)
      }, 100)
    }, 300)
  }

  const suggestThemeForStory = (description: string) => {
    return suggestTheme(description)
  }

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      themeId,
      setTheme,
      suggestThemeForStory,
      isTransitioning
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}