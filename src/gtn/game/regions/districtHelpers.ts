import * as THREE from 'three'
import type { BuildContext, Zone } from '../world'
import { planeTextured } from '../world'

export interface DistrictBounds {
  xMin: number
  xMax: number
  zMin: number
  zMax: number
}

export function toZone(bounds: DistrictBounds): Zone {
  return bounds
}

/** A ground plane sized exactly to the district's bounds, tinted/textured by whatever the district needs (pavement, grass, dirt). */
export function buildDistrictGround(ctx: BuildContext, bounds: DistrictBounds, texture: THREE.Texture) {
  const w = bounds.xMax - bounds.xMin
  const d = bounds.zMax - bounds.zMin
  const ground = planeTextured(w, d, texture)
  ground.position.set((bounds.xMin + bounds.xMax) / 2, 0, (bounds.zMin + bounds.zMax) / 2)
  ctx.group.add(ground)
}

/** A simple rectangular loop just inside the district's edges - used as a traffic/patrol path so cars and NPCs read as "circling the block" without a separately modeled road surface. */
export function perimeterLoop(bounds: DistrictBounds, inset: number, y = 0): THREE.Vector3[] {
  return [
    new THREE.Vector3(bounds.xMin + inset, y, bounds.zMin + inset),
    new THREE.Vector3(bounds.xMax - inset, y, bounds.zMin + inset),
    new THREE.Vector3(bounds.xMax - inset, y, bounds.zMax - inset),
    new THREE.Vector3(bounds.xMin + inset, y, bounds.zMax - inset),
  ]
}
