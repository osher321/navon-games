import * as THREE from 'three'
import type { Collider } from './collision'

/**
 * Builds the original GTN neighborhood - every shape here is a primitive
 * (boxes, planes, cylinders, cones), no borrowed or GTA-style assets.
 * The layout is a ring road + cross intersection carving the map into four
 * distinct zones: downtown, residential, park, and shops/parking, dressed
 * with sidewalks, crosswalks, fences, benches, signs, lamps and trees.
 */

export const HALF_SIZE = 46
export const SPAWN_POINT = new THREE.Vector3(3, 0, 10)

const ROAD_WIDTH = 9
const ROAD_Y = 0.02
const SIDEWALK_WIDTH = 1.8

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

const palette = {
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

interface BuildContext {
  group: THREE.Group
  colliders: Collider[]
  shorelineColliders: Collider[]
  collidableMeshes: THREE.Object3D[]
}

function box(w: number, h: number, d: number, color: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color }))
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function plane(w: number, d: number, color: number, receiveShadow = true) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color }))
  mesh.rotation.x = -Math.PI / 2
  mesh.receiveShadow = receiveShadow
  return mesh
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}

function addSolidBox(ctx: BuildContext, w: number, h: number, d: number, color: number, cx: number, cz: number, cy = h / 2) {
  const mesh = box(w, h, d, color)
  mesh.position.set(cx, cy, cz)
  ctx.group.add(mesh)
  ctx.collidableMeshes.push(mesh)
  ctx.colliders.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 })
  return mesh
}

function buildGround(ctx: BuildContext) {
  const ground = plane(HALF_SIZE * 2 + 20, HALF_SIZE * 2 + 20, palette.grass)
  ground.position.y = 0
  ctx.group.add(ground)
}

function buildRoads(ctx: BuildContext) {
  const group = ctx.group
  const span = HALF_SIZE * 2

  const horiz = plane(span, ROAD_WIDTH, palette.road)
  horiz.position.y = ROAD_Y
  group.add(horiz)

  const vert = plane(ROAD_WIDTH, span, palette.road)
  vert.position.y = ROAD_Y
  group.add(vert)

  const ring = [
    { w: span, d: ROAD_WIDTH, x: 0, z: HALF_SIZE },
    { w: span, d: ROAD_WIDTH, x: 0, z: -HALF_SIZE },
    { w: ROAD_WIDTH, d: span, x: HALF_SIZE, z: 0 },
    { w: ROAD_WIDTH, d: span, x: -HALF_SIZE, z: 0 },
  ]
  ring.forEach(({ w, d, x, z }) => {
    const seg = plane(w, d, palette.road)
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
    const walk = box(span, 0.2, SIDEWALK_WIDTH, palette.sidewalk)
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

interface Zone {
  xMin: number
  xMax: number
  zMin: number
  zMax: number
}

function placeGrid(zone: Zone, cols: number, rows: number, build: (cx: number, cz: number, cellW: number, cellD: number, index: number) => void) {
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
    addSolidBox(ctx, footprint, height, footprint, pick(palette.downtown, i), cx, cz)
  })
}

function buildResidential(ctx: BuildContext) {
  const zone: Zone = { xMin: -HALF_SIZE + 1.5, xMax: -ROAD_WIDTH / 2 - 1.5, zMin: ROAD_WIDTH / 2 + 1.5, zMax: HALF_SIZE - 1.5 }
  placeGrid(zone, 3, 4, (cx, cz, cellW, cellD, i) => {
    const w = cellW * 0.52
    const d = cellD * 0.52
    const h = 2.6
    addSolidBox(ctx, w, h, d, pick(palette.residential, i), cx, cz)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 1.6, 4), new THREE.MeshStandardMaterial({ color: palette.roof }))
    roof.rotation.y = Math.PI / 4
    roof.position.set(cx, h + 0.8, cz)
    roof.castShadow = true
    ctx.group.add(roof)
  })
}

// Shops sit in the half of the SE quadrant closest to downtown; the
// parking lot takes the other half (toward the outer ring road) - kept
// as separate non-overlapping strips so the lot is actually open pavement.
const SE_QUADRANT_SPLIT_Z = -27

function buildShops(ctx: BuildContext) {
  const zone: Zone = { xMin: ROAD_WIDTH / 2 + 1.5, xMax: HALF_SIZE - 1.5, zMin: SE_QUADRANT_SPLIT_Z, zMax: -ROAD_WIDTH / 2 - 7 }
  placeGrid(zone, 4, 2, (cx, cz, cellW, cellD, i) => {
    const w = cellW * 0.62
    const d = cellD * 0.62
    const h = 3.2
    addSolidBox(ctx, w, h, d, pick(palette.shop, i), cx, cz)
    const sign = box(w * 0.8, 0.6, 0.15, 0xffffff)
    sign.position.set(cx, h + 0.4, cz + d / 2)
    ctx.group.add(sign)
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
  const lawn = plane(zone.xMax - zone.xMin, zone.zMax - zone.zMin, 0x4fbf5f)
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

function buildTrees(ctx: BuildContext, spots: [number, number][]) {
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

function buildBenches(ctx: BuildContext, spots: [number, number, number][]) {
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

function buildUmbrellas(ctx: BuildContext, spots: [number, number][]) {
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
  const sand = plane(BEACH_HALF_WIDTH * 2, SHORE_Z - SAND_END_Z, palette.sand)
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

export interface CityBuild {
  group: THREE.Group
  colliders: Collider[]
  shorelineColliders: Collider[]
  collidableMeshes: THREE.Object3D[]
}

export function buildCity(): CityBuild {
  const ctx: BuildContext = { group: new THREE.Group(), colliders: [], shorelineColliders: [], collidableMeshes: [] }
  ctx.group.name = 'gtn-city'

  buildGround(ctx)
  buildRoads(ctx)
  buildCrosswalks(ctx)
  buildSidewalksAndLamps(ctx)
  buildSigns(ctx)
  buildDowntown(ctx)
  buildResidential(ctx)
  buildShops(ctx)
  buildParkingLot(ctx)
  buildPark(ctx)
  buildBeach(ctx)
  buildPier(ctx)

  return ctx
}
