import React from 'react'
import styles from './ThemeOptions.module.css'
import { NoirOptions } from '@/types/themeOptions'

interface NoirOptionsProps {
  options: NoirOptions
  onChange: (options: NoirOptions) => void
}

export default function NoirOptions({ options, onChange }: NoirOptionsProps) {
  const handleSliderChange = (key: keyof NoirOptions, value: number) => {
    onChange({ ...options, [key]: value })
  }

  return (
    <div className={styles.themeOptions}>
      <div className={styles.optionRow}>
        <span>Grittiness:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Cozy Detective</span>
            <span className={styles.rightLabel}>Hard-Boiled Crime</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.grittiness}
            onChange={(e) => handleSliderChange('grittiness', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, #D3D3D3 0%, #696969 50%, #2F2F2F 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.grittiness}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Mystery Complexity:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Simple Case</span>
            <span className={styles.rightLabel}>Labyrinthine Conspiracy</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.mysteryComplexity}
            onChange={(e) => handleSliderChange('mysteryComplexity', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, var(--terminal-green) 0%, var(--terminal-amber) 50%, var(--terminal-red) 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.mysteryComplexity}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Time Period:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Classic 1940s Noir</span>
            <span className={styles.rightLabel}>Modern Neo-Noir</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.timePeriod}
            onChange={(e) => handleSliderChange('timePeriod', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, #8B4513 0%, var(--terminal-amber) 50%, #00CED1 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.timePeriod}%</span>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span>Moral Ambiguity:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>Clear Heroes & Villains</span>
            <span className={styles.rightLabel}>Everyone Compromised</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={options.moralAmbiguity}
            onChange={(e) => handleSliderChange('moralAmbiguity', Number(e.target.value))}
            className={styles.themeSlider}
            style={{
              background: `linear-gradient(to right, #FFFFFF 0%, #808080 50%, #2F2F2F 100%)`
            }}
          />
          <span className={styles.sliderValue}>{options.moralAmbiguity}%</span>
        </div>
      </div>
    </div>
  )
}