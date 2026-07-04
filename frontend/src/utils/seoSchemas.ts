/**
 * JSON-LD schema builders for Smashly.
 * Returns plain objects ready to be JSON.stringify'd inside
 * <script type="application/ld+json"> tags.
 *
 * Reference: https://schema.org/ and Google Search Central docs.
 */
/* eslint-disable @typescript-eslint/naming-convention */
// JSON-LD requires @-prefixed keys (@type, @id, @context) as defined by the
// schema.org spec — these cannot follow camelCase naming rules.

import { SITE, SITE_URL, buildUrl } from '../config/seo';
import type { Racket } from '../types/racket';

const ORG_ID = `${SITE_URL}#organization`;
const WEBSITE_ID = `${SITE_URL}#website`;

/** Base Organization schema referenced from every page. */
export const organizationSchema = () => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE.name,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: SITE.logo,
    width: 512,
    height: 512,
  },
  description: SITE.description,
  foundingDate: SITE.foundingDate,
  founder: {
    '@type': 'Person',
    name: SITE.founder,
  },
  sameAs: [
    // Add real social profiles when available
    'https://www.linkedin.com/company/smashly-ai',
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: buildUrl('/faq'),
      availableLanguage: ['Spanish', 'English'],
    },
  ],
});

/** WebSite schema with SearchAction (enables sitelinks searchbox). */
export const websiteSchema = () => ({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: SITE_URL,
  name: SITE.name,
  alternateName: SITE.shortName,
  description: SITE.description,
  inLanguage: SITE.locale,
  publisher: { '@id': ORG_ID },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/catalog?q={search_term_string}`,
    },
    // Required by Google
    'query-input': 'required name=search_term_string',
  },
});

/** SoftwareApplication schema for the homepage. */
export const softwareAppSchema = () => ({
  '@type': 'SoftwareApplication',
  name: SITE.name,
  applicationCategory: 'SportsApplication',
  applicationSubCategory: 'SportsEquipmentComparator',
  operatingSystem: 'Web, iOS, Android',
  description: SITE.description,
  url: SITE_URL,
  image: SITE.ogImage,
  screenshot: SITE.ogImage,
  author: { '@id': ORG_ID },
  publisher: { '@id': ORG_ID },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '128',
    bestRating: '5',
    worstRating: '1',
  },
  featureList: [
    'Comparador de palas de pádel',
    'Recomendador con IA',
    'Precios en tiempo real',
    'Más de 800 modelos',
    'Filtros por marca, forma, balance y nivel',
  ],
});

/** Generic WebPage schema used as a base for non-special pages. */
export const webPageSchema = (opts: {
  name: string;
  description: string;
  url: string;
  image?: string;
}) => ({
  '@type': 'WebPage',
  '@id': `${opts.url}#webpage`,
  url: opts.url,
  name: opts.name,
  description: opts.description,
  isPartOf: { '@id': WEBSITE_ID },
  inLanguage: SITE.locale,
  image: opts.image ?? SITE.ogImage,
  primaryImageOfPage: {
    '@type': 'ImageObject',
    url: opts.image ?? SITE.ogImage,
  },
  publisher: { '@id': ORG_ID },
  datePublished: '2025-01-01',
  dateModified: new Date().toISOString().slice(0, 10),
});

/** BreadcrumbList for navigation chains in SERPs. */
export const breadcrumbSchema = (
  items: Array<{ name: string; url: string }>
) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: item.name,
    item: item.url,
  })),
});

/** ItemList schema for the catalog page (top products). */
export const catalogItemListSchema = (
  rackets: Racket[],
  catalogUrl: string
) => {
  const list = rackets
    .filter(r => r.id !== undefined)
    .slice(0, 25)
    .map((r, idx) => {
      const url = buildUrl(
        `/racket-detail?id=${r.id}&name=${encodeURIComponent(r.nombre)}`
      );
      return {
        '@type': 'ListItem',
        position: idx + 1,
        url,
        name: r.nombre,
        image: r.imagenes?.[0],
      };
    });

  return {
    '@type': 'ItemList',
    '@id': `${catalogUrl}#itemlist`,
    name: 'Catálogo de palas de pádel',
    description:
      'Lista de las mejores palas de pádel analizadas por Smashly. Compara especificaciones, precios y reseñas.',
    numberOfItems: list.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: list,
  };
};

/** Product schema for individual racket detail pages. */
export const productSchema = (racket: Racket, url: string) => {
  const image = racket.imagenes?.[0] ?? SITE.ogImage;
  const offers: any[] = [];
  const stores = [
    { key: 'padelnuestro', label: 'PadelNuestro' },
    { key: 'padelmarket', label: 'PadelMarket' },
    { key: 'padelproshop', label: 'PadelProShop' },
  ] as const;

  for (const store of stores) {
    const price = (racket as any)[`${store.key}_precio_actual`];
    const link = (racket as any)[`${store.key}_enlace`];
    if (price && link) {
      offers.push({
        '@type': 'Offer',
        url: link,
        price: Number(price).toFixed(2),
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: store.label,
        },
      });
    }
  }

  const minPrice = offers.length
    ? Math.min(...offers.map(o => parseFloat(o.price)))
    : undefined;
  const maxPrice = offers.length
    ? Math.max(...offers.map(o => parseFloat(o.price)))
    : undefined;

  const product: any = {
    '@type': 'Product',
    '@id': url,
    name: racket.nombre,
    image: racket.imagenes?.length ? racket.imagenes : [image],
    description:
      racket.descripcion ??
      `Pala de pádel ${racket.marca} ${racket.modelo}. Compara precios y características en Smashly.`,
    brand: {
      '@type': 'Brand',
      name: racket.marca,
    },
    category: 'Palas de pádel',
    sku: racket.id?.toString(),
    mpn: racket.modelo,
    url,
  };

  if (offers.length === 1) {
    product.offers = offers[0];
  } else if (offers.length > 1) {
    product.offers = {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: minPrice?.toFixed(2),
      highPrice: maxPrice?.toFixed(2),
      offerCount: offers.length,
      offers,
    };
  }

  return product;
};

/** FAQPage schema. Items: { question: string, answer: string }. */
export const faqSchema = (items: Array<{ question: string; answer: string }>) => ({
  '@type': 'FAQPage',
  mainEntity: items.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
});
