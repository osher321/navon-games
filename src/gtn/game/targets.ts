import * as THREE from 'three'

/**
 * Original practice-range drone targets (not characters) - a hovering,
 * slowly rotating core with a glowing health ring. Deliberately not a
 * humanoid "enemy" design, to stay clearly original and avoid any
 * resemblance to another game's characters.
 */
export interface Target {
  group: THREE.Group
  /** What the weapon system raycasts against - a single mesh per target keeps hit-testing trivial (no need to walk up parents to find the owning target). */
  hitMesh: THREE.Object3D
  applyDamage(amount: number): void
  update(dt: number, elapsed: number): void
  readonly health: number
  readonly isDestroyed: boolean
}

const MAX_HEALTH = 30
const RESPAWN_DELAY = 4
const HIT_FLASH_TIME = 0.08

export function buildTarget(position: THREE.Vector3, seed: number): Target {
  const group = new THREE.Group()
  group.position.copy(position)
  const baseY = position.y

  const coreMat = new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.5, metalness: 0.4, emissive: 0x000000 })
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), coreMat)
  core.castShadow = true
  group.add(core)

  const ringMat = new THREE.MeshStandardMaterial({ color: 0xff4d4d, emissive: 0xff4d4d, emissiveIntensity: 0.8 })
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 8, 20), ringMat)
  ring.rotation.x = Math.PI / 2
  group.add(ring)

  let health = MAX_HEALTH
  let destroyed = false
  let respawnRemaining = 0
  let flashRemaining = 0
  const bobPhase = seed * 1.3

  function reset() {
    health = MAX_HEALTH
    destroyed = false
    group.visible = true
    ringMat.color.set(0xff4d4d)
  }

  return {
    group,
    hitMesh: core,
    get health() {
      return health
    },
    get isDestroyed() {
      return destroyed
    },
    applyDamage(amount: number) {
      if (destroyed) return
      health -= amount
      flashRemaining = HIT_FLASH_TIME
      if (health <= 0) {
        destroyed = true
        group.visible = false
        respawnRemaining = RESPAWN_DELAY
      } else {
        const t = Math.max(0, health / MAX_HEALTH)
        ringMat.color.setRGB(1, 0.3 + t * 0.4, 0.3 * t)
      }
    },
    update(dt: number, elapsed: number) {
      if (destroyed) {
        respawnRemaining -= dt
        if (respawnRemaining <= 0) reset()
        return
      }
      group.position.y = baseY + Math.sin(elapsed * 1.4 + bobPhase) * 0.3
      group.rotation.y += dt * 0.6
      if (flashRemaining > 0) {
        flashRemaining -= dt
        coreMat.emissive.setRGB(1, 1, 1)
        coreMat.emissiveIntensity = Math.max(0, flashRemaining / HIT_FLASH_TIME)
      } else {
        coreMat.emissiveIntensity = 0
      }
    },
  }
}

/**
 * On the open grass beside the airport runway (east side, clear of the
 * hangar and the runway/apron itself) - confirmed-empty ground rather than
 * the downtown grid, where hand-picked coordinates could easily land inside
 * a building footprint.
 */
export const TARGET_SPOTS: THREE.Vector3[] = [
  new THREE.Vector3(18, 2, 68),
  new THREE.Vector3(24, 2.4, 74),
  new THREE.Vector3(20, 1.8, 80),
  new THREE.Vector3(28, 2.2, 70),
  new THREE.Vector3(26, 2, 84),
]
