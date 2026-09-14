// Generates dist/sitemap.xml after `vite build`. Route list comes from
// scripts/lib/getAllRoutes.mjs, shared with prerender.mjs.
import { writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getAllRoutes } from './lib/getAllRoutes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SITE_URL = 'https://navon-games.co.il'

function xmlEscape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function main() {
  const routes = await getAllRoutes()
  const today = new Date().toISOString().slice(0, 10)

  const body = routes
    .map(
      (r) =>
        `  <url>\n    <loc>${xmlEscape(SITE_URL + r.path)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`

  writeFileSync(path.join(ROOT, 'dist', 'sitemap.xml'), xml, 'utf-8')
  console.log(`sitemap.xml written with ${routes.length} URLs.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
