// Legacy interface for backward compatibility
export interface NameData {
  firstNames: string[]
  lastNames: string[]
  titles: string[]
}

// New gender-aware interface
export interface GenderAwareNameData {
  male: {
    names: string[]
    titles: string[]
  }
  female: {
    names: string[]
    titles: string[]
  }
  neutral: {
    names: string[]
    titles: string[]
  }
  lastNames: string[]
}

export const fantasyNames: GenderAwareNameData = {
  male: {
    names: [
      'Theron', 'Caelum', 'Darius', 'Gareth', 'Lysander', 'Aldric', 'Finn', 'Kael', 
      'Rowan', 'Tristan', 'Alaric', 'Cedric', 'Dorian', 'Evander', 'Griffin', 
      'Hadrian', 'Leander', 'Magnus', 'Orion', 'Percival', 'Quinlan', 'Rhys',
      'Soren', 'Tobias', 'Ulric', 'Varian', 'Wren', 'Xander', 'Yorick', 'Zephyr'
    ],
    titles: [
      // Male Noble Titles
      'Sir', 'Lord', 'Duke', 'Count', 'Baron', 'Prince', 'King',
      
      // Male Magical/Mystical Titles
      'Wizard', 'Enchanter', 'Archmage', 'Sage', 'Prophet', 'Mystic', 'Diviner',
      
      // Male Warrior/Military Titles
      'Knight', 'Paladin', 'Ranger', 'Guardian', 'Defender', 'Champion',
      'Warden', 'Sentinel', 'Captain', 'Commander', 'General',
      
      // Male Religious/Spiritual Titles
      'High Priest', 'Cleric', 'Druid', 'Archdruid', 'Elder', 'Monk', 'Abbot', 'Brother',
      
      // Male Scholarly/Artistic Titles
      'Scholar', 'Lorekeeper', 'Chronicler', 'Bard', 'Minstrel', 'Scribe',
      'Historian', 'Philosopher', 'Alchemist', 'Artificer'
    ]
  },

  female: {
    names: [
      'Elara', 'Lyandra', 'Seraphina', 'Nimue', 'Celeste', 'Aria', 'Brynn',
      'Cordelia', 'Delphine', 'Evangeline', 'Freya', 'Guinevere', 'Helena',
      'Isadora', 'Juliana', 'Kira', 'Luna', 'Morgana', 'Nyx', 'Ophelia',
      'Penelope', 'Quinn', 'Rosalind', 'Stella', 'Thalia', 'Una', 'Vera',
      'Willa', 'Xara', 'Yvaine', 'Zara'
    ],
    titles: [
      // Female Noble Titles
      'Lady', 'Dame', 'Duchess', 'Countess', 'Baroness', 'Princess', 'Queen',
      
      // Female Magical/Mystical Titles
      'Sorceress', 'Enchantress', 'Archmage', 'Sage', 'Oracle', 'Seer', 'Prophetess', 'Mystic', 'Diviner',
      
      // Female Warrior/Military Titles (gender-neutral in fantasy)
      'Knight', 'Paladin', 'Ranger', 'Guardian', 'Defender', 'Champion',
      'Warden', 'Sentinel', 'Captain', 'Commander', 'General',
      
      // Female Religious/Spiritual Titles
      'High Priestess', 'Priestess', 'Cleric', 'Druid', 'Archdruid', 'Elder', 'Mother Superior', 'Sister',
      
      // Female Scholarly/Artistic Titles
      'Scholar', 'Lorekeeper', 'Chronicler', 'Bard', 'Minstrel', 'Scribe',
      'Historian', 'Philosopher', 'Alchemist', 'Artificer'
    ]
  },

  neutral: {
    names: [
      'Sage', 'River', 'Phoenix', 'Ember', 'Storm', 'Vale', 'Ash', 'Raven',
      'Frost', 'Jade', 'Silver', 'Dawn', 'Sky', 'Rain'
    ],
    titles: [
      // Gender-neutral titles that work with any name
      'Mage', 'Sage', 'Elder', 'Scholar', 'Ranger', 'Guardian', 'Champion',
      'Lorekeeper', 'Chronicler', 'Bard', 'Historian', 'Alchemist', 'Artificer',
      'Druid', 'Mystic', 'Seer', 'Captain', 'Commander'
    ]
  },

  lastNames: [
    // Nature-Inspired
    'Moonwhisper', 'Stormwind', 'Brightblade', 'Shadowmere', 'Goldleaf',
    'Starweaver', 'Thornfield', 'Winterborn', 'Summergrace', 'Autumnfall',
    'Springheart', 'Nightshade', 'Dawnbreaker', 'Sunfire', 'Moonshadow',
    
    // Elemental
    'Flameheart', 'Frostborn', 'Stormcaller', 'Earthshaker', 'Windwalker',
    'Lightbringer', 'Darkbane', 'Ironforge', 'Silverstone', 'Goldenheart',
    
    // Mystical/Magical
    'Spellweaver', 'Runekeeper', 'Crystalborn', 'Dreamwalker', 'Soulguard',
    'Mindreader', 'Truthseer', 'Fatebinder', 'Timekeep', 'Voidwhisper',
    
    // Noble/Royal
    'Dragonsbane', 'Lionheart', 'Eaglewatch', 'Wolfborn', 'Bearheart',
    'Staghorn', 'Ravencrest', 'Foxglove', 'Hawkfeather', 'Swanmere',
    
    // Geographic/Locational
    'Rivendell', 'Mistwood', 'Blackwater', 'Redmount', 'Greenhaven',
    'Silverdale', 'Goldmeadow', 'Ironhill', 'Crystalfall', 'Starholm'
  ]
}

// Backward compatibility function for legacy NameData interface
export function getLegacyFantasyNames(): NameData {
  return {
    firstNames: [
      ...fantasyNames.male.names,
      ...fantasyNames.female.names,
      ...fantasyNames.neutral.names
    ],
    lastNames: fantasyNames.lastNames,
    titles: [
      ...fantasyNames.male.titles,
      ...fantasyNames.female.titles,
      ...fantasyNames.neutral.titles
    ]
  }
}