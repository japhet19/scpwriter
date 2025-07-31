/**
 * Draft Manager - Handles auto-saving and recovery of story configurations
 * Combines localStorage for immediate persistence with database for cross-device sync
 */

import { createClient } from '@/lib/supabase/client'
import { ThemeOptions } from '@/types/themeOptions'

export interface StoryDraft {
  id: string
  userId: string
  name: string
  theme: string
  pages: number
  protagonist?: string
  model: string
  uiTheme: string
  themeOptions: ThemeOptions
  createdAt: Date
  updatedAt: Date
  isAutoSave: boolean
}

export interface SavedDraft {
  id: string
  name: string
  config: Omit<StoryDraft, 'id' | 'userId' | 'name' | 'createdAt' | 'updatedAt' | 'isAutoSave'>
  createdAt: string
  updatedAt: string
  isAutoSave: boolean
}

class DraftManager {
  private supabase = createClient()
  private readonly AUTO_SAVE_KEY = 'plotcraft_auto_draft'
  private readonly MANUAL_DRAFTS_KEY = 'plotcraft_manual_drafts'
  private readonly AUTO_SAVE_INTERVAL = 30000 // 30 seconds
  private readonly CLEANUP_DAYS = 7
  
  private autoSaveTimer: NodeJS.Timeout | null = null
  private lastAutoSave: StoryDraft | null = null

  /**
   * Start auto-saving the current configuration
   */
  startAutoSave(config: Omit<StoryDraft, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isAutoSave'>) {
    this.stopAutoSave() // Clear any existing timer
    
    // Save immediately
    this.autoSaveDraft(config)
    
    // Set up interval for continuous saving
    this.autoSaveTimer = setInterval(() => {
      this.autoSaveDraft(config)
    }, this.AUTO_SAVE_INTERVAL)
  }

  /**
   * Stop auto-saving
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  /**
   * Auto-save current configuration
   */
  private async autoSaveDraft(config: Omit<StoryDraft, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isAutoSave'>) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) return

      const draft: StoryDraft = {
        ...config,
        id: 'auto-save',
        userId,
        name: 'Auto-saved Configuration',
        createdAt: new Date(),
        updatedAt: new Date(),
        isAutoSave: true
      }

      // Save to localStorage immediately
      localStorage.setItem(this.AUTO_SAVE_KEY, JSON.stringify(draft))
      this.lastAutoSave = draft

      // Save to database (fire and forget)
      this.saveDraftToDatabase(draft).catch(console.error)
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }

  /**
   * Manually save a named configuration
   */
  async saveNamedDraft(
    name: string, 
    config: Omit<StoryDraft, 'id' | 'userId' | 'name' | 'createdAt' | 'updatedAt' | 'isAutoSave'>
  ): Promise<string> {
    const userId = await this.getCurrentUserId()
    if (!userId) throw new Error('User not authenticated')

    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const draft: StoryDraft = {
      ...config,
      id: draftId,
      userId,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      isAutoSave: false
    }

    // Save to localStorage
    const existingDrafts = this.getLocalDrafts()
    existingDrafts[draftId] = draft
    localStorage.setItem(this.MANUAL_DRAFTS_KEY, JSON.stringify(existingDrafts))

    // Save to database
    await this.saveDraftToDatabase(draft)

    return draftId
  }

  /**
   * Get the auto-saved draft if available
   */
  getAutoSavedDraft(): StoryDraft | null {
    try {
      const saved = localStorage.getItem(this.AUTO_SAVE_KEY)
      if (!saved) return null

      const draft = JSON.parse(saved) as StoryDraft
      
      // Check if the auto-save is recent (within last 4 hours)
      const savedTime = new Date(draft.updatedAt).getTime()
      const now = Date.now()
      const fourHours = 4 * 60 * 60 * 1000
      
      if (now - savedTime > fourHours) {
        localStorage.removeItem(this.AUTO_SAVE_KEY)
        return null
      }

      return {
        ...draft,
        createdAt: new Date(draft.createdAt),
        updatedAt: new Date(draft.updatedAt)
      }
    } catch (error) {
      console.error('Failed to load auto-saved draft:', error)
      return null
    }
  }

  /**
   * Get all manually saved drafts
   */
  getManualDrafts(): StoryDraft[] {
    try {
      const drafts = this.getLocalDrafts()
      return Object.values(drafts).map(draft => ({
        ...draft,
        createdAt: new Date(draft.createdAt),
        updatedAt: new Date(draft.updatedAt)
      }))
    } catch (error) {
      console.error('Failed to load manual drafts:', error)
      return []
    }
  }

  /**
   * Load a specific draft by ID
   */
  loadDraft(draftId: string): StoryDraft | null {
    if (draftId === 'auto-save') {
      return this.getAutoSavedDraft()
    }

    try {
      const drafts = this.getLocalDrafts()
      const draft = drafts[draftId]
      if (!draft) return null

      return {
        ...draft,
        createdAt: new Date(draft.createdAt),
        updatedAt: new Date(draft.updatedAt)
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
      return null
    }
  }

  /**
   * Delete a draft
   */
  deleteDraft(draftId: string): void {
    if (draftId === 'auto-save') {
      localStorage.removeItem(this.AUTO_SAVE_KEY)
      this.deleteFromDatabase('auto-save').catch(console.error)
      return
    }

    try {
      const drafts = this.getLocalDrafts()
      delete drafts[draftId]
      localStorage.setItem(this.MANUAL_DRAFTS_KEY, JSON.stringify(drafts))
      
      // Delete from database
      this.deleteFromDatabase(draftId).catch(console.error)
    } catch (error) {
      console.error('Failed to delete draft:', error)
    }
  }

  /**
   * Clear auto-saved draft (called when story generation starts successfully)
   */
  clearAutoSave(): void {
    localStorage.removeItem(this.AUTO_SAVE_KEY)
    this.lastAutoSave = null
    this.stopAutoSave()
    
    // Delete from database
    this.deleteFromDatabase('auto-save').catch(console.error)
  }

  /**
   * Sync drafts from database to localStorage
   */
  async syncFromDatabase(): Promise<void> {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) return

      const { data: savedConfigs } = await this.supabase
        .from('story_configs')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (!savedConfigs) return

      // Merge with local drafts, preferring newer versions
      const localDrafts = this.getLocalDrafts()
      let hasUpdates = false

      for (const config of savedConfigs) {
        const configData = config.config as any
        const draft: StoryDraft = {
          id: config.id,
          userId: config.user_id,
          name: config.name,
          theme: configData.theme,
          pages: configData.pages,
          protagonist: configData.protagonist,
          model: configData.model,
          uiTheme: configData.uiTheme,
          themeOptions: configData.themeOptions,
          createdAt: new Date(config.created_at),
          updatedAt: new Date(config.updated_at),
          isAutoSave: config.is_default || false
        }

        const existingDraft = localDrafts[draft.id]
        if (!existingDraft || new Date(existingDraft.updatedAt) < draft.updatedAt) {
          localDrafts[draft.id] = draft
          hasUpdates = true
        }
      }

      if (hasUpdates) {
        localStorage.setItem(this.MANUAL_DRAFTS_KEY, JSON.stringify(localDrafts))
      }
    } catch (error) {
      console.error('Failed to sync from database:', error)
    }
  }

  /**
   * Clean up old drafts
   */
  async cleanup(): Promise<void> {
    try {
      // Clean up localStorage
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.CLEANUP_DAYS)

      const localDrafts = this.getLocalDrafts()
      let hasChanges = false

      for (const [draftId, draft] of Object.entries(localDrafts)) {
        if (new Date(draft.updatedAt) < cutoffDate) {
          delete localDrafts[draftId]
          hasChanges = true
        }
      }

      if (hasChanges) {
        localStorage.setItem(this.MANUAL_DRAFTS_KEY, JSON.stringify(localDrafts))
      }

      // Clean up database
      const userId = await this.getCurrentUserId()
      if (userId) {
        await this.supabase
          .from('story_configs')
          .delete()
          .eq('user_id', userId)
          .lt('updated_at', cutoffDate.toISOString())
      }
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  }

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      return session?.user?.id || null
    } catch (error) {
      console.error('Failed to get user ID:', error)
      return null
    }
  }

  /**
   * Get local drafts from localStorage
   */
  private getLocalDrafts(): Record<string, StoryDraft> {
    try {
      const saved = localStorage.getItem(this.MANUAL_DRAFTS_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch (error) {
      console.error('Failed to parse local drafts:', error)
      return {}
    }
  }

  /**
   * Save draft to database
   */
  private async saveDraftToDatabase(draft: StoryDraft): Promise<void> {
    try {
      const configData = {
        theme: draft.theme,
        pages: draft.pages,
        protagonist: draft.protagonist,
        model: draft.model,
        uiTheme: draft.uiTheme,
        themeOptions: draft.themeOptions
      }

      const payload = {
        user_id: draft.userId,
        name: draft.name,
        config: configData,
        is_default: draft.isAutoSave,
        updated_at: draft.updatedAt.toISOString()
      }

      if (draft.id === 'auto-save') {
        // For auto-save, use upsert with a known ID pattern
        await this.supabase
          .from('story_configs')
          .upsert({
            id: `auto_${draft.userId}`,
            ...payload
          })
      } else {
        // For manual drafts, insert and let UUID be generated
        await this.supabase
          .from('story_configs')
          .insert(payload)
      }
    } catch (error) {
      console.error('Failed to save to database:', error)
      // Don't throw - localStorage backup is sufficient
    }
  }

  /**
   * Delete from database
   */
  private async deleteFromDatabase(draftId: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) return

      const dbId = draftId === 'auto-save' ? `auto_${userId}` : draftId
      await this.supabase
        .from('story_configs')
        .delete()
        .eq('id', dbId)
        .eq('user_id', userId)
    } catch (error) {
      console.error('Failed to delete from database:', error)
    }
  }
}

// Export singleton instance
export const draftManager = new DraftManager()

// Export helper functions
export const formatDraftAge = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours}h ago` 
  return `${diffDays}d ago`
}

export const generateDraftPreview = (draft: StoryDraft): string => {
  const parts = []
  if (draft.theme) parts.push(`"${draft.theme.substring(0, 50)}${draft.theme.length > 50 ? '...' : ''}"`)
  if (draft.protagonist) parts.push(`[${draft.protagonist}]`)
  parts.push(`${draft.pages} pages`)
  parts.push(draft.uiTheme?.toUpperCase() || 'UNKNOWN')
  return parts.join(' • ')
}