import * as THREE from 'three'
import type { Collider } from '../collision'
import type { RegionDef, RegionBuild, LiveActor } from './types'
import type { TrafficVehicle } from '../traffic'
import type { VehicleController } from '../vehicles/VehicleController'
import type { BuildingEntranceSpawn } from '../interiors/types'

const LOAD_MARGIN = 40
// Bigger than LOAD_MARGIN on purpose - without this gap, standing right on a
// region's boundary would build and dispose it every single check, once per
// direction of travel.
const UNLOAD_MARGIN = 90
const CHECK_INTERVAL_FRAMES = 20

interface ActiveRegion {
  def: RegionDef
  build: RegionBuild
}

/**
 * Proximity-based world streaming: this is the whole "LOD" strategy for the
 * expanded map - instead of building cheaper distant meshes, distant
 * districts simply don't exist yet. The always-on core city/beach/airport
 * built by `buildCity()` is untouched and never goes through this manager;
 * only the new outlying districts are registered here.
 */
export class RegionManager {
  private defs: RegionDef[] = []
  private active = new Map<string, ActiveRegion>()
  private frameCounter = 0
  private collidersCache: Collider[] = []
  private meshesCache: THREE.Object3D[] = []
  private npcsCache: LiveActor[] = []
  private trafficCache: TrafficVehicle[] = []
  private entrancesCache: BuildingEntranceSpawn[] = []
  private dirty = true

  constructor(private scene: THREE.Scene) {}

  register(def: RegionDef) {
    this.defs.push(def)
  }

  /**
   * Cheap proximity scan - throttled internally, so calling this every
   * render frame costs nothing extra most frames. `drivenController`, when
   * given, is the vehicle the player currently occupies - a region is never
   * unloaded (and its meshes disposed) while it owns that vehicle, even if
   * the player has driven far enough from the district's bounds to
   * otherwise qualify for unload.
   */
  update(playerX: number, playerZ: number, drivenController: VehicleController | null = null) {
    this.frameCounter++
    if (this.frameCounter % CHECK_INTERVAL_FRAMES !== 0) return

    for (const def of this.defs) {
      const { xMin, xMax, zMin, zMax } = def.bounds
      const isActive = this.active.has(def.id)

      if (!isActive) {
        const nearX = playerX > xMin - LOAD_MARGIN && playerX < xMax + LOAD_MARGIN
        const nearZ = playerZ > zMin - LOAD_MARGIN && playerZ < zMax + LOAD_MARGIN
        if (nearX && nearZ) {
          const build = def.build()
          this.scene.add(build.group)
          this.active.set(def.id, { def, build })
          this.dirty = true
        }
      } else {
        const farX = playerX < xMin - UNLOAD_MARGIN || playerX > xMax + UNLOAD_MARGIN
        const farZ = playerZ < zMin - UNLOAD_MARGIN || playerZ > zMax + UNLOAD_MARGIN
        const region = this.active.get(def.id)!
        const ownsDrivenVehicle = !!drivenController && region.build.traffic.some((t) => t.controller === drivenController)
        if ((farX || farZ) && !ownsDrivenVehicle) {
          this.disposeRegion(region.build)
          this.active.delete(def.id)
          this.dirty = true
        }
      }
    }

    if (this.dirty) this.rebuildCaches()
  }

  private disposeRegion(build: RegionBuild) {
    this.scene.remove(build.group)
    build.group.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      obj.geometry.dispose()
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of materials) {
        if ('map' in mat && mat.map instanceof THREE.Texture) mat.map.dispose()
        mat.dispose()
      }
    })
  }

  private rebuildCaches() {
    this.collidersCache = []
    this.meshesCache = []
    this.npcsCache = []
    this.trafficCache = []
    this.entrancesCache = []
    for (const { build } of this.active.values()) {
      this.collidersCache.push(...build.colliders)
      this.meshesCache.push(...build.collidableMeshes)
      this.npcsCache.push(...build.npcs)
      this.trafficCache.push(...build.traffic)
      this.entrancesCache.push(...build.buildingEntrances)
    }
    this.dirty = false
  }

  getActiveColliders(): Collider[] {
    return this.collidersCache
  }

  getActiveMeshes(): THREE.Object3D[] {
    return this.meshesCache
  }

  getActiveNpcs(): LiveActor[] {
    return this.npcsCache
  }

  getActiveTraffic(): TrafficVehicle[] {
    return this.trafficCache
  }

  getActiveEntrances(): BuildingEntranceSpawn[] {
    return this.entrancesCache
  }

  dispose() {
    for (const { build } of this.active.values()) this.disposeRegion(build)
    this.active.clear()
  }
}
