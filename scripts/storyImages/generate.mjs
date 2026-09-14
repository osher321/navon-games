// Generates one unique 800x500 WebP cover illustration per story (30
// total), composed from scripts/storyImages/sceneKit.mjs's shared shape
// library so every image reads as the same illustrated series while
// depicting that specific story's own characters/setting/key moment -
// verified against each story's actual title/description/opening lines
// before writing its scene, not guessed from the title alone.
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

const SCENES = {
  // ===== English =====
  'story-beach': () => `
    ${K.sky('#8FD6FF', '#E8F7FF', 'g1')}
    ${K.sun(690, 90)}
    ${K.cloud(140, 80, 1)}
    ${K.wave('#1FA8C9', 340)}
    ${K.wave('#2FB6D6', 370, 0.9)}
    ${K.groundBand(390, 110, '#F2DCA0')}
    ${K.palmTree(120, 390, 1.1)}
    ${K.palmTree(660, 400, 0.9)}
    ${K.character({ x: 340, y: 410, scale: 1.15, skin: '#E8B98C', hair: '#3A2418', hairStyle: 'long', outfit: '#FF6FA0', outfit2: '#2B2F45', pose: 'wave' })}
    ${K.character({ x: 420, y: 420, scale: 1.0, skin: '#E0AC7C', hair: '#241A12', hairStyle: 'short', outfit: '#3FAE55', outfit2: '#2B2F45', pose: 'stand', flip: true })}
  `,
  'story-new-job': () => `
    ${K.sky('#BFD8F0', '#EAF2FA', 'g2')}
    ${K.groundBand(420, 80, '#D8DEE6')}
    ${K.houseShape(180, 420, 150, 180, '#C7CFDA', '#9AA0A6')}
    ${K.houseShape(400, 420, 170, 220, '#DFE6EE', '#B9C2CF')}
    ${K.houseShape(640, 420, 150, 160, '#C7CFDA', '#9AA0A6')}
    ${K.character({ x: 400, y: 430, scale: 1.2, skin: '#D6A97C', hair: '#1A1A1A', hairStyle: 'short', outfit: '#2F6FD6', outfit2: '#1a1a2e', pose: 'wave' })}
    ${K.suitcase(470, 440, '#7226F5')}
  `,
  'story-london-trip': () => `
    ${K.sky('#9FC3E8', '#E3EFF9', 'g3')}
    ${K.cloud(120, 70, 1)}
    ${K.cloud(650, 100, 0.8)}
    ${K.groundBand(420, 80, '#8a8f94')}
    <rect x="360" y="150" width="30" height="270" fill="#5a6470" />
    <rect x="345" y="130" width="60" height="26" rx="4" fill="#3f4650" />
    <circle cx="375" cy="120" r="16" fill="none" stroke="#FFD23F" stroke-width="4" />
    ${K.houseShape(150, 420, 130, 160, '#C7CFDA', '#7a828f')}
    ${K.houseShape(620, 420, 140, 190, '#DFE6EE', '#9AA0A6')}
    ${K.character({ x: 250, y: 430, scale: 1.15, skin: '#F0C49B', hair: '#6B3F1D', hairStyle: 'long', outfit: '#D6392F', outfit2: '#1a1a2e', pose: 'stand' })}
    ${K.suitcase(300, 448, '#2F6FD6')}
  `,
  'story-lost-phone': () => `
    ${K.sky('#C9D6E8', '#EFF3F8', 'g4')}
    ${K.trainShape(400, 260, '#7226F5', 1.3)}
    ${K.groundBand(400, 100, '#8a8f94')}
    <rect x="0" y="480" width="800" height="6" fill="#3f4650" />
    ${K.phoneProp(400, 250)}
    ${K.character({ x: 620, y: 420, scale: 1.1, skin: '#E8B98C', hair: '#241A12', hairStyle: 'short', outfit: '#3FAE55', outfit2: '#2B2F45', pose: 'walk' })}
  `,
  'story-surprise-birthday': () => `
    ${K.sky('#F7D9E8', '#FDEEF5', 'g5')}
    ${K.groundBand(420, 80, '#E8C9A0')}
    ${K.balloon(200, 140, '#FF6FA0')}
    ${K.balloon(250, 110, '#FFD23F')}
    ${K.balloon(560, 130, '#4FD0FF')}
    ${K.balloon(610, 100, '#7226F5')}
    ${K.cake(400, 400, 1.3)}
    ${K.character({ x: 300, y: 420, scale: 1.05, skin: '#F0C49B', hair: '#4A3423', hairStyle: 'long', outfit: '#7226F5', outfit2: '#2B2F45', pose: 'wave' })}
    ${K.character({ x: 500, y: 420, scale: 1.05, skin: '#D6A97C', hair: '#1A1A1A', hairStyle: 'short', outfit: '#FFD23F', outfit2: '#1a1a2e', pose: 'stand', flip: true })}
  `,
  'story-small-cafe': () => `
    ${K.sky('#F0DDBF', '#FBF3E6', 'g6')}
    ${K.groundBand(420, 80, '#C9B48A')}
    ${K.houseShape(400, 420, 260, 200, '#F2E3C9', '#D6552F')}
    ${K.cafeAwning(400, 300, 220, '#D6552F')}
    <rect x="330" y="330" width="30" height="60" fill="#7a5230" />
    <rect x="440" y="330" width="30" height="60" fill="#7a5230" />
    ${K.character({ x: 250, y: 430, scale: 1, skin: '#E0AC7C', hair: '#241A12', hairStyle: 'short', outfit: '#3FAE55', outfit2: '#1a1a2e', pose: 'stand' })}
    ${K.character({ x: 560, y: 430, scale: 1, skin: '#F0C49B', hair: '#6B3F1D', hairStyle: 'bun', outfit: '#FF6FA0', outfit2: '#2B2F45', pose: 'wave' })}
  `,
  'story-city-walk': () => `
    ${K.sky('#F0B980', '#FCE3C0', 'g7')}
    ${K.sun(680, 130, 50, '#FF9F4F')}
    ${K.groundBand(420, 80, '#8a8f94')}
    ${K.houseShape(150, 420, 140, 210, '#D8DEE6', '#7a828f')}
    ${K.houseShape(340, 420, 130, 260, '#C7CFDA', '#9AA0A6')}
    ${K.houseShape(540, 420, 150, 190, '#DFE6EE', '#8a8f94')}
    ${K.character({ x: 420, y: 430, scale: 1.2, skin: '#D6A97C', hair: '#1A1A1A', hairStyle: 'short', outfit: '#4FB0C9', outfit2: '#1a1a2e', pose: 'walk' })}
  `,
  'story-new-neighbor': () => `
    ${K.sky('#BFE3D0', '#EAF7EF', 'g8')}
    ${K.groundBand(420, 80, '#8FBF6F')}
    ${K.houseShape(250, 420, 190, 190, '#F2E3C9', '#D6552F')}
    ${K.houseShape(560, 420, 190, 190, '#E8C9A0', '#4FB0C9')}
    <rect x="500" y="440" width="34" height="26" fill="#8a6a3f" />
    <rect x="540" y="445" width="30" height="24" fill="#a97e4f" />
    ${K.character({ x: 330, y: 440, scale: 1.05, skin: '#F0C49B', hair: '#4A3423', hairStyle: 'long', outfit: '#FFD23F', outfit2: '#2B2F45', pose: 'wave' })}
    ${K.character({ x: 500, y: 440, scale: 1.05, skin: '#8a5a2f', hair: '#1A1A1A', hairStyle: 'long', outfit: '#7226F5', outfit2: '#1a1a2e', pose: 'stand', flip: true })}
  `,
  'story-weekend-adventure': () => `
    ${K.sky('#FFB870', '#FFE3B0', 'g9')}
    ${K.sun(400, 110, 44, '#FF9F4F')}
    ${K.mountainRange(360, '#7a6a9f', '#9a8ac0')}
    ${K.groundBand(420, 80, '#5a8f4f')}
    <path d="M330,430 L370,390 L410,430 Z" fill="#D6552F" />
    <path d="M420,430 L455,398 L490,430 Z" fill="#E0A637" />
    ${K.tree(230, 430, 0.9)}
    ${K.tree(600, 430, 1.0)}
    ${K.character({ x: 300, y: 450, scale: 1, skin: '#E0AC7C', hair: '#241A12', hairStyle: 'short', outfit: '#3FAE55', outfit2: '#2B2F45', pose: 'sit' })}
  `,
  'story-helpful-stranger': () => `
    ${K.sky('#3F4A6B', '#7A6A9F', 'g10')}
    ${K.stars(30)}
    ${K.groundBand(420, 80, '#3f4650')}
    ${K.carShape(280, 430, '#D6392F', 1.1)}
    ${K.character({ x: 280, y: 400, scale: 0.95, skin: '#F0C49B', hair: '#6B3F1D', hairStyle: 'long', outfit: '#7226F5', outfit2: '#1a1a2e', pose: 'stand' })}
    ${K.character({ x: 480, y: 430, scale: 1.05, skin: '#8a5a2f', hair: '#1A1A1A', hairStyle: 'short', outfit: '#4FB0C9', outfit2: '#2B2F45', pose: 'wave', flip: true })}
  `,

  // ===== Spanish =====
  'story-es-mercado': () => `
    ${K.sky('#FFE3A0', '#FFF6E0', 'g11')}
    ${K.sun(700, 90)}
    ${K.groundBand(420, 80, '#C9B48A')}
    ${K.marketStall(220, 400, '#D6552F')}
    ${K.marketStall(420, 400, '#3FAE55')}
    ${K.marketStall(600, 400, '#2F6FD6')}
    ${K.character({ x: 340, y: 440, scale: 1.05, skin: '#E8B98C', hair: '#3A2418', hairStyle: 'long', outfit: '#FF6FA0', outfit2: '#2B2F45', pose: 'stand' })}
  `,
  'story-es-lluvia': () => `
    ${K.sky('#8B98A8', '#C4CFDA', 'g12')}
    ${K.cloud(180, 80, 1.3, '#9AA5B2', 1)}
    ${K.cloud(560, 60, 1.1, '#9AA5B2', 1)}
    <line x1="120" y1="140" x2="100" y2="190" stroke="#bfe8ff" stroke-width="3" opacity="0.7" />
    <line x1="200" y1="150" x2="180" y2="200" stroke="#bfe8ff" stroke-width="3" opacity="0.7" />
    <line x1="600" y1="130" x2="580" y2="180" stroke="#bfe8ff" stroke-width="3" opacity="0.7" />
    ${K.groundBand(420, 80, '#6a7480')}
    ${K.houseShape(400, 420, 220, 200, '#D8C9A0', '#8a5a2f')}
    <rect x="350" y="280" width="100" height="80" fill="#4A3423" />
    <rect x="360" y="290" width="80" height="60" fill="#FFD23F" opacity="0.85" />
    ${K.dog(320, 440, '#D6A25A')}
  `,
  'story-es-quince': () => `
    ${K.sky('#F0BFE0', '#FDEBF6', 'g13')}
    ${K.groundBand(420, 80, '#E8C9A0')}
    ${K.balloon(180, 120, '#7226F5')}
    ${K.balloon(230, 90, '#FF6FA0')}
    ${K.balloon(580, 110, '#FFD23F')}
    ${K.cake(400, 400, 1.4)}
    ${K.character({ x: 400, y: 300, scale: 1.15, skin: '#E8B98C', hair: '#3A2418', hairStyle: 'long', outfit: '#F7C9DE', outfit2: '#F7C9DE', pose: 'wave' })}
  `,
  'story-es-futbol': () => `
    ${K.sky('#3A4A6B', '#5F6F9A', 'g14')}
    ${K.stars(16)}
    <circle cx="150" cy="90" r="60" fill="#FFD23F" opacity="0.25" />
    <circle cx="650" cy="90" r="60" fill="#FFD23F" opacity="0.25" />
    ${K.groundBand(420, 80, '#3FAE55')}
    <rect x="0" y="420" width="800" height="4" fill="#FFFFFF" opacity="0.6" />
    ${K.character({ x: 320, y: 440, scale: 1, skin: '#D6A97C', hair: '#1A1A1A', hairStyle: 'short', outfit: '#D6392F', outfit2: '#FFFFFF', pose: 'run' })}
    ${K.character({ x: 470, y: 440, scale: 1, skin: '#8a5a2f', hair: '#1A1A1A', hairStyle: 'short', outfit: '#2F6FD6', outfit2: '#FFFFFF', pose: 'run', flip: true })}
    ${K.soccerBall(400, 455, 13)}
  `,
  'story-es-restaurante': () => `
    ${K.sky('#F0D9B8', '#FBF0DE', 'g15')}
    ${K.groundBand(420, 80, '#C9B48A')}
    ${K.houseShape(400, 420, 280, 200, '#F2E3C9', '#7226F5')}
    ${K.cafeAwning(400, 300, 240, '#7226F5')}
    <rect x="360" y="380" width="80" height="10" fill="#8a6a3f" />
    ${K.character({ x: 340, y: 410, scale: 0.95, skin: '#F0C49B', hair: '#6B3F1D', hairStyle: 'long', outfit: '#FF6FA0', outfit2: '#2B2F45', pose: 'sit' })}
    ${K.character({ x: 460, y: 410, scale: 0.95, skin: '#D6A97C', hair: '#1A1A1A', hairStyle: 'short', outfit: '#4FB0C9', outfit2: '#1a1a2e', pose: 'sit', flip: true })}
  `,
  'story-es-tren': () => `
    ${K.sky('#9FC3E8', '#E3EFF9', 'g16')}
    ${K.cloud(140, 80, 1)}
    ${K.trainShape(400, 260, '#2F6FD6', 1.4)}
    ${K.groundBand(400, 100, '#8a8f94')}
    <rect x="0" y="480" width="800" height="6" fill="#3f4650" />
    ${K.character({ x: 330, y: 250, scale: 0.7, skin: '#E8B98C', hair: '#3A2418', hairStyle: 'long', outfit: '#FF6FA0', outfit2: '#2B2F45', pose: 'sit' })}
    ${K.character({ x: 470, y: 250, scale: 0.7, skin: '#D6A97C', hair: '#1A1A1A', hairStyle: 'short', outfit: '#3FAE55', outfit2: '#1a1a2e', pose: 'sit', flip: true })}
  `,
  'story-es-biblioteca': () => `
    ${K.sky('#E8D9BF', '#F7F0E2', 'g17')}
    ${K.groundBand(420, 80, '#C9B48A')}
    ${K.bookShelf(120, 260, 160, 140)}
    ${K.bookShelf(520, 260, 160, 140)}
    ${K.character({ x: 400, y: 430, scale: 1.05, skin: '#8a5a2f', hair: '#1A1A1A', hairStyle: 'bun', outfit: '#E0A637', outfit2: '#2B2F45', pose: 'sit' })}
  `,
  'story-es-cocina': () => `
    ${K.sky('#F7E3C0', '#FDF5E8', 'g18')}
    ${K.groundBand(420, 80, '#D8C9A0')}
    <rect x="260" y="330" width="280" height="90" rx="8" fill="#E8C9A0" />
    <circle cx="330" cy="330" r="26" fill="#3f4650" />
    <circle cx="470" cy="330" r="26" fill="#3f4650" />
    <ellipse cx="330" cy="322" rx="20" ry="7" fill="#D6552F" />
    ${K.character({ x: 400, y: 430, scale: 1.1, skin: '#E8B98C', hair: '#3A2418', hairStyle: 'bun', outfit: '#FFFFFF', outfit2: '#4FB0C9', pose: 'stand' })}
  `,
  'story-es-salsa': () => `
    ${K.sky('#3A2F5A', '#6B4A8A', 'g19')}
    <circle cx="400" cy="250" r="180" fill="#FFD23F" opacity="0.08" />
    ${K.groundBand(420, 80, '#5a3f6f')}
    ${K.character({ x: 340, y: 420, scale: 1.1, skin: '#8a5a2f', hair: '#1A1A1A', hairStyle: 'short', outfit: '#D6392F', outfit2: '#1a1a2e', pose: 'wave' })}
    ${K.character({ x: 460, y: 420, scale: 1.1, skin: '#E8B98C', hair: '#3A2418', hairStyle: 'long', outfit: '#FF6FA0', outfit2: '#2B2F45', pose: 'run', flip: true })}
  `,
  'story-es-autobus': () => `
    ${K.sky('#B8CBE0', '#E6EEF6', 'g20')}
    ${K.groundBand(420, 80, '#8a8f94')}
    ${K.busShape(400, 300, '#E0A637', 1.2)}
    ${K.character({ x: 220, y: 430, scale: 1, skin: '#E8B98C', hair: '#3A2418', hairStyle: 'long', outfit: '#7226F5', outfit2: '#2B2F45', pose: 'stand' })}
    ${K.character({ x: 580, y: 430, scale: 1, skin: '#D6A97C', hair: '#1A1A1A', hairStyle: 'short', outfit: '#3FAE55', outfit2: '#1a1a2e', pose: 'wave', flip: true })}
  `,

  // ===== Hebrew =====
  'story-he-zoo': () => `
    ${K.sky('#BFE3D0', '#EAF7EF', 'g21')}
    ${K.sun(690, 90)}
    ${K.groundBand(420, 80, '#8FBF6F')}
    <rect x="80" y="320" width="640" height="8" fill="#8a6a3f" />
    ${K.zooAnimalLion(230, 360, 1.3)}
    ${K.elephant(560, 380, 1.1)}
    ${K.character({ x: 400, y: 440, scale: 1.1, skin: '#F0C49B', hair: '#4A3423', hairStyle: 'long', outfit: '#FF6FA0', outfit2: '#2B2F45', pose: 'wave' })}
  `,
  'story-he-cake': () => `
    ${K.sky('#F7D9E8', '#FDEEF5', 'g22')}
    ${K.groundBand(420, 80, '#E8C9A0')}
    <rect x="260" y="330" width="280" height="90" rx="8" fill="#E8C9A0" />
    ${K.cake(400, 400, 1.3)}
    ${K.character({ x: 320, y: 420, scale: 1.05, skin: '#F0C49B', hair: '#4A3423', hairStyle: 'short', outfit: '#4FB0C9', outfit2: '#2B2F45', pose: 'stand' })}
    ${K.character({ x: 480, y: 420, scale: 1.05, skin: '#E8B98C', hair: '#3A2418', hairStyle: 'bun', outfit: '#FFD23F', outfit2: '#1a1a2e', pose: 'wave', flip: true })}
  `,
  'story-he-keys': () => `
    ${K.sky('#F0D9B8', '#FBF0DE', 'g23')}
    ${K.groundBand(420, 80, '#C9B48A')}
    ${K.houseShape(400, 420, 260, 200, '#F2E3C9', '#D6552F')}
    ${K.cafeAwning(400, 300, 220, '#D6552F')}
    ${K.keyRing(500, 400, '#E0A637')}
    ${K.character({ x: 300, y: 430, scale: 1.05, skin: '#E8B98C', hair: '#3A2418', hairStyle: 'long', outfit: '#7226F5', outfit2: '#2B2F45', pose: 'stand' })}
  `,
  'story-he-tiyul': () => `
    ${K.sky('#FFC080', '#FFE8C0', 'g24')}
    ${K.sun(400, 110, 44, '#FF9F4F')}
    ${K.mountainRange(340, '#5a8fae', '#7fb0cf')}
    ${K.groundBand(420, 80, '#5a8f4f')}
    ${K.waterfall(430, 380)}
    ${K.tree(220, 430, 0.9)}
    ${K.tree(600, 430, 1.0)}
    ${K.character({ x: 300, y: 450, scale: 0.9, skin: '#D6A97C', hair: '#1A1A1A', hairStyle: 'short', outfit: '#3FAE55', outfit2: '#2B2F45', pose: 'walk' })}
    ${K.character({ x: 360, y: 455, scale: 0.85, skin: '#F0C49B', hair: '#4A3423', hairStyle: 'long', outfit: '#FFD23F', outfit2: '#1a1a2e', pose: 'walk', flip: true })}
  `,
  'story-he-dentist': () => `
    ${K.sky('#BFE3F0', '#EAF7FB', 'g25')}
    ${K.groundBand(420, 80, '#DFE6EE')}
    <rect x="300" y="300" width="200" height="140" rx="14" fill="#FFFFFF" />
    <rect x="330" y="260" width="30" height="60" rx="8" fill="#4FB0C9" />
    ${K.toothIcon(400, 250)}
    ${K.character({ x: 400, y: 420, scale: 1.05, skin: '#F0C49B', hair: '#4A3423', hairStyle: 'long', outfit: '#FF6FA0', outfit2: '#2B2F45', pose: 'sit' })}
  `,
  'story-he-basketball': () => `
    ${K.sky('#FFC080', '#FFE8C0', 'g26')}
    ${K.sun(680, 100, 46, '#FF9F4F')}
    ${K.groundBand(420, 80, '#C9925A')}
    ${K.basketballHoop(600, 420)}
    ${K.character({ x: 320, y: 440, scale: 1.1, skin: '#8a5a2f', hair: '#1A1A1A', hairStyle: 'short', outfit: '#D6392F', outfit2: '#FFFFFF', pose: 'run' })}
    ${K.soccerBall(400, 455, 13)}
  `,
  'story-he-passover': () => `
    ${K.sky('#F7E3C0', '#FDF5E8', 'g27')}
    ${K.groundBand(420, 80, '#D8C9A0')}
    <rect x="220" y="360" width="360" height="16" fill="#FFFFFF" />
    <rect x="220" y="376" width="360" height="50" fill="#E8C9A0" />
    ${K.cake(320, 370, 0.7)}
    ${K.giftBox(460, 385, '#7226F5', '#FFD23F')}
    ${K.character({ x: 260, y: 420, scale: 0.9, skin: '#F0C49B', hair: '#4A3423', hairStyle: 'long', outfit: '#4FB0C9', outfit2: '#2B2F45', pose: 'sit' })}
    ${K.character({ x: 540, y: 420, scale: 0.9, skin: '#D6A97C', hair: '#1A1A1A', hairStyle: 'bald', outfit: '#E0A637', outfit2: '#1a1a2e', pose: 'sit', flip: true })}
  `,
  'story-he-library': () => `
    ${K.sky('#E8D9BF', '#F7F0E2', 'g28')}
    ${K.groundBand(420, 80, '#C9B48A')}
    ${K.bookShelf(90, 240, 170, 160)}
    ${K.bookShelf(540, 240, 170, 160)}
    <rect x="330" y="360" width="140" height="60" rx="6" fill="#F2E3C9" />
    ${K.character({ x: 400, y: 400, scale: 0.9, skin: '#F0C49B', hair: '#4A3423', hairStyle: 'long', outfit: '#FF6FA0', outfit2: '#2B2F45', pose: 'sit' })}
  `,
  'story-he-airport': () => `
    ${K.sky('#FFB870', '#FFE3B0', 'g29')}
    ${K.sun(700, 90, 44, '#FF9F4F')}
    ${K.airplaneShape(560, 160, '#4FB0C9', 1.1)}
    ${K.groundBand(420, 80, '#8a8f94')}
    <rect x="0" y="415" width="800" height="4" fill="#FFFFFF" opacity="0.5" stroke-dasharray="20,14" />
    ${K.character({ x: 300, y: 430, scale: 1.1, skin: '#D6A97C', hair: '#1A1A1A', hairStyle: 'short', outfit: '#D6392F', outfit2: '#1a1a2e', pose: 'run' })}
    ${K.suitcase(360, 448, '#2F6FD6')}
  `,
  'story-he-grocery': () => `
    ${K.sky('#F0D9B8', '#FBF0DE', 'g30')}
    ${K.groundBand(420, 80, '#C9B48A')}
    ${K.houseShape(400, 420, 300, 200, '#F2E3C9', '#3FAE55')}
    ${K.shelfWithGoods(300, 340, 200)}
    ${K.character({ x: 300, y: 430, scale: 1, skin: '#8a5a2f', hair: '#1A1A1A', hairStyle: 'bald', outfit: '#E0A637', outfit2: '#2B2F45', pose: 'wave' })}
    ${K.character({ x: 480, y: 440, scale: 0.85, skin: '#F0C49B', hair: '#4A3423', hairStyle: 'long', outfit: '#4FB0C9', outfit2: '#1a1a2e', pose: 'stand', flip: true })}
  `,
}

const ALT_TEXT = {
  'story-beach': 'שני ילדים משחקים בחוף ים שטוף שמש – מתוך הסיפור A Day at the Beach',
  'story-new-job': 'צעיר עם מזוודה עומד מול משרד ביום העבודה הראשון שלו – מתוך הסיפור The New Job',
  'story-london-trip': 'תיירת עם מזוודה מול מגדל שעון בעיר גדולה – מתוך הסיפור A Trip to London',
  'story-lost-phone': 'טלפון נייד שנשכח על מושב רכבת ריק – מתוך הסיפור The Lost Phone',
  'story-surprise-birthday': 'עוגת יום הולדת ובלונים צבעוניים במסיבת הפתעה – מתוך הסיפור A Surprise Birthday',
  'story-small-cafe': 'בית קפה קטן וחמים בפינת רחוב עם שני אנשים – מתוך הסיפור The Small Cafe',
  'story-city-walk': 'אדם הולך ברגל ברחוב עירוני בשעת שקיעה – מתוך הסיפור A Walk in the City',
  'story-new-neighbor': 'שתי שכנות מתיידדות מול בתים סמוכים עם קופסאות הובלה – מתוך הסיפור The New Neighbor',
  'story-weekend-adventure': 'קבוצת חברים יושבת ליד אוהלים בטיול הרים – מתוך הסיפור A Weekend Adventure',
  'story-helpful-stranger': 'מכונית עצורה בצד כביש בלילה וזר אדיב מגיע לעזור – מתוך הסיפור The Helpful Stranger',
  'story-es-mercado': 'דוכני שוק צבעוניים עם פירות וירקות ביום שבת – מתוך הסיפור El Mercado del Sábado',
  'story-es-lluvia': 'בית חם ונעים ביום גשום עם כלב מתחת לחלון – מתוך הסיפור Un Día de Lluvia',
  'story-es-quince': 'נערה חוגגת מסיבת בת המצווה שלה עם בלונים ועוגה – מתוך הסיפור La Fiesta de Quince Años',
  'story-es-futbol': 'שני שחקני כדורגל במגרש מואר בערב משחק – מתוך הסיפור El Partido de Fútbol',
  'story-es-restaurante': 'זוג יושב לארוחה במסעדה חדשה וחמימה – מתוך הסיפור Un Restaurante Nuevo',
  'story-es-tren': 'שני נוסעים משוחחים בקרון רכבת בנסיעה ארוכה – מתוך הסיפור El Tren a Barcelona',
  'story-es-biblioteca': 'אישה יושבת וקוראת בין מדפי ספרים בספרייה שכונתית – מתוך הסיפור La Biblioteca del Barrio',
  'story-es-cocina': 'שף בבישול מול כיריים בכיתת בישול – מתוך הסיפור La Clase de Cocina',
  'story-es-salsa': 'זוג רוקד סלסה באולם ריקודים מואר – מתוך הסיפור Aprendiendo a Bailar Salsa',
  'story-es-autobus': 'נוסעת מבולבלת ליד תחנת אוטובוס ותושב מקומי עוזר לה – מתוך הסיפור El Autobús Equivocado',
  'story-he-zoo': 'ילדה מביטה באריה ובפיל בגן החיות – מתוך הסיפור ביקור בגן החיות',
  'story-he-cake': 'ילד ואמו עומדים ליד עוגת שוקולד ליום הולדת – מתוך הסיפור עוגת יום ההולדת',
  'story-he-keys': 'אישה מחפשת מפתחות אבודים ליד בית קפה קטן – מתוך הסיפור המפתחות האבודים',
  'story-he-tiyul': 'שני ילדים מטיילים ליד מפל מים בין הרי הגליל – מתוך הסיפור הטיול השנתי',
  'story-he-dentist': 'ילדה יושבת בכיסא במרפאת שיניים ידידותית – מתוך הסיפור תור לרופא השיניים',
  'story-he-basketball': 'ילד משחק כדורסל מול סל במגרש שכונתי – מתוך הסיפור משחק כדורסל בשכונה',
  'story-he-passover': 'משפחה יושבת סביב שולחן חג מקושט לליל הסדר – מתוך הסיפור הכנות לפסח',
  'story-he-library': 'ילדה יושבת וקוראת ספר בין מדפי ספרייה עירונית – מתוך הסיפור הספרייה העירונית',
  'story-he-airport': 'גבר רץ עם מזוודה לעבר מטוס בשדה התעופה – מתוך הסיפור איחור לטיסה',
  'story-he-grocery': 'בעל מכולת שכונתית מחייך לילדה ליד מדפי המוצרים – מתוך הסיפור המכולת של השכונה',
}

async function main() {
  const ids = Object.keys(SCENES)
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } })

  let ok = 0
  for (const id of ids) {
    const svg = wrap(SCENES[id]())
    const html = `<!doctype html><html><head><style>*{margin:0;padding:0}body{width:800px;height:500px}</style></head><body>${svg}</body></html>`
    await page.setContent(html)
    await page.waitForTimeout(30)
    const outPath = path.join(OUT_DIR, `${id}.webp`)
    await page.screenshot({ path: outPath, type: 'webp', quality: 90 })
    ok++
    console.log(`  ${id}.webp`)
  }

  await browser.close()
  console.log(`\nGenerated ${ok}/${ids.length} story images -> ${OUT_DIR}`)

  const missingAlt = ids.filter((id) => !ALT_TEXT[id])
  if (missingAlt.length) console.log('WARNING - missing alt text for:', missingAlt)
}

export { ALT_TEXT }

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('storyImages/generate.mjs')) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
