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

function pickVoice(voices: SpeechSynthesisVoice[], bcp47: string): SpeechSynthesisVoice | undefined {
  const lower = bcp47.toLowerCase()
  const exact = voices.find((v) => v.lang.toLowerCase() === lower)
  if (exact) return exact
  const langPrefix = lower.split('-')[0]
  return voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix))
}

export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const speak = useCallback(
    (text: string, lang: LangCode, onDone?: () => void) => {
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
          utter.rate = 0.85
          utter.pitch = 1.05
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
