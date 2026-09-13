import * as THREE from 'three'
import type { Collider } from '../collision'

/**
 * The one shared "build a walkable room" primitive every interior (house,
 * supermarket, gun shop, dealership, generic office lobby, and any future
 * kind) is composed from - walls with real door gaps (the player actually
 * walks through empty space, not a texture), a floor, a ceiling, and
 * decorative window insets. Reused instead of hand-placing wall meshes
 * per building, which is what makes "every building in the city" tractable
 * without hand-authoring each one.
 */

export interface WallOpening {
  wall: 'N' | 'S' | 'E' | 'W'
  /** Absolute world coordinate along the wall's own axis (X for N/S walls, Z for E/W walls) - the gap's center. */
  at: number
  width: number
  /** Door height - above it, a header strip fills the wall up to the ceiling. Defaults to a standard door height. */
  height?: number
}

export interface WindowSpec {
  wall: 'N' | 'S' | 'E' | 'W'
  at: number
  width: number
}

export interface RoomSpec {
  x0: number
  x1: number
  z0: number
  z1: number
  floorY: number
  wallHeight: number
  wallThickness?: number
  wallColor: number
  floorColor: number
  ceilingColor?: number
  openings?: WallOpening[]
  windows?: WindowSpec[]
  /** Skip building the floor slab - used for an upper floor whose "floor" is really the ceiling of the room below it, already built once. */
  skipFloor?: boolean
}

const DEFAULT_DOOR_HEIGHT = 2.15

function wallMat(color: number) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.03 })
}

/**
 * Builds one straight wall segment running along its own axis from `a0` to
 * `a1` (world coordinate along that axis), with at most one door gap and
 * any number of decorative window insets. Returns both the meshes and the
 * XZ colliders for the solid parts only - the gap itself is left open.
 */
function buildWallRun(
  axis: 'x' | 'z',
  fixedCoord: number,
  a0: number,
  a1: number,
  thickness: number,
  floorY: number,
  height: number,
  color: number,
  opening: WallOpening | undefined,
  windows: WindowSpec[]
): { group: THREE.Group; colliders: Collider[] } {
  const group = new THREE.Group()
  const colliders: Collider[] = []
  const mat = wallMat(color)
  const half = thickness / 2

  const addSegment = (segA0: number, segA1: number, segY0: number, segY1: number) => {
    const len = segA1 - segA0
    const h = segY1 - segY0
    if (len <= 0.02 || h <= 0.02) return
    const cA = (segA0 + segA1) / 2
    const cY = segY0 + h / 2
    let mesh: THREE.Mesh
    let collider: Collider | null = null
    if (axis === 'x') {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(len, h, thickness), mat)
      mesh.position.set(cA, floorY + cY, fixedCoord)
      collider = { minX: segA0, maxX: segA1, minZ: fixedCoord - half, maxZ: fixedCoord + half }
    } else {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(thickness, h, len), mat)
      mesh.position.set(fixedCoord, floorY + cY, cA)
      collider = { minX: fixedCoord - half, maxX: fixedCoord + half, minZ: segA0, maxZ: segA1 }
    }
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    // Only the door-height header strip is skipped from collision when it
    // sits above a gap that's actually open at ground level - everything
    // else (including that same header) is solid, so always register it.
    colliders.push(collider)
  }

  if (!opening) {
    addSegment(a0, a1, 0, height)
  } else {
    const gapStart = opening.at - opening.width / 2
    const gapEnd = opening.at + opening.width / 2
    const doorH = opening.height ?? DEFAULT_DOOR_HEIGHT
    addSegment(a0, Math.max(a0, gapStart), 0, height)
    addSegment(Math.min(a1, gapEnd), a1, 0, height)
    // Header above the doorway, only if the door doesn't already reach the ceiling.
    if (doorH < height) addSegment(Math.max(a0, gapStart), Math.min(a1, gapEnd), doorH, height)
  }

  // Decorative window insets - a flat lighter panel proud of the wall face,
  // not an actual hole (kept simple: no glass geometry/collision split).
  const winMat = new THREE.MeshStandardMaterial({ color: 0xbfe3ff, roughness: 0.25, metalness: 0.1, emissive: 0x223344, emissiveIntensity: 0.15 })
  for (const w of windows) {
    const wy = floorY + height * 0.52
    const inset = thickness / 2 + 0.02
    let pane: THREE.Mesh
    if (axis === 'x') {
      pane = new THREE.Mesh(new THREE.PlaneGeometry(w.width, height * 0.4), winMat)
      pane.position.set(w.at, wy, fixedCoord + (fixedCoord < 0 ? -inset : inset))
    } else {
      pane = new THREE.Mesh(new THREE.PlaneGeometry(w.width, height * 0.4), winMat)
      pane.rotation.y = Math.PI / 2
      pane.position.set(fixedCoord + (fixedCoord < 0 ? -inset : inset), wy, w.at)
    }
    group.add(pane)
  }

  return { group, colliders }
}

export function buildRoomShell(spec: RoomSpec): { group: THREE.Group; colliders: Collider[]; collidableMeshes: THREE.Object3D[] } {
  const t = spec.wallThickness ?? 0.18
  const group = new THREE.Group()
  const colliders: Collider[] = []
  const collidableMeshes: THREE.Object3D[] = []

  if (!spec.skipFloor) {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(spec.x1 - spec.x0, 0.1, spec.z1 - spec.z0), new THREE.MeshStandardMaterial({ color: spec.floorColor, roughness: 0.85 }))
    floor.position.set((spec.x0 + spec.x1) / 2, spec.floorY - 0.05, (spec.z0 + spec.z1) / 2)
    floor.receiveShadow = true
    group.add(floor)
  }

  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(spec.x1 - spec.x0, 0.1, spec.z1 - spec.z0),
    new THREE.MeshStandardMaterial({ color: spec.ceilingColor ?? 0xf2f0ea, roughness: 0.95 })
  )
  ceiling.position.set((spec.x0 + spec.x1) / 2, spec.floorY + spec.wallHeight + 0.05, (spec.z0 + spec.z1) / 2)
  ceiling.receiveShadow = true
  group.add(ceiling)

  const openings = spec.openings ?? []
  const windows = spec.windows ?? []
  const wallDefs: { wall: 'N' | 'S' | 'E' | 'W'; axis: 'x' | 'z'; fixed: number; a0: number; a1: number }[] = [
    { wall: 'N', axis: 'x', fixed: spec.z0, a0: spec.x0, a1: spec.x1 },
    { wall: 'S', axis: 'x', fixed: spec.z1, a0: spec.x0, a1: spec.x1 },
    { wall: 'W', axis: 'z', fixed: spec.x0, a0: spec.z0, a1: spec.z1 },
    { wall: 'E', axis: 'z', fixed: spec.x1, a0: spec.z0, a1: spec.z1 },
  ]

  for (const w of wallDefs) {
    const opening = openings.find((o) => o.wall === w.wall)
    const wallWindows = windows.filter((x) => x.wall === w.wall)
    const built = buildWallRun(w.axis, w.fixed, w.a0, w.a1, t, spec.floorY, spec.wallHeight, spec.wallColor, opening, wallWindows)
    group.add(built.group)
    colliders.push(...built.colliders)
    collidableMeshes.push(built.group)
  }

  return { group, colliders, collidableMeshes }
}

/** A single interior light - point lights are cheap indoors since only one interior scene is ever active at a time. */
export function addRoomLight(group: THREE.Group, x: number, y: number, z: number, color = 0xfff2d0, intensity = 1.1, distance = 9) {
  const light = new THREE.PointLight(color, intensity, distance, 2)
  light.position.set(x, y, z)
  group.add(light)
  const fixture = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: 0xfff8e0, emissive: 0xfff2c0, emissiveIntensity: 1.2 }))
  fixture.position.set(x, y, z)
  group.add(fixture)
}

/** Frees every mesh/instanced-mesh's geometry+material in a scene - called when an interior streams out, mirroring how `RegionManager` already disposes an unloaded district's meshes. */
export function disposeScene(scene: THREE.Scene) {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
      obj.geometry.dispose()
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((m) => m.dispose())
    }
  })
}
