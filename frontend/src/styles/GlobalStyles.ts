import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  /* CSS Reset and Global Styles */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    line-height: 1.15;
    -webkit-text-size-adjust: 100%;
    scroll-behavior: smooth;
    background: #f3f7f1;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    
    @media (hover: none) and (pointer: coarse) {
      scroll-behavior: auto; /* Smoother scrolling on mobile without behavioral conflicts */
    }
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    color: var(--text);
    background:
      radial-gradient(circle at 90% -10%, var(--bg-glow-primary), transparent 38%),
      radial-gradient(circle at -5% 20%, var(--bg-glow-secondary), transparent 28%),
      var(--bg);
    line-height: 1.6;
    font-size: 16px;
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overscroll-behavior-y: contain;
    min-height: 100dvh;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  #root {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.25;
    margin: 0;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 800;
  }

  h2 {
    font-size: 2rem;
    font-weight: 700;
  }

  h3 {
    font-size: 1.5rem;
    font-weight: 600;
  }

  h4 {
    font-size: 1.25rem;
    font-weight: 600;
  }

  h5 {
    font-size: 1.125rem;
    font-weight: 500;
  }

  h6 {
    font-size: 1rem;
    font-weight: 500;
  }

  p {
    margin: 0;
    line-height: 1.6;
  }

  /* Links */
  a {
    color: #16a34a;
    text-decoration: none;
    transition: color 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }

  a:hover {
    color: #15803d;
    text-decoration: underline;
  }

  /* Buttons */
  button {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    border: none;
    cursor: pointer;
    background: none;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Form elements */
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 12px 16px;
    background-color: #fff;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    min-height: 44px;
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }

  input::placeholder, textarea::placeholder {
    color: #9ca3af;
  }

  /* Lists */
  ul, ol {
    list-style: none;
  }

  /* Images */
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /* Scrollbar customization */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Utility classes */
  .gpu-accelerated {
    will-change: transform, opacity;
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .text-center {
    text-align: center;
  }

  .text-left {
    text-align: left;
  }

  .text-right {
    text-align: right;
  }

  /* Color variables as CSS custom properties */
  :root {
    --header-height: 72px;
    --subheader-height: 48px;
    --mobile-nav-height: 78px;
    --color-primary: #16a34a;
    --color-primary-dark: #15803d;
    --color-primary-light: #22c55e;
    --color-secondary: #3b82f6;
    --color-accent: #f59e0b;
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-error: #ef4444;
    --color-gray-50: #f9fafb;
    --color-gray-100: #f3f4f6;
    --color-gray-200: #e5e7eb;
    --color-gray-300: #d1d5db;
    --color-gray-400: #9ca3af;
    --color-gray-500: #6b7280;
    --color-gray-600: #4b5563;
    --color-gray-700: #374151;
    --color-gray-800: #1f2937;
    --color-gray-900: #111827;
    --color-white: #ffffff;
    --color-black: #000000;

    /* Semantic tokens (light mode defaults) */
    --bg: #f3f7f1;
    --surface: #ffffff;
    --surface-2: #f9fafb;
    --surface-3: #f3f4f6;
    --text: #1f2937;
    --text-muted: #6b7280;
    --text-subtle: #9ca3af;
    --text-inverse: #ffffff;
    --border: #e5e7eb;
    --border-strong: #d1d5db;
    --primary: #16a34a;
    --primary-hover: #15803d;
    --primary-light: #22c55e;
    --primary-rgb: 22, 163, 74;
    --primary-rgb-dark: 21, 128, 61;
    --primary-subtle: rgba(22, 163, 74, 0.10);
    --primary-faint: rgba(22, 163, 74, 0.04);
    --accent: #f59e0b;
    --accent-rgb: 245, 158, 11;
    --success: #10b981;
    --warning: #f59e0b;
    --error: #ef4444;
    --danger: #dc2626;
    --danger-rgb: 239, 68, 68;
    --danger-subtle: rgba(239, 68, 68, 0.10);
    --danger-strong: #fecaca;
    --info: #3b82f6;
    --bg-glow-primary: rgba(22, 163, 74, 0.14);

    /* Brand surface tokens — FIXED (do NOT flip with theme).
       These represent always-dark-green surfaces (hero gradients, header bar,
       solid CTA buttons, banners). They stay the same in light and dark so
       the brand identity is preserved; only foreground text/icons use the
       theme-aware --primary* tokens. */
    --brand-surface: #16a34a;
    --brand-surface-hover: #15803d;
    --brand-surface-strong: #0f6e38;
    --brand-surface-deep: #0f2818;
    --brand-rgb: 22, 163, 74;
    --brand-on-surface: #ffffff;
    --surface-inverse: #0f172a;
    --footer-bg: #0f2818;
    --header-bg: #15803d;
    --bg-glow-secondary: rgba(2, 132, 199, 0.08);

    /* Spacing */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-5: 1.25rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --space-10: 2.5rem;
    --space-12: 3rem;
    --space-16: 4rem;
    --space-20: 5rem;
    --space-24: 6rem;

    /* Border radius */
    --radius-sm: 0.25rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --radius-2xl: 1.5rem;

    /* Shadows */
    --shadow-color: rgba(0, 0, 0, 0.10);
    --surface-overlay: rgba(255, 255, 255, 0.85);
    --shadow-sm: 0 1px 2px 0 var(--shadow-color);
    --shadow-md: 0 4px 6px -1px var(--shadow-color), 0 2px 4px -1px var(--shadow-color);
    --shadow-lg: 0 10px 15px -3px var(--shadow-color), 0 4px 6px -2px var(--shadow-color);
    --shadow-xl: 0 20px 25px -5px var(--shadow-color), 0 10px 10px -5px var(--shadow-color);
  }

  /* Dark mode — selectors use BOTH attribute and class for maximum
     compatibility across browsers and any caching layers. */
  html[data-theme='dark'],
  html.theme-dark {
    /* Forest-tinted dark palette: backgrounds are green-graphite (not pure black) */
    --color-primary: #22c55e;
    --color-primary-dark: #16a34a;
    --color-primary-light: #4ade80;
    --color-secondary: #60a5fa;
    --color-accent: #84cc16;
    --color-success: #34d399;
    --color-warning: #fbbf24;
    --color-error: #f87171;
    --color-gray-50: #1a2420;
    --color-gray-100: #121a16;
    --color-gray-200: #243029;
    --color-gray-300: #2f3d34;
    --color-gray-400: #5a6e62;
    --color-gray-500: #8a9d91;
    --color-gray-600: #b5c2ba;
    --color-gray-700: #d4dcd8;
    --color-gray-800: #e8efe9;
    --color-gray-900: #f0f4f1;
    --color-white: #e8efe9;
    --color-black: #0a0f0d;

    --bg: #0a0f0d;
    --surface: #121a16;
    --surface-2: #1a2420;
    --surface-3: #243029;
    --text: #e8efe9;
    --text-muted: #94a89c;
    --text-subtle: #6b7d72;
    --text-inverse: #0a0f0d;
    --border: #243029;
    --border-strong: #2f3d34;
    --primary: #22c55e;
    --primary-hover: #4ade80;
    --primary-light: #4ade80;
    --primary-rgb: 34, 197, 94;
    --primary-rgb-dark: 22, 163, 74;
    --primary-subtle: rgba(34, 197, 94, 0.18);
    --primary-faint: rgba(34, 197, 94, 0.06);
    --accent: #84cc16;
    --accent-rgb: 132, 204, 22;
    --success: #34d399;
    --warning: #fbbf24;
    --error: #f87171;
    --danger: #f87171;
    --danger-rgb: 248, 113, 113;
    --danger-subtle: rgba(248, 113, 113, 0.15);
    --danger-strong: rgba(248, 113, 113, 0.30);
    --info: #60a5fa;
    --bg-glow-primary: rgba(34, 197, 94, 0.10);
    --bg-glow-secondary: rgba(96, 165, 250, 0.06);

    /* Brand surface tokens — FIXED (identical in light and dark).
       See :root above for the rationale. */
    --brand-surface: #16a34a;
    --brand-surface-hover: #15803d;
    --brand-surface-strong: #0f6e38;
    --brand-surface-deep: #0f2818;
    --brand-rgb: 22, 163, 74;
    --brand-on-surface: #ffffff;
    --surface-inverse: #0f172a;
    --footer-bg: #051008;
    --header-bg: #0a3818;

    --shadow-color: rgba(0, 0, 0, 0.50);
    --surface-overlay: rgba(18, 26, 22, 0.85);
    --shadow-sm: 0 1px 2px 0 var(--shadow-color);
    --shadow-md: 0 4px 6px -1px var(--shadow-color), 0 2px 4px -1px var(--shadow-color);
    --shadow-lg: 0 10px 15px -3px var(--shadow-color), 0 4px 6px -2px var(--shadow-color);
    --shadow-xl: 0 20px 25px -5px var(--shadow-color), 0 10px 10px -5px var(--shadow-color);

    color-scheme: dark;
  }

  /* Auto mode: follow OS, but only when user has NOT made an explicit choice
     (the anti-FOUC script sets data-theme='light'/'dark' when there is a stored
     preference, and leaves the attribute unset in auto mode). */
  @media (prefers-color-scheme: dark) {
    html:not([data-theme='light']):not([data-theme='dark']):not(.theme-light):not(.theme-dark) {
      --color-primary: #22c55e;
      --color-primary-dark: #16a34a;
      --color-primary-light: #4ade80;
      --color-secondary: #60a5fa;
      --color-accent: #84cc16;
      --color-success: #34d399;
      --color-warning: #fbbf24;
      --color-error: #f87171;
      --color-gray-50: #1a2420;
      --color-gray-100: #121a16;
      --color-gray-200: #243029;
      --color-gray-300: #2f3d34;
      --color-gray-400: #5a6e62;
      --color-gray-500: #8a9d91;
      --color-gray-600: #b5c2ba;
      --color-gray-700: #d4dcd8;
      --color-gray-800: #e8efe9;
      --color-gray-900: #f0f4f1;
      --color-white: #e8efe9;
      --color-black: #0a0f0d;

      --bg: #0a0f0d;
      --surface: #121a16;
      --surface-2: #1a2420;
      --surface-3: #243029;
      --text: #e8efe9;
      --text-muted: #94a89c;
      --text-subtle: #6b7d72;
      --text-inverse: #0a0f0d;
      --border: #243029;
      --border-strong: #2f3d34;
      --primary: #22c55e;
      --primary-hover: #4ade80;
      --primary-light: #4ade80;
      --primary-rgb: 34, 197, 94;
      --primary-rgb-dark: 22, 163, 74;
      --primary-subtle: rgba(34, 197, 94, 0.18);
      --primary-faint: rgba(34, 197, 94, 0.06);
      --accent: #84cc16;
      --accent-rgb: 132, 204, 22;
      --success: #34d399;
      --warning: #fbbf24;
      --error: #f87171;
      --danger: #f87171;
      --danger-rgb: 248, 113, 113;
      --danger-subtle: rgba(248, 113, 113, 0.15);
      --danger-strong: rgba(248, 113, 113, 0.30);
      --info: #60a5fa;
      --bg-glow-primary: rgba(34, 197, 94, 0.10);
      --bg-glow-secondary: rgba(96, 165, 250, 0.06);

      /* Brand surface tokens — FIXED (identical in light and dark).
         See :root above for the rationale. */
      --brand-surface: #16a34a;
      --brand-surface-hover: #15803d;
    --brand-surface-strong: #0f6e38;
    --brand-surface-deep: #0f2818;
    --brand-rgb: 22, 163, 74;
    --brand-on-surface: #ffffff;
    --surface-inverse: #0f172a;
    --footer-bg: #051008;
    --header-bg: #0a3818;

      --shadow-color: rgba(0, 0, 0, 0.50);
      --surface-overlay: rgba(18, 26, 22, 0.85);
      --shadow-sm: 0 1px 2px 0 var(--shadow-color);
      --shadow-md: 0 4px 6px -1px var(--shadow-color), 0 2px 4px -1px var(--shadow-color);
      --shadow-lg: 0 10px 15px -3px var(--shadow-color), 0 4px 6px -2px var(--shadow-color);
      --shadow-xl: 0 20px 25px -5px var(--shadow-color), 0 10px 10px -5px var(--shadow-color);

      color-scheme: dark;
    }
  }

  /* Media queries */
  @media (max-width: 768px) {
    html {
      font-size: 14px;
    }
    
    .container {
      padding: 0 16px;
    }

    :root {
      --header-height: 68px;
      --subheader-height: 0px;
      --mobile-nav-height: 82px;
    }
  }

  @media (max-width: 480px) {
    html {
      font-size: 13px;
    }
    
    .container {
      padding: 0 12px;
    }
  }

  @media (hover: none) and (pointer: coarse) {
    a,
    button,
    [role='button'],
    input[type='checkbox'],
    input[type='radio'],
    summary {
      min-height: 44px;
      min-width: 44px;
    }
  }

  /* Focus styles for accessibility (WCAG 2.1 AA)
   * :focus-visible only shows for keyboard nav, not mouse clicks */
  :focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: 2px;
  }

  /* Remove :focus outline for mouse users via :focus:not(:focus-visible) */
  :focus:not(:focus-visible) {
    outline: none;
  }

  /* Legacy class for components that use it explicitly */
  .focus-visible:focus {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Skip-to-content link (visible only on keyboard focus) */
  .skip-to-content {
    position: absolute;
    top: -100%;
    left: 0;
    z-index: 9999;
    padding: 12px 24px;
    background: var(--color-primary);
    color: white;
    font-weight: 600;
    text-decoration: none;
    border-radius: 0 0 8px 0;
    transition: top 0.1s ease;
  }

  .skip-to-content:focus {
    top: 0;
    outline: 3px solid white;
    outline-offset: 2px;
  }

  /* Reduce motion for users who prefer it */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Print styles */
  @media print {
    * {
      color: black !important;
      background: white !important;
    }
  }
  /* Sileo Toast Viewport Z-Index Override */
  [data-sileo-viewport] {
    z-index: 9999 !important;
  }
`;
