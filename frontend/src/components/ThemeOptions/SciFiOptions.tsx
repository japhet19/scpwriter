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
        <span className="scifi-option-label">Tech Level <span className="scifi-unit">[TECH]</span>:</span>
        <div className={`${styles.sliderContainer} scifi-slider-container`}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} scifi-label`}>Hard Science Realistic</span>
            <span className={`${styles.rightLabel} scifi-label`}>Space Opera Fantasy</span>
          </div>
          <div className="scifi-slider-wrapper">
            <input
              type="range"
              min="0"
              max="100"
              value={options.techLevel}
              onChange={(e) => handleSliderChange('techLevel', Number(e.target.value))}
              className={`${styles.themeSlider} scifi-slider`}
              style={{
                '--slider-value': `${options.techLevel}%`
              } as React.CSSProperties}
            />
            <div className="scifi-slider-value" style={{ left: `calc(${options.techLevel}% - 20px)` }}>
              {options.techLevel}%
            </div>
          </div>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span className="scifi-option-label">Science Type <span className="scifi-unit">[SCI]</span>:</span>
        <div className={`${styles.sliderContainer} scifi-slider-container`}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} scifi-label`}>Physics & Engineering</span>
            <span className={`${styles.rightLabel} scifi-label`}>Biology & Consciousness</span>
          </div>
          <div className="scifi-slider-wrapper">
            <input
              type="range"
              min="0"
              max="100"
              value={options.scienceType}
              onChange={(e) => handleSliderChange('scienceType', Number(e.target.value))}
              className={`${styles.themeSlider} scifi-slider`}
              style={{
                '--slider-value': `${options.scienceType}%`
              } as React.CSSProperties}
            />
            <div className="scifi-slider-value" style={{ left: `calc(${options.scienceType}% - 20px)` }}>
              {options.scienceType}%
            </div>
          </div>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span className="scifi-option-label">Scope <span className="scifi-unit">[RNG]</span>:</span>
        <div className={`${styles.sliderContainer} scifi-slider-container`}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} scifi-label`}>Personal Character Story</span>
            <span className={`${styles.rightLabel} scifi-label`}>Galactic Civilization</span>
          </div>
          <div className="scifi-slider-wrapper">
            <input
              type="range"
              min="0"
              max="100"
              value={options.scope}
              onChange={(e) => handleSliderChange('scope', Number(e.target.value))}
              className={`${styles.themeSlider} scifi-slider`}
              style={{
                '--slider-value': `${options.scope}%`
              } as React.CSSProperties}
            />
            <div className="scifi-slider-value" style={{ left: `calc(${options.scope}% - 20px)` }}>
              {options.scope}%
            </div>
          </div>
        </div>
      </div>

      <div className={styles.optionRow}>
        <span className="scifi-option-label">Outlook <span className="scifi-unit">[VIS]</span>:</span>
        <div className={`${styles.sliderContainer} scifi-slider-container`}>
          <div className={styles.sliderLabels}>
            <span className={`${styles.leftLabel} scifi-label`}>Dystopian Warning</span>
            <span className={`${styles.rightLabel} scifi-label`}>Utopian Future</span>
          </div>
          <div className="scifi-slider-wrapper">
            <input
              type="range"
              min="0"
              max="100"
              value={options.outlook}
              onChange={(e) => handleSliderChange('outlook', Number(e.target.value))}
              className={`${styles.themeSlider} scifi-slider`}
              style={{
                '--slider-value': `${options.outlook}%`
              } as React.CSSProperties}
            />
            <div className="scifi-slider-value" style={{ left: `calc(${options.outlook}% - 20px)` }}>
              {options.outlook}%
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scifi-option-label {
          color: #00e5ff;
          font-family: 'Exo 2', sans-serif;
          font-weight: 300;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-shadow: 0 0 5px rgba(0, 229, 255, 0.5);
        }
        
        .scifi-unit {
          color: #64ffda;
          font-size: 11px;
          opacity: 0.8;
        }
        
        .scifi-label {
          color: #e0f7fa;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          text-shadow: 0 0 3px rgba(100, 255, 218, 0.3);
        }
        
        .scifi-slider-container {
          width: 100%;
          display: flex;
          align-items: center;
          position: relative;
        }
        
        .scifi-slider-wrapper {
          position: relative;
          width: 100%;
          margin-top: 10px;
        }
        
        .scifi-slider {
          width: 100% !important;
          height: 12px !important;
          background: linear-gradient(90deg, 
            rgba(0, 229, 255, 0.2) 0%, 
            rgba(124, 77, 255, 0.2) 100%);
          border: 1px solid rgba(0, 229, 255, 0.4);
          border-radius: 6px;
          position: relative;
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
        }
        
        .scifi-slider::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(90deg,
            transparent 0px,
            transparent 4px,
            rgba(100, 255, 218, 0.1) 4px,
            rgba(100, 255, 218, 0.1) 6px);
          border-radius: 6px;
          pointer-events: none;
        }
        
        /* Webkit thumb */
        .scifi-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 28px !important;
          height: 28px !important;
          background: radial-gradient(circle, 
            #64ffda 0%, #00e5ff 50%, #7c4dff 100%);
          border: 2px solid #e0f7fa;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(100, 255, 218, 0.6);
          position: relative;
          z-index: 10;
          transition: all 0.3s ease;
        }
        
        .scifi-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 30px rgba(100, 255, 218, 0.8);
        }
        
        /* Firefox thumb */
        .scifi-slider::-moz-range-thumb {
          width: 28px !important;
          height: 28px !important;
          background: radial-gradient(circle, 
            #64ffda 0%, #00e5ff 50%, #7c4dff 100%);
          border: 2px solid #e0f7fa;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(100, 255, 218, 0.6);
          position: relative;
          z-index: 10;
          transition: all 0.3s ease;
        }
        
        .scifi-slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 30px rgba(100, 255, 218, 0.8);
        }
        
        /* Holographic value display */
        .scifi-slider-value {
          position: absolute;
          top: -30px;
          transform: translateX(-50%);
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.6);
          padding: 4px 8px;
          font-size: 12px;
          font-family: 'Space Mono', monospace;
          color: #64ffda;
          pointer-events: none;
          white-space: nowrap;
          box-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
          opacity: 0.9;
        }
        
        .scifi-slider-value::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 6px 6px 0 6px;
          border-color: rgba(0, 229, 255, 0.6) transparent transparent transparent;
        }
        
        /* Reduce motion support */
        @media (prefers-reduced-motion: reduce) {
          .scifi-slider::-webkit-slider-thumb,
          .scifi-slider::-moz-range-thumb {
            transition: none;
          }
        }
      `}</style>
    </div>
  )
}