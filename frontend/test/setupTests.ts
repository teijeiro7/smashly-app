import { afterEach, expect, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Polyfill IntersectionObserver (required by framer-motion)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Polyfill window.scrollTo
global.scrollTo = vi.fn();

// Polyfill window.matchMedia with a configurable `matches` result per query,
// so tests covering dark/auto theme resolution and reduced-motion can
// actually exercise both branches instead of always hitting the light/no-op
// one. Default is false (matches nothing) unless a test opts in.
const mediaQueryMatches = new Map<string, boolean>();

export function setMediaQueryMatches(query: string, matches: boolean): void {
  mediaQueryMatches.set(query, matches);
}

afterEach(() => {
  mediaQueryMatches.clear();
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    get matches() {
      return mediaQueryMatches.get(query) ?? false;
    },
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Polyfill ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
