'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { draftManager, StoryDraft, formatDraftAge, generateDraftPreview } from '@/utils/draftManager'
import styles from './DraftRecovery.module.css'

interface DraftRecoveryProps {
  onRestore: (draft: StoryDraft) => void
  onDismiss: () => void
  onNewStory: () => void
}

export default function DraftRecovery({ onRestore, onDismiss, onNewStory }: DraftRecoveryProps) {
  const { currentTheme } = useTheme()
  const [autoSavedDraft, setAutoSavedDraft] = useState<StoryDraft | null>(null)
  const [manualDrafts, setManualDrafts] = useState<StoryDraft[]>([])
  const [selectedDraft, setSelectedDraft] = useState<StoryDraft | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDrafts()
  }, [])

  const loadDrafts = async () => {
    try {
      setLoading(true)
      
      // Sync from database first
      await draftManager.syncFromDatabase()
      
      // Load auto-saved draft
      const autoSaved = draftManager.getAutoSavedDraft()
      setAutoSavedDraft(autoSaved)
      
      // Load manual drafts
      const manual = draftManager.getManualDrafts()
      setManualDrafts(manual.filter(d => !d.isAutoSave))
      
      // Auto-select the most recent draft
      if (autoSaved) {
        setSelectedDraft(autoSaved)
      } else if (manual.length > 0) {
        setSelectedDraft(manual[0])
      }
    } catch (error) {
      console.error('Failed to load drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = () => {
    if (selectedDraft) {
      onRestore(selectedDraft)
    }
  }

  const handleDeleteDraft = (draft: StoryDraft) => {
    draftManager.deleteDraft(draft.id)
    
    if (draft.isAutoSave) {
      setAutoSavedDraft(null)
    } else {
      setManualDrafts(prev => prev.filter(d => d.id !== draft.id))
    }
    
    // Update selected draft if it was deleted
    if (selectedDraft?.id === draft.id) {
      const remaining = draft.isAutoSave ? manualDrafts : [autoSavedDraft, ...manualDrafts].filter(Boolean)
      setSelectedDraft(remaining[0] || null)
    }
  }

  const getDraftIcon = (theme: string) => {
    const icons: Record<string, string> = {
      scp: '🔬',
      fantasy: '✨',
      romance: '💖',
      cyberpunk: '🌐',
      noir: '🕵️',
      scifi: '🚀'
    }
    return icons[theme] || '📝'
  }

  if (loading) {
    return (
      <div className={styles.recoveryOverlay}>
        <div className={styles.recoveryModal}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}>
              <div className={styles.scanLine}></div>
            </div>
            <p>SCANNING FOR SAVED CONFIGURATIONS...</p>
          </div>
        </div>
      </div>
    )
  }

  // If no drafts found, don't show the recovery modal
  if (!autoSavedDraft && manualDrafts.length === 0) {
    onDismiss()
    return null
  }

  return (
    <div className={styles.recoveryOverlay}>
      <div className={`${styles.recoveryModal} ${currentTheme.id === 'fantasy' ? styles.fantasyModal : ''}`}>
        <div className={styles.modalHeader}>
          <h2>┌─── CONFIGURATION RECOVERY ─ {currentTheme.name.toUpperCase()} ───┐</h2>
          <div className={styles.terminalCommand}>
            <span className={styles.prompt}>recovery@plotcraft:~$</span>
            <span className={styles.command}>ls -la saved_configs/</span>
          </div>
        </div>

        <div className={styles.modalContent}>
          {autoSavedDraft && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>⚠ AUTO-SAVED CONFIGURATION</h3>
              <p className={styles.sectionDescription}>
                Found an interrupted session from {formatDraftAge(autoSavedDraft.updatedAt)}
              </p>
              
              <div 
                className={`${styles.draftItem} ${selectedDraft?.id === autoSavedDraft.id ? styles.selected : ''}`}
                onClick={() => setSelectedDraft(autoSavedDraft)}
              >
                <div className={styles.draftIcon}>
                  {getDraftIcon(autoSavedDraft.uiTheme)}
                </div>
                <div className={styles.draftInfo}>
                  <div className={styles.draftName}>
                    {autoSavedDraft.name}
                    <span className={styles.autoSaveBadge}>AUTO</span>
                  </div>
                  <div className={styles.draftPreview}>
                    {generateDraftPreview(autoSavedDraft)}
                  </div>
                  <div className={styles.draftMeta}>
                    Updated: {formatDraftAge(autoSavedDraft.updatedAt)}
                  </div>
                </div>
                <div className={styles.draftActions}>
                  <button 
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteDraft(autoSavedDraft)
                    }}
                    title="Delete auto-saved draft"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {manualDrafts.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>💾 SAVED CONFIGURATIONS</h3>
              <p className={styles.sectionDescription}>
                {manualDrafts.length} manually saved configuration{manualDrafts.length !== 1 ? 's' : ''} found
              </p>
              
              <div className={styles.draftList}>
                {manualDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className={`${styles.draftItem} ${selectedDraft?.id === draft.id ? styles.selected : ''}`}
                    onClick={() => setSelectedDraft(draft)}
                  >
                    <div className={styles.draftIcon}>
                      {getDraftIcon(draft.uiTheme)}
                    </div>
                    <div className={styles.draftInfo}>
                      <div className={styles.draftName}>{draft.name}</div>
                      <div className={styles.draftPreview}>
                        {generateDraftPreview(draft)}
                      </div>
                      <div className={styles.draftMeta}>
                        Saved: {formatDraftAge(draft.createdAt)}
                        {draft.updatedAt.getTime() !== draft.createdAt.getTime() && 
                          ` • Updated: ${formatDraftAge(draft.updatedAt)}`
                        }
                      </div>
                    </div>
                    <div className={styles.draftActions}>
                      <button 
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteDraft(draft)
                        }}
                        title="Delete saved configuration"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedDraft && (
            <div className={styles.previewSection}>
              <h3 className={styles.sectionTitle}>📋 CONFIGURATION PREVIEW</h3>
              <div className={styles.configPreview}>
                <div className={styles.previewGrid}>
                  <div className={styles.previewItem}>
                    <span className={styles.previewLabel}>Theme:</span>
                    <span>{getDraftIcon(selectedDraft.uiTheme)} {selectedDraft.uiTheme.toUpperCase()}</span>
                  </div>
                  <div className={styles.previewItem}>
                    <span className={styles.previewLabel}>Length:</span>
                    <span>{selectedDraft.pages} pages</span>
                  </div>
                  {selectedDraft.protagonist && (
                    <div className={styles.previewItem}>
                      <span className={styles.previewLabel}>Protagonist:</span>
                      <span>{selectedDraft.protagonist}</span>
                    </div>
                  )}
                  <div className={styles.previewItem}>
                    <span className={styles.previewLabel}>AI Model:</span>
                    <span>{selectedDraft.model}</span>
                  </div>
                </div>
                <div className={styles.storyTheme}>
                  <span className={styles.previewLabel}>Story Prompt:</span>
                  <div className={styles.themeText}>"{selectedDraft.theme}"</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button 
            className={`terminal-button ${currentTheme.id === 'fantasy' ? 'fantasy-action-button' : currentTheme.id === 'romance' ? 'romance-button' : ''}`}
            onClick={handleRestore}
            disabled={!selectedDraft}
          >
            RESTORE CONFIGURATION
          </button>
          <button 
            className={`terminal-button ${currentTheme.id === 'fantasy' ? 'fantasy-action-button' : currentTheme.id === 'romance' ? 'romance-button' : ''}`}
            onClick={onNewStory}
          >
            START FRESH
          </button>
          <button 
            className="terminal-button"
            onClick={onDismiss}
          >
            DISMISS
          </button>
        </div>

        <div className={styles.modalFooter}>
          <h2>└──────────────────────────────────────────────────────┘</h2>
        </div>
      </div>
    </div>
  )
}