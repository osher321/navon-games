// Generates cover images for the 60 new stories added to expand the
// library (20 per language). Same technique as generate.mjs (procedural
// SVG -> WebP via Playwright screenshot) - 20 shared scene "themes" (one
// per story concept), each rendered 3x with a language-specific id and a
// small color/detail variation, since the 3 languages' new stories were
// deliberately written as parallel concept slots (see storiesHeExtra.ts /
// storiesEnExtra.ts / storiesEsExtra.ts).
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as K from './sceneKit.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const OUT_DIR = path.join(ROOT, 'public/images/stories')
mkdirSync(OUT_DIR, { recursive: true })

function wrap(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">${inner}</svg>`
}

// Each theme is a function(idx) -> svg inner string. `idx` (0/1/2) lets a
// theme vary hair/outfit colors slightly per language so the 3 versions
// don't look identical.
const PALETTES = [
  { skin: '#E8B98C', hair: '#3A2418', outfit: '#FF6FA0' },
  { skin: '#D6A97C', hair: '#1A1A1A', outfit: '#4FB0C9' },
  { skin: '#F0C49B', hair: '#4A3423', outfit: '#7226F5' },
]

const THEMES = {
  garden: (i) => {
    const p = PALETTES[i]
    return `
      ${K.sky('#8FE0C0', '#EAFBF2', 'g' + i)}
      ${K.sun(690, 90)}
      ${K.groundBand(400, 100, '#5FAE6F')}
      ${K.tree(120, 400, 1.1)}
      ${K.tree(670, 410, 0.9)}
      ${K.glowingFlower(300, 360, '#FF6FA0')}
      ${K.glowingFlower(360, 380, '#FFD23F')}
      ${K.glowingFlower(500, 370, '#7226F5')}
      ${K.owl(560, 320, 0.7)}
      ${K.character({ x: 400, y: 400, scale: 1.1, skin: p.skin, hair: p.hair, hairStyle: 'long', outfit: p.outfit, outfit2: '#2B2F45', pose: 'wave' })}
    `
  },
  lostPet: (i) => {
    const p = PALETTES[i]
    return `
      ${K.sky('#BFD8F0', '#EAF2FA', 'g' + i)}
      ${K.groundBand(400, 100, '#8a8f94')}
      ${K.houseShape(150, 400, 150, 170, '#D8DEE6', '#9AA0A6')}
      ${K.houseShape(620, 400, 150, 150, '#C7CFDA', '#7a828f')}
      ${i === 0 ? K.dog(430, 430, '#D6A25A') : K.kitten(430, 425)}
      ${K.character({ x: 340, y: 420, scale: 1.05, skin: p.skin, hair: p.hair, hairStyle: 'short', outfit: p.outfit, outfit2: '#1a1a2e', pose: 'walk' })}
    `
  },
  treasureGame: (i) => {
    const p = PALETTES[i]
    return `
      ${K.sky('#FFE3A0', '#FFF6E0', 'g' + i)}
      ${K.sun(700, 90)}
      ${K.groundBand(400, 100, '#8FBF6F')}
      ${K.tree(650, 400, 1.3, '#3f9e4f', '#7a5230')}
      ${K.giftBox(400, 410, '#8a6a3f', '#E0A637')}
      ${K.character({ x: 320, y: 420, scale: 1, skin: p.skin, hair: p.hair, hairStyle: 'short', outfit: p.outfit, outfit2: '#2B2F45', pose: 'sit' })}
      ${K.character({ x: 470, y: 420, scale: 1, skin: PALETTES[(i + 1) % 3].skin, hair: PALETTES[(i + 1) % 3].hair, hairStyle: 'long', outfit: '#FFD23F', outfit2: '#1a1a2e', pose: 'sit', flip: true })}
    `
  },
  spaceDream: (i) => {
    const p = PALETTES[i]
    return `
      ${K.sky('#3A2F5A', '#6B4A8A', 'g' + i)}
      ${K.stars(30)}
      ${K.groundBand(420, 80, '#2B2F45')}
      ${K.rocket(400, 300, 1.6, i === 1 ? '#4FB0C9' : '#D6392F')}
      ${K.character({ x: 260, y: 440, scale: 1.1, skin: p.skin, hair: p.hair, hairStyle: 'short', outfit: '#FFFFFF', outfit2: '#4FB0C9', pose: 'wave' })}
    `
  },
  detectiveClub: (i) => {
    const p = PALETTES[i]
    return `
      ${K.sky('#F0DDBF', '#FBF3E6', 'g' + i)}
      ${K.groundBand(420, 80, '#D8C9A0')}
      ${K.cake(400, 400, 0.9)}
      ${K.magnifyingGlass(300, 330, 1.3)}
      ${K.character({ x: 240, y: 430, scale: 0.9, skin: p.skin, hair: p.hair, hairStyle: 'long', outfit: '#4FB0C9', outfit2: '#2B2F45', pose: 'stand' })}
      ${K.character({ x: 470, y: 430, scale: 0.9, skin: PALETTES[(i + 2) % 3].skin, hair: PALETTES[(i + 2) % 3].hair, hairStyle: 'short', outfit: '#FFD23F', outfit2: '#1a1a2e', pose: 'stand', flip: true })}
    `
  },
  hauntedHouse: (i) => {
    const p = PALETTES[i]
    return `
      ${K.sky('#5F6F9A', '#9AA5C0', 'g' + i)}
      ${K.stars(14)}
      ${K.groundBand(420, 80, '#6a7480')}
      ${K.houseShape(400, 420, 240, 200, '#8a8f94', '#4a5460')}
      ${K.owl(430, 300, 1)}
      ${K.character({ x: 260, y: 440, scale: 1, skin: p.skin, hair: p.hair, hairStyle: 'short', outfit: '#7226F5', outfit2: '#2B2F45', pose: 'stand' })}
    `
  },
  campFriends: (i) => {
    const p = PALETTES[i]
    return `
      ${K.sky('#FFC080', '#FFE8C0', 'g' + i)}
      ${K.sun(690, 100, 44, '#FF9F4F')}
      ${K.mountainRange(330, '#5a8fae', '#7fb0cf')}
      ${K.groundBand(420, 80, '#5a8f4f')}
      ${K.campTent(280, 420, 1)}
      ${K.tree(600, 420, 1)}
      ${K.character({ x: 420, y: 440, scale: 0.95, skin: p.skin, hair: p.hair, hairStyle: 'long', outfit: '#4FB0C9', outfit2: '#2B2F45', pose: 'wave' })}
    `
  },
  robotFriend: (i) => {
    const p = PALETTES[i]
    return `
      ${K.sky('#E8D9BF', '#F7F0E2', 'g' + i)}
      ${K.groundBand(420, 80, '#D8C9A0')}
      ${K.robotChar(460, 420, 1.4, i === 0 ? '#4FB0C9' : i === 1 ? '#7226F5' : '#3FAE55')}
      ${K.character({ x: 320, y: 430, scale: 1, skin: p.skin, hair: p.hair, hairStyle: 'short', outfit: '#FFD23F', outfit2: '#2B2F45', pose: 'wave' })}
    `
  },
  castleSecret: (i) => {
    const p = PALETTES[i]
    return `
      ${K.sky('#F0B980', '#FCE3C0', 'g' + i)}
      ${K.sun(680, 110, 40, '#FF9F4F')}
      ${K.groundBand(420, 80, '#8a8f94')}
      ${K.castle(400, 420, 1)}
      ${K.character({ x: 220, y: 440, scale: 0.85, skin: p.skin, hair: p.hair, hairStyle: 'long', outfit: '#D6392F', outfit2: '#2B2F45', pose: 'stand' })}
      ${K.character({ x: 280, y: 445, scale: 0.8, skin: PALETTES[(i + 1) % 3].skin, hair: PALETTES[(i + 1) % 3].hair, hairStyle: 'short', outfit: '#4FB0C9', outfit2: '#1a1a2e', pose: 'stand' })}
    `
  },
  timePortal: (i) => {
    const p = PALETTES[i]
    return `
      ${K.sky('#3A2F5A', '#6B4A8A', 'g' + i)}
      ${K.portalSwirl(400, 260, 130, i === 0 ? '#7226F5' : i === 1 ? '#4FB0C9' : '#FF6FA0')}
      ${K.groundBand(420, 80, '#2B2F45')}
      ${K.oldClock(400, 220, 1.3)}
      ${K.character({ x: 400, y: 400, scale: 1, skin: p.skin, hair: p.hair, hairStyle: 'short', outfit: '#FFD23F', outfit2: '#2B2F45', pose: 'stand' })}
    `
  },
  schoolMystery: (i) => {
    const p = PALETTES[i]
    return `
      ${K.sky('#E8D9BF', '#F7F0E2', 'g' + i)}
      ${K.groundBand(420, 80, '#C9B48A')}
      ${K.bookShelf(100, 260, 150, 140)}
      ${K.trophy(430, 380, 1.4)}
      ${K.magnifyingGlass(520, 330, 1.1)}
      ${K.character({ x: 340, y: 430, scale: 1, skin: p.skin, hair: p.hair, hairStyle: 'long', outfit: '#7226F5', outfit2: '#2B2F45', pose: 'stand' })}
    `
  },
  firstCrush: (i) => {
    const p = PALETTES[i]
    const q = PALETTES[(i + 1) % 3]
    return `
      ${K.sky('#F7D9E8', '#FDEEF5', 'g' + i)}
      ${K.groundBand(420, 80, '#E8C9A0')}
      ${K.glowingFlower(400, 300, '#FF6FA0')}
      ${K.character({ x: 330, y: 430, scale: 1, skin: p.skin, hair: p.hair, hairStyle: 'long', outfit: '#FF6FA0', outfit2: '#2B2F45', pose: 'wave' })}
      ${K.character({ x: 470, y: 430, scale: 1, skin: q.skin, hair: q.hair, hairStyle: 'short', outfit: '#4FB0C9', outfit2: '#1a1a2e', pose: 'stand', flip: true })}
    `
  },
  stormSea: (i) => `
      ${K.sky('#3F4A6B', '#7A6A9F', 'g' + i)}
      ${K.stormClouds(80)}
      ${K.wave('#1FA8C9', 340)}
      ${K.wave('#2FB6D6', 380, 0.9)}
      ${K.rain(24)}
      ${K.fishingBoat(400, 330, 1.2)}
    `,
  cityChase: (i) => {
    const p = PALETTES[i]
    return `
      ${K.sky('#3A4A6B', '#5F6F9A', 'g' + i)}
      ${K.groundBand(420, 80, '#6a7480')}
      ${K.houseShape(160, 420, 130, 220, '#9AA0A6', '#4a5460')}
      ${K.houseShape(340, 420, 120, 270, '#8a8f94', '#3f4650')}
      ${K.houseShape(540, 420, 140, 200, '#9AA0A6', '#4a5460')}
      ${K.newspaper(660, 440, 1.3)}
      ${K.character({ x: 420, y: 440, scale: 1.1, skin: p.skin, hair: p.hair, hairStyle: 'long', outfit: '#D6392F', outfit2: '#1a1a2e', pose: 'run' })}
    `
  },
  forestSurvival: (i) => {
    const p = PALETTES[i]
    return `
      ${K.sky('#FFB870', '#FFE3B0', 'g' + i)}
      ${K.sun(700, 100, 40, '#FF9F4F')}
      ${K.mountainRange(320, '#7a6a9f', '#9a8ac0')}
      ${K.groundBand(420, 80, '#5a8f4f')}
      ${K.tree(230, 420, 1)}
      ${K.tree(300, 430, 0.8)}
      ${K.tree(600, 420, 1.1)}
      ${K.character({ x: 420, y: 445, scale: 1, skin: p.skin, hair: p.hair, hairStyle: 'short', outfit: '#3FAE55', outfit2: '#2B2F45', pose: 'sit' })}
    `
  },
  oldLetter: (i) => {
    const p = PALETTES[i]
    return `
      ${K.sky('#E8D9BF', '#F7F0E2', 'g' + i)}
      ${K.groundBand(420, 80, '#C9B48A')}
      ${K.bookShelf(500, 260, 150, 140)}
      ${K.envelope(340, 330, 1.6)}
      ${K.character({ x: 260, y: 430, scale: 1, skin: p.skin, hair: p.hair, hairStyle: 'bun', outfit: '#FF6FA0', outfit2: '#2B2F45', pose: 'sit' })}
    `
  },
  detectiveNoir: (i) => `
      ${K.sky('#2A2440', '#4A3A5A', 'g' + i)}
      ${K.stars(16)}
      ${K.fogOverlay(0.28)}
      ${K.groundBand(420, 80, '#3f4650')}
      ${K.fishingBoat(620, 380, 0.8, '#7a828f')}
      ${K.houseShape(180, 420, 160, 230, '#3f4650', '#1a1a2e')}
      ${K.character({ x: 380, y: 440, scale: 1.15, skin: '#D6A97C', hair: '#1A1A1A', hairStyle: 'short', outfit: '#3f4650', outfit2: '#1a1a2e', pose: 'stand' })}
    `,
  spaceMission: (i) => `
      ${K.sky('#0F1030', '#2A2050', 'g' + i)}
      ${K.stars(40)}
      ${K.rocket(400, 260, 1.8, i === 1 ? '#4FB0C9' : '#E0A637')}
      ${K.character({ x: 560, y: 420, scale: 1, skin: '#E8B98C', hair: '#3A2418', hairStyle: 'short', outfit: '#FFFFFF', outfit2: '#4FB0C9', pose: 'wave' })}
    `,
  cursedCastle: (i) => `
      ${K.sky('#4A3A5A', '#7A6A9F', 'g' + i)}
      ${K.mountainRange(340, '#5a4a70', '#7a6a9f')}
      ${K.groundBand(420, 80, '#5a4a70')}
      ${K.castle(400, 420, 1, '#7a828f')}
      ${K.fogOverlay(0.22)}
      ${K.sword(310, 440, 1.1)}
      ${K.character({ x: 250, y: 440, scale: 1, skin: '#D6A97C', hair: '#1A1A1A', hairStyle: 'short', outfit: '#8a8f94', outfit2: '#1a1a2e', pose: 'stand' })}
    `,
  reunion: (i) => {
    const p = PALETTES[i]
    const q = PALETTES[(i + 2) % 3]
    return `
      ${K.sky('#FFB870', '#FFE3B0', 'g' + i)}
      ${K.sun(650, 140, 50, '#FF9F4F')}
      ${K.groundBand(420, 80, '#C9B48A')}
      ${K.cafeAwning(400, 300, 220, '#7226F5')}
      ${K.character({ x: 340, y: 420, scale: 1, skin: p.skin, hair: p.hair, hairStyle: 'short', outfit: '#4FB0C9', outfit2: '#1a1a2e', pose: 'sit' })}
      ${K.character({ x: 460, y: 420, scale: 1, skin: q.skin, hair: q.hair, hairStyle: 'long', outfit: '#FF6FA0', outfit2: '#2B2F45', pose: 'sit', flip: true })}
    `
  },
}

// theme -> [heId, enId, esId]
const ID_MAP = [
  ['story-he-magic-forest', 'story-enchanted-garden', 'story-es-jardin-encantado', 'garden'],
  ['story-he-lost-puppy', 'story-missing-kitten', 'story-es-gatito-perdido', 'lostPet'],
  ['story-he-pirate-game', 'story-treasure-map-game', 'story-es-mapa-tesoro', 'treasureGame'],
  ['story-he-space-dream', 'story-astronaut-day', 'story-es-dia-astronauta', 'spaceDream'],
  ['story-he-detective-club', 'story-cookie-detectives', 'story-es-club-detectives', 'detectiveClub'],
  ['story-he-haunted-house', 'story-empty-house', 'story-es-casa-vacia', 'hauntedHouse'],
  ['story-he-summer-camp', 'story-camp-friends', 'story-es-campamento', 'campFriends'],
  ['story-he-robot-friend', 'story-tiny-robot', 'story-es-robot-pequeno', 'robotFriend'],
  ['story-he-castle-secret', 'story-castle-clue', 'story-es-pista-castillo', 'castleSecret'],
  ['story-he-time-portal', 'story-clock-that-travels', 'story-es-reloj-viajero', 'timePortal'],
  ['story-he-school-mystery', 'story-school-theft', 'story-es-robo-escuela', 'schoolMystery'],
  ['story-he-first-crush', 'story-new-kid-feelings', 'story-es-primer-amor', 'firstCrush'],
  ['story-he-storm-sea', 'story-ocean-storm', 'story-es-tormenta-mar', 'stormSea'],
  ['story-he-city-chase', 'story-reporter-chase', 'story-es-persecucion-reportera', 'cityChase'],
  ['story-he-forest-survival', 'story-stranded-in-woods', 'story-es-perdido-bosque', 'forestSurvival'],
  ['story-he-mystery-letter', 'story-old-letter-secret', 'story-es-carta-secreta', 'oldLetter'],
  ['story-he-detective-noir', 'story-harbor-detective', 'story-es-detective-puerto', 'detectiveNoir'],
  ['story-he-space-mission', 'story-mars-mission', 'story-es-mision-marte', 'spaceMission'],
  ['story-he-castle-fantasy', 'story-cursed-castle', 'story-es-castillo-maldito', 'cursedCastle'],
  ['story-he-second-chance', 'story-reunion', 'story-es-reencuentro', 'reunion'],
]

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } })

  let ok = 0
  const total = ID_MAP.length * 3
  for (const [heId, enId, esId, themeKey] of ID_MAP) {
    const ids = [heId, enId, esId]
    for (let i = 0; i < 3; i++) {
      const svg = wrap(THEMES[themeKey](i))
      const html = `<!doctype html><html><head><style>*{margin:0;padding:0}body{width:800px;height:500px}</style></head><body>${svg}</body></html>`
      await page.setContent(html)
      await page.waitForTimeout(20)
      const outPath = path.join(OUT_DIR, `${ids[i]}.webp`)
      await page.screenshot({ path: outPath, type: 'webp', quality: 90 })
      ok++
      console.log(`  ${ids[i]}.webp`)
    }
  }

  await browser.close()
  console.log(`\nGenerated ${ok}/${total} new story images -> ${OUT_DIR}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
