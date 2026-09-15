import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { FunGameProps } from '../../games/types'
import { useSound } from '../../hooks/useSound'
import { useI18n } from '../../i18n/LanguageContext'
import DifficultySelector from '../../components/DifficultySelector'
import { useArcadeCanvas } from '../useArcadeCanvas'
import { setupBasicLighting, disposeObject3D } from '../sceneBasics'
import { HudChip, PauseOverlay, TouchButton } from '../ArcadeUI'
import { ChaseCamera } from '../../gtn/game/camera'
import { animateHumanoid } from '../../gtn/game/humanoid'
import { buildStadium, type Stadium } from './field'
import { SoccerBall } from './ball'
import {
  buildSoccerPlayer,
  buildGoalkeeper,
  buildDefender,
  poseKick,
  poseCelebrate,
  poseMiss,
  poseDive,
  poseFall,
  stepTowards,
  decideKeeperDive,
  type Actor,
  type KeeperDiveDecision,
} from './actors'
import { PITCH, BALL_RADIUS, PENALTY_KICKS, ATTACK_WAVES, DIFFICULTY_TUNING, SOCCER_DIFFICULTY_ICON } from './types'
import type { SoccerMode, SoccerDifficulty } from './types'

const GRAVITY = 9.8
type Phase = 'start' | 'difficulty' | 'playing' | 'paused'
type ShotStage = 'ready' | 'flight' | 'result'
type ShotOutcome = 'goal' | 'save' | 'miss' | 'post'

const MAX_DRAG = 140
const FORWARD_MIN = 12
const FORWARD_RANGE = 20
const UP_MIN = 2.5
const UP_RANGE = 6.5
const LATERAL_MAX = 7
const CURVE_STRENGTH = 2.2
const DRIBBLE_OFFSET = 1.1
const ATTACK_RUN_SPEED = 4.2
const STRAFE_SPEED = 5.5
const STEAL_RADIUS = 1.4

interface Shot {
  vx: number
  vy: number
  vz: number
  curve: number
}

function computeShot(dx: number, dy: number): Shot {
  const dist = Math.min(MAX_DRAG, Math.hypot(dx, dy))
  const aimX = Math.max(-1, Math.min(1, dx / MAX_DRAG))
  const power = Math.max(0.18, dist / MAX_DRAG)
  const loft = Math.max(0, Math.min(1, -dy / MAX_DRAG))
  return {
    vx: aimX * LATERAL_MAX,
    vy: UP_MIN + loft * UP_RANGE,
    vz: FORWARD_MIN + power * FORWARD_RANGE,
    curve: aimX * CURVE_STRENGTH,
  }
}

/** Analytic prediction of where a shot will cross the goal-line plane, used only to brief the keeper AI at the moment of the kick - actual scoring is resolved from the ball's real simulated position each frame. */
function predictCrossing(from: THREE.Vector3, shot: Shot): { x: number; y: number; t: number } {
  const dz = PITCH.goalZ - from.z
  const t = shot.vz > 0.01 ? dz / shot.vz : 0
  const x = from.x + shot.vx * t + 0.5 * shot.curve * t * t
  const y = from.y + shot.vy * t - 0.5 * GRAVITY * t * t
  return { x, y, t }
}

interface SoccerState {
  stadium: Stadium
  player: Actor
  keeper: Actor | null
  defenders: Actor[]
  ball: SoccerBall
  camera: ChaseCamera
  keys: Set<string>
  touchStrafe: number
  drag: { active: boolean; startX: number; startY: number; curX: number; curY: number; pointerId: number | null }
  chargeStart: number | null
  chargeAim: number
  chargeLoft: number

  shotStage: ShotStage
  shotElapsed: number
  keeperDecision: KeeperDiveDecision | null
  kickActionT: number | null
  reactionT: number | null
  reactionKind: 'goal' | 'miss' | null

  dribbling: boolean
  playerFacing: number
  attemptIndex: number
  goals: number
  misses: number
  combo: number
  bestCombo: number
  elapsedTime: number
}

export default function SoccerGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const mountRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('start')
  const [mode, setMode] = useState<SoccerMode>('penalties')
  const [difficulty, setDifficulty] = useState<SoccerDifficulty>('medium')

  const [goals, setGoals] = useState(0)
  const [misses, setMisses] = useState(0)
  const [combo, setCombo] = useState(0)
  const [attempt, setAttempt] = useState(1)
  const [timeLeft, setTimeLeft] = useState(0)
  const [message, setMessage] = useState<{ text: string; tone: 'goal' | 'bad' } | null>(null)
  const [dragVisual, setDragVisual] = useState<{ x: number; y: number; power: number } | null>(null)
  const finishedRef = useRef(false)

  const stateRef = useRef<SoccerState | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const builtRef = useRef(false)

  const totalAttempts = mode === 'penalties' ? PENALTY_KICKS : mode === 'attack' ? ATTACK_WAVES : Infinity

  const startGame = (m: SoccerMode, d: SoccerDifficulty) => {
    setMode(m)
    setDifficulty(d)
    setGoals(0)
    setMisses(0)
    setCombo(0)
    setAttempt(1)
    setTimeLeft(DIFFICULTY_TUNING[d].shotsTimeLimit)
    setMessage(null)
    finishedRef.current = false
    builtRef.current = false
    stateRef.current = null
    setPhase('playing')
  }

  const finishGame = (finalGoals: number, finalAttempts: number) => {
    if (finishedRef.current) return
    finishedRef.current = true
    onFinish({ correct: finalGoals, total: Math.max(1, finalAttempts) })
  }

  // ----- Per-shot resolution -----
  const resolveShot = (st: SoccerState, outcome: ShotOutcome) => {
    st.shotStage = 'result'
    st.shotElapsed = 0
    st.reactionT = 0
    st.reactionKind = outcome === 'goal' ? 'goal' : 'miss'

    if (outcome === 'goal') {
      const comboAfter = st.combo + 1
      st.combo = comboAfter
      st.bestCombo = Math.max(st.bestCombo, comboAfter)
      st.goals += 1
      setGoals(st.goals)
      setCombo(comboAfter)
      play('goal')
      const bonus = comboAfter >= 5 ? tr('soccer_combo_bonus5') : comboAfter >= 3 ? tr('soccer_combo_bonus3') : null
      setMessage({ text: bonus ? `${tr('soccer_goal_exclaim')} ${bonus}` : tr('soccer_goal_exclaim'), tone: 'goal' })
      setTimeout(() => play('crowd_cheer'), 120)
    } else {
      st.combo = 0
      st.misses += 1
      setMisses(st.misses)
      setCombo(0)
      if (outcome === 'save') {
        play('hit')
        setMessage({ text: tr('soccer_saved'), tone: 'bad' })
      } else if (outcome === 'post') {
        play('post')
        setMessage({ text: tr('soccer_post_hit'), tone: 'bad' })
      } else {
        play('wrong')
        setMessage({ text: tr('soccer_missed'), tone: 'bad' })
      }
    }
  }

  const resetForNextAttempt = (st: SoccerState) => {
    st.shotStage = 'ready'
    st.shotElapsed = 0
    st.keeperDecision = null
    st.kickActionT = null
    st.reactionT = null
    st.reactionKind = null
    st.dribbling = mode === 'attack'
    setMessage(null)

    if (mode === 'penalties' || mode === 'shots') {
      const spreadX = mode === 'shots' ? (Math.random() * 2 - 1) * 3.5 : 0
      const spotZ = mode === 'shots' ? PITCH.penaltySpotZ - Math.random() * 6 : PITCH.penaltySpotZ
      st.ball.placeAt(spreadX, 0, spotZ)
      st.player.root.position.set(spreadX, 0, spotZ - 1.4)
      st.player.root.rotation.y = 0
      if (st.keeper) st.keeper.root.position.set(0, 0, PITCH.goalZ - 0.3)
    } else {
      st.player.root.position.set(0, 0, PITCH.midfieldZ)
      st.player.root.rotation.y = 0
      st.playerFacing = 0
      st.ball.placeAt(0, 0, PITCH.midfieldZ - DRIBBLE_OFFSET)
      st.defenders.forEach((def, i) => {
        def.root.position.set((i === 0 ? -1 : 1) * 3.5, 0, PITCH.midfieldZ + 12 + i * 4)
      })
      if (st.keeper) st.keeper.root.position.set(0, 0, PITCH.goalZ - 0.3)
    }
  }

  const advanceAttempt = (st: SoccerState) => {
    const next = st.attemptIndex + 1
    st.attemptIndex = next
    setAttempt(next)
    if ((mode === 'penalties' || mode === 'attack') && next > totalAttempts) {
      finishGame(st.goals, totalAttempts)
      return
    }
    resetForNextAttempt(st)
  }

  const shoot = (st: SoccerState, dx: number, dy: number) => {
    if (st.shotStage !== 'ready') return
    const shot = computeShot(dx, dy)
    const origin = st.ball.position.clone()
    st.ball.kick(shot.vx, shot.vy, shot.vz, shot.curve)
    st.dribbling = false
    play('kick')
    st.kickActionT = 0
    st.shotStage = 'flight'
    st.shotElapsed = 0

    if (st.keeper) {
      const predicted = predictCrossing(origin, shot)
      st.keeperDecision = decideKeeperDive(predicted.x, predicted.y, difficulty, predicted.t)
    }
  }

  useEffect(() => {
    if (phase !== 'playing' || stateRef.current) return
    const mount = mountRef.current
    if (!mount) return

    const stadium = buildStadium()
    const player = buildSoccerPlayer()
    const keeper = mode === 'attack' ? null : buildGoalkeeper()
    const defenders = mode === 'attack' ? [buildDefender(), buildDefender()] : []
    const ball = new SoccerBall()
    const camera = new ChaseCamera(mount.clientWidth / mount.clientHeight)

    const st: SoccerState = {
      stadium,
      player,
      keeper,
      defenders,
      ball,
      camera,
      keys: new Set(),
      touchStrafe: 0,
      drag: { active: false, startX: 0, startY: 0, curX: 0, curY: 0, pointerId: null },
      chargeStart: null,
      chargeAim: 0,
      chargeLoft: 0,
      shotStage: 'ready',
      shotElapsed: 0,
      keeperDecision: null,
      kickActionT: null,
      reactionT: null,
      reactionKind: null,
      dribbling: mode === 'attack',
      playerFacing: 0,
      attemptIndex: 1,
      goals: 0,
      misses: 0,
      combo: 0,
      bestCombo: 0,
      elapsedTime: 0,
    }
    resetForNextAttempt(st)
    stateRef.current = st

    const onKeyDown = (e: KeyboardEvent) => {
      st.keys.add(e.key.toLowerCase())
      if (e.key === 'Escape') setPhase((p) => (p === 'playing' ? 'paused' : p))
      if (e.key === ' ' && st.chargeStart === null && st.shotStage === 'ready') {
        e.preventDefault()
        st.chargeStart = performance.now()
        st.chargeAim = 0
        st.chargeLoft = 0
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      st.keys.delete(e.key.toLowerCase())
      if (e.key === ' ' && st.chargeStart !== null) {
        const held = Math.min(1, (performance.now() - st.chargeStart) / 950)
        st.chargeStart = null
        shoot(st, st.chargeAim * MAX_DRAG, -st.chargeLoft * MAX_DRAG * 0.6 - held * MAX_DRAG * 0.4)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const onPointerDown = (e: PointerEvent) => {
      if (st.drag.pointerId !== null) return
      st.drag = { active: true, startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY, pointerId: e.pointerId }
    }
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== st.drag.pointerId) return
      st.drag.curX = e.clientX
      st.drag.curY = e.clientY
      const dx = st.drag.curX - st.drag.startX
      const dy = st.drag.curY - st.drag.startY
      setDragVisual({ x: dx, y: dy, power: Math.min(1, Math.hypot(dx, dy) / MAX_DRAG) })
    }
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== st.drag.pointerId) return
      const dx = st.drag.curX - st.drag.startX
      const dy = st.drag.curY - st.drag.startY
      st.drag.active = false
      st.drag.pointerId = null
      setDragVisual(null)
      if (Math.hypot(dx, dy) > 12) shoot(st, dx, dy)
    }
    mount.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      mount.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode, difficulty])

  const paused = phase !== 'playing'

  useArcadeCanvas(
    mountRef,
    (dt, { scene, renderer }) => {
      sceneRef.current = scene
      const st = stateRef.current
      if (!st || finishedRef.current) return

      if (!builtRef.current) {
        builtRef.current = true
        setupBasicLighting(scene, 0x8fd0ff, 0xbfe8ff, 0.0035)
        scene.add(st.stadium.group)
        scene.add(st.player.root)
        scene.add(st.ball.mesh)
        if (st.keeper) scene.add(st.keeper.root)
        st.defenders.forEach((d) => scene.add(d.root))
      }

      st.elapsedTime += dt
      if (mode === 'shots') {
        const remaining = Math.max(0, DIFFICULTY_TUNING[difficulty].shotsTimeLimit - st.elapsedTime)
        setTimeLeft(remaining)
        if (remaining <= 0) {
          finishGame(st.goals, Math.max(st.attemptIndex - 1, 1))
          return
        }
      }

      // ----- Charging aim nudges (keyboard) -----
      if (st.chargeStart !== null) {
        if (st.keys.has('arrowleft') || st.keys.has('a')) st.chargeAim = Math.max(-1, st.chargeAim - dt * 1.4)
        if (st.keys.has('arrowright') || st.keys.has('d')) st.chargeAim = Math.min(1, st.chargeAim + dt * 1.4)
        if (st.keys.has('arrowup') || st.keys.has('w')) st.chargeLoft = Math.min(1, st.chargeLoft + dt * 1.4)
      }

      // ----- Attack mode movement/dribble -----
      if (mode === 'attack' && st.dribbling && st.shotStage === 'ready') {
        let strafe = st.touchStrafe
        if (st.keys.has('arrowleft') || st.keys.has('a')) strafe -= 1
        if (st.keys.has('arrowright') || st.keys.has('d')) strafe += 1
        strafe = Math.max(-1, Math.min(1, strafe))
        st.player.root.position.z += ATTACK_RUN_SPEED * dt
        st.player.root.position.x = Math.max(-PITCH.halfWidth + 2, Math.min(PITCH.halfWidth - 2, st.player.root.position.x + strafe * STRAFE_SPEED * dt))
        st.player.root.rotation.y = strafe * 0.35
        st.ball.mesh.position.set(st.player.root.position.x, BALL_RADIUS, st.player.root.position.z + DRIBBLE_OFFSET)

        for (const def of st.defenders) {
          stepTowards(def, st.player.root.position.x, Math.max(def.root.position.z, st.player.root.position.z + 2), DIFFICULTY_TUNING[difficulty].defenderSpeed, dt)
          animateHumanoid(def.parts, st.elapsedTime * 6, 1, dt)
          const dist = Math.hypot(def.root.position.x - st.ball.position.x, def.root.position.z - st.ball.position.z)
          if (dist < STEAL_RADIUS && Math.random() < DIFFICULTY_TUNING[difficulty].defenderStealChance * dt * 6) {
            st.dribbling = false
            play('whistle')
            poseFall(st.player.parts, 1)
            setMessage({ text: tr('soccer_stolen'), tone: 'bad' })
            st.shotStage = 'result'
            st.reactionT = 0
            st.reactionKind = 'miss'
            st.misses += 1
            setMisses(st.misses)
            st.combo = 0
            setCombo(0)
            break
          }
        }

        if (st.player.root.position.z > PITCH.goalZ - 6 && st.shotStage === 'ready') {
          // Close enough that running past untouched would strand the wave - auto-take a straight shot if the player never dragged.
          shoot(st, 0, -70)
        }
      } else if (mode === 'attack') {
        animateHumanoid(st.player.parts, st.elapsedTime * 6, 0, dt)
      } else {
        animateHumanoid(st.player.parts, st.elapsedTime * 6, 0, dt)
      }

      // Kick animation overrides legs/torso for its short duration.
      if (st.kickActionT !== null) {
        st.kickActionT += dt / 0.55
        poseKick(st.player.parts, Math.min(1, st.kickActionT))
        if (st.kickActionT >= 1) st.kickActionT = null
      }

      // Keeper idle sway + dive.
      if (st.keeper) {
        if (st.keeperDecision && st.shotStage === 'flight') {
          const diveT = (st.shotElapsed - DIFFICULTY_TUNING[difficulty].keeperReactionDelay) / 0.35
          if (diveT >= 0) {
            const p = Math.min(1, diveT)
            st.keeper.root.position.x = st.keeperDecision.targetX * p
            poseDive(st.keeper.parts, p, st.keeperDecision.dir)
          }
        } else if (st.shotStage === 'ready') {
          st.keeper.root.position.x = Math.sin(st.elapsedTime * 1.1) * 0.6
          st.keeper.root.rotation.z = 0
          animateHumanoid(st.keeper.parts, st.elapsedTime * 4, 0, dt)
        }
      }

      // ----- Ball flight / scoring -----
      if (st.shotStage === 'flight') {
        st.shotElapsed += dt
        const prevZ = st.ball.position.z
        st.ball.update(dt, 0)

        // Post/crossbar deflection.
        for (const col of st.stadium.postColliders) {
          const horizontal = Math.abs(col.start.y - col.end.y) < 0.01
          let d: number
          if (horizontal) {
            d = Math.hypot(st.ball.position.y - col.start.y, st.ball.position.z - col.start.z)
            if (Math.abs(st.ball.position.x) > PITCH.goalHalfWidth + col.radius + 0.3) d = Infinity
          } else {
            d = Math.hypot(st.ball.position.x - col.start.x, st.ball.position.z - col.start.z)
            if (st.ball.position.y > col.end.y + 0.3 || st.ball.position.y < -0.3) d = Infinity
          }
          if (d < BALL_RADIUS + col.radius) {
            st.ball.velocity.multiplyScalar(-0.35)
            st.ball.velocity.y = Math.abs(st.ball.velocity.y) * 0.5
            resolveShot(st, 'post')
            break
          }
        }

        if (st.shotStage === 'flight' && prevZ < PITCH.goalZ && st.ball.position.z >= PITCH.goalZ) {
          const inBounds = Math.abs(st.ball.position.x) <= PITCH.goalHalfWidth && st.ball.position.y <= PITCH.goalHeight
          if (!inBounds) {
            resolveShot(st, 'miss')
          } else if (st.keeperDecision?.saved) {
            resolveShot(st, 'save')
          } else {
            resolveShot(st, 'goal')
          }
        } else if (st.shotStage === 'flight' && (st.ball.position.z > PITCH.goalZ + 5 || (st.ball.grounded && st.ball.speed < 0.3 && st.shotElapsed > 0.6))) {
          resolveShot(st, 'miss')
        }
      } else if (st.shotStage === 'result') {
        st.ball.update(dt, 0)
        if (st.reactionT !== null) {
          st.reactionT += dt
          if (st.reactionKind === 'goal') poseCelebrate(st.player.parts, st.reactionT / 0.9)
          else poseMiss(st.player.parts, st.reactionT / 0.9)
          if (st.reactionT > 1.3) {
            st.reactionT = null
            st.reactionKind = null
            advanceAttempt(st)
          }
        }
      } else {
        st.ball.update(dt, 0)
      }

      st.camera.update(dt, st.player.root.position, st.playerFacing, [], {
        distance: mode === 'attack' ? 6.2 : 5,
        height: mode === 'attack' ? 3.2 : 2.4,
        lookHeight: 1.4,
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

  return (
    <div className="relative mx-auto h-[70vh] max-h-[560px] w-full overflow-hidden rounded-blob bg-sky-300 shadow-pop card-outline">
      <div ref={mountRef} className="h-full w-full touch-none" />

      {phase === 'start' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-sky-100 p-4 text-center">
          <h2 className="font-fun text-2xl font-extrabold text-grape-600">⚽ {tr('game_soccer_name')}</h2>
          <p className="max-w-sm text-sm text-ink/60">{tr('soccer_instructions')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {(['penalties', 'shots', 'attack'] as SoccerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m)
                  setPhase('difficulty')
                }}
                className="flex w-40 flex-col items-center gap-1 rounded-xl2 bg-white px-4 py-4 font-fun font-extrabold text-ink shadow-card card-outline btn-pressable transition-all hover:-translate-y-0.5"
              >
                <span className="text-3xl">{m === 'penalties' ? '🥅' : m === 'shots' ? '⚡' : '🏃'}</span>
                <span className="text-sm">{tr(`soccer_mode_${m}`)}</span>
                <span className="text-xs font-medium text-ink/50">{tr(`soccer_mode_${m}_desc`)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'difficulty' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-sky-100 p-4">
          <DifficultySelector
            title={`${tr(`soccer_mode_${mode}`)} · ${tr('choose_level')}`}
            options={(['easy', 'medium', 'hard', 'expert'] as SoccerDifficulty[]).map((d) => ({
              id: d,
              icon: SOCCER_DIFFICULTY_ICON[d],
              label: tr(`difficulty_${d}`),
            }))}
            onSelect={(d) => startGame(mode, d)}
          />
        </div>
      )}

      {phase !== 'start' && phase !== 'difficulty' && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-3 flex flex-wrap items-center justify-center gap-2 px-3">
            <HudChip tone="grass">
              ⚽ {goals}
              {mode !== 'shots' && <span className="opacity-70"> /{totalAttempts === Infinity ? '' : totalAttempts}</span>}
            </HudChip>
            {mode === 'shots' && <HudChip tone="sky">⏱️ {Math.ceil(timeLeft)}s</HudChip>}
            {mode !== 'shots' && <HudChip tone="sky">🎯 {Math.min(attempt, totalAttempts)}/{totalAttempts}</HudChip>}
            <HudChip tone="candy">🔥 {combo}</HudChip>
            <HudChip tone="sunny">❌ {misses}</HudChip>
          </div>

          <button
            onClick={() => setPhase('paused')}
            aria-label={tr('common_pause')}
            className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-lg shadow-card btn-pressable"
          >
            ⏸️
          </button>

          {message && (
            <div
              className={`pointer-events-none absolute left-1/2 top-1/3 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full px-6 py-3 text-center font-fun text-xl font-extrabold shadow-pop ${
                message.tone === 'goal' ? 'bg-grass-500 text-white' : 'bg-ink/80 text-white'
              }`}
            >
              {message.text}
            </div>
          )}

          {dragVisual && (
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-1 rounded-full bg-white/80"
              style={{
                width: `${Math.hypot(dragVisual.x, dragVisual.y)}px`,
                transform: `translate(-50%,-50%) rotate(${Math.atan2(dragVisual.y, dragVisual.x)}rad)`,
                opacity: 0.4 + dragVisual.power * 0.6,
              }}
            />
          )}

          {mode === 'attack' && (
            <div className="absolute bottom-4 start-4 z-10 flex gap-3 sm:hidden">
              <TouchButton
                label="⬅️"
                className="h-16 w-16"
                onDown={() => {
                  if (stateRef.current) stateRef.current.touchStrafe = -1
                }}
                onUp={() => {
                  if (stateRef.current) stateRef.current.touchStrafe = 0
                }}
              />
              <TouchButton
                label="➡️"
                className="h-16 w-16"
                onDown={() => {
                  if (stateRef.current) stateRef.current.touchStrafe = 1
                }}
                onUp={() => {
                  if (stateRef.current) stateRef.current.touchStrafe = 0
                }}
              />
            </div>
          )}

          <p className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-xs font-bold text-white/90 sm:block">
            {tr('soccer_drag_hint')}
          </p>
          <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-white/90 sm:hidden">
            👆 {tr('soccer_drag_hint')}
          </p>
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
            startGame(mode, difficulty)
          }}
        />
      )}
    </div>
  )
}
