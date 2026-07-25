# Plan 007: Trim catalog rackets(*) to specific fields

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- api/v1/stores/catalog/`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

The store catalog endpoint at `api/v1/stores/catalog/[storeId].ts:78` loads
`racket:rackets(*)` — the entire racket row (~50 columns including full specs,
radar data, tester scores, 3-store prices) per catalog item. A page of 100
items ships ~200-500KB of unnecessary data per request. Adding a store's
inventory page load multiplies this across every store catalog load.

## Current state

```typescript
// api/v1/stores/catalog/[storeId].ts:78
const { data: prices, error, count } = await supabaseAdmin
  .from('store_prices')
  .select('*, racket:rackets(*)')  // ← loads ALL racket columns
  .eq('store_id', storeId)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1);
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `cd frontend && npx tsc --noEmit` | exit 0 |

## Scope

**In scope**:
- `api/v1/stores/catalog/[storeId].ts` — reduce selected racket fields

**Out of scope**:
- Other `select('*')` patterns — handled across many files, left for broader refactor
- Frontend types — the response shape should be backward-compatible (subset of existing fields)

## Git workflow

- Branch: `advisor/007-catalog-overfetching`

## Steps

### Step 1: Determine required fields

Check the frontend components that consume catalog data to determine which
racket fields are actually needed in the catalog list view. Look at:
- `frontend/src/components/features/StoreCatalogManager.tsx`
- `frontend/src/pages/PublicStorePage.tsx`

Typically the catalog list view needs: `id, name, brand, model, images, specs`
(for display) and `store_prices.*` (for price display). Detail views that need
more fields should call the detail endpoint.

### Step 2: Replace `racket:rackets(*)` with specific fields

```typescript
.select('*, racket:rackets(id, name, brand, model, images, specs)')
```

But keep `images` — it's needed for thumbnails. And `specs` for technical
summary. If detail fields are needed, use the existing price detail endpoint
at `[storeId]/[priceId].ts` to load the full racket.

**Verify**: `grep "racket:rackets" api/v1/stores/catalog/[storeId].ts` → shows specific fields, not `(*)`

## Test plan

- Manual: Call catalog list endpoint before and after — verify response doesn't
  include radar/tester/3-store-price fields but still renders correctly in UI
- No new tests needed — existing frontend should work if fields are a superset

## Done criteria

- [ ] `api/v1/stores/catalog/[storeId].ts` selects specific racket fields instead of `(*)`
- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] Frontend catalog UI still renders correctly
- [ ] `plans/README.md` status row updated

## STOP conditions

- If the frontend catalog uses fields not in the reduced select list, add them

## Maintenance notes

- When new fields are needed in the catalog list, add them to the select list
  explicitly — never revert to `(*)`
- The `[storeId]/[priceId].ts` detail endpoint can continue using full racket data
