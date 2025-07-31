'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import Terminal from '@/components/Terminal/Terminal'
import BackgroundSwitcher from '@/components/Backgrounds/BackgroundSwitcher'
import styles from './stories.module.css'

interface StoryListItem {
  id: number
  title: string
  theme: string
  protagonist_name?: string
  tokens_used?: number
  model_used?: string
  created_at: string
  updated_at: string
  session_id?: string
  word_count: number
  preview: string
}

interface StoriesListResponse {
  stories: StoryListItem[]
  total_count: number
  page: number
  page_size: number
  has_next: boolean
}

interface ThemeStats {
  total_stories: number
  themes: Record<string, number>
}

export default function StoriesPage() {
  const { user, loading: authLoading } = useAuth()
  const { currentTheme } = useTheme()
  const router = useRouter()
  const supabase = createClient()
  
  const [stories, setStories] = useState<StoryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [themeStats, setThemeStats] = useState<ThemeStats | null>(null)
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'word_count'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedStory, setSelectedStory] = useState<StoryListItem | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState<number | null>(null)
  const [newTitle, setNewTitle] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin')
    }
  }, [authLoading, user, router])

  const fetchStories = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const params = new URLSearchParams({
        page: '1',
        page_size: '50',
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      
      if (selectedThemeFilter !== 'all') {
        params.append('theme', selectedThemeFilter)
      }
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      const apiUrl = process.env.NODE_ENV === 'development' 
        ? `http://localhost:8000/api/stories?${params}`
        : `/api/stories?${params}`
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stories')
      }

      const data: StoriesListResponse = await response.json()
      setStories(data.stories)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stories')
    } finally {
      setLoading(false)
    }
  }

  const fetchThemeStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8000/api/stories/themes/stats'
        : '/api/stories/themes/stats'
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data: ThemeStats = await response.json()
        setThemeStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch theme stats:', err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchStories()
      fetchThemeStats()
    }
  }, [user, selectedThemeFilter, searchQuery, sortBy, sortOrder])

  const handleDeleteStory = async (storyId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const apiUrl = process.env.NODE_ENV === 'development' 
        ? `http://localhost:8000/api/stories/${storyId}`
        : `/api/stories/${storyId}`
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete story')
      }

      // Refresh stories list
      await fetchStories()
      await fetchThemeStats()
      setShowDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete story')
    }
  }

  const handleUpdateTitle = async (storyId: number, title: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const apiUrl = process.env.NODE_ENV === 'development' 
        ? `http://localhost:8000/api/stories/${storyId}`
        : `/api/stories/${storyId}`
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        throw new Error('Failed to update story')
      }

      // Refresh stories list
      await fetchStories()
      setEditingTitle(null)
      setNewTitle('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update story')
    }
  }

  const handleViewStory = async (storyId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const apiUrl = process.env.NODE_ENV === 'development' 
        ? `http://localhost:8000/api/stories/${storyId}`
        : `/api/stories/${storyId}`
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch story')
      }

      const story = await response.json()
      setSelectedStory({ ...story, created_at: story.created_at, updated_at: story.updated_at })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load story')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getThemeIcon = (theme: string) => {
    const icons: Record<string, string> = {
      scp: '🔬',
      fantasy: '✨',
      romance: '💖',
      cyberpunk: '🌐',
      noir: '🕵️',
      scifi: '🚀'
    }
    return icons[theme] || '📖'
  }

  if (authLoading || loading) {
    return (
      <>
        <BackgroundSwitcher isStreaming={false} />
        <Terminal>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <h2>LOADING STORY ARCHIVE...</h2>
            <div className={styles.loadingSpinner}>
              <div className={styles.scanLine}></div>
            </div>
          </div>
        </Terminal>
      </>
    )
  }

  if (!user) {
    return null
  }

  if (selectedStory) {
    return (
      <>
        <BackgroundSwitcher isStreaming={false} />
        <Terminal>
          <div className={styles.storyViewer}>
            <div className={styles.storyHeader}>
              <button 
                className="terminal-button"
                onClick={() => setSelectedStory(null)}
              >
                ← BACK TO ARCHIVE
              </button>
              <div className={styles.storyMeta}>
                <h2>{selectedStory.title}</h2>
                <div className={styles.storyInfo}>
                  <span>{getThemeIcon(selectedStory.theme)} {selectedStory.theme.toUpperCase()}</span>
                  {selectedStory.protagonist_name && <span>Protagonist: {selectedStory.protagonist_name}</span>}
                  <span>{selectedStory.word_count} words</span>
                  <span>Created: {formatDate(selectedStory.created_at)}</span>
                </div>
              </div>
            </div>
            <div className={styles.storyContent}>
              <pre>{selectedStory.content}</pre>
            </div>
            <div className={styles.storyActions}>
              <button 
                className="terminal-button"
                onClick={() => navigator.clipboard.writeText(selectedStory.content)}
              >
                COPY STORY
              </button>
              <button 
                className="terminal-button"
                onClick={() => {
                  const blob = new Blob([selectedStory.content], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${selectedStory.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                DOWNLOAD
              </button>
            </div>
          </div>
        </Terminal>
      </>
    )
  }

  return (
    <>
      <BackgroundSwitcher isStreaming={false} />
      <Terminal>
        <div className={styles.libraryContainer}>
          <div className={styles.libraryHeader}>
            <h2>┌─── STORY ARCHIVE ─ {currentTheme.name.toUpperCase()} TERMINAL ───┐</h2>
            <div className={styles.terminalCommand}>
              <span className={styles.prompt}>plot@craft:~/stories$</span>
              <span className={styles.command}>ls -la --classify</span>
            </div>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              ERROR: {error}
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          <div className={styles.controlPanel}>
            <div className={styles.filters}>
              <div className={styles.filterGroup}>
                <label>FILTER BY THEME:</label>
                <select 
                  value={selectedThemeFilter} 
                  onChange={(e) => setSelectedThemeFilter(e.target.value)}
                  className="terminal-input"
                >
                  <option value="all">All Themes ({themeStats?.total_stories || 0})</option>
                  {themeStats && Object.entries(themeStats.themes).map(([theme, count]) => (
                    <option key={theme} value={theme}>
                      {getThemeIcon(theme)} {theme.toUpperCase()} ({count})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <label>SEARCH:</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles and content..."
                  className="terminal-input"
                />
              </div>

              <div className={styles.filterGroup}>
                <label>SORT BY:</label>
                <select 
                  value={`${sortBy}-${sortOrder}`} 
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field as 'created_at' | 'title' | 'word_count')
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="terminal-input"
                >
                  <option value="created_at-desc">Recent First</option>
                  <option value="created_at-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="word_count-desc">Longest First</option>
                  <option value="word_count-asc">Shortest First</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.storyList}>
            {stories.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>NO STORIES FOUND</h3>
                <p>
                  {searchQuery || selectedThemeFilter !== 'all' 
                    ? 'Try adjusting your filters or search terms.'
                    : 'Start creating stories to build your archive!'
                  }
                </p>
                <button 
                  className="terminal-button"
                  onClick={() => router.push('/')}
                >
                  CREATE NEW STORY
                </button>
              </div>
            ) : (
              <div className={styles.fileList}>
                <div className={styles.listHeader}>
                  <span>PERMISSIONS</span>
                  <span>SIZE</span>
                  <span>MODIFIED</span>
                  <span>NAME</span>
                </div>
                {stories.map((story) => (
                  <div key={story.id} className={styles.fileRow}>
                    <span className={styles.permissions}>-rw-r--r--</span>
                    <span className={styles.size}>{story.word_count}w</span>
                    <span className={styles.date}>{formatDate(story.created_at)}</span>
                    <div className={styles.fileName}>
                      {editingTitle === story.id ? (
                        <div className={styles.titleEdit}>
                          <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="terminal-input"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateTitle(story.id, newTitle)
                              } else if (e.key === 'Escape') {
                                setEditingTitle(null)
                                setNewTitle('')
                              }
                            }}
                          />
                          <button 
                            className="terminal-button small"
                            onClick={() => handleUpdateTitle(story.id, newTitle)}
                          >
                            ✓
                          </button>
                          <button 
                            className="terminal-button small"
                            onClick={() => {
                              setEditingTitle(null)
                              setNewTitle('')
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <span 
                            className={styles.storyTitle}
                            onClick={() => handleViewStory(story.id)}
                          >
                            {getThemeIcon(story.theme)} {story.title}
                          </span>
                          {story.protagonist_name && (
                            <span className={styles.protagonist}>
                              [{story.protagonist_name}]
                            </span>
                          )}
                        </>
                      )}
                      <div className={styles.preview}>{story.preview}</div>
                    </div>
                    <div className={styles.actions}>
                      {showDeleteConfirm === story.id ? (
                        <div className={styles.confirmDelete}>
                          <span>DELETE?</span>
                          <button 
                            className="terminal-button danger small"
                            onClick={() => handleDeleteStory(story.id)}
                          >
                            YES
                          </button>
                          <button 
                            className="terminal-button small"
                            onClick={() => setShowDeleteConfirm(null)}
                          >
                            NO
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            className="terminal-button small"
                            onClick={() => handleViewStory(story.id)}
                            title="View story"
                          >
                            VIEW
                          </button>
                          <button 
                            className="terminal-button small"
                            onClick={() => {
                              setEditingTitle(story.id)
                              setNewTitle(story.title)
                            }}
                            title="Edit title"
                          >
                            EDIT TITLE
                          </button>
                          <button 
                            className="terminal-button danger small"
                            onClick={() => setShowDeleteConfirm(story.id)}
                            title="Delete story"
                          >
                            DEL
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.libraryFooter}>
            <div className={styles.stats}>
              <span>Total: {stories.length} stories</span>
              {themeStats && (
                <span>Archive size: {Object.values(themeStats.themes).reduce((a, b) => a + b, 0)} stories</span>
              )}
            </div>
            <button 
              className="terminal-button"
              onClick={() => router.push('/')}
            >
              CREATE NEW STORY
            </button>
          </div>
          
          <div className={styles.libraryFooterBorder}>
            <h2>└──────────────────────────────────────────────────────┘</h2>
          </div>
        </div>
      </Terminal>
    </>
  )
}