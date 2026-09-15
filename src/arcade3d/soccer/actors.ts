import * as THREE from 'three'
import { buildHumanoid, type HumanoidParts, type HumanoidPalette } from '../../gtn/game/humanoid'
import { PITCH } from './types'
import type { SoccerDifficulty, DifficultyTuning } from './types'
import { DIFFICULTY_TUNING } from './types'

const PLAYER_PALETTE: Partial<HumanoidPalette> = { jacket: 0x2b6fe0, jacketShade: 0x1f52ad, pants: 0xffffff, shoes: 0x141414 }
const KEEPER_PALETTE: Partial<HumanoidPalette> = { jacket: 0xffd23f, jacketShade: 0xd9a800, pants: 0x1a1a1a, shoes: 0x1a1a1a }
const DEFENDER_PALETTE: Partial<HumanoidPalette> = { jacket: 0xe0473f, jacketShade: 0xad2f28, pants: 0x1a1a1a, shoes: 0xffffff }

export interface Actor {
  parts: HumanoidParts
  root: THREE.Group
}

function buildActor(palette: Partial<HumanoidPalette>): Actor {
  const parts = buildHumanoid(palette)
  parts.root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (mesh.isMesh) mesh.castShadow = true
  })
  return { parts, root: parts.root }
}

export function buildSoccerPlayer(): Actor {
  return buildActor(PLAYER_PALETTE)
}
export function buildGoalkeeper(): Actor {
  return buildActor(KEEPER_PALETTE)
}
export function buildDefender(): Actor {
  return buildActor(DEFENDER_PALETTE)
}

// ---- Timed action poses -------------------------------------------------
// Each pose function takes a 0..1 progress value and sets joint rotations
// directly on the shared HumanoidParts groups - the same technique Player
// (GTN) already uses for its driving/parachute poses, just packaged as
// smooth eased curves instead of one-shot snapshots so the motion actually
// reads as an animation rather than a pose that snaps in and out.
const ease = (t: number) => t * t * (3 - 2 * t)

/** Windup -> strike -> follow-through, driven by t (0..1) over the whole kick. `side` is which leg strikes (1 = right). */
export function poseKick(parts: HumanoidParts, t: number, side: 1 | -1 = 1) {
  const kickLeg = side === 1 ? parts.rightLeg : parts.leftLeg
  const plantLeg = side === 1 ? parts.leftLeg : parts.rightLeg
  const armA = side === 1 ? parts.leftArm : parts.rightArm
  const armB = side === 1 ? parts.rightArm : parts.leftArm

  plantLeg.rotation.x = -0.12
  armA.rotation.x = -0.5
  armB.rotation.x = 0.2

  if (t < 0.4) {
    const p = ease(t / 0.4)
    kickLeg.rotation.x = -0.3 - p * 1.15 // windup: leg swings back
  } else if (t < 0.55) {
    const p = ease((t - 0.4) / 0.15)
    kickLeg.rotation.x = -1.45 + p * 2.35 // strike: snaps forward through the ball
  } else {
    const p = ease((t - 0.55) / 0.45)
    kickLeg.rotation.x = 0.9 - p * 0.9 // recovery back to neutral
  }
  parts.torso.rotation.x = t < 0.55 ? -0.15 : -0.15 + ease((t - 0.55) / 0.45) * 0.15
}

/** A short arms-up hop, played once after scoring. */
export function poseCelebrate(parts: HumanoidParts, t: number) {
  const hop = Math.sin(Math.min(1, t) * Math.PI) * 0.18
  parts.hips.position.y += hop
  parts.leftArm.rotation.x = -2.4
  parts.rightArm.rotation.x = -2.4
  parts.leftArm.rotation.z = 0.35
  parts.rightArm.rotation.z = -0.35
  parts.leftLeg.rotation.x = -hop * 1.5
  parts.rightLeg.rotation.x = -hop * 1.5
}

/** A brief disappointed slump, played after a miss/save. */
export function poseMiss(parts: HumanoidParts, t: number) {
  const p = Math.sin(Math.min(1, t) * Math.PI)
  parts.torso.rotation.x = p * 0.25
  parts.head.rotation.x = p * 0.3
  parts.leftArm.rotation.x = -0.6 - p * 0.3
  parts.rightArm.rotation.x = -0.6 - p * 0.3
}

/** Keeper's save attempt: leans/reaches toward `dir` (-1 left, 0 center, 1 right) as t goes 0->1, arms stretched out. Position (the actual dive distance) is handled by the caller; this is only the visual lean. */
export function poseDive(parts: HumanoidParts, t: number, dir: -1 | 0 | 1) {
  const p = ease(Math.min(1, t))
  parts.root.rotation.z = dir * p * 0.9
  parts.leftArm.rotation.x = -1.1 - p * 0.5
  parts.rightArm.rotation.x = -1.1 - p * 0.5
  parts.leftArm.rotation.z = 0.3 + dir * p * 0.6
  parts.rightArm.rotation.z = -(0.3 - dir * p * 0.6)
  parts.leftLeg.rotation.x = dir === 0 ? p * 0.3 : -dir * p * 0.4
  parts.rightLeg.rotation.x = dir === 0 ? p * 0.3 : -dir * p * 0.4
}

/** Defender/player tumble - used for a mistimed tackle reaction. */
export function poseFall(parts: HumanoidParts, t: number) {
  const p = ease(Math.min(1, t))
  parts.root.rotation.x = p * 1.3
  parts.hips.position.y -= p * 0.35
}

// ---- Simple AI helpers ---------------------------------------------------

export interface KeeperDiveDecision {
  dir: -1 | 0 | 1
  targetX: number
  saved: boolean
}

/**
 * Decides, at the moment a shot is struck, whether the keeper reads it
 * correctly and how far it can actually get given its reaction delay and
 * reach for the current difficulty - controlled randomness rather than a
 * fixed always-correct (or always-wrong) response, and the shot only
 * counts as saved if the keeper's final position ends up close enough to
 * where the ball actually crosses the line.
 */
export function decideKeeperDive(actualCrossX: number, crossY: number, difficulty: SoccerDifficulty, timeToArrival: number): KeeperDiveDecision {
  const tuning: DifficultyTuning = DIFFICULTY_TUNING[difficulty]
  const readCorrectly = Math.random() < tuning.keeperReadChance
  const guessedX = readCorrectly ? actualCrossX : (Math.random() * 2 - 1) * PITCH.goalHalfWidth
  const availableTime = Math.max(0, timeToArrival - tuning.keeperReactionDelay)
  // The keeper can only close part of the distance in the time it has -
  // `keeperReach` is the max it could ever cover with plenty of time, and
  // availableTime scales that down for a fast, close-range shot.
  const maxTravelThisSave = tuning.keeperReach * Math.min(1, availableTime / 0.45)
  const targetX = Math.max(-maxTravelThisSave, Math.min(maxTravelThisSave, guessedX))
  const closeEnough = Math.abs(targetX - actualCrossX) < 0.85
  const withinReachHeight = crossY < PITCH.goalHeight - 0.15
  const dir: -1 | 0 | 1 = targetX < -0.3 ? -1 : targetX > 0.3 ? 1 : 0
  return { dir, targetX, saved: closeEnough && withinReachHeight }
}

/** Moves an actor toward (targetX, targetZ) at `speed`, keeping its run-cycle animation in sync with how fast it's actually moving - shared by defenders (Attack mode) and any future keeper repositioning. */
export function stepTowards(actor: Actor, targetX: number, targetZ: number, speed: number, dt: number): number {
  const dx = targetX - actor.root.position.x
  const dz = targetZ - actor.root.position.z
  const dist = Math.hypot(dx, dz)
  if (dist < 0.05) return 0
  const step = Math.min(dist, speed * dt)
  actor.root.position.x += (dx / dist) * step
  actor.root.position.z += (dz / dist) * step
  actor.root.rotation.y = Math.atan2(dx, dz)
  return step / dt
}
