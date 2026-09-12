import * as THREE from 'three'

/**
 * Builds the original GTN neighborhood - every shape here is a primitive
 * (boxes, planes, cylinders, cones), no borrowed or GTA-style assets.
 * The layout is a simple ring road + cross intersection carving the map
 * into four quadrants: downtown, residential, park, and shops/parking.
 */

export const HALF_SIZE = 36
export const SPAWN_POINT = new THREE.Vector3(3, 0, 10)

const ROAD_WIDTH = 7
const ROAD_Y = 0.02
const SIDEWALK_WIDTH = 1.6

const palette = {
  grass: 0x3fa34d,
  road: 0x35363b,
  roadLine: 0xe8e8e0,
  sidewalk: 0xc9c4bb,
  downtown: [0x6b7a8f, 0x556274, 0x8593a6],
  residential: [0xd98a56, 0xd6b25c, 0xc27a7a],
  roof: 0x8c3f3f,
  shop: [0xe0537a, 0xe0a637, 0x4fb0c9],
  parkingLot: 0x2c2c30,
  parkingLine: 0xf2d94e,
  trunk: 0x6b4a2f,
  leaves: 0x2f8f4e,
  lampPost: 0x3a3a40,
  lampBulb: 0xfff3b0,
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

function buildGround(): THREE.Object3D {
  const ground = plane(HALF_SIZE * 2 + 20, HALF_SIZE * 2 + 20, palette.grass)
  ground.position.y = 0
  return ground
}

function buildRoads(): THREE.Group {
  const group = new THREE.Group()
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

  // Dashed center lines along the main cross
  for (let x = -HALF_SIZE + 4; x < HALF_SIZE - 4; x += 4) {
    const line = plane(1.6, 0.3, palette.roadLine)
    line.position.set(x, ROAD_Y + 0.01, 0)
    group.add(line)
  }
  for (let z = -HALF_SIZE + 4; z < HALF_SIZE - 4; z += 4) {
    const line = plane(0.3, 1.6, palette.roadLine)
    line.position.set(0, ROAD_Y + 0.01, z)
    group.add(line)
  }

  return group
}

function buildSidewalksAndLamps(): THREE.Group {
  const group = new THREE.Group()
  const span = HALF_SIZE * 2
  const inset = ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2

  ;[HALF_SIZE, -HALF_SIZE].forEach((z) => {
    const walk = box(span, 0.2, SIDEWALK_WIDTH, palette.sidewalk)
    walk.position.set(0, 0.1, z > 0 ? z - inset + ROAD_WIDTH / 2 + SIDEWALK_WIDTH / 2 : z + inset - ROAD_WIDTH / 2 - SIDEWALK_WIDTH / 2)
    group.add(walk)
  })

  const lampPositions: [number, number][] = [
    [8, 8], [-8, 8], [8, -8], [-8, -8],
    [HALF_SIZE - 3, HALF_SIZE - 3], [-HALF_SIZE + 3, HALF_SIZE - 3],
    [HALF_SIZE - 3, -HALF_SIZE + 3], [-HALF_SIZE + 3, -HALF_SIZE + 3],
  ]
  lampPositions.forEach(([x, z], i) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.4, 8), new THREE.MeshStandardMaterial({ color: palette.lampPost }))
    post.position.set(x, 1.7, z)
    post.castShadow = true
    group.add(post)

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), new THREE.MeshStandardMaterial({ color: palette.lampBulb, emissive: palette.lampBulb, emissiveIntensity: 0.9 }))
    bulb.position.set(x, 3.5, z)
    group.add(bulb)

    if (i < 2) {
      const light = new THREE.PointLight(0xfff3b0, 6, 14, 2)
      light.position.set(x, 3.5, z)
      group.add(light)
    }
  })

  return group
}

interface Quadrant {
  xMin: number
  xMax: number
  zMin: number
  zMax: number
}

function placeGrid(group: THREE.Group, q: Quadrant, cols: number, rows: number, build: (cx: number, cz: number, cellW: number, cellD: number, index: number) => THREE.Object3D | null) {
  const cellW = (q.xMax - q.xMin) / cols
  const cellD = (q.zMax - q.zMin) / rows
  let index = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = q.xMin + cellW * (c + 0.5)
      const cz = q.zMin + cellD * (r + 0.5)
      const obj = build(cx, cz, cellW, cellD, index++)
      if (obj) group.add(obj)
    }
  }
}

function buildDowntown(): THREE.Group {
  const group = new THREE.Group()
  const q: Quadrant = { xMin: ROAD_WIDTH / 2 + 1.5, xMax: HALF_SIZE - 1.5, zMin: ROAD_WIDTH / 2 + 1.5, zMax: HALF_SIZE - 1.5 }
  placeGrid(group, q, 3, 3, (cx, cz, cellW, cellD, i) => {
    const footprint = Math.min(cellW, cellD) * 0.6
    const height = 8 + (i % 4) * 4 + (i % 2 === 0 ? 3 : 0)
    const tower = box(footprint, height, footprint, pick(palette.downtown, i))
    tower.position.set(cx, height / 2, cz)
    return tower
  })
  return group
}

function buildResidential(): THREE.Group {
  const group = new THREE.Group()
  const q: Quadrant = { xMin: -HALF_SIZE + 1.5, xMax: -ROAD_WIDTH / 2 - 1.5, zMin: ROAD_WIDTH / 2 + 1.5, zMax: HALF_SIZE - 1.5 }
  placeGrid(group, q, 3, 3, (cx, cz, cellW, cellD, i) => {
    const w = cellW * 0.55
    const d = cellD * 0.55
    const h = 2.6
    const house = new THREE.Group()
    const body = box(w, h, d, pick(palette.residential, i))
    body.position.y = h / 2
    house.add(body)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 1.6, 4), new THREE.MeshStandardMaterial({ color: palette.roof }))
    roof.rotation.y = Math.PI / 4
    roof.position.y = h + 0.8
    roof.castShadow = true
    house.add(roof)
    house.position.set(cx, 0, cz)
    return house
  })
  return group
}

function buildShops(): THREE.Group {
  const group = new THREE.Group()
  const q: Quadrant = { xMin: ROAD_WIDTH / 2 + 1.5, xMax: HALF_SIZE - 1.5, zMin: -HALF_SIZE + 1.5, zMax: -ROAD_WIDTH / 2 - 6 }
  placeGrid(group, q, 3, 2, (cx, cz, cellW, cellD, i) => {
    const w = cellW * 0.65
    const d = cellD * 0.65
    const h = 3.2
    const shop = new THREE.Group()
    const body = box(w, h, d, pick(palette.shop, i))
    body.position.y = h / 2
    shop.add(body)
    const sign = box(w * 0.8, 0.6, 0.15, 0xffffff)
    sign.position.set(0, h + 0.4, d / 2)
    shop.add(sign)
    shop.position.set(cx, 0, cz)
    return shop
  })
  return group
}

function buildParkingLot(): THREE.Group {
  const group = new THREE.Group()
  const x0 = ROAD_WIDTH / 2 + 1
  const x1 = HALF_SIZE - 1
  const z0 = -HALF_SIZE + 1
  const z1 = -ROAD_WIDTH / 2 - 5
  const lot = box(x1 - x0, 0.1, z1 - z0, palette.parkingLot)
  lot.position.set((x0 + x1) / 2, 0.05, (z0 + z1) / 2)
  lot.receiveShadow = true
  group.add(lot)

  const stripes = 5
  for (let i = 0; i < stripes; i++) {
    const stripe = box(0.15, 0.12, (z1 - z0) * 0.7, palette.parkingLine)
    stripe.position.set(x0 + ((x1 - x0) / stripes) * (i + 0.5), 0.12, (z0 + z1) / 2)
    group.add(stripe)
  }
  return group
}

function buildPark(): THREE.Group {
  const group = new THREE.Group()
  const q: Quadrant = { xMin: -HALF_SIZE + 1.5, xMax: -ROAD_WIDTH / 2 - 1.5, zMin: -HALF_SIZE + 1.5, zMax: -ROAD_WIDTH / 2 - 1.5 }
  const lawn = plane(q.xMax - q.xMin, q.zMax - q.zMin, 0x4fbf5f)
  lawn.position.set((q.xMin + q.xMax) / 2, 0.03, (q.zMin + q.zMax) / 2)
  group.add(lawn)

  placeGrid(group, q, 3, 3, (cx, cz, _w, _d, i) => {
    if (i % 2 === 0) return null
    const tree = new THREE.Group()
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.4, 8), new THREE.MeshStandardMaterial({ color: palette.trunk }))
    trunk.position.y = 0.7
    trunk.castShadow = true
    tree.add(trunk)
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10), new THREE.MeshStandardMaterial({ color: palette.leaves }))
    leaves.position.y = 2
    leaves.castShadow = true
    tree.add(leaves)
    tree.position.set(cx, 0, cz)
    return tree
  })
  return group
}

export function buildCity(): THREE.Group {
  const city = new THREE.Group()
  city.name = 'gtn-city'
  city.add(buildGround())
  city.add(buildRoads())
  city.add(buildSidewalksAndLamps())
  city.add(buildDowntown())
  city.add(buildResidential())
  city.add(buildShops())
  city.add(buildParkingLot())
  city.add(buildPark())
  return city
}
