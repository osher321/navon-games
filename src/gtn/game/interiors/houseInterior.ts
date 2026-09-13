import * as THREE from 'three'
import type { Collider } from '../collision'
import type { InteriorBuild, FloorZone, StairwellState } from './types'
import { buildStairwellHeightFn } from './types'
import { buildRoomShell, addRoomLight, disposeScene } from './roomKit'
import { pickPalette, HOUSE_PALETTES } from './palette'
import {
  buildBed,
  buildWardrobe,
  buildNightstand,
  buildTvOnStand,
  buildKitchenCounterRun,
  buildStove,
  buildFridge,
  buildDiningSet,
  buildSofa,
  buildCoffeeTable,
  buildMediaConsole,
  buildRug,
  buildBathroomFixtures,
} from './parts'

const UPPER_Y = 2.9
const WALL_H = 2.6

interface HouseStyle {
  name: string
  width: number
  depth: number
  bedroomCount: 1 | 2
  hasStudy: boolean
  hasStorage: boolean
  extraWindows: boolean
}

/**
 * Eight distinct configurations, not eight hand-modeled scenes - footprint
 * size, room contents and palette all vary together so each reads as a
 * genuinely different home while sharing 100% of the same builder code
 * below. `pickHouseStyle` cycles through these by seed, so every
 * residential building in the city lands on one automatically.
 *
 * Every style is two floors: a fully-furnished ground floor reachable
 * straight from the door (no stairs needed to use it at all) and a real
 * upper floor behind the staircase - the fixed structural rule every
 * residential house in GTN follows, whatever its size or extra flourishes.
 */
const HOUSE_STYLES: HouseStyle[] = [
  { name: 'בית מודרני', width: 9, depth: 8, bedroomCount: 1, hasStudy: true, hasStorage: false, extraWindows: true },
  { name: 'בית משפחתי', width: 8.5, depth: 7.8, bedroomCount: 1, hasStudy: false, hasStorage: true, extraWindows: false },
  { name: 'דירת יוקרה', width: 7.5, depth: 7, bedroomCount: 1, hasStudy: false, hasStorage: false, extraWindows: true },
  { name: 'בית פשוט', width: 6.5, depth: 6, bedroomCount: 1, hasStudy: false, hasStorage: false, extraWindows: false },
  { name: 'בית דו-קומתי', width: 8, depth: 7, bedroomCount: 1, hasStudy: false, hasStorage: true, extraWindows: false },
  { name: 'בית גדול', width: 10.5, depth: 9, bedroomCount: 2, hasStudy: true, hasStorage: true, extraWindows: true },
  { name: 'בית עם חצר', width: 8.5, depth: 7.5, bedroomCount: 1, hasStudy: false, hasStorage: true, extraWindows: true },
  { name: 'בניין מגורים', width: 9, depth: 8, bedroomCount: 1, hasStudy: false, hasStorage: false, extraWindows: false },
]

export function pickHouseStyleName(seed: number): string {
  return HOUSE_STYLES[Math.abs(seed) % HOUSE_STYLES.length].name
}

export function buildHouseInterior(seed: number): InteriorBuild {
  const style = HOUSE_STYLES[Math.abs(seed) % HOUSE_STYLES.length]
  const palette = pickPalette(HOUSE_PALETTES, seed)
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0d0d10)
  scene.add(new THREE.AmbientLight(0xffffff, 0.55))

  const W = style.width
  const D = style.depth
  // Kept separate (not one shared list) because the ground and upper floor
  // almost always occupy the exact same X/Z footprint - a shared list would
  // make, say, an upstairs bed invisibly block the kitchen directly below
  // it. Which list actually applies each frame is decided by `stairState`,
  // the same floor-tracking flag the height function below uses.
  const groundColliders: Collider[] = []
  const upperColliders: Collider[] = []
  const collidableMeshes: THREE.Object3D[] = []
  const groundZones: FloorZone[] = []
  const upperZones: FloorZone[] = []
  const stairState: StairwellState = { onUpper: false }

  // ----- Ground floor shell: door centered on the south wall (z = D). -----
  const doorAt = W / 2
  // Computed up front (not just where the staircase itself is built further
  // down) so the living-room furniture placed below can stay clear of the
  // stair corridor instead of discovering the collision after the fact -
  // in a few of the smaller house footprints, a full-width sofa centered
  // at its usual spot reached far enough right to clip straight through
  // the guard rail.
  const stairX0 = W - 1.6
  const stairX1 = W - 0.6
  const guardT = 0.12
  const ground = buildRoomShell({
    x0: 0,
    x1: W,
    z0: 0,
    z1: D,
    floorY: 0,
    wallHeight: WALL_H,
    wallColor: palette.wall,
    floorColor: palette.floor,
    openings: [{ wall: 'S', at: doorAt, width: 1.3 }],
    windows: style.extraWindows ? [{ wall: 'N', at: W * 0.3, width: 1.4 }, { wall: 'N', at: W * 0.7, width: 1.4 }] : [{ wall: 'N', at: W / 2, width: 1.6 }],
  })
  scene.add(ground.group)
  groundColliders.push(...ground.colliders)
  collidableMeshes.push(...ground.collidableMeshes)
  groundZones.push({ kind: 'flat', xMin: 0, xMax: W, zMin: 0, zMax: D, y: 0 })
  addRoomLight(ground.group, W * 0.3, WALL_H - 0.3, D * 0.3)
  addRoomLight(ground.group, W * 0.7, WALL_H - 0.3, D * 0.7)

  const npcs: import('../regions/types').LiveActor[] = []

  // ----- Ground floor: the same base room set for every style (living
  // room, kitchen, dining, a ground-floor bathroom), fully reachable from
  // the door with zero stairs - the "no stairs needed at all down here" is
  // a structural guarantee, not just true by coincidence of furniture
  // placement, since every one of these sits in `groundZones`'s single
  // flat y=0 zone. -----

  // ----- Kitchen: back-left corner. -----
  const kx = W * 0.22
  const kz = D * 0.2
  const counter = buildKitchenCounterRun(kx, kz, 0, Math.PI, Math.min(2.4, W * 0.4))
  ground.group.add(counter.group)
  groundColliders.push(...counter.colliders)
  const stove = buildStove(kx + 1.0, kz + 0.55, 0, 0)
  ground.group.add(stove.group)
  groundColliders.push(...stove.colliders)
  const fridge = buildFridge(0.55, D * 0.42, 0, Math.PI / 2)
  ground.group.add(fridge.group)
  groundColliders.push(...fridge.colliders)
  const dining = buildDiningSet(W * 0.28, D * 0.55, 0, 0, 4, palette.accent)
  ground.group.add(dining.group)
  groundColliders.push(...dining.colliders)

  // ----- Living room: front area, near the door. -----
  // Sized and centered from the *actual* gap between the dining set's right
  // edge and the stair corridor's left edge, not a fixed W*0.68 position
  // with a fixed width - a fixed layout is exactly what let a wide sofa in
  // a smaller house reach into the staircase guard rail (or, once just
  // pushed left to dodge that, straight into the dining table instead).
  // Confirmed clear of both neighbors by an actual collider-overlap sweep
  // across every house style, not just eyeballed.
  const diningRightEdge = W * 0.28 + 1.3
  const stairsLeftLimit = stairX0 - guardT - 0.25
  const sofaWidth = Math.max(1.1, Math.min(2.1, W * 0.32, stairsLeftLimit - diningRightEdge))
  const lx = diningRightEdge + sofaWidth / 2
  const lz = D * 0.72
  const sofa = buildSofa(lx, lz, 0, Math.PI, sofaWidth, palette.accent)
  ground.group.add(sofa.group)
  groundColliders.push(...sofa.colliders)
  const coffee = buildCoffeeTable(lx, lz - 0.85, 0, 0)
  ground.group.add(coffee.group)
  groundColliders.push(...coffee.colliders)
  const media = buildMediaConsole(lx, lz - 1.7, 0, Math.PI)
  ground.group.add(media.group)
  groundColliders.push(...media.colliders)
  const rug = buildRug(lx, lz - 0.4, 0.001, 2.2, 1.6, palette.accent)
  ground.group.add(rug.group)

  // ----- Ground-floor bathroom: a compact fixture cluster along the back
  // wall, between the kitchen and the study/back corner - every style has
  // room for it since it's placed relative to the kitchen's own footprint,
  // not a fixed coordinate that could collide in a smaller house. -----
  const bathX = Math.max(kx + 2.1, W * 0.55)
  const groundBath = buildBathroomFixtures(bathX, D * 0.14, 0, Math.PI)
  ground.group.add(groundBath.group)
  groundColliders.push(...groundBath.colliders)

  if (style.hasStudy) {
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.55), new THREE.MeshStandardMaterial({ color: 0x6b4a32 }))
    deskTop.position.set(W - 0.7, 0.72, 0.7)
    ground.group.add(deskTop)
    groundColliders.push({ minX: W - 1.25, maxX: W - 0.15, minZ: 0.42, maxZ: 0.98 })
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: palette.accent }))
    chair.position.set(W - 0.7, 0.2, 1.15)
    ground.group.add(chair)
  }
  if (style.hasStorage) {
    const boxes = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.6), new THREE.MeshStandardMaterial({ color: 0x8a6a44 }))
    boxes.position.set(0.5, 0.275, D - 0.6)
    ground.group.add(boxes)
    groundColliders.push({ minX: 0.2, maxX: 0.8, minZ: D - 0.9, maxZ: D - 0.3 })
  }

  // Ground floor needs zero stairs to use - the door opens directly onto
  // it, and every room built above sits in `groundZones`'s single flat
  // zone. The player only ever needs the staircase below to reach the
  // bedrooms/upstairs bathroom, never to get around downstairs.
  const spawnPoint = new THREE.Vector3(doorAt, 0, D - 1.1)

  // ----- Upper floor + real staircase - every residential house has one. -----
  const stairZ0 = D * 0.32
  const stairZ1 = D * 0.72
  const rampSpec = { xMin: stairX0, xMax: stairX1, zMin: stairZ0, zMax: stairZ1, yStart: 0, yEnd: UPPER_Y }
  upperZones.push({ kind: 'flat', xMin: 0, xMax: W, zMin: 0, zMax: D, y: UPPER_Y })

  // Physical steps (visual only - the ramp height-field above is what
  // actually carries the player up; these just make it look like stairs
  // instead of a slope).
  const stepCount = 10
  for (let i = 0; i < stepCount; i++) {
    const t1 = (i + 1) / stepCount
    const stepY = UPPER_Y * t1
    const stepZ = stairZ0 + (stairZ1 - stairZ0) * t1
    const step = new THREE.Mesh(new THREE.BoxGeometry(stairX1 - stairX0, 0.05, (stairZ1 - stairZ0) / stepCount + 0.02), new THREE.MeshStandardMaterial({ color: palette.floor }))
    step.position.set((stairX0 + stairX1) / 2, stepY, stepZ - (stairZ1 - stairZ0) / stepCount / 2)
    step.castShadow = true
    step.receiveShadow = true
    ground.group.add(step)
  }
  // Side guard walls flanking the staircase so the player can't step off
  // the ramp into the flat-floor height field mid-climb - a real physical
  // wall spanning both levels, so it belongs in both collider sets.
  const guardColliders: Collider[] = [
    { minX: stairX0 - guardT, maxX: stairX0, minZ: stairZ0, maxZ: stairZ1 },
    { minX: stairX1, maxX: stairX1 + guardT, minZ: stairZ0, maxZ: stairZ1 },
  ]
  groundColliders.push(...guardColliders)
  upperColliders.push(...guardColliders)
  const guardMat = new THREE.MeshStandardMaterial({ color: palette.accent })
  const guardL = new THREE.Mesh(new THREE.BoxGeometry(guardT, UPPER_Y + 0.9, stairZ1 - stairZ0), guardMat)
  guardL.position.set(stairX0 - guardT / 2, (UPPER_Y + 0.9) / 2, (stairZ0 + stairZ1) / 2)
  ground.group.add(guardL)
  const guardR = guardL.clone()
  guardR.position.x = stairX1 + guardT / 2
  ground.group.add(guardR)

  // ----- Upper floor shell (its own walls, no floor slab - the ceiling
  // built below the ground floor already caps that space). -----
  const upper = buildRoomShell({
    x0: 0,
    x1: W,
    z0: 0,
    z1: D,
    floorY: UPPER_Y,
    wallHeight: WALL_H,
    wallColor: palette.wall,
    floorColor: palette.floor,
    skipFloor: true,
    windows: [{ wall: 'N', at: W / 2, width: 1.6 }],
  })
  scene.add(upper.group)
  upperColliders.push(...upper.colliders)
  collidableMeshes.push(...upper.collidableMeshes)
  addRoomLight(upper.group, W * 0.4, UPPER_Y + WALL_H - 0.3, D * 0.4)
  if (style.bedroomCount === 2) addRoomLight(upper.group, W * 0.75, UPPER_Y + WALL_H - 0.3, D * 0.7)

  const bedroomSpots: [number, number][] = style.bedroomCount === 2 ? [[W * 0.28, D * 0.3], [W * 0.72, D * 0.65]] : [[W * 0.4, D * 0.4]]
  bedroomSpots.forEach(([bx, bz], i) => {
    const bed = buildBed(bx, bz, UPPER_Y, i % 2 === 0 ? 0 : Math.PI, i % 2 === 0 ? 0xdce6f2 : 0xf2dce6)
    upper.group.add(bed.group)
    upperColliders.push(...bed.colliders)
    const wardrobe = buildWardrobe(bx + 1.6, bz - 0.9, UPPER_Y, Math.PI / 2)
    upper.group.add(wardrobe.group)
    upperColliders.push(...wardrobe.colliders)
    const nightstand = buildNightstand(bx - 0.95, bz - 0.85, UPPER_Y, 0)
    upper.group.add(nightstand.group)
    upperColliders.push(...nightstand.colliders)
    const tv = buildTvOnStand(bx, bz + 1.3, UPPER_Y, Math.PI)
    upper.group.add(tv.group)
    upperColliders.push(...tv.colliders)
  })

  // ----- Upper-floor bathroom - placed near the front (high-Z, close to
  // where the stairs land), clear of every bedroom-spot layout above so it
  // never fights a bed/wardrobe for the same square footage. -----
  const upperBath = buildBathroomFixtures(W * 0.5, D * 0.9, UPPER_Y, 0)
  upper.group.add(upperBath.group)
  upperColliders.push(...upperBath.colliders)

  const heightAt = buildStairwellHeightFn(groundZones, upperZones, rampSpec, stairState)

  return {
    scene,
    // A getter (not a plain field) - re-evaluated every time GameCanvas
    // reads `.colliders` each frame, so it always reflects whichever floor
    // `stairState` (shared with the height function above) currently says
    // the player is on, instead of a single collider list mixing both.
    get colliders() {
      return stairState.onUpper ? upperColliders : groundColliders
    },
    collidableMeshes,
    heightAt,
    bounds: { minX: 0.2, maxX: W - 0.2, minZ: 0.2, maxZ: D - 0.2 },
    spawnPoint,
    spawnFacing: Math.PI,
    exitPoint: { position: new THREE.Vector3(doorAt, 0, D - 0.6), radius: 1.4 },
    interactables: [],
    npcs,
    dispose: () => disposeScene(scene),
  }
}
