import { describe, it, expect } from 'vitest';
import { contrastRatio } from '@/utils/contrast';

const AA = 4.5;

/* WCAG AA contrast audit for the GlobalStyles theme tokens.
   Hold the committed values here so a regression in GlobalStyles.ts
   (or a future token bump) is caught as a failing ratio. */

interface Pair {
  fg: string;
  bg: string;
  label: string;
}

const LIGHT: Pair[] = [
  { fg: '#737373', bg: '#ffffff', label: 'light --text-subtle on --surface' },
  { fg: '#12873c', bg: '#ffffff', label: 'light --primary on --surface (link/text)' },
  { fg: '#12873c', bg: '#ffffff', label: 'light --brand-surface' },
];

const BRAND = [
  { fg: '#ffffff', bg: '#12873c', label: 'brand-on-surface / brand-surface' },
  { fg: '#ffffff', bg: '#15803d', label: 'brand-on-surface / brand-surface-hover' },
];

const DARK: Pair[] = [
  { fg: '#8ba195', bg: '#121a16', label: 'dark --text-subtle on --surface' },
  { fg: '#22c55e', bg: '#121a16', label: 'dark --primary on --surface' },
];

describe('GlobalStyles theme contrast audit (WCAG AA)', () => {
  it.each(LIGHT)('$label >= 4.5:1', ({ fg, bg }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
  });

  it.each(BRAND)('$label >= 4.5:1 (white text on green)', ({ fg, bg }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
  });

  it.each(DARK)('$label >= 4.5:1', ({ fg, bg }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
  });

  it('dark --text-subtle stays dimmer than dark --text-muted (hierarchy)', () => {
    const bg = '#121a16';
    const subtle = contrastRatio('#8ba195', bg);
    const muted = contrastRatio('#94a89c', bg);
    expect(subtle).toBeLessThan(muted);
  });
});
