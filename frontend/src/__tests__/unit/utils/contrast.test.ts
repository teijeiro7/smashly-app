import { describe, it, expect } from 'vitest';
import { parseHex, luminance, contrastRatio, blend } from '@/utils/contrast';

const AA = 4.5;

describe('parseHex', () => {
  it('parses #rrggbb', () => {
    expect(parseHex('#16a34a')).toEqual({
      r: 22,
      g: 163,
      b: 74,
    });
  });

  it('parses #rgb shorthand and expands it', () => {
    expect(parseHex('#1ab')).toEqual({ r: 17, g: 170, b: 187 });
  });

  it('accepts a leading # optionally', () => {
    expect(parseHex('12873c')).toEqual({ r: 18, g: 135, b: 60 });
  });

  it.each(['#ggg', '##ff0000', '', 'red', '#12345'])('returns null for malformed %s', input => {
    expect(parseHex(input)).toBeNull();
  });
});

describe('luminance', () => {
  it('returns 0 for black and 1 for white', () => {
    expect(luminance('#000000')).toBeCloseTo(0, 3);
    expect(luminance('#ffffff')).toBeCloseTo(1, 3);
  });

  it('throws on malformed input', () => {
    expect(() => luminance('nope')).toThrow();
  });
});

describe('contrastRatio', () => {
  it('returns 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('is symmetric', () => {
    const a = contrastRatio('#12873c', '#ffffff');
    const b = contrastRatio('#ffffff', '#12873c');
    expect(a).toBeCloseTo(b, 3);
  });

  it('returns 1:1 for a color on itself', () => {
    expect(contrastRatio('#12873c', '#12873c')).toBeCloseTo(1, 3);
  });

  it('validates brand-surface white-foreground text passes AA', () => {
    expect(contrastRatio('#ffffff', '#12873c')).toBeGreaterThanOrEqual(AA);
  });
});

describe('blend', () => {
  it('keeps foreground at alpha 1', () => {
    expect(blend('#12873c', '#ffffff', 1)).toBe('#12873c');
  });

  it('keeps background at alpha 0', () => {
    expect(blend('#12873c', '#ffffff', 0)).toBe('#ffffff');
  });

  it('composites a 50% overlay', () => {
    expect(blend('#000000', '#ffffff', 0.5)).toBe('#808080');
  });
});
