import * as THREE from 'three'
import { resolveMove, type Collider } from '../collision'
import type { VehicleConfig } from './types'

/**
 * One generic kinematic driver for every vehicle kind - only the config
 * (speed/turn/radius numbers) and the mesh differ between a car, a
 * motorcycle and a jet ski. Whoever calls `update` decides which collider
 * set applies (road obstacles for car/motorcycle, the shoreline for a jet
 * ski), so the controller itself doesn't need to know about terrain.
 */
export class VehicleController {
  readonly root: THREE.Group
  readonly config: VehicleConfig
  speed = 0
  heading: number
  private readonly wheels: THREE.Object3D[] | undefined
  private readonly wheelRadius: number | undefined
  private readonly propeller: THREE.Object3D | undefined

  constructor(config: VehicleConfig, model: THREE.Object3D, position: THREE.Vector3, heading = 0) {
    this.config = config
    this.root = new THREE.Group()
    this.root.add(model)
    this.root.position.copy(position)
    this.heading = heading
    this.root.rotation.y = heading
    this.wheels = model.userData.wheels
    this.wheelRadius = model.userData.wheelRadius
    this.propeller = model.userData.propeller
  }

  get position() {
    return this.root.position
  }

  /**
   * throttle: -1..1 (back = brake/reverse). steer: -1..1. `vertical`
   * (-1..1) only matters for air vehicles: it climbs/descends the
   * altitude directly, gated by `liftoffSpeed` (if set) so a plane has to
   * build up a takeoff roll first instead of climbing straight off the
   * tarmac at a standstill.
   */
  update(dt: number, throttle: number, steer: number, colliders: Collider[], vertical = 0) {
    const cfg = this.config

    if (throttle > 0.05) {
      this.speed += cfg.acceleration * throttle * dt
    } else if (throttle < -0.05) {
      this.speed += cfg.braking * throttle * dt
    } else if (this.speed !== 0) {
      const drag = cfg.drag * dt
      this.speed = this.speed > 0 ? Math.max(0, this.speed - drag) : Math.min(0, this.speed + drag)
    }
    this.speed = Math.max(-cfg.reverseMaxSpeed, Math.min(cfg.maxSpeed, this.speed))

    const speedFrac = Math.min(1, Math.abs(this.speed) / cfg.maxSpeed)
    if (Math.abs(this.speed) > 0.05) {
      const dir = this.speed < 0 ? -1 : 1
      this.heading += steer * cfg.turnRate * (0.3 + 0.7 * speedFrac) * dt * dir
      this.root.rotation.y = this.heading
    }

    const dx = Math.sin(this.heading) * this.speed * dt
    const dz = Math.cos(this.heading) * this.speed * dt
    const resolved = resolveMove(colliders, this.root.position.x, this.root.position.z, cfg.radius, dx, dz)
    this.root.position.x = resolved.x
    this.root.position.z = resolved.z
    if (resolved.blocked) this.speed *= 0.4

    if (this.wheels && this.wheelRadius) {
      const spin = (this.speed * dt) / this.wheelRadius
      for (const w of this.wheels) w.rotation.x += spin
    }
    // The propeller's shaft points forward (local Z), not sideways like a
    // wheel's axle, so it needs its own rotation axis rather than reusing
    // the wheel-spin loop above.
    if (this.propeller && Math.abs(this.speed) > 0.05) {
      this.propeller.rotation.z += (10 + Math.abs(this.speed) * 2) * dt
    }

    if (cfg.surface === 'air' && cfg.climbRate) {
      const canClimb = !cfg.liftoffSpeed || Math.abs(this.speed) >= cfg.liftoffSpeed || this.root.position.y > 0.1
      if (canClimb) {
        const minAlt = cfg.minAltitude ?? 0
        const maxAlt = cfg.maxAltitude ?? 100
        this.root.position.y = Math.max(minAlt, Math.min(maxAlt, this.root.position.y + vertical * cfg.climbRate * dt))
      }
    }
  }
}
