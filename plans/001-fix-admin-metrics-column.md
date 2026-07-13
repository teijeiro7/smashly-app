# Plan 001: Fix admin metrics to use `status` column instead of dropped `verified`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat b4b881f..HEAD -- api/admin/metrics.ts`
> If the file changed since this plan was written, compare "Current state"
> excerpts against the live code before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

The admin dashboard metrics for "verified stores" and "pending stores" always
show 0 because `api/admin/metrics.ts` queries a `verified` boolean column that
was dropped during the stores schema migration
(`supabase/migrations/20260706000001_stores_dashboard.sql:27`). Stores now use
a `status` column with values `'pending' | 'verified' | 'rejected'`. Admins
cannot see how many stores are pending approval — a critical management metric.

## Current state

```typescript
// api/admin/metrics.ts:20-34
async function getVerifiedStoresCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from('stores')
    .select('*', { count: 'exact', head: true })
    .eq('verified', true);   // ← column no longer exists
  return count || 0;
}

async function getPendingStoresCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from('stores')
    .select('*', { count: 'exact', head: true })
    .eq('verified', false);  // ← column no longer exists
  return count || 0;
}
```

The variable names in the response object at line 77 use `totalStores` (from
`getVerifiedStoresCount`) and `pendingRequests` (from `getPendingStoresCount`).
These variable names are fine — only the query predicate needs fixing.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Test | `cd frontend && npx vitest run` | all pass |
| Build | `cd frontend && npx tsc --noEmit` | exit 0, no errors |

## Scope

**In scope**:
- `api/admin/metrics.ts` — fix the two queries

**Out of scope**:
- Any other file in api/admin/
- The frontend dashboard page — API response shape does not change

## Git workflow

- Branch: `advisor/001-fix-admin-metrics-column`
- Commit message style: `fix(admin): ` (match repo conventions)
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Fix `getVerifiedStoresCount`

Change line 24 from `.eq('verified', true)` to `.eq('status', 'verified')`.

**Verify**: `grep -n "eq.*status.*verified" api/admin/metrics.ts` → shows the line

### Step 2: Fix `getPendingStoresCount`

Change line 32 from `.eq('verified', false)` to `.eq('status', 'pending')`.

**Verify**: `grep -n "eq.*status.*'pending'" api/admin/metrics.ts` → shows the line

### Step 3: Verify no other references to `.eq('verified',`

```
grep -rn "\.eq.*verified" api/
```

Confirm only false positives or non-store-table usages remain.

**Verify**: the grep output above — should show no `.eq('verified',` in store-related queries

## Test plan

- Existing admin tests should still pass (the API response shape is unchanged)
- This change is a straightforward column rename — existing admin service tests
  (`frontend/src/__tests__/unit/services/adminService.test.ts`) mock fetch and
  won't catch the fix, but there's no API-specific test infrastructure yet
  (see plan 010)

**Verify**: `cd frontend && npx vitest run` → all pass

## Done criteria

- [ ] `api/admin/metrics.ts` uses `.eq('status', 'verified')` and `.eq('status', 'pending')`
- [ ] No `.eq('verified',` remains in `api/admin/`
- [ ] `cd frontend && npx vitest run` exits 0
- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `stores` table schema has changed since this plan was written and the
  column name differs from `status`
- Any test was already failing before your change

## Maintenance notes

- If the stores schema adds more status values (e.g. `'suspended'`), add
  corresponding metric functions here
- The `totalStores` variable currently maps to verified stores — if the intent
  is to count ALL stores regardless of status, change to no filter
