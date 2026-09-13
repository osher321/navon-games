import * as THREE from 'three'
import { waveHeightAt } from './water'
import { isInWater, SAND_END_Z, OCEAN_CENTER_Z, OCEAN_DEPTH, BOAT_SPAWN } from './world'

/**
 * Marine life for the open ocean - small pods of dolphins that wander a
 * loose area, occasionally break the surface in a jump arc, and splash
 * back in. Built from the same primitives-only, no-imported-asset style as
 * every other original model in GTN, and driven by a per-dolphin state
 * machine rather than a bones/skin animation pipeline (the same tradeoff
 * `humanoid.ts` already makes for the player/NPCs).
 *
 * Deliberately *not* InstancedMesh: each dolphin needs its own independent
 * tail-sway phase, jump-arc progress and body pitch baked into its own
 * transform hierarchy every frame, and the total dolphin count here is
 * small (a handful of pods of 3-4 each) - the same "one Group per actor"
 * approach `npc.ts`/`traffic.ts` already use at a similar scale. What
 * *does* matter at ocean scale - and what's implemented below - is never
 * running a pod's full swim/jump simulation while the player is nowhere
 * near it.
 */

// ---------- Deterministic placement ----------

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const POD_RADIUS = 9
const SWIM_DEPTH = 0.55
const JUMP_HEIGHT = 2.1
const JUMP_DURATION = 1.5
const RISE_DURATION = 0.5
const DOLPHIN_COLORS = [0x5c6b78, 0x4f5f6e, 0x6b7885, 0x3f4d5c]

// ---------- Dolphin model ----------

interface DolphinRig {
  root: THREE.Group
  tailPivot: THREE.Group
}

function buildDolphinModel(color: number): DolphinRig {
  const root = new THREE.Group()
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.08 })
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xd8dfe4, roughness: 0.6 })

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.1, 6, 10), bodyMat)
  body.rotation.z = Math.PI / 2
  body.position.y = 0.02
  body.castShadow = true
  root.add(body)

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), bellyMat)
  belly.scale.set(1.6, 0.6, 0.8)
  belly.position.set(0, -0.16, 0)
  root.add(belly)

  const rostrum = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 8), bodyMat)
  rostrum.rotation.z = -Math.PI / 2
  rostrum.position.set(0.85, -0.02, 0)
  root.add(rostrum)

  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 3), bodyMat)
  dorsal.position.set(0.05, 0.32, 0)
  dorsal.rotation.z = 0.15
  root.add(dorsal)

  for (const side of [-1, 1]) {
    const pec = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 3), bodyMat)
    pec.rotation.z = Math.PI / 2 + side * 0.5
    pec.rotation.x = side * 0.3
    pec.position.set(0.15, -0.1, side * 0.28)
    root.add(pec)
  }

  // Tail: a pivot at the rear of the body so it can sway independently -
  // the same "pivot group + child mesh" trick the humanoid rig uses for
  // limbs, just for a side-to-side fin instead of a swinging leg.
  const tailPivot = new THREE.Group()
  tailPivot.position.set(-0.68, 0, 0)
  root.add(tailPivot)

  const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.4, 8), bodyMat)
  stock.rotation.z = Math.PI / 2
  stock.position.set(-0.2, 0, 0)
  tailPivot.add(stock)

  for (const side of [-1, 1]) {
    const fluke = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 3), bodyMat)
    fluke.rotation.x = Math.PI / 2
    fluke.rotation.z = Math.PI / 2
    fluke.position.set(-0.42, 0, side * 0.12)
    fluke.scale.set(1, 1, 0.4)
    tailPivot.add(fluke)
  }

  return { root, tailPivot }
}

// ---------- Splash effect ----------

interface SplashEffect {
  group: THREE.Group
  trigger: () => void
  update: (dt: number) => void
}

function buildSplashEffect(): SplashEffect {
  const group = new THREE.Group()
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xdff3fa, transparent: true, opacity: 0, side: THREE.DoubleSide })
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.3, 16), ringMat)
  ring.rotation.x = -Math.PI / 2
  group.add(ring)

  const dropletCount = 5
  const dropletMat = new THREE.MeshBasicMaterial({ color: 0xeaf7fb, transparent: true, opacity: 0 })
  const droplets: { mesh: THREE.Mesh; vel: THREE.Vector3 }[] = []
  for (let i = 0; i < dropletCount; i++) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), dropletMat)
    group.add(mesh)
    droplets.push({ mesh, vel: new THREE.Vector3() })
  }

  let remaining = 0
  const DURATION = 0.55

  return {
    group,
    trigger() {
      remaining = DURATION
      const angleStep = (Math.PI * 2) / dropletCount
      droplets.forEach((d, i) => {
        d.mesh.position.set(0, 0, 0)
        const angle = angleStep * i + Math.random() * 0.6
        const speed = 1.4 + Math.random() * 0.8
        d.vel.set(Math.cos(angle) * speed * 0.4, speed, Math.sin(angle) * speed * 0.4)
      })
    },
    update(dt: number) {
      if (remaining <= 0) {
        if (ringMat.opacity !== 0) ringMat.opacity = 0
        if (dropletMat.opacity !== 0) dropletMat.opacity = 0
        return
      }
      remaining -= dt
      const t = Math.max(0, remaining / DURATION)
      ringMat.opacity = t * 0.7
      ring.scale.setScalar(1 + (1 - t) * 2.5)
      dropletMat.opacity = t
      for (const d of droplets) {
        d.mesh.position.addScaledVector(d.vel, dt)
        d.vel.y -= 4 * dt
      }
    },
  }
}

// ---------- One dolphin's state machine ----------

type DolphinState = 'swim' | 'rise' | 'jump'

interface Dolphin {
  root: THREE.Group
  tailPivot: THREE.Group
  splash: SplashEffect
  state: DolphinState
  heading: number
  turnRate: number
  x: number
  z: number
  swimSpeed: number
  stateTime: number
  nextJumpIn: number
  jumpStartX: number
  jumpStartZ: number
  jumpHeading: number
  tailPhase: number
}

const SWIM_SPEED = 1.1
const JUMP_SPEED = 3.6

function withinPod(x: number, z: number, cx: number, cz: number) {
  return Math.hypot(x - cx, z - cz) < POD_RADIUS
}

export interface DolphinPod {
  group: THREE.Group
  center: THREE.Vector3
  /** Full swim/jump/splash simulation - only worth calling when the player is close enough to actually notice. `boostedDolphin`, when given, gets a much shorter wait before its next jump - used to make whichever dolphin is nearest the player perform "special moments" more often. */
  update: (dt: number, elapsed: number, boostedDolphin: Dolphin | null) => void
  /** Cheap idle bob so a pod isn't frozen mid-air if the player lingers just outside the active radius - no state-machine work, just riding the waves. */
  updateIdle: (elapsed: number) => void
  dolphins: Dolphin[]
}

function buildPod(center: THREE.Vector3, count: number, placementRng: () => number, seedOffset: number): DolphinPod {
  const group = new THREE.Group()
  const dolphins: Dolphin[] = []

  for (let i = 0; i < count; i++) {
    const rig = buildDolphinModel(DOLPHIN_COLORS[(seedOffset + i) % DOLPHIN_COLORS.length])
    group.add(rig.root)
    const splash = buildSplashEffect()
    group.add(splash.group)

    const angle = placementRng() * Math.PI * 2
    const dist = placementRng() * POD_RADIUS * 0.6
    const x = center.x + Math.cos(angle) * dist
    const z = center.z + Math.sin(angle) * dist
    rig.root.position.set(x, 0, z)

    dolphins.push({
      root: rig.root,
      tailPivot: rig.tailPivot,
      splash,
      state: 'swim',
      heading: placementRng() * Math.PI * 2,
      turnRate: 0,
      x,
      z,
      swimSpeed: SWIM_SPEED * (0.8 + placementRng() * 0.4),
      stateTime: 0,
      // Staggered so a whole pod never jumps in sync - explicitly required.
      nextJumpIn: 3 + placementRng() * 9,
      jumpStartX: x,
      jumpStartZ: z,
      jumpHeading: 0,
      tailPhase: placementRng() * Math.PI * 2,
    })
  }

  const updateOne = (d: Dolphin, dt: number, elapsed: number, jumpBoost: boolean) => {
    d.stateTime += dt

    if (d.state === 'swim') {
      // Gentle wander, staying loosely within the pod's home radius -
      // steer back toward center if drifting out instead of a hard clamp,
      // which reads as a current/school instinct rather than an invisible wall.
      if (!withinPod(d.x, d.z, center.x, center.z)) {
        const toCenterAngle = Math.atan2(center.z - d.z, center.x - d.x)
        let delta = toCenterAngle - d.heading
        delta = Math.atan2(Math.sin(delta), Math.cos(delta))
        d.heading += delta * Math.min(1, 2 * dt)
      } else {
        d.turnRate += (Math.random() - 0.5) * dt * 0.6
        d.turnRate = Math.max(-0.4, Math.min(0.4, d.turnRate))
        d.heading += d.turnRate * dt
      }
      d.x += Math.cos(d.heading) * d.swimSpeed * dt
      d.z += Math.sin(d.heading) * d.swimSpeed * dt

      const surface = waveHeightAt(d.x, d.z, elapsed)
      d.root.position.set(d.x, surface - SWIM_DEPTH, d.z)
      d.root.rotation.set(0, -d.heading + Math.PI / 2, 0)
      d.tailPhase += dt * 3.5
      d.tailPivot.rotation.y = Math.sin(d.tailPhase) * 0.35

      d.nextJumpIn -= dt * (jumpBoost ? 3.5 : 1)
      if (d.nextJumpIn <= 0 && isInWater(d.x, d.z) && withinPod(d.x, d.z, center.x, center.z)) {
        d.state = 'rise'
        d.stateTime = 0
        d.jumpStartX = d.x
        d.jumpStartZ = d.z
        d.jumpHeading = d.heading
      }
      return
    }

    if (d.state === 'rise') {
      // Straightens out and accelerates toward the surface before breaking
      // it, rather than snapping straight into the jump arc.
      const t = Math.min(1, d.stateTime / RISE_DURATION)
      d.x = d.jumpStartX + Math.cos(d.jumpHeading) * SWIM_SPEED * d.stateTime
      d.z = d.jumpStartZ + Math.sin(d.jumpHeading) * SWIM_SPEED * d.stateTime
      const surface = waveHeightAt(d.x, d.z, elapsed)
      d.root.position.set(d.x, surface - SWIM_DEPTH * (1 - t), d.z)
      d.root.rotation.set(t * 0.5, -d.jumpHeading + Math.PI / 2, 0)
      d.tailPhase += dt * 6
      d.tailPivot.rotation.y = Math.sin(d.tailPhase) * 0.5
      if (t >= 1) {
        d.state = 'jump'
        d.stateTime = 0
        d.jumpStartX = d.x
        d.jumpStartZ = d.z
      }
      return
    }

    // 'jump'
    const t = Math.min(1, d.stateTime / JUMP_DURATION)
    d.x = d.jumpStartX + Math.cos(d.jumpHeading) * JUMP_SPEED * d.stateTime
    d.z = d.jumpStartZ + Math.sin(d.jumpHeading) * JUMP_SPEED * d.stateTime
    const surface = waveHeightAt(d.x, d.z, elapsed)
    // A smooth up-and-over arc (half a sine wave) - derivative at t gives a
    // natural nose-up-then-nose-down pitch for free instead of a separate
    // curve to fake it.
    const arc = Math.sin(t * Math.PI)
    const y = surface + arc * JUMP_HEIGHT
    const pitch = Math.cos(t * Math.PI) * 0.9
    d.root.position.set(d.x, y, d.z)
    d.root.rotation.set(pitch, -d.jumpHeading + Math.PI / 2, 0)
    d.tailPhase += dt * 10
    d.tailPivot.rotation.y = Math.sin(d.tailPhase) * 0.6

    if (t >= 1) {
      d.state = 'swim'
      d.stateTime = 0
      d.heading = d.jumpHeading
      d.nextJumpIn = 6 + Math.random() * 14
      d.splash.trigger()
    }
    d.splash.group.position.set(d.x, waveHeightAt(d.x, d.z, elapsed), d.z)
  }

  return {
    group,
    center,
    dolphins,
    update(dt, elapsed, boosted) {
      for (const d of dolphins) updateOne(d, dt, elapsed, d === boosted)
      for (const d of dolphins) d.splash.update(dt)
    },
    updateIdle(elapsed) {
      for (const d of dolphins) {
        const surface = waveHeightAt(d.x, d.z, elapsed)
        d.root.position.y = surface - SWIM_DEPTH
      }
    },
  }
}

/** Every pod-center candidate is rejected/retried against these until one lands cleanly in open water, well clear of the shoreline and of vehicle spawns (a boat or jet ski should never suddenly have a dolphin surface inside it). */
function pickPodCenters(count: number, rng: () => number): THREE.Vector3[] {
  const centers: THREE.Vector3[] = []
  const avoid: [number, number, number][] = [[BOAT_SPAWN.x, BOAT_SPAWN.z, 18], [4, -71, 18]]
  const zMin = OCEAN_CENTER_Z - OCEAN_DEPTH / 2 + 12
  const zMax = SAND_END_Z - 14
  const xSpan = 70

  let guard = 0
  while (centers.length < count && guard < 500) {
    guard++
    const x = (rng() * 2 - 1) * xSpan
    const z = zMin + rng() * (zMax - zMin)
    if (!isInWater(x, z)) continue
    if (avoid.some(([ax, az, r]) => Math.hypot(x - ax, z - az) < r)) continue
    if (centers.some((c) => Math.hypot(x - c.x, z - c.z) < POD_RADIUS * 2.5)) continue
    centers.push(new THREE.Vector3(x, 0, z))
  }
  return centers
}

/** Builds every dolphin pod for the ocean - stable across reloads (same seed -> same layout) but spread out, not clustered in one spot. */
export function buildDolphinPods(seed = 1337): DolphinPod[] {
  const rng = mulberry32(seed)
  const centers = pickPodCenters(5, rng)
  return centers.map((center, i) => buildPod(center, 3 + Math.floor(rng() * 2), rng, i * 3))
}
