import type { Achievement, ProgressState } from '../types'

function totalWordsLearned(p: ProgressState) {
  return Object.values(p.languages).reduce((sum, l) => sum + l.wordsLearned.length, 0)
}

function anyLanguageReached(p: ProgressState, levelId: string) {
  return Object.values(p.languages).some((l) => l.unlockedLevels.includes(levelId as any))
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_game',
    icon: '🎮',
    nameKey: 'ach_first_game',
    descKey: 'ach_first_game_desc',
    check: (p) => p.gamesPlayedTotal >= 1,
  },
  {
    id: 'ten_games',
    icon: '🕹️',
    nameKey: 'ach_ten_games',
    descKey: 'ach_ten_games_desc',
    check: (p) => p.gamesPlayedTotal >= 10,
  },
  {
    id: 'thirty_games',
    icon: '🎯',
    nameKey: 'ach_thirty_games',
    descKey: 'ach_thirty_games_desc',
    check: (p) => p.gamesPlayedTotal >= 30,
  },
  {
    id: 'perfect_score',
    icon: '💯',
    nameKey: 'ach_perfect',
    descKey: 'ach_perfect_desc',
    check: (p) => p.recentGames.some((g) => g.perfect),
  },
  {
    id: 'streak_3',
    icon: '🔥',
    nameKey: 'ach_streak3',
    descKey: 'ach_streak3_desc',
    check: (p) => p.streak >= 3,
  },
  {
    id: 'streak_7',
    icon: '🔥',
    nameKey: 'ach_streak7',
    descKey: 'ach_streak7_desc',
    check: (p) => p.streak >= 7,
  },
  {
    id: 'xp_500',
    icon: '⭐',
    nameKey: 'ach_xp500',
    descKey: 'ach_xp500_desc',
    check: (p) => p.totalXP >= 500,
  },
  {
    id: 'xp_1500',
    icon: '🌟',
    nameKey: 'ach_xp1500',
    descKey: 'ach_xp1500_desc',
    check: (p) => p.totalXP >= 1500,
  },
  {
    id: 'words_20',
    icon: '📚',
    nameKey: 'ach_words20',
    descKey: 'ach_words20_desc',
    check: (p) => totalWordsLearned(p) >= 20,
  },
  {
    id: 'words_50',
    icon: '🧠',
    nameKey: 'ach_words50',
    descKey: 'ach_words50_desc',
    check: (p) => totalWordsLearned(p) >= 50,
  },
  {
    id: 'reach_basic',
    icon: '🥉',
    nameKey: 'ach_basic',
    descKey: 'ach_basic_desc',
    check: (p) => anyLanguageReached(p, 'basic'),
  },
  {
    id: 'reach_advanced',
    icon: '🥇',
    nameKey: 'ach_advanced',
    descKey: 'ach_advanced_desc',
    check: (p) => anyLanguageReached(p, 'advanced'),
  },
  {
    id: 'trophies_5',
    icon: '🏆',
    nameKey: 'ach_trophies5',
    descKey: 'ach_trophies5_desc',
    check: (p) => p.trophies >= 5,
  },
  {
    id: 'maze_master',
    icon: '👾',
    nameKey: 'ach_maze_master',
    descKey: 'ach_maze_master_desc',
    check: (p) => (p.bestScores.maze ?? 0) >= 30,
  },
  {
    id: 'space_ace',
    icon: '🚀',
    nameKey: 'ach_space_ace',
    descKey: 'ach_space_ace_desc',
    check: (p) => (p.bestScores.space_race ?? 0) >= 40,
  },
  {
    id: 'sharp_shooter',
    icon: '🏹',
    nameKey: 'ach_sharp_shooter',
    descKey: 'ach_sharp_shooter_desc',
    check: (p) => (p.bestScores.target_hit ?? 0) >= 20,
  },
]
