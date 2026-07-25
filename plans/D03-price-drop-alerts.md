# Plan D03: Price drop alerts — subscribe and notify

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- api/ frontend/src/ supabase/migrations/`

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: D01 (price history data infra + understanding of price_history schema)
- **Category**: direction
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

The notifications schema already has a `price_drop` notification type
(`supabase/migrations/20260706000003_messaging.sql:83`), price history data
is accumulating daily, and `docs/PREMIUM_FEATURES.md:63-69` flags this as the
highest-conversion premium feature ("saving 30€ justifies a subscription
forever"). Users want "notify me when this drops to X€."

## Current state

- `notifications.type` supports `price_drop`
- `price_history` populated by scraper
- Zero user-facing UI or backend logic

## Scope

**In scope**:
- `price_watch` DB table (user_id + racket_id + target_price + active)
- API endpoint to create/manage watches
- Periodic serverless check (Vercel Cron) vs new price data
- Notification flow when price drops below target

**Out of scope**:
- Premium billing integration (add later if monetizing)
- Email notifications (push/in-app only for now)

## Git workflow

- Branch: `advisor/D03-price-drop-alerts`

## Steps

### Step 1: Create price_watch table migration

```sql
CREATE TABLE IF NOT EXISTS price_watch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  racket_id INTEGER NOT NULL REFERENCES rackets(id) ON DELETE CASCADE,
  target_price NUMERIC NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, racket_id)
);
```

### Step 2: Create API endpoints

- `POST /api/v1/price-watch` — create watch (auth required)
- `DELETE /api/v1/price-watch/:id` — remove watch
- `GET /api/v1/price-watch` — list user's watches

### Step 3: Create check cron

Create `api/cron/check-price-drops.ts` — Vercel Cron job (configured via
`vercel.json` `crons` section) that:
1. Fetches all active watches
2. For each, checks current price vs target_price
3. If current price <= target_price, creates a notification + marks watch as inactive

```json
// vercel.json crons section
"crons": [
  {
    "path": "/api/cron/check-price-drops",
    "schedule": "0 8 * * *"
  }
]
```

### Step 4: Add UI

- "Notify me at €X" button on RacketDetailPage
- Modal or inline form for target price input
- List active watches in user profile/dashboard

## Test plan

- Manual: Create price watch, manually lower price in DB, run cron → notification appears
- Unit tests for the cron logic (isolated from the cron trigger)

## Done criteria

- [ ] `price_watch` table exists with proper schema
- [ ] API endpoints for CRUD operations work with auth
- [ ] Vercel Cron checks daily and fires notifications
- [ ] UI for creating and managing watches on RacketDetailPage
- [ ] `cd frontend && npx tsc --noEmit` exits 0
