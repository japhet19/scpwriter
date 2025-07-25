'use client'

import React, { useState } from 'react'
import styles from './WelcomeScreen.module.css'
import { THEMES } from '@/themes/themeConfig'
import { useTheme } from '@/contexts/ThemeContext'

interface WelcomeScreenProps {
  onThemeSelect: (themeId: string) => void
}

export default function WelcomeScreen({ onThemeSelect }: WelcomeScreenProps) {
  const { setTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId)
    setTheme(themeId)
    // Small delay to show selection before transitioning
    setTimeout(() => {
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
        <h1 className={styles.mainTitle}>
          <span className={styles.titleLine1}>AI-POWERED</span>
          <span className={styles.titleLine2}>STORY CREATION</span>
        </h1>
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
                    <small>Agent Team:</small>
                    <div className={styles.agentNames}>
                      <span>{theme.agents.writer}</span>
                      <span>{theme.agents.reader}</span>
                      <span>{theme.agents.expert}</span>
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