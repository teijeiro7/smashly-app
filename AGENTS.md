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
- Auth is client-side via `@supabase/supabase-js`, which persists the session in browser `localStorage`; `api/` verifies bearer tokens per-request via `getAuthUser()` (no cookies involved)

## Project Skills
- **Local Skills Directory**: `.claude/skills/`
  - `/develop-pr`: Opens a PR from current branch to `main` with standard repo structure (`## Summary` + `## Test plan`) and PR-Agent review logic.
  - `/pr-agent-review`: Processes GitHub Action PR-Agent review comments on PRs.
  - *Rule*: Always inspect `.claude/skills/` in the project root for project-specific workflow skills.


<!-- headroom:rtk-instructions -->
# RTK (Rust Token Killer) - Token-Optimized Commands

When running shell commands, **always prefix with `rtk`**. This reduces context
usage by 60-90% with zero behavior change. If rtk has no filter for a command,
it passes through unchanged — so it is always safe to use.

## Key Commands
```bash
# Git (59-80% savings)
rtk git status          rtk git diff            rtk git log

# Files & Search (60-75% savings)
rtk ls <path>           rtk read <file>         rtk grep <pattern>
rtk find <pattern>      rtk diff <file>

# Test (90-99% savings) — shows failures only
rtk pytest tests/       rtk cargo test          rtk test <cmd>

# Build & Lint (80-90% savings) — shows errors only
rtk tsc                 rtk lint                rtk cargo build
rtk prettier --check    rtk mypy                rtk ruff check

# Analysis (70-90% savings)
rtk err <cmd>           rtk log <file>          rtk json <file>
rtk summary <cmd>       rtk deps                rtk env

# GitHub (26-87% savings)
rtk gh pr view <n>      rtk gh run list         rtk gh issue list

# Infrastructure (85% savings)
rtk docker ps           rtk kubectl get         rtk docker logs <c>

# Package managers (70-90% savings)
rtk pip list            rtk pnpm install        rtk npm run <script>
```

## Rules
- In command chains, prefix each segment: `rtk git add . && rtk git commit -m "msg"`
- For debugging, use raw command without rtk prefix
- `rtk proxy <cmd>` runs command without filtering but tracks usage
<!-- /headroom:rtk-instructions -->


<!-- headroom:memory-instructions -->
## Memory

Use the `headroom_memory` MCP server for persistent cross-session knowledge.

**Before** answering questions about prior decisions, conventions, project context,
architecture, user preferences, org info, codenames, debugging history, or anything
from past sessions — call `memory_search` first.

**After** making durable decisions, discovering conventions, or learning important
facts — call `memory_save` to persist them for future sessions.

Memory is your first source of truth for anything not visible in the current conversation.
