import * as THREE from 'three'
import { box, placeGrid, pick, registerEntrance, type BuildContext } from '../world'
import { asphaltTexture } from '../textures'
import { buildDistrictGround, perimeterLoop } from './districtHelpers'
import { buildPatrolNpc } from '../npc'
import { buildTrafficCar } from '../traffic'
import type { RegionDef, RegionBuild } from './types'

const BOUNDS = { xMin: 315, xMax: 435, zMin: -40, zMax: 120 }
const WAREHOUSE_COLORS = [0x8a8f94, 0x9a8060, 0x6b7280]

export const industrialDistrict: RegionDef = {
  id: 'industrial',
  bounds: BOUNDS,
  build: (): RegionBuild => {
    const ctx: BuildContext = { group: new THREE.Group(), colliders: [], shorelineColliders: [], collidableMeshes: [], buildingEntrances: [] }
    ctx.group.name = 'region-industrial'

    buildDistrictGround(ctx, BOUNDS, asphaltTexture((BOUNDS.xMax - BOUNDS.xMin) / 6, (BOUNDS.zMax - BOUNDS.zMin) / 6))

    const inset = 12
    // Big, plain, chunky sheds - cheap (one box + one material each) and
    // visually reads as "industrial" without needing the windowed facade
    // texture the rest of the city uses.
    placeGrid(
      { xMin: BOUNDS.xMin + inset, xMax: BOUNDS.xMax - inset, zMin: BOUNDS.zMin + inset, zMax: BOUNDS.zMax - inset },
      2,
      3,
      (cx, cz, cellW, cellD, i) => {
        const w = cellW * 0.7
        const d = cellD * 0.6
        const h = 6 + (i % 2) * 2.5
        const shed = box(w, h, d, pick(WAREHOUSE_COLORS, i))
        shed.position.set(cx, h / 2, cz)
        ctx.group.add(shed)
        ctx.collidableMeshes.push(shed)
        ctx.colliders.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 })
        const facing = cz > 0 ? Math.PI : 0
        registerEntrance(ctx, `warehouse-${i}`, 'office', cx, cz, w, d, facing, `office:wh${i}`, 'כניסה למחסן')
      }
    )

    // A cluster of storage tanks near one corner.
    const tankGeo = new THREE.CylinderGeometry(2.2, 2.2, 6, 14)
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xc9ccd1, roughness: 0.6, metalness: 0.3 })
    ;[0, 1, 2].forEach((i) => {
      const tank = new THREE.Mesh(tankGeo, tankMat)
      const x = BOUNDS.xMax - inset - i * 5.5
      const z = BOUNDS.zMin + inset
      tank.position.set(x, 3, z)
      tank.castShadow = true
      ctx.group.add(tank)
      ctx.collidableMeshes.push(tank)
      ctx.colliders.push({ minX: x - 2.2, maxX: x + 2.2, minZ: z - 2.2, maxZ: z + 2.2 })
    })

    const loop = perimeterLoop(BOUNDS, 5)
    const traffic = [buildTrafficCar(loop, 61, 'car')]
    const npcs = [buildPatrolNpc([loop[0], loop[1]], 66)]
    npcs.forEach((n) => ctx.group.add(n.root))
    traffic.forEach((t) => ctx.group.add(t.root))

    return { group: ctx.group, colliders: ctx.colliders, collidableMeshes: ctx.collidableMeshes, npcs, traffic, buildingEntrances: ctx.buildingEntrances }
  },
}
