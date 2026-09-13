import * as THREE from 'three'
import { addFacadeBuilding, box, buildBenches, planeTextured, palette, registerEntrance, type BuildContext } from '../world'
import { asphaltTexture, sidewalkTexture } from '../textures'
import { buildDistrictGround } from './districtHelpers'
import { buildSittingNpc, buildPatrolNpc } from '../npc'
import type { RegionDef, RegionBuild } from './types'

// West of the existing (core) runway/tower, alongside the current airport's
// Z range - extends the always-on airport rather than replacing anything in it.
const BOUNDS = { xMin: -85, xMax: -15, zMin: 35, zMax: 145 }

export const airportTerminalDistrict: RegionDef = {
  id: 'airportTerminal',
  bounds: BOUNDS,
  build: (): RegionBuild => {
    const ctx: BuildContext = { group: new THREE.Group(), colliders: [], shorelineColliders: [], collidableMeshes: [], buildingEntrances: [] }
    ctx.group.name = 'region-airportTerminal'

    buildDistrictGround(ctx, BOUNDS, sidewalkTexture((BOUNDS.xMax - BOUNDS.xMin) / 4, (BOUNDS.zMax - BOUNDS.zMin) / 4))

    // Long, shallow terminal building near the runway-facing edge.
    const terminalX = BOUNDS.xMax - 8
    const terminalZ = (BOUNDS.zMin + BOUNDS.zMax) / 2
    addFacadeBuilding(ctx, 8, 9, 70, 0x7fa8c9, terminalX, terminalZ, 12)
    const canopy = box(10, 0.4, 72, 0xd8dbe0)
    canopy.position.set(terminalX - 5, 4.2, terminalZ)
    ctx.group.add(canopy)
    // Faces west, toward the canopy/waiting-bench side built below.
    registerEntrance(ctx, 'airport-terminal', 'office', terminalX, terminalZ, 8, 70, -Math.PI / 2, 'office:terminal', 'כניסה למסוף')

    // Parking lot west of the terminal.
    const lotX = BOUNDS.xMin + 22
    const lotZ = terminalZ
    const lot = planeTextured(38, 90, asphaltTexture(38 / 4, 90 / 6))
    lot.position.set(lotX, 0.01, lotZ)
    ctx.group.add(lot)
    for (let i = 0; i < 6; i++) {
      const stripe = box(0.15, 0.1, 84, palette.parkingLine)
      stripe.position.set(lotX - 17 + i * 6.5, 0.08, lotZ)
      ctx.group.add(stripe)
    }

    // Access road connecting the parking area back toward the city's main
    // north-south road (which runs along x = 0).
    const roadZ = BOUNDS.zMin + 12
    const accessRoad = planeTextured(BOUNDS.xMax - lotX + 20, 9, asphaltTexture((BOUNDS.xMax - lotX + 20) / 4, 2))
    accessRoad.position.set((lotX + BOUNDS.xMax) / 2, 0.02, roadZ)
    ctx.group.add(accessRoad)

    // A small waiting area with benches near the terminal entrance.
    buildBenches(ctx, [
      [terminalX - 12, terminalZ - 8, Math.PI / 2],
      [terminalX - 12, terminalZ + 8, Math.PI / 2],
    ])

    const npcs = [
      buildSittingNpc(new THREE.Vector3(terminalX - 12, 0, terminalZ - 8), Math.PI / 2, 71),
      buildSittingNpc(new THREE.Vector3(terminalX - 12, 0, terminalZ + 8), Math.PI / 2, 76),
      buildPatrolNpc(
        [new THREE.Vector3(lotX, 0, lotZ - 30), new THREE.Vector3(terminalX - 10, 0, terminalZ - 30)],
        81
      ),
    ]
    npcs.forEach((n) => ctx.group.add(n.root))

    return { group: ctx.group, colliders: ctx.colliders, collidableMeshes: ctx.collidableMeshes, npcs, traffic: [], buildingEntrances: ctx.buildingEntrances }
  },
}
