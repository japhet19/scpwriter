import { fantasyNames, GenderAwareNameData, NameData, getLegacyFantasyNames } from './nameData/fantasyNames'
import { cyberpunkNames } from './nameData/cyberpunkNames'
import { romanceNames } from './nameData/romanceNames'
import { noirNames } from './nameData/noirNames'
import { scifiNames } from './nameData/scifiNames'

// Gender categories for selection
type GenderCategory = 'male' | 'female' | 'neutral'

// Theme to name data mapping (legacy format for non-upgraded themes)
const legacyThemeNameData: Record<string, NameData> = {
  fantasy: getLegacyFantasyNames(), // Use legacy compatibility for now
  cyberpunk: cyberpunkNames,
  romance: romanceNames,
  noir: noirNames,
  scifi: scifiNames,
  // SCP theme uses generic sci-fi style names
  scp: scifiNames
}

// Theme to gender-aware name data mapping (new format)
const genderAwareThemeData: Record<string, GenderAwareNameData> = {
  fantasy: fantasyNames,
  // Other themes will be added as we upgrade them
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
 * Select a random gender category with balanced distribution
 */
function selectRandomGender(): GenderCategory {
  const rand = getSecureRandom(100)
  if (rand < 45) return 'male'      // 45% chance
  if (rand < 90) return 'female'    // 45% chance  
  return 'neutral'                  // 10% chance
}

/**
 * Check if theme has gender-aware name data
 */
function hasGenderAwareData(theme: string): boolean {
  return theme in genderAwareThemeData
}

/**
 * Generate gender-aware name for themes that support it
 */
function generateGenderAwareName(theme: string): string {
  const nameData = genderAwareThemeData[theme]
  if (!nameData) {
    throw new Error(`Theme ${theme} does not have gender-aware data`)
  }

  // Select gender category
  const genderCategory = selectRandomGender()
  const genderData = nameData[genderCategory]

  // Generate name components using gender-appropriate data
  const title = getRandomWithMemory(genderData.titles, recentNames.filter(n => genderData.titles.includes(n)))
  const firstName = getRandomWithMemory(genderData.names, recentNames.filter(n => genderData.names.includes(n)))
  const lastName = getRandomWithMemory(nameData.lastNames, recentNames.filter(n => nameData.lastNames.includes(n)))

  // Theme-specific name construction (fantasy for now)
  let generatedName: string
  
  if (theme === 'fantasy') {
    // Fantasy: Usually skip titles for more natural names
    if (getSecureRandom(100) < 70) { // 70% chance no title
      generatedName = `${firstName} ${lastName}`
    } else {
      generatedName = `${title} ${firstName} ${lastName}`
    }
  } else {
    // Default: Standard title + name format
    generatedName = `${title} ${firstName} ${lastName}`
  }

  return generatedName
}

/**
 * Generate theme-appropriate protagonist name
 */
export function generateThemeProtagonistName(theme: string): string {
  // Use gender-aware generation for themes that support it
  if (hasGenderAwareData(theme)) {
    const generatedName = generateGenderAwareName(theme)
    addToRecentNames(generatedName)
    return generatedName
  }

  // Fall back to legacy generation for non-upgraded themes
  const nameData = legacyThemeNameData[theme] || legacyThemeNameData.scp
  
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
      // Fantasy: Usually skip titles for more natural names
      if (getSecureRandom(100) < 70) { // 70% chance no title
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
      } else if (getSecureRandom(100) < 80) { // 80% chance no title
        generatedName = `${firstName} ${lastName}`
      } else {
        generatedName = `${title} ${firstName} ${lastName}`
      }
      break
      
    case 'noir':
      // Noir: Hard-boiled style, often with detective titles
      if (title.includes('Detective') || title.includes('Private')) {
        generatedName = `${title} ${firstName} ${lastName}`
      } else if (getSecureRandom(100) < 60) { // 60% chance no title
        generatedName = `${firstName} ${lastName}`
      } else {
        generatedName = `${title} ${firstName} ${lastName}`
      }
      break
      
    case 'scifi':
    case 'scp':
      // Sci-fi: Military ranks and scientific titles common
      if (title.includes('Admiral') || title.includes('Captain') || title.includes('Commander') || title.includes('Chief')) {
        generatedName = `${title} ${firstName} ${lastName}`
      } else if (getSecureRandom(100) < 40) { // 40% chance of title in sci-fi
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
  const nameData = legacyThemeNameData[theme] || legacyThemeNameData.scp
  
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
  return Object.keys(legacyThemeNameData)
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
  if (hasGenderAwareData(theme)) {
    const nameData = genderAwareThemeData[theme]
    const totalFirstNames = nameData.male.names.length + nameData.female.names.length + nameData.neutral.names.length
    const totalTitles = nameData.male.titles.length + nameData.female.titles.length + nameData.neutral.titles.length
    
    return {
      firstNames: totalFirstNames,
      lastNames: nameData.lastNames.length,
      titles: totalTitles,
      totalCombinations: totalFirstNames * nameData.lastNames.length * totalTitles
    }
  }

  // Legacy format for non-upgraded themes
  const nameData = legacyThemeNameData[theme] || legacyThemeNameData.scp
  const { firstNames, lastNames, titles } = nameData
  
  return {
    firstNames: firstNames.length,
    lastNames: lastNames.length,
    titles: titles.length,
    totalCombinations: firstNames.length * lastNames.length * titles.length
  }
}