import React, { useState, useRef, useEffect } from 'react'
import styles from './ThemeOptions.module.css'
import type { FantasyOptions } from '@/types/themeOptions'

interface FantasyOptionsProps {
  options: FantasyOptions
  onChange: (options: FantasyOptions) => void
}

export default function FantasyOptions({ options, onChange }: FantasyOptionsProps) {
  const [activeSlider, setActiveSlider] = useState<string | null>(null)
  const [sparkles, setSparkles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const handleSliderChange = (key: keyof FantasyOptions, value: number) => {
    onChange({ ...options, [key]: value })
    
    // Create sparkle effect on slider change
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const newSparkles = Array.from({ length: 3 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        delay: i * 100
      }))
      
      setSparkles(prev => [...prev, ...newSparkles])
      
      // Remove sparkles after animation
      setTimeout(() => {
        setSparkles(prev => prev.filter(sparkle => !newSparkles.some(ns => ns.id === sparkle.id)))
      }, 2000)
    }
  }

  const handleSliderMouseEnter = (sliderName: string) => {
    setActiveSlider(sliderName)
  }

  const handleSliderMouseLeave = () => {
    setActiveSlider(null)
  }

  // Get magical color based on slider value
  const getMagicalColor = (value: number, baseColors: string[]) => {
    const normalizedValue = value / 100
    if (normalizedValue < 0.5) {
      return baseColors[0]
    } else {
      return baseColors[1]
    }
  }

  return (
    <div className={styles.themeOptions} ref={containerRef} style={{ position: 'relative' }}>
      {/* Magical sparkles overlay */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="magical-sparkle"
          style={{
            position: 'absolute',
            left: sparkle.x,
            top: sparkle.y,
            width: '4px',
            height: '4px',
            background: '#FFD700',
            borderRadius: '50%',
            boxShadow: '0 0 6px #FFD700',
            animation: `sparkleEffect 2s ease-out forwards`,
            animationDelay: `${sparkle.delay}ms`,
            pointerEvents: 'none',
            zIndex: 10
          }}
        />
      ))}
      
      <div className={`${styles.optionRow} fantasy-slider-row`}>
        <span className="fantasy-label">✨ Magic Level:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>🏰 Low Magic Medieval</span>
            <span className={styles.rightLabel}>⚡ Reality-Bending Powers</span>
          </div>
          <div className="magical-slider-container">
            <input
              type="range"
              min="0"
              max="100"
              value={options.magicLevel}
              onChange={(e) => handleSliderChange('magicLevel', Number(e.target.value))}
              onMouseEnter={() => handleSliderMouseEnter('magicLevel')}
              onMouseLeave={handleSliderMouseLeave}
              className={`${styles.themeSlider} magical-slider`}
              style={{
                background: `linear-gradient(to right, #8B4513 0%, var(--terminal-amber) 50%, #9932CC 100%)`,
                boxShadow: activeSlider === 'magicLevel' ? '0 0 15px rgba(255, 215, 0, 0.5)' : 'none'
              }}
            />
            {/* Magical runes along the slider */}
            <div className="rune-container">
              <span className="rune" style={{ left: '10%' }}>ᚱ</span>
              <span className="rune" style={{ left: '35%' }}>ᚢ</span>
              <span className="rune" style={{ left: '65%' }}>ᚦ</span>
              <span className="rune" style={{ left: '90%' }}>ᚨ</span>
            </div>
          </div>
          <span className={`${styles.sliderValue} magical-value`}>{options.magicLevel}%</span>
        </div>
      </div>

      <div className={`${styles.optionRow} fantasy-slider-row`}>
        <span className="fantasy-label">🌙 Tone:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>🏴 Dark & Gritty</span>
            <span className={styles.rightLabel}>🌟 Light & Whimsical</span>
          </div>
          <div className="magical-slider-container">
            <input
              type="range"
              min="0"
              max="100"
              value={options.tone}
              onChange={(e) => handleSliderChange('tone', Number(e.target.value))}
              onMouseEnter={() => handleSliderMouseEnter('tone')}
              onMouseLeave={handleSliderMouseLeave}
              className={`${styles.themeSlider} magical-slider`}
              style={{
                background: `linear-gradient(to right, #800000 0%, var(--terminal-amber) 50%, #FFD700 100%)`,
                boxShadow: activeSlider === 'tone' ? '0 0 15px rgba(255, 215, 0, 0.5)' : 'none'
              }}
            />
          </div>
          <span className={`${styles.sliderValue} magical-value`}>{options.tone}%</span>
        </div>
      </div>

      <div className={`${styles.optionRow} fantasy-slider-row`}>
        <span className="fantasy-label">⚔️ Quest Scale:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>🚶 Personal Journey</span>
            <span className={styles.rightLabel}>🌍 World-Changing Epic</span>
          </div>
          <div className="magical-slider-container">
            <input
              type="range"
              min="0"
              max="100"
              value={options.questScale}
              onChange={(e) => handleSliderChange('questScale', Number(e.target.value))}
              onMouseEnter={() => handleSliderMouseEnter('questScale')}
              onMouseLeave={handleSliderMouseLeave}
              className={`${styles.themeSlider} magical-slider`}
              style={{
                background: `linear-gradient(to right, var(--terminal-green) 0%, var(--terminal-amber) 50%, var(--terminal-red) 100%)`,
                boxShadow: activeSlider === 'questScale' ? '0 0 15px rgba(255, 215, 0, 0.5)' : 'none'
              }}
            />
          </div>
          <span className={`${styles.sliderValue} magical-value`}>{options.questScale}%</span>
        </div>
      </div>

      <div className={`${styles.optionRow} fantasy-slider-row`}>
        <span className="fantasy-label">🕰️ Time Period:</span>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span className={styles.leftLabel}>🏰 Medieval Fantasy</span>
            <span className={styles.rightLabel}>🏙️ Modern Urban Fantasy</span>
          </div>
          <div className="magical-slider-container">
            <input
              type="range"
              min="0"
              max="100"
              value={options.timePeriod}
              onChange={(e) => handleSliderChange('timePeriod', Number(e.target.value))}
              onMouseEnter={() => handleSliderMouseEnter('timePeriod')}
              onMouseLeave={handleSliderMouseLeave}
              className={`${styles.themeSlider} magical-slider`}
              style={{
                background: `linear-gradient(to right, #8B4513 0%, var(--terminal-amber) 50%, #00CED1 100%)`,
                boxShadow: activeSlider === 'timePeriod' ? '0 0 15px rgba(255, 215, 0, 0.5)' : 'none'
              }}
            />
          </div>
          <span className={`${styles.sliderValue} magical-value`}>{options.timePeriod}%</span>
        </div>
      </div>
      
      {/* Magical CSS Styles */}
      <style jsx>{`
        .fantasy-label {
          color: #FFD700;
          text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
          font-weight: 600;
        }
        
        .fantasy-slider-row {
          position: relative;
          padding: 10px;
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(26, 15, 31, 0.8) 0%, rgba(107, 70, 193, 0.1) 100%);
          transition: all 0.3s ease;
        }
        
        .fantasy-slider-row:hover {
          border-color: rgba(255, 215, 0, 0.6);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
        }
        
        .magical-slider-container {
          position: relative;
          width: 100%; /* Ensure container takes full width */
          display: flex; /* Use flex to allow slider to expand */
          align-items: center; /* Center align the slider */
        }
        
        .magical-slider {
          width: 100% !important; /* Ensure slider expands to fill container */
          flex: 1; /* Allow slider to grow within flex container */
          height: 12px !important; /* Increase from base 6px for better visibility */
          border-radius: 6px !important;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 215, 0, 0.3);
          box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.3);
        }
        
        .magical-slider:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 215, 0, 0.5);
        }
        
        /* Fantasy-specific slider thumb styling */
        .magical-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px !important; /* Increase from base 20px */
          height: 28px !important;
          border-radius: 50%;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
          border: 3px solid rgba(107, 70, 193, 0.8) !important;
          cursor: pointer;
          box-shadow: 
            0 0 15px rgba(255, 215, 0, 0.6),
            inset 0 0 8px rgba(255, 255, 255, 0.3) !important;
          transition: all 0.2s;
          position: relative;
        }
        
        .magical-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15) !important;
          box-shadow: 
            0 0 25px rgba(255, 215, 0, 0.8),
            inset 0 0 10px rgba(255, 255, 255, 0.4) !important;
          background: linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FFD700 100%);
        }
        
        /* Firefox slider thumb */
        .magical-slider::-moz-range-thumb {
          width: 28px !important;
          height: 28px !important;
          border-radius: 50%;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
          border: 3px solid rgba(107, 70, 193, 0.8) !important;
          cursor: pointer;
          box-shadow: 
            0 0 15px rgba(255, 215, 0, 0.6),
            inset 0 0 8px rgba(255, 255, 255, 0.3);
          transition: all 0.2s;
        }
        
        .magical-slider::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 
            0 0 25px rgba(255, 215, 0, 0.8),
            inset 0 0 10px rgba(255, 255, 255, 0.4);
          background: linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FFD700 100%);
        }
        
        .rune-container {
          position: absolute;
          top: -28px; /* Adjust for larger slider height */
          left: 0;
          width: 100%;
          height: 20px;
          pointer-events: none;
        }
        
        .rune {
          position: absolute;
          color: #6B46C1;
          font-size: 12px;
          opacity: 0.6;
          animation: runeGlow 3s ease-in-out infinite;
          transform: translateX(-50%);
        }
        
        .magical-value {
          color: #FFD700 !important;
          text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
          font-weight: bold;
          font-size: 18px !important; /* Increase from base 16px */
          min-width: 50px !important; /* Increase from base 40px */
          margin-top: 8px !important; /* Adjust for larger slider */
        }
        
        @keyframes sparkleEffect {
          0% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.5) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: scale(0) rotate(360deg);
          }
        }
        
        @keyframes runeGlow {
          0%, 100% {
            opacity: 0.6;
            text-shadow: 0 0 5px #6B46C1;
          }
          50% {
            opacity: 1;
            text-shadow: 0 0 10px #6B46C1, 0 0 15px #6B46C1;
          }
        }
        
        /* Responsive design for fantasy sliders */
        @media (max-width: 768px) {
          .magical-slider {
            height: 10px !important; /* Slightly smaller on mobile */
          }
          
          .magical-slider::-webkit-slider-thumb {
            width: 24px !important; /* Smaller thumb on mobile */
            height: 24px !important;
          }
          
          .magical-slider::-moz-range-thumb {
            width: 24px !important;
            height: 24px !important;
          }
          
          .magical-value {
            font-size: 16px !important; /* Standard size on mobile */
            min-width: 45px !important;
          }
          
          .rune-container {
            top: -25px; /* Adjust for smaller mobile slider */
          }
        }
        
        /* Reduce animations for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .magical-slider,
          .fantasy-slider-row,
          .rune {
            animation: none;
            transition: none;
          }
          
          .magical-slider:hover {
            transform: none;
          }
          
          .magical-slider::-webkit-slider-thumb:hover,
          .magical-slider::-moz-range-thumb:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  )
}