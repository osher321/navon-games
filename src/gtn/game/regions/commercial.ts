import * as THREE from 'three'
import { placeGrid, type BuildContext } from '../world'
import { sidewalkTexture } from '../textures'
import { buildDistrictGround, perimeterLoop } from './districtHelpers'
import { buildShopFront, SHOP_TYPES } from '../shops'
import { buildPatrolNpc } from '../npc'
import { buildTrafficCar } from '../traffic'
import type { RegionDef, RegionBuild } from './types'

const BOUNDS = { xMin: 190, xMax: 310, zMin: -40, zMax: 120 }

export const commercialDistrict: RegionDef = {
  id: 'commercial',
  bounds: BOUNDS,
  build: (): RegionBuild => {
    const ctx: BuildContext = { group: new THREE.Group(), colliders: [], shorelineColliders: [], collidableMeshes: [], buildingEntrances: [] }
    ctx.group.name = 'region-commercial'

    buildDistrictGround(ctx, BOUNDS, sidewalkTexture((BOUNDS.xMax - BOUNDS.xMin) / 4, (BOUNDS.zMax - BOUNDS.zMin) / 4))

    const inset = 12
    const shopDepth = 9
    // Two facing rows of storefronts either side of an implied street down
    // the middle, all facing inward toward it. `w` (X, into the block) is
    // a fixed shop depth; `d` (Z, along the street) comes from the grid
    // cell so shops space out evenly along the row - using the full cell
    // *width* as the building width would stretch each shop across nearly
    // the whole block.
    const midX = (BOUNDS.xMin + BOUNDS.xMax) / 2
    placeGrid({ xMin: BOUNDS.xMin + inset, xMax: midX - 6, zMin: BOUNDS.zMin + inset, zMax: BOUNDS.zMax - inset }, 1, 5, (cx, cz, _cellW, cellD, i) => {
      buildShopFront(ctx, SHOP_TYPES[i % SHOP_TYPES.length], shopDepth, 4.2, cellD * 0.75, cx, cz, Math.PI / 2, i)
    })
    placeGrid({ xMin: midX + 6, xMax: BOUNDS.xMax - inset, zMin: BOUNDS.zMin + inset, zMax: BOUNDS.zMax - inset }, 1, 5, (cx, cz, _cellW, cellD, i) => {
      buildShopFront(ctx, SHOP_TYPES[(i + 3) % SHOP_TYPES.length], shopDepth, 4.2, cellD * 0.75, cx, cz, -Math.PI / 2, i + 3)
    })

    const loop = perimeterLoop(BOUNDS, 5)
    const traffic = [buildTrafficCar(loop, 31, 'car')]
    const npcs = [
      buildPatrolNpc([loop[0], loop[1]], 14),
      buildPatrolNpc([loop[1], loop[2]], 19),
      buildPatrolNpc([loop[2], loop[3]], 27),
    ]
    npcs.forEach((n) => ctx.group.add(n.root))
    traffic.forEach((t) => ctx.group.add(t.root))

    return { group: ctx.group, colliders: ctx.colliders, collidableMeshes: ctx.collidableMeshes, npcs, traffic, buildingEntrances: ctx.buildingEntrances }
  },
}
