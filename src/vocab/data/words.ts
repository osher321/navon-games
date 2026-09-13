import type { CategoryId, LevelNum, VocabWord } from './types'
import { LEVEL1_WORDS } from './words/level1'
import { LEVEL2_WORDS } from './words/level2'
import { LEVEL3_WORDS } from './words/level3'
import { LEVEL4_WORDS } from './words/level4'
import { LEVEL5_WORDS } from './words/level5'
import { LEVEL6_WORDS } from './words/level6'

/** Adding a 7th level's words is one more file plus one more spread here - nothing else in the app needs to change. */
export const ALL_WORDS: VocabWord[] = [...LEVEL1_WORDS, ...LEVEL2_WORDS, ...LEVEL3_WORDS, ...LEVEL4_WORDS, ...LEVEL5_WORDS, ...LEVEL6_WORDS]

const BY_ID = new Map(ALL_WORDS.map((w) => [w.id, w]))
const BY_LEVEL = new Map<LevelNum, VocabWord[]>()
for (const w of ALL_WORDS) {
  const list = BY_LEVEL.get(w.level) ?? []
  list.push(w)
  BY_LEVEL.set(w.level, list)
}

export function getWordById(id: string): VocabWord | undefined {
  return BY_ID.get(id)
}

export function getWordsByLevel(level: LevelNum): VocabWord[] {
  return BY_LEVEL.get(level) ?? []
}

export function getWordsByCategory(category: CategoryId): VocabWord[] {
  return ALL_WORDS.filter((w) => w.category === category)
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** N random words from `pool` excluding `exceptId`, each with a distinct `he` translation so multiple-choice options never look identical. */
export function pickDistractors(pool: VocabWord[], exceptId: string, count: number): VocabWord[] {
  const seenHe = new Set<string>()
  const candidates = shuffle(pool.filter((w) => w.id !== exceptId))
  const picked: VocabWord[] = []
  for (const w of candidates) {
    if (picked.length >= count) break
    if (seenHe.has(w.he)) continue
    seenHe.add(w.he)
    picked.push(w)
  }
  return picked
}
