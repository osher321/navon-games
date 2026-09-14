import * as THREE from 'three'
import type { Collider } from '../../gtn/game/collision'

const ROAD_WIDTH = 9

/**
 * One original circuit, defined as a `TrackDef` so a second/third track is
 * just another entry in `TRACKS` later - nothing about `buildTrack` or the
 * game itself is specific to this one layout.
 */
export interface TrackDef {
  id: string
  name: string
  waypoints: [number, number][]
}

export const TRACKS: TrackDef[] = [
  {
    id: 'sunset-circuit',
    name: 'מסלול השקיעה',
    waypoints: [
      [0, -42],
      [34, -40],
      [54, -18],
      [46, 10],
      [22, 30],
      [-4, 18],
      [-14, 32],
      [-42, 34],
      [-58, 6],
      [-48, -24],
      [-22, -38],
    ],
  },
]

export interface BuiltTrack {
  group: THREE.Group
  curve: THREE.CatmullRomCurve3
  colliders: Collider[]
  checkpoints: THREE.Vector3[]
  startPosition: THREE.Vector3
  startHeading: number
}

function segmentMesh(from: THREE.Vector3, to: THREE.Vector3, width: number, color: number, y: number) {
  const dx = to.x - from.x
  const dz = to.z - from.z
  const length = Math.hypot(dx, dz)
  const geo = new THREE.BoxGeometry(width, 0.06, length + 0.4)
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set((from.x + to.x) / 2, y, (from.z + to.z) / 2)
  mesh.rotation.y = Math.atan2(dx, dz)
  mesh.receiveShadow = true
  return mesh
}

/** Builds the road surface, painted edge lines, barrier colliders, checkpoints, and start pose from a `TrackDef` - a closed Catmull-Rom spline through the hand-placed waypoints, sampled finely enough that straight box segments read as a smooth curved road. */
export function buildTrack(def: TrackDef): BuiltTrack {
  const points = def.waypoints.map(([x, z]) => new THREE.Vector3(x, 0, z))
  const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.55)
  const SAMPLES = 220
  const sampled = curve.getSpacedPoints(SAMPLES)

  const group = new THREE.Group()
  const colliders: Collider[] = []

  for (let i = 0; i < sampled.length - 1; i++) {
    const a = sampled[i]
    const b = sampled[i + 1]
    group.add(segmentMesh(a, b, ROAD_WIDTH, i % 2 === 0 ? 0x3a3f4a : 0x363b46, 0.02))

    // Thin, bright edge-line segments on both shoulders - painted, not colliding.
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len = Math.hypot(dx, dz)
    if (len > 0.001) {
      const nx = -dz / len
      const nz = dx / len
      const half = ROAD_WIDTH / 2 - 0.3
      const lineMat = new THREE.MeshStandardMaterial({ color: 0xffe37a, roughness: 0.6 })
      const leftLine = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.07, len + 0.4), lineMat)
      leftLine.position.set((a.x + b.x) / 2 + nx * half, 0.04, (a.z + b.z) / 2 + nz * half)
      leftLine.rotation.y = Math.atan2(dx, dz)
      group.add(leftLine)
      const rightLine = leftLine.clone()
      rightLine.position.set((a.x + b.x) / 2 - nx * half, 0.04, (a.z + b.z) / 2 - nz * half)
      group.add(rightLine)

      // Barrier colliders every few segments (not every single one - keeps
      // the collider list small while still bounding the track closely
      // enough that "driving off the road" reliably bumps into something).
      if (i % 3 === 0) {
        const barrierHalf = ROAD_WIDTH / 2 + 0.6
        const bx = (a.x + b.x) / 2
        const bz = (a.z + b.z) / 2
        colliders.push({ minX: bx + nx * barrierHalf - 0.6, maxX: bx + nx * barrierHalf + 0.6, minZ: bz + nz * barrierHalf - 0.6, maxZ: bz + nz * barrierHalf + 0.6 })
        colliders.push({ minX: bx - nx * barrierHalf - 0.6, maxX: bx - nx * barrierHalf + 0.6, minZ: bz - nz * barrierHalf - 0.6, maxZ: bz - nz * barrierHalf + 0.6 })
      }
    }
  }

  // Start/finish line - a checkered-ish stripe across the road at sample 0.
  const startA = sampled[0]
  const startB = sampled[1]
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH, 0.08, 1.2), stripeMat)
  stripe.position.set(startA.x, 0.05, startA.z)
  stripe.rotation.y = Math.atan2(startB.x - startA.x, startB.z - startA.z)
  group.add(stripe)

  const checkpointCount = 8
  const checkpoints: THREE.Vector3[] = []
  for (let c = 0; c < checkpointCount; c++) {
    checkpoints.push(sampled[Math.floor((c / checkpointCount) * sampled.length)].clone())
  }

  const startHeading = Math.atan2(startB.x - startA.x, startB.z - startA.z)

  return {
    group,
    curve,
    colliders,
    checkpoints,
    startPosition: startA.clone(),
    startHeading,
  }
}
