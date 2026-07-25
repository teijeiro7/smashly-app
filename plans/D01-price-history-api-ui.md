# Plan D01: Expose price history as API route + UI chart

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- api/ frontend/src/`

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

The `price_history` table is populated daily by scrapers, but zero API routes
or frontend code read it. Users want price trends to time their purchases —
this is documented in `docs/functionalities-v1.0.md:96-98` and
`docs/PREMIUM_FEATURES.md:63` as "base técnica ya disponible". The data
collection infra is complete; only the read path is missing.

## Current state

- `price_history` table has RLS allowing public reads
- No API endpoint exposes it
- No frontend component reads it
- Scrapers in `src/scrapers/sync_catalog.py:290` write to it on every price change

## Scope

**In scope**:
- New API endpoint: `GET /api/v1/rackets/:id/price-history`
- Frontend chart component on `RacketDetailPage`

**Out of scope**:
- Real-time price updates (the scraper runs daily — the chart shows historical data)
- Price alerts (plan D03 — separate feature)

## Git workflow

- Branch: `advisor/D01-price-history`

## Steps

### Step 1: Create API endpoint

Create `api/v1/rackets/[id]/price-history.ts`:

- Accept `GET` with `id` param + optional `days` (default 90) and `store` filter
- Query `price_history` table filtered by `racket_id`
- Return sorted price points with store name, date, price

Use shared `setCorsHeaders`, `handleOptions` from auth.ts. No auth required
(public read matches the table's RLS policy).

### Step 2: Add frontend service method

Add to `racketService.ts`:
- `getPriceHistory(racketId, days?, store?)` → fetch from the new API endpoint

### Step 3: Add chart to RacketDetailPage

Use `recharts` (already in dependencies) to render a line chart showing price
over time, with one line per store.

Add the chart below the current price display. Use the app's existing styled
components pattern for styling (`styled-components` with CSS variables).

### Step 4: Add API endpoint to vercel.json rewrites

```json
{
  "source": "/api/v1/rackets/:id/price-history",
  "destination": "/api/v1/rackets/[id]/price-history"
}
```

## Test plan

- Manual: Load a racket detail page with known price history → see chart render
- Manual: `curl /api/v1/rackets/1/price-history?days=30` → returns JSON array

## Done criteria

- [ ] `api/v1/rackets/[id]/price-history.ts` exists and returns price history
- [ ] `vercel.json` has rewrite rule for the new endpoint
- [ ] `RacketDetailPage` shows a price history chart
- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `cd frontend && pnpm test --run` exits 0
