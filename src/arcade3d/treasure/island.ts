import * as THREE from 'three'
import type { Collider } from '../../gtn/game/collision'

export type PickupKind = 'key' | 'scroll'
export interface Pickup {
  id: string
  kind: PickupKind
  color?: number
  mesh: THREE.Object3D
  position: THREE.Vector3
  collected: boolean
  hint?: string
}

export interface Stone {
  order: number
  mesh: THREE.Mesh
  position: THREE.Vector3
  color: number
}

export interface IslandWorld {
  group: THREE.Group
  colliders: Collider[]
  pickups: Pickup[]
  stones: Stone[]
  gateGroup: THREE.Group
  gatePosition: THREE.Vector3
  chestMesh: THREE.Mesh
  chestPosition: THREE.Vector3
  caveEntrance: THREE.Vector3
  playerStart: THREE.Vector3
}

function rockMesh(size: number, color = 0x8a8f94) {
  const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }))
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function keyMesh(color: number) {
  const g = new THREE.Group()
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 8, 16), new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.25, emissive: color, emissiveIntensity: 0.3 }))
  g.add(ring)
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.25 }))
  shaft.position.y = -0.35
  g.add(shaft)
  g.position.y = 0.9
  return g
}

function scrollMesh() {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 10), new THREE.MeshStandardMaterial({ color: 0xe8d9a8, roughness: 0.8 }))
  mesh.rotation.z = Math.PI / 2
  mesh.position.y = 0.7
  return mesh
}

export function buildIsland(): IslandWorld {
  const group = new THREE.Group()
  const colliders: Collider[] = []

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ color: 0xdcc27a, roughness: 0.95 }))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  group.add(ground)

  // Scattered decorative rocks + a handful that actually collide, so
  // walking around them feels purposeful rather than every rock being
  // pure decoration.
  const rockSpots: [number, number, number][] = [
    [10, 1, -6],
    [-14, 1.2, 8],
    [18, 0.9, 14],
    [-8, 1, -18],
    [22, 1.1, -12],
  ]
  for (const [x, size, z] of rockSpots) {
    const r = rockMesh(size)
    r.position.set(x, size * 0.6, z)
    group.add(r)
    colliders.push({ minX: x - size, maxX: x + size, minZ: z - size, maxZ: z + size })
  }

  // Trees (palm-ish: trunk + a green sphere canopy) - decorative, no collision (keeps the collider list small and movement forgiving).
  const treeSpots: [number, number][] = [
    [6, 6],
    [-6, -10],
    [14, -20],
    [-16, -4],
    [2, -24],
  ]
  for (const [x, z] of treeSpots) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.9 }))
    trunk.position.set(x, 1.6, z)
    trunk.castShadow = true
    group.add(trunk)
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), new THREE.MeshStandardMaterial({ color: 0x3f8f4f, roughness: 0.85 }))
    canopy.position.set(x, 3.6, z)
    canopy.castShadow = true
    group.add(canopy)
  }

  // Cave - a simple enclosed box with an open doorway, big enough to walk into.
  const caveCenter = new THREE.Vector3(-24, 0, -22)
  const caveMat = new THREE.MeshStandardMaterial({ color: 0x5a5347, roughness: 0.95 })
  const caveWallThickness = 1
  const caveSize = 8
  // Back + two side walls; the front stays open as the entrance.
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(caveSize, 5, caveWallThickness), caveMat)
  backWall.position.set(caveCenter.x, 2.5, caveCenter.z - caveSize / 2)
  group.add(backWall)
  colliders.push({ minX: caveCenter.x - caveSize / 2, maxX: caveCenter.x + caveSize / 2, minZ: backWall.position.z - 0.6, maxZ: backWall.position.z + 0.6 })
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(caveWallThickness, 5, caveSize), caveMat)
  leftWall.position.set(caveCenter.x - caveSize / 2, 2.5, caveCenter.z)
  group.add(leftWall)
  colliders.push({ minX: leftWall.position.x - 0.6, maxX: leftWall.position.x + 0.6, minZ: caveCenter.z - caveSize / 2, maxZ: caveCenter.z + caveSize / 2 })
  const rightWall = leftWall.clone()
  rightWall.position.set(caveCenter.x + caveSize / 2, 2.5, caveCenter.z)
  group.add(rightWall)
  colliders.push({ minX: rightWall.position.x - 0.6, maxX: rightWall.position.x + 0.6, minZ: caveCenter.z - caveSize / 2, maxZ: caveCenter.z + caveSize / 2 })
  const roof = new THREE.Mesh(new THREE.BoxGeometry(caveSize, caveWallThickness, caveSize), caveMat)
  roof.position.set(caveCenter.x, 5, caveCenter.z)
  group.add(roof)

  const caveEntrance = new THREE.Vector3(caveCenter.x, 0, caveCenter.z + caveSize / 2 - 1)

  // Keys.
  const pickups: Pickup[] = []
  const keyDefs: { id: string; color: number; pos: THREE.Vector3 }[] = [
    { id: 'key-red', color: 0xd6392f, pos: new THREE.Vector3(8, 0, -4) },
    { id: 'key-blue', color: 0x2f6fd6, pos: new THREE.Vector3(-12, 0, 10) },
    { id: 'key-green', color: 0x3fae55, pos: new THREE.Vector3(caveCenter.x, 0, caveCenter.z) },
  ]
  for (const def of keyDefs) {
    const mesh = keyMesh(def.color)
    mesh.position.x = def.pos.x
    mesh.position.z = def.pos.z
    group.add(mesh)
    pickups.push({ id: def.id, kind: 'key', color: def.color, mesh, position: def.pos.clone(), collected: false })
  }

  // Hint scrolls.
  const scrollDefs: { id: string; pos: THREE.Vector3; hint: string }[] = [
    { id: 'scroll-1', pos: new THREE.Vector3(16, 0, 12), hint: 'רמז: שער האוצר נמצא במרכז האי, מוקף באבני דריכה.' },
    { id: 'scroll-2', pos: new THREE.Vector3(-8, 0, -16), hint: 'רמז: יש לדרוך על אבני הדריכה בסדר עולה - מהקטנה לגדולה.' },
  ]
  for (const def of scrollDefs) {
    const mesh = scrollMesh()
    mesh.position.x = def.pos.x
    mesh.position.z = def.pos.z
    group.add(mesh)
    pickups.push({ id: def.id, kind: 'scroll', mesh, position: def.pos.clone(), collected: false, hint: def.hint })
  }

  // Pressure-plate stones near the gate - step on in ascending size order.
  const gatePosition = new THREE.Vector3(0, 0, 0)
  const stoneColors = [0xcd7f32, 0xc0c0c0, 0xffd700]
  const stones: Stone[] = []
  for (let i = 0; i < 3; i++) {
    const pos = new THREE.Vector3(-3 + i * 3, 0, 8)
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.15, 16), new THREE.MeshStandardMaterial({ color: stoneColors[i], metalness: 0.4, roughness: 0.4 }))
    mesh.position.copy(pos)
    mesh.position.y = 0.08
    mesh.receiveShadow = true
    group.add(mesh)
    stones.push({ order: i, mesh, position: pos, color: stoneColors[i] })
  }

  // Gate - two pillars + a closed door slab, opens (slides down) once unlocked.
  const gateGroup = new THREE.Group()
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x9a8f6f, roughness: 0.8 })
  const pillarL = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 1), pillarMat)
  pillarL.position.set(-3, 2.5, 3)
  gateGroup.add(pillarL)
  const pillarR = pillarL.clone()
  pillarR.position.set(3, 2.5, 3)
  gateGroup.add(pillarR)
  const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 0.6), new THREE.MeshStandardMaterial({ color: 0x6b5a3f, roughness: 0.7 }))
  doorMesh.position.set(0, 2.5, 3)
  doorMesh.name = 'gateDoor'
  gateGroup.add(doorMesh)
  group.add(gateGroup)
  colliders.push({ minX: -3.5, maxX: 3.5, minZ: 2.6, maxZ: 3.4 })

  // Treasure chest, behind the gate.
  const chestPosition = new THREE.Vector3(0, 0, -8)
  const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 1.1), new THREE.MeshStandardMaterial({ color: 0x8a5a2f, roughness: 0.7, metalness: 0.1 }))
  chestMesh.position.copy(chestPosition)
  chestMesh.position.y = 0.5
  const chestLid = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.4, 1.2), new THREE.MeshStandardMaterial({ color: 0xffd23f, metalness: 0.6, roughness: 0.3, emissive: 0x997700, emissiveIntensity: 0.3 }))
  chestLid.position.set(chestPosition.x, 1.15, chestPosition.z)
  group.add(chestMesh)
  group.add(chestLid)

  return {
    group,
    colliders,
    pickups,
    stones,
    gateGroup,
    gatePosition,
    chestMesh,
    chestPosition,
    caveEntrance,
    playerStart: new THREE.Vector3(0, 0, 16),
  }
}
