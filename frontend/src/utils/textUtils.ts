/**
 * Text utility functions for formatting racket names, brands, models, and general text.
 */

/* eslint-disable @typescript-eslint/naming-convention */
// Known brand casing overrides (key: lowercase brand name, value: properly formatted brand name)
const BRAND_CASING_MAP: Record<string, string> = {
  nox: 'NOX',
  starvie: 'StarVie',
  'star vie': 'StarVie',
  dropshot: 'Drop Shot',
  'drop shot': 'Drop Shot',
  blackcrown: 'Black Crown',
  'black crown': 'Black Crown',
  royalpadel: 'Royal Padel',
  'royal padel': 'Royal Padel',
  oxdog: 'Oxdog',
  siux: 'Siux',
  kuikma: 'Kuikma',
  babolat: 'Babolat',
  bullpadel: 'Bullpadel',
  adidas: 'Adidas',
  head: 'Head',
  varlion: 'Varlion',
  wilson: 'Wilson',
  dunlop: 'Dunlop',
  slazenger: 'Slazenger',
  prince: 'Prince',
  völkl: 'Völkl',
  volkl: 'Völkl',
  lok: 'LOK',
  tactical: 'Tactical',
  'tactical padel': 'Tactical Padel',
};

// Word / spec token uppercase/casing overrides (key: lowercase token, value: formatted token)
const SPEC_TOKEN_MAP: Record<string, string> = {
  nox: 'NOX',
  ctrl: 'CTRL',
  pro: 'PRO',
  hrd: 'HRD',
  'hrd+': 'HRD+',
  ltd: 'LTD',
  wpt: 'WPT',
  at10: 'AT10',
  ml10: 'ML10',
  jp10: 'JP10',
  vk10: 'VK10',
  la10: 'LA10',
  st2: 'ST2',
  st3: 'ST3',
  v2: 'V2',
  v3: 'V3',
  v4: 'V4',
  v5: 'V5',
  cw: 'CW',
  fw: 'FW',
  sp: 'SP',
  mw: 'MW',
  xt: 'XT',
  pr: 'PR',
  tr: 'TR',
  gt: 'GT',
  sg: 'SG',
  pa: 'PA',
  st: 'ST',
  '3k': '3K',
  '12k': '12K',
  '18k': '18K',
  '24k': '24K',
  '15k': '15K',
  '6k': '6K',
};
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Formats a single word or token according to padel equipment naming conventions.
 */
const formatWordToken = (word: string): string => {
  if (!word) return '';
  const lower = word.toLowerCase();

  // Exact match in spec token map
  if (SPEC_TOKEN_MAP[lower]) {
    return SPEC_TOKEN_MAP[lower];
  }

  // Handle patterns like carbon numbers: 3k, 12k, 18k, 24k
  if (/^\d+k$/i.test(word)) {
    return word.toUpperCase();
  }

  // Handle version tokens like v1.0, v2, v3
  if (/^v\d+(\.\d+)?$/i.test(word)) {
    return `V${word.slice(1)}`;
  }

  // Handle year tokens or pure numbers (leave as is)
  if (/^\d+$/.test(word)) {
    return word;
  }

  // Handle hyphenated words e.g. "hrd-plus" or words with special characters
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

/**
 * Formats a brand name cleanly.
 * @param brand - Raw brand string (e.g., "nox", "drop shot", "bullpadel")
 * @returns Formatted brand string (e.g., "NOX", "Drop Shot", "Bullpadel")
 */
export const formatBrandName = (brand?: string | null): string => {
  if (!brand || !brand.trim()) return '';
  const trimmed = brand.trim();
  const lower = trimmed.toLowerCase();

  if (BRAND_CASING_MAP[lower]) {
    return BRAND_CASING_MAP[lower];
  }

  // Split multi-word brands
  return trimmed
    .split(/\s+/)
    .map(word => BRAND_CASING_MAP[word.toLowerCase()] || formatWordToken(word))
    .join(' ');
};

/**
 * Formats a model string (or title) respecting padel model conventions.
 * @param str - Raw model or name string
 * @returns Title cased string with proper acronyms/spec formatting
 */
export const toTitleCase = (str?: string | null): string => {
  if (!str || !str.trim()) return '';

  return str
    .trim()
    .split(/\s+/)
    .map(word => {
      const lower = word.toLowerCase();
      if (BRAND_CASING_MAP[lower]) {
        return BRAND_CASING_MAP[lower];
      }
      return formatWordToken(word);
    })
    .join(' ');
};

/**
 * Alias / dedicated helper for model names.
 */
export const formatModelName = (model?: string | null): string => {
  return toTitleCase(model);
};

/**
 * Interface representing racket object properties for formatting.
 */
export interface RacketNameInput {
  marca?: string | null;
  brand?: string | null;
  modelo?: string | null;
  model?: string | null;
  nombre?: string | null;
  name?: string | null;
}

/**
 * Formats full racket name cleanly given a racket object or raw string.
 * Ensures the brand is not duplicated if already included in the name/model.
 */
export const formatRacketName = (racket?: RacketNameInput | string | null): string => {
  if (!racket) return '';
  if (typeof racket === 'string') {
    return toTitleCase(racket);
  }

  const brand = racket.marca || racket.brand || '';
  const model = racket.modelo || racket.model || '';
  const name = racket.nombre || racket.name || '';

  const formattedBrand = formatBrandName(brand);
  const formattedModel = formatModelName(model);

  if (formattedBrand && formattedModel) {
    if (formattedModel.toLowerCase().startsWith(formattedBrand.toLowerCase())) {
      return formattedModel;
    }
    return `${formattedBrand} ${formattedModel}`;
  }

  if (formattedModel) return formattedModel;

  if (formattedBrand && name) {
    const formattedName = toTitleCase(name);
    if (formattedName.toLowerCase().startsWith(formattedBrand.toLowerCase())) {
      return formattedName;
    }
    return `${formattedBrand} ${formattedName}`;
  }

  return toTitleCase(name);
};
