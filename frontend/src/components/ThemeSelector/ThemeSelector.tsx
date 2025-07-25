'use client'

import React, { useState, useEffect } from 'react'
import styles from './ThemeSelector.module.css'
import { useTheme } from '@/contexts/ThemeContext'
import { THEMES } from '@/themes/themeConfig'

interface ThemeSelectorProps {
  storyTheme?: string
  onThemeChange?: (themeId: string) => void
}

export default function ThemeSelector({ storyTheme, onThemeChange }: ThemeSelectorProps) {
  const { themeId, setTheme, suggestThemeForStory } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState(themeId)
  const [suggestedTheme, setSuggestedTheme] = useState<string | null>(null)
  
  useEffect(() => {
    if (storyTheme) {
      const suggested = suggestThemeForStory(storyTheme)
      if (suggested !== 'scp') { // Only suggest if it's not the default
        setSuggestedTheme(suggested)
      }
    }
  }, [storyTheme, suggestThemeForStory])
  
  const handleThemeSelect = (newThemeId: string) => {
    setSelectedTheme(newThemeId)
    setTheme(newThemeId)
    onThemeChange?.(newThemeId)
  }
  
  return (
    <div className={styles.themeSelector}>
      <div className={styles.header}>
        <span className={styles.label}>UI THEME:</span>
        {suggestedTheme && suggestedTheme !== selectedTheme && (
          <button 
            className={styles.suggestion}
            onClick={() => handleThemeSelect(suggestedTheme)}
          >
            SUGGESTED: {THEMES[suggestedTheme].name} ▶
          </button>
        )}
      </div>
      
      <div className={styles.themeGrid}>
        {Object.entries(THEMES).map(([id, theme]) => (
          <button
            key={id}
            className={`${styles.themeOption} ${selectedTheme === id ? styles.selected : ''}`}
            onClick={() => handleThemeSelect(id)}
          >
            <div className={styles.themeName}>{theme.name}</div>
            <div className={styles.themeDescription}>{theme.description}</div>
            <div className={styles.themePreview}>
              <span style={{ color: theme.ui.colors.primary }}>■</span>
              <span style={{ color: theme.ui.colors.secondary }}>■</span>
              <span style={{ color: theme.ui.colors.accent }}>■</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}