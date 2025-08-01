import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { ThemeOptions } from '@/types/themeOptions'

export interface AgentMessage {
  type: 'status' | 'agent_message' | 'completed' | 'error' | 'agent_update' | 'agent_stream_chunk' | 'session_created' | 'auth_success'
  agent?: string
  message: string
  turn?: number
  phase?: string
  story?: string
  state?: 'thinking' | 'writing' | 'waiting'
  activity?: string
  chunk?: string
  session_id?: string
}

export interface StoryGenerationParams {
  theme: string
  pages: number
  protagonist?: string
  model?: string
  uiTheme?: string
  themeOptions?: ThemeOptions
}

export interface AgentStates {
  Writer: 'thinking' | 'writing' | 'waiting'
  Reader: 'thinking' | 'writing' | 'waiting'
  Expert: 'thinking' | 'writing' | 'waiting'
}

export function useWebSocket(url: string = 'http://localhost:8000', getAuthToken?: () => Promise<string | null>) {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentAgent, setCurrentAgent] = useState<string | null>(null)
  const [currentPhase, setCurrentPhase] = useState<string | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [agentStates, setAgentStates] = useState<AgentStates>({
    Writer: 'waiting',
    Reader: 'waiting',
    Expert: 'waiting'
  })
  const [currentActivity, setCurrentActivity] = useState<string>('')
  const [streamingMessages, setStreamingMessages] = useState<Record<string, string>>({})
  const [currentStreamingAgent, setCurrentStreamingAgent] = useState<string | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`${url.replace('http', 'ws')}/ws/generate`)
    
    ws.onopen = async () => {
      console.log('WebSocket connected')
      
      // Send auth token if available
      if (getAuthToken) {
        const token = await getAuthToken()
        if (token) {
          ws.send(JSON.stringify({
            type: 'auth',
            token: token
          }))
        } else {
          console.error('No auth token available')
          ws.close()
          return
        }
      }
      
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      const data: AgentMessage = JSON.parse(event.data)
      
      // Handle auth response
      if (data.type === 'auth_success') {
        console.log('Authentication successful')
        return
      }
      
      // Handle session creation
      if (data.type === 'session_created' && data.session_id) {
        console.log('Session created:', data.session_id)
        setCurrentSessionId(data.session_id)
      }
      
      setMessages(prev => [...prev, data])
      
      if (data.agent) {
        setCurrentAgent(data.agent)
      }
      
      if (data.phase) {
        setCurrentPhase(data.phase)
      }
      
      // Handle agent state updates
      if (data.type === 'agent_update' && data.agent && data.state) {
        setAgentStates(prev => ({
          ...prev,
          [data.agent as keyof AgentStates]: data.state
        }))
        
        if (data.activity) {
          setCurrentActivity(data.activity)
        }
      }
      
      // Handle streaming chunks
      if (data.type === 'agent_stream_chunk' && data.agent && data.chunk) {
        setCurrentStreamingAgent(data.agent)
        setStreamingMessages(prev => ({
          ...prev,
          [data.agent!]: (prev[data.agent!] || '') + data.chunk!
        }))
      }
      
      // Reset all agents to waiting when a new one becomes active
      if (data.type === 'agent_message' && data.agent) {
        // Clear streaming message for this agent since we now have the complete message
        if (currentStreamingAgent === data.agent) {
          setStreamingMessages(prev => {
            const newState = { ...prev }
            delete newState[data.agent!]
            return newState
          })
          setCurrentStreamingAgent(null)
        }
        
        setAgentStates(prev => ({
          Writer: data.agent === 'Writer' ? 'writing' : 'waiting',
          Reader: data.agent === 'Reader' ? 'writing' : 'waiting',
          Expert: data.agent === 'Expert' ? 'writing' : 'waiting'
        }))
      }
      
      if (data.type === 'completed' || data.type === 'error') {
        setIsGenerating(false)
        setCurrentAgent(null)
        setCurrentPhase(null)
        setAgentStates({
          Writer: 'waiting',
          Reader: 'waiting',
          Expert: 'waiting'
        })
        
        // Store session ID if present
        if (data.type === 'completed' && data.session_id) {
          setCurrentSessionId(data.session_id)
        }
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
      // Add more detailed error logging
      console.error('WebSocket connection failed. URL:', `${url.replace('http', 'ws')}/ws/generate`)
      console.error('Make sure the backend server is running on', url)
    }

    ws.onclose = (event) => {
      console.log('WebSocket disconnected')
      console.log('Close event code:', event.code, 'reason:', event.reason)
      setIsConnected(false)
      setIsGenerating(false)
      
      // Log specific close reasons
      if (event.code === 1006) {
        console.error('WebSocket closed abnormally - server may be down or endpoint may not exist')
      }
    }

    socketRef.current = ws
  }, [url])

  const generateStory = useCallback((params: StoryGenerationParams) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return
    }

    setMessages([])
    setStreamingMessages({})
    setCurrentStreamingAgent(null)
    setCurrentSessionId(null)
    setIsGenerating(true)
    socketRef.current.send(JSON.stringify(params))
  }, [])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    connect,
    disconnect,
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
  }
}