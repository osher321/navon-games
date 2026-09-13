import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  buildCity,
  getGroundHeightAt,
  SPAWN_POINT,
  SAND_END_Z,
  OCEAN_WIDTH,
  OCEAN_DEPTH,
  OCEAN_CENTER_Z,
  PLANE_SPAWN,
  BALLOON_SPAWN,
  BOAT_SPAWN,
  WORLD_NORTH_LIMIT,
  WORLD_SOUTH_LIMIT,
  WORLD_EAST_LIMIT,
  WORLD_WEST_LIMIT,
} from './world'
import { buildOcean, waveHeightAt } from './water'
import { buildSky, buildEnvironment } from './sky'
import { buildCloudField } from './clouds'
import { DAY_PRESET, buildSunVisual } from './atmosphere'
import { Player } from './player'
import { ChaseCamera } from './camera'
import { GtnInput } from './input'
import { VehicleController } from './vehicles/VehicleController'
import { buildCar, buildMotorcycle, buildJetSki, buildBoat, buildAirplane, buildBalloon } from './vehicles/models'
import { VEHICLE_CONFIGS, type VehicleKind } from './vehicles/types'
import type { Collider } from './collision'
import { RegionManager } from './regions/RegionManager'
import { ALL_REGIONS } from './regions'
import type { LiveActor } from './regions/types'
import { buildPatrolNpc, buildSittingNpc } from './npc'
import { buildTrafficCar, type TrafficVehicle } from './traffic'
import { WeaponSystem } from './weapons/WeaponSystem'
import { buildTarget, TARGET_SPOTS } from './targets'
import { buildInteriorFromId } from './interiors/registry'
import type { InteriorBuild, InteriorInteractable, BuildingEntranceSpawn } from './interiors/types'
import { buildDolphinPods } from './dolphins'
import TouchControls from '../ui/TouchControls'

/** Beyond this distance from the player, a dolphin pod skips its full swim/jump simulation entirely and just idles on the waves - the ocean is huge, so this is what keeps marine life cheap everywhere the player isn't. */
const DOLPHIN_ACTIVE_RADIUS = 45

interface GameCanvasProps {
  onExit: () => void
}

interface VehicleInstance {
  kind: VehicleKind
  controller: VehicleController
}

const DOOR_ENTER_RADIUS = 2.4

const ENTER_RADIUS = 2.6
/** Above this many world units of clear air below them, exiting an air vehicle drops the character into a parachute fall instead of snapping them to the ground. */
const PARACHUTE_TRIGGER_HEIGHT = 3

const PROMPT_ICON: Record<VehicleKind, string> = {
  car: '🚗',
  motorcycle: '🏍️',
  jetski: '🌊',
  boat: '🚤',
  airplane: '✈️',
  balloon: '🎈',
}

export default function GameCanvas({ onExit }: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<GtnInput | null>(null)

  const [nearbyKind, setNearbyKind] = useState<VehicleKind | null>(null)
  const [drivingKind, setDrivingKind] = useState<VehicleKind | null>(null)
  const [weaponEquipped, setWeaponEquipped] = useState(false)
  const [ammo, setAmmo] = useState({ magazine: 0, reserve: 0, reloading: false })
  const [nearbyDoorLabel, setNearbyDoorLabel] = useState<string | null>(null)
  const [insideBuilding, setInsideBuilding] = useState(false)
  const [nearbyInteractLabel, setNearbyInteractLabel] = useState<string | null>(null)
  const [infoPopup, setInfoPopup] = useState<{ title: string; subtitle: string } | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(DAY_PRESET.fogColor, DAY_PRESET.fogDensity)
    const sky = buildSky(180)
    scene.add(sky)

    // A saturated ground color here bounces onto every surface in the scene
    // (most visible as an unwanted green tint on the gold car's paint), so
    // this stays a fairly neutral warm gray rather than a strong grass-green.
    const hemi = new THREE.HemisphereLight(DAY_PRESET.hemiSky, DAY_PRESET.hemiGround, 0.95)
    scene.add(hemi)

    // Distance is arbitrary (only the *direction* matters for lighting) -
    // chosen to match the original hand-picked (28, 38, 14) position so this
    // is a pure refactor, not a lighting change. A future setTimeOfDay()
    // would swap DAY_PRESET for a SUNSET/NIGHT preset and re-run this same
    // derivation.
    const SUN_DISTANCE = new THREE.Vector3(28, 38, 14).length()
    const SUN_OFFSET = DAY_PRESET.sunDirection.clone().multiplyScalar(SUN_DISTANCE)
    const sun = new THREE.DirectionalLight(DAY_PRESET.sunColor, DAY_PRESET.sunIntensity)
    sun.position.copy(SUN_OFFSET)
    sun.castShadow = true
    sun.shadow.mapSize.set(1536, 1536)
    sun.shadow.camera.left = -50
    sun.shadow.camera.right = 50
    sun.shadow.camera.top = 50
    sun.shadow.camera.bottom = -50
    sun.shadow.camera.far = 110
    sun.shadow.bias = -0.0015
    sun.shadow.normalBias = 0.02
    scene.add(sun)
    // The shadow camera's frustum is centered on `sun.target`, which
    // defaults to world (0,0,0) and never updates on its own - fine for the
    // original city-sized map, but far too small a window once the world is
    // 10x bigger. Both get recentered on the player every frame below so
    // shadows stay present no matter which district they're in.
    scene.add(sun.target)

    // A soft, cool fill light from the opposite side keeps shadowed faces
    // from going pure black - cheap (no shadow map) but reads much less
    // "flat prototype".
    const fill = new THREE.DirectionalLight(DAY_PRESET.fillColor, 0.35)
    fill.position.set(-20, 14, -18)
    scene.add(fill)

    // A visible sun disc - the DirectionalLight above lights the scene but
    // isn't itself something the player can see. Recentered on the camera
    // every frame (like the sky dome) so it always sits in the right part
    // of the sky no matter where the player roams.
    const sunVisual = buildSunVisual()
    scene.add(sunVisual)

    // Real volumetric cloud clusters spread across the whole (now much
    // bigger) map, at altitudes the airplane/balloon actually fly through.
    const clouds = buildCloudField({
      xMin: WORLD_WEST_LIMIT - 30,
      xMax: WORLD_EAST_LIMIT + 30,
      zMin: WORLD_SOUTH_LIMIT - 30,
      zMax: WORLD_NORTH_LIMIT + 30,
    })
    scene.add(clouds.group)

    const city = buildCity()
    scene.add(city.group)

    const ocean = buildOcean(OCEAN_WIDTH, OCEAN_DEPTH, 0, OCEAN_CENTER_Z)
    scene.add(ocean.mesh)

    // Marine life - a handful of dolphin pods spread across the open sea
    // (never on the beach, never inside the boat/jet-ski spawns), each
    // pod's own swim/jump simulation only running in full once the player
    // is actually close enough to notice.
    const dolphinPods = buildDolphinPods()
    dolphinPods.forEach((pod) => scene.add(pod.group))

    const player = new Player()
    player.position.copy(SPAWN_POINT)
    scene.add(player.root)

    // Vehicles placed where the player will actually see them - the
    // motorcycle sits right in front of the spawn point on purpose.
    const vehicles: VehicleInstance[] = [
      { kind: 'motorcycle', controller: new VehicleController(VEHICLE_CONFIGS.motorcycle, buildMotorcycle(), new THREE.Vector3(-3, 0, 17), 0) },
      {
        kind: 'car',
        controller: new VehicleController(
          VEHICLE_CONFIGS.car,
          // Gold-metallic luxury-sport paint (original body/shape - not a
          // copy of any specific real car), matching the mood the player
          // asked for while keeping the exact same original silhouette.
          // A near-mirror metalness (>0.7) mostly reflects whatever's around
          // it - under this scene's blue sky that reads as a cool gray, not
          // gold, except right at the sun's highlight. Dropping metalness
          // lets the warm base color itself carry the "gold" look from any
          // angle, while roughness ~0.25 still keeps a glossy paint sheen.
          buildCar(0xe0b23f, { metalness: 0.5, roughness: 0.25 }),
          new THREE.Vector3(15, 0, -35),
          Math.PI / 2
        ),
      },
      { kind: 'jetski', controller: new VehicleController(VEHICLE_CONFIGS.jetski, buildJetSki(), new THREE.Vector3(4, 0, -71), 0) },
      { kind: 'boat', controller: new VehicleController(VEHICLE_CONFIGS.boat, buildBoat(), BOAT_SPAWN.clone(), Math.PI) },
      { kind: 'airplane', controller: new VehicleController(VEHICLE_CONFIGS.airplane, buildAirplane(), PLANE_SPAWN.clone(), 0) },
      { kind: 'balloon', controller: new VehicleController(VEHICLE_CONFIGS.balloon, buildBalloon(), BALLOON_SPAWN.clone(), 0) },
    ]
    // Every parked car scattered around downtown by buildCity() is a full
    // instance too, not scenery - each gets its own VehicleController from
    // its spawn data, exactly like the hand-placed vehicles above, so the
    // mount-scan below (which just iterates `vehicles`) picks them up for
    // free with no per-kind special-casing.
    city.parkedCarSpawns.forEach((spawn) => {
      vehicles.push({
        kind: 'car',
        controller: new VehicleController(VEHICLE_CONFIGS.car, buildCar(spawn.color), spawn.position.clone(), spawn.heading),
      })
    })
    vehicles.forEach((v) => scene.add(v.controller.root))

    const waterBounds: Collider[] = [{ minX: -OCEAN_WIDTH / 2, maxX: OCEAN_WIDTH / 2, minZ: SAND_END_Z, maxZ: 100000 }]
    const noColliders: Collider[] = []

    // The 10x-larger surrounding districts stream in/out based on player
    // proximity instead of all being built up front - see RegionManager for
    // why. The original city/beach/airport built above is untouched and
    // never goes through this.
    const regionManager = new RegionManager(scene)
    ALL_REGIONS.forEach((def) => regionManager.register(def))

    // A small always-on set so the original city doesn't look empty next to
    // the new, livelier districts.
    const coreNpcs: LiveActor[] = [
      buildSittingNpc(new THREE.Vector3(-25, 0, -25), 0, 201),
      buildSittingNpc(new THREE.Vector3(-20, 0, -30), Math.PI, 205),
      buildPatrolNpc([new THREE.Vector3(8, 0, 10), new THREE.Vector3(8, 0, 40)], 211),
      buildPatrolNpc([new THREE.Vector3(20, 0, 22), new THREE.Vector3(38, 0, 8)], 217),
    ]
    coreNpcs.forEach((n) => scene.add(n.root))
    // Traffic vehicles are, structurally, also `VehicleInstance`s (same
    // `kind`/`controller` shape) - the mount-scan below folds them in
    // alongside `vehicles`, so a looping traffic car becomes just another
    // enterable instance the moment the player walks up to it.
    const coreTraffic: TrafficVehicle[] = [
      buildTrafficCar(
        [new THREE.Vector3(44, 0, 44), new THREE.Vector3(-44, 0, 44), new THREE.Vector3(-44, 0, -44), new THREE.Vector3(44, 0, -44)],
        221,
        'car'
      ),
    ]
    coreTraffic.forEach((t) => scene.add(t.root))

    // Weapon: one instance, attached once to the character's fixed weapon
    // socket (visibility toggles on equip/holster, it's never re-parented).
    // A second weapon kind later would mean a second WeaponSystem-like
    // config, not changes to this wiring.
    const weaponSystem = new WeaponSystem()
    player.attachWeapon(weaponSystem.model)

    const targets = TARGET_SPOTS.map((pos, i) => buildTarget(pos, i))
    targets.forEach((t) => scene.add(t.group))

    const chaseCamera = new ChaseCamera(mount.clientWidth / mount.clientHeight)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    mount.appendChild(renderer.domElement)

    // One-time image-based-lighting setup so metallic paint/glass/chrome get
    // real reflections instead of flat PBR shading - generated from a tiny
    // throwaway scene, not a downloaded HDR, so it costs nothing per frame.
    const envTexture = buildEnvironment(renderer)
    scene.environment = envTexture

    const input = new GtnInput()
    inputRef.current = input
    // Scoped to the canvas itself (not the whole window), so clicking the
    // Exit/HUD buttons that sit on top of it never triggers a shot.
    input.bindFireElement(renderer.domElement)

    const resize = () => {
      if (!mount) return
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      chaseCamera.setAspect(mount.clientWidth / mount.clientHeight)
    }
    window.addEventListener('resize', resize)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    let mode: 'onFoot' | VehicleKind | 'interior' = 'onFoot'
    let activeVehicle: VehicleInstance | null = null
    // Reused every frame for the mount line-of-sight check below - a plain
    // distance check would let the player mount a vehicle parked on the
    // other side of a wall/building as long as it's numerically close.
    const mountRaycaster = new THREE.Raycaster()
    let lastNearbyKind: VehicleKind | null = null
    let lastDrivingKind: VehicleKind | null = null
    let lastWeaponEquipped = false
    let lastAmmo = { magazine: -1, reserve: -1, reloading: false }
    let elapsed = 0

    // ----- Interiors -----
    // At most one interior is ever built at a time - it's created the
    // instant the player opens a door and disposed the instant they leave,
    // which is the whole "interior streaming" strategy: with dozens of
    // enterable buildings in the city, none of their geometry exists in
    // memory except the one the player is actually standing inside.
    let activeInterior: InteriorBuild | null = null
    // Where (and which way) to place the player back outdoors on exit -
    // the exact door they walked through, not some fixed spawn point.
    let exteriorReturn: { position: THREE.Vector3; facing: number } | null = null
    let lastNearbyDoorId: string | null = null
    let lastInsideBuilding = false
    let lastNearbyInteractId: string | null = null
    let infoPopupTimer = 0

    let raf = 0
    let last = performance.now()
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      elapsed += dt
      ocean.update(elapsed)

      // Dolphins: full swim/jump simulation only for pods within range of
      // the player's real world position - skipped entirely while indoors,
      // where `player.position` is momentarily an interior's own small
      // local coordinate space (comparing it against ocean-scale pod
      // centers would be meaningless, and the ocean isn't even visible
      // then anyway). Whichever single active dolphin ends up nearest the
      // player gets a boosted chance to jump soon, for an occasional
      // "special moment" rather than pure chance.
      if (activeInterior) {
        for (const pod of dolphinPods) pod.updateIdle(elapsed)
      } else {
        let nearestDolphin: (typeof dolphinPods)[number]['dolphins'][number] | null = null
        let nearestDolphinDist = Infinity
        const activePods = dolphinPods.filter((pod) => {
          const active = Math.hypot(pod.center.x - player.position.x, pod.center.z - player.position.z) < DOLPHIN_ACTIVE_RADIUS + 12
          if (!active) pod.updateIdle(elapsed)
          return active
        })
        for (const pod of activePods) {
          for (const d of pod.dolphins) {
            const dist = Math.hypot(d.x - player.position.x, d.z - player.position.z)
            if (dist < nearestDolphinDist) {
              nearestDolphinDist = dist
              nearestDolphin = d
            }
          }
        }
        for (const pod of activePods) pod.update(dt, elapsed, nearestDolphin)
      }

      // Never unload a region out from under the specific vehicle the
      // player is currently sitting in, even if they've since driven past
      // its unload radius - only ever matters for a region's own traffic
      // vehicle, since every other instance lives in the always-on core.
      // Skipped entirely while indoors: `player.position` is temporarily
      // the interior's own small local coordinate space, not a real world
      // position, so checking it against region bounds would be meaningless
      // - the outdoor region set simply stays frozen at whatever it was the
      // instant the player walked through the door.
      if (!activeInterior) regionManager.update(player.position.x, player.position.z, activeVehicle?.controller ?? null)
      // Recomputed every frame from small, mostly-unchanging arrays - cheap
      // next to the render itself, and far simpler than trying to patch
      // these in only on the (infrequent) frames a region's active set
      // actually changes.
      const playerColliders = [...city.colliders, ...regionManager.getActiveColliders()]
      const wheeledColliders = [...city.colliders, ...city.shorelineColliders, ...regionManager.getActiveColliders()]
      const occluders = [...city.collidableMeshes, ...regionManager.getActiveMeshes()]
      const activeTraffic = regionManager.getActiveTraffic()
      const doorCandidates: BuildingEntranceSpawn[] = [...city.buildingEntrances, ...regionManager.getActiveEntrances()]

      if (infoPopupTimer > 0) {
        infoPopupTimer -= dt
        if (infoPopupTimer <= 0) setInfoPopup(null)
      }
      // Every vehicle instance that actually exists right now: the
      // always-on core vehicles/parked cars plus whichever traffic is
      // currently streamed in. Built fresh each frame (cheap - a handful of
      // objects) so the mount-scan below always sees the true, current set
      // rather than a stale snapshot from whenever the arrays were built.
      const mountCandidates: VehicleInstance[] = [...vehicles, ...coreTraffic, ...activeTraffic]

      for (const npc of coreNpcs) npc.update(dt, elapsed)
      // Skip ticking the autopilot for whichever traffic vehicle the player
      // is currently driving - otherwise the scripted loop and the
      // player's own input would fight over the same VehicleController.
      for (const t of coreTraffic) {
        if (activeVehicle?.controller !== t.controller) t.update(dt, elapsed)
      }
      for (const npc of regionManager.getActiveNpcs()) npc.update(dt, elapsed)
      for (const t of activeTraffic) {
        if (activeVehicle?.controller !== t.controller) t.update(dt, elapsed)
      }

      // Water vehicles always ride the waves, whether parked or ridden -
      // compared by instance (not kind), so a second boat/jetski keeps
      // bobbing on its own even while a different instance of the same
      // kind is the one being driven.
      for (const v of mountCandidates) {
        if (VEHICLE_CONFIGS[v.kind].surface === 'water' && v !== activeVehicle) {
          v.controller.position.y = waveHeightAt(v.controller.position.x, v.controller.position.z, elapsed)
        }
      }

      // The weapon only makes sense on foot - a minigun equipped mid-drive
      // or mid-fall would clip through the seat/canopy, so it's force-
      // holstered the instant either of those stops being true, rather than
      // hunting down every place mode can change away from 'onFoot'.
      const canUseWeapon = mode === 'onFoot' && !player.isParachuting
      if (canUseWeapon) {
        if (input.consumeWeaponToggle()) weaponSystem.toggleEquip()
        if (input.consumeReload()) weaponSystem.startReload()
      } else if (weaponSystem.isEquipped) {
        weaponSystem.forceHolster()
      }
      player.setAiming(canUseWeapon && weaponSystem.isEquipped)
      const firing = canUseWeapon && input.isFireHeld()
      weaponSystem.update(dt, firing, chaseCamera.camera, targets, scene)
      for (const t of targets) t.update(dt, elapsed)

      if (weaponSystem.isEquipped !== lastWeaponEquipped) {
        lastWeaponEquipped = weaponSystem.isEquipped
        setWeaponEquipped(lastWeaponEquipped)
      }
      const magNow = weaponSystem.ammoInMagazine
      const reserveNow = weaponSystem.reserveAmmo
      const reloadingNow = weaponSystem.isReloading
      if (magNow !== lastAmmo.magazine || reserveNow !== lastAmmo.reserve || reloadingNow !== lastAmmo.reloading) {
        lastAmmo = { magazine: magNow, reserve: reserveNow, reloading: reloadingNow }
        setAmmo(lastAmmo)
      }

      if (mode === 'onFoot' && !player.isParachuting) {
        let nearest: VehicleInstance | null = null
        let nearestDist = Infinity
        for (const v of mountCandidates) {
          const d = Math.hypot(v.controller.position.x - player.position.x, v.controller.position.z - player.position.z)
          const radius = Math.max(ENTER_RADIUS, VEHICLE_CONFIGS[v.kind].radius + 1.4)
          if (d >= radius || d >= nearestDist) continue

          // Line-of-sight: cast from chest-height at the player toward the
          // vehicle and reject it if any city/region geometry blocks the
          // way, so a vehicle parked just past a wall can't be entered.
          const from = new THREE.Vector3(player.position.x, player.position.y + 1.2, player.position.z)
          const to = new THREE.Vector3(v.controller.position.x, v.controller.position.y + 1.2, v.controller.position.z)
          const toDir = to.clone().sub(from)
          const toDist = toDir.length()
          if (toDist > 0.001) {
            toDir.normalize()
            mountRaycaster.set(from, toDir)
            mountRaycaster.far = toDist - 0.15
            if (mountRaycaster.intersectObjects(occluders, false).length > 0) continue
          }

          nearest = v
          nearestDist = d
        }

        // Nearest building door - the exact same nearest-of-many pattern as
        // the vehicle scan above, run in parallel (not instead of it) so E
        // always resolves to whichever specific thing - a car or a
        // building's door - the player is actually standing closest to.
        let nearestDoor: BuildingEntranceSpawn | null = null
        let nearestDoorDist = Infinity
        for (const door of doorCandidates) {
          const d = Math.hypot(door.doorPosition.x - player.position.x, door.doorPosition.z - player.position.z)
          if (d >= DOOR_ENTER_RADIUS || d >= nearestDoorDist) continue
          nearestDoor = door
          nearestDoorDist = d
        }
        const doorWins = !!nearestDoor && nearestDoorDist <= nearestDist

        const kind = doorWins ? null : nearest?.kind ?? null
        if (kind !== lastNearbyKind) {
          lastNearbyKind = kind
          setNearbyKind(kind)
        }
        const doorId = doorWins ? nearestDoor!.id : null
        if (doorId !== lastNearbyDoorId) {
          lastNearbyDoorId = doorId
          setNearbyDoorLabel(doorWins ? nearestDoor!.label : null)
        }

        if (doorWins && input.consumeInteract()) {
          const door = nearestDoor!
          activeInterior = buildInteriorFromId(door.interiorId)
          exteriorReturn = { position: door.doorPosition.clone(), facing: door.doorFacing + Math.PI }
          scene.remove(player.root)
          activeInterior.scene.add(player.root)
          player.root.position.copy(activeInterior.spawnPoint)
          player.root.rotation.set(0, activeInterior.spawnFacing, 0)
          // Without this the camera's own smoothing would lerp from wherever
          // it was outdoors toward the interior's small local-coordinate
          // space over several frames - a brief, nonsensical swoop through
          // unrelated geometry instead of an immediate cut.
          chaseCamera.resetOcclusion()
          mode = 'interior'
          lastNearbyDoorId = null
          setNearbyDoorLabel(null)
          setInsideBuilding(true)
          lastInsideBuilding = true
        } else if (nearest && !doorWins && input.consumeInteract()) {
          activeVehicle = nearest
          mode = nearest.kind
          player.setDrivingPose()
          lastNearbyKind = null
          setNearbyKind(null)
          setDrivingKind(nearest.kind)
          lastDrivingKind = nearest.kind
        } else {
          const move = input.getMove()
          player.update(dt, move.x, move.y, input.isRunning(), input.consumeJump(), playerColliders, elapsed)
          chaseCamera.update(dt, player.position, player.facing, occluders)
        }
      } else if (mode === 'interior' && activeInterior) {
        const interior = activeInterior
        const move = input.getMove()
        player.update(dt, move.x, move.y, input.isRunning(), input.consumeJump(), interior.colliders, elapsed, {
          heightAt: interior.heightAt,
          bounds: interior.bounds,
        })
        chaseCamera.update(dt, player.position, player.facing, interior.collidableMeshes, { distance: 3.1, height: 1.75, lookHeight: 1.05 })
        for (const npc of interior.npcs) npc.update(dt, elapsed)

        // Nearest of: the exit (back outdoors) or an inspectable item -
        // exactly the same "one nearest, one E" pattern as everywhere else.
        const exitDist = Math.hypot(interior.exitPoint.position.x - player.position.x, interior.exitPoint.position.z - player.position.z)
        const nearExit = exitDist < interior.exitPoint.radius

        let nearestItem: InteriorInteractable | null = null
        let nearestItemDist = Infinity
        for (const it of interior.interactables) {
          const d = Math.hypot(it.position.x - player.position.x, it.position.z - player.position.z)
          if (d < it.radius && d < nearestItemDist) {
            nearestItem = it
            nearestItemDist = d
          }
        }
        const exitWins = nearExit && exitDist <= nearestItemDist

        const interactId = exitWins ? 'exit' : nearestItem?.id ?? null
        if (interactId !== lastNearbyInteractId) {
          lastNearbyInteractId = interactId
          setNearbyInteractLabel(exitWins ? 'יציאה' : nearestItem?.label ?? null)
        }

        if (exitWins && input.consumeInteract()) {
          interior.dispose()
          activeInterior = null
          interior.scene.remove(player.root)
          scene.add(player.root)
          if (exteriorReturn) {
            player.root.position.copy(exteriorReturn.position)
            player.root.rotation.set(0, exteriorReturn.facing, 0)
          }
          exteriorReturn = null
          chaseCamera.resetOcclusion()
          mode = 'onFoot'
          lastNearbyInteractId = null
          setNearbyInteractLabel(null)
          setInsideBuilding(false)
          lastInsideBuilding = false
        } else if (nearestItem && !exitWins && input.consumeInteract()) {
          const result = nearestItem.onInteract()
          if (result) {
            setInfoPopup(result)
            infoPopupTimer = 3.5
          }
        }
      } else if (mode === 'onFoot') {
        // Parachuting: still an "on foot" state as far as mode is
        // concerned (no vehicle owns them), just skip the mount-scan above
        // so they can't snap into a parked car while still falling.
        const move = input.getMove()
        player.update(dt, move.x, move.y, input.isRunning(), input.consumeJump(), playerColliders, elapsed)
        chaseCamera.update(dt, player.position, player.facing, occluders)
      } else if (mode !== 'interior' && activeVehicle) {
        const cfg = VEHICLE_CONFIGS[mode]
        const move = input.getMove()
        const colliders = cfg.surface === 'water' ? waterBounds : cfg.surface === 'air' ? noColliders : wheeledColliders
        const vertical = cfg.surface === 'air' ? (input.isClimbHeld() ? 1 : input.isDiveHeld() ? -1 : 0) : 0
        activeVehicle.controller.update(dt, move.y, move.x, colliders, vertical)

        if (cfg.surface === 'water') {
          activeVehicle.controller.position.y = waveHeightAt(activeVehicle.controller.position.x, activeVehicle.controller.position.z, elapsed)
        } else if (cfg.surface === 'road') {
          activeVehicle.controller.position.y = getGroundHeightAt(activeVehicle.controller.position.x, activeVehicle.controller.position.z)
        }
        // Air vehicles: VehicleController.update() already owns altitude.

        const seatHeading = activeVehicle.controller.heading
        const seatX = activeVehicle.controller.position.x + Math.sin(seatHeading) * cfg.seatOffsetZ
        const seatZ = activeVehicle.controller.position.z + Math.cos(seatHeading) * cfg.seatOffsetZ
        const seatY = activeVehicle.controller.position.y + cfg.seatOffsetY
        player.sitInVehicle(new THREE.Vector3(seatX, seatY, seatZ), seatHeading)

        // The higher an air vehicle climbs, the further back and higher the
        // camera pulls - the player should see progressively more of the
        // world (city, roads, coast, sea) spread out beneath them, not the
        // same close-up framing they'd get taxiing on the runway.
        const altitudeSpread = cfg.surface === 'air' ? activeVehicle.controller.position.y : 0
        chaseCamera.update(dt, activeVehicle.controller.position, activeVehicle.controller.heading, occluders, {
          distance: cfg.cameraDistance + altitudeSpread * 0.18,
          height: cfg.cameraHeight + altitudeSpread * 0.1,
          lookHeight: cfg.cameraLookHeight,
        })

        if (input.consumeInteract()) {
          const heading = activeVehicle.controller.heading
          const offset = cfg.mountOffset
          const dismountX = activeVehicle.controller.position.x + Math.cos(heading) * offset
          const dismountZ = activeVehicle.controller.position.z - Math.sin(heading) * offset
          const groundYHere = getGroundHeightAt(dismountX, dismountZ)
          const vehicleY = activeVehicle.controller.position.y

          if (cfg.surface === 'air' && vehicleY - groundYHere > PARACHUTE_TRIGGER_HEIGHT) {
            // Start the fall from the same hip height they were just
            // sitting at, so leaving the cockpit reads as a continuous
            // motion rather than a snap to some other reference height.
            player.startParachute(new THREE.Vector3(dismountX, vehicleY + cfg.seatOffsetY, dismountZ), heading)
          } else {
            player.root.position.set(dismountX, groundYHere, dismountZ)
          }
          mode = 'onFoot'
          activeVehicle = null
          lastDrivingKind = null
          setDrivingKind(null)
        }
      }

      // The sky/sun/cloud recentering below only matters for the outdoor
      // scene, which isn't even what's being rendered while indoors - and
      // while indoors `player.position` is the interior's own small local
      // coordinate space, not a real world position, so recentering the
      // outdoor sun/shadow frustum on it would be meaningless.
      if (!activeInterior) {
        // The sky dome has a fixed radius around its own origin - with a
        // world this much bigger, the camera would eventually travel outside
        // that sphere and the (BackSide) dome would vanish entirely instead
        // of just looking flat. Recentering it under the camera every frame
        // (XZ only, so the vertical gradient still reads correctly regardless
        // of camera height) keeps it "infinitely far away" everywhere, the
        // same trick real skyboxes use.
        sky.position.set(chaseCamera.camera.position.x, 0, chaseCamera.camera.position.z)
        // Same idea for the sun's shadow frustum, which is only ~100x100
        // units wide - keep it centered on the player so shadows don't
        // disappear once they're out in the new districts.
        sun.position.set(player.position.x + SUN_OFFSET.x, SUN_OFFSET.y, player.position.z + SUN_OFFSET.z)
        sun.target.position.set(player.position.x, 0, player.position.z)
        // The visible sun disc itself just needs to sit far away in the sun's
        // direction, comfortably inside the 180-radius sky dome.
        sunVisual.position.copy(chaseCamera.camera.position).addScaledVector(DAY_PRESET.sunDirection, 150)
      }

      renderer.render(activeInterior ? activeInterior.scene : scene, chaseCamera.camera)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      resizeObserver.disconnect()
      input.dispose()
      inputRef.current = null
      if (activeInterior) (activeInterior as InteriorBuild).dispose()
      regionManager.dispose()
      envTexture.dispose()
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material.dispose()
        }
      })
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  const showPrompt = nearbyKind && !drivingKind
  const showDoorPrompt = !!nearbyDoorLabel && !drivingKind && !insideBuilding
  const isFlying = drivingKind === 'airplane' || drivingKind === 'balloon'
  // One mobile button, whatever's currently nearest - a vehicle, a
  // building's door, an item to inspect, or the way back outside - so
  // mobile always has exactly the same single E-equivalent control desktop
  // does, never two competing buttons at once.
  const mobileAction = insideBuilding || showDoorPrompt ? { icon: '🚪', label: 'כניסה / יציאה' } : showPrompt ? { icon: '🚗', label: 'כניסה / יציאה' } : null

  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-blob bg-ink shadow-pop sm:h-[75vh]">
      <div ref={mountRef} className="absolute inset-0" />

      <button
        onClick={onExit}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card btn-pressable"
      >
        ✕ Exit
      </button>

      {showPrompt && (
        <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card">
          {PROMPT_ICON[nearbyKind]} לחץ E כדי להיכנס
        </div>
      )}

      {showDoorPrompt && (
        <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card">
          🚪 E - {nearbyDoorLabel}
        </div>
      )}

      {insideBuilding && nearbyInteractLabel && (
        <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card">
          E - {nearbyInteractLabel}
        </div>
      )}

      {infoPopup && (
        <div className="absolute left-1/2 top-20 z-10 -translate-x-1/2 rounded-blob bg-white/95 px-5 py-3 text-center font-fun shadow-card">
          <div className="text-sm font-extrabold text-ink">{infoPopup.title}</div>
          <div className="text-xs font-bold text-ink/70">{infoPopup.subtitle}</div>
        </div>
      )}

      {drivingKind && (
        <button
          onClick={() => inputRef.current?.queueInteract()}
          className={`absolute z-10 rounded-full bg-white/90 px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card btn-pressable ${
            isFlying ? 'bottom-48 right-6 sm:left-1/2 sm:right-auto sm:top-6 sm:-translate-x-1/2 sm:bottom-auto' : 'left-1/2 top-6 -translate-x-1/2'
          }`}
        >
          🚪 Exit vehicle
        </button>
      )}

      {insideBuilding && (
        <button
          onClick={() => inputRef.current?.queueInteract()}
          className="absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card btn-pressable"
        >
          🚪 יציאה
        </button>
      )}

      {mobileAction && (
        <button
          onClick={() => inputRef.current?.queueInteract()}
          // Pushed up from its old bottom-32 to clear the weapon button
          // stack (jump/weapon/fire) below, which occupies the same corner
          // whenever the player is on foot - including while standing right
          // next to a vehicle/door they haven't entered yet. A pill, not a
          // fixed 64px circle, since the Hebrew label is longer than a
          // one-word "Enter" would be. One button, whatever's nearest - a
          // vehicle, a building door, or the way back outside - performs
          // exactly the same action E does.
          className="absolute bottom-72 right-6 z-20 touch-none whitespace-nowrap rounded-full bg-sunny-400 px-4 py-3 font-fun text-xs font-extrabold text-ink shadow-card active:scale-90 sm:hidden"
        >
          {mobileAction.icon} {mobileAction.label}
        </button>
      )}

      {weaponEquipped && (
        <>
          {/* Crosshair - the weapon raycasts from screen center, so this marks exactly where a shot will land. */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-1/2 top-1/2 h-0.5 w-3.5 -translate-x-1/2 -translate-y-1/2 bg-white/90 shadow" />
            <div className="absolute left-1/2 top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-white/90 shadow" />
          </div>

          {/* dir="ltr" - on the site's RTL Hebrew pages, "55 / 240" would otherwise visually flip to "240 / 55" (same issue the maze D-pad works around). */}
          <div dir="ltr" className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1.5 font-fun text-xs font-extrabold text-ink shadow-card">
            🔫 {ammo.reloading ? 'Reloading…' : `${ammo.magazine} / ${ammo.reserve}`}
          </div>
        </>
      )}

      <TouchControls
        hideJump={!!drivingKind && !isFlying}
        jumpLabel={isFlying ? '⬆️' : undefined}
        secondaryAction={
          isFlying
            ? {
                label: '⬇️',
                onDown: () => inputRef.current?.setDiveButtonDown(true),
                onUp: () => inputRef.current?.setDiveButtonDown(false),
              }
            : null
        }
        weaponAction={!drivingKind && !insideBuilding ? { label: '🔫', onTap: () => inputRef.current?.queueWeaponToggle() } : null}
        fireAction={
          !drivingKind && !insideBuilding && weaponEquipped
            ? {
                label: '🔥',
                onDown: () => inputRef.current?.setFireButtonDown(true),
                onUp: () => inputRef.current?.setFireButtonDown(false),
              }
            : null
        }
        onMove={(x, y) => {
          inputRef.current?.setJoystickActive(x !== 0 || y !== 0)
          inputRef.current?.setJoystick(x, y)
        }}
        onJoystickRelease={() => inputRef.current?.setJoystickActive(false)}
        onJumpDown={() => {
          inputRef.current?.setJumpButtonDown(true)
          inputRef.current?.setClimbButtonDown(true)
        }}
        onJumpUp={() => {
          inputRef.current?.setJumpButtonDown(false)
          inputRef.current?.setClimbButtonDown(false)
        }}
      />
    </div>
  )
}
