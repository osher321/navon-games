import { useCallback } from 'react'
import type { LangCode } from '../types'

const VOICE_LOCALE: Record<LangCode, string> = {
  he: 'he-IL',
  en: 'en-US',
  ar: 'ar-SA',
  es: 'es-ES',
}

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null

// Chrome (and others) populate the voice list asynchronously - calling
// speak() before it's ready is a common cause of silent no-ops, especially
// for languages served only by network/"Google" voices (Arabic on Windows
// Chrome is a frequent case) rather than a voice bundled with the OS.
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (voicesPromise) return voicesPromise
  voicesPromise = new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices()
    if (existing.length > 0) {
      resolve(existing)
      return
    }
    const onVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
        resolve(voices)
      }
    }
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)
    // Some browsers never fire voiceschanged - don't hang forever.
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
      resolve(window.speechSynthesis.getVoices())
    }, 1500)
  })
  return voicesPromise
}

// The Web Speech API exposes no gender field on SpeechSynthesisVoice, so
// preferring a female voice - without ever picking randomly or failing
// when none exists - means scoring by name against the well-known female
// voices bundled with the major platforms/browsers (Windows/macOS/iOS/
// Android/Chrome's Google voices), the standard cross-browser heuristic.
// Ties (nothing recognized either way) fall back to the browser's own
// voice order, so the same voice is picked every time, never at random.
const FEMALE_VOICE_HINTS = [
  'female',
  'woman',
  'zira',
  'samantha',
  'victoria',
  'karen',
  'moira',
  'tessa',
  'fiona',
  'susan',
  'allison',
  'ava',
  'serena',
  'kate',
  'salli',
  'joanna',
  'aria',
  'jenny',
  'libby',
  'sonia',
  'hazel',
  'helena',
  'monica',
  'mónica',
  'paulina',
  'conchita',
  'lucia',
  'lucía',
  'elena',
  'laura',
  'sabina',
  'elvira',
  'marisol',
  'carmit',
  'ivy',
]
const MALE_VOICE_HINTS = ['male', 'david', 'mark', 'alex', 'daniel', 'diego', 'jorge', 'pablo', 'fred', 'guy', 'ravi']

function femaleScore(name: string): number {
  const n = name.toLowerCase()
  if (FEMALE_VOICE_HINTS.some((h) => n.includes(h))) return 2
  if (MALE_VOICE_HINTS.some((h) => n.includes(h))) return 0
  return 1 // gender unknown from the name - neither ruled in nor out
}

function pickVoice(voices: SpeechSynthesisVoice[], bcp47: string): SpeechSynthesisVoice | undefined {
  const lower = bcp47.toLowerCase()
  const langPrefix = lower.split('-')[0]
  const exact = voices.filter((v) => v.lang.toLowerCase() === lower)
  const pool = exact.length > 0 ? exact : voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix))
  if (pool.length === 0) return undefined
  return pool.reduce((best, v) => (femaleScore(v.name) > femaleScore(best.name) ? v : best))
}

export interface SpeakOptions {
  /** 0.1-10, default 0.85 (games' quick pronunciation) - callers like the
      story reader pass their own slower, user-adjustable rate. */
  rate?: number
  pitch?: number
  /** 0-1, defaults to whatever the browser/utterance default is (1) when omitted. */
  volume?: number
}

export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const speak = useCallback(
    (text: string, lang: LangCode, onDone?: () => void, options?: SpeakOptions) => {
      if (!supported) {
        onDone?.()
        return
      }
      const bcp47 = VOICE_LOCALE[lang]
      window.speechSynthesis.cancel()
      loadVoices()
        .then((voices) => {
          const utter = new SpeechSynthesisUtterance(text)
          utter.lang = bcp47
          const voice = pickVoice(voices, bcp47)
          if (voice) utter.voice = voice
          utter.rate = options?.rate ?? 0.85
          utter.pitch = options?.pitch ?? 1.05
          if (options?.volume !== undefined) utter.volume = options.volume
          // `onDone` drives a UI's "now playing" state back to normal - fires
          // on natural end AND on error, so a callback is never left hanging
          // if the browser can't actually produce audio for this utterance.
          if (onDone) {
            utter.onend = onDone
            utter.onerror = onDone
          }
          window.speechSynthesis.speak(utter)
        })
        .catch(() => {
          // speech synthesis not available - fail silently
          onDone?.()
        })
    },
    [supported]
  )

  const canSpeak = useCallback(
    (lang: LangCode) => {
      if (!supported) return false
      const voices = window.speechSynthesis.getVoices()
      return !!pickVoice(voices, VOICE_LOCALE[lang])
    },
    [supported]
  )

  return { speak, supported, canSpeak }
}
