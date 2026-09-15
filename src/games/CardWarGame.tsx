import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'

type Suit = '♠' | '♥' | '♦' | '♣'
interface Card {
  rank: number // 2-14 (11=J,12=Q,13=K,14=A)
  suit: Suit
}

const SUITS: Suit[] = ['♠', '♥', '♦', '♣']
const RANK_LABEL: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }
function rankLabel(rank: number) {
  return RANK_LABEL[rank] ?? String(rank)
}
function isRed(suit: Suit) {
  return suit === '♥' || suit === '♦'
}

function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) deck.push({ rank, suit })
  }
  return deck
}
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function PlayingCard({ card, faceDown, small }: { card?: Card; faceDown?: boolean; small?: boolean }) {
  const size = small ? 'h-14 w-10 text-xs' : 'h-28 w-20 text-lg sm:h-32 sm:w-24'
  if (faceDown || !card) {
    return (
      <div
        className={`grid ${size} place-items-center rounded-lg border-2 border-white bg-gradient-to-br from-grape-600 to-ink shadow-card`}
        aria-hidden="true"
      >
        <span className="text-xl opacity-70">🎴</span>
      </div>
    )
  }
  const red = isRed(card.suit)
  return (
    <div className={`relative grid ${size} place-items-center rounded-lg border-2 border-ink/10 bg-white shadow-card`}>
      <span className={`absolute top-1 left-1.5 font-fun font-extrabold ${red ? 'text-candy-600' : 'text-ink'} ${small ? 'text-[10px]' : 'text-sm'}`}>
        {rankLabel(card.rank)}
      </span>
      <span className={`${red ? 'text-candy-600' : 'text-ink'} ${small ? 'text-lg' : 'text-3xl'}`}>{card.suit}</span>
      <span className={`absolute bottom-1 right-1.5 rotate-180 font-fun font-extrabold ${red ? 'text-candy-600' : 'text-ink'} ${small ? 'text-[10px]' : 'text-sm'}`}>
        {rankLabel(card.rank)}
      </span>
    </div>
  )
}

export default function CardWarGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()

  const [phase, setPhase] = useState<'start' | 'playing' | 'over'>('start')
  const [playerPile, setPlayerPile] = useState<Card[]>([])
  const [cpuPile, setCpuPile] = useState<Card[]>([])
  const [playerCard, setPlayerCard] = useState<Card | null>(null)
  const [cpuCard, setCpuCard] = useState<Card | null>(null)
  const [warPot, setWarPot] = useState<Card[]>([])
  const [inWar, setInWar] = useState(false)
  const [round, setRound] = useState(0)
  const [roundsWon, setRoundsWon] = useState(0)
  const [message, setMessage] = useState('')
  const [drawing, setDrawing] = useState(false)

  const busyRef = useRef(false)
  const roundsPlayedRef = useRef(0)
  const roundsWonRef = useRef(0)
  const finishedRef = useRef(false)
  // The source of truth while a round (possibly multi-step, via War) is
  // resolving - state (playerPile/cpuPile) is only synced from these at the
  // end of each step, so the actual game logic never lives inside a setState
  // updater (which React may invoke more than once, e.g. under StrictMode).
  const pRef = useRef<Card[]>([])
  const cRef = useRef<Card[]>([])

  const startGame = () => {
    const deck = shuffle(buildDeck())
    pRef.current = deck.slice(0, 26)
    cRef.current = deck.slice(26)
    setPlayerPile(pRef.current)
    setCpuPile(cRef.current)
    setPlayerCard(null)
    setCpuCard(null)
    setWarPot([])
    setInWar(false)
    setRound(0)
    setRoundsWon(0)
    roundsPlayedRef.current = 0
    roundsWonRef.current = 0
    finishedRef.current = false
    busyRef.current = false
    setMessage('')
    setPhase('playing')
  }

  const finishGame = useCallback(
    (won: boolean) => {
      if (finishedRef.current) return
      finishedRef.current = true
      setPhase('over')
      setMessage(won ? '🏆 ניצחתם במלחמת הקלפים!' : tr('game_over'))
      play(won ? 'success' : 'wrong')
      onFinish({ correct: roundsWonRef.current, total: roundsPlayedRef.current || 1 })
    },
    [onFinish, play, tr]
  )

  const playRound = useCallback(() => {
    if (busyRef.current || finishedRef.current) return
    if (pRef.current.length === 0) {
      finishGame(false)
      return
    }
    if (cRef.current.length === 0) {
      finishGame(true)
      return
    }
    busyRef.current = true
    setDrawing(true)
    const pot: Card[] = []

    const settleWar = (playerWon: boolean, potCards: Card[]) => {
      roundsPlayedRef.current += 1
      setRound((r) => r + 1)
      if (playerWon) {
        roundsWonRef.current += 1
        setRoundsWon((r) => r + 1)
        setMessage('✅ ניצחתם בסיבוב!')
        play('correct')
        pRef.current = [...pRef.current, ...shuffle(potCards)]
      } else {
        setMessage('❌ המחשב ניצח בסיבוב')
        play('wrong')
        cRef.current = [...cRef.current, ...shuffle(potCards)]
      }
      setInWar(false)
      setWarPot([])
      setPlayerPile(pRef.current)
      setCpuPile(cRef.current)
      busyRef.current = false
      setDrawing(false)
      if (pRef.current.length === 0) window.setTimeout(() => finishGame(false), 300)
      else if (cRef.current.length === 0) window.setTimeout(() => finishGame(true), 300)
    }

    const resolveStep = () => {
      const pc = pRef.current[0]
      const cc = cRef.current[0]
      pot.push(pc, cc)
      pRef.current = pRef.current.slice(1)
      cRef.current = cRef.current.slice(1)
      setPlayerCard(pc)
      setCpuCard(cc)
      setWarPot(pot.slice(0, -2))
      play('click')

      window.setTimeout(() => {
        if (pc.rank === cc.rank) {
          // War: each side burns up to 3 cards face-down + 1 face-up decider
          if (pRef.current.length < 4 || cRef.current.length < 4) {
            // Not enough cards for a full war - decide by whoever has more left
            const playerWinsWar = pRef.current.length >= cRef.current.length
            pot.push(...pRef.current, ...cRef.current)
            pRef.current = []
            cRef.current = []
            settleWar(playerWinsWar, pot)
            return
          }
          setInWar(true)
          setMessage('⚔️ מלחמה!')
          pot.push(...pRef.current.slice(0, 3), ...cRef.current.slice(0, 3))
          pRef.current = pRef.current.slice(3)
          cRef.current = cRef.current.slice(3)
          window.setTimeout(resolveStep, 700)
          return
        }
        settleWar(pc.rank > cc.rank, pot)
      }, 550)
    }

    resolveStep()
  }, [finishGame, play])

  if (phase === 'start') {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h2 className="mb-1 font-fun text-xl font-extrabold text-grape-600">{tr('game_card_war_name')}</h2>
        <p className="mb-5 text-ink/50">{tr('game_card_war_desc')}</p>
        <button
          onClick={startGame}
          className="rounded-full bg-grape-500 px-8 py-3 font-fun text-lg font-extrabold text-white shadow-card btn-pressable"
        >
          ▶ {tr('common_start')}
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2 px-2 font-fun font-extrabold">
        <span className="rounded-full bg-sunny-100 px-3 py-1 text-sunny-600">{tr('score')}: {roundsWon}</span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">🔄 סיבוב {round}</span>
        <span className="rounded-full bg-grass-100 px-3 py-1 text-grass-600">🂠 {playerPile.length}</span>
        <span className="rounded-full bg-candy-100 px-3 py-1 text-candy-600">💻 {cpuPile.length}</span>
      </div>

      <div className="rounded-xl2 bg-gradient-to-br from-grass-700 to-grass-900 p-6 shadow-pop">
        <div className="mb-4 flex flex-col items-center gap-2">
          <p className="font-fun text-xs font-bold text-white/70">💻 המחשב</p>
          <div className="flex items-center gap-2">
            <PlayingCard faceDown small />
            <AnimatePresence mode="wait">
              <motion.div key={cpuCard ? `${cpuCard.rank}${cpuCard.suit}` : 'empty-c'} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <PlayingCard card={cpuCard ?? undefined} faceDown={!cpuCard} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="my-2 flex items-center justify-center gap-3">
          {inWar && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="rounded-full bg-candy-500 px-4 py-1.5 font-fun font-extrabold text-white shadow-card">
              ⚔️ מלחמה!
            </motion.span>
          )}
          {warPot.length > 0 && !inWar && <span className="text-sm text-white/70">🂠 בקופה: {warPot.length}</span>}
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              <motion.div key={playerCard ? `${playerCard.rank}${playerCard.suit}` : 'empty-p'} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <PlayingCard card={playerCard ?? undefined} faceDown={!playerCard} />
              </motion.div>
            </AnimatePresence>
            <PlayingCard faceDown small />
          </div>
          <p className="font-fun text-xs font-bold text-white/70">👤 אתם</p>
        </div>
      </div>

      {message && (
        <motion.p key={message} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-center font-fun font-extrabold text-ink">
          {message}
        </motion.p>
      )}

      {phase === 'playing' && (
        <div className="mt-4 text-center">
          <button
            onClick={playRound}
            disabled={drawing}
            className="rounded-full bg-candy-500 px-8 py-3 font-fun text-lg font-extrabold text-white shadow-card btn-pressable disabled:opacity-50"
          >
            🎴 שלפו קלף
          </button>
        </div>
      )}

      {phase === 'over' && (
        <div className="mt-4 text-center">
          <button onClick={startGame} className="rounded-full bg-grape-500 px-8 py-3 font-fun text-lg font-extrabold text-white shadow-card btn-pressable">
            🔄 {tr('play_again')}
          </button>
        </div>
      )}
    </div>
  )
}
