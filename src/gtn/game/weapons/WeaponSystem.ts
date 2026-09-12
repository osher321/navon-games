import * as THREE from 'three'
import { WEAPON_CONFIGS } from './types'
import { buildMinigun } from './models'
import type { Target } from '../targets'

/** A brief visual (muzzle flash / tracer / impact spark) - shown for a fixed duration then hidden, with zero per-shot allocation since the same mesh is reused every time. */
class TimedVisual {
  private remaining = 0

  constructor(public readonly mesh: THREE.Object3D) {
    mesh.visible = false
  }

  show(duration: number) {
    this.mesh.visible = true
    this.remaining = duration
  }

  update(dt: number) {
    if (!this.mesh.visible) return
    this.remaining -= dt
    if (this.remaining <= 0) this.mesh.visible = false
  }
}

export interface FireResult {
  fired: boolean
  hitTarget?: Target
}

/**
 * Owns everything about wielding one weapon: the model, equip/holster,
 * ammo/magazine/reload, fire-rate limiting, the actual raycast hit-test,
 * and the muzzle-flash/tracer/impact effects. `GameCanvas` only has to call
 * `update()` every frame and read the getters for the HUD - a second
 * weapon kind would mean a second config entry and mesh builder, not
 * changes here.
 */
export class WeaponSystem {
  readonly model: THREE.Group
  private readonly config = WEAPON_CONFIGS.minigun
  private readonly raycaster = new THREE.Raycaster()

  private equipped = false
  private magazine: number
  private reserve: number
  private cooldown = 0
  private reloading = false
  private reloadRemaining = 0

  private readonly muzzleFlash: TimedVisual
  private readonly tracer: TimedVisual
  private readonly impactSpark: TimedVisual
  private effectsAdded = false

  constructor() {
    this.model = buildMinigun()
    this.model.visible = false
    this.magazine = this.config.magazineSize
    this.reserve = this.config.reserveAmmo

    const muzzle = this.model.userData.muzzle as THREE.Object3D
    const flashMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xfff2b0, fog: false, toneMapped: false })
    )
    muzzle.add(flashMesh)
    this.muzzleFlash = new TimedVisual(flashMesh)

    const tracerGeo = new THREE.BoxGeometry(0.02, 0.02, 1)
    tracerGeo.translate(0, 0, 0.5)
    const tracerMesh = new THREE.Mesh(tracerGeo, new THREE.MeshBasicMaterial({ color: 0xfff6c8, fog: false, toneMapped: false, transparent: true, opacity: 0.85 }))
    this.tracer = new TimedVisual(tracerMesh)

    const sparkMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd23f, fog: false, toneMapped: false }))
    this.impactSpark = new TimedVisual(sparkMesh)
  }

  get isEquipped() {
    return this.equipped
  }

  get ammoInMagazine() {
    return this.magazine
  }

  get reserveAmmo() {
    return this.reserve
  }

  get isReloading() {
    return this.reloading
  }

  toggleEquip() {
    this.equipped = !this.equipped
    this.model.visible = this.equipped
    if (!this.equipped) this.reloading = false
  }

  /** Forces the weapon away - used when the player mounts a vehicle, since a minigun equipped mid-drive makes no sense and the model would clip through the seat. */
  forceHolster() {
    if (!this.equipped) return
    this.equipped = false
    this.model.visible = false
    this.reloading = false
  }

  startReload() {
    if (this.reloading || this.magazine >= this.config.magazineSize || this.reserve <= 0) return
    this.reloading = true
    this.reloadRemaining = this.config.reloadTime
  }

  /**
   * Advances cooldown/reload/barrel-spin every frame regardless of whether
   * the trigger is held, and actually fires (raycast + effects + damage)
   * at most once per frame, gated by the configured fire rate. `scene` is
   * only needed once, to parent the tracer/impact effect meshes - passing
   * it each call keeps this class from needing a constructor-time
   * dependency on the scene existing yet.
   */
  update(dt: number, firing: boolean, camera: THREE.Camera, targets: Target[], scene: THREE.Scene): FireResult {
    if (!this.effectsAdded) {
      scene.add(this.tracer.mesh, this.impactSpark.mesh)
      this.effectsAdded = true
    }

    this.muzzleFlash.update(dt)
    this.tracer.update(dt)
    this.impactSpark.update(dt)

    if (!this.equipped) return { fired: false }

    this.cooldown = Math.max(0, this.cooldown - dt)

    if (this.reloading) {
      this.reloadRemaining -= dt
      if (this.reloadRemaining <= 0) {
        const needed = this.config.magazineSize - this.magazine
        const take = Math.min(needed, this.reserve)
        this.magazine += take
        this.reserve -= take
        this.reloading = false
      }
    }

    if (firing && this.magazine <= 0 && !this.reloading) this.startReload()

    const barrelSpinner = this.model.userData.barrelSpinner as THREE.Object3D
    barrelSpinner.rotation.z += (firing && this.magazine > 0 ? 28 : 0) * dt

    const wantsToFire = firing && !this.reloading && this.magazine > 0 && this.cooldown <= 0
    if (!wantsToFire) return { fired: false }

    this.cooldown = 1 / this.config.fireRate
    this.magazine -= 1

    // Aim from the camera through screen center (the standard third-person
    // reticle convention) rather than from the barrel, so a hit always
    // matches what's on screen regardless of the gun model's exact offset
    // from the camera.
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    if (this.config.spreadRadians > 0) {
      dir.x += (Math.random() - 0.5) * this.config.spreadRadians
      dir.y += (Math.random() - 0.5) * this.config.spreadRadians
      dir.z += (Math.random() - 0.5) * this.config.spreadRadians
      dir.normalize()
    }
    this.raycaster.set(camera.position, dir)
    this.raycaster.far = this.config.range

    // Destroyed targets hide their group but the underlying hitMesh object
    // itself stays "visible" (only its parent isn't) - Raycaster only
    // checks an object's own `.visible`, not its ancestors, so without this
    // filter a destroyed-but-not-yet-respawned target would keep silently
    // absorbing hits (and spawning impact sparks in empty air) even though
    // nothing is drawn there.
    const targetMeshes = targets.filter((t) => !t.isDestroyed).map((t) => t.hitMesh)
    const hits = this.raycaster.intersectObjects(targetMeshes, false)
    let hitTarget: Target | undefined
    let hitPoint: THREE.Vector3
    if (hits.length > 0) {
      hitPoint = hits[0].point
      hitTarget = targets.find((t) => t.hitMesh === hits[0].object)
      hitTarget?.applyDamage(this.config.damage)
    } else {
      hitPoint = camera.position.clone().addScaledVector(dir, this.config.range)
    }

    this.muzzleFlash.show(0.045)

    const muzzleWorldPos = new THREE.Vector3()
    ;(this.model.userData.muzzle as THREE.Object3D).getWorldPosition(muzzleWorldPos)
    const toHit = hitPoint.clone().sub(muzzleWorldPos)
    const dist = toHit.length()
    if (dist > 0.001) {
      toHit.normalize()
      this.tracer.mesh.position.copy(muzzleWorldPos)
      this.tracer.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), toHit)
      this.tracer.mesh.scale.set(1, 1, dist)
      this.tracer.show(0.045)
    }

    if (hitTarget) {
      this.impactSpark.mesh.position.copy(hitPoint)
      this.impactSpark.show(0.08)
    }

    return { fired: true, hitTarget }
  }
}
