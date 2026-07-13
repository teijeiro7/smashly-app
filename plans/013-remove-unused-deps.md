# Plan 013: Remove unused dependencies from root package.json

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- package.json`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

Root `package.json` declares 5 production dependencies that are never imported
anywhere in the codebase. They waste install time, add disk space (~5MB+),
increase security surface, and confuse developers about which libraries are
actually in use.

## Current state

Unused deps confirmed by grep (zero import hits across entire `frontend/src/`):

| Dependency | Reason unused |
|-----------|--------------|
| `class-transformer` ^0.5.1 | Not imported anywhere |
| `class-validator` ^0.14.3 | Not imported anywhere |
| `react-hot-toast` ^2.6.0 | Replaced by `sileo` for toasts |
| `react-beautiful-dnd` ^13.1.1 | Replaced by `@dnd-kit` |
| `dotenv` ^17.2.3 | Vite handles env vars natively |

Also questionable (but verify before removing):
- `ts-node` ^10.9.2 — may be used in scripts
- `react-router-dom` ^7.9.4 — frontend uses `@tanstack/react-router`

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Verify imports | `grep -rn "from 'class-transformer\|require('class-transformer" frontend/src/` | no matches |
| Build | `cd frontend && pnpm build` | exit 0 |
| Test | `cd frontend && pnpm test --run` | exit 0 |

## Scope

**In scope**:
- `package.json` — remove `dependencies` entries
- After plan 012 (pnpm) migration, update lockfile

**Out of scope**:
- Root `devDependencies` — those are intentional (playwright, vitest, undici)
- `frontend/package.json` dependencies
- Removing from `node_modules` — reinstalling handles that

## Git workflow

- Branch: `advisor/013-remove-unused-deps`

## Steps

### Step 1: Verify each dep is truly unused

```bash
for dep in class-transformer class-validator react-hot-toast react-beautiful-dnd dotenv; do
  echo "=== $dep ==="
  rg -r "from '$dep'|from \"$dep\"|require\('$dep'\)" frontend/src/ --no-filename | head -3
done
```

### Step 2: Remove confirmed unused deps

Delete from `package.json` `dependencies` object:
- `class-transformer`
- `class-validator`
- `react-hot-toast`
- `react-beautiful-dnd`
- `dotenv`

### Step 3: Move dev-only deps if needed

If `ts-node` or `react-router-dom` are unused, consider removing those too,
but verify first.

**Verify**: `cd frontend && pnpm test --run` → all pass

## Test plan

- Run full test suite to verify nothing breaks
- Build production bundle to verify no import errors

## Done criteria

- [ ] 5 unused deps removed from `package.json`
- [ ] `cd frontend && pnpm test --run` exits 0
- [ ] `cd frontend && pnpm build` exits 0
- [ ] `grep -rn "class-transformer\|class-validator\|react-hot-toast\|react-beautiful-dnd\|dotenv" frontend/src/` returns no imports
- [ ] `plans/README.md` status row updated

## STOP conditions

- If any dep has a transitive dependency that another file relies on,
  report back with the specific dependency chain
