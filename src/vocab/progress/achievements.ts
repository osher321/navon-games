import type { VocabProgressState } from './types'

export interface VocabAchievementDef {
  id: string
  icon: string
  title: string
  description: string
  check: (progress: VocabProgressState) => boolean
}

function wordsLearnedCount(p: VocabProgressState): number {
  return Object.values(p.wordStats).filter((s) => s.timesCorrect >= 1).length
}

function wordsMasteredCount(p: VocabProgressState): number {
  return Object.values(p.wordStats).filter((s) => s.mastered).length
}

export const VOCAB_ACHIEVEMENTS: VocabAchievementDef[] = [
  { id: 'first_word', icon: '🏆', title: 'First Word', description: 'למד את המילה הראשונה שלך', check: (p) => wordsLearnedCount(p) >= 1 },
  { id: 'words_100', icon: '🏆', title: '100 Words', description: 'למד 100 מילים', check: (p) => wordsLearnedCount(p) >= 100 },
  // Unreachable until the word bank grows past 500 entries - intentional
  // headroom for future content, not a bug.
  { id: 'vocab_master_500', icon: '🏆', title: 'Vocabulary Master', description: 'שלוט ב-500 מילים', check: (p) => wordsMasteredCount(p) >= 500 },
  { id: 'perfect_round', icon: '🏆', title: 'Perfect Round', description: 'סיים סיבוב ללא טעויות', check: (p) => p.perfectRounds >= 1 },
  { id: 'speed_master', icon: '🏆', title: 'Speed Master', description: 'ענה על 30 שאלות בדקה', check: (p) => p.bestSpeedScore >= 30 },
  { id: 'streak_7', icon: '🏆', title: '7 Day Streak', description: 'למד 7 ימים ברציפות', check: (p) => p.streak >= 7 },
]
