# Plan D05: Rich store analytics dashboard

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- api/v1/analytics/ frontend/src/pages/StoreDashboard.tsx`

## Status

- **Priority**: P3
- **Effort**: L
- **Risk**: LOW
- **Depends on**: 003 (analytics auth), 004 (atomic counters)
- **Category**: direction
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

Store analytics currently tracks only raw view/click counters with no trends,
time series, or comparative data. Per `docs/PREMIUM_FEATURES.md:131-136`,
the Store Pro tier promises rich analytics (competitor comparison, conversion
rates, search trends) at 20-40€/mo. Without analytics, stores can't measure
ROI of being listed — reducing likelihood of upgrading from the free tier.

## Current state

- `api/v1/analytics/store.ts` — bare POST handler tracking `views_count` + `clicks_count`
- `frontend/src/pages/StoreDashboard.tsx` — shows 3 numeric cards (views, clicks, rating)
- No trends, no charts, no time-series data

## Scope

**In scope**:
- Time-series analytics endpoint (views/clicks per day/week/month)
- Charts on StoreDashboard using `recharts`
- Period comparison (this period vs last period)

**Out of scope**:
- Competitor comparison (store-vs-store analytics)
- Search trend data
- Premium billing gating

## Git workflow

- Branch: `advisor/D05-store-analytics`

## Steps

### Step 1: Create analytics tracking table

Create `api_event_log` table (store_id, event_type, created_at) to record
individual events with timestamps instead of just counters. This enables
time-series queries.

```sql
CREATE TABLE IF NOT EXISTS store_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Step 2: Update analytics tracking

Modify `api/v1/analytics/store.ts` to ALSO insert a row into
`store_analytics_events` (keep the counter for fast reads, add the log for
time-series queries).

### Step 3: Create time-series endpoint

`GET /api/v1/analytics/store/:id/timeline?period=7d|30d|90d`:
- Aggregate `store_analytics_events` by day
- Return `[{ date, views, clicks }]`
- Include "previous period" data for comparison

### Step 4: Add charts to StoreDashboard

Add `recharts`-based:
- Line chart: views over time
- Line chart: clicks over time (or combined)
- Summary cards: change % vs previous period

Model chart styling after the existing `recharts` usage in the app.

## Test plan

- Manual: Generate test events via the analytics endpoint, verify charts render
- Unit tests for the time-series aggregation query

## Done criteria

- [ ] `store_analytics_events` table exists with proper schema
- [ ] Analytics endpoint logs individual events (not just counters)
- [ ] Time-series endpoint returns aggregated data
- [ ] StoreDashboard shows interactive charts
- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `cd frontend && pnpm test --run` exits 0
