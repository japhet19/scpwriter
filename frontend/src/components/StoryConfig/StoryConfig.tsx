'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
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
import CostEstimate from '@/components/CostEstimate/CostEstimate'
import { estimateStoryCost } from '@/utils/costEstimator'
import { draftManager, StoryDraft, formatDraftAge } from '@/utils/draftManager'

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

interface StoryConfigWithAutoSaveProps extends StoryConfigProps {
  initialDraft?: StoryDraft
  onDraftSaved?: (draftId: string) => void
}

export default function StoryConfig({ onSubmit, onChangeTheme, initialDraft, onDraftSaved }: StoryConfigWithAutoSaveProps) {
  const [theme, setTheme] = useState('')
  const [pages, setPages] = useState(3)
  const [protagonist, setProtagonist] = useState('')
  const [isGeneratingName, setIsGeneratingName] = useState(false)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const { themeId, currentTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState(themeId)
  const [themeOptions, setThemeOptions] = useState<ThemeOptions>(() => getDefaultThemeOptions(themeId))
  const [costEstimate, setCostEstimate] = useState<ReturnType<typeof estimateStoryCost>>(null)
  
  // Auto-save related state
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [manualDrafts, setManualDrafts] = useState<StoryDraft[]>([])
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasUserInteractedRef = useRef(false)
  
  // Get the selected theme's configuration
  const selectedThemeConfig = getTheme(selectedTheme)

  // Load initial draft if provided
  useEffect(() => {
    if (initialDraft) {
      setTheme(initialDraft.theme)
      setPages(initialDraft.pages)
      setProtagonist(initialDraft.protagonist || '')
      setSelectedModel(initialDraft.model)
      setSelectedTheme(initialDraft.uiTheme)
      setThemeOptions(initialDraft.themeOptions)
      hasUserInteractedRef.current = true
    }
  }, [initialDraft])

  // Load manual drafts
  useEffect(() => {
    const loadDrafts = () => {
      const drafts = draftManager.getManualDrafts()
      setManualDrafts(drafts)
    }
    loadDrafts()
  }, [])

  // Reset theme options when theme changes (but not if we're loading from draft)
  useEffect(() => {
    if (!initialDraft) {
      setThemeOptions(getDefaultThemeOptions(selectedTheme))
    }
  }, [selectedTheme, initialDraft])

  // Create current config object
  const getCurrentConfig = useCallback(() => ({
    theme,
    pages,
    protagonist,
    model: selectedModel,
    uiTheme: selectedTheme,
    themeOptions
  }), [theme, pages, protagonist, selectedModel, selectedTheme, themeOptions])

  // Auto-save logic
  const triggerAutoSave = useCallback(() => {
    if (!hasUserInteractedRef.current) return
    
    const config = getCurrentConfig()
    
    // Only auto-save if there's meaningful content
    if (!config.theme.trim() || config.theme.length < 10) return
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      draftManager.startAutoSave(config)
      setLastAutoSave(new Date())
    }, 2000) // 2 second delay after user stops typing
  }, [getCurrentConfig])

  // Trigger auto-save when config changes
  useEffect(() => {
    triggerAutoSave()
  }, [theme, pages, protagonist, selectedModel, selectedTheme, themeOptions, triggerAutoSave])

  // Update cost estimate when model or pages change
  useEffect(() => {
    const model = getModelById(selectedModel)
    if (model) {
      const estimate = estimateStoryCost(model, pages)
      setCostEstimate(estimate)
    }
  }, [selectedModel, pages])

  // Cleanup auto-save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      draftManager.stopAutoSave()
    }
  }, [])

  // Render the appropriate theme options component
  const renderThemeOptions = () => {
    const handleThemeOptionsChange = handleInputChange(setThemeOptions)
    
    switch (selectedTheme) {
      case 'scp':
        return <SCPOptions options={themeOptions as any} onChange={handleThemeOptionsChange} />
      case 'fantasy':
        return <FantasyOptions options={themeOptions as any} onChange={handleThemeOptionsChange} />
      case 'cyberpunk':
        return <CyberpunkOptions options={themeOptions as any} onChange={handleThemeOptionsChange} />
      case 'romance':
        return <RomanceOptions options={themeOptions as any} onChange={handleThemeOptionsChange} />
      case 'noir':
        return <NoirOptions options={themeOptions as any} onChange={handleThemeOptionsChange} />
      case 'scifi':
        return <SciFiOptions options={themeOptions as any} onChange={handleThemeOptionsChange} />
      default:
        return <SCPOptions options={themeOptions as any} onChange={handleThemeOptionsChange} />
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
      hasUserInteractedRef.current = true
    }, 500)
  }

  const handleManualSave = async () => {
    if (!draftName.trim()) return
    
    try {
      setIsSavingDraft(true)
      const config = getCurrentConfig()
      const draftId = await draftManager.saveNamedDraft(draftName.trim(), config)
      
      // Refresh manual drafts list
      const updatedDrafts = draftManager.getManualDrafts()
      setManualDrafts(updatedDrafts)
      
      setShowSaveDraftModal(false)
      setDraftName('')
      
      if (onDraftSaved) {
        onDraftSaved(draftId)
      }
    } catch (error) {
      console.error('Failed to save draft:', error)
      alert('Failed to save configuration. Please try again.')
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleLoadDraft = (draft: StoryDraft) => {
    setTheme(draft.theme)
    setPages(draft.pages)
    setProtagonist(draft.protagonist || '')
    setSelectedModel(draft.model)
    setSelectedTheme(draft.uiTheme)
    setThemeOptions(draft.themeOptions)
    hasUserInteractedRef.current = true
  }

  const handleInputChange = (setter: (value: any) => void) => (value: any) => {
    hasUserInteractedRef.current = true
    setter(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!theme.trim()) return
    
    // Clear auto-save when story generation starts
    draftManager.clearAutoSave()
    
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

        {/* Auto-save Status */}
        {hasUserInteractedRef.current && (
          <div className={styles.autoSaveStatus}>
            <div className={styles.autoSaveInfo}>
              {lastAutoSave && (
                <span className={styles.autoSaveIndicator}>
                  ✓ Auto-saved {formatDraftAge(lastAutoSave)}
                </span>
              )}
              <div className={styles.draftActions}>
                <button
                  type="button"
                  className={`${styles.draftButton} terminal-button small`}
                  onClick={() => setShowSaveDraftModal(true)}
                  disabled={!theme.trim() || theme.length < 10}
                >
                  SAVE CONFIG
                </button>
                {manualDrafts.length > 0 && (
                  <div className={styles.draftsDropdown}>
                    <select
                      className="terminal-input small"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const draft = manualDrafts.find(d => d.id === e.target.value)
                          if (draft) handleLoadDraft(draft)
                        }
                      }}
                    >
                      <option value="">Load Saved...</option>
                      {manualDrafts.map(draft => (
                        <option key={draft.id} value={draft.id}>
                          {draft.name} ({formatDraftAge(draft.updatedAt)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label}>▼ {selectedThemeConfig.formConfig.descriptionLabel}</label>
          <textarea
            className={`terminal-input ${selectedTheme === 'romance' ? 'romance-input' : ''}`}
            value={theme}
            onChange={handleInputChange((e: React.ChangeEvent<HTMLTextAreaElement>) => setTheme(e.target.value))}
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
                onClick={handleInputChange(() => setTheme(example))}
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
                    onChange={handleInputChange(() => setPages(num))}
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
                className={`terminal-input ${selectedTheme === 'romance' ? 'romance-input' : ''}`}
                value={protagonist}
                onChange={handleInputChange((e: React.ChangeEvent<HTMLInputElement>) => setProtagonist(e.target.value))}
                placeholder="Enter name or generate..."
              />
              <button
                type="button"
                className={`terminal-button ${selectedTheme === 'romance' ? 'romance-button' : ''}`}
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
                onChange={handleInputChange(setSelectedModel)}
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
          <CostEstimate estimate={costEstimate} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>▼ {selectedThemeConfig.name.toUpperCase()} OPTIONS</label>
          {renderThemeOptions()}
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={`terminal-button ${selectedTheme === 'romance' ? 'romance-button' : ''}`}>
            {selectedThemeConfig.formConfig.submitButtonText}
          </button>
          <button type="button" className={`terminal-button ${selectedTheme === 'romance' ? 'romance-button' : ''}`} onClick={onChangeTheme}>
            ABORT MISSION
          </button>
        </div>
      </div>
      
      <div className={styles.formFooter}>
        <h2>└──────────────────────────────────────────────────────┘</h2>
      </div>

      {/* Save Draft Modal */}
      {showSaveDraftModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.saveModal}>
            <div className={styles.modalHeader}>
              <h3>Save Configuration</h3>
            </div>
            <div className={styles.modalContent}>
              <label>Configuration Name:</label>
              <input
                type="text"
                className="terminal-input"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Enter a name for this configuration..."
                maxLength={50}
                autoFocus
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className="terminal-button"
                onClick={handleManualSave}
                disabled={!draftName.trim() || isSavingDraft}
              >
                {isSavingDraft ? 'SAVING...' : 'SAVE'}
              </button>
              <button
                className="terminal-button"
                onClick={() => {
                  setShowSaveDraftModal(false)
                  setDraftName('')
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}