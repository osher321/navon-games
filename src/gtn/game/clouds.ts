import * as THREE from 'three'

/**
 * Real volumetric-looking clouds - each one is a small cluster of flattened,
 * low-poly puffs (not a flat sprite/billboard), so flying through or under
 * one actually looks three-dimensional from any angle. All puffs across
 * every cloud share one InstancedMesh, so the whole field - however many
 * clusters - costs a single draw call.
 */

const PUFF_GEO = new THREE.IcosahedronGeometry(1, 0)
const PUFFS_PER_CLUSTER = 6

interface CloudLayer {
  minY: number
  maxY: number
  count: number
}

// Chosen to overlap the airplane/balloon's actual reachable altitude range
// (both top out around 34-38) so players fly *through* these, not just
// look at them from below.
const LAYERS: CloudLayer[] = [
  { minY: 12, maxY: 18, count: 22 },
  { minY: 22, maxY: 30, count: 26 },
  { minY: 34, maxY: 40, count: 16 },
]

export interface WorldBounds {
  xMin: number
  xMax: number
  zMin: number
  zMax: number
}

export interface CloudField {
  group: THREE.Group
}

/** The whole field is static in world space (positions chosen once) - with the map's bounds finite, this is simpler and just as cheap as a camera-following/streaming system, and clouds stay put as landmarks instead of regenerating under the player. */
export function buildCloudField(bounds: WorldBounds): CloudField {
  const group = new THREE.Group()
  group.name = 'cloud-field'

  const clusters: { x: number; y: number; z: number }[] = []
  for (const layer of LAYERS) {
    for (let i = 0; i < layer.count; i++) {
      clusters.push({
        x: bounds.xMin + Math.random() * (bounds.xMax - bounds.xMin),
        y: layer.minY + Math.random() * (layer.maxY - layer.minY),
        z: bounds.zMin + Math.random() * (bounds.zMax - bounds.zMin),
      })
    }
  }

  const totalPuffs = clusters.length * PUFFS_PER_CLUSTER
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 })
  const mesh = new THREE.InstancedMesh(PUFF_GEO, material, totalPuffs)
  mesh.castShadow = false
  mesh.receiveShadow = false

  const dummy = new THREE.Object3D()
  const color = new THREE.Color()
  let idx = 0
  for (const c of clusters) {
    const clusterScale = 3 + Math.random() * 3
    for (let p = 0; p < PUFFS_PER_CLUSTER; p++) {
      const angle = (p / PUFFS_PER_CLUSTER) * Math.PI * 2 + Math.random() * 0.6
      const radius = clusterScale * (0.4 + Math.random() * 0.5)
      const puffScale = clusterScale * (0.55 + Math.random() * 0.5)
      dummy.position.set(c.x + Math.cos(angle) * radius, c.y + (Math.random() - 0.5) * clusterScale * 0.3, c.z + Math.sin(angle) * radius)
      // Flattened vertically like a real cumulus puff, not a round ball.
      dummy.scale.set(puffScale * 1.4, puffScale * 0.8, puffScale * 1.4)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(idx, dummy.matrix)
      const shade = 0.92 + Math.random() * 0.08
      color.setRGB(shade, shade, Math.min(1, shade + 0.02))
      mesh.setColorAt(idx, color)
      idx++
    }
  }
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true

  group.add(mesh)
  return { group }
}
