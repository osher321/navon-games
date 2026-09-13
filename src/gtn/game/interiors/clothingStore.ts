import * as THREE from 'three'
import type { Collider } from '../collision'
import type { InteriorBuild, InteriorInteractable } from './types'
import { buildFloorHeightFn } from './types'
import { buildRoomShell, addRoomLight, disposeScene } from './roomKit'
import { buildClothingRack, buildCheckoutCounter, type ShopInteractPoint } from './shopParts'
import { materializeSlots, type ProductSlot, CLOTHING_CATALOG } from './products'
import { buildClerkNpc } from './clerkNpc'

const WALL_H = 3.0
const W = 11
const D = 9

/**
 * Racks of hung garments by category, a couple of fitting-room stalls, a
 * mirror, and a register - built as scaffolding for a future try-on/
 * purchase flow (`onInteract` already returns the exact item clicked, so a
 * later "buy" action just needs to plug into the same payload).
 */
export function buildClothingStoreInterior(seed: number): InteriorBuild {
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
    wallColor: 0xf2ecef,
    floorColor: 0xd9c9c0,
    ceilingColor: 0xf7f2f4,
    openings: [{ wall: 'S', at: doorAt, width: 2.2 }],
    windows: [{ wall: 'S', at: doorAt - 2.6, width: 1.6 }, { wall: 'S', at: doorAt + 2.6, width: 1.6 }],
  })
  scene.add(shell.group)
  colliders.push(...shell.colliders)
  collidableMeshes.push(...shell.collidableMeshes)
  addRoomLight(shell.group, W * 0.3, WALL_H - 0.3, D * 0.5, 0xffffff, 1.0, 8)
  addRoomLight(shell.group, W * 0.7, WALL_H - 0.3, D * 0.5, 0xffffff, 1.0, 8)

  const addRack = (cx: number, cz: number, rotY: number, length: number, item: (typeof CLOTHING_CATALOG)[number], id: string) => {
    const r = buildClothingRack(cx, cz, 0, rotY, length, item)
    shell.group.add(r.group)
    colliders.push(...r.colliders)
    allSlots.push(...r.slots)
    r.interactPoints.forEach((p, i) => interactables.push(interactableFromPoint(p, `${id}-${i}`)))
  }

  addRack(W * 0.22, D * 0.7, 0, 2.4, CLOTHING_CATALOG[0], 'shirts')
  addRack(W * 0.5, D * 0.7, 0, 2.4, CLOTHING_CATALOG[1], 'pants')
  addRack(W * 0.22, D * 0.4, 0, 2.4, CLOTHING_CATALOG[2], 'coats')
  addRack(W * 0.5, D * 0.4, 0, 2.4, CLOTHING_CATALOG[3], 'dresses')

  // Shoe display - a low shelf-like unit, reusing shelf slots visually as boxed shoes.
  const shoeShelf = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 0.5), new THREE.MeshStandardMaterial({ color: 0xcfd2d6 }))
  shoeShelf.position.set(W * 0.78, 0.45, D * 0.68)
  shell.group.add(shoeShelf)
  colliders.push({ minX: W * 0.78 - 1.1, maxX: W * 0.78 + 1.1, minZ: D * 0.68 - 0.25, maxZ: D * 0.68 + 0.25 })
  interactables.push({
    id: 'shoes',
    position: new THREE.Vector3(W * 0.78, 0.6, D * 0.68),
    radius: 1.1,
    label: 'בדיקה',
    onInteract: () => ({ title: CLOTHING_CATALOG[4].name, subtitle: `מחיר: ₪${CLOTHING_CATALOG[4].price.toFixed(2)}` }),
  })

  // Hats/bags table.
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 0.7), new THREE.MeshStandardMaterial({ color: 0x8a6a44 }))
  table.position.set(W * 0.78, 0.375, D * 0.4)
  shell.group.add(table)
  colliders.push({ minX: W * 0.78 - 0.8, maxX: W * 0.78 + 0.8, minZ: D * 0.4 - 0.35, maxZ: D * 0.4 + 0.35 })
  interactables.push({
    id: 'hats',
    position: new THREE.Vector3(W * 0.78, 0.9, D * 0.4),
    radius: 1.1,
    label: 'בדיקה',
    onInteract: () => ({ title: CLOTHING_CATALOG[5].name, subtitle: `מחיר: ₪${CLOTHING_CATALOG[5].price.toFixed(2)}` }),
  })

  // Fitting-room stalls along the back wall, plus a mirror out front.
  for (let i = 0; i < 2; i++) {
    const stallX = W * 0.15 + i * 1.6
    const stall = new THREE.Mesh(new THREE.BoxGeometry(1.3, WALL_H * 0.85, 1.3), new THREE.MeshStandardMaterial({ color: 0xd9488f, roughness: 0.9 }))
    stall.position.set(stallX, (WALL_H * 0.85) / 2, D - 1.0)
    shell.group.add(stall)
    colliders.push({ minX: stallX - 0.6, maxX: stallX + 0.6, minZ: D - 1.65, maxZ: D - 0.35 })
  }
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.7), new THREE.MeshStandardMaterial({ color: 0xdfe8ee, metalness: 0.6, roughness: 0.15 }))
  mirror.position.set(W * 0.5, 1.0, D - 0.25)
  mirror.rotation.y = Math.PI
  shell.group.add(mirror)

  const checkout = buildCheckoutCounter(doorAt - 3.2, 1.2, 0, 0)
  shell.group.add(checkout.group)
  colliders.push(...checkout.colliders)
  const npcs = [buildClerkNpc(new THREE.Vector3(doorAt - 3.2, 0, 0.6), Math.PI, seed)]
  npcs.forEach((n) => shell.group.add(n.root))

  scene.add(...materializeSlots(allSlots))

  const heightAt = buildFloorHeightFn([{ kind: 'flat', xMin: 0, xMax: W, zMin: 0, zMax: D, y: 0 }])

  return {
    scene,
    colliders,
    collidableMeshes,
    heightAt,
    bounds: { minX: 0.2, maxX: W - 0.2, minZ: 0.2, maxZ: D - 0.2 },
    spawnPoint: new THREE.Vector3(doorAt, 0, D - 1.1),
    spawnFacing: Math.PI,
    exitPoint: { position: new THREE.Vector3(doorAt, 0, D - 0.6), radius: 1.4 },
    interactables,
    npcs,
    dispose: () => disposeScene(scene),
  }
}

function interactableFromPoint(p: ShopInteractPoint, id: string): InteriorInteractable {
  return {
    id,
    position: p.position,
    radius: 1.0,
    label: 'בדיקה',
    onInteract: () => ({ title: p.item.name, subtitle: `מחיר: ₪${p.item.price.toFixed(2)}` }),
  }
}
