import * as THREE from 'three'

const DISTANCE = 6.5
const HEIGHT = 3.2
const LOOK_HEIGHT = 1.4
const FOLLOW_LERP = 4.5

/** Simple third-person chase camera - stays behind the player's facing direction. */
export class ChaseCamera {
  readonly camera: THREE.PerspectiveCamera
  private currentPos = new THREE.Vector3()

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.1, 200)
  }

  setAspect(aspect: number) {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  update(dt: number, playerPos: THREE.Vector3, playerFacing: number) {
    const behind = new THREE.Vector3(Math.sin(playerFacing), 0, Math.cos(playerFacing)).multiplyScalar(-DISTANCE)
    const desired = new THREE.Vector3(playerPos.x + behind.x, playerPos.y + HEIGHT, playerPos.z + behind.z)

    if (this.currentPos.lengthSq() === 0) this.currentPos.copy(desired)
    const t = Math.min(1, FOLLOW_LERP * dt)
    this.currentPos.lerp(desired, t)

    this.camera.position.copy(this.currentPos)
    this.camera.lookAt(playerPos.x, playerPos.y + LOOK_HEIGHT, playerPos.z)
  }
}
