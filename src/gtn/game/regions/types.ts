import type * as THREE from 'three'
import type { Collider } from '../collision'
import type { TrafficVehicle } from '../traffic'
import type { BuildingEntranceSpawn } from '../interiors/types'

/** Anything that needs a per-frame update while its owning region is active - an NPC or a looping traffic car. */
export interface LiveActor {
  root: THREE.Object3D
  update(dt: number, elapsed: number): void
}

/** What a region's `build()` hands back - shaped like the existing `CityBuild` so nothing about how colliders/meshes get consumed has to change. */
export interface RegionBuild {
  group: THREE.Group
  colliders: Collider[]
  collidableMeshes: THREE.Object3D[]
  npcs: LiveActor[]
  /** Typed as the richer `TrafficVehicle` (not just `LiveActor`) so GameCanvas can also treat every region's traffic as mountable vehicle instances, not only something it ticks each frame. */
  traffic: TrafficVehicle[]
  /** Every enterable building's door in this region - folded into GameCanvas's unified "nearest door" scan alongside the always-on core city's entrances. */
  buildingEntrances: BuildingEntranceSpawn[]
}

/**
 * One streamable district. `bounds` is a plain world-space rectangle (not a
 * derived chunk-grid coordinate) so placement is exactly as easy to reason
 * about and verify as the existing `Zone` boxes already used for downtown/
 * residential/park - no floor-division or rotation math that could silently
 * put content somewhere unexpected.
 */
export interface RegionDef {
  id: string
  bounds: { xMin: number; xMax: number; zMin: number; zMax: number }
  build: () => RegionBuild
}
