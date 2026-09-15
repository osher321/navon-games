import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react'
import * as THREE from 'three'
import type { FunGameProps } from '../../games/types'
import { useSound } from '../../hooks/useSound'
import { useI18n } from '../../i18n/LanguageContext'
import { useArcadeCanvas } from '../useArcadeCanvas'
import { setupBasicLighting, disposeObject3D } from '../sceneBasics'
import { HudChip, PauseOverlay, TouchButton } from '../ArcadeUI'
import { buildHumanoid, animateHumanoid, type HumanoidPalette, type HumanoidParts } from '../../gtn/game/humanoid'

const LANE_X = [-2.3, 0, 2.3]
const LANE_LERP = 10
const GRAVITY = -22
const JUMP_VELOCITY = 8.2
const SLIDE_SECONDS = 0.65
const SPAWN_AHEAD = 46
const RECYCLE_BEHIND = -6
const SLOT_COUNT = 16
const SLOT_SPACING = 4.4
const BASE_SPEED = 9
const MAX_SPEED = 20
const SPEED_RAMP_PER_METER = 0.035
const MAGNET_RADIUS = 4.5
const POWERUP_DURATION = 6
const SHIELD_INVULN = 0.4

type SlotKind = 'empty' | 'jumpBar' | 'slideBar' | 'coin' | 'magnet' | 'speed' | 'shield' | 'multiplier' | 'enemy'

interface Theme {
  skyColor: number
  fogColor: number
  groundColor: number
  obstacleColor: number
  label: string
}

export interface RunnerConfig {
  title: string
  characterPalette: Partial<HumanoidPalette>
  themes: Theme[]
  themeDistanceStep: number
  combatEnabled: boolean
  doubleJump: boolean
}

interface Slot {
  z: number
  lane: number
  kind: SlotKind
  mesh: THREE.Object3D
  cleared: boolean
}

function buildSlotMesh(kind: SlotKind, obstacleColor: number): THREE.Object3D {
  switch (kind) {
    case 'jumpBar': {
      const g = new THREE.Group()
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.6), new THREE.MeshStandardMaterial({ color: obstacleColor, roughness: 0.6 }))
      box.position.y = 0.45
      box.castShadow = true
      g.add(box)
      return g
    }
    case 'slideBar': {
      const g = new THREE.Group()
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0xffb020, roughness: 0.5 }))
      bar.position.y = 1.5
      bar.castShadow = true
      g.add(bar)
      const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8), new THREE.MeshStandardMaterial({ color: 0x555555 }))
      post1.position.set(-0.75, 0.75, 0)
      g.add(post1)
      const post2 = post1.clone()
      post2.position.set(0.75, 0.75, 0)
      g.add(post2)
      return g
    }
    case 'coin': {
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.14, 8, 14), new THREE.MeshStandardMaterial({ color: 0xffd23f, metalness: 0.7, roughness: 0.25, emissive: 0x996b00, emissiveIntensity: 0.3 }))
      mesh.position.y = 1
      mesh.rotation.x = Math.PI / 2
      return mesh
    }
    case 'magnet':
    case 'speed':
    case 'shield':
    case 'multiplier': {
      const colors: Record<string, number> = { magnet: 0xff4fd8, speed: 0x4fd0ff, shield: 0x5fe07a, multiplier: 0xffd23f }
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), new THREE.MeshStandardMaterial({ color: colors[kind], emissive: colors[kind], emissiveIntensity: 0.5, roughness: 0.3 }))
      mesh.position.y = 1.1
      return mesh
    }
    case 'enemy': {
      const parts = buildHumanoid({ jacket: 0x8a1f1f, jacketShade: 0x5c1414, pants: 0x1a1a1a })
      parts.root.position.y = 0
      return parts.root
    }
    default:
      return new THREE.Group()
  }
}

function randomKind(combatEnabled: boolean): SlotKind {
  const roll = Math.random()
  if (roll < 0.1) return 'jumpBar'
  if (roll < 0.18) return 'slideBar'
  if (combatEnabled && roll < 0.24) return 'enemy'
  if (roll < 0.5) return 'coin'
  if (roll < 0.56) return 'magnet'
  if (roll < 0.62) return 'speed'
  if (roll < 0.68) return 'shield'
  if (roll < 0.74) return 'multiplier'
  return 'empty'
}

type Phase = 'start' | 'playing' | 'paused'

/**
 * The shared engine behind both "ריצה אינסופית" and "נינג'ה ראנר" - lane-
 * switch/jump/slide, procedurally recycled obstacle "slots" (an object
 * pool: a fixed 16 slots are reused and re-randomized as they pass behind
 * the player instead of spawning/destroying meshes every few meters),
 * distance scoring, a rising speed ramp, and the 4 requested power-ups. The
 * two games differ only in the `RunnerConfig` they pass in - character
 * palette, visual theme(s), and whether combat/double-jump are enabled -
 * not in a duplicated copy of this file.
 */
export default function EndlessRunnerEngine({ config, onFinish }: { config: RunnerConfig } & FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const mountRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('start')
  const [distance, setDistance] = useState(0)
  const [coins, setCoins] = useState(0)
  const [best, setBest] = useState(0)
  const [activeBuffs, setActiveBuffs] = useState<string[]>([])
  const finishedRef = useRef(false)

  const sceneRef = useRef<THREE.Scene | null>(null)
  const builtRef = useRef(false)

  const stateRef = useRef<{
    parts: HumanoidParts
    camera: THREE.PerspectiveCamera
    slots: Slot[]
    laneIndex: number
    posX: number
    posY: number
    velY: number
    grounded: boolean
    jumpsUsed: number
    sliding: number
    speed: number
    distance: number
    coins: number
    animPhase: number
    magnetT: number
    speedT: number
    shieldT: number
    multiplierT: number
    invulnT: number
    themeIndex: number
    groundMat: THREE.MeshStandardMaterial
    fog: THREE.FogExp2
    keys: Set<string>
    touchStart: { x: number; y: number } | null
    attackQueued: boolean
  } | null>(null)

  const start = () => {
    setDistance(0)
    setCoins(0)
    finishedRef.current = false
    setPhase('playing')
  }

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(`navon_runner_best_${config.title}`)
      if (v) setBest(Number(v))
    } catch {
      // storage unavailable - best score just won't persist
    }
  }, [config.title])

  useEffect(() => {
    if (phase !== 'playing' || stateRef.current) return
    const mount = mountRef.current
    if (!mount) return

    const parts = buildHumanoid(config.characterPalette)
    const camera = new THREE.PerspectiveCamera(62, mount.clientWidth / mount.clientHeight, 0.1, 150)

    const groundMat = new THREE.MeshStandardMaterial({ color: config.themes[0].groundColor, roughness: 0.9 })
    const fog = new THREE.FogExp2(config.themes[0].fogColor, 0.018)

    const slots: Slot[] = []

    stateRef.current = {
      parts,
      camera,
      slots,
      laneIndex: 1,
      posX: 0,
      posY: 0,
      velY: 0,
      grounded: true,
      jumpsUsed: 0,
      sliding: 0,
      speed: BASE_SPEED,
      distance: 0,
      coins: 0,
      animPhase: 0,
      magnetT: 0,
      speedT: 0,
      shieldT: 0,
      multiplierT: 0,
      invulnT: 0,
      themeIndex: 0,
      groundMat,
      fog,
      keys: new Set(),
      touchStart: null,
      attackQueued: false,
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const st = stateRef.current
      if (!st) return
      const key = e.key.toLowerCase()
      st.keys.add(key)
      if (e.key === 'Escape') setPhase((p) => (p === 'playing' ? 'paused' : p))
      if (e.key === ' ' || key === 'w' || e.key === 'ArrowUp') requestJump(st)
      if (key === 's' || e.key === 'ArrowDown') st.sliding = SLIDE_SECONDS
      if (key === 'a' || e.key === 'ArrowLeft') st.laneIndex = Math.max(0, st.laneIndex - 1)
      if (key === 'd' || e.key === 'ArrowRight') st.laneIndex = Math.min(2, st.laneIndex + 1)
      if (key === 'f' && config.combatEnabled) st.attackQueued = true
    }
    const onKeyUp = (e: KeyboardEvent) => stateRef.current?.keys.delete(e.key.toLowerCase())
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function requestJump(st: NonNullable<typeof stateRef.current>) {
    const maxJumps = config.doubleJump ? 2 : 1
    if (st.jumpsUsed < maxJumps) {
      st.velY = JUMP_VELOCITY
      st.grounded = false
      st.jumpsUsed++
      play('click')
    }
  }

  const paused = phase !== 'playing'

  const finishRun = (st: NonNullable<typeof stateRef.current>) => {
    if (finishedRef.current) return
    finishedRef.current = true
    play('hit')
    const finalScore = Math.max(1, Math.floor(st.distance) + st.coins * 5)
    setBest((b) => {
      const nb = Math.max(b, finalScore)
      try {
        window.localStorage.setItem(`navon_runner_best_${config.title}`, String(nb))
      } catch {
        // ignore
      }
      return nb
    })
    onFinish({ correct: finalScore, total: Math.round(finalScore * 1.2) })
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
        const theme = config.themes[0]
        setupBasicLighting(scene, theme.skyColor, theme.fogColor, 0.018)
        scene.fog = st.fog
        scene.add(st.parts.root)

        const groundGeo = new THREE.PlaneGeometry(14, 400)
        const ground = new THREE.Mesh(groundGeo, st.groundMat)
        ground.rotation.x = -Math.PI / 2
        ground.position.z = -150
        ground.receiveShadow = true
        scene.add(ground)

        for (let i = 0; i < SLOT_COUNT; i++) {
          const z = 10 + i * SLOT_SPACING
          const lane = Math.floor(Math.random() * 3)
          const kind = i < 3 ? 'empty' : randomKind(config.combatEnabled)
          const mesh = buildSlotMesh(kind, theme.obstacleColor)
          mesh.position.set(LANE_X[lane], 0, -z)
          scene.add(mesh)
          st.slots.push({ z, lane, kind, mesh, cleared: false })
        }
      }

      // ----- Speed & distance -----
      const speedBuffMul = st.speedT > 0 ? 1.35 : 1
      st.speed = Math.min(MAX_SPEED, BASE_SPEED + st.distance * SPEED_RAMP_PER_METER) * speedBuffMul
      st.distance += st.speed * dt
      setDistance(st.distance)

      // ----- Theme cycling -----
      const themeIdx = Math.min(config.themes.length - 1, Math.floor(st.distance / config.themeDistanceStep))
      if (themeIdx !== st.themeIndex) {
        st.themeIndex = themeIdx
        const theme = config.themes[themeIdx]
        st.groundMat.color.setHex(theme.groundColor)
        st.fog.color.setHex(theme.fogColor)
        scene.background = new THREE.Color(theme.skyColor)
        play('success')
      }

      // ----- Timers -----
      st.magnetT = Math.max(0, st.magnetT - dt)
      st.speedT = Math.max(0, st.speedT - dt)
      st.shieldT = Math.max(0, st.shieldT - dt)
      st.multiplierT = Math.max(0, st.multiplierT - dt)
      st.invulnT = Math.max(0, st.invulnT - dt)
      const buffs: string[] = []
      if (st.magnetT > 0) buffs.push('🧲')
      if (st.speedT > 0) buffs.push('⚡')
      if (st.shieldT > 0) buffs.push('🛡️')
      if (st.multiplierT > 0) buffs.push('💰x2')
      setActiveBuffs(buffs)

      // ----- Lane movement -----
      const targetX = LANE_X[st.laneIndex]
      st.posX += (targetX - st.posX) * Math.min(1, LANE_LERP * dt)

      // ----- Jump / slide physics -----
      st.velY += GRAVITY * dt
      st.posY += st.velY * dt
      if (st.posY <= 0) {
        st.posY = 0
        st.velY = 0
        if (!st.grounded) st.grounded = true
        st.jumpsUsed = 0
      }
      if (st.sliding > 0) st.sliding -= dt

      st.parts.root.position.set(st.posX, st.posY, 0)
      st.parts.root.scale.set(1, st.sliding > 0 ? 0.6 : 1, 1)
      st.animPhase += dt * (10 + st.speed * 0.5)
      animateHumanoid(st.parts, st.animPhase, 1, dt)

      // ----- Attack (ninja) -----
      const attacking = st.attackQueued
      st.attackQueued = false

      // ----- Slots: move toward player, recycle, collide -----
      const theme = config.themes[st.themeIndex]
      for (const slot of st.slots) {
        slot.z -= st.speed * dt
        slot.mesh.position.z = -slot.z

        if (slot.z < RECYCLE_BEHIND) {
          slot.z += SLOT_COUNT * SLOT_SPACING
          slot.lane = Math.floor(Math.random() * 3)
          slot.kind = randomKind(config.combatEnabled)
          slot.cleared = false
          scene.remove(slot.mesh)
          slot.mesh = buildSlotMesh(slot.kind, theme.obstacleColor)
          slot.mesh.position.set(LANE_X[slot.lane], 0, -slot.z)
          scene.add(slot.mesh)
          continue
        }

        if (slot.cleared || slot.kind === 'empty') continue

        // Magnet: pull nearby coins toward the player instead of requiring an exact lane/z match.
        if (slot.kind === 'coin' && st.magnetT > 0) {
          const dx = st.posX - slot.mesh.position.x
          const dist = Math.hypot(dx, slot.z)
          if (dist < MAGNET_RADIUS) {
            slot.mesh.position.x += dx * Math.min(1, dt * 8)
          }
        }

        const closeZ = Math.abs(slot.z) < 1.1
        const sameLane = slot.lane === st.laneIndex || (slot.kind === 'coin' && Math.abs(slot.mesh.position.x - st.posX) < 1.2)
        if (!closeZ || !sameLane) continue

        if (slot.kind === 'coin') {
          slot.cleared = true
          slot.mesh.visible = false
          const gain = st.multiplierT > 0 ? 2 : 1
          st.coins += gain
          setCoins(st.coins)
          play('coin')
          continue
        }
        if (slot.kind === 'magnet' || slot.kind === 'speed' || slot.kind === 'shield' || slot.kind === 'multiplier') {
          slot.cleared = true
          slot.mesh.visible = false
          play('success')
          if (slot.kind === 'magnet') st.magnetT = POWERUP_DURATION
          if (slot.kind === 'speed') st.speedT = POWERUP_DURATION
          if (slot.kind === 'shield') st.shieldT = POWERUP_DURATION
          if (slot.kind === 'multiplier') st.multiplierT = POWERUP_DURATION
          continue
        }
        if (slot.kind === 'enemy') {
          if (attacking) {
            slot.cleared = true
            slot.mesh.visible = false
            st.coins += 3
            setCoins(st.coins)
            play('hit')
            continue
          }
          // fall through to damage handling below
        }
        if (slot.kind === 'jumpBar' && st.posY > 0.75) continue
        if (slot.kind === 'slideBar' && st.sliding > 0) continue

        // Hit.
        if (st.invulnT > 0) continue
        if (st.shieldT > 0) {
          st.shieldT = 0
          st.invulnT = SHIELD_INVULN
          slot.cleared = true
          slot.mesh.visible = false
          play('shield')
          continue
        }
        finishRun(st)
        return
      }

      // ----- Camera -----
      const camDist = 6.2
      const camHeight = 3
      st.camera.position.set(st.posX * 0.5, camHeight, camDist)
      st.camera.lookAt(st.posX, 1.1, -4)
      renderer.render(scene, st.camera)
    },
    ({ scene }) => {
      disposeObject3D(scene)
      scene.clear()
      stateRef.current = null
      builtRef.current = false
    },
    paused
  )

  const onTouchStart = (e: ReactTouchEvent) => {
    const t = e.touches[0]
    if (stateRef.current) stateRef.current.touchStart = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: ReactTouchEvent) => {
    const st = stateRef.current
    if (!st || !st.touchStart) return
    const t = e.changedTouches[0]
    const dx = t.clientX - st.touchStart.x
    const dy = t.clientY - st.touchStart.y
    st.touchStart = null
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return
    if (Math.abs(dx) > Math.abs(dy)) {
      st.laneIndex = dx > 0 ? Math.min(2, st.laneIndex + 1) : Math.max(0, st.laneIndex - 1)
    } else if (dy < 0) {
      requestJump(st)
    } else {
      st.sliding = SLIDE_SECONDS
    }
  }

  return (
    <div className="relative mx-auto h-[70vh] max-h-[560px] w-full overflow-hidden rounded-blob bg-sky-200 shadow-pop card-outline">
      <div ref={mountRef} className="h-full w-full touch-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} />

      {phase === 'start' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-sky-100 p-4 text-center">
          <h2 className="font-fun text-2xl font-extrabold text-grape-600">{config.title}</h2>
          <p className="max-w-xs text-sm text-ink/60">
            {config.combatEnabled
              ? 'רוצו, קפצו, החליקו והתקיפו אויבים - הימנעו ממכשולים ואספו מטבעות ובונוסים'
              : 'רוצו, קפצו והחליקו הכי רחוק שאפשר - הימנעו ממכשולים ואספו מטבעות ובונוסים'}
          </p>
          <p className="text-xs text-ink/50">{tr('best_score')}: {best}</p>
          <button onClick={start} className="rounded-full bg-grass-500 px-8 py-3 font-fun text-lg font-extrabold text-white shadow-card btn-pressable">
            ▶ {tr('common_start')}
          </button>
        </div>
      )}

      {phase !== 'start' && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-3 flex flex-wrap items-center justify-center gap-2 px-3">
            <HudChip tone="sky">📏 {Math.floor(distance)}מ׳</HudChip>
            <HudChip tone="sunny">🪙 {coins}</HudChip>
            <HudChip tone="grass">🏆 {best}</HudChip>
            {activeBuffs.map((b) => (
              <HudChip key={b} tone="candy">
                {b}
              </HudChip>
            ))}
          </div>
          <button
            onClick={() => setPhase('paused')}
            aria-label="הפסקה"
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
            start()
          }}
        />
      )}

      {phase === 'playing' && (
        <div className="absolute bottom-4 inset-x-4 z-10 flex items-end justify-between sm:hidden">
          <div className="flex gap-2">
            <TouchButton
              label="⬅️"
              className="h-14 w-14"
              onDown={() => {
                if (stateRef.current) stateRef.current.laneIndex = Math.max(0, stateRef.current.laneIndex - 1)
              }}
            />
            <TouchButton
              label="➡️"
              className="h-14 w-14"
              onDown={() => {
                if (stateRef.current) stateRef.current.laneIndex = Math.min(2, stateRef.current.laneIndex + 1)
              }}
            />
          </div>
          <div className="flex gap-2">
            {config.combatEnabled && (
              <TouchButton
                label="🥊"
                className="h-14 w-14 bg-candy-300"
                onDown={() => {
                  if (stateRef.current) stateRef.current.attackQueued = true
                }}
              />
            )}
            <TouchButton
              label="⬇️"
              className="h-14 w-14"
              onDown={() => {
                if (stateRef.current) stateRef.current.sliding = SLIDE_SECONDS
              }}
            />
            <TouchButton
              label="⬆️"
              className="h-16 w-16 bg-grass-300"
              onDown={() => {
                if (stateRef.current) requestJump(stateRef.current)
              }}
            />
          </div>
        </div>
      )}

      <p className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-xs font-bold text-white/80 sm:block">
        חצים/A-D לשינוי נתיב · Space לקפיצה · ↓ להחלקה{config.combatEnabled ? ' · F להתקפה' : ''}
      </p>
    </div>
  )
}
