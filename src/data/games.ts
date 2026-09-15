import type { GameDef, LangCode, LearningSubcategory } from '../types'

/**
 * `FUN_GAMES`/`LANGUAGE_GAMES`/`STORY_GAMES` are organized by their EXISTING
 * technical routing needs (generic /play/:id vs. lang+level params vs. the
 * standalone stories reader) - that grouping predates, and is orthogonal
 * to, the site's two-main-category structure below. Every game's `section`
 * (+ `learningSubcategory` where relevant) is a single field on its one
 * GameDef, so `gamesBySection()`/`learningGamesBySubcategory()` filter the
 * existing arrays instead of needing a duplicated, hand-maintained list per
 * category page - adding a game to either main category going forward is
 * one field on its existing entry, not a new list to update.
 */
export const FUN_GAMES: GameDef[] = [
  { id: 'memory', category: 'fun', section: 'fun', icon: '🧠', color: 'from-candy-400 to-grape-400', nameKey: 'game_memory_name', descKey: 'game_memory_desc' },
  { id: 'catch_stars', category: 'fun', section: 'fun', icon: '🎯', color: 'from-sunny-400 to-candy-400', nameKey: 'game_catch_stars_name', descKey: 'game_catch_stars_desc', isNew: true },
  { id: 'balloon_pop', category: 'fun', section: 'fun', icon: '🎈', color: 'from-sky-400 to-grape-400', nameKey: 'game_balloon_pop_name', descKey: 'game_balloon_pop_desc' },
  { id: 'maze', category: 'fun', section: 'fun', icon: '👾', color: 'from-grape-500 to-candy-500', nameKey: 'game_maze_name', descKey: 'game_maze_desc', isNew: true },
  { id: 'space_race', category: 'fun', section: 'fun', icon: '🚀', color: 'from-ink to-grape-600', nameKey: 'game_space_race_name', descKey: 'game_space_race_desc', isNew: true },
  { id: 'target_hit', category: 'fun', section: 'fun', icon: '🏹', color: 'from-candy-500 to-sunny-500', nameKey: 'game_target_hit_name', descKey: 'game_target_hit_desc', isNew: true },
  {
    id: 'hebrew_memory',
    category: 'fun',
    section: 'learning',
    learningSubcategory: 'language',
    icon: '🔤',
    color: 'from-candy-400 to-sky-400',
    nameKey: 'game_hebrew_memory_name',
    descKey: 'game_hebrew_memory_desc',
    isNew: true,
  },
  { id: 'math_addition_subtraction', category: 'fun', section: 'learning', learningSubcategory: 'math', icon: '🧮', color: 'from-grass-500 to-sky-500', nameKey: 'game_math_name', descKey: 'game_math_desc', isNew: true },
  { id: 'multiplication_division', category: 'fun', section: 'learning', learningSubcategory: 'math', icon: '✖️', color: 'from-sky-500 to-grape-500', nameKey: 'game_muldiv_name', descKey: 'game_muldiv_desc', isNew: true },
  { id: 'multiplication_table', category: 'fun', section: 'learning', learningSubcategory: 'math', icon: '🔢', color: 'from-candy-500 to-grape-500', nameKey: 'game_multable_name', descKey: 'game_multable_desc', isNew: true },
  { id: 'sudoku', category: 'fun', section: 'learning', learningSubcategory: 'logic', icon: '🧩', color: 'from-ink to-sky-600', nameKey: 'game_sudoku_name', descKey: 'game_sudoku_desc', isNew: true },
  { id: 'game_2048', category: 'fun', section: 'fun', icon: '🔢', color: 'from-sunny-500 to-candy-500', nameKey: 'game_2048_name', descKey: 'game_2048_desc', isNew: true },
  { id: 'number_sequence', category: 'fun', section: 'learning', learningSubcategory: 'logic', icon: '🔢', color: 'from-grass-500 to-grape-500', nameKey: 'game_sequence_name', descKey: 'game_sequence_desc', isNew: true },
  { id: 'odd_one_out', category: 'fun', section: 'learning', learningSubcategory: 'logic', icon: '❓', color: 'from-candy-400 to-sunny-400', nameKey: 'game_oddoneout_name', descKey: 'game_oddoneout_desc', isNew: true },
  { id: 'numbers_game', category: 'fun', section: 'learning', learningSubcategory: 'math', icon: '🔢', color: 'from-sky-500 to-grass-500', nameKey: 'game_numbers_name', descKey: 'game_numbers_desc', isNew: true },
  { id: 'fractions', category: 'fun', section: 'learning', learningSubcategory: 'math', icon: '🍕', color: 'from-candy-500 to-sunny-500', nameKey: 'game_fractions_name', descKey: 'game_fractions_desc', isNew: true },
  { id: 'clock_time', category: 'fun', section: 'learning', learningSubcategory: 'math', icon: '🕐', color: 'from-grape-500 to-sky-500', nameKey: 'game_clock_name', descKey: 'game_clock_desc', isNew: true },
  { id: 'money_shopping', category: 'fun', section: 'learning', learningSubcategory: 'math', icon: '💰', color: 'from-grass-500 to-sunny-500', nameKey: 'game_money_name', descKey: 'game_money_desc', isNew: true },
  { id: 'geometry', category: 'fun', section: 'learning', learningSubcategory: 'math', icon: '📐', color: 'from-ink to-grape-500', nameKey: 'game_geometry_name', descKey: 'game_geometry_desc', isNew: true },
  { id: 'word_problems', category: 'fun', section: 'learning', learningSubcategory: 'math', icon: '📖', color: 'from-sunny-500 to-grass-500', nameKey: 'game_wordproblems_name', descKey: 'game_wordproblems_desc', isNew: true },
  { id: 'logic_riddles', category: 'fun', section: 'learning', learningSubcategory: 'logic', icon: '🧠', color: 'from-candy-500 to-grape-500', nameKey: 'game_riddles_name', descKey: 'game_riddles_desc', isNew: true },
  { id: 'car_racing', category: 'fun', section: 'fun', icon: '🏎️', color: 'from-candy-500 to-sunny-500', nameKey: 'game_car_racing_name', descKey: 'game_car_racing_desc', isNew: true },
  { id: 'endless_runner', category: 'fun', section: 'fun', icon: '🏃', color: 'from-grass-500 to-sky-500', nameKey: 'game_endless_runner_name', descKey: 'game_endless_runner_desc', isNew: true },
  { id: 'ninja_runner', category: 'fun', section: 'fun', icon: '🥷', color: 'from-ink to-candy-600', nameKey: 'game_ninja_runner_name', descKey: 'game_ninja_runner_desc', isNew: true },
  { id: 'treasure_hunt', category: 'fun', section: 'fun', icon: '🗺️', color: 'from-sunny-600 to-grass-600', nameKey: 'game_treasure_hunt_name', descKey: 'game_treasure_hunt_desc', isNew: true },
  { id: 'maze_escape', category: 'fun', section: 'fun', icon: '🌀', color: 'from-grape-600 to-sky-600', nameKey: 'game_maze_escape_name', descKey: 'game_maze_escape_desc', isNew: true },
  { id: 'feed_the_fish', category: 'fun', section: 'fun', icon: '🐟', color: 'from-sky-500 to-grass-400', nameKey: 'game_feed_fish_name', descKey: 'game_feed_fish_desc', isNew: true },
  { id: 'money_grab', category: 'fun', section: 'fun', icon: '💰', color: 'from-sunny-500 to-grass-600', nameKey: 'game_money_grab_name', descKey: 'game_money_grab_desc', isNew: true },
  { id: 'card_war', category: 'fun', section: 'fun', icon: '🃏', color: 'from-ink to-grape-700', nameKey: 'game_card_war_name', descKey: 'game_card_war_desc', isNew: true },
  { id: 'sixty_second_challenge', category: 'fun', section: 'fun', icon: '⏱️', color: 'from-candy-600 to-sunny-500', nameKey: 'game_sixty_challenge_name', descKey: 'game_sixty_challenge_desc', isNew: true },
  { id: 'soccer', category: 'fun', section: 'fun', icon: '⚽', color: 'from-grass-600 to-sky-600', nameKey: 'game_soccer_name', descKey: 'game_soccer_desc', isNew: true },
]

export const LANGUAGE_GAMES: GameDef[] = [
  { id: 'word_image', category: 'language', section: 'learning', learningSubcategory: 'language', icon: '🖼️', color: 'from-grass-400 to-sky-400', nameKey: 'game_word_image_name', descKey: 'game_word_image_desc' },
  {
    id: 'listening',
    category: 'language',
    section: 'learning',
    learningSubcategory: 'language',
    icon: '🎧',
    color: 'from-grape-400 to-candy-400',
    nameKey: 'game_listening_name',
    descKey: 'game_listening_desc',
    isNew: true,
  },
  { id: 'vocab_quiz', category: 'language', section: 'learning', learningSubcategory: 'language', icon: '🎯', color: 'from-sunny-400 to-grass-400', nameKey: 'game_vocab_quiz_name', descKey: 'game_vocab_quiz_desc' },
  { id: 'sentence_scramble', category: 'language', section: 'learning', learningSubcategory: 'language', icon: '🔀', color: 'from-sky-400 to-grass-400', nameKey: 'game_sentence_scramble_name', descKey: 'game_sentence_scramble_desc' },
  { id: 'word_memory', category: 'language', section: 'learning', learningSubcategory: 'language', icon: '🎴', color: 'from-candy-400 to-sunny-400', nameKey: 'game_word_memory_name', descKey: 'game_word_memory_desc' },
  {
    id: 'vocab_academy',
    category: 'language',
    section: 'learning',
    learningSubcategory: 'language',
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
    section: 'learning',
    learningSubcategory: 'language',
    icon: '🇮🇱',
    color: 'from-sunny-500 via-candy-500 to-grape-600',
    nameKey: 'game_stories_academy_he_name',
    descKey: 'game_stories_academy_he_desc',
    isNew: true,
  },
  {
    id: 'stories_academy',
    category: 'language',
    section: 'learning',
    learningSubcategory: 'language',
    icon: '🇬🇧',
    color: 'from-sunny-500 via-candy-500 to-grape-600',
    nameKey: 'game_stories_academy_name',
    descKey: 'game_stories_academy_desc',
    isNew: true,
  },
  {
    id: 'stories_academy_es',
    category: 'language',
    section: 'learning',
    learningSubcategory: 'language',
    icon: '🇪🇸',
    color: 'from-sunny-500 via-candy-500 to-grape-600',
    nameKey: 'game_stories_academy_es_name',
    descKey: 'game_stories_academy_es_desc',
    isNew: true,
  },
]

export const ALL_GAMES: GameDef[] = [...FUN_GAMES, ...LANGUAGE_GAMES]

/** Every game across every array, for search/filter UI - includes Stories too (unlike ALL_GAMES, which deliberately excludes them since they don't use the generic /play/:id route). */
export const EVERY_GAME: GameDef[] = [...FUN_GAMES, ...LANGUAGE_GAMES, ...STORY_GAMES]

export function getGameById(id: string) {
  return ALL_GAMES.find((g) => g.id === id)
}

export function isGameAvailableForLang(game: GameDef, lang: LangCode) {
  return !game.excludeLangs?.includes(lang)
}

export function languageGamesFor(lang: LangCode) {
  return LANGUAGE_GAMES.filter((g) => isGameAvailableForLang(g, lang))
}

/** The 🎮 "משחקים בשביל הכיף" page's game list - every game tagged for the fun section, wherever its GameDef happens to live. */
export function funGames(): GameDef[] {
  return FUN_GAMES.filter((g) => g.section === 'fun')
}

/** One learning sub-area's games (🧮 חשבון / 🧠 חשיבה ולוגיקה) - 🌍 לומדים שפות is deliberately not served from here, since it already has its own dedicated hub at /learn-languages. */
export function learningGamesBySubcategory(sub: Exclude<LearningSubcategory, 'language'>): GameDef[] {
  return FUN_GAMES.filter((g) => g.section === 'learning' && g.learningSubcategory === sub)
}
