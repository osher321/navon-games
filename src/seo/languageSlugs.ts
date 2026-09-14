import type { StoryLanguage } from '../vocab/data/stories/types'

/** URL-friendly English slugs for each learnable language, used in routes like /learn-languages/english and /learn-languages/stories/spanish. `StoryLanguage` ('he'|'en'|'es') is a subset of the site's wider `LangCode` ('he'|'en'|'ar'|'es'), so this is assignable anywhere a LangCode is expected too - Arabic was removed as a selectable/visible language everywhere, so it's never a valid slug target. */
export const SLUG_TO_LANG: Record<string, StoryLanguage> = { hebrew: 'he', english: 'en', spanish: 'es' }
export const LANG_TO_SLUG: Record<StoryLanguage, string> = { he: 'hebrew', en: 'english', es: 'spanish' }
export const LANG_LABEL_HE: Record<StoryLanguage, string> = { he: 'עברית', en: 'אנגלית', es: 'ספרדית' }
export const LANG_FLAG: Record<StoryLanguage, string> = { he: '🇮🇱', en: '🇬🇧', es: '🇪🇸' }
