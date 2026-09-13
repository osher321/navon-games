import * as THREE from 'three'
import { buildTrees, type BuildContext } from '../world'
import { grassTexture } from '../textures'
import { buildDistrictGround, type DistrictBounds } from './districtHelpers'
import type { RegionDef, RegionBuild } from './types'

const ROCK_COLOR = 0x8a8a86

/** Sparse open countryside - what makes the map feel much bigger than the developed area for very little render cost, and gives the world a real edge instead of an abrupt void. */
function buildRural(id: string, bounds: DistrictBounds): RegionDef {
  return {
    id,
    bounds,
    build: (): RegionBuild => {
      const ctx: BuildContext = { group: new THREE.Group(), colliders: [], shorelineColliders: [], collidableMeshes: [], buildingEntrances: [] }
      ctx.group.name = `region-${id}`

      buildDistrictGround(ctx, bounds, grassTexture((bounds.xMax - bounds.xMin) / 8, (bounds.zMax - bounds.zMin) / 8))

      const treeSpots: [number, number][] = []
      const cols = 5
      const rows = 6
      const cellW = (bounds.xMax - bounds.xMin) / cols
      const cellD = (bounds.zMax - bounds.zMin) / rows
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if ((r + c) % 3 !== 0) continue // sparse - skip most cells
          const jitterX = (Math.sin(r * 12.9 + c * 3.7) * 0.5) * cellW * 0.4
          const jitterZ = (Math.cos(r * 7.1 + c * 5.3) * 0.5) * cellD * 0.4
          treeSpots.push([bounds.xMin + cellW * (c + 0.5) + jitterX, bounds.zMin + cellD * (r + 0.5) + jitterZ])
        }
      }
      buildTrees(ctx, treeSpots)

      const rockGeo = new THREE.DodecahedronGeometry(1)
      for (let i = 0; i < 6; i++) {
        const scale = 0.6 + (i % 3) * 0.35
        const rock = new THREE.Mesh(rockGeo, new THREE.MeshStandardMaterial({ color: ROCK_COLOR, roughness: 0.95, flatShading: true }))
        const x = bounds.xMin + ((bounds.xMax - bounds.xMin) * ((i * 37) % 100)) / 100
        const z = bounds.zMin + ((bounds.zMax - bounds.zMin) * ((i * 61) % 100)) / 100
        rock.position.set(x, scale * 0.5, z)
        rock.scale.setScalar(scale)
        rock.rotation.set(i, i * 1.3, i * 0.7)
        rock.castShadow = true
        ctx.group.add(rock)
        ctx.colliders.push({ minX: x - scale, maxX: x + scale, minZ: z - scale, maxZ: z + scale })
      }

      return { group: ctx.group, colliders: ctx.colliders, collidableMeshes: ctx.collidableMeshes, npcs: [], traffic: [], buildingEntrances: [] }
    },
  }
}

export const ruralWestDistrict = buildRural('ruralWest', { xMin: -310, xMax: -190, zMin: -60, zMax: 140 })
export const ruralEastDistrict = buildRural('ruralEast', { xMin: 440, xMax: 560, zMin: -60, zMax: 140 })
