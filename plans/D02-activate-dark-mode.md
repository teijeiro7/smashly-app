# Plan D02: Activate dark mode — remove debug gate + add toggle

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- frontend/src/`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

The complete dark mode infrastructure exists (ThemeContext, CSS variables,
`data-theme` attribute, toggle capability) but is gated behind a debug env
var `VITE_DEBUG_THEME`. The `ThemeDebug.tsx:31` comment literally says
"Remove once dark mode is verified working." The feature is documented in
`docs/functionalities-v1.0.md:169` as planned. S effort to activate what's
already built.

## Current state

- `frontend/src/contexts/ThemeContext.tsx` — full theme system with mode/resolved
- CSS variables (`--bg`, `--text`, etc.) in global styles support dark/light
- `data-theme` attribute on `<html>` properly toggles
- `ThemeDebug.tsx` renders a debug overlay when `VITE_DEBUG_THEME === 'true'`
- Feature gate comment at `ThemeDebug.tsx:29-32`: "Remove once dark mode verified working"

## Scope

**In scope**:
- Remove `ThemeDebug.tsx` or strip its env gate
- Add a dark mode toggle button in the header or user menu
- Ensure all pages render correctly in dark mode

**Out of scope**:
- Creating new dark mode CSS variables (they already exist)
- Rewriting existing components for dark mode (should work via CSS vars)

## Git workflow

- Branch: `advisor/D02-dark-mode`

## Steps

### Step 1: Review dark mode completeness

Check the existing CSS variable set for any missing dark values:
- Test all major pages in dark mode by temporarily setting `data-theme="dark"`
  on `<html>` in dev tools

### Step 2: Remove or gate ThemeDebug.tsx

Delete `ThemeDebug.tsx` (it was temporary). Or keep it but make it invisible
to users (remove the `VITE_DEBUG_THEME` gate and make it a dev-only import).

### Step 3: Add dark mode toggle UI

Add a sun/moon toggle button in:
- Header nav bar (visible on all pages)
- Or user profile/settings page

Use Phosphor Icons (`@phosphor-icons/react`) — `SunDim` and `Moon` icons.
Model the toggle pattern: read/write `data-theme` attribute on `<html>` and
persist preference to `localStorage`.

### Step 4: Verify all pages

Quick-check each page type in dark mode:
- HomePage (hero, cards)
- CatalogPage (filter bar, racket grid)
- RacketDetailPage (specs, chart)
- ComparePage (comparison table)
- StoreDashboard (panels, forms)
- MessagingPage (chat bubbles)

## Test plan

- Manual: Toggle dark mode on each page type, verify readability and contrast
- No unit tests needed (purely UI change)

## Done criteria

- [ ] `ThemeDebug.tsx` removed or properly gated
- [ ] Dark mode toggle visible in header or user menu
- [ ] `localStorage` persists the preference
- [ ] All major pages render correctly in dark mode
- [ ] `cd frontend && npx tsc --noEmit` exits 0
