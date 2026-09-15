import { useCallback, useEffect, useRef, useState } from 'react'
import { useSpeech } from '../../../hooks/useSpeech'
import type { LangCode } from '../../../types'

export const NARRATION_SPEEDS = [0.6, 0.75, 1] as const
export type NarrationSpeed = (typeof NARRATION_SPEEDS)[number]
export const DEFAULT_NARRATION_SPEED: NarrationSpeed = 0.75

const RATE_STORAGE_KEY = 'navon-mishakim-story-narration-rate'
const STUDY_MODE_STORAGE_KEY = 'navon-mishakim-story-study-mode'

function loadStoredRate(): NarrationSpeed {
  if (typeof window === 'undefined') return DEFAULT_NARRATION_SPEED
  const n = Number(window.localStorage.getItem(RATE_STORAGE_KEY))
  return (NARRATION_SPEEDS as readonly number[]).includes(n) ? (n as NarrationSpeed) : DEFAULT_NARRATION_SPEED
}

function loadStoredStudyMode(): boolean {
  if (typeof window === 'undefined') return true
  const raw = window.localStorage.getItem(STUDY_MODE_STORAGE_KEY)
  return raw === null ? true : raw === '1'
}

/**
 * Sentence-by-sentence narration for a story: play/pause/stop/prev/next,
 * a persisted user-adjustable speed, and which sentence is "active" right
 * now for the reader to highlight. Built on top of the site's shared
 * `useSpeech()` primitive (one SpeechSynthesisUtterance at a time) rather
 * than a parallel TTS system - this only adds sequencing/highlight state.
 *
 * True pause/resume of an in-flight SpeechSynthesisUtterance is unreliable
 * across browsers (Chrome in particular can silently fail to resume after
 * being paused for more than ~15s), so "pause" here simply stops speaking
 * while remembering the current sentence - `play()` resumes by re-speaking
 * that same sentence rather than the whole story from the top.
 */
export function useStoryNarration(lines: string[], lang: LangCode) {
  const { speak, supported } = useSpeech()
  const [rate, setRateState] = useState<NarrationSpeed>(loadStoredRate)
  const [studyMode, setStudyModeState] = useState<boolean>(loadStoredStudyMode)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const rateRef = useRef(rate)
  rateRef.current = rate
  // Bumped every time playback is stopped/superseded so a `speak()` onDone
  // callback that fires after that point (a stray callback from an
  // utterance that was cancelled mid-flight) can recognize it's stale and
  // do nothing instead of auto-advancing a sequence that's no longer live.
  const sequenceRef = useRef(0)

  const setRate = useCallback((r: NarrationSpeed) => {
    setRateState(r)
    try {
      window.localStorage.setItem(RATE_STORAGE_KEY, String(r))
    } catch {
      // localStorage unavailable (private mode etc.) - the preference just won't persist this session
    }
  }, [])

  const setStudyMode = useCallback((on: boolean) => {
    setStudyModeState(on)
    try {
      window.localStorage.setItem(STUDY_MODE_STORAGE_KEY, on ? '1' : '0')
    } catch {
      // ignore
    }
  }, [])

  /** Stops speaking but keeps the current sentence remembered/highlighted, ready to resume from the same spot via play(). */
  const pause = useCallback(() => {
    sequenceRef.current++
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    setIsPlaying(false)
  }, [])

  /** Full stop: stops speaking AND clears the highlighted sentence - the next play() starts from the beginning. */
  const stop = useCallback(() => {
    pause()
    setActiveIndex(null)
  }, [pause])

  const playFrom = useCallback(
    (index: number) => {
      if (!supported || index < 0 || index >= lines.length) {
        stop()
        return
      }
      sequenceRef.current++
      const mySeq = sequenceRef.current
      setActiveIndex(index)
      setIsPlaying(true)
      speak(
        lines[index],
        lang,
        () => {
          if (sequenceRef.current !== mySeq) return
          if (index + 1 < lines.length) playFrom(index + 1)
          else {
            setIsPlaying(false)
            setActiveIndex(null)
          }
        },
        { rate: rateRef.current }
      )
    },
    [lines, lang, speak, stop, supported]
  )

  const play = useCallback(() => playFrom(activeIndex ?? 0), [playFrom, activeIndex])
  const next = useCallback(() => playFrom((activeIndex ?? -1) + 1), [playFrom, activeIndex])
  const prev = useCallback(() => playFrom(Math.max(0, (activeIndex ?? 0) - 1)), [playFrom, activeIndex])
  const replaySentence = playFrom

  // Stop narration whenever the story itself changes (navigating to a
  // different story) and on unmount (leaving the reader entirely) - audio
  // must never keep going after the story it belongs to is gone.
  useEffect(() => stop, [lines, stop])

  return {
    supported,
    rate,
    setRate,
    studyMode,
    setStudyMode,
    activeIndex,
    isPlaying,
    play,
    pause,
    stop,
    next,
    prev,
    replaySentence,
  }
}
