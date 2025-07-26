/**
 * Message parser utilities for agent communication
 */

export interface ParsedMessage {
  originalMessage: string
  sender?: string
  recipient?: string
  mentions: string[]
  messageType: MessageType
  keyPhrases: string[]
  hasStoryContent: boolean
}

export type MessageType = 
  | 'draft'      // Contains story content
  | 'feedback'   // Contains critique/suggestions
  | 'revision'   // Mentions changes/updates
  | 'approval'   // Contains approval language
  | 'escalation' // Calls for Expert
  | 'general'    // Default type

/**
 * Extract @mentions from a message
 */
export function extractMentions(message: string): string[] {
  const mentionRegex = /@(Writer|Reader|Expert)\b/gi
  const matches = message.match(mentionRegex) || []
  return [...new Set(matches.map(m => m.substring(1)))] // Remove @ and deduplicate
}

/**
 * Determine who the message is addressing based on content
 */
export function extractRecipient(message: string, sender?: string): string | undefined {
  const mentions = extractMentions(message)
  
  // Direct addressing patterns
  const directPatterns = [
    /^\s*\[@(Writer|Reader|Expert)\]/i,
    /^(Writer|Reader|Expert):/i,
    /Dear (Writer|Reader|Expert)/i,
  ]
  
  for (const pattern of directPatterns) {
    const match = message.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  // If only one mention and it's not the sender, likely the recipient
  if (mentions.length === 1 && mentions[0] !== sender) {
    return mentions[0]
  }
  
  // Check for "All" addressing
  if (mentions.length > 1 || /to all|everyone/i.test(message)) {
    return 'All'
  }
  
  return undefined
}

/**
 * Categorize message type based on content
 */
export function categorizeMessage(message: string): MessageType {
  const lowerMessage = message.toLowerCase()
  
  // Check for story content markers
  if (/---begin story---|---end story---|^\*\*.*\*\*$/m.test(message)) {
    return 'draft'
  }
  
  // Check for approval language
  if (/\b(approved?|excellent|perfect|ready|complete|finished|great work|well done)\b/i.test(message) &&
      /\b(story|draft|narrative|scp)\b/i.test(message)) {
    return 'approval'
  }
  
  // Check for escalation
  if (/\[@expert\]|calling expert|need expert/i.test(message)) {
    return 'escalation'
  }
  
  // Check for revision language
  if (/\b(revise|revision|change|update|modify|edit|rewrite|rework)\b/i.test(message)) {
    return 'revision'
  }
  
  // Check for feedback language
  if (/\b(feedback|critique|suggest|consider|could|should|needs?|but|however|issue|concern)\b/i.test(message)) {
    return 'feedback'
  }
  
  return 'general'
}

/**
 * Extract key phrases from message
 */
export function extractKeyPhrases(message: string): string[] {
  const phrases: string[] = []
  
  // Extract quoted sections
  const quotedMatches = message.match(/"([^"]+)"/g) || []
  phrases.push(...quotedMatches.map(q => q.replace(/"/g, '')))
  
  // Extract sections in all caps (emphasis)
  const capsMatches = message.match(/\b[A-Z]{2,}\b/g) || []
  phrases.push(...capsMatches.filter(m => !['SCP', 'AI', 'ID', 'OK'].includes(m)))
  
  // Extract key action phrases
  const actionPatterns = [
    /needs? (to|more) \w+/gi,
    /must \w+/gi,
    /should \w+/gi,
    /please \w+/gi,
  ]
  
  for (const pattern of actionPatterns) {
    const matches = message.match(pattern) || []
    phrases.push(...matches)
  }
  
  return [...new Set(phrases)].slice(0, 5) // Limit to 5 key phrases
}

/**
 * Parse a complete agent message
 */
export function parseAgentMessage(
  message: string, 
  sender?: string
): ParsedMessage {
  return {
    originalMessage: message,
    sender,
    recipient: extractRecipient(message, sender),
    mentions: extractMentions(message),
    messageType: categorizeMessage(message),
    keyPhrases: extractKeyPhrases(message),
    hasStoryContent: /---begin story---|---end story---/i.test(message)
  }
}

/**
 * Get icon for message type
 */
export function getMessageTypeIcon(type: MessageType): string {
  switch (type) {
    case 'draft': return '📝'
    case 'feedback': return '💬'
    case 'revision': return '✏️'
    case 'approval': return '✅'
    case 'escalation': return '🔔'
    default: return '•'
  }
}

/**
 * Format interaction flow string
 */
export function formatInteractionFlow(
  sender?: string, 
  recipient?: string
): string {
  if (!sender) return ''
  if (!recipient || recipient === 'All') return `${sender}:`
  return `${sender} → ${recipient}:`
}

/**
 * Smart truncate that preserves sentence boundaries
 */
export function smartTruncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  
  // Try to find a sentence boundary
  const truncated = text.substring(0, maxLength)
  const lastPeriod = truncated.lastIndexOf('.')
  const lastQuestion = truncated.lastIndexOf('?')
  const lastExclamation = truncated.lastIndexOf('!')
  
  const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation)
  
  if (lastSentenceEnd > maxLength * 0.7) {
    return text.substring(0, lastSentenceEnd + 1)
  }
  
  // Fall back to word boundary
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...'
  }
  
  return truncated + '...'
}