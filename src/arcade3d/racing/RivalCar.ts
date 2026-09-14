import * as THREE from 'three'
import { VehicleController } from '../../gtn/game/vehicles/VehicleController'
import { buildCar } from '../../gtn/game/vehicles/models'
import { VEHICLE_CONFIGS } from '../../gtn/game/vehicles/types'

const ARRIVE_DIST = 5
const TURN_GAIN = 2.4

/**
 * A rival racer - the exact same waypoint-follow autopilot technique GTN's
 * `buildTrafficCar` uses for looping city traffic (steer toward the next
 * waypoint, throttle scaled down the more the car has to turn), just driven
 * around the race's own checkpoint loop instead of a street grid, with a
 * per-rival speed multiplier and a small fixed lateral offset so 3 rivals
 * on the same line don't perfectly overlap.
 */
export class RivalCar {
  readonly controller: VehicleController
  private targetIndex: number
  readonly laneOffset: number
  private readonly speedMul: number
  laps = 0

  constructor(waypoints: THREE.Vector3[], startIndex: number, colorSeed: number, speedMul: number, laneOffset: number) {
    const colors = [0xd63f3f, 0x2f6fd6, 0xe0a637, 0x3fae55]
    const model = buildCar(colors[colorSeed % colors.length])
    const config = { ...VEHICLE_CONFIGS.car, maxSpeed: VEHICLE_CONFIGS.car.maxSpeed * speedMul }
    const start = waypoints[startIndex]
    this.controller = new VehicleController(config, model, start.clone(), 0)
    this.targetIndex = (startIndex + 1) % waypoints.length
    this.speedMul = speedMul
    this.laneOffset = laneOffset
  }

  update(dt: number, waypoints: THREE.Vector3[]) {
    const dest = waypoints[this.targetIndex]
    const dx = dest.x - this.controller.position.x
    const dz = dest.z - this.controller.position.z
    const dist = Math.hypot(dx, dz)
    if (dist < ARRIVE_DIST) {
      const wasLast = this.targetIndex === waypoints.length - 1
      this.targetIndex = (this.targetIndex + 1) % waypoints.length
      if (wasLast) this.laps++
    }

    const desiredHeading = Math.atan2(dx, dz)
    let delta = desiredHeading - this.controller.heading
    delta = Math.atan2(Math.sin(delta), Math.cos(delta))
    const steer = Math.max(-1, Math.min(1, delta * TURN_GAIN))
    const throttle = Math.max(0.45, 1 - Math.abs(delta) * 0.5) * this.speedMul

    this.controller.update(dt, throttle, steer, [])
  }
}
