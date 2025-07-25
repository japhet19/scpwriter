// Theme-specific configuration interfaces

export interface SCPOptions {
  horrorLevel: number // 0 = Mild anomalies, safe containment | 100 = Extreme cosmic horror, reality-breaking
  containmentClass: number // 0 = Safe class objects | 100 = Apollyon class threats
  redactionLevel: number // 0 = Minimal redaction, clear documentation | 100 = Heavily redacted, classified info
}

export interface FantasyOptions {
  magicLevel: number // 0 = Low magic, realistic medieval | 100 = High magic, reality-bending powers
  tone: number // 0 = Dark, gritty fantasy | 100 = Light, whimsical adventure
  questScale: number // 0 = Personal, intimate story | 100 = Epic, world-changing quest
  timePeriod: number // 0 = Medieval fantasy | 100 = Modern urban fantasy
}

export interface CyberpunkOptions {
  techLevel: number // 0 = Near-future, limited tech | 100 = Post-singularity, mind uploading
  dystopiaLevel: number // 0 = Hopeful future, tech helps humanity | 100 = Oppressive megacorps, surveillance state
  perspective: number // 0 = Street-level criminal | 100 = Corporate executive
  augmentation: number // 0 = Minimal cybernetics | 100 = Full-body modification, AI integration
}

export interface RomanceOptions {
  heatLevel: number // 0 = Sweet, innocent romance | 100 = Steamy, explicit passion
  dramaLevel: number // 0 = Gentle, conflict-free love | 100 = Intense drama, major obstacles
  relationshipType: number // 0 = Friends to lovers | 100 = Enemies to lovers
  settingEra: number // 0 = Historical romance | 100 = Futuristic romance
}

export interface NoirOptions {
  grittiness: number // 0 = Light mystery, cozy detective | 100 = Hard-boiled, violent crime
  mysteryComplexity: number // 0 = Simple case, clear motives | 100 = Labyrinthine conspiracy, red herrings
  timePeriod: number // 0 = Classic 1940s noir | 100 = Modern neo-noir
  moralAmbiguity: number // 0 = Clear heroes and villains | 100 = Everyone morally compromised
}

export interface SciFiOptions {
  techLevel: number // 0 = Hard science, realistic physics | 100 = Space opera, impossible technology
  scienceType: number // 0 = Physics and engineering focus | 100 = Biology and consciousness focus
  scope: number // 0 = Personal, character-driven | 100 = Galactic, civilization-scale
  outlook: number // 0 = Dystopian, cautionary tale | 100 = Utopian, optimistic future
}

// Union type for all theme options
export type ThemeOptions = SCPOptions | FantasyOptions | CyberpunkOptions | RomanceOptions | NoirOptions | SciFiOptions

// Type guard functions
export const isSCPOptions = (options: ThemeOptions): options is SCPOptions => {
  return 'horrorLevel' in options && 'containmentClass' in options && 'redactionLevel' in options
}

export const isFantasyOptions = (options: ThemeOptions): options is FantasyOptions => {
  return 'magicLevel' in options && 'tone' in options && 'questScale' in options && 'timePeriod' in options
}

export const isCyberpunkOptions = (options: ThemeOptions): options is CyberpunkOptions => {
  return 'techLevel' in options && 'dystopiaLevel' in options && 'perspective' in options && 'augmentation' in options
}

export const isRomanceOptions = (options: ThemeOptions): options is RomanceOptions => {
  return 'heatLevel' in options && 'dramaLevel' in options && 'relationshipType' in options && 'settingEra' in options
}

export const isNoirOptions = (options: ThemeOptions): options is NoirOptions => {
  return 'grittiness' in options && 'mysteryComplexity' in options && 'timePeriod' in options && 'moralAmbiguity' in options
}

export const isSciFiOptions = (options: ThemeOptions): options is SciFiOptions => {
  return 'techLevel' in options && 'scienceType' in options && 'scope' in options && 'outlook' in options
}

// Default configurations for each theme
export const getDefaultThemeOptions = (themeId: string): ThemeOptions => {
  switch (themeId) {
    case 'scp':
      return { horrorLevel: 40, containmentClass: 30, redactionLevel: 50 }
    case 'fantasy':
      return { magicLevel: 60, tone: 50, questScale: 50, timePeriod: 20 }
    case 'cyberpunk':
      return { techLevel: 70, dystopiaLevel: 60, perspective: 30, augmentation: 50 }
    case 'romance':
      return { heatLevel: 40, dramaLevel: 50, relationshipType: 50, settingEra: 50 }
    case 'noir':
      return { grittiness: 60, mysteryComplexity: 50, timePeriod: 40, moralAmbiguity: 70 }
    case 'scifi':
      return { techLevel: 60, scienceType: 50, scope: 50, outlook: 50 }
    default:
      return { horrorLevel: 40, containmentClass: 30, redactionLevel: 50 }
  }
}