import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The 16 public (no-auth) routes reachable from router.tsx. Dynamic segments
// use a placeholder — the pages these hit either render a real record (when
// run against a seeded environment) or a graceful "not found" state; either
// way the rendered UI is what gets checked for contrast/a11y violations.
const PUBLIC_ROUTES = [
  '/',
  '/catalog',
  '/palas/placeholder-slug',
  '/best-racket',
  '/compare',
  '/compare-rackets',
  '/compare/placeholder-id',
  '/shared/placeholder-token',
  '/faq',
  '/terms-and-conditions',
  '/privacy-policy',
  '/forgot-password',
  '/update-password',
  '/store/placeholder-store',
  '/error',
  '/this-route-does-not-exist',
];

const THEMES = ['light', 'dark'] as const;

for (const theme of THEMES) {
  test.describe(`a11y (${theme} theme)`, () => {
    test.beforeEach(async ({ page }) => {
      // Same key ThemeContext reads (src/contexts/ThemeContext.tsx), set
      // before any script runs so the app boots straight into this theme —
      // matches how the anti-FOUC guard in index.html resolves it.
      await page.addInitScript(t => {
        window.localStorage.setItem('smashly-theme', t);
      }, theme);
    });

    for (const route of PUBLIC_ROUTES) {
      test(`${route || '/'} has no serious/critical violations`, async ({ page }) => {
        await page.goto(route, { waitUntil: 'networkidle' });

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();

        const seriousOrWorse = results.violations.filter(
          v => v.impact === 'serious' || v.impact === 'critical'
        );

        expect(
          seriousOrWorse,
          seriousOrWorse.map(v => `${v.id}: ${v.description}\n${v.nodes.map(n => n.target.join(' ')).join('\n')}`).join('\n\n')
        ).toEqual([]);
      });
    }
  });
}
