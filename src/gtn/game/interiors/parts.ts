import * as THREE from 'three'
import type { Collider } from '../collision'

/**
 * Reusable furniture/fixture builders shared by every interior template -
 * a house's bed and a supermarket's checkout counter are both just boxes
 * assembled from this same small kit, which is what keeps "every building
 * gets an interior" tractable instead of hand-modeling each one. Every
 * builder takes a world position + a 90-degree-multiple rotation and
 * returns both the meshes and a world-space collider footprint, so callers
 * never have to reason about local-vs-world transforms themselves.
 */

export interface Part {
  group: THREE.Group
  colliders: Collider[]
}

function mat(color: number, roughness = 0.75, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness })
}

function mesh(geo: THREE.BufferGeometry, color: number, roughness = 0.75, metalness = 0.05) {
  const m = new THREE.Mesh(geo, mat(color, roughness, metalness))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Rotation-aware world-space AABB for an axis-aligned footprint centered at (cx,cz), swapping w/d at 90/270 degrees. */
function footprint(cx: number, cz: number, w: number, d: number, rotY: number): Collider {
  const rot4 = Math.round(rotY / (Math.PI / 2)) % 2
  const hw = (rot4 === 0 ? w : d) / 2
  const hd = (rot4 === 0 ? d : w) / 2
  return { minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd }
}

function place(group: THREE.Group, cx: number, y: number, cz: number, rotY: number) {
  group.position.set(cx, y, cz)
  group.rotation.y = rotY
}

// ---------- Bedroom ----------

export function buildBed(cx: number, cz: number, floorY: number, rotY: number, sheetColor = 0xdce6f2): Part {
  const g = new THREE.Group()
  const frame = mesh(new THREE.BoxGeometry(1.4, 0.28, 2.0), 0x6b4a32)
  frame.position.y = 0.14
  g.add(frame)
  const mattress = mesh(new THREE.BoxGeometry(1.3, 0.22, 1.9), sheetColor, 0.9)
  mattress.position.y = 0.39
  g.add(mattress)
  const pillow = mesh(new THREE.BoxGeometry(1.15, 0.12, 0.42), 0xffffff, 0.9)
  pillow.position.set(0, 0.53, -0.75)
  g.add(pillow)
  const headboard = mesh(new THREE.BoxGeometry(1.4, 0.75, 0.1), 0x4a3423)
  headboard.position.set(0, 0.55, -1.0)
  g.add(headboard)
  place(g, cx, floorY, cz, rotY)
  return { group: g, colliders: [footprint(cx, cz, 1.4, 2.0, rotY)] }
}

export function buildWardrobe(cx: number, cz: number, floorY: number, rotY: number, color = 0x5b4636): Part {
  const g = new THREE.Group()
  const body = mesh(new THREE.BoxGeometry(1.2, 1.9, 0.55), color)
  body.position.y = 0.95
  g.add(body)
  const seam = mesh(new THREE.BoxGeometry(0.03, 1.7, 0.02), 0x2a2016)
  seam.position.set(0, 0.95, 0.28)
  g.add(seam)
  for (const side of [-1, 1]) {
    const handle = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 6), 0xd8c98a, 0.4, 0.6)
    handle.rotation.z = Math.PI / 2
    handle.position.set(side * 0.08, 0.95, 0.3)
    g.add(handle)
  }
  place(g, cx, floorY, cz, rotY)
  return { group: g, colliders: [footprint(cx, cz, 1.2, 0.55, rotY)] }
}

export function buildNightstand(cx: number, cz: number, floorY: number, rotY: number, color = 0x6b4a32): Part {
  const g = new THREE.Group()
  const body = mesh(new THREE.BoxGeometry(0.42, 0.48, 0.42), color)
  body.position.y = 0.24
  g.add(body)
  const lamp = mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.22, 8), 0xf2e3b3, 0.6)
  lamp.position.y = 0.6
  g.add(lamp)
  place(g, cx, floorY, cz, rotY)
  return { group: g, colliders: [footprint(cx, cz, 0.42, 0.42, rotY)] }
}

// ---------- Shared living-room / bedroom electronics ----------

export function buildTvOnStand(cx: number, cz: number, floorY: number, rotY: number): Part {
  const g = new THREE.Group()
  const stand = mesh(new THREE.BoxGeometry(1.3, 0.42, 0.4), 0x2a2a2a, 0.5)
  stand.position.y = 0.21
  g.add(stand)
  const tv = mesh(new THREE.BoxGeometry(1.1, 0.62, 0.06), 0x101010, 0.3, 0.4)
  tv.position.set(0, 0.75, -0.14)
  g.add(tv)
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.55), new THREE.MeshStandardMaterial({ color: 0x1a3d5c, emissive: 0x14304a, emissiveIntensity: 0.5 }))
  screen.position.set(0, 0.75, -0.115)
  g.add(screen)
  place(g, cx, floorY, cz, rotY)
  return { group: g, colliders: [footprint(cx, cz, 1.3, 0.42, rotY)] }
}

// ---------- Kitchen ----------

export function buildKitchenCounterRun(cx: number, cz: number, floorY: number, rotY: number, length: number, color = 0xe4ded2): Part {
  const g = new THREE.Group()
  const cabinet = mesh(new THREE.BoxGeometry(length, 0.85, 0.6), color)
  cabinet.position.y = 0.425
  g.add(cabinet)
  const counter = mesh(new THREE.BoxGeometry(length + 0.06, 0.06, 0.64), 0x3a3a3f, 0.35, 0.2)
  counter.position.y = 0.88
  g.add(counter)
  const sinkBasin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.4), new THREE.MeshStandardMaterial({ color: 0xc9ccd1, metalness: 0.7, roughness: 0.3 }))
  sinkBasin.position.set(length * 0.22, 0.85, 0)
  g.add(sinkBasin)
  const faucet = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 6), 0xbfc4cc, 0.3, 0.7)
  faucet.position.set(length * 0.22, 1.0, -0.18)
  g.add(faucet)
  place(g, cx, floorY, cz, rotY)
  return { group: g, colliders: [footprint(cx, cz, length, 0.6, rotY)] }
}

export function buildStove(cx: number, cz: number, floorY: number, rotY: number): Part {
  const g = new THREE.Group()
  const body = mesh(new THREE.BoxGeometry(0.62, 0.85, 0.6), 0x2c2c2f, 0.4, 0.5)
  body.position.y = 0.425
  g.add(body)
  const top = mesh(new THREE.BoxGeometry(0.6, 0.03, 0.58), 0x161618, 0.3, 0.6)
  top.position.y = 0.87
  g.add(top)
  for (const [ox, oz] of [
    [-0.14, -0.13],
    [0.14, -0.13],
    [-0.14, 0.13],
    [0.14, 0.13],
  ]) {
    const burner = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12), 0x111113, 0.4, 0.5)
    burner.position.set(ox, 0.89, oz)
    g.add(burner)
  }
  place(g, cx, floorY, cz, rotY)
  return { group: g, colliders: [footprint(cx, cz, 0.62, 0.6, rotY)] }
}

export function buildFridge(cx: number, cz: number, floorY: number, rotY: number, color = 0xd8dadd): Part {
  const g = new THREE.Group()
  const body = mesh(new THREE.BoxGeometry(0.72, 1.75, 0.68), color, 0.4, 0.35)
  body.position.y = 0.875
  g.add(body)
  const seam = mesh(new THREE.BoxGeometry(0.74, 0.03, 0.02), 0x9a9ea3, 0.4)
  seam.position.set(0, 1.15, 0.35)
  g.add(seam)
  const handle = mesh(new THREE.BoxGeometry(0.04, 0.5, 0.05), 0x4a4a4a, 0.4, 0.6)
  handle.position.set(0.3, 1.0, 0.36)
  g.add(handle)
  place(g, cx, floorY, cz, rotY)
  return { group: g, colliders: [footprint(cx, cz, 0.72, 0.68, rotY)] }
}

export function buildDiningSet(cx: number, cz: number, floorY: number, rotY: number, seats = 4, color = 0x8a6a44): Part {
  const g = new THREE.Group()
  const tableW = seats <= 4 ? 1.1 : 1.6
  const table = mesh(new THREE.BoxGeometry(tableW, 0.05, 0.9), color, 0.6)
  table.position.y = 0.72
  g.add(table)
  for (let i = 0; i < 4; i++) {
    const leg = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 6), 0x4a3423, 0.7)
    leg.position.set((i % 2 === 0 ? -1 : 1) * (tableW / 2 - 0.08), 0.36, (i < 2 ? -1 : 1) * 0.38)
    g.add(leg)
  }
  const chairSpots: [number, number][] = seats <= 4 ? [[-tableW / 2 - 0.35, 0], [tableW / 2 + 0.35, 0], [0, -0.7], [0, 0.7]] : [
    [-tableW / 2 - 0.35, -0.25],
    [-tableW / 2 - 0.35, 0.25],
    [tableW / 2 + 0.35, -0.25],
    [tableW / 2 + 0.25, 0.25],
    [0, -0.65],
    [0, 0.65],
  ]
  chairSpots.forEach(([ox, oz], i) => {
    if (i >= seats) return
    const seat = mesh(new THREE.BoxGeometry(0.4, 0.06, 0.4), 0x5b4636, 0.7)
    seat.position.set(ox, 0.46, oz)
    g.add(seat)
    const back = mesh(new THREE.BoxGeometry(0.4, 0.42, 0.05), 0x5b4636, 0.7)
    back.position.set(ox, 0.7, oz + (oz >= 0 ? 0.17 : -0.17))
    g.add(back)
  })
  place(g, cx, floorY, cz, rotY)
  return { group: g, colliders: [footprint(cx, cz, tableW + 0.9, 1.7, rotY)] }
}

// ---------- Living room ----------

export function buildSofa(cx: number, cz: number, floorY: number, rotY: number, width = 1.9, color = 0x5a6b8a): Part {
  const g = new THREE.Group()
  const base = mesh(new THREE.BoxGeometry(width, 0.4, 0.85), color, 0.85)
  base.position.y = 0.2
  g.add(base)
  const back = mesh(new THREE.BoxGeometry(width, 0.5, 0.22), color, 0.85)
  back.position.set(0, 0.55, -0.32)
  g.add(back)
  for (const side of [-1, 1]) {
    const arm = mesh(new THREE.BoxGeometry(0.2, 0.45, 0.85), color, 0.85)
    arm.position.set(side * (width / 2 - 0.1), 0.42, 0)
    g.add(arm)
  }
  place(g, cx, floorY, cz, rotY)
  return { group: g, colliders: [footprint(cx, cz, width, 0.9, rotY)] }
}

export function buildCoffeeTable(cx: number, cz: number, floorY: number, rotY: number): Part {
  const g = new THREE.Group()
  const top = mesh(new THREE.BoxGeometry(0.9, 0.05, 0.5), 0x3a2e22, 0.4, 0.2)
  top.position.y = 0.38
  g.add(top)
  for (const [ox, oz] of [
    [-0.4, -0.2],
    [0.4, -0.2],
    [-0.4, 0.2],
    [0.4, 0.2],
  ]) {
    const leg = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 6), 0x2a2018, 0.5)
    leg.position.set(ox, 0.18, oz)
    g.add(leg)
  }
  place(g, cx, floorY, cz, rotY)
  return { group: g, colliders: [footprint(cx, cz, 0.9, 0.5, rotY)] }
}

export function buildMediaConsole(cx: number, cz: number, floorY: number, rotY: number): Part {
  const g = new THREE.Group()
  const body = mesh(new THREE.BoxGeometry(1.5, 0.5, 0.4), 0x2e2620, 0.5, 0.2)
  body.position.y = 0.25
  g.add(body)
  const tv = mesh(new THREE.BoxGeometry(1.3, 0.72, 0.06), 0x101010, 0.3, 0.4)
  tv.position.set(0, 0.86, -0.15)
  g.add(tv)
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.64), new THREE.MeshStandardMaterial({ color: 0x1a3d5c, emissive: 0x14304a, emissiveIntensity: 0.5 }))
  screen.position.set(0, 0.86, -0.12)
  g.add(screen)
  place(g, cx, floorY, cz, rotY)
  return { group: g, colliders: [footprint(cx, cz, 1.5, 0.4, rotY)] }
}

export function buildRug(cx: number, cz: number, floorY: number, w: number, d: number, color = 0xb0483f): Part {
  const g = new THREE.Group()
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color, roughness: 0.95 }))
  rug.rotation.x = -Math.PI / 2
  rug.position.y = 0.011
  g.add(rug)
  place(g, cx, floorY, cz, 0)
  return { group: g, colliders: [] }
}

// ---------- Bathroom ----------

/** A compact toilet + vanity sink pairing, sized to fit even the smallest house's ground floor - one fixed footprint rather than separate pieces the caller has to hand-place, since a bathroom nook is small enough that "one unit" is the natural building block. */
export function buildBathroomFixtures(cx: number, cz: number, floorY: number, rotY: number): Part {
  const g = new THREE.Group()
  const porcelain = mat(0xf2f4f6, 0.35, 0.05)

  // Toilet - a low tank + bowl, offset to one side of the footprint.
  const tank = mesh(new THREE.BoxGeometry(0.36, 0.32, 0.18), 0xf2f4f6, 0.35)
  tank.material = porcelain
  tank.position.set(-0.25, 0.16, -0.15)
  g.add(tank)
  const bowl = mesh(new THREE.CylinderGeometry(0.19, 0.15, 0.32, 12), 0xf2f4f6, 0.35)
  bowl.material = porcelain
  bowl.position.set(-0.25, 0.16, 0.08)
  g.add(bowl)
  const seat = mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 16), 0xe8eaec, 0.4)
  seat.rotation.x = -Math.PI / 2
  seat.position.set(-0.25, 0.33, 0.08)
  g.add(seat)

  // Vanity sink - a small counter with a basin and a mirror above it.
  const vanity = mesh(new THREE.BoxGeometry(0.5, 0.55, 0.35), 0xd9d2c4, 0.6)
  vanity.position.set(0.32, 0.275, 0)
  g.add(vanity)
  const basin = mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.08, 12), 0xf2f4f6, 0.3)
  basin.material = porcelain
  basin.position.set(0.32, 0.58, 0)
  g.add(basin)
  const faucet = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 6), 0xbfc4cc, 0.3, 0.7)
  faucet.position.set(0.32, 0.7, -0.12)
  g.add(faucet)
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), new THREE.MeshStandardMaterial({ color: 0xdfe8ee, metalness: 0.6, roughness: 0.15 }))
  mirror.position.set(0.32, 1.1, -0.174)
  g.add(mirror)

  place(g, cx, floorY, cz, rotY)
  return { group: g, colliders: [footprint(cx, cz, 1.0, 0.6, rotY)] }
}

// ---------- Generic decor ----------

export function buildPlant(cx: number, cz: number, floorY: number): Part {
  const g = new THREE.Group()
  const pot = mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.28, 10), 0x7a4a35, 0.8)
  pot.position.y = 0.14
  g.add(pot)
  const foliage = mesh(new THREE.SphereGeometry(0.32, 8, 6), 0x3f8a4f, 0.85)
  foliage.position.y = 0.52
  foliage.scale.y = 1.3
  g.add(foliage)
  place(g, cx, floorY, cz, 0)
  return { group: g, colliders: [footprint(cx, cz, 0.4, 0.4, 0)] }
}

export function buildStaircaseRailing(cx: number, cz: number, floorY: number, length: number, rotY: number, side: 1 | -1): Part {
  const g = new THREE.Group()
  for (let i = 0; i <= 6; i++) {
    const post = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 6), 0x6b4a32, 0.6)
    post.position.set(0, 0.42 + (i / 6) * 1.6, -length / 2 + (i / 6) * length)
    g.add(post)
  }
  const rail = mesh(new THREE.BoxGeometry(0.05, 0.05, length + 0.1), 0x6b4a32, 0.6)
  rail.position.set(0, 0.85, 0)
  rail.rotation.x = Math.atan2(1.6, length)
  g.add(rail)
  place(g, cx, floorY, cz, rotY)
  g.position.x += Math.cos(rotY) * side * 0
  return { group: g, colliders: [] }
}
