import * as THREE from 'three'
import { addFacadeBuilding, placeGrid, pick, palette, registerEntrance, type BuildContext } from '../world'
import { grassTexture } from '../textures'
import { buildDistrictGround, perimeterLoop } from './districtHelpers'
import { buildPatrolNpc, buildSittingNpc } from '../npc'
import type { RegionDef, RegionBuild } from './types'

const BOUNDS = { xMin: -185, xMax: -65, zMin: -40, zMax: 120 }

export const residentialWestDistrict: RegionDef = {
  id: 'residentialWest',
  bounds: BOUNDS,
  build: (): RegionBuild => {
    const ctx: BuildContext = { group: new THREE.Group(), colliders: [], shorelineColliders: [], collidableMeshes: [], buildingEntrances: [] }
    ctx.group.name = 'region-residentialWest'

    buildDistrictGround(ctx, BOUNDS, grassTexture((BOUNDS.xMax - BOUNDS.xMin) / 5, (BOUNDS.zMax - BOUNDS.zMin) / 5))

    const inset = 8
    placeGrid(
      { xMin: BOUNDS.xMin + inset, xMax: BOUNDS.xMax - inset, zMin: BOUNDS.zMin + inset, zMax: BOUNDS.zMax - inset },
      4,
      5,
      (cx, cz, cellW, cellD, i) => {
        const w = cellW * 0.5
        const d = cellD * 0.5
        const h = 2.6
        addFacadeBuilding(ctx, w, h, d, pick(palette.residential, i), cx, cz, i + 1)
        const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 1.6, 4), new THREE.MeshStandardMaterial({ color: palette.roof }))
        roof.rotation.y = Math.PI / 4
        roof.position.set(cx, h + 0.8, cz)
        roof.castShadow = true
        ctx.group.add(roof)
        const facing = cz > 0 ? Math.PI : 0
        registerEntrance(ctx, `housewest-${i}`, 'house', cx, cz, w, d, facing, `house:w${i}`, 'כניסה לבית')
      }
    )

    const loop = perimeterLoop(BOUNDS, 6)
    const npcs = [
      buildPatrolNpc([loop[0], loop[1]], 41),
      buildPatrolNpc([loop[2], loop[3]], 47),
      buildSittingNpc(new THREE.Vector3((BOUNDS.xMin + BOUNDS.xMax) / 2, 0, BOUNDS.zMin + 10), 0, 53),
    ]
    npcs.forEach((n) => ctx.group.add(n.root))

    return { group: ctx.group, colliders: ctx.colliders, collidableMeshes: ctx.collidableMeshes, npcs, traffic: [], buildingEntrances: ctx.buildingEntrances }
  },
}
