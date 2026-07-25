# Plan 002: Fix root package.json scripts that reference wrong path

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat b4b881f..HEAD -- package.json`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

All 6 commands in root `package.json` that reference `backend/api/` silently
fail because the API directory is at `api/` (not `backend/api/`). Running
`npm run build:all`, `npm run lint`, `npm run test:all`, or `npm run install:all`
from the root does nothing useful — first `cd backend/api` fails, the whole
chain exits, and the frontend never builds/tests/lints. Developers get false
positive pass from these commands.

## Current state

Root `package.json` scripts referencing wrong path (6 occurrences):

```
"install:all": "npm install && cd backend/api && npm install && cd ../../frontend && npm install"
"lint": "cd backend/api && npm run lint && cd ../../frontend && npm run lint"
"lint:fix": "cd backend/api && npm run lint:fix && cd ../../frontend && npm run lint:fix"
"format": "cd backend/api && npm run format && cd ../../frontend && npm run format"
"format:check": "cd backend/api && npm run format:check && cd ../../frontend && npm run format:check"
"test:all": "cd backend/api && npm run test && cd ../../frontend && npm run test"
"build:all": "cd backend/api && npm run build && cd ../../frontend && npm run build"
```

All must change `backend/api` → `api` and remove one `../` from `../../frontend`.

**BUT**: the `api/` directory has no lint/format/test/build scripts in its
`package.json` — it only has `@supabase/supabase-js` and TypeScript. So running
`cd api && npm run lint` would ALSO fail. The correct behavior is:

- Only run `cd frontend && npm run <script>` for lint/format/test/build
- Keep `install:all` running install in both `api/` and `frontend/`

Wait — check the actual api/package.json: it has NO scripts section. So
`cd api && npm run lint` would fail. The scripts should be simplified to
only run the frontend commands for lint/format/test/build.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Verify scripts | `npm run lint` | runs eslint on frontend only, exit 0 |

## Scope

**In scope**:
- `package.json` — the 7 scripts listed above

**Out of scope**:
- Any `backend/` directory — if it exists, do not create or modify it
- The api/ or frontend/ package.json files

## Git workflow

- Branch: `advisor/002-fix-root-scripts-path`
- Commit message: `fix: correct root scripts path from backend/api to api`

## Steps

### Step 1: Edit all 7 scripts in package.json

Replace `backend/api` with `api` and `../../frontend` with `../frontend` in:
- `install:all`
- `lint`
- `lint:fix`
- `format`
- `format:check`
- `test:all`
- `build:all`

BUT since `api/package.json` has no scripts for lint/format/test/build, the
lint/format/test/build scripts should ONLY run the frontend commands. The
`install:all` is the only one that should run both.

Updated scripts:

```
"install:all": "npm install && (cd api && npm install) && (cd frontend && npm install)",
"lint": "cd frontend && npm run lint",
"lint:fix": "cd frontend && npm run lint:fix",
"format": "cd frontend && npm run format",
"format:check": "cd frontend && npm run format:check",
"test:all": "cd frontend && npm run test",
"build:all": "cd frontend && npm run build",
```

**Verify**: Run `npm run lint` from root — should lint frontend code, not fail

## Test plan

- Run `npm run format:check` — should run prettier check on frontend, exit cleanly
- Run `npm run test:all` — should run vitest on frontend

## Done criteria

- [ ] `npm run lint` runs frontend linting and exits 0
- [ ] `npm run install:all` installs both api/ and frontend/ deps
- [ ] No remaining `backend/api` references in `package.json`
- [ ] `plans/README.md` status row updated

## STOP conditions

- If `api/package.json` gains scripts later and the simplified scripts miss
  them, the plan is stale — report

## Maintenance notes

- When backend testing infra is added to api/, update `test:all` to include it
