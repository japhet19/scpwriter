import React from 'react'
import styles from './ThemeOptions.module.css'
import { RomanceOptions } from '@/types/themeOptions'

interface RomanceOptionsProps {
  options: RomanceOptions
  onChange: (options: RomanceOptions) => void
}

export default function RomanceOptions({ options, onChange }: RomanceOptionsProps) {
  const handleSliderChange = (key: keyof RomanceOptions, value: number) => {
    onChange({ ...options, [key]: value })
  }

  return (
    <div className={styles.themeOptions}>
      <div className={styles.optionRow}>
        <span>Heat Level:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Sweet & Innocent</span>
            <span className={styles.rightLabel}>Steamy & Passionate</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.heatLevel}
            onChange={(e) => handleSliderChange('heatLevel', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, #FFB6C1 0%, #FF69B4 50%, #DC143C 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.heatLevel}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Drama Level:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Gentle Love Story</span>
            <span className={styles.rightLabel}>Intense Obstacles</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.dramaLevel}
            onChange={(e) => handleSliderChange('dramaLevel', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, #98FB98 0%, var(--terminal-amber) 50%, var(--terminal-red) 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.dramaLevel}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Relationship Type:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Friends to Lovers</span>
            <span className={styles.rightLabel}>Enemies to Lovers</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.relationshipType}
            onChange={(e) => handleSliderChange('relationshipType', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, #87CEEB 0%, var(--terminal-amber) 50%, #B22222 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.relationshipType}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Setting Era:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Historical Romance</span>
            <span className={styles.rightLabel}>Futuristic Romance</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.settingEra}
            onChange={(e) => handleSliderChange('settingEra', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, #8B4513 0%, var(--terminal-amber) 50%, #00CED1 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.settingEra}%</span>
        </div>
      </div>
    </div>
  )
}