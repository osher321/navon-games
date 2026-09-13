import { useSpeech } from '../hooks/useSpeech'

/**
 * Thin, English-fixed wrapper over the site's shared `useSpeech()` hook -
 * the whole academy only ever needs to pronounce English words, so callers
 * get a plain `speak(text)` instead of repeating `speak(text, 'en')`
 * everywhere. If Web Speech API isn't available, `canSpeak` is false and
 * callers fall back to showing the written word instead of erroring.
 */
export function useVocabSpeech() {
  const { speak, supported, canSpeak } = useSpeech()
  return {
    speak: (text: string) => speak(text, 'en'),
    canSpeak: supported && canSpeak('en'),
  }
}
