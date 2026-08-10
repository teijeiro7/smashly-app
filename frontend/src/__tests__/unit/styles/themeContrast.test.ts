import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { contrastRatio, blend } from '@/utils/contrast';

/* WCAG 2.2 AA contrast audit for the GlobalStyles design tokens.
   Unlike the previous version of this file, this one PARSES
   GlobalStyles.ts directly instead of copying hex literals by hand —
   so a future token edit is caught here instead of silently drifting
   from what's actually shipped. */

const AA_TEXT = 4.5; // WCAG 1.4.3 — normal text
const AA_UI = 3.0; // WCAG 1.4.11 — UI components / large text

const SOURCE_PATH = path.resolve(__dirname, '../../../styles/GlobalStyles.ts');
const source = readFileSync(SOURCE_PATH, 'utf-8');

/** Extract the body of the first `{...}` block whose opening matches `selectorRe`. */
function extractBlock(selectorRe: RegExp): string {
  const match = selectorRe.exec(source);
  if (!match) throw new Error(`Selector not found in GlobalStyles.ts: ${selectorRe}`);
  const start = match.index + match[0].length;
  let depth = 1;
  let i = start;
  while (depth > 0 && i < source.length) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }
  return source.slice(start, i - 1);
}

/** Parse `--token: value;` declarations directly inside a block (not nested ones). */
function parseTokens(block: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  const re = /--([a-z0-9-]+):\s*([^;]+);/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    tokens[`--${m[1]}`] = m[2].trim();
  }
  return tokens;
}

const light = parseTokens(extractBlock(/:root\s*\{/));
const dark = parseTokens(extractBlock(/html\[data-theme=['"]dark['"]\][^{]*\{/));

function req(tokens: Record<string, string>, name: string): string {
  const value = tokens[name];
  if (!value) throw new Error(`Token ${name} missing from parsed block`);
  return value;
}

/** Resolve an rgba()/rgb() token to an opaque hex by blending over a background. */
function resolveOverBg(value: string, bgHex: string): string {
  if (value.startsWith('#')) return value;
  const m = /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/.exec(value);
  if (!m) throw new Error(`Unsupported color value for contrast test: ${value}`);
  const [, r, g, b, a] = m;
  const hex = `#${[r, g, b].map(n => Number(n).toString(16).padStart(2, '0')).join('')}`;
  const alpha = a !== undefined ? Number(a) : 1;
  return alpha === 1 ? hex : blend(hex, bgHex, alpha);
}

const SURFACE_NAMES = ['--bg', '--surface', '--surface-2', '--surface-3'];

function surfacesOf(tokens: Record<string, string>): { name: string; hex: string }[] {
  return SURFACE_NAMES.map(name => ({ name, hex: req(tokens, name) }));
}

const lightSurfaces = surfacesOf(light);
const darkSurfaces = surfacesOf(dark);

// --- Text tokens vs page surfaces (4.5:1) --------------------------------

const TEXT_TOKENS = [
  '--text',
  '--text-muted',
  '--text-subtle',
  '--primary-text',
  '--success-text',
  '--warning-text',
  '--error-text',
  '--danger-text',
  '--info-text',
  '--accent-text',
];

describe.each([
  ['light', light, lightSurfaces],
  ['dark', dark, darkSurfaces],
] as const)('%s text tokens vs page surfaces (>= 4.5:1)', (_theme, tokens, surfaces) => {
  it.each(TEXT_TOKENS.flatMap(token => surfaces.map(s => [token, s] as const)))(
    '%s on %s',
    (token, surface) => {
      const fg = resolveOverBg(req(tokens, token), surface.hex);
      expect(contrastRatio(fg, surface.hex)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  );
});

// --- Foreground-on-fill tokens (--on-*) vs their solid fill (4.5:1) ------

const FILL_PAIRS = [
  ['--primary', '--on-primary'],
  ['--success', '--on-success'],
  ['--warning', '--on-warning'],
  ['--error', '--on-error'],
  ['--danger', '--on-danger'],
  ['--info', '--on-info'],
  ['--accent', '--on-accent'],
] as const;

describe.each([
  ['light', light],
  ['dark', dark],
] as const)('%s --on-* foreground vs solid fill (>= 4.5:1)', (_theme, tokens) => {
  it.each(FILL_PAIRS)('%s / %s', (fillToken, onToken) => {
    const fill = req(tokens, fillToken);
    const fg = resolveOverBg(req(tokens, onToken), fill);
    expect(contrastRatio(fg, fill)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

// --- --border-control vs page surfaces (3:1, WCAG 1.4.11) ----------------

describe.each([
  ['light', light, lightSurfaces],
  ['dark', dark, darkSurfaces],
] as const)('%s --border-control vs page surfaces (>= 3:1)', (_theme, tokens, surfaces) => {
  it.each(surfaces)('vs %s', surface => {
    const border = req(tokens, '--border-control');
    expect(contrastRatio(border, surface.hex)).toBeGreaterThanOrEqual(AA_UI);
  });
});

// --- Brand surfaces (fixed across themes) + on-brand tokens ---------------

const FIXED_BRAND_SURFACE_NAMES = [
  '--brand-surface',
  '--brand-surface-hover',
  '--brand-surface-strong',
  '--brand-surface-deep',
  '--surface-inverse',
];

const brandSurfaces = [
  ...FIXED_BRAND_SURFACE_NAMES.map(name => ({ name, hex: req(light, name) })),
  { name: 'light --header-bg', hex: req(light, '--header-bg') },
  { name: 'dark --header-bg', hex: req(dark, '--header-bg') },
  { name: 'light --footer-bg', hex: req(light, '--footer-bg') },
  { name: 'dark --footer-bg', hex: req(dark, '--footer-bg') },
];

describe('--on-brand vs brand/header/footer surfaces (>= 4.5:1)', () => {
  it.each(brandSurfaces)('on-brand on %s', surface => {
    const fg = req(light, '--on-brand');
    expect(contrastRatio(fg, surface.hex)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe('--on-brand-muted vs brand/header/footer surfaces (>= 3:1, large text/icons only)', () => {
  it.each(brandSurfaces)('on-brand-muted on %s', surface => {
    const fg = resolveOverBg(req(light, '--on-brand-muted'), surface.hex);
    expect(contrastRatio(fg, surface.hex)).toBeGreaterThanOrEqual(AA_UI);
  });
});

// --- Focus ring: bitone black/white, must clear 3:1 on EVERY surface -----

const allFocusSurfaces = [...lightSurfaces, ...darkSurfaces, ...brandSurfaces];

describe('bitone focus ring clears 3:1 against every surface in the app', () => {
  it.each(allFocusSurfaces)('%s', surface => {
    const ring = req(light, '--focus-ring');
    const halo = req(light, '--focus-ring-halo');
    const ringOk = contrastRatio(ring, surface.hex) >= AA_UI;
    const haloOk = contrastRatio(halo, surface.hex) >= AA_UI;
    expect(ringOk || haloOk).toBe(true);
  });
});

// --- Sync check: every color token declared in light also exists in dark -

// A handful of tokens are declared ONCE in :root because they're identical
// in both themes by design (fixed brand surfaces, the bitone focus ring) —
// the cascade means dark mode already sees them without a redeclaration.
const FIXED_ONLY_TOKENS = new Set([
  '--on-brand',
  '--on-brand-muted',
  '--focus-ring',
  '--focus-ring-halo',
  ...FIXED_BRAND_SURFACE_NAMES,
  '--brand-rgb',
  '--brand-on-surface',
  // Deliberately fixed white in both themes — see GlobalStyles.ts comment
  // on the racket-image tokens (product photos are white-background cutouts).
  '--racket-image-bg',
]);

const COLOR_VALUE_RE = /^(#[0-9a-f]{3,8}|rgba?\(.+\))$/i;

const lightColorTokens = Object.keys(light).filter(
  token => COLOR_VALUE_RE.test(light[token]) && !FIXED_ONLY_TOKENS.has(token)
);

describe('every themed color token declared in light also exists in dark', () => {
  it.each(lightColorTokens)('%s', token => {
    expect(dark[token]).toBeDefined();
  });
});

// --- Hierarchy sanity: --text-subtle stays dimmer than --text-muted ------

describe.each([
  ['light', light],
  ['dark', dark],
] as const)('%s text hierarchy', (_theme, tokens) => {
  it('--text-subtle is dimmer than --text-muted against --surface', () => {
    const bg = req(tokens, '--surface');
    const subtle = contrastRatio(req(tokens, '--text-subtle'), bg);
    const muted = contrastRatio(req(tokens, '--text-muted'), bg);
    expect(subtle).toBeLessThan(muted);
  });
});
