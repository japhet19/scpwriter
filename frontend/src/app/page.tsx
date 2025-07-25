'use client'

import { useState, useEffect, useRef } from 'react'
import Terminal from '@/components/Terminal/Terminal'
import BootSequence from '@/components/BootSequence/BootSequence'
import StoryConfig, { StoryConfiguration } from '@/components/StoryConfig/StoryConfig'
import MessageTabs from '@/components/MessageTabs/MessageTabs'
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
  const [showBoot, setShowBoot] = useState(true)
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
      model: config.model
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

  if (showBoot) {
    return (
      <Terminal showHeader={false}>
        <BootSequence onComplete={handleBootComplete} />
      </Terminal>
    )
  }

  return (
    <>
      <BackgroundSwitcher />
      <Terminal>
        {currentView === 'config' && (
          <StoryConfig onSubmit={handleStorySubmit} />
        )}
      
      {currentView === 'generation' && (
        <div className="generation-view">
          <h2>GENERATING {currentTheme.id === 'scp' ? 'ANOMALY DOCUMENTATION' : currentTheme.id === 'fantasy' ? 'MAGICAL TALE' : currentTheme.id === 'romance' ? 'LOVE STORY' : currentTheme.id === 'cyberpunk' ? 'DATA STREAM' : currentTheme.id === 'noir' ? 'CASE FILE' : 'MISSION LOG'}...</h2>
          
          <div className="agent-status">
            <h3>┌─── AGENT STATUS MONITOR ──────────────────────────────┐</h3>
            <div className="agents-grid">
              <div className={`agent-box ${agentStates.Writer}`}>
                <div className="agent-container">
                  <div className="agent-icon">
                    ╭─────╮
                    <br />│ {agentStates.Writer === 'thinking' ? '◌◌◌' : agentStates.Writer === 'writing' ? '▓▓▓' : '   '} │
                    <br />╰─────╯
                  </div>
                  <div className="agent-name">{currentTheme.agents.writer}</div>
                  <div className="agent-status">
                    {agentStates.Writer === 'thinking' && <span>ANALYZING<span className="dots"><span>.</span><span>.</span><span>.</span></span></span>}
                    {agentStates.Writer === 'writing' && <span>COMPOSING<span className="cursor-blink">▊</span></span>}
                    {agentStates.Writer === 'waiting' && <span>STANDBY</span>}
                  </div>
                </div>
              </div>
              <div className={`agent-box ${agentStates.Reader}`}>
                <div className="agent-container">
                  <div className="agent-icon">
                    ╭─────╮
                    <br />│ {agentStates.Reader === 'thinking' ? '◌◌◌' : agentStates.Reader === 'writing' ? '▓▓▓' : '   '} │
                    <br />╰─────╯
                  </div>
                  <div className="agent-name">{currentTheme.agents.reader}</div>
                  <div className="agent-status">
                    {agentStates.Reader === 'thinking' && <span>REVIEWING<span className="dots"><span>.</span><span>.</span><span>.</span></span></span>}
                    {agentStates.Reader === 'writing' && <span>FEEDBACK<span className="cursor-blink">▊</span></span>}
                    {agentStates.Reader === 'waiting' && <span>STANDBY</span>}
                  </div>
                </div>
              </div>
              <div className={`agent-box ${agentStates.Expert}`}>
                <div className="agent-container">
                  <div className="agent-icon">
                    ╭─────╮
                    <br />│ {agentStates.Expert === 'thinking' ? '◌◌◌' : agentStates.Expert === 'writing' ? '▓▓▓' : '   '} │
                    <br />╰─────╯
                  </div>
                  <div className="agent-name">{currentTheme.agents.expert}</div>
                  <div className="agent-status">
                    {agentStates.Expert === 'thinking' && <span>ANALYZING<span className="dots"><span>.</span><span>.</span><span>.</span></span></span>}
                    {agentStates.Expert === 'writing' && <span>ADVISING<span className="cursor-blink">▊</span></span>}
                    {agentStates.Expert === 'waiting' && <span>STANDBY</span>}
                  </div>
                </div>
              </div>
            </div>
            <h3>└───────────────────────────────────────────────────────┘</h3>
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
        <div className="story-view">
          <div className="story-header">
            <h2>{currentTheme.formConfig.completedHeader.title}</h2>
            <h3>{currentTheme.formConfig.completedHeader.subtitle}</h3>
            <hr />
            {currentTheme.formConfig.completedHeader.classification1 && (
              <div className="classification">
                <span>{currentTheme.formConfig.completedHeader.classification1}</span>
                {currentTheme.formConfig.completedHeader.classification2 && (
                  <span>Level 3/XXXX</span>
                )}
              </div>
            )}
            {currentTheme.formConfig.completedHeader.classification2 && (
              <div className="classification">
                <span>{currentTheme.formConfig.completedHeader.classification2}</span>
                <span>Classified</span>
              </div>
            )}
          </div>
          
          <div className="story-content">
            <pre>{generatedStory}</pre>
          </div>
          
          <div className="story-actions">
            <div className="action-row">
              <button 
                className="terminal-button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedStory)
                  alert('Story copied to clipboard!')
                }}
              >
                COPY STORY
              </button>
              <button 
                className="terminal-button"
                onClick={() => {
                  const filename = generateFilename(sessionMetadata?.theme || 'unknown', 'txt').replace('_log_', '_story_')
                  downloadFile(generatedStory, filename, 'text/plain')
                }}
              >
                DOWNLOAD STORY
              </button>
            </div>
            
            <div className="action-row">
              <div className="download-logs-container">
                <button 
                  className="terminal-button"
                  onClick={() => setShowLogFormatMenu(!showLogFormatMenu)}
                >
                  DOWNLOAD LOGS ⬇
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
                className="terminal-button"
                onClick={() => {
                  // Download full session with story and logs
                  const storyContent = `# ${currentTheme.formConfig.completedHeader.title}\n\n${generatedStory}\n\n---\n\n`
                  const logsContent = formatAgentLogs(messages, sessionMetadata || undefined, { format: 'md', includeMetadata: true })
                  const fullContent = storyContent + logsContent
                  const filename = generateFilename(sessionMetadata?.theme || 'unknown', 'md').replace('_log_', '_session_')
                  downloadFile(fullContent, filename, 'text/markdown')
                }}
              >
                DOWNLOAD FULL SESSION
              </button>
            </div>
            
            <div className="action-row">
              <button 
                className="terminal-button full-width"
                onClick={() => {
                  setCurrentView('config')
                  setGeneratedStory(null)
                  setShowLogFormatMenu(false)
                }}
              >
                GENERATE NEW STORY
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