'use client'

import React, { useEffect, useState } from 'react'
import styles from './Logo.module.css'

export type LogoVariant = 'full' | 'compact' | 'icon' | 'status'
export type LogoTheme = 'default' | 'scp' | 'cyberpunk' | 'fantasy' | 'noir' | 'scifi' | 'romance'

interface LogoProps {
  variant?: LogoVariant
  theme?: LogoTheme
  animated?: boolean
  glitch?: boolean
  pulse?: boolean
  className?: string
}

const FULL_LOGO = [
  '╔═══════════════════════════════════════════════════════════╗',
  '║  ██████╗ ██╗      ██████╗ ████████╗ ██████╗██████╗  █████╗ ███████╗████████╗  ║',
  '║  ██╔══██╗██║     ██╔═══██╗╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝  ║',
  '║  ██████╔╝██║     ██║   ██║   ██║   ██║     ██████╔╝███████║█████╗     ██║     ║',
  '║  ██╔═══╝ ██║     ██║   ██║   ██║   ██║     ██╔══██╗██╔══██║██╔══╝     ██║     ║',
  '║  ██║     ███████╗╚██████╔╝   ██║   ╚██████╗██║  ██║██║  ██║██║        ██║     ║',
  '║  ╚═╝     ╚══════╝ ╚═════╝    ╚═╝    ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝     ║',
  '║                    [ AI-POWERED STORY CREATION SYSTEM ]                         ║',
  '╚═══════════════════════════════════════════════════════════╝'
]

const COMPACT_LOGO = 'PLOTCRAFT > SYSTEM.ACTIVE'
const ICON_LOGO = '[P/C]'

const THEME_VARIANTS = {
  scp: {
    compact: '[PLOTCRAFT] FOUNDATION DATABASE',
    subtitle: 'CLEARANCE LEVEL: NARRATIVE-3'
  },
  cyberpunk: {
    compact: 'PLOTCRAFT_NEURAL.exe',
    subtitle: '[SYNAPTIC STORY MATRIX]'
  },
  fantasy: {
    compact: '✨ PlotCraft ✨',
    subtitle: 'Arcane Story Weaver'
  },
  noir: {
    compact: 'PLOTCRAFT',
    subtitle: 'Case File Generator • EST. 2024'
  },
  scifi: {
    compact: '◆ PLOTCRAFT ◆',
    subtitle: 'Stellar Narrative Engine'
  },
  romance: {
    compact: '♡ PlotCraft ♡',
    subtitle: 'Love Story Creator'
  }
}

export default function Logo({ 
  variant = 'full', 
  theme = 'default',
  animated = false,
  glitch = false,
  pulse = false,
  className = ''
}: LogoProps) {
  const [displayText, setDisplayText] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState(0)
  const [isTyping, setIsTyping] = useState(animated)

  useEffect(() => {
    if (variant === 'full' && animated) {
      const timer = setInterval(() => {
        if (currentLine < FULL_LOGO.length) {
          setDisplayText(prev => [...prev, FULL_LOGO[currentLine]])
          setCurrentLine(prev => prev + 1)
        } else {
          setIsTyping(false)
          clearInterval(timer)
        }
      }, 100)
      return () => clearInterval(timer)
    } else if (variant === 'full') {
      setDisplayText(FULL_LOGO)
    }
  }, [variant, animated, currentLine])

  const getLogoContent = () => {
    switch (variant) {
      case 'full':
        return (
          <pre className={`${styles.fullLogo} ${isTyping ? styles.typing : ''}`}>
            {displayText.join('\n')}
            {isTyping && <span className={styles.cursor}>█</span>}
          </pre>
        )
      
      case 'compact':
        const compactText = theme !== 'default' && THEME_VARIANTS[theme] 
          ? THEME_VARIANTS[theme].compact 
          : COMPACT_LOGO
        return <div className={styles.compactLogo}>{compactText}</div>
      
      case 'icon':
        return <div className={styles.iconLogo}>{ICON_LOGO}</div>
      
      case 'status':
        return (
          <div className={styles.statusLogo}>
            PLOTCRAFT &gt; <span className={styles.statusText}>READY</span>
          </div>
        )
      
      default:
        return null
    }
  }

  const getSubtitle = () => {
    if (variant === 'compact' && theme !== 'default' && THEME_VARIANTS[theme]?.subtitle) {
      return <div className={styles.subtitle}>{THEME_VARIANTS[theme].subtitle}</div>
    }
    return null
  }

  const logoClasses = [
    styles.logo,
    glitch && styles.glitch,
    pulse && styles.pulse,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={logoClasses} data-theme={theme}>
      {getLogoContent()}
      {getSubtitle()}
    </div>
  )
}