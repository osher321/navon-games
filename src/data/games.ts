import type { GameDef, LangCode } from '../types'

export const FUN_GAMES: GameDef[] = [
  { id: 'memory', category: 'fun', icon: '🧠', color: 'from-candy-400 to-grape-400', nameKey: 'game_memory_name', descKey: 'game_memory_desc' },
  { id: 'catch_stars', category: 'fun', icon: '🎯', color: 'from-sunny-400 to-candy-400', nameKey: 'game_catch_stars_name', descKey: 'game_catch_stars_desc', isNew: true },
  { id: 'balloon_pop', category: 'fun', icon: '🎈', color: 'from-sky-400 to-grape-400', nameKey: 'game_balloon_pop_name', descKey: 'game_balloon_pop_desc' },
  { id: 'maze', category: 'fun', icon: '👾', color: 'from-grape-500 to-candy-500', nameKey: 'game_maze_name', descKey: 'game_maze_desc', isNew: true },
  { id: 'space_race', category: 'fun', icon: '🚀', color: 'from-ink to-grape-600', nameKey: 'game_space_race_name', descKey: 'game_space_race_desc', isNew: true },
  { id: 'target_hit', category: 'fun', icon: '🏹', color: 'from-candy-500 to-sunny-500', nameKey: 'game_target_hit_name', descKey: 'game_target_hit_desc', isNew: true },
  { id: 'hebrew_memory', category: 'fun', icon: '🔤', color: 'from-candy-400 to-sky-400', nameKey: 'game_hebrew_memory_name', descKey: 'game_hebrew_memory_desc', isNew: true },
  { id: 'math_addition_subtraction', category: 'fun', icon: '🧮', color: 'from-grass-500 to-sky-500', nameKey: 'game_math_name', descKey: 'game_math_desc', isNew: true },
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
  },
  { id: 'vocab_quiz', category: 'language', icon: '🎯', color: 'from-sunny-400 to-grass-400', nameKey: 'game_vocab_quiz_name', descKey: 'game_vocab_quiz_desc' },
  { id: 'sentence_scramble', category: 'language', icon: '🔀', color: 'from-sky-400 to-grass-400', nameKey: 'game_sentence_scramble_name', descKey: 'game_sentence_scramble_desc' },
  { id: 'word_memory', category: 'language', icon: '🎴', color: 'from-candy-400 to-sunny-400', nameKey: 'game_word_memory_name', descKey: 'game_word_memory_desc' },
  {
    id: 'vocab_academy',
    category: 'language',
    icon: '🎓',
    color: 'from-sky-600 via-grape-600 to-ink',
    nameKey: 'game_vocab_academy_name',
    descKey: 'game_vocab_academy_desc',
    isNew: true,
    // This is specifically an English vocabulary curriculum (6 CEFR levels,
    // its own word bank) - it only makes sense to promote it while English
    // is the language the learner has selected.
    excludeLangs: ['he', 'es'],
  },
]

// The Stories feature (📖 סיפורים) is its own top-level area inside
// "לומדים שפות" - a sibling of the language selector/game grid, not one of
// its filtered entries - so it's a separate array, always shown in full
// (all 3 language cards, regardless of which language is currently
// selected up top) rather than being gated by `excludeLangs`. Not included
// in ALL_GAMES either: these routes aren't generic `/play/:gameId` games
// (they open the dedicated stories reader via a query param), so surfacing
// them through Home's "popular"/"new"/"recommended" grids - which link
// through the generic route - would produce a broken link.
export const STORY_GAMES: GameDef[] = [
  {
    id: 'stories_academy_he',
    category: 'language',
    icon: '🇮🇱',
    color: 'from-sunny-500 via-candy-500 to-grape-600',
    nameKey: 'game_stories_academy_he_name',
    descKey: 'game_stories_academy_he_desc',
    isNew: true,
  },
  {
    id: 'stories_academy',
    category: 'language',
    icon: '🇬🇧',
    color: 'from-sunny-500 via-candy-500 to-grape-600',
    nameKey: 'game_stories_academy_name',
    descKey: 'game_stories_academy_desc',
    isNew: true,
  },
  {
    id: 'stories_academy_es',
    category: 'language',
    icon: '🇪🇸',
    color: 'from-sunny-500 via-candy-500 to-grape-600',
    nameKey: 'game_stories_academy_es_name',
    descKey: 'game_stories_academy_es_desc',
    isNew: true,
  },
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
