import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'smashly-theme';
const DOM_ATTRIBUTE = 'data-theme';

interface ThemeContextValue {
  /** User-selected mode (light / dark / auto) */
  mode: ThemeMode;
  /** Resolved mode after applying auto: actual theme in effect */
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  /** Cycle through light → dark → auto (used by the simple toggle button) */
  cycle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getStoredMode(): ThemeMode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'auto') return v;
  } catch {
    // localStorage unavailable (private mode, SSR, etc.)
  }
  return null;
}

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveMode(mode: ThemeMode, systemDark: boolean): ResolvedTheme {
  if (mode === 'auto') return systemDark ? 'dark' : 'light';
  return mode;
}

function applyToDom(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(DOM_ATTRIBUTE, resolved);
  // Helps native form controls/scrollbars match the theme
  document.documentElement.style.colorScheme = resolved;
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'auto';
    return getStoredMode() ?? 'auto';
  });
  const [systemDark, setSystemDark] = useState<boolean>(() => getSystemPrefersDark());

  const resolved = resolveMode(mode, systemDark);

  // Apply theme to <html> whenever it changes
  useEffect(() => {
    applyToDom(resolved);
  }, [resolved]);

  // In auto mode, follow OS preference changes live
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    // Some older browsers only support addListener
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const cycle = useCallback(() => {
    setModeState(prev => {
      const next: ThemeMode = prev === 'light' ? 'dark' : prev === 'dark' ? 'auto' : 'light';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, setMode, cycle }),
    [mode, resolved, setMode, cycle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
