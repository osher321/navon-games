import * as THREE from 'three'
import { addFacadeBuilding, placeGrid, pick, type BuildContext } from '../world'
import { sidewalkTexture } from '../textures'
import { buildDistrictGround, perimeterLoop } from './districtHelpers'
import { buildPatrolNpc } from '../npc'
import { buildTrafficCar } from '../traffic'
import type { RegionDef, RegionBuild } from './types'

const BOUNDS = { xMin: 65, xMax: 185, zMin: -40, zMax: 120 }
const OFFICE_COLORS = [0x4a5568, 0x5b6b82, 0x38455a, 0x6b7a90]

export const businessDistrict: RegionDef = {
  id: 'business',
  bounds: BOUNDS,
  build: (): RegionBuild => {
    const ctx: BuildContext = { group: new THREE.Group(), colliders: [], shorelineColliders: [], collidableMeshes: [] }
    ctx.group.name = 'region-business'

    buildDistrictGround(ctx, BOUNDS, sidewalkTexture((BOUNDS.xMax - BOUNDS.xMin) / 4, (BOUNDS.zMax - BOUNDS.zMin) / 4))

    const inset = 10
    placeGrid(
      { xMin: BOUNDS.xMin + inset, xMax: BOUNDS.xMax - inset, zMin: BOUNDS.zMin + inset, zMax: BOUNDS.zMax - inset },
      3,
      4,
      (cx, cz, cellW, cellD, i) => {
        const footprint = Math.min(cellW, cellD) * 0.6
        const height = 14 + (i % 6) * 4.5
        addFacadeBuilding(ctx, footprint, height, footprint, pick(OFFICE_COLORS, i), cx, cz, i + 5)
      }
    )

    const loop = perimeterLoop(BOUNDS, 5)
    const traffic = [buildTrafficCar(loop, 11, 'car'), buildTrafficCar([...loop].reverse(), 23, 'car')]
    const npcs = [
      buildPatrolNpc([loop[0], loop[1]], 3),
      buildPatrolNpc([loop[2], loop[3]], 8),
    ]
    npcs.forEach((n) => ctx.group.add(n.root))
    traffic.forEach((t) => ctx.group.add(t.root))

    return { group: ctx.group, colliders: ctx.colliders, collidableMeshes: ctx.collidableMeshes, npcs, traffic }
  },
}
