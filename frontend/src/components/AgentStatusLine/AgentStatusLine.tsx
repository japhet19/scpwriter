'use client'

import React from 'react'
import { AgentMessage } from '@/hooks/useWebSocket'

interface AgentStatusLineProps {
  messages: AgentMessage[]
  currentPhase?: string | null
  currentStreamingAgent?: string | null
  sessionMetadata?: {
    pages: number
    totalWords?: number
  }
}

export default function AgentStatusLine({ 
  messages, 
  currentPhase, 
  currentStreamingAgent,
  sessionMetadata 
}: AgentStatusLineProps) {
  // Get the latest turn number
  const latestTurn = messages
    .filter(m => m.turn)
    .reduce((max, m) => Math.max(max, m.turn || 0), 0)
  
  // Calculate word count from story messages
  const storyWordCount = messages
    .filter(m => m.type === 'agent_message' && m.message?.includes('---BEGIN STORY---'))
    .reduce((count, m) => {
      const storyMatch = m.message?.match(/---BEGIN STORY---([\s\S]*?)---END STORY---/)
      if (storyMatch) {
        return count + storyMatch[1].trim().split(/\s+/).length
      }
      return count
    }, 0)
  
  const targetWords = (sessionMetadata?.pages || 3) * 300
  const wordProgress = Math.min(100, (storyWordCount / targetWords) * 100)
  
  return (
    <div className="agent-status-line">
      <div className="status-segment">
        <span className="status-label">TURN</span>
        <span className="status-value">{latestTurn || '-'}</span>
      </div>
      
      <div className="status-segment">
        <span className="status-label">PHASE</span>
        <span className="status-value">{currentPhase || 'Initializing'}</span>
      </div>
      
      <div className="status-segment">
        <span className="status-label">ACTIVE</span>
        <span className="status-value">
          {currentStreamingAgent || 'Waiting'}
          {currentStreamingAgent && <span className="status-indicator">◉</span>}
        </span>
      </div>
      
      <div className="status-segment">
        <span className="status-label">PROGRESS</span>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${wordProgress}%` }}
          />
        </div>
        <span className="status-value">
          {storyWordCount}/{targetWords} words
        </span>
      </div>
      
      <style jsx>{`
        .agent-status-line {
          display: flex;
          align-items: center;
          gap: 30px;
          padding: 10px 20px;
          background: rgba(0, 255, 0, 0.05);
          border: 1px solid var(--terminal-green);
          border-radius: 4px;
          margin: 20px 0;
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
        }
        
        .status-segment {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .status-label {
          color: var(--terminal-green);
          opacity: 0.7;
        }
        
        .status-value {
          color: var(--terminal-amber);
          font-weight: bold;
        }
        
        .status-indicator {
          color: var(--terminal-green);
          animation: pulse 1s ease-in-out infinite;
          margin-left: 5px;
        }
        
        .progress-bar {
          width: 100px;
          height: 6px;
          background: rgba(0, 255, 0, 0.2);
          border: 1px solid var(--terminal-green);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: var(--terminal-green);
          transition: width 0.3s ease;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @media (max-width: 768px) {
          .agent-status-line {
            flex-wrap: wrap;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  )
}