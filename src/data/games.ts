import type { GameDef, LangCode } from '../types'

export const FUN_GAMES: GameDef[] = [
  { id: 'memory', category: 'fun', icon: '🧠', color: 'from-candy-400 to-grape-400', nameKey: 'game_memory_name', descKey: 'game_memory_desc' },
  { id: 'catch_stars', category: 'fun', icon: '🎯', color: 'from-sunny-400 to-candy-400', nameKey: 'game_catch_stars_name', descKey: 'game_catch_stars_desc', isNew: true },
  { id: 'balloon_pop', category: 'fun', icon: '🎈', color: 'from-sky-400 to-grape-400', nameKey: 'game_balloon_pop_name', descKey: 'game_balloon_pop_desc' },
]

export const LANGUAGE_GAMES: GameDef[] = [
  { id: 'word_image', category: 'language', icon: '🖼️', color: 'from-grass-400 to-sky-400', nameKey: 'game_word_image_name', descKey: 'game_word_image_desc' },
  {
    id: 'listening',
    category: 'language',
    icon: '🎧',
    color: 'from-grape-400 to-candy-400',
    nameKey: 'game_listening_name',
    descKey: 'game_listening_desc',
    isNew: true,
    // Arabic text-to-speech voices are unreliable across browsers/OSes,
    // so the game is hidden for Arabic until that's solved.
    excludeLangs: ['ar'],
  },
  { id: 'vocab_quiz', category: 'language', icon: '🎯', color: 'from-sunny-400 to-grass-400', nameKey: 'game_vocab_quiz_name', descKey: 'game_vocab_quiz_desc' },
  { id: 'sentence_scramble', category: 'language', icon: '🔀', color: 'from-sky-400 to-grass-400', nameKey: 'game_sentence_scramble_name', descKey: 'game_sentence_scramble_desc' },
  { id: 'word_memory', category: 'language', icon: '🎴', color: 'from-candy-400 to-sunny-400', nameKey: 'game_word_memory_name', descKey: 'game_word_memory_desc' },
]

export const ALL_GAMES: GameDef[] = [...FUN_GAMES, ...LANGUAGE_GAMES]

export function getGameById(id: string) {
  return ALL_GAMES.find((g) => g.id === id)
}

export function isGameAvailableForLang(game: GameDef, lang: LangCode) {
  return !game.excludeLangs?.includes(lang)
}

export function languageGamesFor(lang: LangCode) {
  return LANGUAGE_GAMES.filter((g) => isGameAvailableForLang(g, lang))
}
