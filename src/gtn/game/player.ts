import * as THREE from 'three'
import { buildHumanoid, animateHumanoid, animateSwimStroke, HIP_HEIGHT, type HumanoidParts } from './humanoid'
import { resolveMove, type Collider } from './collision'
import { WORLD_SOUTH_LIMIT, WORLD_NORTH_LIMIT, WORLD_EAST_LIMIT, WORLD_WEST_LIMIT, getGroundHeightAt, isInWater } from './world'
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
const PARACHUTE_FALL_SPEED = 3.2
const PARACHUTE_DRIFT_SPEED = 3.5

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
  private parachutingNow = false
  private parachuteVelY = 0
  private aiming = false

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

  get isParachuting() {
    return this.parachutingNow
  }

  /** Adds a weapon model (or any other held prop) to the fixed torso-mounted socket - a one-time attach, not re-parented per equip/holster (visibility is what toggles). */
  attachWeapon(model: THREE.Object3D) {
    this.parts.weaponSocket.add(model)
  }

  /** Whether the arm-aim pose override below should be applied this frame - set every frame by whatever owns the weapon (e.g. WeaponSystem.isEquipped), not stored as a persistent mode switch here, so the character rig stays a plain state holder. */
  setAiming(active: boolean) {
    this.aiming = active
  }

  /**
   * Ejects the character mid-air with a canopy already open - used when
   * dismounting an air vehicle well above the ground. `worldPos` is the
   * hip-height position to start the fall from (see `sitInVehicle` for why
   * HIP_HEIGHT is subtracted back out).
   */
  startParachute(worldPos: THREE.Vector3, heading: number) {
    this.root.position.set(worldPos.x, worldPos.y - HIP_HEIGHT, worldPos.z)
    this.root.rotation.x = 0
    this.facingValue = heading
    this.root.rotation.y = heading
    this.parachutingNow = true
    this.parachuteVelY = 0
    this.parts.parachute.visible = true
    this.parts.leftArm.rotation.x = -1.3
    this.parts.rightArm.rotation.x = -1.3
    this.parts.leftArm.rotation.z = 0.5
    this.parts.rightArm.rotation.z = -0.5
    this.parts.leftLeg.rotation.x = 0.15
    this.parts.rightLeg.rotation.x = 0.15
  }

  /**
   * While riding, the vehicle owns the character's position - it's placed
   * in the seat every frame instead of running the normal walk controller.
   * `worldHipPos` is where the hips should appear in world space; `root`
   * is a foot-level origin (the hips ride HIP_HEIGHT above it), so that
   * offset has to be subtracted back out here or the character would float
   * HIP_HEIGHT above the seat. `heading` is synced into the same facing
   * state `update()` uses so turning smoothly resumes (instead of
   * snapping) the moment they dismount and start walking again.
   */
  sitInVehicle(worldHipPos: THREE.Vector3, heading: number) {
    this.root.position.set(worldHipPos.x, worldHipPos.y - HIP_HEIGHT, worldHipPos.z)
    this.root.rotation.x = 0
    this.facingValue = heading
    this.root.rotation.y = heading
  }

  /** A static seated pose (legs forward into the footwell, arms toward the wheel) - held for as long as `sitInVehicle` is being called each frame. */
  setDrivingPose() {
    this.parts.leftLeg.rotation.x = 1.3
    this.parts.rightLeg.rotation.x = 1.3
    this.parts.leftArm.rotation.x = -1.15
    this.parts.rightArm.rotation.x = -1.15
    this.parts.leftArm.rotation.z = 0.12
    this.parts.rightArm.rotation.z = -0.12
  }

  /**
   * worldMoveX/Z: absolute world-space direction, magnitude 0..1 (joystick
   * tilt or keyboard). `time`: total elapsed seconds, used to sample the
   * water surface while swimming. `indoor`, when given, swaps the outdoor
   * ground-height/world-bounds/water logic for an interior's own floor
   * height function (real stairs are just a ramp in that function) and
   * room bounds, and disables swimming entirely - the exact same walk/run/
   * jump/collision code just runs against a different floor and a smaller
   * box instead of the open world.
   */
  update(
    dt: number,
    worldMoveX: number,
    worldMoveZ: number,
    running: boolean,
    jumpRequested: boolean,
    colliders: Collider[],
    time: number,
    indoor?: { heightAt: (x: number, z: number) => number; bounds: { minX: number; maxX: number; minZ: number; maxZ: number } }
  ) {
    if (this.parachutingNow) {
      this.updateParachute(dt, worldMoveX, worldMoveZ)
      return
    }

    const inWater = !indoor && isInWater(this.root.position.x, this.root.position.z)
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
      const groundY = indoor ? indoor.heightAt(this.root.position.x, this.root.position.z) : getGroundHeightAt(this.root.position.x, this.root.position.z)
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

    const bounds = indoor
      ? indoor.bounds
      : { minX: WORLD_WEST_LIMIT, maxX: WORLD_EAST_LIMIT, minZ: WORLD_SOUTH_LIMIT, maxZ: WORLD_NORTH_LIMIT }
    this.root.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.root.position.x))
    this.root.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.root.position.z))

    const targetSpeed01 = moving ? (running ? 1.5 : 1) * inputMag : 0
    this.currentSpeed01 += (targetSpeed01 - this.currentSpeed01) * Math.min(1, dt * 6)

    if (inWater) {
      this.animPhase += dt * (4 + this.currentSpeed01 * 3)
      animateSwimStroke(this.parts, this.animPhase, this.currentSpeed01, dt)
    } else {
      this.animPhase += dt * (6 + this.currentSpeed01 * 5)
      animateHumanoid(this.parts, this.animPhase, this.currentSpeed01, dt)
    }

    // Overrides just the arms (after the walk/swim cycle above already set
    // them) to a steady two-handed aim pose - legs/torso keep animating
    // normally, so the character can still walk while aiming instead of
    // freezing in place like the vehicle-driving pose does.
    if (this.aiming) {
      this.parts.leftArm.rotation.x = -1.25
      this.parts.rightArm.rotation.x = -1.25
      this.parts.leftArm.rotation.z = 0.14
      this.parts.rightArm.rotation.z = -0.14
    }
  }

  /** Controlled canopy descent: slow terminal fall speed plus free horizontal steering, until the ground comes up to meet them. */
  private updateParachute(dt: number, worldMoveX: number, worldMoveZ: number) {
    const inputMag = Math.min(1, Math.hypot(worldMoveX, worldMoveZ))
    if (inputMag > 0.02) {
      const dirX = worldMoveX / inputMag
      const dirZ = worldMoveZ / inputMag
      const dist = PARACHUTE_DRIFT_SPEED * dt * inputMag
      this.root.position.x += dirX * dist
      this.root.position.z += dirZ * dist

      const targetFacing = Math.atan2(worldMoveX, worldMoveZ)
      let delta = targetFacing - this.facingValue
      delta = Math.atan2(Math.sin(delta), Math.cos(delta))
      this.facingValue += delta * Math.min(1, TURN_LERP * dt)
      this.root.rotation.y = this.facingValue
    }

    this.parachuteVelY = Math.max(this.parachuteVelY - 6 * dt, -PARACHUTE_FALL_SPEED)
    this.root.position.y += this.parachuteVelY * dt

    this.root.position.x = Math.max(WORLD_WEST_LIMIT, Math.min(WORLD_EAST_LIMIT, this.root.position.x))
    this.root.position.z = Math.max(WORLD_SOUTH_LIMIT, Math.min(WORLD_NORTH_LIMIT, this.root.position.z))

    const groundY = getGroundHeightAt(this.root.position.x, this.root.position.z)
    if (this.root.position.y <= groundY) {
      this.root.position.y = groundY
      this.parachutingNow = false
      this.parachuteVelY = 0
      this.parts.parachute.visible = false
    }
  }
}
