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
    // `onDone` fires once the utterance ends (or errors/is unsupported) -
    // this is what lets a 🔊 button switch back from its "playing" state
    // without guessing at a fixed duration.
    speak: (text: string, onDone?: () => void) => speak(text, 'en', onDone),
    canSpeak: supported && canSpeak('en'),
  }
}
