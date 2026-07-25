# Plan 004: Fix analytics counter race condition with atomic increment

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- api/v1/analytics/store.ts supabase/migrations/`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

The analytics counter uses a read-SELECT followed by write-UPDATE pattern.
Under concurrent Vercel serverless invocations (multiple users viewing the same
store page at once), increments collide and counts drift low. For example, 5
simultaneous views might produce only 1-2 increments instead of 5. This makes
the analytics data unreliable.

## Current state

```typescript
// api/v1/analytics/store.ts:37-47
const { data: store } = await supabaseAdmin
  .from('stores')
  .select(column)         // read
  .eq('id', store_id)
  .single();

const currentValue = store?.[column as keyof typeof store] ?? 0;

const { error } = await supabaseAdmin
  .from('stores')
  .update({ [column]: Number(currentValue) + 1 })  // write
  .eq('id', store_id);
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `cd frontend && npx tsc --noEmit` | exit 0 |

## Scope

**In scope**:
- `api/v1/analytics/store.ts` — replace read-modify-write with atomic operation

**Out of scope**:
- Adding auth (plan 003) — compose with those changes
- Other counter fields in other tables

## Git workflow

- Branch: `advisor/004-analytics-atomic-counter`

## Steps

### Step 1: Replace with atomic increment

Supabase JS client doesn't have a native `.inc()` method for raw REST, but the
Supabase REST API supports `PATCH` with `?column=increment` syntax. Since this
handler uses `supabaseAdmin` (the JS client), use a `supabase.rpc()` call with
a raw SQL function, or use the `supabaseAdmin.from('stores').update(...)` with
a raw expression.

The simplest approach: use `supabaseAdmin.rpc()` with a function, but since
we want to avoid creating a DB migration, use the `PostgrestFilter` approach:

```typescript
const { error } = await supabaseAdmin
  .from('stores')
  .update({ [column]: supabaseAdmin.rpc('...') })
```

Actually — the simplest Supabase approach is to issue a raw SQL update via
`supabaseAdmin.rpc` with a SQL function. But since we can't add a function
easily, the simplest alternative: use the REST API directly with PostgREST's
increment syntax.

For pure Supabase JS client, the cleanest approach: use an RPC function:

Create a migration at `supabase/migrations/20260713000001_increment_counter.sql`:

```sql
CREATE OR REPLACE FUNCTION increment_store_counter(store_id UUID, col TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('UPDATE stores SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', col, col)
  USING store_id;
END;
$$;
```

Then in the handler:

```typescript
const { error } = await supabaseAdmin.rpc('increment_store_counter', {
  store_id,
  col: column,
});
```

**Or simpler** — skip RPC and use fetch to PostgREST directly with the
`Prefer: resolution=merge-duplicates` header and the Supabase REST API's
special `?<column>=increment` syntax. But this requires bypassing the client.

Simplest correct fix that doesn't need a migration: fetch the current value
inside the UPDATE using a subquery:

```typescript
const { error } = await supabaseAdmin
  .from('stores')
  .update({ [column]: supabaseAdmin.rpc('...') })
```

Actually no — the simplest approach requiring no migration: use `fetch` to
call the Supabase REST API with the `increment` operator:

```typescript
const { error } = await supabaseAdmin
  .from('stores')
  .update({ [column]: `inc` })
  .eq('id', store_id);
```

No, that won't work with the JS client either. Let me think of the truly
simplest approach...

**Recommended approach**: Remove the read + local increment and instead use
the Supabase postgrest-js `update` with a raw value. Since we're using
supabaseAdmin, we can execute the SQL via `supabaseAdmin.rpc()`:

Create `supabase/migrations/20260713000001_increment_counter.sql`:

```sql
CREATE OR REPLACE FUNCTION increment_store_counter(store_id uuid, col text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('UPDATE stores SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', col, col) USING store_id;
END;
$$;
```

This is safe: the `SECURITY DEFINER` runs as the migration owner
(superuser/high-privilege), and `EXECUTE` with `format('... %I', col)` safely
escapes the column name. The column value `col` comes from a server-side enum
check (`view` or `click`) done before this call.

Then in handler:

```typescript
async function handleTrack(req, res) {
  // ... existing body validation ...
  const column = event === 'view' ? 'views_count' : 'clicks_count';

  const { error } = await supabaseAdmin.rpc('increment_store_counter', {
    store_id,
    col: column,
  });
  // ... handle error, respond ...
}
```

**Verify**: `grep -n "rpc.*increment_store_counter" api/v1/analytics/store.ts` → shows the rpc call

## Test plan

Manual: Send 10 concurrent requests to the endpoint and verify the counter
incremented by exactly 10 (no lost updates).

## Done criteria

- [ ] `supabase/migrations/20260713000001_increment_counter.sql` exists with the function
- [ ] `api/v1/analytics/store.ts` uses atomic increment (no read-modify-write)
- [ ] No `.select(column)` for counters in the analytics handler
- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- If the Supabase project is not managed locally (no ability to run migrations),
  report back — alternative approach needed

## Maintenance notes

- The function uses `EXECUTE` with `format('%I')` which is safe against SQL
  injection as long as the `col` parameter is validated server-side before
  calling (which it is — line 31 checks `['view', 'click'].includes(event)`)
