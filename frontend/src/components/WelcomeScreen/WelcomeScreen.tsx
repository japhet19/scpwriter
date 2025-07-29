'use client'

import React, { useState, useEffect, useRef } from 'react'
import styles from './WelcomeScreen.module.css'
import { THEMES } from '@/themes/themeConfig'
import { useTheme } from '@/contexts/ThemeContext'

interface WelcomeScreenProps {
  onThemeSelect: (themeId: string) => void
}

export default function WelcomeScreen({ onThemeSelect }: WelcomeScreenProps) {
  const { setTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId)
    setTheme(themeId)
    // Small delay to show selection before transitioning
    timeoutRef.current = setTimeout(() => {
      onThemeSelect(themeId)
    }, 800)
  }

  const getThemeImages = (themeId: string): string[] => {
    const imageCount = themeId === 'cyberpunk' ? 2 : 3
    return Array.from({ length: imageCount }, (_, i) => 
      `/images/${themeId}_${i + 1}.png`
    )
  }

  return (
    <div className={styles.welcomeScreen}>
      <div className={styles.hero}>
        <div className={styles.plotcraftBrand}>
          <div className={styles.plotcraftTitle}>PLOTCRAFT</div>
          <div className={styles.plotcraftSubtitle}>AI-POWERED STORY CREATION SYSTEM</div>
        </div>
        <p className={styles.subtitle}>
          Choose your universe. Our AI agents will craft your story.
        </p>
      </div>

      <div className={styles.themesSection}>
        <h2 className={styles.sectionTitle}>Choose Your Story Universe</h2>
        <div className={styles.themesGrid}>
          {Object.entries(THEMES).map(([themeId, theme]) => {
            const images = getThemeImages(themeId)
            const isSelected = selectedTheme === themeId
            
            return (
              <div 
                key={themeId}
                className={`${styles.themeCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleThemeSelect(themeId)}
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${images[0]})`
                }}
              >
                <div className={styles.themeOverlay}>
                  <h3 className={styles.themeName}>{theme.name}</h3>
                  <p className={styles.themeDescription}>{theme.description}</p>
                  <div className={styles.agentTeam}>
                    <small>Agent System:</small>
                    <div className={styles.agentNames}>
                      <span>Writer • Reader • Expert</span>
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <div className={styles.selectionIndicator}>
                    <div className={styles.loadingRing}></div>
                    <span>INITIALIZING...</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.footer}>
        <p>Powered by collaborative AI agents working together to create your perfect story</p>
      </div>
    </div>
  )
}