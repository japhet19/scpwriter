import React from 'react'
import styles from './ThemeOptions.module.css'
import { NoirOptions } from '@/types/themeOptions'
import './NoirOptions.css'

interface NoirOptionsProps {
  options: NoirOptions
  onChange: (options: NoirOptions) => void
}

export default function NoirOptions({ options, onChange }: NoirOptionsProps) {
  const handleSliderChange = (key: keyof NoirOptions, value: number) => {
    onChange({ ...options, [key]: value })
  }

  const getEvidenceStatus = (value: number) => {
    if (value < 25) return 'COLD CASE'
    if (value < 50) return 'LEADS EMERGING'
    if (value < 75) return 'EVIDENCE MOUNTING'
    return 'CASE BREAKING'
  }

  return (
    <div className={`${styles.themeOptions} noir-theme-options`}>
      <div className={`${styles.optionRow} noir-evidence-row`}>
        <span className="noir-evidence-label">GRITTINESS DOSSIER:</span>
        <div className={`${styles.sliderContainer} noir-evidence-container`}>
          <div className="noir-case-status">{getEvidenceStatus(options.grittiness)}</div>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} noir-label`}>Cozy Detective</span>
            <span className={`${styles.rightLabel} noir-label`}>Hard-Boiled Crime</span>
          </div>
          <div className="noir-evidence-meter">
            <div className="noir-case-files">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`noir-case-file ${i < Math.floor(options.grittiness / 10) ? 'filled' : ''}`} />
              ))}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={options.grittiness}
              onChange={(e) => handleSliderChange('grittiness', Number(e.target.value))}
              className={`${styles.themeSlider} noir-slider`}
            />
            <div className="noir-evidence-progress" style={{ width: `${options.grittiness}%` }} />
          </div>
          <span className={`${styles.sliderValue} noir-percentage`}>{options.grittiness}%</span>
        </div>
      </div>

      <div className={`${styles.optionRow} noir-evidence-row`}>
        <span className="noir-evidence-label">MYSTERY COMPLEXITY FILE:</span>
        <div className={`${styles.sliderContainer} noir-evidence-container`}>
          <div className="noir-case-status">{getEvidenceStatus(options.mysteryComplexity)}</div>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} noir-label`}>Simple Case</span>
            <span className={`${styles.rightLabel} noir-label`}>Labyrinthine Conspiracy</span>
          </div>
          <div className="noir-evidence-meter">
            <div className="noir-case-files">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`noir-case-file ${i < Math.floor(options.mysteryComplexity / 10) ? 'filled' : ''}`} />
              ))}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={options.mysteryComplexity}
              onChange={(e) => handleSliderChange('mysteryComplexity', Number(e.target.value))}
              className={`${styles.themeSlider} noir-slider`}
            />
            <div className="noir-evidence-progress" style={{ width: `${options.mysteryComplexity}%` }} />
          </div>
          <span className={`${styles.sliderValue} noir-percentage`}>{options.mysteryComplexity}%</span>
        </div>
      </div>

      <div className={`${styles.optionRow} noir-evidence-row`}>
        <span className="noir-evidence-label">TIME PERIOD ARCHIVE:</span>
        <div className={`${styles.sliderContainer} noir-evidence-container`}>
          <div className="noir-case-status">{getEvidenceStatus(options.timePeriod)}</div>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} noir-label`}>Classic 1940s Noir</span>
            <span className={`${styles.rightLabel} noir-label`}>Modern Neo-Noir</span>
          </div>
          <div className="noir-evidence-meter">
            <div className="noir-case-files">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`noir-case-file ${i < Math.floor(options.timePeriod / 10) ? 'filled' : ''}`} />
              ))}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={options.timePeriod}
              onChange={(e) => handleSliderChange('timePeriod', Number(e.target.value))}
              className={`${styles.themeSlider} noir-slider`}
            />
            <div className="noir-evidence-progress" style={{ width: `${options.timePeriod}%` }} />
          </div>
          <span className={`${styles.sliderValue} noir-percentage`}>{options.timePeriod}%</span>
        </div>
      </div>

      <div className={`${styles.optionRow} noir-evidence-row`}>
        <span className="noir-evidence-label">MORAL AMBIGUITY REPORT:</span>
        <div className={`${styles.sliderContainer} noir-evidence-container`}>
          <div className="noir-case-status">{getEvidenceStatus(options.moralAmbiguity)}</div>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} noir-label`}>Clear Heroes & Villains</span>
            <span className={`${styles.rightLabel} noir-label`}>Everyone Compromised</span>
          </div>
          <div className="noir-evidence-meter">
            <div className="noir-case-files">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`noir-case-file ${i < Math.floor(options.moralAmbiguity / 10) ? 'filled' : ''}`} />
              ))}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={options.moralAmbiguity}
              onChange={(e) => handleSliderChange('moralAmbiguity', Number(e.target.value))}
              className={`${styles.themeSlider} noir-slider`}
            />
            <div className="noir-evidence-progress" style={{ width: `${options.moralAmbiguity}%` }} />
          </div>
          <span className={`${styles.sliderValue} noir-percentage`}>{options.moralAmbiguity}%</span>
        </div>
      </div>
    </div>
  )
}