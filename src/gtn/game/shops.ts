import * as THREE from 'three'
import { addFacadeBuilding, type BuildContext } from './world'

export const SHOP_TYPES = ['clothing', 'shoes', 'restaurant', 'cafe', 'pizzeria', 'supermarket', 'barber'] as const
export type ShopType = (typeof SHOP_TYPES)[number]

const SHOP_META: Record<ShopType, { color: number; icon: string; label: string }> = {
  clothing: { color: 0xe0537a, icon: '👕', label: 'FASHION' },
  shoes: { color: 0x4a7fd6, icon: '👟', label: 'SHOES' },
  restaurant: { color: 0xd6602f, icon: '🍔', label: 'DINER' },
  cafe: { color: 0x8a5a3a, icon: '☕', label: 'CAFE' },
  pizzeria: { color: 0xe0a637, icon: '🍕', label: 'PIZZA' },
  supermarket: { color: 0x4fae5c, icon: '🛒', label: 'MARKET' },
  barber: { color: 0x3a3a55, icon: '💇', label: 'BARBER' },
}

const signCache = new Map<ShopType, THREE.Texture>()

function signTexture(type: ShopType): THREE.Texture {
  const cached = signCache.get(type)
  if (cached) return cached
  const meta = SHOP_META[type]
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#fff8ec'
  ctx.fillRect(0, 0, 256, 128)
  ctx.textAlign = 'center'
  ctx.font = '56px sans-serif'
  ctx.fillText(meta.icon, 128, 62)
  ctx.font = 'bold 22px sans-serif'
  ctx.fillStyle = '#222'
  ctx.fillText(meta.label, 128, 106)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  signCache.set(type, tex)
  return tex
}

/**
 * A shopfront building tagged with everything a future "walk up -> prompt ->
 * enter" flow would need - mirrors how vehicles already expose
 * `userData.wheels`/`seatOffsetY` for the same reason. No interior or
 * purchase UI is built here; this is deliberately just the identifiable,
 * enterable-later shell.
 *
 * `facing` must be a cardinal direction (0 / PI/2 / PI / -PI/2 - matching
 * the sin/cos heading convention used everywhere else in GTN) since the
 * building itself is axis-aligned, like every other building in the game.
 */
export function buildShopFront(
  ctx: BuildContext,
  type: ShopType,
  w: number,
  h: number,
  d: number,
  cx: number,
  cz: number,
  facing: number,
  variant: number
) {
  const meta = SHOP_META[type]
  const building = addFacadeBuilding(ctx, w, h, d, meta.color, cx, cz, variant)

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(w, d) * 0.7, h * 0.32),
    new THREE.MeshStandardMaterial({ map: signTexture(type), roughness: 0.85 })
  )
  const gap = 0.05
  sign.position.set(cx + Math.sin(facing) * (w / 2 + gap), h * 0.62, cz + Math.cos(facing) * (d / 2 + gap))
  sign.rotation.y = facing
  ctx.group.add(sign)

  const entryGap = 1.6
  const entryPoint = new THREE.Vector3(cx + Math.sin(facing) * (Math.max(w, d) / 2 + entryGap), 0, cz + Math.cos(facing) * (Math.max(w, d) / 2 + entryGap))
  building.userData = {
    interactable: true,
    kind: 'shop',
    shopType: type,
    entryPoint,
    entryFacing: facing + Math.PI,
  }
  return building
}
