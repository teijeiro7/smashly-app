import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  SITE,
  SITE_URL,
  buildUrl,
  type SeoPayload,
} from '../../config/seo';

interface SEOProps extends SeoPayload {
  /** JSON-LD schema objects (will be stringified into <script type="application/ld+json">) */
  schema?: object | object[];
  /** Optional children to render after the meta tags (rarely needed) */
  children?: React.ReactNode;
}

/**
 * Centralized <SEO /> component.
 * Renders title, description, canonical, OpenGraph, Twitter Card and JSON-LD.
 *
 * It MUST be rendered inside a <HelmetProvider /> (see src/main.tsx).
 *
 * Use <SEO /> at the top of every page that wants custom metadata.
 */
const SEO: React.FC<SEOProps> = ({
  title,
  description = SITE.description,
  canonical,
  image = SITE.ogImage,
  imageAlt = SITE.ogImageAlt,
  type = SITE.defaultOgType,
  keywords,
  author = SITE.name,
  publishedTime,
  modifiedTime,
  noindex = false,
  nofollow = false,
  alternateLanguages,
  extraMeta = [],
  extraLink = [],
  schema,
  children,
}) => {
  const fullTitle = title
    ? title.includes(SITE.name)
      ? title
      : `${title} | ${SITE.name}`
    : `${SITE.tagline} | ${SITE.name}`;

  const canonicalUrl = canonical
    ? canonical.startsWith('http')
      ? canonical
      : buildUrl(canonical)
    : typeof window !== 'undefined' && window.location
      ? window.location.origin + window.location.pathname
      : SITE_URL;

  const robotsContent = `${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'},max-image-preview:large,max-snippet:-1`;

  // Normalize schema to an array
  const schemaArray = Array.isArray(schema) ? schema : schema ? [schema] : [];

  return (
    <Helmet prioritizeSeoTags>
      {/* Basic */}
      <html lang={SITE.language} />
      <title>{fullTitle}</title>
      <meta name='description' content={description} />
      {keywords && <meta name='keywords' content={keywords} />}
      <meta name='author' content={author} />
      <meta name='robots' content={robotsContent} />
      <meta name='googlebot' content={robotsContent} />
      {SITE.googleSiteVerification && (
        <meta
          name='google-site-verification'
          content={SITE.googleSiteVerification}
        />
      )}
      {SITE.bingSiteVerification && (
        <meta name='msvalidate.01' content={SITE.bingSiteVerification} />
      )}

      {/* Canonical */}
      <link rel='canonical' href={canonicalUrl} />

      {/* Alternate languages */}
      {alternateLanguages &&
        Object.entries(alternateLanguages).map(([lang, href]) => (
          <link key={lang} rel='alternate' hrefLang={lang} href={href} />
        ))}

      {/* OpenGraph */}
      <meta property='og:site_name' content={SITE.name} />
      <meta property='og:locale' content={SITE.locale} />
      <meta property='og:locale:alternate' content={SITE.alternateLocale} />
      <meta property='og:type' content={type} />
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={description} />
      <meta property='og:url' content={canonicalUrl} />
      <meta property='og:image' content={image} />
      <meta property='og:image:secure_url' content={image} />
      <meta property='og:image:width' content='1200' />
      <meta property='og:image:height' content='630' />
      <meta property='og:image:alt' content={imageAlt} />
      <meta property='og:image:type' content='image/png' />

      {publishedTime && (
        <meta property='article:published_time' content={publishedTime} />
      )}
      {modifiedTime && (
        <meta property='article:modified_time' content={modifiedTime} />
      )}
      {type === 'article' && (
        <meta property='article:author' content={author} />
      )}

      {/* Twitter Card */}
      <meta name='twitter:card' content={SITE.twitterCard} />
      <meta name='twitter:site' content={SITE.twitter} />
      <meta name='twitter:creator' content={SITE.twitter} />
      <meta name='twitter:title' content={fullTitle} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={image} />
      <meta name='twitter:image:alt' content={imageAlt} />

      {/* Facebook App ID (optional, helps Insights) */}
      {SITE.facebookAppId && (
        <meta property='fb:app_id' content={SITE.facebookAppId} />
      )}

      {/* Extra meta (e.g., price, availability for products) */}
      {extraMeta.map((m, i) => (
        <meta
          key={`${m.name ?? m.property ?? 'extra'}-${i}`}
          name={m.name}
          property={m.property}
          content={m.content}
        />
      ))}

      {/* Extra link (e.g., prev/next) */}
      {extraLink.map((l, i) => (
        <link key={`${l.rel}-${i}`} rel={l.rel} href={l.href} hrefLang={l.hreflang} />
      ))}

      {/* JSON-LD structured data */}
      {schemaArray.map((s, i) => (
        <script
          key={`ld+json-${i}`}
          type='application/ld+json'
          // We pre-stringify to avoid React auto-escaping < and > in JSON.
          // Helmet's encodeSpecialCharacters would mangle JSON-LD by default,
          // but we use the raw string already.
          dangerouslySetInnerHTML={{ __html: stringifyJsonLd(s) }}
        />
      ))}

      {children}
    </Helmet>
  );
};

/**
 * Safely stringify JSON-LD, escaping the </ sequence to prevent
 * the script from being terminated prematurely by the HTML parser
 * (a classic XSS hardening pattern recommended by Google).
 */
const stringifyJsonLd = (data: object): string => {
  const json = JSON.stringify(data);
  return json.replace(/</g, '\\u003c');
};

export default SEO;
