import type { LevelNum } from './types'

export interface LevelDef {
  id: LevelNum
  icon: string
  title: string
  subtitleHe: string
  cefr: string
  color: string
}

/** Editable at a glance - adding a 7th level later is one more row here plus a matching word file, nothing structural. */
export const LEVELS: LevelDef[] = [
  { id: 1, icon: '🟢', title: 'Beginner', subtitleHe: 'מילים בסיסיות ושימושיות מחיי היום-יום', cefr: 'A1', color: 'from-grass-400 to-grass-500' },
  { id: 2, icon: '🔵', title: 'Elementary', subtitleHe: 'מילים נפוצות לשיחות, עבודה, קניות ונסיעות', cefr: 'A2', color: 'from-sky-400 to-sky-500' },
  { id: 3, icon: '🟣', title: 'Intermediate', subtitleHe: 'אוצר מילים רחב יותר, משפטים ושיחות מורכבות יותר', cefr: 'B1', color: 'from-grape-400 to-grape-500' },
  { id: 4, icon: '🟠', title: 'Upper Intermediate', subtitleHe: 'מילים מתקדמות, ביטויים, Phrasal Verbs ו-Synonyms', cefr: 'B2', color: 'from-sunny-500 to-candy-500' },
  { id: 5, icon: '🔴', title: 'Advanced', subtitleHe: 'אוצר מילים עסקי, אקדמי ומקצועי', cefr: 'C1', color: 'from-candy-500 to-candy-600' },
  { id: 6, icon: '👑', title: 'Expert', subtitleHe: 'אוצר מילים ברמה גבוהה מאוד, Idioms, Collocations ומילים מורכבות', cefr: 'C2', color: 'from-ink to-grape-700' },
]

export function getLevel(id: LevelNum): LevelDef {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0]
}

export const MAX_LEVEL = 6 as const
export const TEST_QUESTION_COUNT = 20
export const TEST_PASS_PCT = 80
