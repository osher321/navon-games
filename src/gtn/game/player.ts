import * as THREE from 'three'
import { buildHumanoid, animateHumanoid, animateSwimStroke, type HumanoidParts } from './humanoid'
import { resolveMove, type Collider } from './collision'
import { HALF_SIZE, WORLD_SOUTH_LIMIT, getGroundHeightAt, isInWater } from './world'
import { waveHeightAt } from './water'

const WALK_SPEED = 3.6
const RUN_SPEED = 6.6
const SWIM_SPEED = 2.8
const SWIM_FAST_SPEED = 4.6
const JUMP_VELOCITY = 7
const GRAVITY = 20
const TURN_LERP = 10
const TILT_LERP = 6
const SWIM_TILT = 1.15
const SWIM_SUBMERGE = 0.32
const PLAYER_RADIUS = 0.32
const WORLD_MARGIN = HALF_SIZE + 8

/**
 * The player's original low-poly humanoid, with a lightweight kinematic
 * controller: walk/run speed, jump/gravity, wall collision (sliding along
 * obstacles rather than stopping dead), a procedural walk/run cycle driven
 * by how fast and how hard the input is being pushed - and swimming, which
 * is just another mode of this same controller rather than a separate
 * system: crossing the shoreline (world.isInWater) swaps the vertical/
 * animation handling from "stand on the ground" to "float on the waves",
 * using the exact same WASD/joystick input and collision resolution.
 */
export class Player {
  readonly root: THREE.Group
  private parts: HumanoidParts
  private velocityYValue = 0
  private grounded = true
  private facingValue = 0
  private animPhase = 0
  private currentSpeed01 = 0
  private tiltValue = 0
  private swimmingNow = false

  constructor() {
    this.parts = buildHumanoid()
    this.root = this.parts.root
  }

  get position() {
    return this.root.position
  }

  get facing() {
    return this.facingValue
  }

  get isSwimming() {
    return this.swimmingNow
  }

  /** worldMoveX/Z: absolute world-space direction, magnitude 0..1 (joystick tilt or keyboard). `time`: total elapsed seconds, used to sample the water surface while swimming. */
  update(dt: number, worldMoveX: number, worldMoveZ: number, running: boolean, jumpRequested: boolean, colliders: Collider[], time: number) {
    const inWater = isInWater(this.root.position.x, this.root.position.z)
    this.swimmingNow = inWater

    const inputMag = Math.min(1, Math.hypot(worldMoveX, worldMoveZ))
    const moving = inputMag > 0.02
    const speed = inWater ? (running ? SWIM_FAST_SPEED : SWIM_SPEED) : running ? RUN_SPEED : WALK_SPEED

    if (moving) {
      const dirX = worldMoveX / inputMag
      const dirZ = worldMoveZ / inputMag
      const dist = speed * dt * inputMag
      const resolved = resolveMove(colliders, this.root.position.x, this.root.position.z, PLAYER_RADIUS, dirX * dist, dirZ * dist)
      this.root.position.x = resolved.x
      this.root.position.z = resolved.z

      const targetFacing = Math.atan2(worldMoveX, worldMoveZ)
      let delta = targetFacing - this.facingValue
      delta = Math.atan2(Math.sin(delta), Math.cos(delta))
      this.facingValue += delta * Math.min(1, TURN_LERP * dt)
      this.root.rotation.y = this.facingValue
    }

    if (inWater) {
      // Float on the waves instead of standing on the ground - no gravity,
      // no jumping, just settle toward the live water height each frame.
      const waterY = waveHeightAt(this.root.position.x, this.root.position.z, time) - SWIM_SUBMERGE
      this.root.position.y += (waterY - this.root.position.y) * Math.min(1, dt * 8)
      this.velocityYValue = 0
      this.grounded = true
    } else {
      const groundY = getGroundHeightAt(this.root.position.x, this.root.position.z)
      if (jumpRequested && this.grounded) {
        this.velocityYValue = JUMP_VELOCITY
        this.grounded = false
      }
      this.velocityYValue -= GRAVITY * dt
      this.root.position.y += this.velocityYValue * dt
      if (this.root.position.y <= groundY) {
        this.root.position.y = groundY
        this.velocityYValue = 0
        this.grounded = true
      }
    }

    this.tiltValue += ((inWater ? SWIM_TILT : 0) - this.tiltValue) * Math.min(1, TILT_LERP * dt)
    this.root.rotation.x = this.tiltValue

    this.root.position.x = Math.max(-WORLD_MARGIN, Math.min(WORLD_MARGIN, this.root.position.x))
    this.root.position.z = Math.max(WORLD_SOUTH_LIMIT, Math.min(WORLD_MARGIN, this.root.position.z))

    const targetSpeed01 = moving ? (running ? 1.5 : 1) * inputMag : 0
    this.currentSpeed01 += (targetSpeed01 - this.currentSpeed01) * Math.min(1, dt * 6)

    if (inWater) {
      this.animPhase += dt * (4 + this.currentSpeed01 * 3)
      animateSwimStroke(this.parts, this.animPhase, this.currentSpeed01, dt)
    } else {
      this.animPhase += dt * (6 + this.currentSpeed01 * 5)
      animateHumanoid(this.parts, this.animPhase, this.currentSpeed01, dt)
    }
  }
}
