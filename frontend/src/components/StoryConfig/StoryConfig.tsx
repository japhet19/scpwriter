'use client'

import React, { useState } from 'react'
import styles from './StoryConfig.module.css'
import { MODEL_CATEGORIES, DEFAULT_MODEL, getModelById, getCostIndicator, ModelInfo } from '@/config/models'
import TerminalDropdown from '@/components/TerminalDropdown/TerminalDropdown'
import ThemeSelector from '@/components/ThemeSelector/ThemeSelector'
import { useTheme } from '@/contexts/ThemeContext'
import { getTheme } from '@/themes/themeConfig'

interface StoryConfigProps {
  onSubmit: (config: StoryConfiguration) => void
}

export interface StoryConfiguration {
  theme: string
  pages: number
  protagonist?: string
  horrorLevel: number
  enableRedaction: boolean
  model: string
  uiTheme: string
}

export default function StoryConfig({ onSubmit }: StoryConfigProps) {
  const [theme, setTheme] = useState('')
  const [pages, setPages] = useState(3)
  const [protagonist, setProtagonist] = useState('')
  const [horrorLevel, setHorrorLevel] = useState(40)
  const [enableRedaction, setEnableRedaction] = useState(true)
  const [isGeneratingName, setIsGeneratingName] = useState(false)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const { themeId, currentTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState(themeId)
  
  // Get the selected theme's configuration
  const selectedThemeConfig = getTheme(selectedTheme)

  const generateProtagonistName = () => {
    setIsGeneratingName(true)
    const firstNames = ['Marcus', 'Elena', 'Raj', 'Yuki', 'Amara', 'Viktor', 'Zara', 'Chen']
    const lastNames = ['Thompson', 'Vasquez', 'Patel', 'Tanaka', 'Okafor', 'Petrov', 'Hassan', 'Wei']
    const titles = ['Agent', 'Dr.', 'Researcher', 'Specialist', 'Director', 'Professor']
    
    setTimeout(() => {
      const title = titles[Math.floor(Math.random() * titles.length)]
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      setProtagonist(`${title} ${firstName} ${lastName}`)
      setIsGeneratingName(false)
    }, 500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!theme.trim()) return
    
    onSubmit({
      theme,
      pages,
      protagonist: protagonist.trim() || undefined,
      horrorLevel,
      enableRedaction,
      model: selectedModel,
      uiTheme: selectedTheme
    })
  }

  return (
    <form onSubmit={handleSubmit} className={styles.configForm}>
      <div className={styles.formHeader}>
        <h2>┌─── {selectedThemeConfig.formConfig.headerTitle} ───────────────────┐</h2>
      </div>
      
      <div className={styles.formContent}>
        <div className={styles.statusRow}>
          <span>{selectedThemeConfig.formConfig.statusLine1}</span>
          <span>{selectedThemeConfig.formConfig.statusLine2}</span>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>▼ STORY THEME SELECTION</label>
          <ThemeSelector 
            storyTheme={theme}
            onThemeChange={setSelectedTheme}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>▼ {selectedThemeConfig.formConfig.descriptionLabel}</label>
          <textarea
            className="terminal-input"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder={selectedThemeConfig.formConfig.descriptionPlaceholder}
            rows={3}
            required
          />
          <div className={styles.examples}>
            <small>Examples:</small>
            {selectedThemeConfig.formConfig.examplePrompts.map((example, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.exampleButton}
                onClick={() => setTheme(example)}
              >
                • {example}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>▼ NARRATIVE PARAMETERS</label>
          <div className={styles.paramRow}>
            <span>{selectedThemeConfig.formConfig.lengthLabel}:</span>
            <div className={styles.pageOptions}>
              {[1, 2, 3, 5, 10].map(num => (
                <label key={num} className="led-radio">
                  <input
                    type="radio"
                    name="pages"
                    value={num}
                    checked={pages === num}
                    onChange={() => setPages(num)}
                  />
                  <span className="led-indicator" />
                  <span>{num}</span>
                </label>
              ))}
              <span className={styles.pageLabel}>pages</span>
            </div>
          </div>
          
          <div className={styles.paramRow}>
            <span>Protagonist:</span>
            <div className={styles.protagonistInput}>
              <input
                type="text"
                className="terminal-input"
                value={protagonist}
                onChange={(e) => setProtagonist(e.target.value)}
                placeholder="Enter name or generate..."
              />
              <button
                type="button"
                className="terminal-button"
                onClick={generateProtagonistName}
                disabled={isGeneratingName}
              >
                {isGeneratingName ? 'GENERATING...' : 'GENERATE'}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>▼ AI MODEL SELECTION</label>
          <div className={styles.paramRow}>
            <span>Model:</span>
            <div className={styles.modelSelection}>
              <TerminalDropdown
                categories={MODEL_CATEGORIES}
                value={selectedModel}
                onChange={setSelectedModel}
              />
              {(() => {
                const model = getModelById(selectedModel)
                if (model) {
                  return (
                    <div className={styles.modelInfo}>
                      <span className={styles.modelDescription}>{model.description}</span>
                      <span className={styles.modelDetails}>
                        {model.provider} • {model.contextLength?.toLocaleString()} tokens • {getCostIndicator(model.costLevel)}
                      </span>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>▼ ADVANCED OPTIONS</label>
          <div className={styles.paramRow}>
            <span>Horror Level:</span>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min="0"
                max="100"
                value={horrorLevel}
                onChange={(e) => setHorrorLevel(Number(e.target.value))}
                className={styles.horrorSlider}
                style={{
                  background: `linear-gradient(to right, var(--terminal-green) 0%, var(--terminal-amber) 50%, var(--terminal-red) 100%)`
                }}
              />
              <span className={styles.sliderValue}>{horrorLevel}%</span>
            </div>
          </div>
          
          <div className={styles.paramRow}>
            <span>Redaction:</span>
            <div className={styles.toggleOptions}>
              <label className="led-radio">
                <input
                  type="radio"
                  name="redaction"
                  checked={enableRedaction}
                  onChange={() => setEnableRedaction(true)}
                />
                <span className="led-indicator" />
                <span>ON</span>
              </label>
              <label className="led-radio">
                <input
                  type="radio"
                  name="redaction"
                  checked={!enableRedaction}
                  onChange={() => setEnableRedaction(false)}
                />
                <span className="led-indicator" />
                <span>OFF</span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className="terminal-button">
            {selectedThemeConfig.formConfig.submitButtonText}
          </button>
          <button type="button" className="terminal-button" onClick={() => window.location.reload()}>
            ABORT MISSION
          </button>
        </div>
      </div>
      
      <div className={styles.formFooter}>
        <h2>└──────────────────────────────────────────────────────┘</h2>
      </div>
    </form>
  )
}