import * as THREE from 'three'

/**
 * Small procedural surface textures - everything is drawn on an in-memory
 * canvas at runtime, nothing downloaded or imported. Each base canvas is
 * generated once and cached; callers get back a cheap `.clone()` so they
 * can each set their own tiling (`repeat`) without fighting over shared
 * state, while the actual pixel data (the expensive part) stays shared.
 */

const baseCache = new Map<string, THREE.Texture>()

function getBase(key: string, build: () => HTMLCanvasElement): THREE.Texture {
  let tex = baseCache.get(key)
  if (!tex) {
    tex = new THREE.CanvasTexture(build())
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    // A high-frequency repeating pattern (like the grass speckles) tiled
    // across a big open plane and viewed at a grazing angle - e.g. looking
    // down the airport runway - aliases into visible moire "wave" bands
    // without this; a fixed anisotropy is enough to fix it regardless of
    // the actual GPU limit (three.js clamps it internally).
    tex.anisotropy = 8
    baseCache.set(key, tex)
  }
  return tex
}

function tile(key: string, build: () => HTMLCanvasElement, repeatX: number, repeatY: number): THREE.Texture {
  const t = getBase(key, build).clone()
  t.needsUpdate = true
  t.repeat.set(repeatX, repeatY)
  return t
}

function canvas(size: number) {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  return { c, ctx: c.getContext('2d')! }
}

function speckle(ctx: CanvasRenderingContext2D, size: number, count: number, radius: number, colorFn: () => string) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colorFn()
    const x = Math.random() * size
    const y = Math.random() * size
    const r = Math.random() * radius
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function asphaltTexture(repeatX: number, repeatY: number): THREE.Texture {
  return tile(
    'asphalt',
    () => {
      const { c, ctx } = canvas(256)
      ctx.fillStyle = '#35363b'
      ctx.fillRect(0, 0, 256, 256)
      speckle(ctx, 256, 700, 1.1, () => `rgba(${20 + Math.random() * 30},${20 + Math.random() * 30},${24 + Math.random() * 30},0.5)`)
      speckle(ctx, 256, 120, 0.9, () => 'rgba(255,255,255,0.05)')
      return c
    },
    repeatX,
    repeatY
  )
}

export function sidewalkTexture(repeatX: number, repeatY: number): THREE.Texture {
  return tile(
    'sidewalk',
    () => {
      const { c, ctx } = canvas(256)
      ctx.fillStyle = '#cdc7bd'
      ctx.fillRect(0, 0, 256, 256)
      speckle(ctx, 256, 400, 1, () => `rgba(0,0,0,${0.03 + Math.random() * 0.05})`)
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'
      ctx.lineWidth = 2
      for (let i = 0; i <= 4; i++) {
        const x = (i / 4) * 256
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, 256)
        ctx.stroke()
      }
      return c
    },
    repeatX,
    repeatY
  )
}

export function sandTexture(repeatX: number, repeatY: number): THREE.Texture {
  return tile(
    'sand',
    () => {
      const { c, ctx } = canvas(256)
      ctx.fillStyle = '#e8d19a'
      ctx.fillRect(0, 0, 256, 256)
      speckle(ctx, 256, 900, 1.3, () => `rgba(${180 + Math.random() * 40},${150 + Math.random() * 40},${100 + Math.random() * 30},0.25)`)
      return c
    },
    repeatX,
    repeatY
  )
}

export function grassTexture(repeatX: number, repeatY: number): THREE.Texture {
  return tile(
    'grass',
    () => {
      const { c, ctx } = canvas(256)
      ctx.fillStyle = '#3fa34d'
      ctx.fillRect(0, 0, 256, 256)
      speckle(ctx, 256, 500, 2.2, () => `rgba(${40 + Math.random() * 40},${120 + Math.random() * 50},${50 + Math.random() * 30},0.35)`)
      speckle(ctx, 256, 150, 1.4, () => 'rgba(255,255,255,0.04)')
      return c
    },
    repeatX,
    repeatY
  )
}

const FACADE_VARIANTS = 4

export function buildingFacadeTexture(variant: number, floors: number, cols: number): THREE.Texture {
  const key = `facade-${variant % FACADE_VARIANTS}`
  return tile(
    key,
    () => {
      const { c, ctx } = canvas(256)
      // Neutral mid-gray base so it multiplies cleanly with each building's
      // own tint color instead of relying on alpha (which a non-transparent
      // material would just ignore and render as black).
      ctx.fillStyle = '#c9c9c9'
      ctx.fillRect(0, 0, 256, 256)
      const seed = variant * 37
      const gridX = 6
      const gridY = 8
      const cellW = 256 / gridX
      const cellH = 256 / gridY
      for (let gy = 0; gy < gridY; gy++) {
        for (let gx = 0; gx < gridX; gx++) {
          const lit = Math.sin(gx * 12.9898 + gy * 78.233 + seed) * 43758.5453
          const on = lit - Math.floor(lit) > 0.55
          ctx.fillStyle = on ? '#fff2c4' : '#3a4250'
          const pad = cellW * 0.18
          ctx.fillRect(gx * cellW + pad, gy * cellH + pad, cellW - pad * 2, cellH - pad * 2)
        }
      }
      return c
    },
    Math.max(1, Math.round(cols / 2)),
    Math.max(1, Math.round(floors / 2))
  )
}
