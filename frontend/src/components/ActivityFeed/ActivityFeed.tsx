'use client'

import React, { useEffect, useRef } from 'react'
import { AgentMessage } from '@/hooks/useWebSocket'
import { 
  parseAgentMessage, 
  formatInteractionFlow, 
  smartTruncate,
  getMessageTypeIcon 
} from '@/utils/messageParser'

interface ActivityFeedProps {
  messages: AgentMessage[]
  currentActivity: string
}

function ActivityFeed({ messages, currentActivity }: ActivityFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages.length]) // Only trigger on length change, not content updates

  const getActivityDescription = (msg: AgentMessage): string => {
    if (msg.activity) return msg.activity

    switch (msg.type) {
      case 'agent_update':
        if (msg.state === 'thinking') {
          switch (msg.agent) {
            case 'Writer':
              return 'Writer is analyzing the theme and planning the narrative structure...'
            case 'Reader':
              return 'Reader is reviewing the story for clarity and coherence...'
            case 'Expert':
              return 'Expert is checking SCP formatting and containment procedures...'
            default:
              return `${msg.agent} is thinking...`
          }
        } else if (msg.state === 'writing') {
          switch (msg.agent) {
            case 'Writer':
              return 'Writer is composing the SCP narrative...'
            case 'Reader':
              return 'Reader is providing feedback on the story...'
            case 'Expert':
              return 'Expert is advising on technical details...'
            default:
              return `${msg.agent} is writing...`
          }
        }
        break
      case 'agent_message':
        if (msg.agent && msg.message) {
          // Parse the message for richer context
          const parsed = parseAgentMessage(msg.message, msg.agent)
          const interactionFlow = formatInteractionFlow(parsed.sender, parsed.recipient)
          const preview = smartTruncate(msg.message, 250)
          
          // Add message type icon if it's a specific type
          const typeIcon = parsed.messageType !== 'general' ? 
            getMessageTypeIcon(parsed.messageType) + ' ' : ''
          
          // Always show the agent label like [Writer] to match the logs
          return `[${msg.agent}] ${typeIcon}${interactionFlow} ${preview}`
        }
        break
      case 'status':
        return msg.message
      case 'error':
        return `⚠️ Error: ${msg.message}`
    }
    
    return msg.message
  }

  const getTimestamp = () => {
    const now = new Date()
    return now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  const getIcon = (msg: AgentMessage): string => {
    switch (msg.type) {
      case 'agent_update':
        return msg.state === 'thinking' ? '◌' : '▓'
      case 'agent_message':
        return '►'
      case 'status':
        return '●'
      case 'error':
        return '⚠'
      default:
        return '•'
    }
  }

  return (
    <div className="activity-feed-container">
      <h3>┌─── ACTIVITY MONITOR ─────────────────────────────────┐</h3>
      <div className="activity-feed" ref={feedRef}>
        {messages.slice(-10).map((msg, idx) => (
          <div key={idx} className="activity-entry" style={{ animationDelay: `${idx * 0.05}s` }}>
            <span className="activity-timestamp">{getTimestamp()}</span>
            <span className="activity-icon">{getIcon(msg)}</span>
            <span className="activity-text">{getActivityDescription(msg)}</span>
          </div>
        ))}
        {currentActivity && (
          <div className="activity-entry">
            <span className="activity-timestamp">{getTimestamp()}</span>
            <span className="activity-icon">◌</span>
            <span className="activity-text">{currentActivity}</span>
          </div>
        )}
      </div>
      <h3>└──────────────────────────────────────────────────────┘</h3>
    </div>
  )
}

export default React.memo(ActivityFeed, (prevProps, nextProps) => {
  // Check if we actually need to re-render
  if (prevProps.currentActivity !== nextProps.currentActivity) {
    return false // Re-render needed
  }
  
  // Compare only the last 10 messages that are displayed
  const prevDisplayed = prevProps.messages.slice(-10)
  const nextDisplayed = nextProps.messages.slice(-10)
  
  if (prevDisplayed.length !== nextDisplayed.length) {
    return false // Re-render needed
  }
  
  // Check if any displayed messages have changed
  for (let i = 0; i < prevDisplayed.length; i++) {
    const prevMsg = prevDisplayed[i]
    const nextMsg = nextDisplayed[i]
    
    // Compare key properties that would affect display
    if (prevMsg.type !== nextMsg.type ||
        prevMsg.agent !== nextMsg.agent ||
        prevMsg.message !== nextMsg.message ||
        prevMsg.state !== nextMsg.state ||
        prevMsg.activity !== nextMsg.activity) {
      return false // Re-render needed
    }
  }
  
  return true // No re-render needed
})