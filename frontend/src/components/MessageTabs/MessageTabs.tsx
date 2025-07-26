'use client'

import React, { useState, useEffect, useRef } from 'react'
import ActivityFeed from '@/components/ActivityFeed/ActivityFeed'
import { AgentMessage } from '@/hooks/useWebSocket'
import { 
  parseAgentMessage, 
  formatInteractionFlow,
  getMessageTypeIcon 
} from '@/utils/messageParser'
import styles from './MessageTabs.module.css'

interface MessageTabsProps {
  messages: AgentMessage[]
  currentActivity: string
  streamingMessages: Record<string, string>
  currentStreamingAgent: string | null
}

export default function MessageTabs({ messages, currentActivity, streamingMessages, currentStreamingAgent }: MessageTabsProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'fullLog'>('activity')
  const fullLogRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when switching to full log or new messages arrive
  useEffect(() => {
    if (activeTab === 'fullLog' && fullLogRef.current) {
      fullLogRef.current.scrollTop = fullLogRef.current.scrollHeight
    }
  }, [activeTab, messages, streamingMessages])

  const getFullMessageContent = (msg: AgentMessage): string => {
    if (msg.type === 'agent_message' && msg.message) {
      return msg.message
    }
    return msg.message || ''
  }

  const highlightMentions = (text: string): React.ReactNode => {
    // Split by @mentions and highlight them
    const parts = text.split(/(@(?:Writer|Reader|Expert))/g)
    
    return parts.map((part, index) => {
      if (part.match(/^@(Writer|Reader|Expert)$/)) {
        return (
          <span key={index} className={styles.mention}>
            {part}
          </span>
        )
      }
      
      // Also highlight story markers
      if (part.includes('---BEGIN STORY---') || part.includes('---END STORY---')) {
        return part.split(/(---(?:BEGIN|END) STORY---)/g).map((subPart, subIndex) => {
          if (subPart.match(/---(?:BEGIN|END) STORY---/)) {
            return (
              <span key={`${index}-${subIndex}`} className={styles.storyMarker}>
                {subPart}
              </span>
            )
          }
          return subPart
        })
      }
      
      return part
    })
  }

  const formatLogMessage = (msg: AgentMessage): React.ReactNode => {
    const content = getFullMessageContent(msg)
    const parsed = parseAgentMessage(content, msg.agent)
    
    return (
      <>
        {parsed.messageType !== 'general' && (
          <span className={styles.messageTypeIcon}>
            {getMessageTypeIcon(parsed.messageType)}
          </span>
        )}
        <pre>{highlightMentions(content)}</pre>
      </>
    )
  }

  return (
    <div className="message-tabs-container">
      <div className="tab-header">
        <button 
          className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          ◊ ACTIVITY
        </button>
        <button 
          className={`tab-button ${activeTab === 'fullLog' ? 'active' : ''}`}
          onClick={() => setActiveTab('fullLog')}
        >
          ▤ FULL LOG
        </button>
      </div>

      {activeTab === 'activity' && (
        <ActivityFeed messages={messages} currentActivity={currentActivity} />
      )}

      {activeTab === 'fullLog' && (
        <div className="full-log-container">
          <h3>┌─── AGENT CONVERSATION LOG ───────────────────────────┐</h3>
          <div className="full-log-content" ref={fullLogRef}>
            {(() => {
              let currentTurn = -1
              const groupedMessages: React.ReactElement[] = []
              
              messages.forEach((msg, idx) => {
                if (msg.type === 'agent_message' && msg.turn && msg.turn !== currentTurn) {
                  currentTurn = msg.turn
                  groupedMessages.push(
                    <div key={`turn-${currentTurn}`} className={styles.turnGroup}>
                      <div className={styles.turnHeader}>
                        ┌─ Turn {currentTurn} ─────────────────────
                      </div>
                    </div>
                  )
                }
                
                const parsed = msg.agent ? parseAgentMessage(msg.message || '', msg.agent) : null
                const interactionFlow = parsed ? formatInteractionFlow(parsed.sender, parsed.recipient) : ''
                
                groupedMessages.push(
                  <div key={idx} className="full-log-entry">
                    {msg.agent && (
                      <div className="log-header">
                        <span className="log-agent">[{msg.agent}]</span>
                        {interactionFlow && parsed?.recipient && (
                          <span className={styles.interactionFlow}> → {parsed.recipient}</span>
                        )}
                        {msg.phase && <span className="log-phase">{msg.phase}</span>}
                      </div>
                    )}
                    <div className="log-message">
                      {formatLogMessage(msg)}
                    </div>
                    {currentTurn === msg.turn && idx < messages.length - 1 && 
                     messages[idx + 1]?.turn !== currentTurn && (
                      <div className={styles.turnFooter}>
                        └─────────────────────────────────────
                      </div>
                    )}
                  </div>
                )
              })
              
              return groupedMessages
            })()}
            {/* Show streaming message at the end */}
            {currentStreamingAgent && streamingMessages[currentStreamingAgent] && (
              <div className="full-log-entry streaming">
                <div className="log-header">
                  <span className="log-agent">[{currentStreamingAgent}]</span>
                  <span className="log-status">◉ STREAMING</span>
                </div>
                <div className="log-message">
                  <pre>{highlightMentions(streamingMessages[currentStreamingAgent])}<span className="cursor">▊</span></pre>
                </div>
              </div>
            )}
          </div>
          <h3>└──────────────────────────────────────────────────────┘</h3>
        </div>
      )}
    </div>
  )
}