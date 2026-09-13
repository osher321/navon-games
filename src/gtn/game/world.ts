import * as THREE from 'three'
import type { Collider } from './collision'
import { asphaltTexture, sidewalkTexture, sandTexture, grassTexture, buildingFacadeTexture } from './textures'
import type { BuildingEntranceSpawn, BuildingKind } from './interiors/types'

/**
 * Builds the original GTN neighborhood - every shape here is a primitive
 * (boxes, planes, cylinders, cones), no borrowed or GTA-style assets.
 * The layout is a ring road + cross intersection carving the map into four
 * distinct zones: downtown, residential, park, and shops/parking, dressed
 * with sidewalks, crosswalks, fences, benches, signs, lamps and trees.
 */

export const HALF_SIZE = 46
export const SPAWN_POINT = new THREE.Vector3(3, 0, 10)

export const ROAD_WIDTH = 9
export const ROAD_Y = 0.02
export const SIDEWALK_WIDTH = 1.8

// Coastline - city -> roads -> beach -> boardwalk -> pier -> open sea, all
// one continuous world (the ocean is not a disconnected backdrop).
export const SHORE_Z = -HALF_SIZE
export const BEACH_HALF_WIDTH = HALF_SIZE + 12
const BEACH_DEPTH = 16
export const SAND_END_Z = SHORE_Z - BEACH_DEPTH
const BOARDWALK_Z0 = SHORE_Z - 1
const BOARDWALK_Z1 = SHORE_Z - 3
const BOARDWALK_HEIGHT = 0.15
export const PIER_HALF_WIDTH = 3
export const PIER_START_Z = SAND_END_Z + 6
export const PIER_END_Z = SAND_END_Z - 32
const PIER_HEIGHT = 0.35
export const OCEAN_WIDTH = (HALF_SIZE + 40) * 2
export const OCEAN_DEPTH = 110
export const OCEAN_CENTER_Z = SAND_END_Z - OCEAN_DEPTH / 2

export const WORLD_SOUTH_LIMIT = PIER_END_Z - 8

// Airport - a separate zone north of the ring road (the city itself is
// untouched), reachable by walking straight up the north-south main road
// and past the city limit.
export const RUNWAY_WIDTH = 10
const AIRPORT_GAP = 14
export const AIRPORT_Z0 = HALF_SIZE + AIRPORT_GAP
export const RUNWAY_LENGTH = 64
export const AIRPORT_Z1 = AIRPORT_Z0 + RUNWAY_LENGTH
export const WORLD_NORTH_LIMIT = AIRPORT_Z1 + 12
export const PLANE_SPAWN = new THREE.Vector3(0, 0, AIRPORT_Z0 + 8)
export const BALLOON_SPAWN = new THREE.Vector3(-25, 0, -16)
export const BOAT_SPAWN = new THREE.Vector3(-7, 0, -88)

// East/west world edges - pushed out to cover the streamed districts added
// around the original city (business/commercial/industrial to the east,
// residential/rural to the west), independently of HALF_SIZE so the
// original ring city's own geometry never has to change.
export const WORLD_EAST_LIMIT = 570
export const WORLD_WEST_LIMIT = -320

/** Height the walking character/vehicle should rest at for a given XZ spot - flat ground everywhere except the raised boardwalk and pier. */
export function getGroundHeightAt(x: number, z: number): number {
  if (Math.abs(x) <= PIER_HALF_WIDTH && z <= PIER_START_Z && z >= PIER_END_Z) return PIER_HEIGHT
  if (z <= BOARDWALK_Z0 && z >= BOARDWALK_Z1 && Math.abs(x) <= BEACH_HALF_WIDTH) return BOARDWALK_HEIGHT
  return 0
}

/** Clear land/sea boundary: true anywhere in the open ocean, false on the beach, pier deck or city. */
export function isInWater(x: number, z: number): boolean {
  if (z > SAND_END_Z) return false
  const onPierDeck = Math.abs(x) <= PIER_HALF_WIDTH && z <= PIER_START_Z && z >= PIER_END_Z
  return !onPierDeck
}

export const palette = {
  grass: 0x3fa34d,
  road: 0x35363b,
  roadLine: 0xe8e8e0,
  crosswalk: 0xe9e9e2,
  sidewalk: 0xc9c4bb,
  downtown: [0x6b7a8f, 0x556274, 0x8593a6, 0x4d5c72],
  residential: [0xd98a56, 0xd6b25c, 0xc27a7a, 0xb98fd0],
  roof: 0x8c3f3f,
  shop: [0xe0537a, 0xe0a637, 0x4fb0c9],
  parkingLot: 0x2c2c30,
  parkingLine: 0xf2d94e,
  trunk: 0x6b4a2f,
  leaves: 0x2f8f4e,
  lampPost: 0x3a3a40,
  lampBulb: 0xfff3b0,
  fence: 0x8a7a63,
  bench: 0x7a5a3a,
  benchSeat: 0x9a7a52,
  signPost: 0x555555,
  signBoard: 0xf4f4f4,
  sand: 0xe8d19a,
  boardwalk: 0xb98c5a,
  pierWood: 0x8a6a44,
  umbrella: [0xff5d73, 0x3fb0e0, 0xffd15a],
}

export interface BuildContext {
  group: THREE.Group
  colliders: Collider[]
  shorelineColliders: Collider[]
  collidableMeshes: THREE.Object3D[]
  buildingEntrances: BuildingEntranceSpawn[]
}

/**
 * Marks one exterior building as enterable: stamps a visible door panel on
 * its front face and registers the door's world position so GameCanvas's
 * unified "nearest door" scan - the same pattern already used for the
 * nearest vehicle - picks it up automatically. `facing` follows the exact
 * same sin/cos heading convention `buildShopFront` (shops.ts) already
 * established for a building's outward-facing side, so this works
 * identically for both axis-aligned grid buildings (facing 0 or PI) and
 * the rotated storefronts built along a district's implied street (facing
 * ±PI/2) - one convention, not two.
 *
 * `interiorId` is a plain string key ("house:3", "supermarket:0", ...)
 * resolved lazily by `interiors/registry.ts` only once the player actually
 * opens that one door, which is the whole interior-streaming strategy:
 * none of a building's interior geometry is ever built until that instant.
 */
export function registerEntrance(
  ctx: BuildContext,
  id: string,
  kind: BuildingKind,
  cx: number,
  cz: number,
  w: number,
  d: number,
  facing: number,
  interiorId: string,
  label: string
) {
  const gap = 0.05
  const doorX = cx + Math.sin(facing) * (w / 2 + gap)
  const doorZ = cz + Math.cos(facing) * (d / 2 + gap)
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.95), new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.75 }))
  door.position.set(doorX, 0.98, doorZ)
  door.rotation.y = facing
  ctx.group.add(door)

  const entryGap = 1.6
  const entryPoint = new THREE.Vector3(
    cx + Math.sin(facing) * (Math.max(w, d) / 2 + entryGap),
    0,
    cz + Math.cos(facing) * (Math.max(w, d) / 2 + entryGap)
  )
  ctx.buildingEntrances.push({ id, kind, interiorId, doorPosition: entryPoint, doorFacing: facing + Math.PI, label })
}

export function box(w: number, h: number, d: number, color: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color }))
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function boxTextured(w: number, h: number, d: number, map: THREE.Texture) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map, roughness: 0.95 }))
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function plane(w: number, d: number, color: number, receiveShadow = true) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color }))
  mesh.rotation.x = -Math.PI / 2
  mesh.receiveShadow = receiveShadow
  return mesh
}

export function planeTextured(w: number, d: number, map: THREE.Texture, tint = 0xffffff) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map, color: tint, roughness: 0.95 }))
  mesh.rotation.x = -Math.PI / 2
  mesh.receiveShadow = true
  return mesh
}

export function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}

/** A box building with a windowed facade texture on its four side faces and a plain roof-color cap on top/bottom. */
export function addFacadeBuilding(ctx: BuildContext, w: number, h: number, d: number, color: number, cx: number, cz: number, variant: number) {
  const sideMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05 })
  sideMat.map = buildingFacadeTexture(variant, h, Math.max(w, d))
  sideMat.map.colorSpace = THREE.SRGBColorSpace
  const capMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
  // BoxGeometry face-group order: +X, -X, +Y, -Y, +Z, -Z
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [sideMat, sideMat, capMat, capMat, sideMat, sideMat])
  mesh.position.set(cx, h / 2, cz)
  mesh.castShadow = true
  mesh.receiveShadow = true
  ctx.group.add(mesh)
  ctx.collidableMeshes.push(mesh)
  ctx.colliders.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 })
  return mesh
}

function buildGround(ctx: BuildContext) {
  // Kept at its original footprint (not grown to reach the airport) - a
  // single centered square would have bled grass southward underneath the
  // semi-transparent ocean too. The airport's own grass strip is added
  // separately, only to the north.
  const size = HALF_SIZE * 2 + 20
  const ground = planeTextured(size, size, grassTexture(size / 3, size / 3))
  ground.position.y = 0
  ctx.group.add(ground)

  // A much lower tiling density than the main plane - this stretch is wide
  // open with nothing to break up the sightline (unlike the city, where
  // buildings/streets hide most long grazing-angle views of the ground),
  // so a high-frequency repeating texture here would alias into visible
  // moire bands looking down the runway.
  const northDepth = WORLD_NORTH_LIMIT + 20 - size / 2
  const northPatch = planeTextured(size, northDepth, grassTexture(size / 10, northDepth / 10))
  northPatch.position.set(0, 0, size / 2 + northDepth / 2)
  ctx.group.add(northPatch)
}

function buildRoads(ctx: BuildContext) {
  const group = ctx.group
  const span = HALF_SIZE * 2

  const horiz = planeTextured(span, ROAD_WIDTH, asphaltTexture(span / 4, ROAD_WIDTH / 2))
  horiz.position.y = ROAD_Y
  group.add(horiz)

  const vert = planeTextured(ROAD_WIDTH, span, asphaltTexture(ROAD_WIDTH / 2, span / 4))
  vert.position.y = ROAD_Y
  group.add(vert)

  const ring = [
    { w: span, d: ROAD_WIDTH, x: 0, z: HALF_SIZE },
    { w: span, d: ROAD_WIDTH, x: 0, z: -HALF_SIZE },
    { w: ROAD_WIDTH, d: span, x: HALF_SIZE, z: 0 },
    { w: ROAD_WIDTH, d: span, x: -HALF_SIZE, z: 0 },
  ]
  ring.forEach(({ w, d, x, z }) => {
    const seg = planeTextured(w, d, asphaltTexture(w / 4, d / 2))
    seg.position.set(x, ROAD_Y, z)
    group.add(seg)
  })

  for (let x = -HALF_SIZE + 4; x < HALF_SIZE - 4; x += 4) {
    const line = plane(1.8, 0.3, palette.roadLine)
    line.position.set(x, ROAD_Y + 0.01, 0)
    group.add(line)
  }
  for (let z = -HALF_SIZE + 4; z < HALF_SIZE - 4; z += 4) {
    const line = plane(0.3, 1.8, palette.roadLine)
    line.position.set(0, ROAD_Y + 0.01, z)
    group.add(line)
  }
}

function buildCrosswalks(ctx: BuildContext) {
  const stripeCount = 6
  const stripeLen = ROAD_WIDTH * 0.82
  const spacing = stripeLen / stripeCount

  const crossingCenters: [number, number, 'ns' | 'ew'][] = [
    [0, ROAD_WIDTH / 2 + 3, 'ew'],
    [0, -ROAD_WIDTH / 2 - 3, 'ew'],
    [ROAD_WIDTH / 2 + 3, 0, 'ns'],
    [-ROAD_WIDTH / 2 - 3, 0, 'ns'],
  ]

  crossingCenters.forEach(([cx, cz, axis]) => {
    for (let i = 0; i < stripeCount; i++) {
      const offset = (i - stripeCount / 2 + 0.5) * spacing
      const stripe = axis === 'ew' ? plane(0.6, stripeLen, palette.crosswalk) : plane(stripeLen, 0.6, palette.crosswalk)
      if (axis === 'ew') stripe.position.set(cx + offset, ROAD_Y + 0.01, cz)
      else stripe.position.set(cx, ROAD_Y + 0.01, cz + offset)
      ctx.group.add(stripe)
    }
  })
}

function buildSidewalksAndLamps(ctx: BuildContext) {
  const group = ctx.group
  const span = HALF_SIZE * 2
  const inset = ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2

  ;[HALF_SIZE, -HALF_SIZE].forEach((z) => {
    const walk = boxTextured(span, 0.2, SIDEWALK_WIDTH, sidewalkTexture(span / 3, 1))
    walk.position.set(0, 0.1, z > 0 ? z - inset + ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2 : z + inset - ROAD_WIDTH / 2 - SIDEWALK_WIDTH / 2)
    group.add(walk)
  })

  const lampPositions: [number, number][] = [
    [10, 10], [-10, 10], [10, -10], [-10, -10],
    [HALF_SIZE - 3, HALF_SIZE - 3], [-HALF_SIZE + 3, HALF_SIZE - 3],
    [HALF_SIZE - 3, -HALF_SIZE + 3], [-HALF_SIZE + 3, -HALF_SIZE + 3],
    [HALF_SIZE - 3, 0], [-HALF_SIZE + 3, 0], [0, HALF_SIZE - 3], [0, -HALF_SIZE + 3],
  ]

  const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.4, 8)
  const postMat = new THREE.MeshStandardMaterial({ color: palette.lampPost })
  const postMesh = new THREE.InstancedMesh(postGeo, postMat, lampPositions.length)
  postMesh.castShadow = true

  const bulbGeo = new THREE.SphereGeometry(0.22, 10, 10)
  const bulbMat = new THREE.MeshStandardMaterial({ color: palette.lampBulb, emissive: palette.lampBulb, emissiveIntensity: 0.9 })
  const bulbMesh = new THREE.InstancedMesh(bulbGeo, bulbMat, lampPositions.length)

  const dummy = new THREE.Object3D()
  lampPositions.forEach(([x, z], i) => {
    dummy.position.set(x, 1.7, z)
    dummy.updateMatrix()
    postMesh.setMatrixAt(i, dummy.matrix)

    dummy.position.set(x, 3.5, z)
    dummy.updateMatrix()
    bulbMesh.setMatrixAt(i, dummy.matrix)

    if (i < 3) {
      const light = new THREE.PointLight(0xfff3b0, 6, 14, 2)
      light.position.set(x, 3.5, z)
      group.add(light)
    }
  })
  postMesh.instanceMatrix.needsUpdate = true
  bulbMesh.instanceMatrix.needsUpdate = true
  group.add(postMesh, bulbMesh)
}

function buildSigns(ctx: BuildContext) {
  const positions: [number, number][] = [
    [ROAD_WIDTH / 2 + 2, ROAD_WIDTH / 2 + 2],
    [-ROAD_WIDTH / 2 - 2, ROAD_WIDTH / 2 + 2],
    [ROAD_WIDTH / 2 + 2, -ROAD_WIDTH / 2 - 2],
    [-ROAD_WIDTH / 2 - 2, -ROAD_WIDTH / 2 - 2],
  ]

  const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6)
  const poleMat = new THREE.MeshStandardMaterial({ color: palette.signPost })
  const poleMesh = new THREE.InstancedMesh(poleGeo, poleMat, positions.length)
  poleMesh.castShadow = true

  const boardGeo = new THREE.BoxGeometry(0.6, 0.35, 0.05)
  const boardMat = new THREE.MeshStandardMaterial({ color: palette.signBoard })
  const boardMesh = new THREE.InstancedMesh(boardGeo, boardMat, positions.length)

  const dummy = new THREE.Object3D()
  positions.forEach(([x, z], i) => {
    dummy.position.set(x, 0.8, z)
    dummy.rotation.set(0, 0, 0)
    dummy.updateMatrix()
    poleMesh.setMatrixAt(i, dummy.matrix)

    dummy.position.set(x, 1.5, z)
    dummy.rotation.y = Math.atan2(-x, -z)
    dummy.updateMatrix()
    boardMesh.setMatrixAt(i, dummy.matrix)
  })
  poleMesh.instanceMatrix.needsUpdate = true
  boardMesh.instanceMatrix.needsUpdate = true
  ctx.group.add(poleMesh, boardMesh)
}

export interface Zone {
  xMin: number
  xMax: number
  zMin: number
  zMax: number
}

export function placeGrid(zone: Zone, cols: number, rows: number, build: (cx: number, cz: number, cellW: number, cellD: number, index: number) => void) {
  const cellW = (zone.xMax - zone.xMin) / cols
  const cellD = (zone.zMax - zone.zMin) / rows
  let index = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = zone.xMin + cellW * (c + 0.5)
      const cz = zone.zMin + cellD * (r + 0.5)
      build(cx, cz, cellW, cellD, index++)
    }
  }
}

function buildDowntown(ctx: BuildContext) {
  const zone: Zone = { xMin: ROAD_WIDTH / 2 + 1.5, xMax: HALF_SIZE - 1.5, zMin: ROAD_WIDTH / 2 + 1.5, zMax: HALF_SIZE - 1.5 }
  placeGrid(zone, 4, 3, (cx, cz, cellW, cellD, i) => {
    const footprint = Math.min(cellW, cellD) * 0.58
    const height = 7 + (i % 5) * 3.6 + (i % 3 === 0 ? 4 : 0)
    addFacadeBuilding(ctx, footprint, height, footprint, pick(palette.downtown, i), cx, cz, i)
    // Alternates office/apartment towers - every downtown tower gets a real
    // lobby interior (see interiors/genericLobby.ts and the "apartments"
    // house-style route in interiors/registry.ts) rather than being a
    // walk-through-proof box with nothing behind its door.
    const kind = i % 2 === 0 ? 'office' : 'apartments'
    registerEntrance(ctx, `downtown-${i}`, kind, cx, cz, footprint, footprint, Math.PI, `${kind}:${i}`, kind === 'office' ? 'כניסה למשרדים' : 'כניסה לבניין')
  })
}

function buildResidential(ctx: BuildContext) {
  const zone: Zone = { xMin: -HALF_SIZE + 1.5, xMax: -ROAD_WIDTH / 2 - 1.5, zMin: ROAD_WIDTH / 2 + 1.5, zMax: HALF_SIZE - 1.5 }
  placeGrid(zone, 3, 4, (cx, cz, cellW, cellD, i) => {
    const w = cellW * 0.52
    const d = cellD * 0.52
    const h = 2.6
    addFacadeBuilding(ctx, w, h, d, pick(palette.residential, i), cx, cz, i + 1)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 1.6, 4), new THREE.MeshStandardMaterial({ color: palette.roof }))
    roof.rotation.y = Math.PI / 4
    roof.position.set(cx, h + 0.8, cz)
    roof.castShadow = true
    ctx.group.add(roof)
    registerEntrance(ctx, `house-${i}`, 'house', cx, cz, w, d, Math.PI, `house:${i}`, 'כניסה לבית')
  })
}

// Shops sit in the half of the SE quadrant closest to downtown; the
// parking lot takes the other half (toward the outer ring road) - kept
// as separate non-overlapping strips so the lot is actually open pavement.
const SE_QUADRANT_SPLIT_Z = -27

// Cycled across the shop grid's 8 cells so every specialty store type
// requested for GTN appears at least twice, not just as a single sample.
const SHOP_KINDS: { kind: BuildingKind; label: string }[] = [
  { kind: 'supermarket', label: 'כניסה לסופרמרקט' },
  { kind: 'clothing', label: 'כניסה לחנות בגדים' },
  { kind: 'gunshop', label: 'כניסה לחנות נשק' },
  { kind: 'cardealer', label: 'כניסה לאולם מכוניות' },
]

function buildShops(ctx: BuildContext) {
  const zone: Zone = { xMin: ROAD_WIDTH / 2 + 1.5, xMax: HALF_SIZE - 1.5, zMin: SE_QUADRANT_SPLIT_Z, zMax: -ROAD_WIDTH / 2 - 7 }
  placeGrid(zone, 4, 2, (cx, cz, cellW, cellD, i) => {
    const w = cellW * 0.62
    const d = cellD * 0.62
    const h = 3.2
    addFacadeBuilding(ctx, w, h, d, pick(palette.shop, i), cx, cz, i + 2)
    const sign = box(w * 0.8, 0.6, 0.15, 0xffffff)
    sign.position.set(cx, h + 0.4, cz + d / 2)
    ctx.group.add(sign)
    const { kind, label } = SHOP_KINDS[i % SHOP_KINDS.length]
    registerEntrance(ctx, `shop-${i}`, kind, cx, cz, w, d, 0, `${kind}:${Math.floor(i / SHOP_KINDS.length)}`, label)
  })
}

function buildParkingLot(ctx: BuildContext) {
  const x0 = ROAD_WIDTH / 2 + 1
  const x1 = HALF_SIZE - 1
  const z0 = -HALF_SIZE + 1
  const z1 = SE_QUADRANT_SPLIT_Z - 1
  const lot = box(x1 - x0, 0.1, z1 - z0, palette.parkingLot)
  lot.position.set((x0 + x1) / 2, 0.05, (z0 + z1) / 2)
  lot.receiveShadow = true
  ctx.group.add(lot)

  const stripes = 6
  for (let i = 0; i < stripes; i++) {
    const stripe = box(0.15, 0.12, (z1 - z0) * 0.7, palette.parkingLine)
    stripe.position.set(x0 + ((x1 - x0) / stripes) * (i + 0.5), 0.12, (z0 + z1) / 2)
    ctx.group.add(stripe)
  }
}

function buildPark(ctx: BuildContext) {
  const zone: Zone = { xMin: -HALF_SIZE + 1.5, xMax: -ROAD_WIDTH / 2 - 1.5, zMin: -HALF_SIZE + 1.5, zMax: -ROAD_WIDTH / 2 - 1.5 }
  const lawnW = zone.xMax - zone.xMin
  const lawnD = zone.zMax - zone.zMin
  const lawn = planeTextured(lawnW, lawnD, grassTexture(lawnW / 4, lawnD / 4), 0xdfffe6)
  lawn.position.set((zone.xMin + zone.xMax) / 2, 0.03, (zone.zMin + zone.zMax) / 2)
  ctx.group.add(lawn)

  // Perimeter fence around the lawn, built from instanced segments.
  const perimeter: [number, number, number][] = []
  const segLen = 2
  for (let x = zone.xMin; x < zone.xMax; x += segLen) {
    perimeter.push([x + segLen / 2, zone.zMin, 0])
    perimeter.push([x + segLen / 2, zone.zMax, 0])
  }
  for (let z = zone.zMin; z < zone.zMax; z += segLen) {
    perimeter.push([zone.xMin, z + segLen / 2, Math.PI / 2])
    perimeter.push([zone.xMax, z + segLen / 2, Math.PI / 2])
  }
  const fenceGeo = new THREE.BoxGeometry(segLen * 0.92, 0.7, 0.08)
  const fenceMat = new THREE.MeshStandardMaterial({ color: palette.fence })
  const fenceMesh = new THREE.InstancedMesh(fenceGeo, fenceMat, perimeter.length)
  fenceMesh.castShadow = true
  const dummy = new THREE.Object3D()
  perimeter.forEach(([x, z, ry], i) => {
    dummy.position.set(x, 0.35, z)
    dummy.rotation.set(0, ry, 0)
    dummy.updateMatrix()
    fenceMesh.setMatrixAt(i, dummy.matrix)
    const half = segLen / 2
    const fx = ry === 0 ? half : 0.35
    const fz = ry === 0 ? 0.35 : half
    ctx.colliders.push({ minX: x - fx, maxX: x + fx, minZ: z - fz, maxZ: z + fz })
  })
  fenceMesh.instanceMatrix.needsUpdate = true
  ctx.group.add(fenceMesh)
  ctx.collidableMeshes.push(fenceMesh)

  // Trees
  const treeSpots: [number, number][] = []
  placeGrid(zone, 4, 4, (cx, cz, _w, _d, i) => {
    if (i % 2 === 0) treeSpots.push([cx, cz])
  })
  buildTrees(ctx, treeSpots)

  // Benches facing the lawn's central path
  const benchSpots: [number, number, number][] = [
    [zone.xMin + 2, (zone.zMin + zone.zMax) / 2 - 3, 0],
    [zone.xMin + 2, (zone.zMin + zone.zMax) / 2 + 3, 0],
    [zone.xMax - 2, (zone.zMin + zone.zMax) / 2, Math.PI],
  ]
  buildBenches(ctx, benchSpots)
}

export function buildTrees(ctx: BuildContext, spots: [number, number][]) {
  if (spots.length === 0) return
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.4, 8)
  const trunkMat = new THREE.MeshStandardMaterial({ color: palette.trunk })
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length)
  trunkMesh.castShadow = true

  const leavesGeo = new THREE.SphereGeometry(1.1, 10, 10)
  const leavesMat = new THREE.MeshStandardMaterial({ color: palette.leaves })
  const leavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMat, spots.length)
  leavesMesh.castShadow = true

  const dummy = new THREE.Object3D()
  spots.forEach(([x, z], i) => {
    dummy.position.set(x, 0.7, z)
    dummy.updateMatrix()
    trunkMesh.setMatrixAt(i, dummy.matrix)
    dummy.position.set(x, 2, z)
    dummy.updateMatrix()
    leavesMesh.setMatrixAt(i, dummy.matrix)
    ctx.colliders.push({ minX: x - 0.22, maxX: x + 0.22, minZ: z - 0.22, maxZ: z + 0.22 })
  })
  trunkMesh.instanceMatrix.needsUpdate = true
  leavesMesh.instanceMatrix.needsUpdate = true
  ctx.group.add(trunkMesh, leavesMesh)
}

export function buildPalmTrees(ctx: BuildContext, spots: [number, number][]) {
  if (spots.length === 0) return
  const trunkGeo = new THREE.CylinderGeometry(0.1, 0.2, 2.6, 7)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.85 })
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length)
  trunkMesh.castShadow = true

  const frondGeo = new THREE.ConeGeometry(0.22, 1.7, 5)
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x3fae55, roughness: 0.8 })
  const fronds = 6
  const frondMesh = new THREE.InstancedMesh(frondGeo, frondMat, spots.length * fronds)
  frondMesh.castShadow = true

  const dummy = new THREE.Object3D()
  let frondIndex = 0
  spots.forEach(([x, z], i) => {
    const lean = (Math.sin(i * 3.1) * 0.06)
    dummy.position.set(x, 1.3, z)
    dummy.rotation.set(0, 0, lean)
    dummy.updateMatrix()
    trunkMesh.setMatrixAt(i, dummy.matrix)
    ctx.colliders.push({ minX: x - 0.2, maxX: x + 0.2, minZ: z - 0.2, maxZ: z + 0.2 })

    const crownY = 2.7
    for (let f = 0; f < fronds; f++) {
      const angle = (f / fronds) * Math.PI * 2
      dummy.position.set(x + Math.cos(angle) * 0.35, crownY, z + Math.sin(angle) * 0.35)
      dummy.rotation.set(Math.PI / 2.5, 0, angle)
      dummy.updateMatrix()
      frondMesh.setMatrixAt(frondIndex++, dummy.matrix)
    }
  })
  trunkMesh.instanceMatrix.needsUpdate = true
  frondMesh.instanceMatrix.needsUpdate = true
  ctx.group.add(trunkMesh, frondMesh)
}

export function buildBenches(ctx: BuildContext, spots: [number, number, number][]) {
  if (spots.length === 0) return
  const seatGeo = new THREE.BoxGeometry(1.2, 0.1, 0.4)
  const seatMat = new THREE.MeshStandardMaterial({ color: palette.benchSeat })
  const seatMesh = new THREE.InstancedMesh(seatGeo, seatMat, spots.length)
  seatMesh.castShadow = true

  const legGeo = new THREE.BoxGeometry(1.2, 0.4, 0.08)
  const legMat = new THREE.MeshStandardMaterial({ color: palette.bench })
  const legMesh = new THREE.InstancedMesh(legGeo, legMat, spots.length)

  const dummy = new THREE.Object3D()
  spots.forEach(([x, z, ry], i) => {
    dummy.position.set(x, 0.45, z)
    dummy.rotation.set(0, ry, 0)
    dummy.updateMatrix()
    seatMesh.setMatrixAt(i, dummy.matrix)
    dummy.position.set(x, 0.2, z)
    dummy.updateMatrix()
    legMesh.setMatrixAt(i, dummy.matrix)
    ctx.colliders.push({ minX: x - 0.6, maxX: x + 0.6, minZ: z - 0.2, maxZ: z + 0.2 })
  })
  seatMesh.instanceMatrix.needsUpdate = true
  legMesh.instanceMatrix.needsUpdate = true
  ctx.group.add(seatMesh, legMesh)
}

export function buildUmbrellas(ctx: BuildContext, spots: [number, number][]) {
  if (spots.length === 0) return
  const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6)
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xf4f0e6 })
  const poleMesh = new THREE.InstancedMesh(poleGeo, poleMat, spots.length)

  const canopyGeo = new THREE.ConeGeometry(1.1, 0.6, 8)
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
  const canopyMesh = new THREE.InstancedMesh(canopyGeo, canopyMat, spots.length)
  canopyMesh.castShadow = true

  const dummy = new THREE.Object3D()
  spots.forEach(([x, z], i) => {
    dummy.position.set(x, 0.8, z)
    dummy.updateMatrix()
    poleMesh.setMatrixAt(i, dummy.matrix)
    dummy.position.set(x, 1.7, z)
    dummy.updateMatrix()
    canopyMesh.setMatrixAt(i, dummy.matrix)
    canopyMesh.setColorAt(i, new THREE.Color(palette.umbrella[i % palette.umbrella.length]))
  })
  poleMesh.instanceMatrix.needsUpdate = true
  canopyMesh.instanceMatrix.needsUpdate = true
  if (canopyMesh.instanceColor) canopyMesh.instanceColor.needsUpdate = true
  ctx.group.add(poleMesh, canopyMesh)
}

function buildBeach(ctx: BuildContext) {
  const beachW = BEACH_HALF_WIDTH * 2
  const beachD = SHORE_Z - SAND_END_Z
  const sand = planeTextured(beachW, beachD, sandTexture(beachW / 4, beachD / 3))
  sand.position.set(0, 0.04, (SHORE_Z + SAND_END_Z) / 2)
  ctx.group.add(sand)

  const boardwalk = box(BEACH_HALF_WIDTH * 2, 0.15, BOARDWALK_Z0 - BOARDWALK_Z1, palette.boardwalk)
  boardwalk.position.set(0, 0.075, (BOARDWALK_Z0 + BOARDWALK_Z1) / 2)
  ctx.group.add(boardwalk)

  buildUmbrellas(ctx, [
    [-32, SHORE_Z - 7],
    [-16, SHORE_Z - 11],
    [8, SHORE_Z - 7],
    [24, SHORE_Z - 11],
    [38, SHORE_Z - 6],
  ])

  // A palm-lined promenade on the open sand, clearly south of the ring
  // road/boardwalk strip so trunks never poke up through the asphalt.
  const palmZ = SAND_END_Z + 4
  const palmSpots: [number, number][] = []
  for (let x = -BEACH_HALF_WIDTH + 4; x <= BEACH_HALF_WIDTH - 4; x += 8) {
    if (Math.abs(x) <= PIER_HALF_WIDTH + 1.5) continue // keep the pier approach clear
    palmSpots.push([x, palmZ])
  }
  buildPalmTrees(ctx, palmSpots)
}

function buildPier(ctx: BuildContext) {
  const length = PIER_START_Z - PIER_END_Z
  const deck = box(PIER_HALF_WIDTH * 2, 0.25, length, palette.pierWood)
  deck.position.set(0, PIER_HEIGHT, (PIER_START_Z + PIER_END_Z) / 2)
  ctx.group.add(deck)
  ctx.collidableMeshes.push(deck)

  const pileSpots: [number, number][] = []
  for (let z = PIER_START_Z - 3; z > PIER_END_Z; z -= 6) {
    pileSpots.push([-PIER_HALF_WIDTH + 0.4, z])
    pileSpots.push([PIER_HALF_WIDTH - 0.4, z])
  }
  const pileGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.2, 6)
  const pileMat = new THREE.MeshStandardMaterial({ color: palette.pierWood })
  const pileMesh = new THREE.InstancedMesh(pileGeo, pileMat, pileSpots.length)
  const dummy = new THREE.Object3D()
  pileSpots.forEach(([x, z], i) => {
    dummy.position.set(x, PIER_HEIGHT - 1.0, z)
    dummy.updateMatrix()
    pileMesh.setMatrixAt(i, dummy.matrix)
  })
  pileMesh.instanceMatrix.needsUpdate = true
  ctx.group.add(pileMesh)

  // Shoreline colliders keep wheeled vehicles from driving into the sea,
  // leaving only the pier corridor open (and capped at its tip). The
  // walking player does NOT get these - stepping past the shore is how
  // swimming starts, so they're kept in a separate list.
  const farZ = OCEAN_CENTER_Z - OCEAN_DEPTH
  ctx.shorelineColliders.push({ minX: -600, maxX: -PIER_HALF_WIDTH, minZ: farZ, maxZ: SAND_END_Z })
  ctx.shorelineColliders.push({ minX: PIER_HALF_WIDTH, maxX: 600, minZ: farZ, maxZ: SAND_END_Z })
  ctx.shorelineColliders.push({ minX: -PIER_HALF_WIDTH, maxX: PIER_HALF_WIDTH, minZ: farZ, maxZ: PIER_END_Z })
}

function buildTrafficLights(ctx: BuildContext) {
  const offset = ROAD_WIDTH / 2 + 1
  const corners: [number, number][] = [
    [offset, offset],
    [-offset, offset],
    [offset, -offset],
    [-offset, -offset],
  ]
  const poleGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.6, 8)
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
  const poleMesh = new THREE.InstancedMesh(poleGeo, poleMat, corners.length)
  poleMesh.castShadow = true

  const headGeo = new THREE.BoxGeometry(0.3, 0.7, 0.22)
  const headMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c })
  const headMesh = new THREE.InstancedMesh(headGeo, headMat, corners.length)

  const dotGeo = new THREE.CircleGeometry(0.07, 12)
  const redMat = new THREE.MeshStandardMaterial({ color: 0x3a0d0d, emissive: 0xff2d2d, emissiveIntensity: 0.15 })
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0x3a330d, emissive: 0xffcf2d, emissiveIntensity: 0.15 })
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x123a1a, emissive: 0x2dff6a, emissiveIntensity: 0.95 })

  const dummy = new THREE.Object3D()
  corners.forEach(([x, z], i) => {
    dummy.position.set(x, 1.3, z)
    dummy.rotation.set(0, 0, 0)
    dummy.updateMatrix()
    poleMesh.setMatrixAt(i, dummy.matrix)

    const facing = Math.atan2(-x, -z)
    dummy.position.set(x, 2.5, z)
    dummy.rotation.set(0, facing, 0)
    dummy.updateMatrix()
    headMesh.setMatrixAt(i, dummy.matrix)

    const dots = new THREE.Group()
    ;[
      { mat: redMat, y: 0.22 },
      { mat: yellowMat, y: 0 },
      { mat: greenMat, y: -0.22 },
    ].forEach(({ mat, y }) => {
      const dot = new THREE.Mesh(dotGeo, mat)
      dot.position.set(0, y, 0.115)
      dots.add(dot)
    })
    dots.position.set(x, 2.5, z)
    dots.rotation.y = facing
    ctx.group.add(dots)
  })
  poleMesh.instanceMatrix.needsUpdate = true
  headMesh.instanceMatrix.needsUpdate = true
  ctx.group.add(poleMesh, headMesh)
}

const PARKED_CAR_COLORS = [0x2f6fd6, 0xd63f3f, 0xe0a637, 0x4fb0c9, 0x7226f5]

/** Where a parked car sits and what color it is - pure placement data, not a mesh. GameCanvas builds the actual driveable `VehicleController` from each spot, the same way it builds every other vehicle instance, so these cars are full instances a player can enter rather than static scenery. */
export interface ParkedCarSpawn {
  position: THREE.Vector3
  heading: number
  color: number
}

function buildParkedCarSpawns(): ParkedCarSpawn[] {
  // Tucked just outside the ring road (never inside a building zone, the
  // pier corridor, or the beach transition).
  const spots: [number, number, number, number][] = [
    [HALF_SIZE + 3, 15, 0, 0],
    [HALF_SIZE + 3, 28, Math.PI, 1],
    [-HALF_SIZE - 3, -15, Math.PI, 2],
    [-HALF_SIZE - 3, -28, 0, 3],
    [10, HALF_SIZE + 3, Math.PI / 2, 4],
  ]
  return spots.map(([x, z, heading, colorIdx]) => ({
    position: new THREE.Vector3(x, 0, z),
    heading,
    color: PARKED_CAR_COLORS[colorIdx % PARKED_CAR_COLORS.length],
  }))
}

function buildAirport(ctx: BuildContext) {
  const apronZ0 = AIRPORT_Z0 - 6
  const apronDepth = 16

  // Apron (where the plane parks) plus the runway strip north of it.
  const apron = planeTextured(RUNWAY_WIDTH + 6, apronDepth, asphaltTexture(2, apronDepth / 3))
  apron.position.set(0, ROAD_Y, apronZ0 + apronDepth / 2)
  ctx.group.add(apron)

  const runway = planeTextured(RUNWAY_WIDTH, RUNWAY_LENGTH, asphaltTexture(1.5, RUNWAY_LENGTH / 6))
  runway.position.set(0, ROAD_Y, (AIRPORT_Z0 + AIRPORT_Z1) / 2)
  ctx.group.add(runway)

  for (let z = AIRPORT_Z0 + 3; z < AIRPORT_Z1 - 3; z += 6) {
    const stripe = plane(0.5, 3, palette.roadLine)
    stripe.position.set(0, ROAD_Y + 0.01, z)
    ctx.group.add(stripe)
  }

  // A short connector road up from the city's north gate to the apron.
  const connector = planeTextured(ROAD_WIDTH, AIRPORT_GAP + 2, asphaltTexture(ROAD_WIDTH / 2, 2))
  connector.position.set(0, ROAD_Y, HALF_SIZE + AIRPORT_GAP / 2)
  ctx.group.add(connector)

  // Control tower.
  const towerBase = addFacadeBuilding(ctx, 3.2, 8, 3.2, 0x7a8494, -RUNWAY_WIDTH / 2 - 5, apronZ0 + 3, 9)
  const cabin = box(4, 1.8, 4, 0xbfd8e6)
  cabin.position.set(towerBase.position.x, 8 + 0.9, towerBase.position.z)
  ctx.group.add(cabin)
  ctx.collidableMeshes.push(cabin)
  ctx.colliders.push({ minX: towerBase.position.x - 2, maxX: towerBase.position.x + 2, minZ: towerBase.position.z - 2, maxZ: towerBase.position.z + 2 })

  // A small hangar beside the apron.
  const hangarX = RUNWAY_WIDTH / 2 + 6
  const hangarZ = apronZ0 + 4
  const hangar = box(9, 4.5, 8, 0xc9ccd1)
  hangar.position.set(hangarX, 2.25, hangarZ)
  ctx.group.add(hangar)
  ctx.collidableMeshes.push(hangar)
  ctx.colliders.push({ minX: hangarX - 4.5, maxX: hangarX + 4.5, minZ: hangarZ - 4, maxZ: hangarZ + 4 })
  const hangarRoof = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 8, 12, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x9aa3ad }))
  hangarRoof.rotation.z = Math.PI / 2
  hangarRoof.rotation.y = Math.PI / 2
  hangarRoof.position.set(hangarX, 4.5, hangarZ)
  hangarRoof.castShadow = true
  ctx.group.add(hangarRoof)

  // Windsock.
  const sockPoleGeo = new THREE.CylinderGeometry(0.05, 0.05, 3, 6)
  const sockPole = new THREE.Mesh(sockPoleGeo, new THREE.MeshStandardMaterial({ color: 0x999999 }))
  sockPole.position.set(RUNWAY_WIDTH / 2 + 2.5, 1.5, AIRPORT_Z0 + 4)
  ctx.group.add(sockPole)
  const sock = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.1, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0xff7a3d, side: THREE.DoubleSide }))
  sock.rotation.z = Math.PI / 2
  sock.position.set(RUNWAY_WIDTH / 2 + 2.5 + 0.55, 2.8, AIRPORT_Z0 + 4)
  ctx.group.add(sock)
}

export interface CityBuild {
  group: THREE.Group
  colliders: Collider[]
  shorelineColliders: Collider[]
  collidableMeshes: THREE.Object3D[]
  parkedCarSpawns: ParkedCarSpawn[]
  buildingEntrances: BuildingEntranceSpawn[]
}

export function buildCity(): CityBuild {
  const ctx: BuildContext = { group: new THREE.Group(), colliders: [], shorelineColliders: [], collidableMeshes: [], buildingEntrances: [] }
  ctx.group.name = 'gtn-city'

  buildGround(ctx)
  buildRoads(ctx)
  buildCrosswalks(ctx)
  buildSidewalksAndLamps(ctx)
  buildSigns(ctx)
  buildTrafficLights(ctx)
  const parkedCarSpawns = buildParkedCarSpawns()
  buildDowntown(ctx)
  buildResidential(ctx)
  buildShops(ctx)
  buildParkingLot(ctx)
  buildPark(ctx)
  buildBeach(ctx)
  buildPier(ctx)
  buildAirport(ctx)

  return { ...ctx, parkedCarSpawns }
}
