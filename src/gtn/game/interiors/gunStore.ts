import * as THREE from 'three'
import type { Collider } from '../collision'
import type { InteriorBuild, InteriorInteractable } from './types'
import { buildFloorHeightFn } from './types'
import { buildRoomShell, addRoomLight, disposeScene } from './roomKit'
import { buildWeaponVitrine, buildCheckoutCounter } from './shopParts'
import { WEAPON_CATALOG } from './products'
import { buildClerkNpc } from './clerkNpc'

const WALL_H = 3.0
const W = 10
const D = 8

/**
 * A weapons counter/vitrine store - infrastructure for the future "browse,
 * choose, buy, receive into inventory" flow the existing GTN weapon system
 * (`WeaponSystem`/`WEAPON_CONFIGS`) will eventually plug into. Every item
 * on display is original/fictional (see `products.ts`'s WEAPON_CATALOG) -
 * no real manufacturer names or logos.
 */
export function buildGunStoreInterior(seed: number): InteriorBuild {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0d0d10)
  scene.add(new THREE.AmbientLight(0xffffff, 0.5))

  const doorAt = W / 2
  const colliders: Collider[] = []
  const collidableMeshes: THREE.Object3D[] = []
  const interactables: InteriorInteractable[] = []

  const shell = buildRoomShell({
    x0: 0,
    x1: W,
    z0: 0,
    z1: D,
    floorY: 0,
    wallHeight: WALL_H,
    wallColor: 0x2c2c30,
    floorColor: 0x3a3a3f,
    ceilingColor: 0x1c1c1f,
    openings: [{ wall: 'S', at: doorAt, width: 1.9 }],
  })
  scene.add(shell.group)
  colliders.push(...shell.colliders)
  collidableMeshes.push(...shell.collidableMeshes)
  addRoomLight(shell.group, W * 0.35, WALL_H - 0.3, D * 0.5, 0xd0e0ff, 1.1, 8)
  addRoomLight(shell.group, W * 0.7, WALL_H - 0.3, D * 0.5, 0xd0e0ff, 1.1, 8)

  const smallGuns = WEAPON_CATALOG.filter((w) => w.name.includes('אקדח') || w.name.includes('תחמושת'))
  const longGuns = WEAPON_CATALOG.filter((w) => w.name.includes('רובה') || w.name.includes('מיניגן'))

  const vitrineA = buildWeaponVitrine(W * 0.25, D * 0.7, 0, 0, 3.2, longGuns)
  shell.group.add(vitrineA.group)
  colliders.push(...vitrineA.colliders)
  vitrineA.interactPoints.forEach((p, i) =>
    interactables.push({
      id: `long-${i}`,
      position: p.position,
      radius: 1.0,
      label: 'בדיקה',
      onInteract: () => ({ title: p.item.name, subtitle: `מחיר: ₪${p.item.price}` }),
    })
  )

  const vitrineB = buildWeaponVitrine(W * 0.7, D * 0.7, 0, 0, 2.6, smallGuns)
  shell.group.add(vitrineB.group)
  colliders.push(...vitrineB.colliders)
  vitrineB.interactPoints.forEach((p, i) =>
    interactables.push({
      id: `small-${i}`,
      position: p.position,
      radius: 1.0,
      label: 'בדיקה',
      onInteract: () => ({ title: p.item.name, subtitle: `מחיר: ₪${p.item.price}` }),
    })
  )

  // A couple of standing racks of rifles as background dressing (not individually interactable - the vitrines above already cover every catalog item).
  const rackMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1f, metalness: 0.6, roughness: 0.4 })
  for (let i = 0; i < 4; i++) {
    const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.06), rackMat)
    rifle.position.set(W - 0.5, 0.9, D * 0.25 + i * 0.35)
    rifle.rotation.z = 0.08
    shell.group.add(rifle)
  }

  const counter = buildCheckoutCounter(doorAt, D * 0.25, 0, 0)
  shell.group.add(counter.group)
  colliders.push(...counter.colliders)
  const npcs = [buildClerkNpc(new THREE.Vector3(doorAt, 0, D * 0.25 - 0.55), Math.PI, seed)]
  npcs.forEach((n) => shell.group.add(n.root))

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
