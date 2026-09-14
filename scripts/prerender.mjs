// Bakes the real, fully-rendered <head> (title/meta/canonical/OG/Twitter/
// JSON-LD) and initial DOM into a static index.html per public route, under
// dist/<route>/index.html. This is what makes link previews on WhatsApp/
// Facebook/Twitter actually work and gives non-JS crawlers real content:
// those clients fetch raw HTML and never run JavaScript, so the tags
// SEOHead sets at runtime (via useEffect) are otherwise invisible to them.
// A real user's browser still boots the normal SPA from the same file - the
// original bootstrap <script> tag survives untouched in the captured HTML,
// React just re-renders over the prerendered markup on load.
import { chromium } from 'playwright'
import { preview } from 'vite'
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getAllRoutes } from './lib/getAllRoutes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PORT = 5302

async function main() {
  const routes = await getAllRoutes()

  const server = await preview({ root: ROOT, preview: { port: PORT, strictPort: true } })
  const base = `http://localhost:${PORT}`

  const browser = await chromium.launch()
  const page = await browser.newPage()

  let ok = 0
  for (const route of routes) {
    const url = base + route.path
    try {
      await page.goto(url, { waitUntil: 'load' })
      // Wait for SEOHead's effect to stamp the canonical tag for THIS
      // route specifically - a reliable, route-agnostic "content is ready"
      // signal regardless of how deep the lazy-loaded chunk chain is.
      await page.waitForFunction(
        (expectedPath) => {
          const href = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
          return href.endsWith(expectedPath) || (expectedPath === '/' && href.endsWith('.il/'))
        },
        route.path,
        { timeout: 8000 }
      )
      const html = '<!doctype html>\n' + (await page.content())

      const outDir = route.path === '/' ? path.join(ROOT, 'dist') : path.join(ROOT, 'dist', route.path.replace(/^\//, ''))
      mkdirSync(outDir, { recursive: true })
      writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8')
      ok++
    } catch (e) {
      console.warn(`  skipped ${route.path}: ${e.message.split('\n')[0]}`)
    }
  }

  await browser.close()
  await server.httpServer.close()

  console.log(`Prerendered ${ok}/${routes.length} routes.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
