import type * as THREE from 'three'
import type { Collider } from '../collision'

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
  traffic: LiveActor[]
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
