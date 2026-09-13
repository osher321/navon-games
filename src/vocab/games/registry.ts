import type { ComponentType } from 'react'
import type { VocabGameProps } from './types'
import MultipleChoiceGame from './MultipleChoiceGame'
import WordMatchGame from './WordMatchGame'
import FillBlankGame from './FillBlankGame'
import ListeningGame from './ListeningGame'
import SpellingGame from './SpellingGame'
import SpeedChallengeGame from './SpeedChallengeGame'

export type GameTypeId = 'multiple_choice' | 'word_match' | 'fill_blank' | 'listening' | 'spelling' | 'speed_challenge'

export interface GameTypeDef {
  id: GameTypeId
  icon: string
  title: string
  subtitleHe: string
  component: ComponentType<VocabGameProps>
}

/** The whole "which games exist" list - adding a 7th game type later is one more entry here, no changes anywhere else. */
export const GAME_TYPES: GameTypeDef[] = [
  { id: 'multiple_choice', icon: '🧠', title: 'Multiple Choice', subtitleHe: 'בחרו את התרגום הנכון', component: MultipleChoiceGame },
  { id: 'word_match', icon: '🔗', title: 'Word Match', subtitleHe: 'התאימו אנגלית לעברית', component: WordMatchGame },
  { id: 'fill_blank', icon: '✍️', title: 'Fill in the Blank', subtitleHe: 'השלימו את המילה החסרה', component: FillBlankGame },
  { id: 'listening', icon: '🔊', title: 'Listening', subtitleHe: 'הקשיבו ובחרו', component: ListeningGame },
  { id: 'spelling', icon: '✏️', title: 'Spelling', subtitleHe: 'הקלידו את המילה באנגלית', component: SpellingGame },
  { id: 'speed_challenge', icon: '⚡', title: 'Speed Challenge', subtitleHe: 'ענו מהר על כמה שיותר שאלות', component: SpeedChallengeGame },
]

export function getGameType(id: GameTypeId): GameTypeDef {
  return GAME_TYPES.find((g) => g.id === id) ?? GAME_TYPES[0]
}

export const SESSION_SIZE = 10
