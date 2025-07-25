'use client'

import { useState, useEffect, useRef } from 'react'
import Terminal from '@/components/Terminal/Terminal'
import BootSequence from '@/components/BootSequence/BootSequence'
import StoryConfig, { StoryConfiguration } from '@/components/StoryConfig/StoryConfig'
import MessageTabs from '@/components/MessageTabs/MessageTabs'
import WelcomeScreen from '@/components/WelcomeScreen/WelcomeScreen'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Howl } from 'howler'
import { SessionMetadata, formatAgentLogs, downloadFile, generateFilename } from '@/utils/logFormatter'
import BackgroundSwitcher from '@/components/Backgrounds/BackgroundSwitcher'
import { useTheme } from '@/contexts/ThemeContext'

// Define sound effects
const sounds = {
  boot: new Howl({ src: ['/sounds/boot.mp3'], volume: 0.3 }),
  keypress: new Howl({ src: ['/sounds/keypress.mp3'], volume: 0.1 }),
  alert: new Howl({ src: ['/sounds/alert.mp3'], volume: 0.4 }),
  success: new Howl({ src: ['/sounds/success.mp3'], volume: 0.3 }),
}

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [showBoot, setShowBoot] = useState(false)
  const [currentView, setCurrentView] = useState<'config' | 'generation' | 'complete'>('config')
  const [generatedStory, setGeneratedStory] = useState<string | null>(null)
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata | null>(null)
  const [showLogFormatMenu, setShowLogFormatMenu] = useState(false)
  const sessionStartTimeRef = useRef<Date | null>(null)
  const { currentTheme } = useTheme()
  
  const {
    isConnected,
    connect,
    generateStory,
    messages,
    isGenerating,
    currentAgent,
    currentPhase,
    agentStates,
    currentActivity,
    streamingMessages,
    currentStreamingAgent
  } = useWebSocket()

  useEffect(() => {
    // Connect to WebSocket when component mounts
    connect()
  }, [connect])

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
        totalTurns: maxTurn
      } : null)
    }
  }, [messages])

  if (showWelcome) {
    return <WelcomeScreen onThemeSelect={handleThemeSelect} />
  }

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
          
          <div className={`agent-status ${currentTheme.id === 'fantasy' ? 'fantasy-agents' : ''}`}>
            <h3 className="agent-status-header">
              {currentTheme.id === 'fantasy' ? 
                '╭─── ✨ TALE CRAFTERS STATUS ✨ ───╮' : 
                '┌─── AGENT STATUS MONITOR ──────────────────────────────┐'
              }
            </h3>
            <div className={`agents-grid ${currentTheme.id === 'fantasy' ? 'fantasy-agents-grid' : ''}`}>
              <div className={`agent-box ${agentStates.Writer} ${currentTheme.id === 'fantasy' ? 'fantasy-agent-box' : ''}`}>
                <div className="agent-container">
                  {currentTheme.id === 'fantasy' ? (
                    <div className="fantasy-agent-icon">
                      <div className="illuminated-border">
                        <div className="agent-scroll">
                          📜 {agentStates.Writer === 'thinking' ? '✍️✍️✍️' : agentStates.Writer === 'writing' ? '🖋️📖✨' : '📜'} 📜
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="agent-icon">
                      ╭─────╮
                      <br />│ {agentStates.Writer === 'thinking' ? '◌◌◌' : agentStates.Writer === 'writing' ? '▓▓▓' : '   '} │
                      <br />╰─────╯
                    </div>
                  )}
                  <div className={`agent-name ${currentTheme.id === 'fantasy' ? 'fantasy-agent-name' : ''}`}>
                    {currentTheme.id === 'fantasy' ? '📚 ' : ''}{currentTheme.agents.writer}
                  </div>
                  <div className="agent-status">
                    {agentStates.Writer === 'thinking' && <span>{currentTheme.id === 'fantasy' ? 'WEAVING' : 'ANALYZING'}<span className="dots"><span>.</span><span>.</span><span>.</span></span></span>}
                    {agentStates.Writer === 'writing' && <span>{currentTheme.id === 'fantasy' ? 'INSCRIBING' : 'COMPOSING'}<span className="cursor-blink">▊</span></span>}
                    {agentStates.Writer === 'waiting' && <span>{currentTheme.id === 'fantasy' ? 'AWAITING' : 'STANDBY'}</span>}
                  </div>
                </div>
              </div>
              <div className={`agent-box ${agentStates.Reader} ${currentTheme.id === 'fantasy' ? 'fantasy-agent-box' : ''}`}>
                <div className="agent-container">
                  {currentTheme.id === 'fantasy' ? (
                    <div className="fantasy-agent-icon">
                      <div className="illuminated-border">
                        <div className="agent-scroll">
                          📖 {agentStates.Reader === 'thinking' ? '👁️📚👁️' : agentStates.Reader === 'writing' ? '✍️💭📝' : '📖'} 📖
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="agent-icon">
                      ╭─────╮
                      <br />│ {agentStates.Reader === 'thinking' ? '◌◌◌' : agentStates.Reader === 'writing' ? '▓▓▓' : '   '} │
                      <br />╰─────╯
                    </div>
                  )}
                  <div className={`agent-name ${currentTheme.id === 'fantasy' ? 'fantasy-agent-name' : ''}`}>
                    {currentTheme.id === 'fantasy' ? '🎭 ' : ''}{currentTheme.agents.reader}
                  </div>
                  <div className="agent-status">
                    {agentStates.Reader === 'thinking' && <span>{currentTheme.id === 'fantasy' ? 'CONTEMPLATING' : 'REVIEWING'}<span className="dots"><span>.</span><span>.</span><span>.</span></span></span>}
                    {agentStates.Reader === 'writing' && <span>{currentTheme.id === 'fantasy' ? 'COUNSELING' : 'FEEDBACK'}<span className="cursor-blink">▊</span></span>}
                    {agentStates.Reader === 'waiting' && <span>{currentTheme.id === 'fantasy' ? 'LISTENING' : 'STANDBY'}</span>}
                  </div>
                </div>
              </div>
              <div className={`agent-box ${agentStates.Expert} ${currentTheme.id === 'fantasy' ? 'fantasy-agent-box' : ''}`}>
                <div className="agent-container">
                  {currentTheme.id === 'fantasy' ? (
                    <div className="fantasy-agent-icon">
                      <div className="illuminated-border">
                        <div className="agent-scroll">
                          🔮 {agentStates.Expert === 'thinking' ? '✨🌟✨' : agentStates.Expert === 'writing' ? '🧙‍♂️💫📿' : '🔮'} 🔮
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="agent-icon">
                      ╭─────╮
                      <br />│ {agentStates.Expert === 'thinking' ? '◌◌◌' : agentStates.Expert === 'writing' ? '▓▓▓' : '   '} │
                      <br />╰─────╯
                    </div>
                  )}
                  <div className={`agent-name ${currentTheme.id === 'fantasy' ? 'fantasy-agent-name' : ''}`}>
                    {currentTheme.id === 'fantasy' ? '🧙‍♂️ ' : ''}{currentTheme.agents.expert}
                  </div>
                  <div className="agent-status">
                    {agentStates.Expert === 'thinking' && <span>{currentTheme.id === 'fantasy' ? 'DIVINING' : 'ANALYZING'}<span className="dots"><span>.</span><span>.</span><span>.</span></span></span>}
                    {agentStates.Expert === 'writing' && <span>{currentTheme.id === 'fantasy' ? 'ENCHANTING' : 'ADVISING'}<span className="cursor-blink">▊</span></span>}
                    {agentStates.Expert === 'waiting' && <span>{currentTheme.id === 'fantasy' ? 'MEDITATING' : 'STANDBY'}</span>}
                  </div>
                </div>
              </div>
            </div>
            <h3 className="agent-status-footer">
              {currentTheme.id === 'fantasy' ? 
                '╰─── ✨ TALES OF WONDER UNFOLD ✨ ───╯' : 
                '└───────────────────────────────────────────────────────┘'
              }
            </h3>
          </div>
          
          <MessageTabs 
            messages={messages} 
            currentActivity={currentActivity}
            streamingMessages={streamingMessages}
            currentStreamingAgent={currentStreamingAgent}
          />
          
          <div className="current-status">
            <span>PHASE: {currentPhase?.toUpperCase() || 'INITIALIZING'}</span>
            {currentAgent && <span className="status-separator">│</span>}
            {currentAgent && <span>ACTIVE: {currentAgent.toUpperCase()}</span>}
          </div>
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
          
          <div className="story-actions">
            <div className="action-row">
              <button 
                className={`terminal-button ${currentTheme.id === 'fantasy' ? 'fantasy-action-button' : currentTheme.id === 'romance' ? 'romance-button' : ''}`}
                onClick={() => {
                  navigator.clipboard.writeText(generatedStory)
                  alert(currentTheme.id === 'fantasy' ? 'Tale copied to your scroll case! ✨' : currentTheme.id === 'romance' ? 'Love letter copied to your heart! 💖' : 'Story copied to clipboard!')
                }}
              >
                {currentTheme.id === 'romance' ? '💝 ' : ''}COPY STORY
              </button>
              <button 
                className={`terminal-button ${currentTheme.id === 'fantasy' ? 'fantasy-action-button' : currentTheme.id === 'romance' ? 'romance-button' : ''}`}
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
                  className={`terminal-button ${currentTheme.id === 'fantasy' ? 'fantasy-action-button' : currentTheme.id === 'romance' ? 'romance-button' : ''}`}
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
                className={`terminal-button ${currentTheme.id === 'fantasy' ? 'fantasy-action-button' : currentTheme.id === 'romance' ? 'romance-button' : ''}`}
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
                className={`terminal-button full-width ${currentTheme.id === 'fantasy' ? 'fantasy-action-button' : ''}`}
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
      `}</style>
      </Terminal>
    </>
  )
}