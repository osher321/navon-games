/** Small curated color pools, picked deterministically by seed - this is the "no two houses look the same" lever: every interior template runs the exact same room-building code, just fed a different wall/floor/accent combo. */

export interface InteriorPalette {
  wall: number
  floor: number
  accent: number
}

export const HOUSE_PALETTES: InteriorPalette[] = [
  { wall: 0xf2ead9, floor: 0xc9a876, accent: 0x8a6a44 },
  { wall: 0xe8eef2, floor: 0xb8bcc2, accent: 0x3a5fd9 },
  { wall: 0xf2e3d0, floor: 0xd9c39a, accent: 0xd96a3a },
  { wall: 0xe6f2e8, floor: 0xc0d4c4, accent: 0x4a8f5c },
  { wall: 0xf5e8ee, floor: 0xd9c3cc, accent: 0xd9488f },
  { wall: 0xece6f2, floor: 0xc9c0d4, accent: 0x6b4fd6 },
  { wall: 0xf2f0e6, floor: 0xa89878, accent: 0x2c2c2c },
  { wall: 0xe8e8e8, floor: 0x9aa0a8, accent: 0x1c1c1c },
]

export function pickPalette(pool: InteriorPalette[], seed: number): InteriorPalette {
  return pool[Math.abs(seed) % pool.length]
}
