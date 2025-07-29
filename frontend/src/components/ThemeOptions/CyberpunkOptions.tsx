import React from 'react'
import styles from './ThemeOptions.module.css'
import type { CyberpunkOptions } from '@/types/themeOptions'

interface CyberpunkOptionsProps {
  options: CyberpunkOptions
  onChange: (options: CyberpunkOptions) => void
}

export default function CyberpunkOptions({ options, onChange }: CyberpunkOptionsProps) {
  const handleSliderChange = (key: keyof CyberpunkOptions, value: number) => {
    onChange({ ...options, [key]: value })
  }

  return (
    <div className={`${styles.themeOptions} ${styles.cyberpunkTheme}`}>
      <div className={styles.optionRow}>
        <span className={styles.cyberpunkLabel}>
          <span className={styles.neonGlow}>TECH_LEVEL.exe</span>
        </span>
        <div className={`${styles.sliderContainer} ${styles.cyberpunkSliderContainer}`}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} ${styles.cyberpunkLeftLabel}`}>Near-Future Limited</span>
            <span className={`${styles.rightLabel} ${styles.cyberpunkRightLabel}`}>Post-Singularity AI</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.techLevel}
            onChange={(e) => handleSliderChange('techLevel', Number(e.target.value))}
            className={`${styles.themeSlider} ${styles.cyberpunkSlider}`}
          />
          <span className={`${styles.sliderValue} ${styles.cyberpunkValue}`}>
            [{options.techLevel}%]
          </span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span className={styles.cyberpunkLabel}>
          <span className={styles.neonGlow}>DYSTOPIA_LEVEL.exe</span>
        </span>
        <div className={`${styles.sliderContainer} ${styles.cyberpunkSliderContainer}`}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} ${styles.cyberpunkLeftLabel}`}>Hopeful Tech Future</span>
            <span className={`${styles.rightLabel} ${styles.cyberpunkRightLabel}`}>Surveillance State</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.dystopiaLevel}
            onChange={(e) => handleSliderChange('dystopiaLevel', Number(e.target.value))}
            className={`${styles.themeSlider} ${styles.cyberpunkSlider}`}
          />
          <span className={`${styles.sliderValue} ${styles.cyberpunkValue}`}>
            [{options.dystopiaLevel}%]
          </span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span className={styles.cyberpunkLabel}>
          <span className={styles.neonGlow}>PERSPECTIVE.exe</span>
        </span>
        <div className={`${styles.sliderContainer} ${styles.cyberpunkSliderContainer}`}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} ${styles.cyberpunkLeftLabel}`}>Street-Level Criminal</span>
            <span className={`${styles.rightLabel} ${styles.cyberpunkRightLabel}`}>Corporate Executive</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.perspective}
            onChange={(e) => handleSliderChange('perspective', Number(e.target.value))}
            className={`${styles.themeSlider} ${styles.cyberpunkSlider}`}
          />
          <span className={`${styles.sliderValue} ${styles.cyberpunkValue}`}>
            [{options.perspective}%]
          </span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span className={styles.cyberpunkLabel}>
          <span className={styles.neonGlow}>AUGMENTATION.exe</span>
        </span>
        <div className={`${styles.sliderContainer} ${styles.cyberpunkSliderContainer}`}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} ${styles.cyberpunkLeftLabel}`}>Minimal Cybernetics</span>
            <span className={`${styles.rightLabel} ${styles.cyberpunkRightLabel}`}>Full AI Integration</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.augmentation}
            onChange={(e) => handleSliderChange('augmentation', Number(e.target.value))}
            className={`${styles.themeSlider} ${styles.cyberpunkSlider}`}
          />
          <span className={`${styles.sliderValue} ${styles.cyberpunkValue}`}>
            [{options.augmentation}%]
          </span>
        </div>
      </div>
    </div>
  )
}