import * as THREE from 'three'
import { VehicleController } from './vehicles/VehicleController'
import { buildCar, buildMotorcycle } from './vehicles/models'
import { VEHICLE_CONFIGS } from './vehicles/types'
import { getGroundHeightAt } from './world'
import type { LiveActor } from './regions/types'

const TRAFFIC_COLORS = [0x2f6fd6, 0xd63f3f, 0xe0a637, 0x4fb0c9, 0x7226f5, 0x3fae55, 0x8a8f94]
const ARRIVE_DIST = 4
const TURN_GAIN = 2.2

function pickColor(seed: number) {
  return TRAFFIC_COLORS[seed % TRAFFIC_COLORS.length]
}

/**
 * A scripted autopilot looping a car/motorcycle around hand-placed
 * waypoints - reuses the exact same `VehicleController` the player drives,
 * just fed throttle/steer from "face the next waypoint" instead of input.
 * No traffic-light awareness or inter-vehicle collision, matching the
 * "basic system" precedent already set for the airplane.
 */
export function buildTrafficCar(loop: THREE.Vector3[], seed: number, kind: 'car' | 'motorcycle' = 'car'): LiveActor {
  const model = kind === 'car' ? buildCar(pickColor(seed)) : buildMotorcycle(pickColor(seed))
  const config = VEHICLE_CONFIGS[kind]
  const controller = new VehicleController(config, model, loop[0].clone(), 0)
  let target = 1 % loop.length

  return {
    root: controller.root,
    update(dt: number) {
      const dest = loop[target]
      const dx = dest.x - controller.position.x
      const dz = dest.z - controller.position.z
      const dist = Math.hypot(dx, dz)
      if (dist < ARRIVE_DIST) target = (target + 1) % loop.length

      const desiredHeading = Math.atan2(dx, dz)
      let delta = desiredHeading - controller.heading
      delta = Math.atan2(Math.sin(delta), Math.cos(delta))
      const steer = Math.max(-1, Math.min(1, delta * TURN_GAIN))
      const throttle = Math.max(0.35, 1 - Math.abs(delta) * 0.6)

      controller.update(dt, throttle, steer, [])
      controller.position.y = getGroundHeightAt(controller.position.x, controller.position.z)
    },
  }
}
