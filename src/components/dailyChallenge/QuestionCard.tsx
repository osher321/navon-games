import type { Question } from '../../data/dailyChallenge/types'
import ChoiceQuestionCard from './ChoiceQuestionCard'
import SpellingQuestionCard from './SpellingQuestionCard'
import ScrambleQuestionCard from './ScrambleQuestionCard'

export default function QuestionCard({ question, onAnswer }: { question: Question; onAnswer: (correct: boolean) => void }) {
  if (question.kind === 'spelling') return <SpellingQuestionCard question={question} onAnswer={onAnswer} />
  if (question.kind === 'scramble') return <ScrambleQuestionCard question={question} onAnswer={onAnswer} />
  return <ChoiceQuestionCard question={question} onAnswer={onAnswer} />
}
