'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Terminal from '@/components/Terminal/Terminal'
import BootSequence from '@/components/BootSequence/BootSequence'
import StoryConfig, { StoryConfiguration } from '@/components/StoryConfig/StoryConfig'
import MessageTabs from '@/components/MessageTabs/MessageTabs'
import AgentStatusLine from '@/components/AgentStatusLine/AgentStatusLine'
import WelcomeScreen from '@/components/WelcomeScreen/WelcomeScreen'
import { useWebSocket } from '@/hooks/useWebSocket'
// import { Howl } from 'howler' // Commented out until sound files are added
import { SessionMetadata, formatAgentLogs, downloadFile, generateFilename } from '@/utils/logFormatter'
import BackgroundSwitcher from '@/components/Backgrounds/BackgroundSwitcher'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/Auth/AuthModal'
import OpenRouterConnect from '@/components/Auth/OpenRouterConnect'
import { createClient } from '@/lib/supabase/client'
import { API_URL } from '@/config/api'

// Define sound effects (commented out until sound files are added)
// const sounds = {
//   boot: new Howl({ src: ['/sounds/boot.mp3'], volume: 0.3 }),
//   keypress: new Howl({ src: ['/sounds/keypress.mp3'], volume: 0.1 }),
//   alert: new Howl({ src: ['/sounds/alert.mp3'], volume: 0.4 }),
//   success: new Howl({ src: ['/sounds/success.mp3'], volume: 0.3 }),
// }

export default function Home() {
  // Initialize showWelcome to true to prevent flash of config screen
  const [showWelcome, setShowWelcome] = useState(true)
  const [showBoot, setShowBoot] = useState(false)
  const [currentView, setCurrentView] = useState<'config' | 'generation' | 'complete'>('config')
  const [generatedStory, setGeneratedStory] = useState<string | null>(null)
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata | null>(null)
  const [showLogFormatMenu, setShowLogFormatMenu] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const sessionStartTimeRef = useRef<Date | null>(null)
  const { currentTheme } = useTheme()
  const { user, loading: authLoading, hasOpenRouterKey, checkOpenRouterKey } = useAuth()
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Auth token getter for WebSocket
  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }
  
  const {
    isConnected,
    connect,
    generateStory,
    messages,
    isGenerating,
    currentAgent,
    currentPhase,
    currentSessionId,
    agentStates,
    currentActivity,
    streamingMessages,
    currentStreamingAgent
  } = useWebSocket(API_URL, getAuthToken)

  useEffect(() => {
    // Connect to WebSocket when user is authenticated and has OpenRouter key
    if (user && hasOpenRouterKey) {
      connect()
    }
  }, [user, hasOpenRouterKey, connect])

  // Set showWelcome based on state - if we're not in config view, hide welcome
  useEffect(() => {
    if (!authLoading && user && hasOpenRouterKey) {
      // Only show welcome if we're in config view and haven't started configuring
      if (currentView !== 'config') {
        setShowWelcome(false)
      }
    }
  }, [authLoading, user, hasOpenRouterKey, currentView])

  // Handle navigation to signin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin')
    }
  }, [authLoading, user, router])
  
  // Handle URL parameters and auth state
  useEffect(() => {
    const handleUrlParams = async () => {
      // Check if we should show theme selection
      if (searchParams.get('selectTheme') === 'true') {
        setShowWelcome(true)
        setCurrentView('config')
        // Remove the query parameter using Next.js router
        router.replace('/', undefined, { shallow: true })
      }
      
      // Check for OpenRouter connection
      if (searchParams.get('openrouter') === 'connected') {
        // OpenRouter was just connected, refresh the key status
        await checkOpenRouterKey()
        // Remove the query parameter using Next.js router
        router.replace('/', undefined, { shallow: true })
      }
      
      supabase.auth.getSession()
    }
    handleUrlParams()
  }, [searchParams, checkOpenRouterKey, router])

  const handleThemeSelect = (themeId: string) => {
    setShowWelcome(false)
    setShowBoot(true)
    // sounds.boot.play()
  }

  const handleBootComplete = () => {
    setShowBoot(false)
    // sounds.boot.play()
  }

  const handleStorySubmit = (config: StoryConfiguration) => {
    if (!isConnected) {
      alert('Not connected to server. Please refresh and try again.')
      return
    }
    
    // Set session metadata
    sessionStartTimeRef.current = new Date()
    setSessionMetadata({
      theme: config.theme,
      pages: config.pages,
      protagonist: config.protagonist,
      startTime: sessionStartTimeRef.current,
      totalMessages: 0,
      totalTurns: 0
    })
    
    generateStory({
      theme: config.theme,
      pages: config.pages,
      protagonist: config.protagonist,
      model: config.model,
      uiTheme: config.uiTheme,
      themeOptions: config.themeOptions
    })
    
    setCurrentView('generation')
    // sounds.alert.play()
  }

  // Monitor for story completion and update metadata
  useEffect(() => {
    const completedMessage = messages.find(msg => msg.type === 'completed')
    if (completedMessage && completedMessage.story) {
      setGeneratedStory(completedMessage.story)
      setCurrentView('complete')
      // sounds.success.play()
      
      // Update final metadata
      const agentMessages = messages.filter(msg => msg.type === 'agent_message')
      const maxTurn = Math.max(...agentMessages.map(msg => msg.turn || 0))
      setSessionMetadata(prev => prev ? {
        ...prev,
        endTime: new Date(),
        totalMessages: agentMessages.length,
        totalTurns: maxTurn,
        sessionId: currentSessionId || completedMessage.session_id
      } : null)
    }
  }, [messages, currentSessionId])

  // Check auth state first
  if (authLoading) {
    return (
      <>
        <BackgroundSwitcher isStreaming={false} />
        <Terminal>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <h2>LOADING...</h2>
          </div>
        </Terminal>
      </>
    )
  }

  // Not authenticated - redirect is handled by useEffect
  if (!user) {
    return null
  }

  // Authenticated but no OpenRouter key
  if (!hasOpenRouterKey) {
    return (
      <>
        <BackgroundSwitcher isStreaming={false} />
        <Terminal>
          <OpenRouterConnect />
        </Terminal>
      </>
    )
  }

  // Show welcome screen for authenticated users with OpenRouter key
  if (showWelcome) {
    return (
      <>
        <WelcomeScreen onThemeSelect={handleThemeSelect} />
      </>
    )
  }

  // Show boot sequence after theme selection
  if (showBoot) {
    return (
      <>
        <BackgroundSwitcher isStreaming={!!currentStreamingAgent} />
        <Terminal showHeader={false}>
          <BootSequence onComplete={handleBootComplete} />
        </Terminal>
      </>
    )
  }

  return (
    <>
      <BackgroundSwitcher isStreaming={!!currentStreamingAgent} />
      <Terminal>
        {currentView === 'config' && (
          <StoryConfig 
            onSubmit={handleStorySubmit} 
            onChangeTheme={() => setShowWelcome(true)}
          />
        )}
      
      {currentView === 'generation' && (
        <div className="generation-view">
          <h2>GENERATING {currentTheme.id === 'scp' ? 'ANOMALY DOCUMENTATION' : currentTheme.id === 'fantasy' ? 'MAGICAL TALE' : currentTheme.id === 'romance' ? 'LOVE STORY' : currentTheme.id === 'cyberpunk' ? 'DATA STREAM' : currentTheme.id === 'noir' ? 'CASE FILE' : 'MISSION LOG'}...</h2>
          
          <div className={`agent-status ${currentTheme.id === 'fantasy' ? 'fantasy-agents' : currentTheme.id === 'cyberpunk' ? 'cyberpunk-agents' : currentTheme.id === 'scifi' ? 'scifi-agents' : currentTheme.id === 'noir' ? 'noir-agents' : currentTheme.id === 'scp' ? 'scp-agents' : ''}`}>
            <h3 className="agent-status-header">
              {currentTheme.id === 'fantasy' ? 
                '╭─── ✨ TALE CRAFTERS STATUS ✨ ───╮' : 
                currentTheme.id === 'cyberpunk' ?
                '[ NEURAL INTERFACE STATUS ]━━━━━━━━━━━━━━━━━━━━━━━━━━━━' :
                currentTheme.id === 'scifi' ?
                '◆ ═══════════[ STELLAR COMMAND BRIDGE ]═══════════ ◆' :
                currentTheme.id === 'noir' ?
                '╔═══ CASE FILE: ACTIVE INVESTIGATION ═══╗' :
                currentTheme.id === 'scp' ?
                '█ CONTAINMENT CELL STATUS ─ LEVEL 4 CLEARANCE REQUIRED █' :
                '┌─── AGENT STATUS MONITOR ──────────────────────────────┐'
              }
            </h3>
            <div className={`agents-grid ${currentTheme.id === 'fantasy' ? 'fantasy-agents-grid' : currentTheme.id === 'cyberpunk' ? 'cyberpunk-agents-grid' : currentTheme.id === 'scifi' ? 'scifi-agents-grid' : currentTheme.id === 'noir' ? 'noir-agents-grid' : currentTheme.id === 'scp' ? 'scp-agents-grid' : ''}`}>
              <div className={`agent-box ${agentStates.Writer} ${currentTheme.id === 'fantasy' ? 'fantasy-agent-box' : currentTheme.id === 'cyberpunk' ? 'cyberpunk-agent-box' : currentTheme.id === 'scifi' ? 'scifi-agent-box' : currentTheme.id === 'noir' ? 'noir-agent-box' : currentTheme.id === 'scp' ? 'scp-agent-box' : ''}`}>
                <div className="agent-container">
                  {currentTheme.id === 'fantasy' ? (
                    <div className="fantasy-agent-icon">
                      <div className="illuminated-border">
                        <div className="agent-scroll">
                          📜 {agentStates.Writer === 'thinking' ? '✍️✍️✍️' : agentStates.Writer === 'writing' ? '🖋️📖✨' : '📜'} 📜
                        </div>
                      </div>
                    </div>
                  ) : currentTheme.id === 'cyberpunk' ? (
                    <div className="cyberpunk-agent-icon">
                      <div className="cyber-hex-container">
                        <div className="cyber-hex-outer">
                          <div className="cyber-hex-inner">
                            {agentStates.Writer === 'thinking' ? '■□■' : agentStates.Writer === 'writing' ? '▲▼▲' : '———'}
                          </div>
                        </div>
                        <div className="cyber-circuit-lines"></div>
                      </div>
                    </div>
                  ) : currentTheme.id === 'scifi' ? (
                    <div className="scifi-agent-icon">
                      <div className="holo-container">
                        <div className="data-rings">
                          <div className="ring ring-1" />
                          <div className="ring ring-2" />
                          <div className="ring ring-3" />
                        </div>
                        <div className="agent-core">
                          {agentStates.Writer === 'thinking' ? '◈◈◈' : 
                           agentStates.Writer === 'writing' ? '▣▣▣' : '◇◇◇'}
                        </div>
                      </div>
                      <div className="scifi-status-indicator" 
                           style={{
                             '--status-color': agentStates.Writer === 'thinking' ? '#7c4dff' :
                                               agentStates.Writer === 'writing' ? '#64ffda' : 
                                               '#00e5ff'
                           } as React.CSSProperties} />
                    </div>
                  ) : currentTheme.id === 'noir' ? (
                    <div className="noir-agent-icon">
                      <div className="typewriter-icon">
                        <pre style={{ margin: 0, fontSize: '12px' }}>
{`    ╔═══════╗
    ║ ${agentStates.Writer === 'thinking' ? '◊◊◊' : agentStates.Writer === 'writing' ? '▪▪▪' : '   '} ║
    ╚═══════╝
      |||||`}
                        </pre>
                      </div>
                    </div>
                  ) : currentTheme.id === 'scp' ? (
                    <div className="scp-agent-icon">
                      <div className="containment-cell lab-icon">
                        🧪
                      </div>
                    </div>
                  ) : (
                    <div className="agent-icon">
                      ╭─────╮
                      <br />│ {agentStates.Writer === 'thinking' ? '◌◌◌' : agentStates.Writer === 'writing' ? '▓▓▓' : '   '} │
                      <br />╰─────╯
                    </div>
                  )}
                  <div className={`agent-name ${currentTheme.id === 'fantasy' ? 'fantasy-agent-name' : currentTheme.id === 'cyberpunk' ? 'cyberpunk-agent-name' : currentTheme.id === 'scifi' ? 'scifi-agent-name' : currentTheme.id === 'noir' ? 'noir-agent-name' : currentTheme.id === 'scp' ? 'scp-agent-name' : ''}`}>
                    {currentTheme.id === 'fantasy' ? '📚 ' : currentTheme.id === 'scifi' ? '🚀 ' : currentTheme.id === 'noir' ? '🔍 ' : currentTheme.id === 'scp' ? '🔬 ' : ''}{currentTheme.agents.writer}
                  </div>
                  <div className="agent-status">
                    {agentStates.Writer === 'thinking' && <span>{currentTheme.id === 'fantasy' ? 'WEAVING' : currentTheme.id === 'cyberpunk' ? 'PROCESSING' : currentTheme.id === 'scifi' ? 'CALCULATING' : currentTheme.id === 'noir' ? 'INVESTIGATING' : currentTheme.id === 'scp' ? 'RESEARCHING' : 'ANALYZING'}<span className="dots"><span>.</span><span>.</span><span>.</span></span></span>}
                    {agentStates.Writer === 'writing' && <span>{currentTheme.id === 'fantasy' ? 'INSCRIBING' : currentTheme.id === 'cyberpunk' ? 'ENCODING' : currentTheme.id === 'scifi' ? 'TRANSMITTING' : currentTheme.id === 'noir' ? 'TYPING REPORT' : currentTheme.id === 'scp' ? 'DOCUMENTING' : 'COMPOSING'}<span className="cursor-blink">▊</span></span>}
                    {agentStates.Writer === 'waiting' && <span>{currentTheme.id === 'fantasy' ? 'AWAITING' : currentTheme.id === 'cyberpunk' ? 'IDLE.EXE' : currentTheme.id === 'scifi' ? 'STANDBY MODE' : currentTheme.id === 'noir' ? 'ON STAKEOUT' : currentTheme.id === 'scp' ? 'CONTAINED' : 'STANDBY'}</span>}
                  </div>
                </div>
              </div>
              <div className={`agent-box ${agentStates.Reader} ${currentTheme.id === 'fantasy' ? 'fantasy-agent-box' : currentTheme.id === 'cyberpunk' ? 'cyberpunk-agent-box' : currentTheme.id === 'scifi' ? 'scifi-agent-box' : currentTheme.id === 'noir' ? 'noir-agent-box' : currentTheme.id === 'scp' ? 'scp-agent-box' : ''}`}>
                <div className="agent-container">
                  {currentTheme.id === 'fantasy' ? (
                    <div className="fantasy-agent-icon">
                      <div className="illuminated-border">
                        <div className="agent-scroll">
                          📖 {agentStates.Reader === 'thinking' ? '👁️📚👁️' : agentStates.Reader === 'writing' ? '✍️💭📝' : '📖'} 📖
                        </div>
                      </div>
                    </div>
                  ) : currentTheme.id === 'scifi' ? (
                    <div className="scifi-agent-icon">
                      <div className="holo-container">
                        <div className="data-rings">
                          <div className="ring ring-1" />
                          <div className="ring ring-2" />
                          <div className="ring ring-3" />
                        </div>
                        <div className="agent-core">
                          {agentStates.Reader === 'thinking' ? '◈◈◈' : 
                           agentStates.Reader === 'writing' ? '▣▣▣' : '◇◇◇'}
                        </div>
                      </div>
                      <div className="scifi-status-indicator" 
                           style={{
                             '--status-color': agentStates.Reader === 'thinking' ? '#7c4dff' :
                                               agentStates.Reader === 'writing' ? '#64ffda' : 
                                               '#00e5ff'
                           } as React.CSSProperties} />
                    </div>
                  ) : currentTheme.id === 'noir' ? (
                    <div className="noir-agent-icon">
                      <div className="magnifying-glass">
                        <pre style={{ margin: 0, fontSize: '12px' }}>
{`   ╔═══╗
   ║ ${agentStates.Reader === 'thinking' ? '◊◊◊' : agentStates.Reader === 'writing' ? '◾◾◾' : '   '} ║
   ╚═╤═╝
     │
     ╱`}
                        </pre>
                      </div>
                    </div>
                  ) : currentTheme.id === 'scp' ? (
                    <div className="scp-agent-icon">
                      <div className="containment-cell monitor-icon">
                        📊
                      </div>
                    </div>
                  ) : (
                    <div className="agent-icon">
                      ╭─────╮
                      <br />│ {agentStates.Reader === 'thinking' ? '◌◌◌' : agentStates.Reader === 'writing' ? '▓▓▓' : '   '} │
                      <br />╰─────╯
                    </div>
                  )}
                  <div className={`agent-name ${currentTheme.id === 'fantasy' ? 'fantasy-agent-name' : currentTheme.id === 'cyberpunk' ? 'cyberpunk-agent-name' : currentTheme.id === 'scifi' ? 'scifi-agent-name' : currentTheme.id === 'noir' ? 'noir-agent-name' : currentTheme.id === 'scp' ? 'scp-agent-name' : ''}`}>
                    {currentTheme.id === 'fantasy' ? '🎭 ' : currentTheme.id === 'scifi' ? '🛸 ' : currentTheme.id === 'noir' ? '🕵️ ' : currentTheme.id === 'scp' ? '📋 ' : ''}{currentTheme.agents.reader}
                  </div>
                  <div className="agent-status">
                    {agentStates.Reader === 'thinking' && <span>{currentTheme.id === 'fantasy' ? 'CONTEMPLATING' : currentTheme.id === 'scifi' ? 'ANALYZING' : currentTheme.id === 'noir' ? 'EXAMINING CLUES' : currentTheme.id === 'scp' ? 'ANALYZING DATA' : 'REVIEWING'}<span className="dots"><span>.</span><span>.</span><span>.</span></span></span>}
                    {agentStates.Reader === 'writing' && <span>{currentTheme.id === 'fantasy' ? 'COUNSELING' : currentTheme.id === 'scifi' ? 'EVALUATING' : currentTheme.id === 'noir' ? 'CASE NOTES' : currentTheme.id === 'scp' ? 'PEER REVIEW' : 'FEEDBACK'}<span className="cursor-blink">▊</span></span>}
                    {agentStates.Reader === 'waiting' && <span>{currentTheme.id === 'fantasy' ? 'LISTENING' : currentTheme.id === 'scifi' ? 'MONITORING' : currentTheme.id === 'noir' ? 'OBSERVING' : currentTheme.id === 'scp' ? 'MONITORING' : 'STANDBY'}</span>}
                  </div>
                </div>
              </div>
              <div className={`agent-box ${agentStates.Expert} ${currentTheme.id === 'fantasy' ? 'fantasy-agent-box' : currentTheme.id === 'cyberpunk' ? 'cyberpunk-agent-box' : currentTheme.id === 'scifi' ? 'scifi-agent-box' : currentTheme.id === 'noir' ? 'noir-agent-box' : currentTheme.id === 'scp' ? 'scp-agent-box' : ''}`}>
                <div className="agent-container">
                  {currentTheme.id === 'fantasy' ? (
                    <div className="fantasy-agent-icon">
                      <div className="illuminated-border">
                        <div className="agent-scroll">
                          🔮 {agentStates.Expert === 'thinking' ? '✨🌟✨' : agentStates.Expert === 'writing' ? '🧙‍♂️💫📿' : '🔮'} 🔮
                        </div>
                      </div>
                    </div>
                  ) : currentTheme.id === 'scifi' ? (
                    <div className="scifi-agent-icon">
                      <div className="holo-container">
                        <div className="data-rings">
                          <div className="ring ring-1" />
                          <div className="ring ring-2" />
                          <div className="ring ring-3" />
                        </div>
                        <div className="agent-core">
                          {agentStates.Expert === 'thinking' ? '◈◈◈' : 
                           agentStates.Expert === 'writing' ? '▣▣▣' : '◇◇◇'}
                        </div>
                      </div>
                      <div className="scifi-status-indicator" 
                           style={{
                             '--status-color': agentStates.Expert === 'thinking' ? '#7c4dff' :
                                               agentStates.Expert === 'writing' ? '#64ffda' : 
                                               '#00e5ff'
                           } as React.CSSProperties} />
                    </div>
                  ) : currentTheme.id === 'noir' ? (
                    <div className="noir-agent-icon">
                      <div className="badge-icon">
                        <pre style={{ margin: 0, fontSize: '12px' }}>
{`   ╔═══╗
   ║CHIEF║
   ║ ${agentStates.Expert === 'thinking' ? '◊◊◊' : agentStates.Expert === 'writing' ? '★★★' : '   '} ║
   ╚═══╝`}
                        </pre>
                      </div>
                    </div>
                  ) : currentTheme.id === 'scp' ? (
                    <div className="scp-agent-icon">
                      <div className="containment-cell badge-icon">
                        🏛️
                      </div>
                    </div>
                  ) : (
                    <div className="agent-icon">
                      ╭─────╮
                      <br />│ {agentStates.Expert === 'thinking' ? '◌◌◌' : agentStates.Expert === 'writing' ? '▓▓▓' : '   '} │
                      <br />╰─────╯
                    </div>
                  )}
                  <div className={`agent-name ${currentTheme.id === 'fantasy' ? 'fantasy-agent-name' : currentTheme.id === 'cyberpunk' ? 'cyberpunk-agent-name' : currentTheme.id === 'scifi' ? 'scifi-agent-name' : currentTheme.id === 'noir' ? 'noir-agent-name' : currentTheme.id === 'scp' ? 'scp-agent-name' : ''}`}>
                    {currentTheme.id === 'fantasy' ? '🧙‍♂️ ' : currentTheme.id === 'scifi' ? '⭐ ' : currentTheme.id === 'noir' ? '👮 ' : currentTheme.id === 'scp' ? '🎖️ ' : ''}{currentTheme.agents.expert}
                  </div>
                  <div className="agent-status">
                    {agentStates.Expert === 'thinking' && <span>{currentTheme.id === 'fantasy' ? 'DIVINING' : currentTheme.id === 'scifi' ? 'STRATEGIZING' : currentTheme.id === 'noir' ? 'DEDUCING' : currentTheme.id === 'scp' ? 'DELIBERATING' : 'ANALYZING'}<span className="dots"><span>.</span><span>.</span><span>.</span></span></span>}
                    {agentStates.Expert === 'writing' && <span>{currentTheme.id === 'fantasy' ? 'ENCHANTING' : currentTheme.id === 'scifi' ? 'COMMANDING' : currentTheme.id === 'noir' ? 'CLOSING CASE' : currentTheme.id === 'scp' ? 'AUTHORIZING' : 'ADVISING'}<span className="cursor-blink">▊</span></span>}
                    {agentStates.Expert === 'waiting' && <span>{currentTheme.id === 'fantasy' ? 'MEDITATING' : currentTheme.id === 'scifi' ? 'BRIDGE READY' : currentTheme.id === 'noir' ? 'AT THE PRECINCT' : currentTheme.id === 'scp' ? 'SECURE' : 'STANDBY'}</span>}
                  </div>
                </div>
              </div>
            </div>
            <h3 className="agent-status-footer">
              {currentTheme.id === 'fantasy' ? 
                '╰─── ✨ TALES OF WONDER UNFOLD ✨ ───╯' : 
                currentTheme.id === 'cyberpunk' ?
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' :
                currentTheme.id === 'scifi' ?
                '◆ ═════════[ MISSION STATUS: ACTIVE ]═════════ ◆' :
                currentTheme.id === 'noir' ?
                '╚═══ EVIDENCE COLLECTED • CASE IN PROGRESS ═══╝' :
                currentTheme.id === 'scp' ?
                '█ DOCUMENTATION IN PROGRESS ─ CLASSIFICATION PENDING █' :
                '└───────────────────────────────────────────────────────┘'
              }
            </h3>
          </div>
          
          <AgentStatusLine
            messages={messages}
            currentPhase={currentPhase}
            currentStreamingAgent={currentStreamingAgent}
            sessionMetadata={{ pages: sessionMetadata?.pages || 3 }}
          />
          
          <MessageTabs 
            messages={messages} 
            currentActivity={currentActivity}
            streamingMessages={streamingMessages}
            currentStreamingAgent={currentStreamingAgent}
          />
        </div>
      )}
      
      {currentView === 'complete' && generatedStory && (
        <div className={`story-view ${currentTheme.id === 'fantasy' ? 'fantasy-story-view' : ''}`}>
          <div className={`story-header ${currentTheme.id === 'fantasy' ? 'fantasy-story-header' : ''}`}>
            {currentTheme.id === 'fantasy' ? (
              <>
                <div className="fantasy-title-ornament">✨ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✨</div>
                <h2 className="fantasy-title">📖 {currentTheme.formConfig.completedHeader.title} 📖</h2>
                <h3 className="fantasy-subtitle">{currentTheme.formConfig.completedHeader.subtitle}</h3>
                <div className="fantasy-title-ornament">✨ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✨</div>
              </>
            ) : (
              <>
                <h2>{currentTheme.formConfig.completedHeader.title}</h2>
                <h3>{currentTheme.formConfig.completedHeader.subtitle}</h3>
                <hr />
              </>
            )}
            {currentTheme.id !== 'fantasy' && currentTheme.formConfig.completedHeader.classification1 && (
              <div className="classification">
                <span>{currentTheme.formConfig.completedHeader.classification1}</span>
                {currentTheme.formConfig.completedHeader.classification2 && (
                  <span>Level 3/XXXX</span>
                )}
              </div>
            )}
            {currentTheme.id !== 'fantasy' && currentTheme.formConfig.completedHeader.classification2 && (
              <div className="classification">
                <span>{currentTheme.formConfig.completedHeader.classification2}</span>
                <span>Classified</span>
              </div>
            )}
          </div>
          
          <div className={`story-content ${currentTheme.id === 'fantasy' ? 'fantasy-scroll-content' : ''}`}>
            {currentTheme.id === 'fantasy' ? (
              <div className="enchanted-scroll">
                <div className="scroll-top">📜</div>
                <div className="scroll-body">
                  <pre className="fantasy-text">{generatedStory}</pre>
                </div>
                <div className="scroll-bottom">📜</div>
              </div>
            ) : (
              <pre>{generatedStory}</pre>
            )}
          </div>
          
          {sessionMetadata?.sessionId && (
            <div className="session-info">
              <div className="session-id-display">
                <span className="session-label">Session ID:</span>
                <code className="session-id">{sessionMetadata.sessionId}</code>
                <button 
                  className="copy-session-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(sessionMetadata.sessionId || '')
                    alert('Session ID copied!')
                  }}
                  title="Copy Session ID"
                >
                  📋
                </button>
              </div>
              <div className="session-note">
                Save this ID to retrieve your story later if needed
              </div>
            </div>
          )}
          
          <div className="story-actions">
            <div className="action-row">
              <button 
                className={`terminal-button ${currentTheme.id === 'fantasy' ? 'fantasy-action-button' : currentTheme.id === 'romance' ? 'romance-button' : currentTheme.id === 'cyberpunk' ? 'cyberpunk-button' : currentTheme.id === 'scifi' ? 'scifi-button' : currentTheme.id === 'noir' ? 'noir-button' : currentTheme.id === 'scp' ? 'scp-button' : ''}`}
                onClick={() => {
                  navigator.clipboard.writeText(generatedStory)
                  alert(currentTheme.id === 'fantasy' ? 'Tale copied to your scroll case! ✨' : currentTheme.id === 'romance' ? 'Love letter copied to your heart! 💖' : 'Story copied to clipboard!')
                }}
              >
                {currentTheme.id === 'romance' ? '💝 ' : ''}COPY STORY
              </button>
              <button 
                className={`terminal-button ${currentTheme.id === 'fantasy' ? 'fantasy-action-button' : currentTheme.id === 'romance' ? 'romance-button' : currentTheme.id === 'cyberpunk' ? 'cyberpunk-button' : currentTheme.id === 'scifi' ? 'scifi-button' : currentTheme.id === 'noir' ? 'noir-button' : currentTheme.id === 'scp' ? 'scp-button' : ''}`}
                onClick={() => {
                  const filename = generateFilename(sessionMetadata?.theme || 'unknown', 'txt').replace('_log_', '_story_')
                  downloadFile(generatedStory, filename, 'text/plain')
                }}
              >
                {currentTheme.id === 'romance' ? '💌 ' : ''}DOWNLOAD STORY
              </button>
            </div>
            
            <div className="action-row">
              <div className="download-logs-container">
                <button 
                  className={`terminal-button ${currentTheme.id === 'fantasy' ? 'fantasy-action-button' : currentTheme.id === 'romance' ? 'romance-button' : currentTheme.id === 'cyberpunk' ? 'cyberpunk-button' : currentTheme.id === 'scifi' ? 'scifi-button' : currentTheme.id === 'noir' ? 'noir-button' : currentTheme.id === 'scp' ? 'scp-button' : ''}`}
                  onClick={() => setShowLogFormatMenu(!showLogFormatMenu)}
                >
                  {currentTheme.id === 'romance' ? '📜 ' : ''}DOWNLOAD LOGS ⬇
                </button>
                {showLogFormatMenu && (
                  <div className="format-menu">
                    <button onClick={() => {
                      const content = formatAgentLogs(messages, sessionMetadata || undefined, { format: 'txt', includeMetadata: true })
                      const filename = generateFilename(sessionMetadata?.theme || 'unknown', 'txt')
                      downloadFile(content, filename, 'text/plain')
                      setShowLogFormatMenu(false)
                    }}>Plain Text (.txt)</button>
                    <button onClick={() => {
                      const content = formatAgentLogs(messages, sessionMetadata || undefined, { format: 'json', includeMetadata: true })
                      const filename = generateFilename(sessionMetadata?.theme || 'unknown', 'json')
                      downloadFile(content, filename, 'application/json')
                      setShowLogFormatMenu(false)
                    }}>JSON (.json)</button>
                    <button onClick={() => {
                      const content = formatAgentLogs(messages, sessionMetadata || undefined, { format: 'md', includeMetadata: true })
                      const filename = generateFilename(sessionMetadata?.theme || 'unknown', 'md')
                      downloadFile(content, filename, 'text/markdown')
                      setShowLogFormatMenu(false)
                    }}>Markdown (.md)</button>
                  </div>
                )}
              </div>
              <button 
                className={`terminal-button ${currentTheme.id === 'fantasy' ? 'fantasy-action-button' : currentTheme.id === 'romance' ? 'romance-button' : currentTheme.id === 'cyberpunk' ? 'cyberpunk-button' : currentTheme.id === 'scifi' ? 'scifi-button' : currentTheme.id === 'noir' ? 'noir-button' : currentTheme.id === 'scp' ? 'scp-button' : ''}`}
                onClick={() => {
                  // Download full session with story and logs
                  const storyContent = `# ${currentTheme.formConfig.completedHeader.title}\n\n${generatedStory}\n\n---\n\n`
                  const logsContent = formatAgentLogs(messages, sessionMetadata || undefined, { format: 'md', includeMetadata: true })
                  const fullContent = storyContent + logsContent
                  const filename = generateFilename(sessionMetadata?.theme || 'unknown', 'md').replace('_log_', '_session_')
                  downloadFile(fullContent, filename, 'text/markdown')
                }}
              >
                {currentTheme.id === 'romance' ? '💘 ' : ''}DOWNLOAD FULL SESSION
              </button>
            </div>
            
            <div className="action-row">
              <button 
                className={`terminal-button full-width ${currentTheme.id === 'fantasy' ? 'fantasy-action-button' : currentTheme.id === 'cyberpunk' ? 'cyberpunk-button' : currentTheme.id === 'scifi' ? 'scifi-button' : currentTheme.id === 'noir' ? 'noir-button' : currentTheme.id === 'scp' ? 'scp-button' : ''}`}
                onClick={() => {
                  setShowWelcome(true)
                  setCurrentView('config')
                  setGeneratedStory(null)
                  setShowLogFormatMenu(false)
                }}
              >
                {currentTheme.id === 'romance' ? '💕 ' : ''}CREATE NEW STORY
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .generation-view {
          padding: 20px;
        }
        
        .agent-status {
          margin: 20px 0;
        }
        
        .agents-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 20px 0;
        }
        
        .agent-box {
          text-align: center;
          padding: 20px;
          border: 1px solid var(--terminal-green);
          opacity: 0.5;
          transition: all 0.3s;
        }
        
        .agent-box.active {
          opacity: 1;
          background: rgba(0, 255, 0, 0.1);
          box-shadow: 0 0 20px var(--terminal-green);
        }
        
        .agent-icon {
          font-size: 24px;
          margin-bottom: 10px;
        }
        
        .agent-name {
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .agent-status {
          font-size: 12px;
          opacity: 0.8;
        }
        
        /* Fantasy Theme Agent Styles */
        .fantasy-agents {
          position: relative;
        }
        
        .fantasy-agents::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(107, 70, 193, 0.05) 100%);
          border-radius: 8px;
          pointer-events: none;
        }
        
        .fantasy-agents-grid {
          position: relative;
          z-index: 1;
        }
        
        .fantasy-agent-box {
          background: linear-gradient(135deg, rgba(26, 15, 31, 0.9) 0%, rgba(107, 70, 193, 0.1) 100%);
          border: 2px solid rgba(255, 215, 0, 0.3);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }
        
        .fantasy-agent-box::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #FFD700, #6B46C1, #228B22, #FFD700);
          border-radius: 12px;
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .fantasy-agent-box.active::before {
          opacity: 0.6;
          animation: fantasyBorderGlow 2s ease-in-out infinite;
        }
        
        .fantasy-agent-box.active {
          background: linear-gradient(135deg, rgba(26, 15, 31, 0.95) 0%, rgba(255, 215, 0, 0.1) 100%);
          box-shadow: 
            0 0 30px rgba(255, 215, 0, 0.3),
            inset 0 0 20px rgba(255, 215, 0, 0.1);
        }
        
        .fantasy-agent-icon {
          font-size: 20px;
          margin-bottom: 15px;
          position: relative;
        }
        
        .illuminated-border {
          position: relative;
          padding: 10px;
          border: 1px solid rgba(255, 215, 0, 0.5);
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(107, 70, 193, 0.1) 100%);
        }
        
        .illuminated-border::before {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          background: linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.8), transparent);
          border-radius: 8px;
          z-index: -1;
          opacity: 0;
          animation: illuminatedPulse 3s ease-in-out infinite;
        }
        
        .agent-scroll {
          font-size: 16px;
          line-height: 1.2;
          text-align: center;
        }
        
        .fantasy-agent-name {
          color: #FFD700;
          text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
          font-weight: 600;
          font-size: 15px;
        }
        
        .agent-status-header,
        .agent-status-footer {
          color: #FFD700;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
        }
        
        @keyframes fantasyBorderGlow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes illuminatedPulse {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        /* Reduce fantasy animations for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .fantasy-agent-box::before,
          .illuminated-border::before {
            animation: none;
          }
        }
        
        /* Fantasy Story Completion Styles */
        .fantasy-story-view {
          position: relative;
        }
        
        .fantasy-story-view::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.02) 0%, rgba(107, 70, 193, 0.02) 100%);
          border-radius: 12px;
          pointer-events: none;
        }
        
        .fantasy-story-header {
          position: relative;
          z-index: 1;
          text-align: center;
          margin-bottom: 40px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(26, 15, 31, 0.8) 0%, rgba(107, 70, 193, 0.1) 100%);
          border: 2px solid rgba(255, 215, 0, 0.3);
          border-radius: 12px;
        }
        
        .fantasy-title-ornament {
          color: #FFD700;
          font-size: 14px;
          margin: 10px 0;
          opacity: 0.8;
          animation: gentleGlow 4s ease-in-out infinite;
        }
        
        .fantasy-title {
          color: #FFD700;
          text-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
          font-family: var(--font-accent), serif;
          font-size: 28px;
          margin: 15px 0;
          animation: titleGlow 3s ease-in-out infinite;
        }
        
        .fantasy-subtitle {
          color: #6B46C1;
          text-shadow: 0 0 8px rgba(107, 70, 193, 0.5);
          font-style: italic;
          margin: 10px 0;
        }
        
        .fantasy-scroll-content {
          position: relative;
          background: transparent;
          border: none;
          padding: 0;
          margin: 30px 0;
        }
        
        .enchanted-scroll {
          position: relative;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(107, 70, 193, 0.05) 100%);
          border: 2px solid rgba(255, 215, 0, 0.4);
          border-radius: 15px;
          padding: 0;
          box-shadow: 
            0 0 30px rgba(255, 215, 0, 0.2),
            inset 0 0 20px rgba(255, 215, 0, 0.05);
          overflow: hidden;
        }
        
        .scroll-top, .scroll-bottom {
          text-align: center;
          font-size: 24px;
          padding: 10px;
          background: linear-gradient(90deg, rgba(255, 215, 0, 0.2), rgba(107, 70, 193, 0.2), rgba(255, 215, 0, 0.2));
          border-bottom: 1px solid rgba(255, 215, 0, 0.3);
        }
        
        .scroll-bottom {
          border-bottom: none;
          border-top: 1px solid rgba(255, 215, 0, 0.3);
        }
        
        .scroll-body {
          padding: 30px;
          background: rgba(26, 15, 31, 0.4);
          position: relative;
        }
        
        .scroll-body::before {
          content: '';
          position: absolute;
          top: 0;
          left: 20px;
          right: 20px;
          bottom: 0;
          background: 
            repeating-linear-gradient(
              transparent,
              transparent 24px,
              rgba(255, 215, 0, 0.1) 25px
            );
          pointer-events: none;
        }
        
        .fantasy-text {
          font-family: var(--font-accent), serif;
          font-size: 16px;
          line-height: 1.8;
          color: #FFD700;
          text-shadow: 0 0 3px rgba(255, 215, 0, 0.3);
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
          position: relative;
          z-index: 1;
        }
        
        .fantasy-action-button {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(107, 70, 193, 0.2) 100%);
          border: 2px solid rgba(255, 215, 0, 0.5);
          color: #FFD700;
          text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
          position: relative;
          overflow: hidden;
        }
        
        .fantasy-action-button::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.6), transparent);
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .fantasy-action-button:hover::before {
          opacity: 1;
          animation: buttonSparkle 1.5s ease-in-out infinite;
        }
        
        .fantasy-action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
          border-color: rgba(255, 215, 0, 0.8);
        }
        
        @keyframes titleGlow {
          0%, 100% {
            text-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
            transform: scale(1);
          }
          50% {
            text-shadow: 0 0 25px rgba(255, 215, 0, 0.8), 0 0 35px rgba(107, 70, 193, 0.3);
            transform: scale(1.02);
          }
        }
        
        @keyframes gentleGlow {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes buttonSparkle {
          0%, 100% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
        }
        
        /* Reduce fantasy story animations for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .fantasy-title-ornament,
          .fantasy-title,
          .fantasy-action-button::before {
            animation: none;
          }
          
          .fantasy-action-button:hover {
            transform: none;
          }
        }
        
        .transmission-log {
          margin: 20px 0;
        }
        
        .log-content {
          background: var(--terminal-bg);
          padding: 15px;
          max-height: 300px;
          overflow-y: auto;
          font-size: 13px;
          line-height: 1.6;
        }
        
        .log-entry {
          margin-bottom: 5px;
        }
        
        .agent-label {
          color: var(--terminal-amber);
          margin-right: 10px;
        }
        
        .current-status {
          margin-top: 20px;
          padding: 10px;
          border: 1px solid var(--terminal-green);
          background: rgba(0, 255, 0, 0.05);
          text-align: center;
          font-size: 13px;
          letter-spacing: 1px;
        }
        
        .status-separator {
          margin: 0 15px;
          opacity: 0.5;
        }
        
        .story-view {
          padding: 20px;
        }
        
        .story-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .story-header h2 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        
        .story-header h3 {
          font-size: 14px;
          opacity: 0.8;
          margin-bottom: 20px;
        }
        
        .classification {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 14px;
        }
        
        .story-content {
          background: var(--terminal-bg);
          border: 1px solid var(--terminal-green);
          padding: 20px;
          margin: 20px 0;
          font-family: 'Share Tech Mono', monospace;
          line-height: 1.6;
          max-height: 500px;
          overflow-y: auto;
          overflow-x: hidden;
          max-width: 100%;
        }
        
        .story-content pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
          margin: 0;
          font-family: inherit;
        }
        
        .session-info {
          background: rgba(0, 255, 0, 0.05);
          border: 1px solid rgba(0, 255, 0, 0.3);
          border-radius: 4px;
          padding: 15px;
          margin: 20px auto;
          max-width: 600px;
          text-align: center;
        }
        
        .session-id-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        
        .session-label {
          color: rgba(0, 255, 0, 0.8);
          font-weight: bold;
        }
        
        .session-id {
          background: rgba(0, 0, 0, 0.5);
          color: #00ff00;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
        }
        
        .copy-session-btn {
          background: none;
          border: 1px solid rgba(0, 255, 0, 0.5);
          color: #00ff00;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.9em;
          transition: all 0.3s ease;
        }
        
        .copy-session-btn:hover {
          background: rgba(0, 255, 0, 0.1);
          border-color: #00ff00;
        }
        
        .session-note {
          color: rgba(0, 255, 0, 0.6);
          font-size: 0.85em;
          font-style: italic;
        }
        
        .story-actions {
          display: flex;
          flex-direction: column;
          gap: 15px;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .action-row {
          display: flex;
          gap: 15px;
          justify-content: center;
        }
        
        .action-row button {
          flex: 1;
        }
        
        .terminal-button.full-width {
          width: 100%;
        }
        
        .download-logs-container {
          position: relative;
          flex: 1;
        }
        
        .download-logs-container .terminal-button {
          width: 100%;
        }
        
        .format-menu {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          margin-bottom: 5px;
          background: var(--terminal-bg);
          border: 1px solid var(--terminal-green);
          box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.3);
          z-index: 10;
        }
        
        .format-menu button {
          display: block;
          width: 100%;
          padding: 10px 20px;
          background: transparent;
          border: none;
          color: var(--terminal-green);
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .format-menu button:hover {
          background: rgba(0, 255, 0, 0.1);
          color: var(--terminal-bright-green);
        }
        
        .format-menu button:not(:last-child) {
          border-bottom: 1px solid rgba(0, 255, 0, 0.2);
        }
        
        /* Cyberpunk Theme Agent Styles */
        .cyberpunk-agents {
          position: relative;
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(255, 0, 255, 0.05) 100%);
          border: 1px solid rgba(0, 255, 255, 0.2);
          clip-path: polygon(0 10px, 10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
        }
        
        .cyberpunk-agents::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 255, 0.03) 2px,
            rgba(0, 255, 255, 0.03) 4px
          );
          pointer-events: none;
        }
        
        .cyberpunk-agents-grid {
          position: relative;
          z-index: 1;
        }
        
        .cyberpunk-agent-box {
          background: linear-gradient(135deg, rgba(10, 0, 20, 0.9) 0%, rgba(255, 0, 255, 0.1) 100%);
          border: 2px solid rgba(0, 255, 255, 0.3);
          position: relative;
          overflow: hidden;
          clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px);
        }
        
        .cyberpunk-agent-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.2) 50%, transparent 100%);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }
        
        .cyberpunk-agent-box.active::before {
          animation: cyberScan 2s linear infinite;
        }
        
        .cyberpunk-agent-box.active {
          background: linear-gradient(135deg, rgba(10, 0, 20, 0.95) 0%, rgba(0, 255, 255, 0.2) 100%);
          box-shadow: 
            0 0 30px rgba(0, 255, 255, 0.5),
            inset 0 0 20px rgba(255, 0, 255, 0.2),
            0 0 0 1px rgba(0, 255, 255, 0.8);
        }
        
        .cyberpunk-agent-icon {
          margin-bottom: 15px;
          position: relative;
        }
        
        .cyber-hex-container {
          width: 60px;
          height: 60px;
          margin: 0 auto;
          position: relative;
        }
        
        .cyber-hex-outer {
          width: 100%;
          height: 100%;
          position: relative;
          background: rgba(0, 255, 255, 0.1);
          clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
          border: 2px solid rgba(0, 255, 255, 0.5);
          animation: hexRotate 10s linear infinite;
        }
        
        .cyber-hex-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #00ffff;
          font-size: 16px;
          font-family: 'Orbitron', monospace;
          text-shadow: 0 0 10px currentColor;
        }
        
        .cyber-circuit-lines {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(0deg, rgba(0, 255, 255, 0.2) 0%, transparent 20%),
            linear-gradient(90deg, rgba(0, 255, 255, 0.2) 0%, transparent 20%);
          background-size: 20px 20px;
          opacity: 0.5;
        }
        
        .cyberpunk-agent-name {
          color: #00ffff;
          text-shadow: 
            0 0 10px rgba(0, 255, 255, 0.8),
            0 0 20px rgba(0, 255, 255, 0.5);
          font-weight: 700;
          font-size: 15px;
          font-family: 'Orbitron', monospace;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        .cyberpunk-agent-box .agent-status {
          color: #ff00ff;
          font-family: 'Share Tech Mono', monospace;
          text-shadow: 0 0 5px currentColor;
          font-size: 13px;
        }
        
        @keyframes cyberScan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes hexRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Reduce cyberpunk animations for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .cyberpunk-agent-box::before,
          .cyber-hex-outer {
            animation: none;
          }
        }
        
        /* Sci-Fi Theme Agent Styles */
        .scifi-agents {
          position: relative;
        }
        
        .scifi-agents::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(ellipse at center, rgba(0, 229, 255, 0.1) 0%, transparent 70%),
            linear-gradient(0deg, 
              transparent 0%, transparent 48%, 
              rgba(0, 229, 255, 0.03) 49%, rgba(0, 229, 255, 0.03) 51%, 
              transparent 52%, transparent 100%);
          background-size: 100% 100%, 100% 20px;
          border-radius: 8px;
          pointer-events: none;
        }
        
        .scifi-agents-grid {
          position: relative;
          z-index: 1;
        }
        
        .scifi-agent-box {
          background: linear-gradient(135deg, 
            rgba(0, 229, 255, 0.05) 0%, 
            rgba(124, 77, 255, 0.05) 100%);
          border: 2px solid rgba(0, 229, 255, 0.6);
          position: relative;
          overflow: hidden;
          border-radius: 8px;
        }
        
        .scifi-agent-box::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(45deg, 
            #00e5ff, #7c4dff, #64ffda, #00e5ff);
          border-radius: 8px;
          opacity: 0;
          animation: holoBorder 3s linear infinite;
          z-index: -1;
        }
        
        .scifi-agent-box.active::before {
          opacity: 1;
        }
        
        .scifi-agent-box.active {
          background: linear-gradient(135deg, 
            rgba(0, 229, 255, 0.1) 0%, 
            rgba(124, 77, 255, 0.1) 100%);
          box-shadow: 
            0 0 30px rgba(0, 229, 255, 0.6),
            inset 0 0 20px rgba(124, 77, 255, 0.2);
        }
        
        @keyframes holoBorder {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(180deg);
          }
        }
        
        .scifi-agent-icon {
          margin-bottom: 15px;
          position: relative;
        }
        
        .holo-container {
          width: 80px;
          height: 80px;
          margin: 0 auto;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .data-rings {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        
        .ring {
          position: absolute;
          border: 2px solid rgba(100, 255, 218, 0.3);
          border-radius: 50%;
          animation: ringPulse 3s ease-in-out infinite;
        }
        
        .ring-1 {
          width: 100%;
          height: 100%;
          animation-delay: 0s;
        }
        
        .ring-2 {
          width: 70%;
          height: 70%;
          top: 15%;
          left: 15%;
          animation-delay: 1s;
        }
        
        .ring-3 {
          width: 40%;
          height: 40%;
          top: 30%;
          left: 30%;
          animation-delay: 2s;
        }
        
        @keyframes ringPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
        
        .agent-core {
          position: relative;
          z-index: 10;
          color: #64ffda;
          font-size: 20px;
          font-family: 'Space Mono', monospace;
          text-shadow: 0 0 15px currentColor;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .scifi-status-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, 
            transparent, var(--status-color), transparent);
          animation: statusPulse 2s ease-in-out infinite;
        }
        
        @keyframes statusPulse {
          0%, 100% {
            opacity: 0.5;
            transform: scaleX(1);
          }
          50% {
            opacity: 1;
            transform: scaleX(1.05);
          }
        }
        
        .scifi-agent-name {
          color: #00e5ff;
          text-shadow: 
            0 0 10px rgba(0, 229, 255, 0.8),
            0 0 20px rgba(0, 229, 255, 0.5);
          font-weight: 300;
          font-size: 15px;
          font-family: 'Exo 2', sans-serif;
          letter-spacing: 3px;
          text-transform: uppercase;
        }
        
        .scifi-agent-box .agent-status {
          color: #e0f7fa;
          font-family: 'Space Mono', monospace;
          text-shadow: 0 0 5px rgba(100, 255, 218, 0.5);
          font-size: 12px;
          letter-spacing: 1px;
        }
        
        /* Reduce sci-fi animations for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .scifi-agent-box::before,
          .ring,
          .scifi-status-indicator {
            animation: none;
          }
        }
        
        /* Noir Theme Agent Styles */
        .noir-agents {
          position: relative;
        }
        
        .noir-agents::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(139, 0, 0, 0.05) 100%),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              rgba(232, 232, 232, 0.02) 2px,
              rgba(232, 232, 232, 0.02) 4px
            );
          border-radius: 8px;
          pointer-events: none;
        }
        
        .noir-agents-grid {
          position: relative;
          z-index: 1;
        }
        
        .noir-agent-box {
          background: linear-gradient(135deg, 
            rgba(26, 26, 26, 0.9) 0%, 
            rgba(10, 10, 10, 0.95) 100%);
          border: 2px solid rgba(232, 232, 232, 0.3);
          position: relative;
          overflow: hidden;
          border-radius: 4px;
          box-shadow: 
            0 2px 10px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(232, 232, 232, 0.1);
        }
        
        .noir-agent-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(232, 232, 232, 0.3) 50%, 
            transparent 100%);
        }
        
        .noir-agent-box::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 20px;
          background: linear-gradient(to bottom, 
            transparent 0%, 
            rgba(139, 0, 0, 0.1) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .noir-agent-box.active::after {
          opacity: 1;
        }
        
        .noir-agent-box.active {
          background: linear-gradient(135deg, 
            rgba(26, 26, 26, 0.95) 0%, 
            rgba(139, 0, 0, 0.1) 100%);
          box-shadow: 
            0 4px 20px rgba(139, 0, 0, 0.3),
            inset 0 1px 0 rgba(232, 232, 232, 0.2);
          animation: typewriterShake 0.1s ease-in-out infinite;
        }
        
        @keyframes typewriterShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-0.5px); }
          75% { transform: translateX(0.5px); }
        }
        
        .noir-agent-icon {
          margin-bottom: 15px;
          font-family: 'Courier Prime', monospace;
          color: #e8e8e8;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }
        
        .typewriter-icon,
        .magnifying-glass,
        .badge-icon {
          display: inline-block;
          animation: noirFlicker 8s ease-in-out infinite;
        }
        
        @keyframes noirFlicker {
          0%, 100% { opacity: 1; }
          95% { opacity: 1; }
          96% { opacity: 0.8; }
          97% { opacity: 1; }
        }
        
        .noir-agent-name {
          color: #e8e8e8;
          text-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.8),
            0 0 20px rgba(139, 0, 0, 0.2);
          font-weight: 700;
          font-size: 14px;
          font-family: 'Special Elite', cursive;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        
        .noir-agent-box .agent-status {
          color: #666666;
          font-family: 'Courier Prime', monospace;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
          font-size: 12px;
          font-weight: 400;
        }
        
        /* Film grain effect for noir theme */
        .noir-agent-box.writing::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence baseFrequency="0.9" /%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" opacity="0.05" /%3E%3C/svg%3E');
          pointer-events: none;
          opacity: 0.3;
          mix-blend-mode: multiply;
        }
        
        /* Typewriter paper effect */
        .noir-agent-box.writing {
          background-image: 
            linear-gradient(135deg, 
              rgba(26, 26, 26, 0.95) 0%, 
              rgba(139, 0, 0, 0.1) 100%),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 19px,
              rgba(232, 232, 232, 0.05) 19px,
              rgba(232, 232, 232, 0.05) 20px
            );
        }
        
        /* Reduce noir animations for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .noir-agent-box.active,
          .typewriter-icon,
          .magnifying-glass,
          .badge-icon {
            animation: none;
          }
        }
        
        /* SCP Theme Agent Styles */
        .scp-agents {
          position: relative;
        }
        
        .scp-agents::before {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          background: repeating-linear-gradient(
            45deg,
            #ffb000 0px,
            #ffb000 10px,
            #000 10px,
            #000 20px
          );
          opacity: 0.1;
          z-index: 0;
        }
        
        .scp-agents-grid {
          position: relative;
          z-index: 1;
          padding: 10px;
          background: rgba(10, 10, 10, 0.9);
          border: 2px solid #333;
        }
        
        .scp-agent-box {
          background: linear-gradient(135deg, 
            rgba(10, 10, 10, 0.95) 0%, 
            rgba(26, 26, 26, 0.9) 100%);
          border: 3px solid #333;
          position: relative;
          overflow: hidden;
          border-radius: 0;
          box-shadow: 
            0 0 0 1px #666 inset,
            0 4px 10px rgba(0, 0, 0, 0.8);
        }
        
        .scp-agent-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 10px;
          height: 10px;
          background: #00ff00;
          border-radius: 50%;
          box-shadow: 0 0 10px #00ff00;
          opacity: 0.8;
          transition: all 0.3s ease;
        }
        
        .scp-agent-box.thinking::before {
          background: #ffb000;
          box-shadow: 0 0 15px #ffb000;
          animation: pulse 1s ease-in-out infinite;
        }
        
        .scp-agent-box.writing::before {
          background: #ff0040;
          box-shadow: 0 0 20px #ff0040;
          animation: pulse 0.5s ease-in-out infinite;
        }
        
        .scp-agent-box::after {
          content: 'CONTAINMENT ACTIVE';
          position: absolute;
          top: 5px;
          right: 5px;
          font-size: 8px;
          letter-spacing: 1px;
          color: #666;
          opacity: 0.5;
        }
        
        .scp-agent-box.writing::after {
          content: 'BREACH DETECTED';
          color: #ff0040;
          opacity: 1;
          animation: blink 0.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        .scp-agent-icon {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .containment-cell {
          width: 60px;
          height: 60px;
          border: 2px solid #666;
          background: rgba(0, 0, 0, 0.8);
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 24px;
        }
        
        .containment-cell::before,
        .containment-cell::after {
          content: '';
          position: absolute;
          background: #666;
        }
        
        .containment-cell::before {
          width: 100%;
          height: 2px;
          top: 50%;
          transform: translateY(-50%);
        }
        
        .containment-cell::after {
          width: 2px;
          height: 100%;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .lab-icon {
          animation: float 3s ease-in-out infinite;
        }
        
        .monitor-icon {
          animation: scan 2s linear infinite;
        }
        
        .badge-icon {
          animation: rotate 4s linear infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes scan {
          0% { transform: scaleY(1); }
          50% { transform: scaleY(0.8); }
          100% { transform: scaleY(1); }
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .scp-agent-name {
          color: #00ff00;
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 2px;
          text-transform: uppercase;
          text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
        }
        
        .scp-agent-box .agent-status {
          color: #999;
          font-family: 'Share Tech Mono', monospace;
          text-shadow: none;
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        
        /* SCP hazard stripes on corners */
        .scp-agent-box.active {
          box-shadow: 
            0 0 0 1px #00ff00 inset,
            0 0 20px rgba(0, 255, 0, 0.3),
            0 4px 10px rgba(0, 0, 0, 0.8);
        }
        
        /* Reduce SCP animations for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .scp-agent-box::before,
          .lab-icon,
          .monitor-icon,
          .badge-icon {
            animation: none;
          }
        }
      `}</style>
      </Terminal>
    </>
  )
}