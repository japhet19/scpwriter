'use client'

import React, { useState, useEffect } from 'react'
import styles from './StoryConfig.module.css'
import { MODEL_CATEGORIES, DEFAULT_MODEL, getModelById, getCostIndicator, ModelInfo } from '@/config/models'
import TerminalDropdown from '@/components/TerminalDropdown/TerminalDropdown'
import { useTheme } from '@/contexts/ThemeContext'
import { getTheme } from '@/themes/themeConfig'
import { ThemeOptions, getDefaultThemeOptions } from '@/types/themeOptions'
import { generateThemeProtagonistName, generateAdvancedThemeName } from '@/utils/nameGenerator'
import SCPOptions from '@/components/ThemeOptions/SCPOptions'
import FantasyOptions from '@/components/ThemeOptions/FantasyOptions'
import CyberpunkOptions from '@/components/ThemeOptions/CyberpunkOptions'
import RomanceOptions from '@/components/ThemeOptions/RomanceOptions'
import NoirOptions from '@/components/ThemeOptions/NoirOptions'
import SciFiOptions from '@/components/ThemeOptions/SciFiOptions'

interface StoryConfigProps {
  onSubmit: (config: StoryConfiguration) => void
  onChangeTheme?: () => void
}

export interface StoryConfiguration {
  theme: string
  pages: number
  protagonist?: string
  model: string
  uiTheme: string
  themeOptions: ThemeOptions
}

export default function StoryConfig({ onSubmit, onChangeTheme }: StoryConfigProps) {
  const [theme, setTheme] = useState('')
  const [pages, setPages] = useState(3)
  const [protagonist, setProtagonist] = useState('')
  const [isGeneratingName, setIsGeneratingName] = useState(false)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const { themeId, currentTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState(themeId)
  const [themeOptions, setThemeOptions] = useState<ThemeOptions>(() => getDefaultThemeOptions(themeId))
  
  // Get the selected theme's configuration
  const selectedThemeConfig = getTheme(selectedTheme)

  // Reset theme options when theme changes
  useEffect(() => {
    setThemeOptions(getDefaultThemeOptions(selectedTheme))
  }, [selectedTheme])

  // Render the appropriate theme options component
  const renderThemeOptions = () => {
    switch (selectedTheme) {
      case 'scp':
        return <SCPOptions options={themeOptions as any} onChange={setThemeOptions} />
      case 'fantasy':
        return <FantasyOptions options={themeOptions as any} onChange={setThemeOptions} />
      case 'cyberpunk':
        return <CyberpunkOptions options={themeOptions as any} onChange={setThemeOptions} />
      case 'romance':
        return <RomanceOptions options={themeOptions as any} onChange={setThemeOptions} />
      case 'noir':
        return <NoirOptions options={themeOptions as any} onChange={setThemeOptions} />
      case 'scifi':
        return <SciFiOptions options={themeOptions as any} onChange={setThemeOptions} />
      default:
        return <SCPOptions options={themeOptions as any} onChange={setThemeOptions} />
    }
  }

  const generateProtagonistName = () => {
    setIsGeneratingName(true)
    
    setTimeout(() => {
      // Use advanced name generation for variety, fallback to basic if needed
      const useAdvanced = Math.random() < 0.3 // 30% chance of advanced names
      const generatedName = useAdvanced 
        ? generateAdvancedThemeName(selectedTheme)
        : generateThemeProtagonistName(selectedTheme)
      
      setProtagonist(generatedName)
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
      model: selectedModel,
      uiTheme: selectedTheme,
      themeOptions
    })
  }

  return (
    <form onSubmit={handleSubmit} className={styles.configForm}>
      <div className={styles.formHeader}>
        <h2>┌─── {selectedThemeConfig.formConfig.headerTitle} ───────────────────┐</h2>
        <div className={styles.themeIndicator}>
          <span className={styles.themeLabel}>SELECTED UNIVERSE:</span>
          <span className={styles.themeName}>{selectedThemeConfig.name.toUpperCase()}</span>
          <button 
            type="button" 
            className={styles.changeThemeButton}
            onClick={onChangeTheme}
            title="Change theme"
          >
            ⚙️ CHANGE
          </button>
        </div>
      </div>
      
      <div className={styles.formContent}>
        <div className={styles.statusRow}>
          <span>{selectedThemeConfig.formConfig.statusLine1}</span>
          <span>{selectedThemeConfig.formConfig.statusLine2}</span>
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
          <label className={styles.label}>▼ {selectedThemeConfig.name.toUpperCase()} OPTIONS</label>
          {renderThemeOptions()}
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