// Shared by generate-sitemap.mjs and prerender.mjs so the two never drift
// out of sync with each other or with which stories actually exist.
import { build } from 'esbuild'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

export const LANG_SLUGS = ['hebrew', 'english', 'spanish']

export const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/games', priority: '0.9', changefreq: 'weekly' },
  { path: '/games/learning', priority: '0.9', changefreq: 'weekly' },
  { path: '/games/learning/math', priority: '0.8', changefreq: 'weekly' },
  { path: '/games/learning/logic', priority: '0.8', changefreq: 'weekly' },
  { path: '/games/math', priority: '0.8', changefreq: 'monthly' },
  { path: '/games/gtn', priority: '0.7', changefreq: 'monthly' },
  { path: '/games/vocab-academy', priority: '0.8', changefreq: 'monthly' },
  { path: '/learn-languages', priority: '0.9', changefreq: 'weekly' },
  { path: '/learn-languages/stories', priority: '0.8', changefreq: 'weekly' },
  ...LANG_SLUGS.map((slug) => ({ path: `/learn-languages/${slug}`, priority: '0.8', changefreq: 'monthly' })),
  ...LANG_SLUGS.map((slug) => ({ path: `/learn-languages/stories/${slug}`, priority: '0.7', changefreq: 'monthly' })),
  ...[
    'memory',
    'catch_stars',
    'balloon_pop',
    'maze',
    'space_race',
    'target_hit',
    'hebrew_memory',
    'multiplication_division',
    'multiplication_table',
    'sudoku',
    'game_2048',
    'number_sequence',
    'odd_one_out',
    'numbers_game',
    'fractions',
    'clock_time',
    'money_shopping',
    'geometry',
    'word_problems',
    'logic_riddles',
  ].map((id) => ({
    path: `/play/${id}`,
    priority: '0.6',
    changefreq: 'monthly',
  })),
  ...['word_image', 'listening', 'vocab_quiz', 'sentence_scramble', 'word_memory'].map((id) => ({
    path: `/play/${id}`,
    priority: '0.6',
    changefreq: 'monthly',
  })),
]

export async function loadStories() {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'navon-routes-'))
  const outfile = path.join(tmpDir, 'stories-bundle.mjs')
  await build({
    entryPoints: [path.join(ROOT, 'src/vocab/data/stories/index.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
  })
  const mod = await import('file://' + outfile)
  return mod.ALL_STORIES
}

/** Every public route, as flat path strings - `{path, priority, changefreq}` for the static ones, dynamic story routes appended with sensible defaults. */
export async function getAllRoutes() {
  const stories = await loadStories()
  const langSlugFor = { he: 'hebrew', en: 'english', es: 'spanish' }
  const storyRoutes = stories.map((s) => ({
    path: `/learn-languages/stories/${langSlugFor[s.language]}/${s.id}`,
    priority: '0.6',
    changefreq: 'monthly',
  }))
  return [...STATIC_ROUTES, ...storyRoutes]
}
