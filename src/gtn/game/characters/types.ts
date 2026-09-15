/** A grouping label only (for the two rows on the selection screen) - never used to gate which characters a player can pick, per the explicit requirement that the choice is open to everyone. */
export type CharacterGroupStyle = 'girl' | 'boy'

export type HairStyle =
  | 'long-flow'
  | 'short-spiky'
  | 'sleek-silver'
  | 'wavy-shoulder'
  | 'flame-cut'
  | 'swept-spiky'
  | 'short-crop'
  | 'two-tone-tips'
  | 'tousled-wild'
  | 'tousled-golden'

export type CharacterAccessory = 'wings' | 'scarf' | 'racing-stripe' | 'strap' | 'none'

export interface CharacterPalette {
  skin: number
  hair: number
  /** Only used by the two-tone-tips hairstyle (Kai) - the color of the strand tips. */
  hairAccent?: number
  outfit: number
  outfitShade: number
  /** The glowing accent-line color every character has somewhere on their techsuit. */
  glow: number
  eye: number
}

export interface CharacterDef {
  id: string
  name: string
  emoji: string
  groupStyle: CharacterGroupStyle
  tagline: string
  palette: CharacterPalette
  hairStyle: HairStyle
  accessory: CharacterAccessory
  /** Sleeker/leaner (~0.9) vs sturdier (~1.08) torso/limb width multiplier for silhouette variety - applied to geometry dimensions only, never to the rig hierarchy, so HIP_HEIGHT-based positioning (vehicle seats, parachute drops) stays exact regardless of build. */
  build?: number
}
