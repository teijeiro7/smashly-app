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
  shortDescription:
    'Comparador de palas de pádel con IA. +800 modelos, precios en tiempo real.',
  locale: 'es_ES',
  alternateLocale: 'en_ES',
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
  ogImageAlt:
    'Smashly — Comparador de palas de pádel con IA. Encuentra la pala perfecta.',
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

export const ROUTES = {
  home: '/',
  catalog: '/catalog',
  bestRacket: '/best-racket',
  compare: '/compare',
  compareRackets: '/compare-rackets',
  faq: '/faq',
  terms: '/terms-and-conditions',
  privacy: '/privacy-policy',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
} as const;

export type RouteKey = keyof typeof ROUTES;

export const buildUrl = (path: string): string => {
  if (!path || path === '/') return SITE_URL;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
};

export const buildCatalogUrl = (params?: {
  brand?: string;
  shape?: string;
  level?: string;
  search?: string;
}): string => {
  const url = new URL(buildUrl('/catalog'));
  if (params?.brand) url.searchParams.set('brand', params.brand);
  if (params?.shape) url.searchParams.set('shape', params.shape);
  if (params?.level) url.searchParams.set('level', params.level);
  if (params?.search) url.searchParams.set('q', params.search);
  return url.toString();
};

export const buildRacketUrl = (racket: { id?: number; nombre: string }): string => {
  const slug = slugify(racket.nombre);
  return buildUrl(`/racket-detail?id=${racket.id ?? ''}&name=${encodeURIComponent(slug)}`);
};

export const slugify = (text: string): string =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

export const allKeywords = [...KEYWORDS.primary, ...KEYWORDS.secondary, ...KEYWORDS.longtail].join(', ');

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
