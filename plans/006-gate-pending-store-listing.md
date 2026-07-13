# Plan 006: Gate pending store listing behind admin authentication

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- api/v1/stores/index.ts`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

The `GET /api/v1/stores` endpoint with `?verified=false` returns ALL pending
store applications including PII (CIF/NIF, contact email, phone number, legal
name, location). The `token` variable extracted from the Authorization header
on line 28 is never used for authentication — any unauthenticated visitor can
enumerate pending stores.

## Current state

```typescript
// api/v1/stores/index.ts:25-49
async function handleGetAll(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const verified = url.searchParams.get('verified');
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;                   // ← extracted but NEVER used

  const query = supabaseAdmin.from('stores').select('*');

  if (verified === 'true') {
    query.eq('status', 'verified');
  } else if (verified === 'false') {
    query.eq('status', 'pending');
  }

  const { data, error } = await query;  // ← no auth check before this
  // ... returns all results ...
}
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `cd frontend && npx tsc --noEmit` | exit 0 |

## Scope

**In scope**:
- `api/v1/stores/index.ts` — add auth guard for non-verified queries

**Out of scope**:
- The `GET /api/v1/stores?verified=true` behavior — stays public
- Other endpoints that may leak store info (handled in other plans)
- The frontend `adminService.ts` — already handles admin API calls correctly

## Git workflow

- Branch: `advisor/006-store-listing-auth`

## Steps

### Step 1: Add auth check for non-public queries

In `handleGetAll`, after parsing `verified` and before running the query, add:

```typescript
if (verified !== 'true') {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);
  if (!(await isAdmin(user.id))) return forbidden(res);
}
```

This requires importing `getAuthUser`, `isAdmin`, `unauthorized`, and
`forbidden` — all already imported on line 3.

**Verify**: `grep -n "getAuthUser\|isAdmin\|unauthorized\|forbidden" api/v1/stores/index.ts` → shows all imported and used

### Step 2: Remove unused `token` variable

Delete lines 28-30 (the `token` const that was extracted but never used).
This avoids lint warnings and clarifies intent.

**Verify**: `grep "const token" api/v1/stores/index.ts` → no output

## Test plan

- Manual: `curl -v /api/v1/stores?verified=false` without auth → 401
- Manual: `curl -v /api/v1/stores?verified=true` without auth → 200 (public)
- Existing frontend admin tests use `adminService.ts` which properly sends auth

## Done criteria

- [ ] `api/v1/stores/index.ts` requires admin auth for non-public queries
- [ ] `api/v1/stores/index.ts` still allows public access for `verified=true`
- [ ] No unused `token` variable in `handleGetAll`
- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- If the frontend relies on unauthenticated access to pending/status data for
  any non-admin flow, report back with details

## Maintenance notes

- If a "public store listing" feature is added later, ensure the public path
  explicitly passes `verified=true` and handles the filtered response
