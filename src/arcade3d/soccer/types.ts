export type SoccerMode = 'penalties' | 'shots' | 'attack'
export type SoccerDifficulty = 'easy' | 'medium' | 'hard' | 'expert'

export const SOCCER_DIFFICULTY_ICON: Record<SoccerDifficulty, string> = {
  easy: '🟢',
  medium: '🔵',
  hard: '🔴',
  expert: '🟣',
}

/** Everything that scales with difficulty in one place - keeper skill/speed, defender awareness, and how much time/room the player gets. Higher = harder for the player throughout. */
export interface DifficultyTuning {
  /** 0-1: chance the keeper reads the shot correctly and dives the right way at all. */
  keeperReadChance: number
  /** Seconds of delay before the keeper commits to a dive after the shot is kicked. */
  keeperReactionDelay: number
  /** How far the keeper can reach once diving (world units). */
  keeperReach: number
  /** Attack mode: how fast defenders close in (world units/sec). */
  defenderSpeed: number
  /** Attack mode: 0-1 chance per frame-in-range a defender wins the ball off the player. */
  defenderStealChance: number
  /** Shots-on-goal mode: seconds on the clock. */
  shotsTimeLimit: number
}

export const DIFFICULTY_TUNING: Record<SoccerDifficulty, DifficultyTuning> = {
  easy: { keeperReadChance: 0.35, keeperReactionDelay: 0.42, keeperReach: 2.1, defenderSpeed: 2.6, defenderStealChance: 0.15, shotsTimeLimit: 75 },
  medium: { keeperReadChance: 0.55, keeperReactionDelay: 0.32, keeperReach: 2.5, defenderSpeed: 3.3, defenderStealChance: 0.25, shotsTimeLimit: 60 },
  hard: { keeperReadChance: 0.72, keeperReactionDelay: 0.24, keeperReach: 2.9, defenderSpeed: 4.0, defenderStealChance: 0.35, shotsTimeLimit: 50 },
  expert: { keeperReadChance: 0.86, keeperReactionDelay: 0.16, keeperReach: 3.2, defenderSpeed: 4.6, defenderStealChance: 0.45, shotsTimeLimit: 42 },
}

export const PENALTY_KICKS = 5
export const ATTACK_WAVES = 5

/** Pitch layout (arcade scale, not real-world meters) - shared by field building, camera framing, and all gameplay/physics code so nothing hardcodes a second copy of these numbers. */
export const PITCH = {
  halfWidth: 22,
  length: 60,
  goalZ: 60,
  goalHalfWidth: 4,
  goalHeight: 2.6,
  penaltySpotZ: 48,
  midfieldZ: 20,
}

export const BALL_RADIUS = 0.28
