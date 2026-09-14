import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'
import DifficultySelector from '../components/DifficultySelector'

type Difficulty = 'easy' | 'medium' | 'hard'
const DIFFICULTY_OPTIONS: { id: Difficulty; icon: string; label: string }[] = [
  { id: 'easy', icon: '🟢', label: 'קל' },
  { id: 'medium', icon: '🟡', label: 'בינוני' },
  { id: 'hard', icon: '🔴', label: 'קשה' },
]

interface Riddle {
  question: string
  choices: string[]
  answer: string
  explanation: string
}

/** 24 original riddles, 8 per difficulty - not translated or copied from anywhere, written for this game. */
const RIDDLES: Record<Difficulty, Riddle[]> = {
  easy: [
    { question: 'לדנה יש 3 אחים ואף אחות. כמה ילדים יש במשפחה, כולל דנה?', choices: ['3', '4', '5', '6'], answer: '4', explanation: 'דנה עצמה נספרת כילדה במשפחה, בנוסף לשלושת אחיה: 3+1=4.' },
    { question: 'מה כבד יותר: קילו נוצות או קילו ברזל?', choices: ['קילו נוצות', 'קילו ברזל', 'שניהם שווים', 'אי אפשר לדעת'], answer: 'שניהם שווים', explanation: 'קילוגרם הוא תמיד קילוגרם - לא משנה מאיזה חומר הוא עשוי.' },
    { question: 'לאיתן יש 5 כובעים בצבעים שונים. הוא לובש כובע אחר כל יום, בלי לחזור על צבע. כמה ימים ייקח לו ללבוש את כולם?', choices: ['3', '4', '5', '7'], answer: '5', explanation: 'יש לו 5 כובעים שונים, אז יידרשו לו 5 ימים כדי ללבוש את כולם פעם אחת.' },
    { question: 'איזה חודש בשנה הכי קצר?', choices: ['ינואר', 'פברואר', 'אפריל', 'יוני'], answer: 'פברואר', explanation: 'לפברואר יש רק 28 או 29 ימים, פחות מכל חודש אחר.' },
    { question: 'אם היום יום שלישי, איזה יום יהיה בעוד 3 ימים?', choices: ['חמישי', 'שישי', 'שבת', 'ראשון'], answer: 'שישי', explanation: 'שלישי + 3 ימים = רביעי, חמישי, שישי.' },
    { question: 'לשולי יש 2 חתולים ו-3 כלבים. כמה רגליים יש לכל בעלי החיים שלה ביחד?', choices: ['16', '18', '20', '22'], answer: '20', explanation: 'לכל חיה 4 רגליים: 5 חיות × 4 = 20.' },
    { question: 'איזה יום בא אחרי יום שישי?', choices: ['חמישי', 'שבת', 'ראשון', 'שני'], answer: 'שבת', explanation: 'סדר הימים בשבוע הוא: ...חמישי, שישי, שבת, ראשון...' },
    { question: 'לכיתה יש 10 תלמידים, וחצי מהם בנים. כמה בנות בכיתה?', choices: ['3', '4', '5', '6'], answer: '5', explanation: 'חצי מ-10 הוא 5 בנים, ולכן גם 5 בנות.' },
  ],
  medium: [
    { question: 'שלוש חברות עומדות בתור: רות לפני דנה, ומיכל אחרי דנה. מי ראשונה בתור?', choices: ['רות', 'דנה', 'מיכל', 'אי אפשר לדעת'], answer: 'רות', explanation: 'הסדר הוא רות, דנה, מיכל - כי רות לפני דנה ומיכל אחרי דנה.' },
    { question: 'יש לי 10 שקלים. קניתי עיפרון ב-3 שקלים ומחק ב-2 שקלים. כמה כסף נשאר לי?', choices: ['4', '5', '6', '7'], answer: '5', explanation: '10 - 3 - 2 = 5.' },
    { question: 'איזה מספר לא שייך לקבוצה: 2, 4, 6, 9, 8?', choices: ['2', '6', '8', '9'], answer: '9', explanation: '2, 4, 6, 8 הם מספרים זוגיים, ואילו 9 הוא אי-זוגי.' },
    { question: 'לתומר יש תיבה עם 12 עפרונות. הוא נותן שליש מהם לחברו. כמה עפרונות נשארו לתומר?', choices: ['4', '6', '8', '9'], answer: '8', explanation: 'שליש מ-12 הוא 4, ולכן נשארו לו 12-4=8.' },
    { question: 'אם A גדול מ-B, ו-B גדול מ-C, מי הכי קטן מבין השלושה?', choices: ['A', 'B', 'C', 'אי אפשר לדעת'], answer: 'C', explanation: 'לפי הסדר A > B > C, כלומר C הוא הקטן ביותר.' },
    { question: 'בכיתה יש 20 תלמידים בסך הכל, ויש יותר בנים מבנות. כמה בנים יכולים להיות?', choices: ['8', '9', '10', '12'], answer: '12', explanation: 'אם יש 12 בנים, אז יש 8 בנות - וזה אכן יותר בנים מבנות. באפשרויות האחרות אין רוב לבנים.' },
    { question: 'כמה קודקודים (פינות) יש למשולש?', choices: ['2', '3', '4', '5'], answer: '3', explanation: 'משולש בנוי משלוש צלעות ושלוש פינות.' },
    { question: 'מה ההמשך ההגיוני של הרצף: 1, 1, 2, 3, 5, ?', choices: ['6', '7', '8', '9'], answer: '8', explanation: 'כל מספר ברצף הוא סכום שני המספרים שלפניו: 3+5=8.' },
  ],
  hard: [
    { question: 'שלושה חברים חילקו 90 שקלים ביניהם בשווה. כמה כסף קיבל כל אחד?', choices: ['25', '30', '35', '45'], answer: '30', explanation: '90 חלקי 3 חברים שווה 30 שקלים לכל אחד.' },
    { question: 'לי יש 4 תרנגולות, וכל תרנגולת מטילה ביצה אחת ליום. כמה ביצים אקבל אחרי 3 ימים?', choices: ['7', '9', '12', '15'], answer: '12', explanation: '4 תרנגולות × 3 ימים = 12 ביצים.' },
    { question: 'כל החתולים הם בעלי חיים, וכל בעלי החיים נושמים. האם נכון לומר שכל החתולים נושמים?', choices: ['כן', 'לא', 'אי אפשר לדעת', 'רק חלק מהם'], answer: 'כן', explanation: 'אם כל חתול הוא בעל חיים, וכל בעל חיים נושם - אז בהכרח כל חתול נושם.' },
    { question: 'בקבוצה של 5 ילדים, לילד עם הכי הרבה סוכריות יש 12, ולילד עם הכי מעט יש 3. מה ההפרש ביניהם?', choices: ['7', '8', '9', '10'], answer: '9', explanation: '12 פחות 3 שווה 9.' },
    { question: 'אם מחרתיים יהיה יום ראשון, איזה יום הוא היום?', choices: ['חמישי', 'שישי', 'שבת', 'ראשון'], answer: 'שישי', explanation: 'אם מחרתיים ראשון, אז מחר שבת, והיום שישי.' },
    { question: 'יש לי 8 מטבעות של 5 ושל 10 שקלים, ששווים ביחד 60 שקלים. כמה מטבעות של 10 יש לי?', choices: ['2', '3', '4', '5'], answer: '4', explanation: '4 מטבעות של 10 (=40) ועוד 4 מטבעות של 5 (=20) נותנים 60 שקלים ב-8 מטבעות בדיוק.' },
    { question: 'מהי הצורה הבאה ברצף: עיגול, ריבוע, עיגול, ריבוע, עיגול, ?', choices: ['עיגול', 'ריבוע', 'משולש', 'מחומש'], answer: 'ריבוע', explanation: 'הרצף מתחלף בין עיגול לריבוע לסירוגין, אז אחרי עיגול מגיע ריבוע.' },
    { question: 'בספרייה יש פי 3 ספרי מדע ממספר ספרי הסיפורים, וביחד יש 40 ספרים. כמה ספרי סיפורים יש?', choices: ['8', '10', '12', '15'], answer: '10', explanation: 'אם יש x ספרי סיפורים ו-3x ספרי מדע, אז x+3x=40, כלומר 4x=40 ו-x=10.' },
  ],
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function LogicRiddlesGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [order, setOrder] = useState<Riddle[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  const start = (d: Difficulty) => {
    setDifficulty(d)
    setOrder(shuffle(RIDDLES[d]))
    setQIndex(0)
    setCorrect(0)
    setSelected(null)
  }

  const riddle = order[qIndex]

  const handleAnswer = (choice: string) => {
    if (!riddle || selected !== null) return
    setSelected(choice)
    const isCorrect = choice === riddle.answer
    const nextCorrect = isCorrect ? correct + 1 : correct
    if (isCorrect) {
      setCorrect(nextCorrect)
      play('correct')
    } else {
      play('wrong')
    }
    window.setTimeout(() => {
      if (qIndex + 1 >= order.length) {
        onFinish({ correct: nextCorrect, total: order.length })
      } else {
        setQIndex((i) => i + 1)
        setSelected(null)
      }
    }, 2200)
  }

  if (!difficulty) {
    return <DifficultySelector title="🧠 חידות היגיון" subtitle="בחרו רמת קושי" options={DIFFICULTY_OPTIONS} onSelect={start} />
  }
  if (!riddle) return null

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-3 flex items-center justify-between px-2 font-fun font-extrabold">
        <span className="rounded-full bg-grass-100 px-3 py-1 text-grass-600">
          {tr('score')}: {correct}
        </span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">
          {qIndex + 1} / {order.length}
        </span>
      </div>

      <div className="rounded-blob bg-white p-6 text-center shadow-pop card-outline">
        <p className="font-fun text-lg font-extrabold leading-relaxed text-ink">{riddle.question}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {riddle.choices.map((c) => {
          const showState = selected !== null
          const isAnswer = c === riddle.answer
          const isSelectedWrong = selected === c && !isAnswer
          return (
            <motion.button
              key={c}
              whileTap={{ scale: 0.95 }}
              disabled={selected !== null}
              onClick={() => handleAnswer(c)}
              className={`rounded-xl2 px-3 py-4 font-fun text-base font-extrabold shadow-card card-outline btn-pressable transition-colors ${
                showState && isAnswer ? 'bg-grass-500 text-white' : showState && isSelectedWrong ? 'bg-candy-500 text-white' : 'bg-white text-ink'
              }`}
            >
              {c}
            </motion.button>
          )
        })}
      </div>

      {selected && (
        <div className="mt-4 rounded-xl2 bg-sky-50 p-4 text-center">
          <p className="text-sm font-bold text-sky-700">💡 {riddle.explanation}</p>
        </div>
      )}
    </div>
  )
}
