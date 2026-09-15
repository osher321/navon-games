// A small library of reusable flat-illustration SVG fragments, shared
// across all 30 generated story cover images so they read as one visual
// series (soft rounded shapes, warm flat colors, no photoreal rendering,
// no text) while still differing scene-to-scene. Nothing here is a
// downloaded/copied asset - every shape is plain SVG primitives, matching
// how the rest of the site (GameCard blobs, GTN's primitive-built models)
// already builds its own graphics rather than importing art.

export function sky(top, bottom, id) {
  return `
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${top}" />
        <stop offset="100%" stop-color="${bottom}" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="800" height="500" fill="url(#${id})" />
  `
}

export function sun(x, y, r = 46, color = '#FFD23F') {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="0.95" />`
}

export function cloud(x, y, scale = 1, color = '#FFFFFF', opacity = 0.85) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})" opacity="${opacity}">
      <ellipse cx="0" cy="0" rx="34" ry="18" fill="${color}" />
      <ellipse cx="26" cy="-6" rx="22" ry="16" fill="${color}" />
      <ellipse cx="-26" cy="-4" rx="20" ry="14" fill="${color}" />
    </g>
  `
}

export function stars(count, seedColor = '#FFFFFF') {
  let s = ''
  for (let i = 0; i < count; i++) {
    const x = (i * 137) % 780 + 10
    const y = ((i * 71) % 220) + 10
    const r = 1.4 + (i % 3) * 0.6
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${seedColor}" opacity="${0.5 + (i % 4) * 0.12}" />`
  }
  return s
}

export function groundBand(y, height, color) {
  return `<rect x="0" y="${y}" width="800" height="${height}" fill="${color}" />`
}

export function groundCurve(y, color) {
  return `<path d="M0,${y} Q400,${y - 34} 800,${y} L800,500 L0,500 Z" fill="${color}" />`
}

export function wave(y, color, opacity = 1) {
  return `<path d="M0,${y} Q60,${y - 14} 120,${y} T240,${y} T360,${y} T480,${y} T600,${y} T720,${y} T800,${y} L800,500 L0,500 Z" fill="${color}" opacity="${opacity}" />`
}

export function palmTree(x, y, scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <path d="M0,0 C-4,-40 4,-80 -2,-118" stroke="#8a5a2f" stroke-width="10" fill="none" stroke-linecap="round" />
      <g transform="translate(-2,-118)">
        <ellipse cx="0" cy="-6" rx="30" ry="10" fill="#3f9e4f" transform="rotate(-25)" />
        <ellipse cx="0" cy="-6" rx="30" ry="10" fill="#3fae55" transform="rotate(20)" />
        <ellipse cx="0" cy="-6" rx="30" ry="10" fill="#3f9e4f" transform="rotate(65)" />
        <ellipse cx="0" cy="-6" rx="30" ry="10" fill="#4fbf62" transform="rotate(-70)" />
        <ellipse cx="0" cy="-6" rx="30" ry="10" fill="#3fae55" transform="rotate(110)" />
      </g>
    </g>
  `
}

export function tree(x, y, scale = 1, canopy = '#3f9e4f', trunk = '#7a5230') {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <rect x="-7" y="-46" width="14" height="46" rx="4" fill="${trunk}" />
      <circle cx="0" cy="-70" r="34" fill="${canopy}" />
      <circle cx="-22" cy="-54" r="24" fill="${canopy}" />
      <circle cx="22" cy="-54" r="24" fill="${canopy}" />
    </g>
  `
}

export function mountainRange(y, color1, color2) {
  return `
    <path d="M0,${y} L130,${y - 140} L230,${y - 60} L340,${y - 170} L460,${y - 50} L560,${y - 150} L680,${y - 70} L800,${y - 130} L800,500 L0,500 Z" fill="${color1}" />
    <path d="M0,${y + 20} L160,${y - 70} L300,${y + 10} L440,${y - 90} L600,${y - 10} L800,${y - 60} L800,500 L0,500 Z" fill="${color2}" opacity="0.9" />
  `
}

export function waterfall(x, y) {
  return `
    <rect x="${x - 14}" y="${y - 130}" width="28" height="130" rx="10" fill="#bfe8ff" opacity="0.9" />
    <ellipse cx="${x}" cy="${y + 6}" rx="34" ry="10" fill="#eaf7ff" opacity="0.9" />
  `
}

/**
 * A simple flat-illustration person: circle head, rounded-capsule torso,
 * two arm/leg limbs. `pose` swaps a few transforms/paths for a different
 * silhouette (standing / waving / walking / sitting / running) without
 * needing a different function per pose.
 */
export function character({ x, y, scale = 1, skin = '#F0C49B', hair = '#4A3423', hairStyle = 'short', outfit = '#2FB6A8', outfit2 = '#2B2F45', pose = 'stand', flip = false }) {
  const legL = pose === 'run' ? `M-10,26 L-22,60 L-16,64` : pose === 'sit' ? `M-10,26 L-10,44 L-26,48` : `M-10,26 L-12,64`
  const legR = pose === 'run' ? `M10,26 L20,52 L34,50` : pose === 'sit' ? `M10,26 L10,44 L26,48` : `M10,26 L12,64`
  const armL = pose === 'wave' ? `M-16,-6 L-30,-30 L-24,-38` : pose === 'run' ? `M-16,-4 L-30,14 L-24,26` : `M-16,-4 L-24,20`
  const armR = pose === 'wave' ? `M16,-6 L22,16 L16,26` : pose === 'run' ? `M16,-4 L28,-18 L22,-28` : `M16,-4 L24,20`

  let hairShape = ''
  if (hairStyle === 'short') hairShape = `<path d="M-18,-46 Q0,-64 18,-46 L18,-38 Q0,-50 -18,-38 Z" fill="${hair}" />`
  else if (hairStyle === 'long') hairShape = `<path d="M-20,-44 Q0,-64 20,-44 L22,-6 Q10,-20 0,-44 Q-10,-20 -22,-6 Z" fill="${hair}" />`
  else if (hairStyle === 'bun') hairShape = `<path d="M-18,-46 Q0,-62 18,-46 Z" fill="${hair}" /><circle cx="0" cy="-64" r="8" fill="${hair}" />`
  else if (hairStyle === 'bald') hairShape = ''

  return `
    <g transform="translate(${x},${y}) scale(${flip ? -scale : scale},${scale})">
      <path d="${legL}" stroke="${outfit2}" stroke-width="9" fill="none" stroke-linecap="round" />
      <path d="${legR}" stroke="${outfit2}" stroke-width="9" fill="none" stroke-linecap="round" />
      <path d="${armL}" stroke="${outfit}" stroke-width="8" fill="none" stroke-linecap="round" />
      <path d="${armR}" stroke="${outfit}" stroke-width="8" fill="none" stroke-linecap="round" />
      <rect x="-16" y="-30" width="32" height="56" rx="16" fill="${outfit}" />
      <circle cx="0" cy="-46" r="20" fill="${skin}" />
      ${hairShape}
    </g>
  `
}

export function suitcase(x, y, color = '#D6392F') {
  return `
    <g transform="translate(${x},${y})">
      <rect x="-20" y="-4" width="40" height="30" rx="5" fill="${color}" />
      <rect x="-8" y="-14" width="16" height="10" rx="3" fill="none" stroke="${color}" stroke-width="3" />
    </g>
  `
}

export function phoneProp(x, y) {
  return `<rect x="${x - 7}" y="${y - 14}" width="14" height="28" rx="3" fill="#1a1a2e" /><rect x="${x - 5}" y="${y - 11}" width="10" height="20" fill="#6fd6ff" />`
}

export function cake(x, y, scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <rect x="-30" y="-6" width="60" height="26" rx="4" fill="#F7C9DE" />
      <rect x="-30" y="-6" width="60" height="8" fill="#FFFFFF" />
      <rect x="-34" y="20" width="68" height="10" rx="3" fill="#E8A6C4" />
      <rect x="-2" y="-24" width="4" height="18" fill="#E8B84B" />
      <path d="M0,-24 Q4,-32 0,-36 Q-4,-32 0,-24" fill="#FFD23F" />
    </g>
  `
}

export function balloon(x, y, color) {
  return `
    <g>
      <ellipse cx="${x}" cy="${y}" rx="16" ry="20" fill="${color}" />
      <path d="M${x},${y + 20} L${x},${y + 70}" stroke="#8a8f94" stroke-width="1.5" fill="none" />
    </g>
  `
}

export function bookShelf(x, y, w, h) {
  const colors = ['#D6552F', '#2F6FD6', '#3FAE55', '#E0A637', '#7226F5']
  let books = ''
  const count = Math.floor(w / 14)
  for (let i = 0; i < count; i++) {
    books += `<rect x="${x + i * 14}" y="${y}" width="11" height="${h}" fill="${colors[i % colors.length]}" />`
  }
  return `<rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" fill="#8a6a3f" /> ${books}`
}

export function basketballHoop(x, y) {
  return `
    <g transform="translate(${x},${y})">
      <rect x="-3" y="-90" width="6" height="90" fill="#8a8f94" />
      <rect x="-2" y="-92" width="30" height="18" fill="#e8e8e8" opacity="0.9" />
      <ellipse cx="28" cy="-78" rx="14" ry="4" fill="none" stroke="#D6552F" stroke-width="3" />
    </g>
  `
}

export function soccerBall(x, y, r = 12) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" stroke="#1a1a2e" stroke-width="2" /><circle cx="${x}" cy="${y}" r="4" fill="#1a1a2e" />`
}

export function zooAnimalLion(x, y, scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <circle cx="0" cy="0" r="26" fill="#D68A2F" />
      <circle cx="0" cy="0" r="17" fill="#E0A637" />
      <circle cx="-7" cy="-3" r="2.4" fill="#1a1a2e" />
      <circle cx="7" cy="-3" r="2.4" fill="#1a1a2e" />
      <ellipse cx="0" cy="4" rx="4" ry="3" fill="#1a1a2e" />
    </g>
  `
}

export function elephant(x, y, scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <ellipse cx="0" cy="0" rx="30" ry="22" fill="#9AA0A6" />
      <circle cx="-24" cy="-10" r="16" fill="#9AA0A6" />
      <path d="M-30,0 Q-38,20 -30,34" stroke="#9AA0A6" stroke-width="8" fill="none" stroke-linecap="round" />
      <ellipse cx="-18" cy="16" rx="10" ry="14" fill="#9AA0A6" />
    </g>
  `
}

export function dog(x, y, color = '#D6A25A') {
  return `
    <g transform="translate(${x},${y})">
      <ellipse cx="0" cy="0" rx="18" ry="12" fill="${color}" />
      <circle cx="16" cy="-8" r="9" fill="${color}" />
      <ellipse cx="22" cy="-14" rx="3" ry="6" fill="${color}" transform="rotate(20 22 -14)" />
    </g>
  `
}

export function carShape(x, y, color = '#2F6FD6', scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <rect x="-40" y="-6" width="80" height="22" rx="8" fill="${color}" />
      <path d="M-24,-6 L-16,-24 L18,-24 L26,-6 Z" fill="${color}" />
      <rect x="-14" y="-22" width="26" height="14" fill="#bfe8ff" opacity="0.85" />
      <circle cx="-22" cy="18" r="9" fill="#1a1a2e" />
      <circle cx="22" cy="18" r="9" fill="#1a1a2e" />
    </g>
  `
}

export function busShape(x, y, color = '#E0A637', scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <rect x="-56" y="-40" width="112" height="52" rx="10" fill="${color}" />
      <rect x="-46" y="-30" width="24" height="20" fill="#bfe8ff" opacity="0.9" />
      <rect x="-16" y="-30" width="24" height="20" fill="#bfe8ff" opacity="0.9" />
      <rect x="14" y="-30" width="24" height="20" fill="#bfe8ff" opacity="0.9" />
      <circle cx="-34" cy="14" r="10" fill="#1a1a2e" />
      <circle cx="34" cy="14" r="10" fill="#1a1a2e" />
    </g>
  `
}

export function trainShape(x, y, color = '#7226F5', scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <rect x="-70" y="-44" width="140" height="56" rx="14" fill="${color}" />
      <rect x="-58" y="-34" width="26" height="20" fill="#bfe8ff" opacity="0.9" />
      <rect x="-22" y="-34" width="26" height="20" fill="#bfe8ff" opacity="0.9" />
      <rect x="14" y="-34" width="26" height="20" fill="#bfe8ff" opacity="0.9" />
      <rect x="50" y="-34" width="14" height="20" fill="#bfe8ff" opacity="0.9" />
      <circle cx="-44" cy="16" r="9" fill="#1a1a2e" />
      <circle cx="0" cy="16" r="9" fill="#1a1a2e" />
      <circle cx="44" cy="16" r="9" fill="#1a1a2e" />
    </g>
  `
}

export function airplaneShape(x, y, color = '#4FB0C9', scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <ellipse cx="0" cy="0" rx="60" ry="14" fill="${color}" />
      <path d="M-10,-6 L-40,-40 L-24,-6 Z" fill="${color}" />
      <path d="M0,10 L-16,36 L4,10 Z" fill="${color}" opacity="0.9" />
      <path d="M48,-2 L70,-14 L70,6 Z" fill="${color}" />
    </g>
  `
}

export function houseShape(x, y, w, h, wall = '#E8C9A0', roof = '#D6552F', scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" fill="${wall}" />
      <path d="M${-w / 2 - 8},${-h} L0,${-h - 34} L${w / 2 + 8},${-h} Z" fill="${roof}" />
      <rect x="-10" y="${-h / 2 + 2}" width="20" height="${h / 2 - 2}" fill="#8a5a2f" />
      <rect x="${-w / 2 + 10}" y="${-h + 14}" width="16" height="16" fill="#bfe8ff" opacity="0.9" />
      <rect x="${w / 2 - 26}" y="${-h + 14}" width="16" height="16" fill="#bfe8ff" opacity="0.9" />
    </g>
  `
}

export function cafeAwning(x, y, w, color = '#D6552F') {
  const stripes = 6
  let s = ''
  for (let i = 0; i < stripes; i++) {
    s += `<path d="M${x - w / 2 + (i * w) / stripes},${y} L${x - w / 2 + ((i + 1) * w) / stripes},${y} L${x - w / 2 + ((i + 1) * w) / stripes + 6},${y + 18} L${x - w / 2 + (i * w) / stripes + 6},${y + 18} Z" fill="${i % 2 === 0 ? color : '#FFFFFF'}" />`
  }
  return s
}

export function marketStall(x, y, color) {
  return `
    <g transform="translate(${x},${y})">
      <rect x="-32" y="-2" width="64" height="30" fill="#8a6a3f" />
      <path d="M-40,-2 L-36,-30 L36,-30 L40,-2 Z" fill="${color}" />
      <circle cx="-16" cy="10" r="6" fill="#D6392F" />
      <circle cx="0" cy="8" r="6" fill="#E0A637" />
      <circle cx="16" cy="10" r="6" fill="#3FAE55" />
    </g>
  `
}

export function keyRing(x, y, color = '#E0A637') {
  return `<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="${color}" stroke-width="3" /><rect x="${x + 6}" y="${y - 2}" width="14" height="4" fill="${color}" /><rect x="${x + 16}" y="${y - 2}" width="3" height="7" fill="${color}" />`
}

export function giftBox(x, y, color = '#D6392F', ribbon = '#FFD23F') {
  return `
    <g transform="translate(${x},${y})">
      <rect x="-16" y="-16" width="32" height="26" fill="${color}" />
      <rect x="-16" y="-16" width="32" height="6" fill="${ribbon}" />
      <rect x="-3" y="-16" width="6" height="26" fill="${ribbon}" />
    </g>
  `
}

export function toothIcon(x, y) {
  return `<path d="M${x - 10},${y - 12} Q${x - 14},${y + 4} ${x - 4},${y + 16} L${x},${y + 6} L${x + 4},${y + 16} Q${x + 14},${y + 4} ${x + 10},${y - 12} Q${x},${y - 20} ${x - 10},${y - 12} Z" fill="#FFFFFF" stroke="#dfe6ee" stroke-width="1.5" />`
}

export function shelfWithGoods(x, y, w) {
  const colors = ['#D6392F', '#E0A637', '#3FAE55', '#2F6FD6', '#7226F5']
  let items = ''
  const count = Math.floor(w / 16)
  for (let i = 0; i < count; i++) items += `<rect x="${x + i * 16}" y="${y - 14}" width="12" height="14" rx="2" fill="${colors[i % colors.length]}" />`
  return `<rect x="${x - 4}" y="${y}" width="${w + 8}" height="6" fill="#8a6a3f" /> ${items}`
}

// --- Additions for the 60-story library expansion (new settings: castles,
// storms, space, time-travel, detective noir, etc.) - same flat-primitive
// style as everything above, no external art.

export function owl(x, y, scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <ellipse cx="0" cy="0" rx="22" ry="26" fill="#8a6a4f" />
      <ellipse cx="-9" cy="-8" rx="9" ry="10" fill="#c9a876" />
      <ellipse cx="9" cy="-8" rx="9" ry="10" fill="#c9a876" />
      <circle cx="-9" cy="-8" r="4.5" fill="#1a1a2e" />
      <circle cx="9" cy="-8" r="4.5" fill="#1a1a2e" />
      <path d="M0,-2 L-5,6 L5,6 Z" fill="#E0A637" />
      <path d="M-14,-24 L-8,-14 L-18,-16 Z" fill="#8a6a4f" />
      <path d="M14,-24 L8,-14 L18,-16 Z" fill="#8a6a4f" />
    </g>
  `
}

export function castle(x, y, scale = 1, color = '#9AA0A6') {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <rect x="-70" y="-90" width="140" height="90" fill="${color}" />
      <rect x="-70" y="-100" width="18" height="18" fill="${color}" />
      <rect x="-40" y="-100" width="18" height="18" fill="${color}" />
      <rect x="-8" y="-100" width="16" height="18" fill="${color}" />
      <rect x="24" y="-100" width="18" height="18" fill="${color}" />
      <rect x="52" y="-100" width="18" height="18" fill="${color}" />
      <rect x="-92" y="-70" width="26" height="70" fill="${color}" />
      <polygon points="-92,-70 -79,-96 -66,-70" fill="#7a828f" />
      <rect x="66" y="-70" width="26" height="70" fill="${color}" />
      <polygon points="66,-70 79,-96 92,-70" fill="#7a828f" />
      <rect x="-14" y="-40" width="28" height="40" rx="14" fill="#3f2a1a" />
      <rect x="-30" y="-60" width="14" height="18" fill="#bfe8ff" opacity="0.8" />
      <rect x="16" y="-60" width="14" height="18" fill="#bfe8ff" opacity="0.8" />
    </g>
  `
}

export function fishingBoat(x, y, scale = 1, color = '#4FB0C9') {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <path d="M-60,0 Q0,26 60,0 L48,20 L-48,20 Z" fill="${color}" />
      <rect x="-4" y="-70" width="8" height="70" fill="#7a5230" />
      <path d="M4,-68 L46,-14 L4,-14 Z" fill="#FFFFFF" opacity="0.92" />
      <path d="M-4,-50 L-34,-14 L-4,-14 Z" fill="#E8E8E8" opacity="0.9" />
      <rect x="-14" y="-16" width="20" height="16" fill="#3f4650" />
    </g>
  `
}

export function rain(count = 20, color = '#bfe8ff') {
  let s = ''
  for (let i = 0; i < count; i++) {
    const x = (i * 53) % 800
    const y = (i * 37) % 400
    s += `<line x1="${x}" y1="${y}" x2="${x - 14}" y2="${y + 26}" stroke="${color}" stroke-width="2.5" opacity="0.55" />`
  }
  return s
}

export function stormClouds(y = 90) {
  return `
    <ellipse cx="140" cy="${y}" rx="90" ry="34" fill="#5a6470" opacity="0.9" />
    <ellipse cx="320" cy="${y - 20}" rx="110" ry="40" fill="#4a5460" opacity="0.9" />
    <ellipse cx="560" cy="${y}" rx="100" ry="36" fill="#5a6470" opacity="0.9" />
  `
}

export function rocket(x, y, scale = 1, color = '#D6392F') {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <path d="M0,-60 Q18,-20 18,20 L-18,20 Q-18,-20 0,-60 Z" fill="${color}" />
      <circle cx="0" cy="-10" r="9" fill="#bfe8ff" />
      <path d="M-18,10 L-34,32 L-18,26 Z" fill="#E0A637" />
      <path d="M18,10 L34,32 L18,26 Z" fill="#E0A637" />
      <path d="M-8,20 L0,40 L8,20 Z" fill="#FF9F4F" />
    </g>
  `
}

export function robotChar(x, y, scale = 1, color = '#4FB0C9') {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <rect x="-16" y="-34" width="32" height="30" rx="6" fill="${color}" />
      <circle cx="-7" cy="-20" r="4" fill="#FFFFFF" />
      <circle cx="7" cy="-20" r="4" fill="#FFFFFF" />
      <rect x="-20" y="-4" width="40" height="26" rx="8" fill="${color}" />
      <rect x="-16" y="22" width="10" height="16" fill="#3f4650" />
      <rect x="6" y="22" width="10" height="16" fill="#3f4650" />
      <line x1="0" y1="-34" x2="0" y2="-44" stroke="${color}" stroke-width="3" />
      <circle cx="0" cy="-46" r="4" fill="#FFD23F" />
    </g>
  `
}

export function magnifyingGlass(x, y, scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <circle cx="0" cy="0" r="16" fill="none" stroke="#3f4650" stroke-width="4" />
      <circle cx="0" cy="0" r="16" fill="#bfe8ff" opacity="0.35" />
      <line x1="11" y1="11" x2="26" y2="26" stroke="#3f4650" stroke-width="5" stroke-linecap="round" />
    </g>
  `
}

export function portalSwirl(x, y, r = 60, color = '#7226F5') {
  return `
    <g transform="translate(${x},${y})">
      <circle cx="0" cy="0" r="${r}" fill="${color}" opacity="0.25" />
      <circle cx="0" cy="0" r="${r * 0.7}" fill="${color}" opacity="0.35" />
      <circle cx="0" cy="0" r="${r * 0.4}" fill="#FFFFFF" opacity="0.5" />
    </g>
  `
}

export function oldClock(x, y, scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <circle cx="0" cy="0" r="30" fill="#F2E3C9" stroke="#8a6a3f" stroke-width="4" />
      <line x1="0" y1="0" x2="0" y2="-18" stroke="#3f4650" stroke-width="3" stroke-linecap="round" />
      <line x1="0" y1="0" x2="12" y2="6" stroke="#3f4650" stroke-width="3" stroke-linecap="round" />
      <circle cx="0" cy="0" r="3" fill="#3f4650" />
    </g>
  `
}

export function campTent(x, y, scale = 1, color = '#D6552F') {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <path d="M-30,20 L0,-34 L30,20 Z" fill="${color}" />
      <path d="M-8,20 L0,-6 L8,20 Z" fill="#3f2a1a" />
      <line x1="-30" y1="20" x2="30" y2="20" stroke="#7a5230" stroke-width="4" />
    </g>
  `
}

export function kitten(x, y, color = '#E8C99A') {
  return `
    <g transform="translate(${x},${y})">
      <ellipse cx="0" cy="0" rx="14" ry="10" fill="${color}" />
      <circle cx="12" cy="-8" r="8" fill="${color}" />
      <polygon points="6,-15 10,-24 14,-15" fill="${color}" />
      <polygon points="14,-15 18,-24 20,-14" fill="${color}" />
      <circle cx="9" cy="-9" r="1.5" fill="#1a1a2e" />
      <circle cx="15" cy="-9" r="1.5" fill="#1a1a2e" />
    </g>
  `
}

export function glowingFlower(x, y, color = '#FF6FA0') {
  return `
    <g transform="translate(${x},${y})">
      <circle cx="0" cy="0" r="14" fill="${color}" opacity="0.3" />
      <circle cx="0" cy="-4" r="4" fill="${color}" />
      <circle cx="-6" cy="2" r="4" fill="${color}" />
      <circle cx="6" cy="2" r="4" fill="${color}" />
      <circle cx="0" cy="0" r="3" fill="#FFD23F" />
      <line x1="0" y1="10" x2="0" y2="30" stroke="#3FAE55" stroke-width="3" />
    </g>
  `
}

export function sword(x, y, scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <rect x="-3" y="-50" width="6" height="44" fill="#c9c9d4" />
      <rect x="-14" y="-8" width="28" height="6" rx="2" fill="#8a6a3f" />
      <rect x="-4" y="-6" width="8" height="16" fill="#5a3f1f" />
    </g>
  `
}

export function fogOverlay(opacity = 0.5) {
  return `<rect x="0" y="0" width="800" height="500" fill="#c9d0d8" opacity="${opacity}" />`
}

export function envelope(x, y, scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <rect x="-24" y="-16" width="48" height="32" rx="2" fill="#F2E3C9" stroke="#8a6a3f" stroke-width="2" />
      <path d="M-24,-16 L0,4 L24,-16" fill="none" stroke="#8a6a3f" stroke-width="2" />
    </g>
  `
}

export function trophy(x, y, scale = 1, color = '#E0A637') {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <path d="M-14,-24 Q-14,0 0,4 Q14,0 14,-24 Z" fill="${color}" />
      <path d="M-14,-20 Q-26,-20 -22,-6 Q-18,4 -14,-2" fill="none" stroke="${color}" stroke-width="4" />
      <path d="M14,-20 Q26,-20 22,-6 Q18,4 14,-2" fill="none" stroke="${color}" stroke-width="4" />
      <rect x="-4" y="4" width="8" height="10" fill="${color}" />
      <rect x="-14" y="14" width="28" height="6" rx="2" fill="#8a6a3f" />
    </g>
  `
}

export function newspaper(x, y, scale = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${scale})">
      <rect x="-22" y="-16" width="44" height="32" fill="#F2E3C9" />
      <rect x="-16" y="-10" width="32" height="4" fill="#8a6a3f" />
      <rect x="-16" y="-2" width="20" height="3" fill="#c9b48a" />
      <rect x="-16" y="4" width="24" height="3" fill="#c9b48a" />
      <rect x="-16" y="10" width="16" height="3" fill="#c9b48a" />
    </g>
  `
}
