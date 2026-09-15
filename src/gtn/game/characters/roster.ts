import type { CharacterDef } from './types'

/**
 * 10 original characters - same art direction/quality/world as each other
 * (futuristic techsuits with glowing accent lines, one shared body rig),
 * but each with a genuinely different hairstyle, palette, eye color, and
 * silhouette accessory rather than a single model just recolored 10 times.
 * Grouped here as girl/boy purely for the selection screen's two rows -
 * every character is selectable by anyone.
 */
export const CHARACTERS: CharacterDef[] = [
  {
    id: 'luna',
    name: 'Luna',
    emoji: '🌙',
    groupStyle: 'girl',
    tagline: 'נערה עתידנית ואמיצה',
    palette: { skin: 0xf0c9a0, hair: 0x6a4fd6, outfit: 0x14151c, outfitShade: 0x1d1f2b, glow: 0x4fc7ff, eye: 0x5fe0ff },
    hairStyle: 'long-flow',
    accessory: 'none',
  },
  {
    id: 'mia',
    name: 'Mia',
    emoji: '⚡',
    groupStyle: 'girl',
    tagline: 'ספורטיבית, זריזה ואנרגטית',
    palette: { skin: 0xe8b489, hair: 0xff8a3d, outfit: 0x121417, outfitShade: 0x1c8f8a, glow: 0x2fe0d0, eye: 0x3fbf6e },
    hairStyle: 'short-spiky',
    accessory: 'none',
    build: 0.94,
  },
  {
    id: 'nova',
    name: 'Nova',
    emoji: '⭐',
    groupStyle: 'girl',
    tagline: 'רובוטית-עתידנית ומסתורית',
    palette: { skin: 0xe3c7b0, hair: 0xc7ccd6, outfit: 0x1a1c24, outfitShade: 0x2b2140, glow: 0x9a5cff, eye: 0x4fa8ff },
    hairStyle: 'sleek-silver',
    accessory: 'none',
  },
  {
    id: 'sky',
    name: 'Sky',
    emoji: '🦋',
    groupStyle: 'girl',
    tagline: 'חופשייה, קלילה והרפתקנית',
    palette: { skin: 0xf2cda3, hair: 0x5fc2f2, outfit: 0x1c2430, outfitShade: 0x2a4658, glow: 0x63e0e6, eye: 0x4fd6e0 },
    hairStyle: 'wavy-shoulder',
    accessory: 'wings',
    build: 0.92,
  },
  {
    id: 'ruby',
    name: 'Ruby',
    emoji: '🔥',
    groupStyle: 'girl',
    tagline: 'חזקה, בטוחה ונחושה',
    palette: { skin: 0xd99a72, hair: 0xd62f3a, outfit: 0x121212, outfitShade: 0x2b1414, glow: 0xff4d4d, eye: 0xc98a3a },
    hairStyle: 'flame-cut',
    accessory: 'none',
    build: 1.04,
  },
  {
    id: 'axel',
    name: 'Axel',
    emoji: '⚡',
    groupStyle: 'boy',
    tagline: 'גיבור הרפתקאות עתידני',
    palette: { skin: 0xe0b088, hair: 0x14151a, outfit: 0x181a22, outfitShade: 0x1f2c4d, glow: 0x3d8bff, eye: 0x4fb0ff },
    hairStyle: 'swept-spiky',
    accessory: 'none',
  },
  {
    id: 'max',
    name: 'Max',
    emoji: '🏎️',
    groupStyle: 'boy',
    tagline: 'שייך למסלול, אוהב מהירות',
    palette: { skin: 0xecb98f, hair: 0x6b4326, outfit: 0x16171a, outfitShade: 0x7a1f1f, glow: 0xff4545, eye: 0x3a3a3a },
    hairStyle: 'short-crop',
    accessory: 'racing-stripe',
    build: 1.06,
  },
  {
    id: 'kai',
    name: 'Kai',
    emoji: '🌊',
    groupStyle: 'boy',
    tagline: 'שייך לים, לגלים ולהרפתקה',
    palette: { skin: 0xd99e72, hair: 0x121317, hairAccent: 0x2fa9e6, outfit: 0x14232c, outfitShade: 0x1c3b4a, glow: 0x33c2ff, eye: 0x3fa8ff },
    hairStyle: 'two-tone-tips',
    accessory: 'none',
  },
  {
    id: 'zayn',
    name: 'Zayn',
    emoji: '🥷',
    groupStyle: 'boy',
    tagline: 'זריז, מסתורי ובלתי צפוי',
    palette: { skin: 0xc98f66, hair: 0x0e0f12, outfit: 0x121212, outfitShade: 0x1a2130, glow: 0x3d8bff, eye: 0x3fe06a },
    hairStyle: 'tousled-wild',
    accessory: 'scarf',
    build: 0.93,
  },
  {
    id: 'leo',
    name: 'Leo',
    emoji: '🚀',
    groupStyle: 'boy',
    tagline: 'חוקר, סקרן ואמיץ',
    palette: { skin: 0xe4b78c, hair: 0x9a6a2f, outfit: 0x171a20, outfitShade: 0x33210f, glow: 0xff9a3d, eye: 0x4fa0ff },
    hairStyle: 'tousled-golden',
    accessory: 'strap',
  },
]

export const DEFAULT_CHARACTER_ID = 'axel'

export function getCharacterDef(id: string | null | undefined): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS.find((c) => c.id === DEFAULT_CHARACTER_ID) ?? CHARACTERS[0]
}
