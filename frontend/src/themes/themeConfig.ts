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

export interface FormConfig {
  headerTitle: string
  statusLine1: string
  statusLine2: string
  descriptionLabel: string
  descriptionPlaceholder: string
  examplePrompts: string[]
  lengthLabel: string
  submitButtonText: string
  completedHeader: {
    title: string
    subtitle: string
    classification1?: string
    classification2?: string
  }
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
  
  // Form configuration
  formConfig: FormConfig
  
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
    formConfig: {
      headerTitle: 'ANOMALY GENERATION PARAMETERS',
      statusLine1: 'DESIGNATION: SCP-[PENDING]',
      statusLine2: 'CLASSIFICATION: [PENDING]',
      descriptionLabel: 'ANOMALY DESCRIPTION',
      descriptionPlaceholder: 'Describe the anomalous object/entity...',
      examplePrompts: [
        'A mirror that shows your greatest fear',
        'A door that opens to alternate realities',
        'A phone booth that calls the dead',
        'A painting that ages instead of its owner',
        'An elevator that goes to floors that don\'t exist'
      ],
      lengthLabel: 'Document Length',
      submitButtonText: 'INITIATE GENERATION',
      completedHeader: {
        title: 'SCP FOUNDATION',
        subtitle: 'SECURE. CONTAIN. PROTECT.',
        classification1: 'Item #: SCP-XXXX',
        classification2: 'Object Class: [PENDING]'
      }
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
    formConfig: {
      headerTitle: 'TALE CREATION ENCHANTMENT',
      statusLine1: 'TALE NAME: [AWAITING INSPIRATION]',
      statusLine2: 'GENRE: FANTASY ADVENTURE',
      descriptionLabel: 'TALE PREMISE',
      descriptionPlaceholder: 'What magical tale shall we weave today...',
      examplePrompts: [
        'A sword that chooses its wielder based on their dreams',
        'A forest where time flows backward',
        'A dragon who collects stories instead of gold',
        'A magic school hidden in a thundercloud',
        'A map that draws itself as you explore'
      ],
      lengthLabel: 'Tale Length',
      submitButtonText: 'BEGIN THE TALE',
      completedHeader: {
        title: 'ENCHANTED TALES',
        subtitle: 'A MAGICAL STORY'
      }
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
    formConfig: {
      headerTitle: 'DATA STREAM INITIALIZATION',
      statusLine1: 'RUN_ID: [GENERATING]',
      statusLine2: 'SECURITY: ENCRYPTED',
      descriptionLabel: 'MISSION PARAMETERS',
      descriptionPlaceholder: 'Input your run parameters, choom...',
      examplePrompts: [
        'A neural implant that stores deleted memories',
        'A virus that makes AIs dream',
        'A black market for stolen identities',
        'A corpo tower that exists only in VR',
        'A ghost in the machine seeking revenge'
      ],
      lengthLabel: 'Data Stream Length',
      submitButtonText: 'JACK IN',
      completedHeader: {
        title: 'NEURAL NETWORK',
        subtitle: 'DATA STREAM COMPLETE'
      }
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
    formConfig: {
      headerTitle: 'LOVE STORY CREATION',
      statusLine1: 'STORY TITLE: [AWAITING MUSE]',
      statusLine2: 'GENRE: CONTEMPORARY ROMANCE',
      descriptionLabel: 'LOVE STORY PREMISE',
      descriptionPlaceholder: 'Tell me about the hearts that will meet...',
      examplePrompts: [
        'Two souls connected across time and distance',
        'A bookshop where love letters mysteriously appear',
        'Enemies forced to plan a wedding together',
        'A dating app that matches based on dreams',
        'Second chances at a high school reunion'
      ],
      lengthLabel: 'Story Length',
      submitButtonText: 'WRITE OUR LOVE STORY',
      completedHeader: {
        title: 'HEARTS & LETTERS',
        subtitle: 'A LOVE STORY'
      }
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
    formConfig: {
      headerTitle: 'CASE FILE INTAKE',
      statusLine1: 'CASE #: [UNASSIGNED]',
      statusLine2: 'STATUS: OPEN INVESTIGATION',
      descriptionLabel: 'CASE DETAILS',
      descriptionPlaceholder: 'Give me the facts, just the facts...',
      examplePrompts: [
        'A dame walks in with a secret that could topple the city',
        'A photograph that reveals more with each viewing',
        'The last honest cop in a crooked precinct',
        'A jazz musician who plays clues in his solos',
        'A missing person who was never there'
      ],
      lengthLabel: 'Case File Length',
      submitButtonText: 'OPEN CASE FILE',
      completedHeader: {
        title: 'CASE CLOSED',
        subtitle: 'INVESTIGATION COMPLETE'
      }
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
    formConfig: {
      headerTitle: 'MISSION BRIEFING PROTOCOL',
      statusLine1: 'MISSION ID: [GENERATING]',
      statusLine2: 'SECTOR: UNCHARTED',
      descriptionLabel: 'MISSION PARAMETERS',
      descriptionPlaceholder: 'Describe your mission into the unknown...',
      examplePrompts: [
        'A signal from a ship that hasn\'t launched yet',
        'A planet where the laws of physics work differently',
        'First contact with a species that communicates through color',
        'A wormhole that leads to parallel universes',
        'An AI that discovers the meaning of consciousness'
      ],
      lengthLabel: 'Mission Log Length',
      submitButtonText: 'LAUNCH MISSION',
      completedHeader: {
        title: 'STELLAR CHRONICLES',
        subtitle: 'MISSION LOG COMPLETE'
      }
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