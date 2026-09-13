import * as THREE from 'three'
import type { Collider } from '../collision'
import type { LiveActor } from '../regions/types'

/**
 * A rectangular region of an interior's floor, either a flat plane at a
 * fixed height or a ramp that interpolates height along Z between two
 * values - this one small data shape is all that's needed to build a real
 * walkable staircase (a ramp zone) alongside flat ground/upper floors,
 * without a full 3D navmesh. Zones are checked in order; the first match
 * wins, so a ramp that cuts through a floor should be listed before it.
 */
export type FloorZone =
  | { kind: 'flat'; xMin: number; xMax: number; zMin: number; zMax: number; y: number }
  | { kind: 'rampZ'; xMin: number; xMax: number; zMin: number; zMax: number; yStart: number; yEnd: number }

export function buildFloorHeightFn(zones: FloorZone[]): (x: number, z: number) => number {
  return (x: number, z: number) => {
    for (const zone of zones) {
      if (x < zone.xMin || x > zone.xMax || z < zone.zMin || z > zone.zMax) continue
      if (zone.kind === 'flat') return zone.y
      const t = Math.max(0, Math.min(1, (z - zone.zMin) / (zone.zMax - zone.zMin)))
      return zone.yStart + (zone.yEnd - zone.yStart) * t
    }
    return 0
  }
}

/**
 * A two-story building's ground and upper floor almost always share the
 * exact same footprint (the upper floor sits directly above the ground
 * floor) - a plain `FloorZone` list can't tell those apart, since a flat
 * zone covering the whole room would match at every (x, z) regardless of
 * which floor the player is notionally standing on. This tracks which
 * floor the player is currently on as real state (not derived purely from
 * position), flipping only once they've walked the *entire* ramp - so
 * stepping off the top of the stairs correctly keeps them on the upper
 * floor's zones instead of snapping back down to the ground floor's.
 */
/** Shared floor-state flag - also read by the caller to pick the matching (ground- vs upper-floor) collider set, since a 2D collider box has the exact same "which floor is this really on" ambiguity as the height field does. */
export interface StairwellState {
  onUpper: boolean
}

export function buildStairwellHeightFn(
  groundZones: FloorZone[],
  upperZones: FloorZone[],
  ramp: { xMin: number; xMax: number; zMin: number; zMax: number; yStart: number; yEnd: number },
  state: StairwellState
): (x: number, z: number) => number {
  const flat = (zones: FloorZone[], x: number, z: number, fallback: number) => {
    for (const zone of zones) {
      if (x < zone.xMin || x > zone.xMax || z < zone.zMin || z > zone.zMax) continue
      if (zone.kind === 'flat') return zone.y
      const t = Math.max(0, Math.min(1, (z - zone.zMin) / (zone.zMax - zone.zMin)))
      return zone.yStart + (zone.yEnd - zone.yStart) * t
    }
    return fallback
  }
  return (x: number, z: number) => {
    if (x >= ramp.xMin && x <= ramp.xMax && z >= ramp.zMin && z <= ramp.zMax) {
      const t = Math.max(0, Math.min(1, (z - ramp.zMin) / (ramp.zMax - ramp.zMin)))
      // Commits as soon as the player is past the ramp's midpoint, not only
      // once they're nearly all the way across it - a narrow near-the-top
      // commit zone is easy to step clean over in a single frame at normal
      // walk/run speed (or between two coarse position samples), which
      // would leave the flag never set. Committing at the midpoint needs a
      // single frame to cover half the ramp's length to misfire, which
      // doesn't happen at any speed this game moves the player at.
      state.onUpper = t >= 0.5
      return ramp.yStart + (ramp.yEnd - ramp.yStart) * t
    }
    return flat(state.onUpper ? upperZones : groundZones, x, z, state.onUpper ? ramp.yEnd : 0)
  }
}

/** A single "look at this" point inside an interior - a shelf slot, a rack, a car, a till. Deliberately generic (not "a product") so every specialty store's items reuse the exact same prompt/E-press wiring, and a future kind just adds another `onInteract` payload shape. */
export interface InteriorInteractable {
  id: string
  position: THREE.Vector3
  radius: number
  /** Shown in the on-screen prompt, e.g. "בדיקה" - the "E - " prefix is added by the UI. */
  label: string
  onInteract: () => { title: string; subtitle: string } | null
}

/** What building an interior's `build()` hands back - a self-contained scene plus everything GameCanvas needs to drop the player into it and drive movement/camera/collision exactly like outdoors. */
export interface InteriorBuild {
  scene: THREE.Scene
  colliders: Collider[]
  collidableMeshes: THREE.Object3D[]
  heightAt: (x: number, z: number) => number
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
  spawnPoint: THREE.Vector3
  spawnFacing: number
  exitPoint: { position: THREE.Vector3; radius: number }
  interactables: InteriorInteractable[]
  npcs: LiveActor[]
  dispose: () => void
}

/**
 * Every enterable building kind in the city. Open-ended on purpose - adding
 * a future kind (restaurant, hotel, bank, ...) means one more entry here
 * plus one more `build()` in the registry, not a change to how doors,
 * movement, camera or collision work.
 */
export type BuildingKind =
  | 'house'
  | 'apartments'
  | 'office'
  | 'supermarket'
  | 'clothing'
  | 'gunshop'
  | 'cardealer'
  | 'genericShop'

export interface InteriorDef {
  id: string
  kind: BuildingKind
  build: () => InteriorBuild
}

/** Placement data for one enterable building's exterior door - pure data (like a vehicle spawn), not a mesh, so GameCanvas can build the unified "nearest door" scan the same way it already does for vehicles. */
export interface BuildingEntranceSpawn {
  id: string
  kind: BuildingKind
  interiorId: string
  doorPosition: THREE.Vector3
  doorFacing: number
  label: string
}
