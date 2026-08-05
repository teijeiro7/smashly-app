/**
 * Centralized SEO configuration for Smashly.
 * Edit site metadata, brand info, social handles and OG defaults here.
 */

export const SITE_URL = 'https://smashly-app.es';

export const SITE = {
  name: 'Smashly',
  shortName: 'Smashly',
  tagline: 'Encuentra tu Pala de Pádel Perfecta',
  description:
    'Smashly es el comparador de palas de pádel con IA más completo. Analiza más de 800 modelos, compara precios en tiempo real y descubre la pala ideal para tu nivel y estilo de juego.',
  shortDescription: 'Comparador de palas de pádel con IA. +800 modelos, precios en tiempo real.',
  locale: 'es_ES',
  language: 'es',
  // Brand colors used in OG image and theme
  themeColor: '#16a34a',
  backgroundColor: '#ffffff',
  // Brand identity
  foundingDate: '2025',
  founder: 'Cristian Teijeiro',
  // Contact & social
  twitter: '@smashly_app',
  twitterSiteId: '', // Optional numeric ID
  facebookAppId: '',
  // Default OG image (1200x630 PNG recommended)
  ogImage: `${SITE_URL}/images/og/smashly-og-1200x630.png`,
  ogImageAlt: 'Smashly — Comparador de palas de pádel con IA. Encuentra la pala perfecta.',
  logo: `${SITE_URL}/images/icons/smashly-icon.png`,
  favicon: '/images/icons/smashly-icon.png',
  appleTouchIcon: '/icons/apple-touch-icon.png',
  // Verification
  googleSiteVerification: '', // Add the meta tag value from Google Search Console
  bingSiteVerification: '',
  // Locale-aware defaults
  defaultOgType: 'website',
  twitterCard: 'summary_large_image',
} as const;

export const KEYWORDS = {
  primary: [
    'padel',
    'pádel',
    'palas de padel',
    'comparador palas padel',
    'pala de pádel',
    'mejores palas padel',
  ],
  secondary: [
    'smashly',
    'comparador padel',
    'racket padel',
    'palas pádel baratas',
    'palas pádel ofertas',
    'palas pádel por nivel',
    'palas pádel para principiantes',
    'palas pádel avanzadas',
    'comprar pala padel',
  ],
  longtail: [
    'cómo elegir pala de pádel',
    'qué pala de pádel comprar',
    'comparar palas de pádel online',
    'recomendador de palas de pádel con IA',
    'palas de pádel por forma',
    'palas de pádel por balance',
  ],
} as const;

export interface RouteEntry {
  /** Exact pathname, or (when `dynamic`) a prefix like '/palas/'. */
  match: string;
  /** true = prefix match (startsWith); false/undefined = exact match. */
  dynamic?: boolean;
  indexable: boolean;
}

/**
 * Single source of truth for which paths search engines should see \u2014
 * consumed by both /middleware.ts (noindex header) and
 * scripts/generate-sitemap.mjs (which URLs to submit). Order matters:
 * first match wins, so a specific exact path must be listed before a
 * dynamic prefix that would otherwise swallow it (e.g. '/store/dashboard'
 * before '/store/', since both start with '/store').
 */
export const ROUTES: RouteEntry[] = [
  { match: '/', indexable: true },
  { match: '/catalog', indexable: true },
  { match: '/palas/', dynamic: true, indexable: true },
  { match: '/racket-detail', indexable: false },
  { match: '/best-racket', indexable: true },
  { match: '/compare-rackets', indexable: true },
  { match: '/compare', indexable: true },
  { match: '/compare/', dynamic: true, indexable: false },
  { match: '/shared/', dynamic: true, indexable: true },
  { match: '/faq', indexable: true },
  { match: '/terms-and-conditions', indexable: true },
  { match: '/privacy-policy', indexable: true },
  { match: '/forgot-password', indexable: false },
  { match: '/update-password', indexable: false },
  { match: '/store/dashboard', indexable: false },
  { match: '/store/', dynamic: true, indexable: true },
  { match: '/dashboard', indexable: false },
  { match: '/messages', indexable: false },
  { match: '/comparisons', indexable: false },
  { match: '/profile', indexable: false },
  { match: '/lists/', dynamic: true, indexable: false },
  { match: '/admin', indexable: false },
  { match: '/admin/', dynamic: true, indexable: false },
  { match: '/error', indexable: false },
];

/** Unknown paths (typos, the 404 splat) default to non-indexable. */
export function isIndexable(pathname: string): boolean {
  for (const r of ROUTES) {
    if (r.dynamic ? pathname.startsWith(r.match) : pathname === r.match) {
      return r.indexable;
    }
  }
  return false;
}

export const buildUrl = (path: string): string => {
  if (!path || path === '/') return SITE_URL;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
};

export const allKeywords = [...KEYWORDS.primary, ...KEYWORDS.secondary, ...KEYWORDS.longtail].join(
  ', '
);

/**
 * Type-safe SEO payload for the <SEO /> component.
 */
export interface SeoPayload {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  keywords?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  nofollow?: boolean;
  alternateLanguages?: Record<string, string>;
  /** Extra meta tags to add (e.g., price, availability) */
  extraMeta?: Array<{ name?: string; property?: string; content: string }>;
  /** Extra link tags (e.g., prev/next) */
  extraLink?: Array<{ rel: string; href: string; hreflang?: string }>;
}
