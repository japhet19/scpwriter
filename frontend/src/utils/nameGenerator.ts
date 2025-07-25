import { fantasyNames } from './nameData/fantasyNames'
import { cyberpunkNames } from './nameData/cyberpunkNames'
import { romanceNames } from './nameData/romanceNames'
import { noirNames } from './nameData/noirNames'
import { scifiNames } from './nameData/scifiNames'
import { NameData } from './nameData/fantasyNames'

// Theme to name data mapping
const themeNameData: Record<string, NameData> = {
  fantasy: fantasyNames,
  cyberpunk: cyberpunkNames,
  romance: romanceNames,
  noir: noirNames,
  scifi: scifiNames,
  // SCP theme uses generic sci-fi style names
  scp: scifiNames
}

// Session memory for avoiding repetition
let recentNames: string[] = []
const MAX_RECENT_NAMES = 20

/**
 * Enhanced secure random number generator using crypto API
 * Falls back to Math.random() if crypto is not available
 */
function getSecureRandom(max: number): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1)
    window.crypto.getRandomValues(array)
    return array[0] % max
  }
  // Fallback to Math.random() with improved seeding
  return Math.floor(Math.random() * max)
}

/**
 * Get random item from array while avoiding recently used items
 */
function getRandomWithMemory<T>(array: T[], recentItems: T[] = []): T {
  // If we've used most items, clear some memory to avoid infinite loops
  if (recentItems.length >= array.length * 0.8) {
    recentItems.splice(0, Math.floor(recentItems.length / 2))
  }
  
  // Filter out recently used items
  const filtered = array.filter(item => !recentItems.includes(item))
  
  // If all items have been used recently, use the full array
  const sourceArray = filtered.length > 0 ? filtered : array
  
  return sourceArray[getSecureRandom(sourceArray.length)]
}

/**
 * Add name to recent memory and maintain size limit
 */
function addToRecentNames(name: string): void {
  recentNames.unshift(name)
  if (recentNames.length > MAX_RECENT_NAMES) {
    recentNames = recentNames.slice(0, MAX_RECENT_NAMES)
  }
}

/**
 * Generate theme-appropriate protagonist name
 */
export function generateThemeProtagonistName(theme: string): string {
  const nameData = themeNameData[theme] || themeNameData.scp
  
  // Extract arrays from name data
  const { firstNames, lastNames, titles } = nameData
  
  // Generate name components using improved randomness
  const title = getRandomWithMemory(titles, recentNames.filter(n => titles.includes(n)))
  const firstName = getRandomWithMemory(firstNames, recentNames.filter(n => firstNames.includes(n)))
  const lastName = getRandomWithMemory(lastNames, recentNames.filter(n => lastNames.includes(n)))
  
  // Theme-specific name construction
  let generatedName: string
  
  switch (theme) {
    case 'fantasy':
      // Fantasy: Sometimes skip titles for more natural names
      if (getSecureRandom(100) < 30) { // 30% chance no title
        generatedName = `${firstName} ${lastName}`
      } else {
        generatedName = `${title} ${firstName} ${lastName}`
      }
      break
      
    case 'cyberpunk':
      // Cyberpunk: Mix of handles and corporate names
      if (getSecureRandom(100) < 40) { // 40% chance of handle-style name
        generatedName = firstName // Just use first name as handle
      } else if (getSecureRandom(100) < 30) { // 30% chance of no title
        generatedName = `${firstName} ${lastName}`
      } else {
        generatedName = `${title} ${firstName} ${lastName}`
      }
      break
      
    case 'romance':
      // Romance: Elegant, often without titles unless noble
      if (titles.includes(title) && (title.includes('Lord') || title.includes('Lady') || title.includes('Duke') || title.includes('Duchess'))) {
        generatedName = `${title} ${firstName} ${lastName}`
      } else if (getSecureRandom(100) < 20) { // 20% chance of professional title
        generatedName = `${title} ${firstName} ${lastName}`
      } else {
        generatedName = `${firstName} ${lastName}`
      }
      break
      
    case 'noir':
      // Noir: Hard-boiled style, often with detective titles
      if (title.includes('Detective') || title.includes('Private')) {
        generatedName = `${title} ${firstName} ${lastName}`
      } else if (getSecureRandom(100) < 40) { // 40% chance of other titles
        generatedName = `${title} ${firstName} ${lastName}`
      } else {
        generatedName = `${firstName} ${lastName}`
      }
      break
      
    case 'scifi':
    case 'scp':
      // Sci-fi: Military ranks and scientific titles common
      if (title.includes('Admiral') || title.includes('Captain') || title.includes('Commander') || title.includes('Chief')) {
        generatedName = `${title} ${firstName} ${lastName}`
      } else if (getSecureRandom(100) < 60) { // 60% chance of title in sci-fi
        generatedName = `${title} ${firstName} ${lastName}`
      } else {
        generatedName = `${firstName} ${lastName}`
      }
      break
      
    default:
      // Default: Standard title + name format
      generatedName = `${title} ${firstName} ${lastName}`
  }
  
  // Add to recent names memory
  addToRecentNames(generatedName)
  
  return generatedName
}

/**
 * Generate advanced multi-part names for specific themes
 */
export function generateAdvancedThemeName(theme: string): string {
  const nameData = themeNameData[theme] || themeNameData.scp
  
  switch (theme) {
    case 'fantasy':
      // Fantasy: Add location or magical elements
      const fantasyBase = generateThemeProtagonistName(theme)
      const locations = ['of the Silver Court', 'of Rivendell', 'the Dragonborn', 'the Wise', 'the Brave']
      if (getSecureRandom(100) < 30) { // 30% chance of additional element
        return `${fantasyBase} ${getRandomWithMemory(locations)}`
      }
      return fantasyBase
      
    case 'cyberpunk':
      // Cyberpunk: Add version numbers or corp affiliations
      const cyberpunkBase = generateThemeProtagonistName(theme)
      if (getSecureRandom(100) < 25) { // 25% chance of version number
        const version = getSecureRandom(10) + 1
        return `${cyberpunkBase}-${version}`
      } else if (getSecureRandom(100) < 20) { // 20% chance of .exe suffix
        return `${cyberpunkBase}.exe`
      }
      return cyberpunkBase
      
    case 'scifi':
      // Sci-fi: Add fleet or sector designations
      const scifiBase = generateThemeProtagonistName(theme)
      const fleets = ['7th Fleet', 'Deep Space Division', 'Exploration Command', 'Defense Force']
      if (getSecureRandom(100) < 35) { // 35% chance of fleet designation
        return `${scifiBase}, ${getRandomWithMemory(fleets)}`
      }
      return scifiBase
      
    default:
      return generateThemeProtagonistName(theme)
  }
}

/**
 * Clear the recent names memory (useful for testing or reset)
 */
export function clearNameMemory(): void {
  recentNames = []
}

/**
 * Get available themes for name generation
 */
export function getAvailableThemes(): string[] {
  return Object.keys(themeNameData)
}

/**
 * Get statistics about name generation possibilities
 */
export function getNameGenerationStats(theme: string): {
  firstNames: number
  lastNames: number
  titles: number
  totalCombinations: number
} {
  const nameData = themeNameData[theme] || themeNameData.scp
  const { firstNames, lastNames, titles } = nameData
  
  return {
    firstNames: firstNames.length,
    lastNames: lastNames.length,
    titles: titles.length,
    totalCombinations: firstNames.length * lastNames.length * titles.length
  }
}