import { createDefaultVocabProgress, type VocabProgressState } from './types'

const STORAGE_KEY = 'navon-mishakim-vocab-academy-v1'

/**
 * The one persistence boundary the rest of the vocabulary academy talks to.
 * A future version that syncs to a real account/server just swaps this
 * implementation - nothing in the games, UI, or progress logic changes.
 */
export interface VocabProgressStore {
  load(): VocabProgressState
  save(state: VocabProgressState): void
}

export const localStorageVocabStore: VocabProgressStore = {
  load() {
    const fallback = createDefaultVocabProgress()
    if (typeof window === 'undefined') return fallback
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return fallback
      const parsed = JSON.parse(raw)
      // Shallow-merge over defaults so new fields added later (e.g. a future
      // `coins`) don't crash on an older saved blob - same pattern as the
      // site's own useProgress() store.
      return { ...fallback, ...parsed, wordStats: { ...(parsed.wordStats ?? {}) } }
    } catch {
      return fallback
    }
  },
  save(state) {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage unavailable (private browsing, quota) - progress just won't persist this session.
    }
  },
}
