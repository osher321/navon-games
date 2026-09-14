import { useEffect } from 'react'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from './config'

interface SEOHeadProps {
  /** Full page title, already including the site name where appropriate. */
  title: string
  description: string
  /** Site-relative path (e.g. "/games/math"), used to build canonical + og:url. */
  path: string
  /** Site-relative image path; defaults to the site-wide share image. */
  ogImage?: string
  ogType?: 'website' | 'article'
  /** One or more JSON-LD objects to embed as structured data for this page. */
  jsonLd?: object | object[]
  /** Only for pages that intentionally shouldn't be indexed (e.g. a personal dashboard). */
  noindex?: boolean
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLinkTag(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * This app is a 100%-client-rendered SPA with no server, so there is no
 * request-time HTML to inject tags into - instead each route mounts this
 * component, which writes title/meta/canonical/OG/Twitter/JSON-LD directly
 * onto `document.head` as soon as it renders. Googlebot executes JS and
 * waits for the page to settle before indexing, so it sees these tags; a
 * separate build-time prerender step (scripts/prerender.mjs) captures the
 * same fully-rendered head for crawlers/link-preview bots that don't run
 * JavaScript (see the SEO report for details).
 */
export default function SEOHead({ title, description, path, ogImage, ogType = 'website', jsonLd, noindex }: SEOHeadProps) {
  useEffect(() => {
    document.title = title
    setMetaTag('name', 'description', description)
    setMetaTag('name', 'robots', noindex ? 'noindex, follow' : 'index, follow')

    const url = `${SITE_URL}${path}`
    setLinkTag('canonical', url)

    const image = `${SITE_URL}${ogImage ?? DEFAULT_OG_IMAGE}`
    setMetaTag('property', 'og:title', title)
    setMetaTag('property', 'og:description', description)
    setMetaTag('property', 'og:url', url)
    setMetaTag('property', 'og:type', ogType)
    setMetaTag('property', 'og:site_name', SITE_NAME)
    setMetaTag('property', 'og:image', image)
    setMetaTag('property', 'og:locale', 'he_IL')

    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', title)
    setMetaTag('name', 'twitter:description', description)
    setMetaTag('name', 'twitter:image', image)

    const existingJsonLd = document.getElementById('seo-jsonld')
    if (existingJsonLd) existingJsonLd.remove()
    if (jsonLd) {
      const script = document.createElement('script')
      script.id = 'seo-jsonld'
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }
  }, [title, description, path, ogImage, ogType, jsonLd, noindex])

  return null
}
