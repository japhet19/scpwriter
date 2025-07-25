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

  // Add endpoint icons for romance theme
  const getEndpointIcons = (sliderType: string) => {
    switch (sliderType) {
      case 'heat':
        return { left: '💝', right: '🔥' }
      case 'drama':
        return { left: '💕', right: '💔' }
      case 'relationship':
        return { left: '🤝', right: '⚔️' }
      case 'era':
        return { left: '🏰', right: '🚀' }
      default:
        return { left: '♥', right: '♥' }
    }
  }

  return (
    <div className={styles.themeOptions}>
      <div className={styles.optionRow}>
        <span>Heat Level:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} ${styles.romanceLeftLabel}`}>Sweet & Innocent</span>
            <span className={`${styles.rightLabel} ${styles.romanceRightLabel}`}>Steamy & Passionate</span>
          </div>
          <div className={styles.romanceSliderContainer}>
            <input
              type="range"
              min="0"
              max="100"
              value={options.heatLevel}
              onChange={(e) => handleSliderChange('heatLevel', Number(e.target.value))}
              className={`${styles.themeSlider} ${styles.romanceSlider}`}
              style={{
                background: `linear-gradient(to right, #FFB6C1 0%, #FF69B4 50%, #DC143C 100%)`
              }}
            />
            <div className={styles.romanceSliderEndpoints}>
              <span className={styles.romanceEndpoint}>{getEndpointIcons('heat').left}</span>
              <span className={styles.romanceEndpoint}>{getEndpointIcons('heat').right}</span>
            </div>
          </div>
          <span className={`${styles.sliderValue} ${styles.romanceSliderValue}`}>{options.heatLevel}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Drama Level:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} ${styles.romanceLeftLabel}`}>Gentle Love Story</span>
            <span className={`${styles.rightLabel} ${styles.romanceRightLabel}`}>Intense Obstacles</span>
          </div>
          <div className={styles.romanceSliderContainer}>
            <input
              type="range"
              min="0"
              max="100"
              value={options.dramaLevel}
              onChange={(e) => handleSliderChange('dramaLevel', Number(e.target.value))}
              className={`${styles.themeSlider} ${styles.romanceSlider}`}
              style={{
                background: `linear-gradient(to right, #98FB98 0%, #FFB6C1 50%, #DC143C 100%)`
              }}
            />
            <div className={styles.romanceSliderEndpoints}>
              <span className={styles.romanceEndpoint}>{getEndpointIcons('drama').left}</span>
              <span className={styles.romanceEndpoint}>{getEndpointIcons('drama').right}</span>
            </div>
          </div>
          <span className={`${styles.sliderValue} ${styles.romanceSliderValue}`}>{options.dramaLevel}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Relationship Type:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} ${styles.romanceLeftLabel}`}>Friends to Lovers</span>
            <span className={`${styles.rightLabel} ${styles.romanceRightLabel}`}>Enemies to Lovers</span>
          </div>
          <div className={styles.romanceSliderContainer}>
            <input
              type="range"
              min="0"
              max="100"
              value={options.relationshipType}
              onChange={(e) => handleSliderChange('relationshipType', Number(e.target.value))}
              className={`${styles.themeSlider} ${styles.romanceSlider}`}
              style={{
                background: `linear-gradient(to right, #87CEEB 0%, #FFB6C1 50%, #B22222 100%)`
              }}
            />
            <div className={styles.romanceSliderEndpoints}>
              <span className={styles.romanceEndpoint}>{getEndpointIcons('relationship').left}</span>
              <span className={styles.romanceEndpoint}>{getEndpointIcons('relationship').right}</span>
            </div>
          </div>
          <span className={`${styles.sliderValue} ${styles.romanceSliderValue}`}>{options.relationshipType}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Setting Era:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} ${styles.romanceLeftLabel}`}>Historical Romance</span>
            <span className={`${styles.rightLabel} ${styles.romanceRightLabel}`}>Futuristic Romance</span>
          </div>
          <div className={styles.romanceSliderContainer}>
            <input
              type="range"
              min="0"
              max="100"
              value={options.settingEra}
              onChange={(e) => handleSliderChange('settingEra', Number(e.target.value))}
              className={`${styles.themeSlider} ${styles.romanceSlider}`}
              style={{
                background: `linear-gradient(to right, #8B4513 0%, #FFB6C1 50%, #00CED1 100%)`
              }}
            />
            <div className={styles.romanceSliderEndpoints}>
              <span className={styles.romanceEndpoint}>{getEndpointIcons('era').left}</span>
              <span className={styles.romanceEndpoint}>{getEndpointIcons('era').right}</span>
            </div>
          </div>
          <span className={`${styles.sliderValue} ${styles.romanceSliderValue}`}>{options.settingEra}%</span>
        </div>
      </div>
    </div>
  )
}