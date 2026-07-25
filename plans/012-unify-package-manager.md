# Plan 012: Unify package manager across monorepo

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- package.json frontend/package.json api/package.json`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

Root uses npm (`package-lock.json`), while `frontend/` and `api/` use pnpm
(`pnpm-lock.yaml`). The root scripts try to `npm install` into pnpm-managed
directories, which can produce incompatible lockfiles or miss pnpm-specific
config (like `onlyBuiltDependencies` at `frontend/package.json:6`). This
causes CI failures and confusing install behavior.

## Current state

- Root: `package-lock.json` (npm)
- `frontend/`: `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- `api/`: `pnpm-lock.yaml`

Root `package.json:7` scripts use `npm install` for subdirectories.

**Recommended choice**: pnpm everywhere (frontend/ and api/ already use it,
and pnpm is faster with better monorepo support via workspaces).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install | `pnpm install` | exit 0 |
| Build | `cd frontend && pnpm build` | exit 0 |

## Scope

**In scope**:
- `package.json` — update `install:all` script to use pnpm
- `pnpm-workspace.yaml` — create at root to wire the monorepo
- Root `package-lock.json` and `node_modules/` — delete after migration

**Out of scope**:
- Root `package.json` dependencies — they stay (devDependencies for playwright, vitest, etc.)
- CI config — update separately if needed

## Git workflow

- Branch: `advisor/012-unify-package-manager`

## Steps

### Step 1: Create root pnpm-workspace.yaml

```yaml
packages:
  - 'frontend'
  - 'api'
```

### Step 2: Update install:all script

In root `package.json`, change `install:all` to:

```
"install:all": "pnpm install"
```

With pnpm workspaces, `pnpm install` at root installs all workspace packages.

### Step 3: Delete old lockfiles and node_modules

```bash
rm -f package-lock.json
```

Do NOT delete individual package `node_modules/` — let pnpm handle them on
next install.

### Step 4: Install with pnpm

```bash
pnpm install
```

**Verify**: `pnpm install` exits 0. `cd frontend && pnpm build` exits 0.

### Step 5: Verify all scripts still work

```bash
cd frontend && pnpm test --run   # tests pass
cd frontend && pnpm lint          # lint passes
cd frontend && pnpm build         # build succeeds
```

## Test plan

- `cd frontend && pnpm test --run` — verify tests pass with pnpm-installed deps
- `cd frontend && pnpm build` — verify production build works

## Done criteria

- [ ] `pnpm-workspace.yaml` exists at root
- [ ] Root `install:all` script uses `pnpm install`
- [ ] No `package-lock.json` committed
- [ ] `pnpm install` exits 0
- [ ] `cd frontend && pnpm test --run` exits 0
- [ ] `cd frontend && pnpm build` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- If CI uses a specific npm-only feature (e.g., `npm ci` for reproducible builds),
  report back — need to update CI config too
- If root devDependencies have issues with pnpm's stricter dependency resolution,
  move them to `frontend/package.json`

## Maintenance notes

- After this change, all `npm install` commands should be replaced with `pnpm install`
- CI/CD may need a `pnpm install --frozen-lockfile` equivalent of `npm ci`
- The pnpm workspace enables future monorepo tooling (shared configs, lint scripts)
