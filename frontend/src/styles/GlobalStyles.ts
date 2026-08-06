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
    background: var(--bg);
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    
    @media (hover: none) and (pointer: coarse) {
      scroll-behavior: auto; /* Smoother scrolling on mobile without behavioral conflicts */
    }
  }

  body {
    font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
    font-variant-numeric: tabular-nums;
    overscroll-behavior-y: contain;
    min-height: 100dvh;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.03;
    pointer-events: none;
    z-index: 9998;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 256px 256px;
  }

  #root {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  /* Fluid Typography Scale (Impeccable Design Standard) */
  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.2;
    margin: 0;
  }

  h1 {
    font-size: clamp(2rem, 4vw + 1rem, 3.25rem);
    font-weight: 800;
    letter-spacing: -0.025em;
  }

  h2 {
    font-size: clamp(1.5rem, 3vw + 0.8rem, 2.25rem);
    font-weight: 700;
    letter-spacing: -0.015em;
  }

  h3 {
    font-size: clamp(1.25rem, 2vw + 0.5rem, 1.75rem);
    font-weight: 600;
  }

  h4 {
    font-size: clamp(1.1rem, 1.5vw + 0.4rem, 1.35rem);
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
    max-width: 75ch;
  }

  /* Links */
  a {
    color: var(--primary);
    text-decoration: none;
    transition: color 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }

  a:hover {
    color: var(--primary-hover);
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
    border: 1px solid var(--border-control);
    border-radius: 8px;
    padding: 12px 16px;
    background-color: var(--surface);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    min-height: 44px;
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.12);
  }

  input::placeholder, textarea::placeholder {
    color: var(--text-subtle);
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
    background: var(--surface-3);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border-strong);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--border);
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
    --text-muted: #6c6c6c;
    --text-subtle: #6f6f6f;
    --text-inverse: #ffffff;
    --border: #e5e7eb;
    --border-strong: #d1d5db;
    --primary: #12873c;
    --primary-hover: #15803d;
    --primary-light: #22c55e;
    --primary-rgb: 18, 135, 60;
    --primary-rgb-dark: 21, 128, 61;
    --primary-subtle: rgba(18, 135, 60, 0.10);
    --primary-faint: rgba(18, 135, 60, 0.04);
    --accent: #d97706;
    --accent-rgb: 217, 119, 6;
    --success: #10b981;
    --warning: #f59e0b;
    --error: #ef4444;
    --danger: #dc2626;
    --danger-rgb: 239, 68, 68;
    --danger-subtle: rgba(239, 68, 68, 0.10);
    --danger-strong: #fecaca;
    --info: #3b82f6;
    --info-rgb: 59, 130, 246;
    --info-subtle: rgba(59, 130, 246, 0.10);
    --accent-subtle: rgba(217, 119, 6, 0.10);
    --bg-glow-primary: rgba(22, 163, 74, 0.14);

    /* Foreground-on-fill tokens — text/icon color when painted on a solid
       semantic fill (background: var(--success); color: var(--on-success)).
       Never hardcode white/black on these fills — the correct foreground
       flips per theme (in dark mode every fill below needs dark text). */
    --on-primary: #ffffff;
    --on-primary-rgb: 255, 255, 255;
    --on-success: #0a0f0d;
    --on-warning: #0a0f0d;
    --on-error: #0a0f0d;
    --on-danger: #ffffff;
    --on-info: #0a0f0d;
    --on-accent: #0a0f0d;

    /* Status-as-text tokens — use when a semantic color IS the text itself
       (color: var(--success-text), not a fill). Darkened here so they clear
       4.5:1 against all four page surfaces (--bg/--surface/-2/-3); the base
       --success/--warning/etc. tokens already fail that as body text. */
    --primary-text: #118139;
    --success-text: #0b7f59;
    --warning-text: #946005;
    --error-text: #d51010;
    --danger-text: #d92323;
    --info-text: #1066f4;
    --accent-text: #a85c05;

    /* Content painted directly on the fixed brand surfaces below
       (--brand-surface*, --header-bg, --footer-bg, --surface-inverse) —
       identical in both themes, so declared once here (no dark override
       needed). --on-brand-muted clears only 3:1: large text/icons only. */
    --on-brand: #ffffff;
    --on-brand-muted: rgba(255, 255, 255, 0.8);
    --on-brand-rgb: 255, 255, 255;

    /* Fixed near-black scrim for full-screen overlays (lightbox backdrop,
       mobile drawer backdrop) — same in both themes by design, so callers
       vary only the alpha: rgba(var(--scrim-rgb), 0.5). */
    --scrim-rgb: 0, 0, 0;

    /* Border for interactive form controls — needs 3:1 (WCAG 1.4.11).
       --border/--border-strong stay decorative (dividers, card edges). */
    --border-control: #6b7280;

    /* Focus ring — a fixed (non-themed) black-on-white double ring.
       Mathematically, for ANY background luminance L, at least one of
       white/black clears 3:1 against it (the two failure zones don't
       overlap), so this is guaranteed visible on every surface in the
       app, including the green header/footer brand surfaces where a
       themed --primary ring would disappear. */
    --focus-ring: #0a0f0d;
    --focus-ring-halo: #ffffff;

    /* Brand surface tokens — FIXED (do NOT flip with theme).
       These represent always-dark-green surfaces (hero gradients, header bar,
       solid CTA buttons, banners). They stay the same in light and dark so
       the brand identity is preserved; only foreground text/icons use the
       theme-aware --primary* tokens. */
    --brand-surface: #12873c;
    --brand-surface-hover: #15803d;
    --brand-surface-strong: #0f6e38;
    --brand-surface-deep: #0f2818;
    --brand-rgb: 18, 135, 60;
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
    --shadow-color: rgba(15, 40, 24, 0.10);
    --surface-overlay: rgba(255, 255, 255, 0.85);
    --shadow-sm: 0 1px 2px 0 var(--shadow-color);
    --shadow-md: 0 4px 6px -1px var(--shadow-color), 0 2px 4px -1px var(--shadow-color);
    --shadow-lg: 0 10px 15px -3px var(--shadow-color), 0 4px 6px -2px var(--shadow-color);
    --shadow-xl: 0 20px 25px -5px var(--shadow-color), 0 10px 10px -5px var(--shadow-color);

    /* Racket image card tokens (fixed across themes: always-white framed tile) */
    --racket-image-bg: #ffffff;
    --racket-image-radius-card: 12px;
    --racket-image-radius-detail: 16px;
    --racket-image-border: 1px solid #e5e7eb;
    --racket-image-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);

    /* z-index scale */
    --z-base: 1;
    --z-sticky: 100;
    --z-header: 350;
    --z-nav: 380;
    --z-overlay: 500;
    --z-modal: 1000;
    --z-toast: 9999;
  }

  /* Dark mode — selectors use BOTH attribute and class for maximum
     compatibility across browsers and any caching layers. Auto mode is
     resolved by ThemeContext + the anti-FOUC script, which always sets
     data-theme before paint — so there is no bare-media-query fallback
     to keep in sync here. */
  html[data-theme='dark'],
  html.theme-dark {
    /* Forest-tinted dark palette: backgrounds are green-graphite (not pure black) */
    --color-primary: #22c55e;
    --color-primary-dark: #16a34a;
    --color-primary-light: #4ade80;
    --color-secondary: #60a5fa;
    --color-accent: #f59e0b;
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
    --text-subtle: #8ba195;
    --text-inverse: #0a0f0d;
    --border: #243029;
    --border-strong: #2f3d34;
    --primary: #22c55e;
    --primary-hover: #4ade80;
    --primary-light: #6ee7a0;
    --primary-rgb: 34, 197, 94;
    --primary-rgb-dark: 22, 163, 74;
    --primary-subtle: rgba(34, 197, 94, 0.18);
    --primary-faint: rgba(34, 197, 94, 0.06);
    --accent: #f59e0b;
    --accent-rgb: 245, 158, 11;
    --success: #34d399;
    --warning: #fbbf24;
    --error: #f87171;
    --danger: #f87171;
    --danger-rgb: 248, 113, 113;
    --danger-subtle: rgba(248, 113, 113, 0.15);
    --danger-strong: #f87171;
    --info: #60a5fa;
    --info-rgb: 96, 165, 250;
    --info-subtle: rgba(96, 165, 250, 0.16);
    --accent-subtle: rgba(245, 158, 11, 0.16);
    --bg-glow-primary: rgba(34, 197, 94, 0.10);
    --bg-glow-secondary: rgba(96, 165, 250, 0.06);

    /* Foreground-on-fill tokens — see :root. In dark every semantic fill
       is light/vivid enough that dark text is the correct foreground. */
    --on-primary: #0a0f0d;
    --on-primary-rgb: 10, 15, 13;
    --on-success: #0a0f0d;
    --on-warning: #0a0f0d;
    --on-error: #0a0f0d;
    --on-danger: #0a0f0d;
    --on-info: #0a0f0d;
    --on-accent: #0a0f0d;

    /* Status-as-text tokens — already pass 4.5:1 in dark, so they mirror
       the base semantic color (kept separate for API symmetry with the
       light tokens above, which do diverge from their base color). */
    --primary-text: #22c55e;
    --success-text: #34d399;
    --warning-text: #fbbf24;
    --error-text: #f87171;
    --danger-text: #f87171;
    --info-text: #60a5fa;
    --accent-text: #f59e0b;

    --border-control: #94a89c;

    /* Brand surface tokens — FIXED (identical in light and dark).
       See :root above for the rationale. */
    --brand-surface: #12873c;
    --brand-surface-hover: #15803d;
    --brand-surface-strong: #0f6e38;
    --brand-surface-deep: #0f2818;
    --brand-rgb: 18, 135, 60;
    --brand-on-surface: #ffffff;
    --surface-inverse: #0f172a;
    --footer-bg: #051008;
    --header-bg: #0a3818;

    --shadow-color: rgba(0, 0, 0, 0.55);
    --surface-overlay: rgba(18, 26, 22, 0.85);
    --shadow-sm: 0 1px 2px 0 var(--shadow-color);
    --shadow-md: 0 4px 6px -1px var(--shadow-color), 0 2px 4px -1px var(--shadow-color);
    --shadow-lg: 0 10px 15px -3px var(--shadow-color), 0 4px 6px -2px var(--shadow-color);
    --shadow-xl: 0 20px 25px -5px var(--shadow-color), 0 10px 10px -5px var(--shadow-color);

    /* Racket image tile — bg stays fixed white on purpose (product photos
       are white-background cutouts; darkening the plate would break them).
       Border/shadow ARE adapted so the tile doesn't look like a floating
       hole on a dark page. */
    --racket-image-border: 1px solid #2f3d34;
    --racket-image-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.35);

    color-scheme: dark;
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

  /* Focus styles for accessibility (WCAG 2.2 AA, 2.4.11)
   * :focus-visible only shows for keyboard nav, not mouse clicks.
   * Bitone ring (dark outline + light halo) so it clears 3:1 on any
   * surface, including the fixed green header/footer. !important beats
   * the many component-level "&:focus { outline: none }" overrides
   * without having to touch every one of those files individually. */
  :focus-visible {
    outline: 2px solid var(--focus-ring-halo) !important;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px var(--focus-ring) !important;
    border-radius: 2px;
  }

  /* Remove :focus outline for mouse users via :focus:not(:focus-visible) */
  :focus:not(:focus-visible) {
    outline: none;
  }

  /* Legacy class for components that use it explicitly */
  .focus-visible:focus {
    outline: 2px solid var(--focus-ring-halo) !important;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px var(--focus-ring) !important;
  }

  /* Skip-to-content link (visible only on keyboard focus) */
  .skip-to-content {
    position: absolute;
    top: -100%;
    left: 0;
    z-index: 9999;
    padding: 12px 24px;
    background: var(--brand-surface);
    color: var(--on-brand);
    font-weight: 600;
    text-decoration: none;
    border-radius: 0 0 8px 0;
    transition: top 0.1s ease;
  }

  .skip-to-content:focus {
    top: 0;
    outline: 2px solid var(--focus-ring-halo);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px var(--focus-ring);
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
    html, body, body * {
      color: black !important;
      background: white !important;
    }
  }
  /* Sileo Toast Theme Overrides & Accessibility Fixes */
  [data-sileo-viewport] {
    z-index: 9999 !important;
    font-family: inherit;
  }

  [data-sileo-toast] {
    filter: drop-shadow(var(--shadow-lg));
  }

  /* Dark Theme Sileo Overrides (Fixes SVG rect background fill & description contrast) */
  html[data-theme='dark'] [data-sileo-svg] rect,
  html.theme-dark [data-sileo-svg] rect,
  [data-sileo-viewport][data-theme='dark'] [data-sileo-svg] rect,
  [data-sileo-viewport][data-theme='dark'] [data-sileo-pill],
  [data-sileo-viewport][data-theme='dark'] [data-sileo-body] {
    fill: #16221b !important;
    stroke: #2f3d34 !important;
    stroke-width: 1px !important;
  }

  html[data-theme='dark'] [data-sileo-description],
  html.theme-dark [data-sileo-description],
  [data-sileo-viewport][data-theme='dark'] [data-sileo-description] {
    color: #e8efe9 !important;
    font-weight: 500;
  }

  html[data-theme='dark'] [data-sileo-title],
  html.theme-dark [data-sileo-title],
  [data-sileo-viewport][data-theme='dark'] [data-sileo-title] {
    color: #ffffff !important;
    font-weight: 600;
  }

  /* Light Theme Sileo Overrides (Fixes SVG rect background fill & description contrast) */
  html[data-theme='light'] [data-sileo-svg] rect,
  html:not([data-theme='dark']) [data-sileo-svg] rect,
  [data-sileo-viewport][data-theme='light'] [data-sileo-svg] rect,
  [data-sileo-viewport][data-theme='light'] [data-sileo-pill],
  [data-sileo-viewport][data-theme='light'] [data-sileo-body] {
    fill: #ffffff !important;
    stroke: #e5e7eb !important;
    stroke-width: 1px !important;
  }

  html[data-theme='light'] [data-sileo-description],
  html:not([data-theme='dark']) [data-sileo-description],
  [data-sileo-viewport][data-theme='light'] [data-sileo-description] {
    color: #1f2937 !important;
    font-weight: 500;
  }

  html[data-theme='light'] [data-sileo-title],
  html:not([data-theme='dark']) [data-sileo-title],
  [data-sileo-viewport][data-theme='light'] [data-sileo-title] {
    color: #111827 !important;
    font-weight: 600;
  }

  /* Sileo Action Buttons */
  [data-sileo-button] {
    font-weight: 600 !important;
  }
`;
