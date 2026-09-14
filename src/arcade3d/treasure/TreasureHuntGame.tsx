import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { FunGameProps } from '../../games/types'
import { useSound } from '../../hooks/useSound'
import { useArcadeCanvas } from '../useArcadeCanvas'
import { setupBasicLighting, disposeObject3D } from '../sceneBasics'
import { HudChip, PauseOverlay } from '../ArcadeUI'
import { buildHumanoid, animateHumanoid, type HumanoidParts } from '../../gtn/game/humanoid'
import { ChaseCamera } from '../../gtn/game/camera'
import { GtnInput } from '../../gtn/game/input'
import { resolveMove } from '../../gtn/game/collision'
import TouchControls from '../../gtn/ui/TouchControls'
import { buildIsland, type IslandWorld } from './island'

const PLAYER_SPEED = 5.2
const PLAYER_RADIUS = 0.45
const INTERACT_RANGE = 3.2
const PICKUP_RANGE = 1.4
const STONE_RANGE = 1.1

type Phase = 'start' | 'playing' | 'paused'
type Objective = 'keys' | 'stones' | 'gate' | 'treasure'

const OBJECTIVE_LABEL: Record<Objective, string> = {
  keys: '🗝️ מצאו את 3 המפתחות',
  stones: '🧩 דרכו על אבני הדריכה מהקטנה לגדולה',
  gate: '🚪 לחצו 🤚 ליד השער כדי לפתוח אותו',
  treasure: '💎 מצאו את האוצר הסופי',
}

export default function TreasureHuntGame({ onFinish }: FunGameProps) {
  const { play } = useSound()
  const mountRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('start')
  const [keysCollected, setKeysCollected] = useState(0)
  const [scrollsFound, setScrollsFound] = useState(0)
  const [objective, setObjective] = useState<Objective>('keys')
  const [toast, setToast] = useState<string | null>(null)
  const [promptLabel, setPromptLabel] = useState<string | null>(null)
  const finishedRef = useRef(false)

  const sceneRef = useRef<THREE.Scene | null>(null)
  const builtRef = useRef(false)

  const stateRef = useRef<{
    parts: HumanoidParts
    camera: ChaseCamera
    input: GtnInput
    world: IslandWorld
    posX: number
    posZ: number
    heading: number
    animPhase: number
    keysCollected: number
    nextStoneIndex: number
    stonesSolved: boolean
    gateOpen: boolean
    gateProgress: number
    objective: Objective
    nearInteractTarget: 'gate' | 'chest' | null
    elapsed: number
    toastTimer: number
  } | null>(null)

  const start = () => {
    setKeysCollected(0)
    setScrollsFound(0)
    setObjective('keys')
    setToast(null)
    finishedRef.current = false
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing' || stateRef.current) return
    const mount = mountRef.current
    if (!mount) return

    const world = buildIsland()
    const parts = buildHumanoid({ jacket: 0xd68a2f, jacketShade: 0xa66a1f, pants: 0x3a4a5a })
    const camera = new ChaseCamera(mount.clientWidth / mount.clientHeight)
    const input = new GtnInput()

    stateRef.current = {
      parts,
      camera,
      input,
      world,
      posX: world.playerStart.x,
      posZ: world.playerStart.z,
      heading: Math.PI,
      animPhase: 0,
      keysCollected: 0,
      nextStoneIndex: 0,
      stonesSolved: false,
      gateOpen: false,
      gateProgress: 0,
      objective: 'keys',
      nearInteractTarget: null,
      elapsed: 0,
      toastTimer: 0,
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPhase((p) => (p === 'playing' ? 'paused' : p))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      input.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const paused = phase !== 'playing'

  const showToast = (st: NonNullable<typeof stateRef.current>, text: string) => {
    st.toastTimer = 4
    setToast(text)
  }

  const finishRun = (st: NonNullable<typeof stateRef.current>) => {
    if (finishedRef.current) return
    finishedRef.current = true
    play('levelup')
    const score = Math.max(1, 120 + st.keysCollected * 20 + Math.round((300 - st.elapsed) * 0.5))
    onFinish({ correct: score, total: score })
  }

  useArcadeCanvas(
    mountRef,
    (dt, { scene, renderer }) => {
      sceneRef.current = scene
      if (finishedRef.current) return
      const st = stateRef.current
      if (!st) return

      if (!builtRef.current) {
        builtRef.current = true
        setupBasicLighting(scene, 0xbfe3ff, 0xd8ecff, 0.008)
        scene.add(st.world.group)
        scene.add(st.parts.root)
      }

      st.elapsed += dt
      if (st.toastTimer > 0) {
        st.toastTimer -= dt
        if (st.toastTimer <= 0) setToast(null)
      }

      // ----- Movement -----
      const move = st.input.getMove()
      const len = Math.hypot(move.x, move.y)
      if (len > 0.05) {
        const desiredHeading = Math.atan2(move.x, move.y)
        let delta = desiredHeading - st.heading
        delta = Math.atan2(Math.sin(delta), Math.cos(delta))
        st.heading += delta * Math.min(1, dt * 8)
        const dx = Math.sin(st.heading) * PLAYER_SPEED * len * dt
        const dz = Math.cos(st.heading) * PLAYER_SPEED * len * dt
        const resolved = resolveMove(st.world.colliders, st.posX, st.posZ, PLAYER_RADIUS, dx, dz)
        st.posX = resolved.x
        st.posZ = resolved.z
      }
      st.parts.root.position.set(st.posX, 0, st.posZ)
      st.parts.root.rotation.y = st.heading
      st.animPhase += dt * (len > 0.05 ? 9 : 0)
      animateHumanoid(st.parts, st.animPhase, len, dt)

      // ----- Pickups -----
      for (const p of st.world.pickups) {
        if (p.collected) continue
        p.mesh.rotation.y += dt * 1.6
        const d = Math.hypot(st.posX - p.position.x, st.posZ - p.position.z)
        if (d < PICKUP_RANGE) {
          p.collected = true
          p.mesh.visible = false
          if (p.kind === 'key') {
            st.keysCollected++
            setKeysCollected(st.keysCollected)
            play('coin')
            showToast(st, '🗝️ מצאתם מפתח!')
          } else {
            setScrollsFound((n) => n + 1)
            play('success')
            showToast(st, p.hint ?? '📜 מצאתם רמז')
          }
        }
      }

      // ----- Stones puzzle -----
      if (!st.stonesSolved) {
        for (const s of st.world.stones) {
          const d = Math.hypot(st.posX - s.position.x, st.posZ - s.position.z)
          if (d < STONE_RANGE) {
            if (s.order === st.nextStoneIndex) {
              if (s.mesh.position.y < 0.09) {
                s.mesh.position.y = 0.2
                st.nextStoneIndex++
                play('click')
                if (st.nextStoneIndex >= st.world.stones.length) {
                  st.stonesSolved = true
                  play('success')
                  showToast(st, '🧩 פתרתם את חידת אבני הדריכה!')
                }
              }
            } else if (s.order !== st.nextStoneIndex - 1) {
              // Wrong stone (not the one just solved either, to avoid
              // re-triggering a fail while standing on the last correct one).
              st.nextStoneIndex = 0
              for (const reset of st.world.stones) reset.mesh.position.y = 0.08
              play('wrong')
            }
          }
        }
      }

      // ----- Objective / interact prompt -----
      let objective: Objective = st.keysCollected < 3 ? 'keys' : !st.stonesSolved ? 'stones' : !st.gateOpen ? 'gate' : 'treasure'
      st.objective = objective
      setObjective(objective)

      const distToGate = Math.hypot(st.posX - st.world.gatePosition.x, st.posZ - (st.world.gatePosition.z + 3))
      const distToChest = Math.hypot(st.posX - st.world.chestPosition.x, st.posZ - st.world.chestPosition.z)

      let nearTarget: 'gate' | 'chest' | null = null
      if (!st.gateOpen && objective === 'gate' && distToGate < INTERACT_RANGE) nearTarget = 'gate'
      else if (st.gateOpen && objective === 'treasure' && distToChest < INTERACT_RANGE) nearTarget = 'chest'
      st.nearInteractTarget = nearTarget
      setPromptLabel(nearTarget === 'gate' ? '🤚 פתחו את השער' : nearTarget === 'chest' ? '🤚 פתחו את תיבת האוצר' : null)

      if (st.input.consumeInteract()) {
        if (st.nearInteractTarget === 'gate') {
          st.gateOpen = true
          play('levelup')
          showToast(st, '🚪 השער נפתח!')
        } else if (st.nearInteractTarget === 'chest') {
          finishRun(st)
          return
        }
      }

      if (st.gateOpen && st.gateProgress < 1) {
        st.gateProgress = Math.min(1, st.gateProgress + dt * 0.6)
        const door = st.world.gateGroup.getObjectByName('gateDoor')
        if (door) door.position.y = 2.5 - st.gateProgress * 4.5
      }

      st.camera.update(dt, st.parts.root.position, st.heading, [], { distance: 6.5, height: 3, lookHeight: 1.2 })
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

  return (
    <div className="relative mx-auto h-[70vh] max-h-[560px] w-full overflow-hidden rounded-blob bg-sky-100 shadow-pop card-outline">
      <div ref={mountRef} className="h-full w-full touch-none" />

      {phase === 'start' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-sky-100 p-4 text-center">
          <h2 className="font-fun text-2xl font-extrabold text-grape-600">🗺️ ציד אוצרות</h2>
          <p className="max-w-xs text-sm text-ink/60">חקרו את האי, מצאו 3 מפתחות, פתרו את חידת אבני הדריכה, פתחו את השער ומצאו את האוצר הסופי.</p>
          <button onClick={start} className="rounded-full bg-grass-500 px-8 py-3 font-fun text-lg font-extrabold text-white shadow-card btn-pressable">
            ▶ התחילו
          </button>
        </div>
      )}

      {phase !== 'start' && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-3 flex flex-col items-center gap-1.5 px-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <HudChip tone="sunny">🗝️ {keysCollected}/3</HudChip>
              <HudChip tone="sky">📜 {scrollsFound}/2</HudChip>
            </div>
            <HudChip tone="grass">{OBJECTIVE_LABEL[objective]}</HudChip>
          </div>

          <button
            onClick={() => setPhase('paused')}
            aria-label="הפסקה"
            className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-lg shadow-card btn-pressable"
          >
            ⏸️
          </button>

          {toast && (
            <div className="pointer-events-none absolute inset-x-4 top-24 z-10 flex justify-center">
              <p className="max-w-sm rounded-xl2 bg-ink/80 px-4 py-2 text-center text-sm font-bold text-white shadow-pop">{toast}</p>
            </div>
          )}

          {promptLabel && (
            <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center sm:bottom-6">
              <p className="rounded-full bg-white/90 px-4 py-2 text-sm font-extrabold text-ink shadow-card">{promptLabel}</p>
            </div>
          )}
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
            start()
          }}
        />
      )}

      {phase === 'playing' && (
        <TouchControls
          onMove={(x, y) => {
            stateRef.current?.input.setJoystickActive(x !== 0 || y !== 0)
            stateRef.current?.input.setJoystick(x, y)
          }}
          onJoystickRelease={() => stateRef.current?.input.setJoystickActive(false)}
          onJumpDown={() => stateRef.current?.input.queueInteract()}
          onJumpUp={() => {}}
          jumpLabel="🤚"
        />
      )}

      <p className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-xs font-bold text-white/80 sm:block">
        WASD/חצים לתנועה · E לאינטראקציה
      </p>
    </div>
  )
}
