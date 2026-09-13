/** Every XP rule in one editable place. */
export const XP_RULES = {
  correctAnswer: 10,
  comboBonusEvery: 5,
  comboBonus: 25,
  gameComplete: 50,
  levelComplete: 200,
  dailyStreakBonus: 20,
  /** Speed Challenge answers are worth more than a normal round's - the whole point of the mode is rewarding fast, accurate answers. */
  speedChallengeAnswer: 15,
} as const
