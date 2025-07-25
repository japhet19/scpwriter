import React from 'react'
import styles from './ThemeOptions.module.css'
import { CyberpunkOptions } from '@/types/themeOptions'

interface CyberpunkOptionsProps {
  options: CyberpunkOptions
  onChange: (options: CyberpunkOptions) => void
}

export default function CyberpunkOptions({ options, onChange }: CyberpunkOptionsProps) {
  const handleSliderChange = (key: keyof CyberpunkOptions, value: number) => {
    onChange({ ...options, [key]: value })
  }

  return (
    <div className={styles.themeOptions}>
      <div className={styles.optionRow}>
        <span>Tech Level:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Near-Future Limited</span>
            <span className={styles.rightLabel}>Post-Singularity AI</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.techLevel}
            onChange={(e) => handleSliderChange('techLevel', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, var(--terminal-green) 0%, #00BFFF 50%, #FF1493 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.techLevel}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Dystopia Level:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Hopeful Tech Future</span>
            <span className={styles.rightLabel}>Surveillance State</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.dystopiaLevel}
            onChange={(e) => handleSliderChange('dystopiaLevel', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, var(--terminal-green) 0%, var(--terminal-amber) 50%, #8B0000 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.dystopiaLevel}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Perspective:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Street-Level Criminal</span>
            <span className={styles.rightLabel}>Corporate Executive</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.perspective}
            onChange={(e) => handleSliderChange('perspective', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, #800000 0%, var(--terminal-amber) 50%, #4169E1 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.perspective}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Augmentation:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Minimal Cybernetics</span>
            <span className={styles.rightLabel}>Full AI Integration</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.augmentation}
            onChange={(e) => handleSliderChange('augmentation', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, var(--terminal-green) 0%, #00BFFF 50%, #FF00FF 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.augmentation}%</span>
        </div>
      </div>
    </div>
  )
}