import React from 'react'
import styles from './ThemeOptions.module.css'
import { SCPOptions } from '@/types/themeOptions'

interface SCPOptionsProps {
  options: SCPOptions
  onChange: (options: SCPOptions) => void
}

export default function SCPOptions({ options, onChange }: SCPOptionsProps) {
  const handleSliderChange = (key: keyof SCPOptions, value: number) => {
    onChange({ ...options, [key]: value })
  }

  return (
    <div className={styles.themeOptions}>
      <div className={styles.optionRow}>
        <span>Horror Level:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Mild Anomalies</span>
            <span className={styles.rightLabel}>Cosmic Horror</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.horrorLevel}
            onChange={(e) => handleSliderChange('horrorLevel', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, var(--terminal-green) 0%, var(--terminal-amber) 50%, var(--terminal-red) 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.horrorLevel}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Containment Class:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Safe Class</span>
            <span className={styles.rightLabel}>Apollyon Class</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.containmentClass}
            onChange={(e) => handleSliderChange('containmentClass', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, var(--terminal-green) 0%, var(--terminal-amber) 30%, var(--terminal-red) 70%, #8B0000 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.containmentClass}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Redaction Level:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Clear Documentation</span>
            <span className={styles.rightLabel}>Heavily Classified</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.redactionLevel}
            onChange={(e) => handleSliderChange('redactionLevel', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, var(--terminal-green) 0%, var(--terminal-amber) 50%, #333 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.redactionLevel}%</span>
        </div>
      </div>
    </div>
  )
}