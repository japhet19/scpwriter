import { AgentMessage } from '@/hooks/useWebSocket'

export interface SessionMetadata {
  theme: string
  pages: number
  protagonist?: string
  startTime: Date
  endTime?: Date
  totalMessages: number
  totalTurns: number
}

export interface ExportOptions {
  format: 'txt' | 'json' | 'md'
  includeMetadata?: boolean
  includeTimestamps?: boolean
}

export function formatAgentLogs(
  messages: AgentMessage[],
  metadata?: SessionMetadata,
  options: ExportOptions = { format: 'txt', includeMetadata: true }
): string {
  switch (options.format) {
    case 'txt':
      return formatAsPlainText(messages, metadata, options)
    case 'json':
      return formatAsJSON(messages, metadata)
    case 'md':
      return formatAsMarkdown(messages, metadata, options)
    default:
      return formatAsPlainText(messages, metadata, options)
  }
}

function formatAsPlainText(
  messages: AgentMessage[],
  metadata?: SessionMetadata,
  options: ExportOptions = { format: 'txt' }
): string {
  let output = ''
  
  // Header
  output += '='.repeat(60) + '\n'
  output += 'SCP WRITER - AGENT INTERACTION LOG\n'
  output += '='.repeat(60) + '\n\n'
  
  // Metadata
  if (metadata && options.includeMetadata) {
    output += 'SESSION INFORMATION\n'
    output += '-'.repeat(30) + '\n'
    output += `Theme: ${metadata.theme}\n`
    output += `Pages: ${metadata.pages}\n`
    if (metadata.protagonist) {
      output += `Protagonist: ${metadata.protagonist}\n`
    }
    output += `Start Time: ${metadata.startTime.toLocaleString()}\n`
    if (metadata.endTime) {
      output += `End Time: ${metadata.endTime.toLocaleString()}\n`
      const duration = Math.round((metadata.endTime.getTime() - metadata.startTime.getTime()) / 1000)
      output += `Duration: ${Math.floor(duration / 60)}m ${duration % 60}s\n`
    }
    output += `Total Messages: ${metadata.totalMessages}\n`
    output += `Total Turns: ${metadata.totalTurns}\n`
    output += '\n' + '='.repeat(60) + '\n\n'
  }
  
  // Messages
  output += 'AGENT CONVERSATION\n'
  output += '='.repeat(60) + '\n\n'
  
  messages.forEach((msg, index) => {
    if (msg.type === 'agent_message' && msg.agent) {
      // Agent header
      output += `[${msg.agent}]`
      if (msg.turn) output += ` - Turn ${msg.turn}`
      if (msg.phase) output += ` - Phase: ${msg.phase}`
      output += '\n'
      
      // Message content
      const content = msg.message || ''
      output += content + '\n'
      
      // Separator
      output += '-'.repeat(60) + '\n\n'
    }
  })
  
  return output
}

function formatAsJSON(
  messages: AgentMessage[],
  metadata?: SessionMetadata
): string {
  const exportData = {
    metadata: metadata ? {
      ...metadata,
      startTime: metadata.startTime.toISOString(),
      endTime: metadata.endTime?.toISOString()
    } : null,
    messages: messages.filter(msg => msg.type === 'agent_message'),
    exportedAt: new Date().toISOString()
  }
  
  return JSON.stringify(exportData, null, 2)
}

function formatAsMarkdown(
  messages: AgentMessage[],
  metadata?: SessionMetadata,
  options: ExportOptions = { format: 'md' }
): string {
  let output = ''
  
  // Header
  output += '# SCP Writer - Agent Interaction Log\n\n'
  
  // Metadata
  if (metadata && options.includeMetadata) {
    output += '## Session Information\n\n'
    output += `- **Theme**: ${metadata.theme}\n`
    output += `- **Pages**: ${metadata.pages}\n`
    if (metadata.protagonist) {
      output += `- **Protagonist**: ${metadata.protagonist}\n`
    }
    output += `- **Start Time**: ${metadata.startTime.toLocaleString()}\n`
    if (metadata.endTime) {
      output += `- **End Time**: ${metadata.endTime.toLocaleString()}\n`
      const duration = Math.round((metadata.endTime.getTime() - metadata.startTime.getTime()) / 1000)
      output += `- **Duration**: ${Math.floor(duration / 60)}m ${duration % 60}s\n`
    }
    output += `- **Total Messages**: ${metadata.totalMessages}\n`
    output += `- **Total Turns**: ${metadata.totalTurns}\n`
    output += '\n---\n\n'
  }
  
  // Messages grouped by phase
  output += '## Agent Conversation\n\n'
  
  let currentPhase = ''
  messages.forEach((msg) => {
    if (msg.type === 'agent_message' && msg.agent) {
      // New phase header
      if (msg.phase && msg.phase !== currentPhase) {
        currentPhase = msg.phase
        output += `### Phase: ${currentPhase}\n\n`
      }
      
      // Agent message
      output += `#### ${msg.agent}`
      if (msg.turn) output += ` (Turn ${msg.turn})`
      output += '\n\n'
      
      // Message content with proper formatting
      const content = msg.message || ''
      // Indent multi-line content
      const formattedContent = content.split('\n').map(line => line.trim() ? `> ${line}` : '>').join('\n')
      output += formattedContent + '\n\n'
    }
  })
  
  return output
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function generateFilename(theme: string, format: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const sanitizedTheme = theme.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30)
  return `scp_log_${timestamp}_${sanitizedTheme}.${format}`
}