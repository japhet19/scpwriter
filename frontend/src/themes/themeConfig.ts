// Theme configuration types and data

export interface ColorPalette {
  primary: string
  secondary: string
  background: string
  backgroundLight: string
  text: string
  accent: string
  error?: string
}

export interface FontConfig {
  main: string
  accent: string
  import?: string // Google Fonts import URL
}

export interface UIFeature {
  name: string
  value: string
}

export interface StoryTheme {
  id: string
  name: string
  description: string
  
  // UI Configuration
  ui: {
    mainTitle: string
    tagline: string
    statusText: string
    bootMessages: string[]
    colors: ColorPalette
    fonts: FontConfig
    effects: string[]
    backgroundType: string
  }
  
  // Agent names for UI display
  agents: {
    writer: string
    reader: string
    expert: string
  }
  
  // For matching story types to themes
  keywords: string[]
}

// Import Google Fonts CSS
const fontImports = {
  scp: "@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&display=swap');",
  fantasy: "@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Crimson+Text:wght@400;600&display=swap');",
  cyberpunk: "@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');",
  romance: "@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Lora:wght@400;500&display=swap');",
  noir: "@import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Courier+Prime:wght@400;700&display=swap');",
  scifi: "@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;700&family=Space+Mono:wght@400;700&display=swap');"
}

export const THEMES: Record<string, StoryTheme> = {
  scp: {
    id: 'scp',
    name: 'SCP Foundation',
    description: 'Secure, Contain, Protect - Document anomalous phenomena',
    ui: {
      mainTitle: 'SCP FOUNDATION TERMINAL',
      tagline: 'SECURE. CONTAIN. PROTECT.',
      statusText: 'SECURE CONNECTION',
      bootMessages: [
        'INITIALIZING SCP FOUNDATION SYSTEMS...',
        'LOADING SECURITY PROTOCOLS...',
        'ESTABLISHING SECURE CONNECTION...',
        'VERIFYING CLEARANCE LEVEL...',
        'ACCESS GRANTED - LEVEL 3 CLEARANCE',
        'LOADING NARRATIVE DOCUMENTATION SYSTEM...'
      ],
      colors: {
        primary: '#00ff00',
        secondary: '#ffb000',
        background: '#0a0a0a',
        backgroundLight: '#1a1a1a',
        text: '#00ff00',
        accent: '#ff0040'
      },
      fonts: {
        main: 'Share Tech Mono',
        accent: 'VT323',
        import: fontImports.scp
      },
      effects: ['crt', 'scanlines', 'glitch', 'flicker'],
      backgroundType: 'grid'
    },
    agents: {
      writer: 'SCP_WRITER',
      reader: 'READER',
      expert: 'EXPERT'
    },
    keywords: ['horror', 'anomaly', 'mystery', 'supernatural', 'containment']
  },
  
  fantasy: {
    id: 'fantasy',
    name: 'Enchanted Tales',
    description: 'Weave magical stories of wonder and adventure',
    ui: {
      mainTitle: 'ENCHANTED TALES',
      tagline: 'DREAM. BELIEVE. CREATE.',
      statusText: 'MAGICAL QUILL READY',
      bootMessages: [
        'AWAKENING THE ANCIENT MAGIC...',
        'SUMMONING THE MUSES...',
        'OPENING THE BOOK OF TALES...',
        'PREPARING THE ENCHANTED QUILL...',
        'INVOKING STORYTELLING SPIRITS...',
        'MAGIC FLOWS THROUGH YOUR WORDS...'
      ],
      colors: {
        primary: '#FFD700',
        secondary: '#6B46C1',
        background: '#1a0f1f',
        backgroundLight: '#2a1f3f',
        text: '#FFD700',
        accent: '#228B22'
      },
      fonts: {
        main: 'Cinzel',
        accent: 'Crimson Text',
        import: fontImports.fantasy
      },
      effects: ['sparkles', 'glow', 'float', 'shimmer'],
      backgroundType: 'forest'
    },
    agents: {
      writer: 'ROYAL_SCRIBE',
      reader: 'COURT_STORYTELLER',
      expert: 'ARCHMAGE'
    },
    keywords: ['magic', 'fairy', 'wizard', 'quest', 'dragon', 'castle', 'enchanted']
  },
  
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Neural Network',
    description: 'Jack into tales of digital rebellion',
    ui: {
      mainTitle: 'NEURAL INTERFACE v2.77',
      tagline: 'JACK IN. DOWNLOAD. TRANSCEND.',
      statusText: 'NEURAL LINK ESTABLISHED',
      bootMessages: [
        'INITIALIZING NEURAL INTERFACE...',
        'BYPASSING ICE PROTOCOLS...',
        'ESTABLISHING SECURE CHANNEL...',
        'LOADING RUNNER PROFILE...',
        'SYNCING CONSCIOUSNESS MATRIX...',
        'WELCOME TO THE NET, RUNNER...'
      ],
      colors: {
        primary: '#00ffff',
        secondary: '#ff00ff',
        background: '#0a0014',
        backgroundLight: '#1a0024',
        text: '#00ffff',
        accent: '#ff0080'
      },
      fonts: {
        main: 'Orbitron',
        accent: 'Share Tech Mono',
        import: fontImports.cyberpunk
      },
      effects: ['neon-glow', 'digital-rain', 'glitch', 'hologram'],
      backgroundType: 'city-lights'
    },
    agents: {
      writer: 'DATA_SCRIBE',
      reader: 'NETRUNNER',
      expert: 'AI_OVERSEER'
    },
    keywords: ['cyber', 'hacker', 'digital', 'tech', 'future', 'dystopia', 'neon']
  },
  
  romance: {
    id: 'romance',
    name: 'Hearts & Letters',
    description: 'Pen tales of love and connection',
    ui: {
      mainTitle: 'HEARTS & LETTERS',
      tagline: 'LOVE. HOPE. FOREVER.',
      statusText: 'HEARTSTRINGS CONNECTED',
      bootMessages: [
        'OPENING THE BOOK OF LOVE...',
        'WARMING HEARTS...',
        'PREPARING CUPID\'S QUILL...',
        'GATHERING ROSE PETALS...',
        'TUNING HEARTSTRINGS...',
        'READY TO WRITE LOVE\'S STORY...'
      ],
      colors: {
        primary: '#FFB6C1',
        secondary: '#B76E79',
        background: '#2d1f2f',
        backgroundLight: '#3d2f3f',
        text: '#FFB6C1',
        accent: '#E6E6FA'
      },
      fonts: {
        main: 'Dancing Script',
        accent: 'Lora',
        import: fontImports.romance
      },
      effects: ['hearts', 'soft-glow', 'fade', 'sparkle'],
      backgroundType: 'rose-garden'
    },
    agents: {
      writer: 'ROMANCE_AUTHOR',
      reader: 'ROMANTIC_SOUL',
      expert: 'LOVE_SAGE'
    },
    keywords: ['love', 'romance', 'heart', 'passion', 'relationship', 'wedding', 'soulmate']
  },
  
  noir: {
    id: 'noir',
    name: 'Dark Cases',
    description: 'Unravel mysteries in the shadows',
    ui: {
      mainTitle: 'CASE FILE SYSTEM',
      tagline: 'TRUTH. JUSTICE. SHADOWS.',
      statusText: 'CASE FILE OPEN',
      bootMessages: [
        'ACCESSING POLICE RECORDS...',
        'LOADING CASE FILES...',
        'REVIEWING EVIDENCE...',
        'CHECKING WITNESS STATEMENTS...',
        'CROSS-REFERENCING SUSPECTS...',
        'CASE FILE READY FOR REVIEW...'
      ],
      colors: {
        primary: '#e8e8e8',
        secondary: '#8B0000',
        background: '#0a0a0a',
        backgroundLight: '#1a1a1a',
        text: '#e8e8e8',
        accent: '#666666'
      },
      fonts: {
        main: 'Special Elite',
        accent: 'Courier Prime',
        import: fontImports.noir
      },
      effects: ['film-grain', 'typewriter', 'smoke', 'rain'],
      backgroundType: 'rain-window'
    },
    agents: {
      writer: 'PRIVATE_EYE',
      reader: 'CASE_REVIEWER',
      expert: 'CHIEF_DETECTIVE'
    },
    keywords: ['mystery', 'detective', 'crime', 'murder', 'investigation', 'noir', 'case']
  },
  
  scifi: {
    id: 'scifi',
    name: 'Stellar Chronicles',
    description: 'Chart courses through the cosmos',
    ui: {
      mainTitle: 'STELLAR CHRONICLES SYSTEM',
      tagline: 'EXPLORE. DISCOVER. TRANSCEND.',
      statusText: 'COMM LINK ESTABLISHED',
      bootMessages: [
        'INITIALIZING STELLAR NAVIGATION...',
        'CALIBRATING QUANTUM PROCESSORS...',
        'ESTABLISHING SUBSPACE LINK...',
        'LOADING STAR CHARTS...',
        'SYNCING WITH FLEET COMMAND...',
        'READY FOR DEEP SPACE OPERATIONS...'
      ],
      colors: {
        primary: '#00e5ff',
        secondary: '#7c4dff',
        background: '#000814',
        backgroundLight: '#001524',
        text: '#e0f7fa',
        accent: '#64ffda'
      },
      fonts: {
        main: 'Exo 2',
        accent: 'Space Mono',
        import: fontImports.scifi
      },
      effects: ['stars', 'hologram', 'pulse', 'warp'],
      backgroundType: 'starfield'
    },
    agents: {
      writer: 'SHIP_CHRONICLER',
      reader: 'MISSION_SPECIALIST',
      expert: 'FLEET_ADMIRAL'
    },
    keywords: ['space', 'alien', 'planet', 'star', 'galaxy', 'astronaut', 'cosmos']
  }
}

// Helper function to suggest theme based on story keywords
export function suggestTheme(storyDescription: string): string {
  const desc = storyDescription.toLowerCase()
  
  for (const [themeId, theme] of Object.entries(THEMES)) {
    for (const keyword of theme.keywords) {
      if (desc.includes(keyword)) {
        return themeId
      }
    }
  }
  
  return 'scp' // Default theme
}

// Get theme by ID with fallback
export function getTheme(themeId: string): StoryTheme {
  return THEMES[themeId] || THEMES.scp
}