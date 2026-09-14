import { Link } from 'react-router-dom'
import { SITE_URL } from '../seo/config'

export interface BreadcrumbItem {
  label: string
  /** Omit on the last (current-page) item - it renders as plain text, not a link. */
  href?: string
}

/**
 * Visible breadcrumb trail + matching BreadcrumbList structured data. Every
 * deep page (a specific game, a language area, a specific story) renders
 * one of these so both users and Google understand where the page sits in
 * the site - real internal links, not JSON-LD alone.
 */
export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  }

  return (
    <nav aria-label="פירורי לחם" className="mb-4 text-xs font-bold text-ink/50">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {item.href ? (
              <Link to={item.href} className="underline decoration-dotted hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink/70" aria-current="page">
                {item.label}
              </span>
            )}
            {i < items.length - 1 && <span aria-hidden="true">‹</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
