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

  constructor(config: VehicleConfig, model: THREE.Object3D, position: THREE.Vector3, heading = 0) {
    this.config = config
    this.root = new THREE.Group()
    this.root.add(model)
    this.root.position.copy(position)
    this.heading = heading
    this.root.rotation.y = heading
  }

  get position() {
    return this.root.position
  }

  /** throttle: -1..1 (back = brake/reverse). steer: -1..1. */
  update(dt: number, throttle: number, steer: number, colliders: Collider[]) {
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
  }
}
