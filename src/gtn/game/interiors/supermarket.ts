import * as THREE from 'three'
import type { Collider } from '../collision'
import type { InteriorBuild, InteriorInteractable } from './types'
import { buildFloorHeightFn } from './types'
import { buildRoomShell, addRoomLight, disposeScene } from './roomKit'
import { buildShelfUnit, buildFridgeCase, buildCheckoutCounter, type ShopInteractPoint } from './shopParts'
import { materializeSlots, type ProductSlot, GROCERY_CATALOG, MEAT_CATALOG, CLEANING_CATALOG } from './products'
import { buildClerkNpc } from './clerkNpc'
import { buildPlant } from './parts'

const WALL_H = 3.2
const W = 16
const D = 12

function byCategory(cat: string) {
  return GROCERY_CATALOG.filter((i) => i.category === cat)
}

/** A real grocery-store floor plan: aisles of shelving grouped by category, a refrigerated wall for dairy/meat, and a row of checkouts near the exit - large enough to feel like an actual supermarket rather than a corner store. */
export function buildSupermarketInterior(seed: number): InteriorBuild {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0d0d10)
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))

  const doorAt = W / 2
  const colliders: Collider[] = []
  const collidableMeshes: THREE.Object3D[] = []
  const allSlots: ProductSlot[] = []
  const interactables: InteriorInteractable[] = []

  const shell = buildRoomShell({
    x0: 0,
    x1: W,
    z0: 0,
    z1: D,
    floorY: 0,
    wallHeight: WALL_H,
    wallColor: 0xeceff2,
    floorColor: 0xd8dade,
    ceilingColor: 0xf5f5f0,
    openings: [{ wall: 'S', at: doorAt, width: 2.6 }],
    windows: [{ wall: 'N', at: W * 0.5, width: 3 }],
  })
  scene.add(shell.group)
  colliders.push(...shell.colliders)
  collidableMeshes.push(...shell.collidableMeshes)
  for (let i = 0; i < 6; i++) addRoomLight(shell.group, 2 + (i % 3) * 6, WALL_H - 0.3, 2.5 + Math.floor(i / 3) * 7, 0xffffff, 1.0, 8)

  // Storefront signage above the door, on the inside face so it reads on entry.
  const signCanvas = document.createElement('canvas')
  signCanvas.width = 512
  signCanvas.height = 128
  const sctx = signCanvas.getContext('2d')!
  sctx.fillStyle = '#1c7a3c'
  sctx.fillRect(0, 0, 512, 128)
  sctx.fillStyle = '#ffffff'
  sctx.font = 'bold 64px sans-serif'
  sctx.textAlign = 'center'
  sctx.textBaseline = 'middle'
  sctx.fillText('סופר-נבון', 256, 64)
  const signTex = new THREE.CanvasTexture(signCanvas)
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshStandardMaterial({ map: signTex, emissive: 0x114422, emissiveIntensity: 0.3 }))
  sign.position.set(doorAt, WALL_H - 0.6, D - 0.15)
  sign.rotation.y = Math.PI
  shell.group.add(sign)

  const addShelf = (cx: number, cz: number, rotY: number, length: number, tiers = byCategory('מוצרי מזון'), category = 'dry') => {
    const s = buildShelfUnit(cx, cz, 0, rotY, length, tiers)
    shell.group.add(s.group)
    colliders.push(...s.colliders)
    allSlots.push(...s.slots)
    s.interactPoints.forEach((p, i) => interactables.push(interactableFromPoint(p, `shelf-${category}-${cx}-${cz}-${i}`)))
  }
  const addFridge = (cx: number, cz: number, rotY: number, length: number, tiers: typeof GROCERY_CATALOG, category: string) => {
    const s = buildFridgeCase(cx, cz, 0, rotY, length, tiers)
    shell.group.add(s.group)
    colliders.push(...s.colliders)
    allSlots.push(...s.slots)
    s.interactPoints.forEach((p, i) => interactables.push(interactableFromPoint(p, `fridge-${category}-${cx}-${cz}-${i}`)))
  }

  // Produce aisle (vegetables) near the entrance - real stores put fresh
  // produce up front.
  addShelf(W * 0.22, D * 0.68, 0, 3.2, byCategory('ירקות'), 'produce')
  addShelf(W * 0.22, D * 0.42, 0, 3.2, byCategory('ירקות'), 'produce2')

  // Dry goods aisles, center of the store.
  addShelf(W * 0.5, D * 0.68, 0, 3.2, byCategory('מוצרי מזון'), 'dry1')
  addShelf(W * 0.5, D * 0.42, 0, 3.2, byCategory('מוצרי מזון'), 'dry2')
  addShelf(W * 0.5, D * 0.18, 0, 3.2, CLEANING_CATALOG.concat(byCategory('שתייה')), 'household')

  // Refrigerated wall along the back (dairy + meat).
  addFridge(W * 0.78, D * 0.7, 0, 3.4, byCategory('מוצרי חלב'), 'dairy')
  addFridge(W * 0.78, D * 0.4, 0, 3.2, MEAT_CATALOG.map((m) => ({ ...m })), 'meat')

  // Drinks aisle near the far wall.
  addShelf(W * 0.85, D * 0.14, Math.PI / 2, 3, byCategory('שתייה'), 'drinks')

  const plant = buildPlant(1.2, D - 1.2, 0)
  shell.group.add(plant.group)
  colliders.push(...plant.colliders)

  // ----- Checkout row near the exit. -----
  const checkoutZ = D - 2.0
  const checkoutXs = [doorAt - 3.2, doorAt + 3.2]
  checkoutXs.forEach((cx) => {
    const counter = buildCheckoutCounter(cx, checkoutZ, 0, Math.PI)
    shell.group.add(counter.group)
    colliders.push(...counter.colliders)
  })

  const npcs = [buildClerkNpc(new THREE.Vector3(checkoutXs[0], 0, checkoutZ - 0.55), 0, seed)]
  npcs.forEach((n) => shell.group.add(n.root))

  scene.add(...materializeSlots(allSlots))

  const heightAt = buildFloorHeightFn([{ kind: 'flat', xMin: 0, xMax: W, zMin: 0, zMax: D, y: 0 }])

  return {
    scene,
    colliders,
    collidableMeshes,
    heightAt,
    bounds: { minX: 0.2, maxX: W - 0.2, minZ: 0.2, maxZ: D - 0.2 },
    spawnPoint: new THREE.Vector3(doorAt, 0, D - 1.2),
    spawnFacing: Math.PI,
    exitPoint: { position: new THREE.Vector3(doorAt, 0, D - 0.7), radius: 1.6 },
    interactables,
    npcs,
    dispose: () => disposeScene(scene),
  }
}

function interactableFromPoint(p: ShopInteractPoint, id: string): InteriorInteractable {
  return {
    id,
    position: p.position,
    radius: 1.1,
    label: 'בדיקה',
    onInteract: () => ({ title: p.item.name, subtitle: `מחיר: ₪${p.item.price.toFixed(2)}` }),
  }
}
