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
  /** The orbit angle (radians, added to targetFacing) the camera settles toward when nothing is actively dragging - 0 (default, omitted) is the original "directly behind" framing; Math.PI is "directly in front" (facing the character). A manual drag still overrides this instantly and always eases back to whatever restYaw the current call passes. */
  restYaw?: number
}

const FOLLOW_LERP = 5.5
// How fast a manual orbit drag (see addOrbitYaw) relaxes back to the
// default "directly behind the character" framing once the drag ends -
// tuned so a quick look-around feels responsive but gameplay always
// settles back to the familiar follow-behind view within ~1.5s.
const ORBIT_DECAY = 1.6
// Only ever used as a floor for the *obstructed* case below - just enough
// to avoid the camera landing exactly on top of (or behind) the character
// when a wall sits right against them. Not a general "stay this far back"
// minimum; open outdoor framing is untouched.
const NEAR_FLOOR = 0.3
const WALL_BUFFER = 0.15

/**
 * Third-person chase camera that stays behind whatever it's tracking (the
 * walking character, or a vehicle) and raycasts against the world so it
 * never clips through buildings/fences - if a wall is in the way, the
 * camera pulls in front of it instead of poking through. The distance/
 * height/look-height can be overridden per call, so the same instance
 * reframes itself automatically when the player gets in a vehicle or walks
 * into a building interior.
 *
 * Occluders are always raycast recursively: outdoor occluders are plain
 * meshes (recursing into a leaf mesh is a no-op, so this changes nothing
 * there), but every interior wall (`roomKit.ts`) is a `THREE.Group` holding
 * the actual wall-segment meshes as children - a non-recursive raycast can
 * never hit a Group (it has no geometry of its own), so occlusion against
 * interior walls silently never fired at all before this.
 */
export class ChaseCamera {
  readonly camera: THREE.PerspectiveCamera
  private currentPos = new THREE.Vector3()
  private raycaster = new THREE.Raycaster()
  // Walls sitting directly between the camera and the character right now
  // are temporarily hidden rather than left to block the view - a second,
  // independent safety net on top of the pull-in above, for the tight
  // corners (stairwells, small rooms) where even the closest valid
  // pulled-in position can still have an unrelated wall poking across it.
  private hiddenWalls = new Set<THREE.Object3D>()
  // A manual look-around offset added on top of `targetFacing` (see
  // addOrbitYaw) - eases toward whichever `cfg.restYaw` the current call
  // passes (0 = behind, Math.PI = in front/face-on) once nothing is
  // actively dragging to orbit the view. This is purely a viewing
  // feature: it never touches targetFacing/targetPos themselves, so
  // movement, aiming, and every other consumer of player.facing is
  // completely unaffected.
  private orbitYaw = 0
  // Snaps orbitYaw straight to that frame's restYaw instead of easing into
  // it - set on construction and again by resetOcclusion() (scene cuts),
  // so the very first frame after spawning or teleporting (into/out of a
  // building) already shows the correct default framing (e.g. the face)
  // instead of visibly swinging into place over ~1.5s.
  private snapOrbitNextUpdate = true

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.1, 220)
  }

  setAspect(aspect: number) {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  /** Nudges the manual orbit offset - call this from a drag handler (mouse or touch) with the frame's horizontal delta to let the camera swing all the way around the character (front/side/back) independent of their movement facing. */
  addOrbitYaw(delta: number) {
    this.orbitYaw += delta
  }

  update(dt: number, targetPos: THREE.Vector3, targetFacing: number, occluders: THREE.Object3D[], cfg: ChaseCameraConfig = DEFAULT_CFG) {
    const restYaw = cfg.restYaw ?? 0
    if (this.snapOrbitNextUpdate) {
      this.orbitYaw = restYaw
      this.snapOrbitNextUpdate = false
    } else {
      this.orbitYaw += (restYaw - this.orbitYaw) * Math.min(1, ORBIT_DECAY * dt)
    }
    const effectiveFacing = targetFacing + this.orbitYaw
    const anchor = new THREE.Vector3(targetPos.x, targetPos.y + cfg.lookHeight, targetPos.z)
    const back = new THREE.Vector3(Math.sin(effectiveFacing), 0, Math.cos(effectiveFacing)).multiplyScalar(-cfg.distance)
    const desired = new THREE.Vector3(anchor.x + back.x, anchor.y + cfg.height, anchor.z + back.z)

    let target = desired
    if (occluders.length > 0) {
      const toDesired = desired.clone().sub(anchor)
      const fullDistance = toDesired.length()
      const dir = toDesired.normalize()
      this.raycaster.set(anchor, dir)
      this.raycaster.far = fullDistance
      const hits = this.raycaster.intersectObjects(occluders, true)
      if (hits.length > 0) {
        // Never place the camera further from the anchor than the
        // obstruction allows - clamping *up* to a fixed minimum here (the
        // old behavior) could push the camera past a wall that's closer
        // than that minimum, which is exactly how a wall ended up between
        // the camera and the character in small interior rooms. The floor
        // only guards against a degenerate zero/negative distance.
        const safeDistance = Math.max(NEAR_FLOOR, Math.min(hits[0].distance - WALL_BUFFER, fullDistance))
        target = anchor.clone().add(dir.multiplyScalar(safeDistance))
      }
    }

    if (this.currentPos.lengthSq() === 0) this.currentPos.copy(target)
    const t = Math.min(1, FOLLOW_LERP * dt)
    this.currentPos.lerp(target, t)

    this.camera.position.copy(this.currentPos)
    this.camera.lookAt(anchor)

    this.updateWallVisibility(anchor, occluders)
  }

  /**
   * Hides whatever's directly between the final camera position and the
   * character this frame, restoring anything hidden last frame that no
   * longer qualifies - one extra raycast against the same (small, current-
   * interior-only when indoors) occluder list already used above, not a
   * per-wall-per-frame system.
   */
  private updateWallVisibility(anchor: THREE.Vector3, occluders: THREE.Object3D[]) {
    const next = new Set<THREE.Object3D>()
    if (occluders.length > 0) {
      const toAnchor = anchor.clone().sub(this.camera.position)
      const dist = toAnchor.length()
      if (dist > 0.05) {
        toAnchor.normalize()
        this.raycaster.set(this.camera.position, toAnchor)
        this.raycaster.far = dist - 0.05
        for (const hit of this.raycaster.intersectObjects(occluders, true)) next.add(hit.object)
      }
    }
    for (const mesh of this.hiddenWalls) {
      if (!next.has(mesh)) mesh.visible = true
    }
    for (const mesh of next) mesh.visible = false
    this.hiddenWalls = next
  }

  /** Restores any currently-hidden wall segments and forgets them - called when switching scenes (entering/exiting a building) so a reference into the scene just left behind never lingers. */
  resetOcclusion() {
    for (const mesh of this.hiddenWalls) mesh.visible = true
    this.hiddenWalls.clear()
    this.currentPos.set(0, 0, 0)
    this.snapOrbitNextUpdate = true
  }
}
