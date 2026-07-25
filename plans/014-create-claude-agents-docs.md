# Plan 014: Create CLAUDE.md/AGENTS.md for AI-assisted development

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- AGENTS.md CLAUDE.md`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

No CLAUDE.md or AGENTS.md exists in the repo. AI coding tools lack context
about monorepo structure, preferred package manager, service conventions,
test patterns, and deployment setup. This leads to incorrect commands,
wrong file edits, and wasted context.

## Current state

Zero files found matching `**/CLAUDE.md` or `**/AGENTS.md`.

## Scope

**In scope**:
- `AGENTS.md` at root — one file covering all essential context

**Out of scope**:
- Other documentation files

## Git workflow

- Branch: `advisor/014-create-agents-docs`

## Steps

### Step 1: Create AGENTS.md at root

```markdown
# Smashly — Agent Context

## Project
Padel racket catalog + store marketplace (Spanish market).
Monorepo: frontend (Vite/React) + API (Vercel serverless) + Supabase.

## Structure
- `frontend/` — React 18 + TypeScript, Vite 6, TanStack Router + Query,
  styled-components, framer-motion, Phosphor Icons
- `api/` — Vercel serverless functions, raw Node.js HTTP handlers,
  Supabase JS client
- `supabase/migrations/` — DB schema migrations

## Commands
- Dev: `cd frontend && pnpm dev` (starts API + Vite concurrently)
- Test: `cd frontend && pnpm test --run`
- Typecheck: `cd frontend && npx tsc --noEmit`
- Build: `cd frontend && pnpm build`
- Lint: `cd frontend && pnpm lint`
- Format: `cd frontend && pnpm format`

## Conventions
- **Package manager**: pnpm (root, frontend, api all use pnpm)
- **Services**: Plain object pattern with named methods.
  Model after `frontend/src/services/storeService.ts`.
  New services: fetch-based via `API_ENDPOINTS` from `config/api.ts`.
- **API handlers**: Default export `handler(req, res)`. Use shared CORS
  from `api/_lib/auth.ts` (`setCorsHeaders` + `handleOptions`).
  Use `supabaseAdmin` for server-side ops (bypasses RLS).
- **Auth**: `getAuthUser(req)` from `api/_lib/auth.ts` for handler auth.
- **Tests**: Vitest + jsdom. Mock `global.fetch` for fetch-based services,
  mock `../../lib/supabase` for supabase-based services.
- **Error handling**: API handlers return JSON `{ error: string }` with
  appropriate HTTP status code.
- **DB**: Stores use `status` enum (`pending|verified|rejected`), not
  boolean `verified` column.

## Key decisions
- Admin client (`supabaseAdmin`) bypasses RLS — used server-side only
- Frontend uses Vite proxy for Supabase in dev (same-origin, avoids CORS)
- Auth lives in httpOnly cookies; legacy localStorage fallback being deprecated
```

## Test plan

- Verify file is valid markdown — no syntax issues
- No test changes needed

## Done criteria

- [ ] `AGENTS.md` exists at repo root
- [ ] Covers: project purpose, structure, commands, conventions, key decisions
- [ ] `plans/README.md` status row updated

## Maintenance notes

- Keep this file updated when adding new patterns or changing conventions
- When adding a new directory or service type, update the structure section
