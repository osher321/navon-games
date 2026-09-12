import * as THREE from 'three'

const MOVE_SPEED = 6.2
const JUMP_VELOCITY = 7
const GRAVITY = 20
const TURN_LERP = 10

/**
 * A small original capsule character (no borrowed model/rig). Movement is
 * a lightweight kinematic integrator - enough to walk, run and jump around
 * the neighborhood. A full collision/physics system is a later stage.
 */
export class Player {
  readonly root: THREE.Group
  readonly velocityY = { value: 0 }
  private grounded = true
  private facingValue = 0

  constructor() {
    this.root = new THREE.Group()

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.42, 0.9, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0x2fb6a8 })
    )
    body.position.y = 0.87
    body.castShadow = true
    this.root.add(body)

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 14), new THREE.MeshStandardMaterial({ color: 0xf2c49b }))
    head.position.y = 1.62
    head.castShadow = true
    this.root.add(head)

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0xe0a637 }))
    nose.rotation.x = Math.PI / 2
    nose.position.set(0, 1.62, 0.32)
    this.root.add(nose)
  }

  get position() {
    return this.root.position
  }

  get facing() {
    return this.facingValue
  }

  /** worldMoveX/Z: absolute world-space direction, both -1..1; the character auto-faces its travel direction. */
  update(dt: number, worldMoveX: number, worldMoveZ: number, jumpRequested: boolean) {
    const moving = worldMoveX !== 0 || worldMoveZ !== 0
    if (moving) {
      this.root.position.x += worldMoveX * MOVE_SPEED * dt
      this.root.position.z += worldMoveZ * MOVE_SPEED * dt
      const targetFacing = Math.atan2(worldMoveX, worldMoveZ)
      let delta = targetFacing - this.facingValue
      delta = Math.atan2(Math.sin(delta), Math.cos(delta))
      this.facingValue += delta * Math.min(1, TURN_LERP * dt)
      this.root.rotation.y = this.facingValue
    }

    if (jumpRequested && this.grounded) {
      this.velocityY.value = JUMP_VELOCITY
      this.grounded = false
    }

    this.velocityY.value -= GRAVITY * dt
    this.root.position.y += this.velocityY.value * dt
    if (this.root.position.y <= 0) {
      this.root.position.y = 0
      this.velocityY.value = 0
      this.grounded = true
    }

    const half = 34.5
    this.root.position.x = Math.max(-half, Math.min(half, this.root.position.x))
    this.root.position.z = Math.max(-half, Math.min(half, this.root.position.z))
  }
}
