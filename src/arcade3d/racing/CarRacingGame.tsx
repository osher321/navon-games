import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { FunGameProps } from '../../games/types'
import { useSound } from '../../hooks/useSound'
import { useI18n } from '../../i18n/LanguageContext'
import DifficultySelector from '../../components/DifficultySelector'
import { useArcadeCanvas } from '../useArcadeCanvas'
import { setupBasicLighting, buildGroundPlane, disposeObject3D } from '../sceneBasics'
import { HudChip, PauseOverlay, TouchButton } from '../ArcadeUI'
import { VehicleController } from '../../gtn/game/vehicles/VehicleController'
import { buildCar } from '../../gtn/game/vehicles/models'
import { VEHICLE_CONFIGS } from '../../gtn/game/vehicles/types'
import { ChaseCamera } from '../../gtn/game/camera'
import { resolveMove } from '../../gtn/game/collision'
import { TRACKS, buildTrack } from './track'
import { RivalCar } from './RivalCar'

type Difficulty = 'easy' | 'medium' | 'hard'
const DIFFICULTY_ICON: Record<Difficulty, string> = { easy: '🟢', medium: '🟡', hard: '🔴' }
const RIVAL_SPEED: Record<Difficulty, number> = { easy: 0.72, medium: 0.85, hard: 0.97 }
const LAPS_TO_WIN = 3
const TURBO_MULT = 1.55
const COIN_COUNT = 14
const COIN_RADIUS = 1.4

type Phase = 'start' | 'playing' | 'paused'

export default function CarRacingGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const mountRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('start')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [lap, setLap] = useState(1)
  const [coins, setCoins] = useState(0)
  const [raceTime, setRaceTime] = useState(0)
  const finishedRef = useRef(false)

  const stateRef = useRef<{
    controller: VehicleController
    camera: ChaseCamera
    rivals: RivalCar[]
    track: ReturnType<typeof buildTrack>
    checkpointIndex: number
    lastCheckpointPose: { pos: THREE.Vector3; heading: number }
    lapCount: number
    coinMeshes: { mesh: THREE.Mesh; collected: boolean }[]
    keys: Set<string>
    touchSteer: number
    touchThrottle: number
    touchTurbo: boolean
    elapsed: number
  } | null>(null)

  // The scene is only actually (re)built on the frame after `builtRef` is
  // false - `sceneRef` gives the restart handler (which runs outside the
  // render loop) a way to dispose the previous race's meshes and clear
  // `builtRef` synchronously, so the next frame rebuilds a clean scene
  // instead of leaving stale geometry behind while a new, invisible
  // controller drives around it.
  const sceneRef = useRef<THREE.Scene | null>(null)
  const builtRef = useRef(false)

  const startRace = (d: Difficulty) => {
    setDifficulty(d)
    setLap(1)
    setCoins(0)
    setRaceTime(0)
    finishedRef.current = false
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing' || stateRef.current) return
    const mount = mountRef.current
    if (!mount) return

    const trackDef = TRACKS[0]
    const track = buildTrack(trackDef)

    const controller = new VehicleController(VEHICLE_CONFIGS.car, buildCar(0x2fb6a8), track.startPosition.clone(), track.startHeading)
    const camera = new ChaseCamera(mount.clientWidth / mount.clientHeight)

    const rivals = [0, 1, 2].map(
      (i) => new RivalCar(track.checkpoints, (i + 2) % track.checkpoints.length, i, RIVAL_SPEED[difficulty], (i - 1) * 1.6)
    )

    const coinMeshes: { mesh: THREE.Mesh; collected: boolean }[] = []

    stateRef.current = {
      controller,
      camera,
      rivals,
      track,
      checkpointIndex: 1,
      lastCheckpointPose: { pos: track.startPosition.clone(), heading: track.startHeading },
      lapCount: 1,
      coinMeshes,
      keys: new Set(),
      touchSteer: 0,
      touchThrottle: 0,
      touchTurbo: false,
      elapsed: 0,
    }

    const onKeyDown = (e: KeyboardEvent) => {
      stateRef.current?.keys.add(e.key.toLowerCase())
      if (e.key === 'Escape') setPhase((p) => (p === 'playing' ? 'paused' : p))
    }
    const onKeyUp = (e: KeyboardEvent) => {
      stateRef.current?.keys.delete(e.key.toLowerCase())
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [phase, difficulty])

  const paused = phase !== 'playing'

  useArcadeCanvas(
    mountRef,
    (dt, { scene, renderer }) => {
      sceneRef.current = scene
      // Once the race has ended, `onFinish` already fired and GameScreen
      // shows its own ResultOverlay - stop doing per-frame physics/AI work
      // for a game that's no longer visible or interactive.
      if (finishedRef.current) return
      const st = stateRef.current
      if (!st) return

      if (!builtRef.current) {
        builtRef.current = true
        setupBasicLighting(scene, 0x8fd6ff, 0xbfe8ff, 0.006)
        const ground = buildGroundPlane(400, 0x4a8f4f)
        scene.add(ground)
        scene.add(st.track.group)
        scene.add(st.controller.root)
        for (const r of st.rivals) scene.add(r.controller.root)

        for (let i = 0; i < COIN_COUNT; i++) {
          const p = st.track.curve.getPointAt((i / COIN_COUNT + 0.02) % 1)
          const geo = new THREE.TorusGeometry(0.5, 0.18, 8, 16)
          const mat = new THREE.MeshStandardMaterial({ color: 0xffd23f, metalness: 0.7, roughness: 0.25, emissive: 0x996b00, emissiveIntensity: 0.25 })
          const mesh = new THREE.Mesh(geo, mat)
          mesh.position.set(p.x, 0.7, p.z)
          mesh.rotation.x = Math.PI / 2
          mesh.castShadow = true
          scene.add(mesh)
          st.coinMeshes.push({ mesh, collected: false })
        }
      }

      st.elapsed += dt
      setRaceTime(st.elapsed)

      // ----- Input -----
      const turboHeld = st.keys.has('shift') || st.touchTurbo
      let steer = st.touchSteer
      let throttle = st.touchThrottle
      if (st.keys.has('arrowleft') || st.keys.has('a')) steer -= 1
      if (st.keys.has('arrowright') || st.keys.has('d')) steer += 1
      if (st.keys.has('arrowup') || st.keys.has('w')) throttle += 1
      if (st.keys.has('arrowdown') || st.keys.has('s')) throttle -= 1
      steer = Math.max(-1, Math.min(1, steer))
      throttle = Math.max(-1, Math.min(1, throttle))

      if (st.keys.has('r')) {
        st.controller.position.set(st.lastCheckpointPose.pos.x, 0, st.lastCheckpointPose.pos.z)
        st.controller.heading = st.lastCheckpointPose.heading
        st.controller.speed = 0
      }

      // Reset to the base car numbers every frame, then reapply turbo on
      // top only while it's actually held - mutating `.config` in place
      // (VehicleController reads it internally) without this reset would
      // leave the boost permanently baked in after the player lets go.
      const base = VEHICLE_CONFIGS.car
      const boosting = turboHeld && throttle > 0
      st.controller.config.maxSpeed = boosting ? base.maxSpeed * TURBO_MULT : base.maxSpeed
      st.controller.config.acceleration = boosting ? base.acceleration * 1.3 : base.acceleration
      st.controller.update(dt, throttle, steer, st.track.colliders)
      st.controller.position.y = 0

      for (const r of st.rivals) r.update(dt, st.track.checkpoints)

      // ----- Player checkpoint/lap progress -----
      const target = st.track.checkpoints[st.checkpointIndex]
      if (target) {
        const d = Math.hypot(st.controller.position.x - target.x, st.controller.position.z - target.z)
        if (d < 6) {
          st.lastCheckpointPose = { pos: st.controller.position.clone(), heading: st.controller.heading }
          const wasLast = st.checkpointIndex === st.track.checkpoints.length - 1
          st.checkpointIndex = (st.checkpointIndex + 1) % st.track.checkpoints.length
          if (wasLast) {
            st.lapCount++
            setLap(Math.min(st.lapCount, LAPS_TO_WIN))
            play('success')
            if (st.lapCount > LAPS_TO_WIN && !finishedRef.current) {
              finishedRef.current = true
              const coinBonus = st.coinMeshes.filter((c) => c.collected).length
              const timeBonus = Math.max(0, Math.floor(200 - st.elapsed))
              const score = Math.max(1, 100 + coinBonus * 10 + timeBonus)
              onFinish({ correct: score, total: score })
            }
          }
        }
      }

      // ----- Coins -----
      for (const c of st.coinMeshes) {
        if (c.collected) continue
        c.mesh.rotation.z += dt * 3
        const dx = st.controller.position.x - c.mesh.position.x
        const dz = st.controller.position.z - c.mesh.position.z
        if (Math.hypot(dx, dz) < COIN_RADIUS) {
          c.collected = true
          c.mesh.visible = false
          play('coin')
          setCoins((n) => n + 1)
        }
      }

      st.camera.update(dt, st.controller.position, st.controller.heading, [], {
        distance: VEHICLE_CONFIGS.car.cameraDistance,
        height: VEHICLE_CONFIGS.car.cameraHeight,
        lookHeight: VEHICLE_CONFIGS.car.cameraLookHeight,
      })
      renderer.render(scene, st.camera.camera)
    },
    ({ scene }) => {
      disposeObject3D(scene)
      scene.clear()
      stateRef.current = null
      builtRef.current = false
    },
    paused
  )

  useEffect(() => {
    const st = stateRef.current
    if (st) st.camera.setAspect((mountRef.current?.clientWidth ?? 1) / (mountRef.current?.clientHeight ?? 1))
  }, [phase])

  return (
    <div className="relative mx-auto h-[70vh] max-h-[560px] w-full overflow-hidden rounded-blob bg-sky-200 shadow-pop card-outline">
      {/* Always mounted (even during the start screen) so useArcadeCanvas's
          one-time setup effect - which fires right after this first render,
          regardless of `phase` - finds a real element instead of null. The
          start/pause screens are overlays on top of it, not replacements
          for it. */}
      <div ref={mountRef} className="h-full w-full touch-none" />

      {phase === 'start' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-sky-100 p-4">
          <DifficultySelector
            title={`🏎️ ${tr('game_car_racing_name')}`}
            subtitle={tr('choose_level')}
            options={[
              { id: 'easy', icon: DIFFICULTY_ICON.easy, label: tr('difficulty_easy') },
              { id: 'medium', icon: DIFFICULTY_ICON.medium, label: tr('difficulty_medium') },
              { id: 'hard', icon: DIFFICULTY_ICON.hard, label: tr('difficulty_hard') },
            ]}
            onSelect={startRace}
          />
        </div>
      )}

      {phase !== 'start' && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-3 flex items-center justify-center gap-2 px-3">
            <HudChip tone="grass">
              🏁 {Math.min(lap, LAPS_TO_WIN)}/{LAPS_TO_WIN}
            </HudChip>
            <HudChip tone="sunny">🪙 {coins}</HudChip>
            <HudChip tone="sky">⏱️ {raceTime.toFixed(0)}s</HudChip>
          </div>

          <button
            onClick={() => setPhase('paused')}
            aria-label={tr('common_pause')}
            className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-lg shadow-card btn-pressable"
          >
            ⏸️
          </button>
        </>
      )}

      {phase === 'paused' && (
        <PauseOverlay
          onResume={() => setPhase('playing')}
          onRestart={() => {
            if (sceneRef.current) {
              disposeObject3D(sceneRef.current)
              sceneRef.current.clear()
            }
            builtRef.current = false
            stateRef.current = null
            startRace(difficulty)
          }}
        />
      )}

      {/* Mobile touch controls */}
      <div className="absolute bottom-4 start-4 z-10 flex gap-3 sm:hidden">
        <TouchButton
          label="⬅️"
          className="h-16 w-16"
          onDown={() => {
            if (stateRef.current) stateRef.current.touchSteer = -1
          }}
          onUp={() => {
            if (stateRef.current) stateRef.current.touchSteer = 0
          }}
        />
        <TouchButton
          label="➡️"
          className="h-16 w-16"
          onDown={() => {
            if (stateRef.current) stateRef.current.touchSteer = 1
          }}
          onUp={() => {
            if (stateRef.current) stateRef.current.touchSteer = 0
          }}
        />
      </div>
      <div className="absolute bottom-4 end-4 z-10 flex gap-3 sm:hidden">
        <TouchButton
          label="🚀"
          className="h-16 w-16 bg-sunny-300"
          onDown={() => {
            if (stateRef.current) stateRef.current.touchTurbo = true
          }}
          onUp={() => {
            if (stateRef.current) stateRef.current.touchTurbo = false
          }}
        />
        <TouchButton
          label="🛑"
          className="h-16 w-16"
          onDown={() => {
            if (stateRef.current) stateRef.current.touchThrottle = -1
          }}
          onUp={() => {
            if (stateRef.current) stateRef.current.touchThrottle = 0
          }}
        />
        <TouchButton
          label="⛽"
          className="h-20 w-20 bg-grass-300"
          onDown={() => {
            if (stateRef.current) stateRef.current.touchThrottle = 1
          }}
          onUp={() => {
            if (stateRef.current) stateRef.current.touchThrottle = 0
          }}
        />
      </div>

      <p className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-xs font-bold text-white/80 sm:block">
        WASD/חצים לנהיגה · Shift לטורבו · R לאיפוס
      </p>
    </div>
  )
}
