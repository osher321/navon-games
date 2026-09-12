import * as THREE from 'three'

const DEFAULT_CFG: ChaseCameraConfig = {
  distance: 5.6,
  height: 2.6,
  lookHeight: 1.3,
}

export interface ChaseCameraConfig {
  distance: number
  height: number
  lookHeight: number
}

const FOLLOW_LERP = 5.5
const MIN_DISTANCE = 1.6

/**
 * Third-person chase camera that stays behind whatever it's tracking (the
 * walking character, or a vehicle) and raycasts against the city so it
 * never clips through buildings/fences - if a wall is in the way, the
 * camera pulls in front of it instead of poking through. The distance/
 * height/look-height can be overridden per call, so the same instance
 * reframes itself automatically when the player gets in a vehicle.
 */
export class ChaseCamera {
  readonly camera: THREE.PerspectiveCamera
  private currentPos = new THREE.Vector3()
  private raycaster = new THREE.Raycaster()

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.1, 220)
  }

  setAspect(aspect: number) {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  update(dt: number, targetPos: THREE.Vector3, targetFacing: number, occluders: THREE.Object3D[], cfg: ChaseCameraConfig = DEFAULT_CFG) {
    const anchor = new THREE.Vector3(targetPos.x, targetPos.y + cfg.lookHeight, targetPos.z)
    const back = new THREE.Vector3(Math.sin(targetFacing), 0, Math.cos(targetFacing)).multiplyScalar(-cfg.distance)
    const desired = new THREE.Vector3(anchor.x + back.x, anchor.y + cfg.height, anchor.z + back.z)

    let target = desired
    if (occluders.length > 0) {
      const toDesired = desired.clone().sub(anchor)
      const fullDistance = toDesired.length()
      const dir = toDesired.normalize()
      this.raycaster.set(anchor, dir)
      this.raycaster.far = fullDistance
      const hits = this.raycaster.intersectObjects(occluders, false)
      if (hits.length > 0) {
        const safeDistance = Math.max(MIN_DISTANCE, hits[0].distance - 0.3)
        target = anchor.clone().add(dir.multiplyScalar(safeDistance))
      }
    }

    if (this.currentPos.lengthSq() === 0) this.currentPos.copy(target)
    const t = Math.min(1, FOLLOW_LERP * dt)
    this.currentPos.lerp(target, t)

    this.camera.position.copy(this.currentPos)
    this.camera.lookAt(anchor)
  }
}
