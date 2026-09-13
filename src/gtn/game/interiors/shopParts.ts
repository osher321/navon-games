import * as THREE from 'three'
import type { Collider } from '../collision'
import type { CatalogItem, ProductSlot } from './products'

/** One inspectable point on a shelf/rack - `item` carries what E's info popup should show. */
export interface ShopInteractPoint {
  position: THREE.Vector3
  item: CatalogItem
}

function frameMat(color = 0xb8bcc2) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.4 })
}

/** Rotation-aware world footprint, matching the same convention used in parts.ts. */
function footprint(cx: number, cz: number, w: number, d: number, rotY: number): Collider {
  const rot4 = Math.round(rotY / (Math.PI / 2)) % 2
  const hw = (rot4 === 0 ? w : d) / 2
  const hd = (rot4 === 0 ? d : w) / 2
  return { minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd }
}

/**
 * A grocery/general-goods shelf: a metal frame with 3 tiers, each tier
 * stocked with one catalog item repeated along its length. Returns the
 * frame mesh, its footprint collider, the product slots (for
 * `materializeSlots`) and one interact point per tier (front-center item).
 */
export function buildShelfUnit(
  cx: number,
  cz: number,
  floorY: number,
  rotY: number,
  length: number,
  tiers: CatalogItem[]
): { group: THREE.Group; colliders: Collider[]; slots: ProductSlot[]; interactPoints: ShopInteractPoint[] } {
  const group = new THREE.Group()
  const depth = 0.5
  const height = 1.6
  const tierYs = [0.32, 0.82, 1.32].slice(0, tiers.length)

  const frame = new THREE.Mesh(new THREE.BoxGeometry(length, height, depth), frameMat(0x9aa0a8))
  frame.position.set(0, height / 2, 0)
  frame.castShadow = true
  frame.receiveShadow = true
  group.add(frame)

  const slots: ProductSlot[] = []
  const interactPoints: ShopInteractPoint[] = []
  const itemSize: [number, number, number] = [0.22, 0.24, 0.22]
  const perTier = Math.max(2, Math.floor((length - 0.2) / 0.26))

  tiers.forEach((item, tierIdx) => {
    const y = tierYs[tierIdx] + 0.14
    for (let i = 0; i < perTier; i++) {
      const localX = -length / 2 + 0.2 + i * ((length - 0.4) / Math.max(1, perTier - 1))
      const local = new THREE.Vector3(localX, y, 0.02)
      const worldPos = local.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY).add(new THREE.Vector3(cx, floorY, cz))
      slots.push({ position: worldPos, rotY, color: item.color, size: itemSize })
      if (i === Math.floor(perTier / 2)) interactPoints.push({ position: worldPos.clone(), item })
    }
  })

  group.position.set(cx, floorY, cz)
  group.rotation.y = rotY
  return { group, colliders: [footprint(cx, cz, length, depth, rotY)], slots, interactPoints }
}

/** A tall glass-front refrigerated case, visually distinct from dry shelving - used for dairy/meat aisles. */
export function buildFridgeCase(
  cx: number,
  cz: number,
  floorY: number,
  rotY: number,
  length: number,
  tiers: CatalogItem[]
): { group: THREE.Group; colliders: Collider[]; slots: ProductSlot[]; interactPoints: ShopInteractPoint[] } {
  const base = buildShelfUnit(cx, cz, floorY, rotY, length, tiers)
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(length - 0.1, 1.5),
    new THREE.MeshStandardMaterial({ color: 0xbfe3ea, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.28 })
  )
  glass.position.set(0, 0.9, 0.27)
  base.group.add(glass)
  return base
}

/** A clothing rack of hanging garments - reuses the same slot/instancing pipeline with a taller, thinner item box standing in for a folded/hung garment. */
export function buildClothingRack(
  cx: number,
  cz: number,
  floorY: number,
  rotY: number,
  length: number,
  item: CatalogItem
): { group: THREE.Group; colliders: Collider[]; slots: ProductSlot[]; interactPoints: ShopInteractPoint[] } {
  const group = new THREE.Group()
  const barHeight = 1.5
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, barHeight, 8), frameMat(0x6b6f76))
    post.position.set((side * length) / 2, barHeight / 2, 0)
    group.add(post)
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, length, 8), frameMat(0x6b6f76))
  bar.rotation.z = Math.PI / 2
  bar.position.set(0, barHeight, 0)
  group.add(bar)

  const slots: ProductSlot[] = []
  const interactPoints: ShopInteractPoint[] = []
  const count = Math.max(3, Math.floor(length / 0.22))
  const itemSize: [number, number, number] = [0.14, 0.42, 0.3]
  for (let i = 0; i < count; i++) {
    const localX = -length / 2 + 0.15 + i * ((length - 0.3) / Math.max(1, count - 1))
    const local = new THREE.Vector3(localX, barHeight - 0.28, 0)
    const worldPos = local.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY).add(new THREE.Vector3(cx, floorY, cz))
    slots.push({ position: worldPos, rotY, color: item.color, size: itemSize })
    if (i === Math.floor(count / 2)) interactPoints.push({ position: worldPos.clone(), item })
  }

  group.position.set(cx, floorY, cz)
  group.rotation.y = rotY
  return { group, colliders: [footprint(cx, cz, length, 0.5, rotY)], slots, interactPoints }
}

/** A wall-mounted, glass-fronted weapon vitrine - lower item count than grocery shelving, so each item gets its own explicit interact point rather than a "front-row-only" sample. */
export function buildWeaponVitrine(
  cx: number,
  cz: number,
  floorY: number,
  rotY: number,
  length: number,
  items: import('./products').WeaponCatalogItem[]
): { group: THREE.Group; colliders: Collider[]; interactPoints: ShopInteractPoint[] } {
  const group = new THREE.Group()
  const height = 1.3
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(length, height, 0.4), frameMat(0x2c2c2f))
  cabinet.position.y = height / 2
  cabinet.castShadow = true
  cabinet.receiveShadow = true
  group.add(cabinet)
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(length - 0.1, height - 0.15),
    new THREE.MeshStandardMaterial({ color: 0xcfe8ff, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.22 })
  )
  glass.position.set(0, height / 2, 0.21)
  group.add(glass)

  const interactPoints: ShopInteractPoint[] = []
  items.forEach((item, i) => {
    const localX = -length / 2 + 0.35 + i * ((length - 0.7) / Math.max(1, items.length - 1))
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.1), frameMat(item.color))
    barrel.position.set(localX, height / 2, 0.05)
    group.add(barrel)
    const local = new THREE.Vector3(localX, height / 2, 0.1)
    const worldPos = local.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY).add(new THREE.Vector3(cx, floorY, cz))
    interactPoints.push({ position: worldPos, item: { name: item.name, price: item.price, category: 'נשק', color: item.color } })
  })

  group.position.set(cx, floorY, cz)
  group.rotation.y = rotY
  return { group, colliders: [footprint(cx, cz, length, 0.4, rotY)], interactPoints }
}

/** A checkout / sales counter - shared by every store kind (grocery till, clothing register, gun-shop counter, dealership desk). */
export function buildCheckoutCounter(cx: number, cz: number, floorY: number, rotY: number): { group: THREE.Group; colliders: Collider[] } {
  const group = new THREE.Group()
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.95, 0.6), frameMat(0xcfd2d6))
  desk.position.y = 0.475
  desk.castShadow = true
  desk.receiveShadow = true
  group.add(desk)
  const register = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.28), frameMat(0x2c2c2f))
  register.position.set(0.45, 1.06, 0)
  group.add(register)
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x1a3d5c, emissive: 0x14304a, emissiveIntensity: 0.6 })
  )
  screen.rotation.x = -0.5
  screen.position.set(0.45, 1.2, -0.05)
  group.add(screen)
  const beltSurface = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.5), frameMat(0x3a3a3f))
  beltSurface.position.set(-0.4, 0.97, 0)
  group.add(beltSurface)

  group.position.set(cx, floorY, cz)
  group.rotation.y = rotY
  return { group, colliders: [footprint(cx, cz, 1.6, 0.6, rotY)] }
}
