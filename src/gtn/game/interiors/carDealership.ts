import * as THREE from 'three'
import type { Collider } from '../collision'
import type { InteriorBuild, InteriorInteractable } from './types'
import { buildFloorHeightFn } from './types'
import { buildRoomShell, addRoomLight, disposeScene } from './roomKit'
import { buildCheckoutCounter } from './shopParts'
import { buildClerkNpc } from './clerkNpc'
import { buildCar, buildMotorcycle } from '../vehicles/models'

const WALL_H = 4.2
const W = 16
const D = 12

interface DisplayVehicle {
  build: () => THREE.Group
  name: string
  price: number
}

/**
 * A real showroom floor - full-size car/motorcycle models on display
 * pedestals, built from the exact same `buildCar`/`buildMotorcycle` used by
 * the outdoor `VehicleSystem` (not a separate asset set), so a future "buy"
 * action can hand the player a genuine, driveable `VehicleConfig` instance
 * instead of a lookalike showroom prop.
 */
export function buildCarDealershipInterior(seed: number): InteriorBuild {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0d0d10)
  scene.add(new THREE.AmbientLight(0xffffff, 0.65))

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
    wallColor: 0xf0f0f2,
    floorColor: 0xc9ccd1,
    ceilingColor: 0xfafafc,
    openings: [{ wall: 'S', at: doorAt, width: 4.5, height: WALL_H * 0.9 }],
    windows: [{ wall: 'S', at: doorAt - 5, width: 1.8 }, { wall: 'S', at: doorAt + 5, width: 1.8 }],
  })
  scene.add(shell.group)
  colliders.push(...shell.colliders)
  collidableMeshes.push(...shell.collidableMeshes)
  for (let i = 0; i < 4; i++) addRoomLight(shell.group, 3 + i * 3.5, WALL_H - 0.4, D * 0.5, 0xffffff, 1.2, 10)

  const displays: DisplayVehicle[] = [
    { build: () => buildCar(0xd63f3f), name: 'מכונית ספורט', price: 89000 },
    { build: () => buildCar(0x3fae55), name: 'מכונית משפחתית', price: 62000 },
    { build: () => buildMotorcycle(0x2c2c2c), name: 'אופנוע כביש', price: 34000 },
    { build: () => buildCar(0xe0b23f), name: 'מכונית יוקרה', price: 145000 },
  ]

  const spotXs = [W * 0.2, W * 0.42, W * 0.64, W * 0.85]
  displays.forEach((d, i) => {
    const cx = spotXs[i]
    const cz = D * 0.45
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.35, 0.12, 24), new THREE.MeshStandardMaterial({ color: 0x2c2c2f, roughness: 0.4, metalness: 0.3 }))
    pedestal.position.set(cx, 0.06, cz)
    pedestal.receiveShadow = true
    shell.group.add(pedestal)
    colliders.push({ minX: cx - 1.3, maxX: cx + 1.3, minZ: cz - 1.3, maxZ: cz + 1.3 })

    const model = d.build()
    model.position.set(cx, 0.12, cz)
    model.rotation.y = (seed + i) % 2 === 0 ? 0.3 : -0.3
    shell.group.add(model)

    interactables.push({
      id: `car-${i}`,
      position: new THREE.Vector3(cx, 0.6, cz),
      radius: 1.8,
      label: 'צפייה ברכב',
      onInteract: () => ({ title: d.name, subtitle: `מחיר: ₪${d.price.toLocaleString()}` }),
    })
  })

  // Office nook at the back corner, plus the sales counter near the entrance.
  const officeDesk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 0.7), new THREE.MeshStandardMaterial({ color: 0x6b4a32 }))
  officeDesk.position.set(W - 1.2, 0.375, D - 1.0)
  shell.group.add(officeDesk)
  colliders.push({ minX: W - 2.0, maxX: W - 0.4, minZ: D - 1.35, maxZ: D - 0.65 })

  const counter = buildCheckoutCounter(doorAt, 1.4, 0, 0)
  shell.group.add(counter.group)
  colliders.push(...counter.colliders)
  const npcs = [buildClerkNpc(new THREE.Vector3(doorAt, 0, 0.8), Math.PI, seed)]
  npcs.forEach((n) => shell.group.add(n.root))

  const heightAt = buildFloorHeightFn([{ kind: 'flat', xMin: 0, xMax: W, zMin: 0, zMax: D, y: 0 }])

  return {
    scene,
    colliders,
    collidableMeshes,
    heightAt,
    bounds: { minX: 0.2, maxX: W - 0.2, minZ: 0.2, maxZ: D - 0.2 },
    spawnPoint: new THREE.Vector3(doorAt, 0, D - 1.6),
    spawnFacing: Math.PI,
    exitPoint: { position: new THREE.Vector3(doorAt, 0, D - 0.9), radius: 2.0 },
    interactables,
    npcs,
    dispose: () => disposeScene(scene),
  }
}
