import React from 'react'
import styles from './ThemeOptions.module.css'
import type { SCPOptions } from '@/types/themeOptions'
import './SCPOptions.css'

interface SCPOptionsProps {
  options: SCPOptions
  onChange: (options: SCPOptions) => void
}

export default function SCPOptions({ options, onChange }: SCPOptionsProps) {
  const handleSliderChange = (key: keyof SCPOptions, value: number) => {
    onChange({ ...options, [key]: value })
  }

  const getContainmentClassification = (value: number) => {
    if (value < 20) return 'SAFE'
    if (value < 40) return 'EUCLID'
    if (value < 60) return 'KETER'
    if (value < 80) return 'THAUMIEL'
    return 'APOLLYON'
  }

  const getHorrorClassification = (value: number) => {
    if (value < 25) return 'ANOMALOUS'
    if (value < 50) return 'DISTURBING'
    if (value < 75) return 'NIGHTMARE'
    return 'COGNITOHAZARD'
  }

  const getRedactionLevel = (value: number) => {
    if (value < 25) return 'LEVEL 1'
    if (value < 50) return 'LEVEL 3'
    if (value < 75) return 'LEVEL 4'
    return 'O5 ONLY'
  }

  return (
    <div className={`${styles.themeOptions} scp-theme-options`}>
      <div className={`${styles.optionRow} scp-control-row`}>
        <div className="scp-control-header">
          <span className="scp-control-label">ANOMALY DANGER LEVEL:</span>
          <div className="scp-classification">{getHorrorClassification(options.horrorLevel)}</div>
        </div>
        <div className={`${styles.sliderContainer} scp-control-container`}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} scp-label`}>Mild Anomalies</span>
            <span className={`${styles.rightLabel} scp-label`}>Cosmic Horror</span>
          </div>
          <div className="scp-danger-meter">
            <div className="scp-danger-zones">
              <div className="zone safe" />
              <div className="zone euclid" />
              <div className="zone keter" />
              <div className="zone apollyon" />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={options.horrorLevel}
              onChange={(e) => handleSliderChange('horrorLevel', Number(e.target.value))}
              className={`${styles.themeSlider} scp-slider`}
            />
            <div className="scp-danger-indicator" style={{ left: `${options.horrorLevel}%` }}>
              <div className="indicator-light" />
            </div>
          </div>
          <span className={`${styles.sliderValue} scp-percentage`}>
            <span className="danger-icon">⚠</span> {options.horrorLevel}%
          </span>
        </div>
      </div>

      <div className={`${styles.optionRow} scp-control-row`}>
        <div className="scp-control-header">
          <span className="scp-control-label">CONTAINMENT CLASS:</span>
          <div className="scp-classification containment">{getContainmentClassification(options.containmentClass)}</div>
        </div>
        <div className={`${styles.sliderContainer} scp-control-container`}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} scp-label`}>Safe Class</span>
            <span className={`${styles.rightLabel} scp-label`}>Apollyon Class</span>
          </div>
          <div className="scp-danger-meter">
            <div className="scp-containment-zones">
              <div className="zone safe" title="Safe" />
              <div className="zone euclid" title="Euclid" />
              <div className="zone keter" title="Keter" />
              <div className="zone thaumiel" title="Thaumiel" />
              <div className="zone apollyon" title="Apollyon" />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={options.containmentClass}
              onChange={(e) => handleSliderChange('containmentClass', Number(e.target.value))}
              className={`${styles.themeSlider} scp-slider`}
            />
            <div className="scp-containment-indicator" style={{ left: `${options.containmentClass}%` }}>
              <div className="breach-light" />
            </div>
          </div>
          <span className={`${styles.sliderValue} scp-percentage`}>
            <span className="containment-icon">🔒</span> {options.containmentClass}%
          </span>
        </div>
      </div>

      <div className={`${styles.optionRow} scp-control-row`}>
        <div className="scp-control-header">
          <span className="scp-control-label">REDACTION LEVEL:</span>
          <div className="scp-classification redaction">{getRedactionLevel(options.redactionLevel)}</div>
        </div>
        <div className={`${styles.sliderContainer} scp-control-container`}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} scp-label`}>Clear Documentation</span>
            <span className={`${styles.rightLabel} scp-label`}>Heavily Classified</span>
          </div>
          <div className="scp-danger-meter">
            <div className="scp-redaction-preview">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`redaction-bar ${i < Math.floor(options.redactionLevel / 10) ? 'active' : ''}`} />
              ))}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={options.redactionLevel}
              onChange={(e) => handleSliderChange('redactionLevel', Number(e.target.value))}
              className={`${styles.themeSlider} scp-slider`}
            />
          </div>
          <span className={`${styles.sliderValue} scp-percentage`}>
            <span className="redaction-icon">█</span> {options.redactionLevel}%
          </span>
        </div>
      </div>
    </div>
  )
}