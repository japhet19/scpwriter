import React from 'react'
import styles from './ThemeOptions.module.css'
import { SciFiOptions } from '@/types/themeOptions'

interface SciFiOptionsProps {
  options: SciFiOptions
  onChange: (options: SciFiOptions) => void
}

export default function SciFiOptions({ options, onChange }: SciFiOptionsProps) {
  const handleSliderChange = (key: keyof SciFiOptions, value: number) => {
    onChange({ ...options, [key]: value })
  }

  return (
    <div className={styles.themeOptions}>
      <div className={styles.optionRow}>
        <span>Tech Level:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Hard Science Realistic</span>
            <span className={styles.rightLabel}>Space Opera Fantasy</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.techLevel}
            onChange={(e) => handleSliderChange('techLevel', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, var(--terminal-green) 0%, #00BFFF 50%, #9932CC 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.techLevel}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Science Type:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Physics & Engineering</span>
            <span className={styles.rightLabel}>Biology & Consciousness</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.scienceType}
            onChange={(e) => handleSliderChange('scienceType', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, #4169E1 0%, var(--terminal-amber) 50%, #32CD32 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.scienceType}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Scope:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Personal Character Story</span>
            <span className={styles.rightLabel}>Galactic Civilization</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.scope}
            onChange={(e) => handleSliderChange('scope', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, var(--terminal-green) 0%, var(--terminal-amber) 50%, var(--terminal-red) 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.scope}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Outlook:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Dystopian Warning</span>
            <span className={styles.rightLabel}>Utopian Future</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.outlook}
            onChange={(e) => handleSliderChange('outlook', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, #8B0000 0%, var(--terminal-amber) 50%, #32CD32 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.outlook}%</span>
        </div>
      </div>
    </div>
  )
}