'use client'

import React, { useEffect, useState } from 'react'
import styles from './LoadingSequence.module.css'
import Logo from './Logo'

interface LoadingSequenceProps {
  onComplete?: () => void
  showModules?: boolean
}

const MODULES = [
  { name: 'fantasy.mod', delay: 100 },
  { name: 'scifi.mod', delay: 150 },
  { name: 'noir.mod', delay: 120 },
  { name: 'scp.mod', delay: 180 },
  { name: 'cyberpunk.mod', delay: 140 },
  { name: 'romance.mod', delay: 160 }
]

export default function LoadingSequence({ onComplete, showModules = true }: LoadingSequenceProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [loadedModules, setLoadedModules] = useState<string[]>([])
  const [showLogo, setShowLogo] = useState(false)

  useEffect(() => {
    // Step 1: Show logo with animation
    const logoTimer = setTimeout(() => {
      setShowLogo(true)
      setCurrentStep(1)
    }, 500)

    // Step 2: Progress bar
    const progressTimer = setTimeout(() => {
      setCurrentStep(2)
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 5
        })
      }, 50)
    }, 2000)

    // Step 3: Load modules
    if (showModules) {
      MODULES.forEach((module, index) => {
        setTimeout(() => {
          setLoadedModules(prev => [...prev, module.name])
          if (index === MODULES.length - 1) {
            setTimeout(() => {
              setCurrentStep(4)
              onComplete?.()
            }, 500)
          }
        }, 3000 + (module.delay * index))
      })
    } else {
      setTimeout(() => {
        setCurrentStep(4)
        onComplete?.()
      }, 4000)
    }

    return () => {
      clearTimeout(logoTimer)
      clearTimeout(progressTimer)
    }
  }, [showModules, onComplete])

  return (
    <div className={styles.container}>
      {showLogo && (
        <div className={styles.logoContainer}>
          <Logo variant="full" animated glitch={currentStep === 1} />
        </div>
      )}

      {currentStep >= 2 && (
        <div className={styles.progressSection}>
          <div className={styles.statusText}>INITIALIZING PLOTCRAFT SYSTEM...</div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={styles.progressText}>{progress}%</div>
        </div>
      )}

      {showModules && currentStep >= 3 && (
        <div className={styles.moduleSection}>
          <div className={styles.moduleHeader}>LOADING STORY MODULES...</div>
          {MODULES.map(module => (
            <div key={module.name} className={styles.moduleItem}>
              <span className={styles.moduleName}>&gt; {module.name}</span>
              <span className={styles.moduleDots}>
                {loadedModules.includes(module.name) ? (
                  <span className={styles.moduleStatus}>OK</span>
                ) : (
                  '.......'
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {currentStep === 4 && (
        <div className={styles.readyText}>
          PLOTCRAFT READY.
          <span className={styles.cursor}>█</span>
        </div>
      )}
    </div>
  )
}