type Rgb = { r: number; g: number; b: number };

/**
 * Parse a hex color (#rgb, #rrggbb, optional leading #) into 0-255 RGB.
 * Returns null for malformed input.
 */
export function parseHex(hex: string): Rgb | null {
  const m = hex.replace('#', '').trim();
  const full = m.match(/^([0-9a-f]{3})$/i);
  const long = m.match(/^([0-9a-f]{6})$/i);
  if (!full && !long) return null;

  if (full) {
    const [r, g, b] = [...full[1]].map(x => parseInt(x + x, 16));
    return { r, g, b };
  }
  const [r, g, b] = [0, 2, 4].map(i => parseInt(long![1].slice(i, i + 2), 16));
  return { r, g, b };
}

function channelLinear(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const c = parseHex(hex);
  if (!c) throw new Error(`Invalid hex color: ${hex}`);
  return 0.2126 * channelLinear(c.r) + 0.7152 * channelLinear(c.g) + 0.0722 * channelLinear(c.b);
}

/**
 * WCAG 2.1 relative luminance contrast ratio between two colors (1-21).
 * Throws on malformed input.
 */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Alpha-composite a hex color on top of a background hex, returning an opaque hex.
 * `alpha` is 0..1 (how visible the foreground is over the background).
 */
export function blend(foreground: string, background: string, alpha: number): string {
  const fg = parseHex(foreground)!;
  const bg = parseHex(background)!;
  if (!fg || !bg) throw new Error('Invalid color for blend');

  const mix = (f: number, b: number) => Math.round(f * alpha + b * (1 - alpha));
  const r = mix(fg.r, bg.r);
  const g = mix(fg.g, bg.g);
  const b = mix(fg.b, bg.b);
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}
