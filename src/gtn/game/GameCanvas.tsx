import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { buildCity, getGroundHeightAt, SPAWN_POINT, SAND_END_Z, OCEAN_WIDTH, OCEAN_DEPTH, OCEAN_CENTER_Z } from './world'
import { buildOcean, waveHeightAt } from './water'
import { Player } from './player'
import { ChaseCamera } from './camera'
import { GtnInput } from './input'
import { VehicleController } from './vehicles/VehicleController'
import { buildCar, buildMotorcycle, buildJetSki } from './vehicles/models'
import { VEHICLE_CONFIGS, type VehicleKind } from './vehicles/types'
import type { Collider } from './collision'
import TouchControls from '../ui/TouchControls'

interface GameCanvasProps {
  onExit: () => void
}

interface VehicleInstance {
  kind: VehicleKind
  controller: VehicleController
}

const ENTER_RADIUS = 2.6

const PROMPT_ICON: Record<VehicleKind, string> = {
  car: '🚗',
  motorcycle: '🏍️',
  jetski: '🌊',
}

export default function GameCanvas({ onExit }: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<GtnInput | null>(null)

  const [nearbyKind, setNearbyKind] = useState<VehicleKind | null>(null)
  const [drivingKind, setDrivingKind] = useState<VehicleKind | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x9fd8ff)
    scene.fog = new THREE.Fog(0x9fd8ff, 35, 105)

    const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x3a5f3a, 0.9)
    scene.add(hemi)

    const sun = new THREE.DirectionalLight(0xfff3d6, 1.2)
    sun.position.set(24, 32, 12)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -50
    sun.shadow.camera.right = 50
    sun.shadow.camera.top = 50
    sun.shadow.camera.bottom = -50
    sun.shadow.camera.far = 110
    scene.add(sun)

    const city = buildCity()
    scene.add(city.group)

    const ocean = buildOcean(OCEAN_WIDTH, OCEAN_DEPTH, 0, OCEAN_CENTER_Z)
    scene.add(ocean.mesh)

    const player = new Player()
    player.position.copy(SPAWN_POINT)
    scene.add(player.root)

    // Vehicles placed where the player will actually see them - the
    // motorcycle sits right in front of the spawn point on purpose.
    const vehicles: VehicleInstance[] = [
      { kind: 'motorcycle', controller: new VehicleController(VEHICLE_CONFIGS.motorcycle, buildMotorcycle(), new THREE.Vector3(-3, 0, 17), 0) },
      { kind: 'car', controller: new VehicleController(VEHICLE_CONFIGS.car, buildCar(), new THREE.Vector3(15, 0, -35), Math.PI / 2) },
      { kind: 'jetski', controller: new VehicleController(VEHICLE_CONFIGS.jetski, buildJetSki(), new THREE.Vector3(4, 0, -71), 0) },
    ]
    vehicles.forEach((v) => scene.add(v.controller.root))

    const jetskiBounds: Collider[] = [{ minX: -OCEAN_WIDTH / 2, maxX: OCEAN_WIDTH / 2, minZ: SAND_END_Z, maxZ: 100000 }]
    // Cars/motorcycles still can't drive into the sea - only the walking
    // player is allowed past the shoreline colliders now (that's how
    // swimming starts).
    const wheeledColliders: Collider[] = [...city.colliders, ...city.shorelineColliders]

    const chaseCamera = new ChaseCamera(mount.clientWidth / mount.clientHeight)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    mount.appendChild(renderer.domElement)

    const input = new GtnInput()
    inputRef.current = input

    const resize = () => {
      if (!mount) return
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      chaseCamera.setAspect(mount.clientWidth / mount.clientHeight)
    }
    window.addEventListener('resize', resize)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    let mode: 'onFoot' | VehicleKind = 'onFoot'
    let activeVehicle: VehicleInstance | null = null
    let lastNearbyKind: VehicleKind | null = null
    let lastDrivingKind: VehicleKind | null = null
    let elapsed = 0

    let raf = 0
    let last = performance.now()
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      elapsed += dt
      ocean.update(elapsed)

      // The jet ski always rides the waves, whether parked or ridden.
      const jetski = vehicles.find((v) => v.kind === 'jetski')!
      if (mode !== 'jetski') {
        jetski.controller.position.y = waveHeightAt(jetski.controller.position.x, jetski.controller.position.z, elapsed)
      }

      if (mode === 'onFoot') {
        let nearest: VehicleInstance | null = null
        let nearestDist = Infinity
        for (const v of vehicles) {
          const d = Math.hypot(v.controller.position.x - player.position.x, v.controller.position.z - player.position.z)
          if (d < ENTER_RADIUS && d < nearestDist) {
            nearest = v
            nearestDist = d
          }
        }
        const kind = nearest?.kind ?? null
        if (kind !== lastNearbyKind) {
          lastNearbyKind = kind
          setNearbyKind(kind)
        }

        if (nearest && input.consumeInteract()) {
          activeVehicle = nearest
          mode = nearest.kind
          player.root.visible = false
          lastNearbyKind = null
          setNearbyKind(null)
          setDrivingKind(nearest.kind)
          lastDrivingKind = nearest.kind
        } else {
          const move = input.getMove()
          player.update(dt, move.x, move.y, input.isRunning(), input.consumeJump(), city.colliders, elapsed)
          chaseCamera.update(dt, player.position, player.facing, city.collidableMeshes)
        }
      } else if (activeVehicle) {
        const move = input.getMove()
        const colliders = mode === 'jetski' ? jetskiBounds : wheeledColliders
        activeVehicle.controller.update(dt, move.y, move.x, colliders)
        if (mode === 'jetski') {
          activeVehicle.controller.position.y = waveHeightAt(activeVehicle.controller.position.x, activeVehicle.controller.position.z, elapsed)
        } else {
          activeVehicle.controller.position.y = getGroundHeightAt(activeVehicle.controller.position.x, activeVehicle.controller.position.z)
        }
        const cfg = VEHICLE_CONFIGS[mode]
        chaseCamera.update(dt, activeVehicle.controller.position, activeVehicle.controller.heading, city.collidableMeshes, {
          distance: cfg.cameraDistance,
          height: cfg.cameraHeight,
          lookHeight: cfg.cameraLookHeight,
        })

        if (input.consumeInteract()) {
          const heading = activeVehicle.controller.heading
          const offset = VEHICLE_CONFIGS[mode].mountOffset
          const dismountX = activeVehicle.controller.position.x + Math.cos(heading) * offset
          const dismountZ = activeVehicle.controller.position.z - Math.sin(heading) * offset
          player.root.position.set(dismountX, getGroundHeightAt(dismountX, dismountZ), dismountZ)
          player.root.visible = true
          mode = 'onFoot'
          activeVehicle = null
          lastDrivingKind = null
          setDrivingKind(null)
        }
      }

      renderer.render(scene, chaseCamera.camera)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      resizeObserver.disconnect()
      input.dispose()
      inputRef.current = null
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
          {PROMPT_ICON[nearbyKind]} <span className="hidden sm:inline">Press E to ride</span>
          <span className="sm:hidden">Tap Enter to ride</span>
        </div>
      )}

      {drivingKind && (
        <button
          onClick={() => inputRef.current?.queueInteract()}
          className="absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card btn-pressable"
        >
          🚪 Exit vehicle
        </button>
      )}

      {showPrompt && (
        <button
          onClick={() => inputRef.current?.queueInteract()}
          className="absolute bottom-32 right-6 z-20 grid h-16 w-16 touch-none place-items-center rounded-full bg-sunny-400 font-fun text-xs font-extrabold text-ink shadow-card active:scale-90 sm:hidden"
        >
          {PROMPT_ICON[nearbyKind]} Enter
        </button>
      )}

      <TouchControls
        hideJump={!!drivingKind}
        onMove={(x, y) => {
          inputRef.current?.setJoystickActive(x !== 0 || y !== 0)
          inputRef.current?.setJoystick(x, y)
        }}
        onJoystickRelease={() => inputRef.current?.setJoystickActive(false)}
        onJumpDown={() => inputRef.current?.setJumpButtonDown(true)}
        onJumpUp={() => inputRef.current?.setJumpButtonDown(false)}
      />
    </div>
  )
}
