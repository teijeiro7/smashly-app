# Rate Limiting & Route Security Design

**Date:** 2026-05-10  
**Branch:** feature/next-player-racket  
**Scope:** Backend rate limiting, route authorization hardening, racket ownership model, frontend route protection

---

## Problem

Several API routes are either unprotected or use `optionalAuth` when they should require authentication or admin privileges. AI endpoints are fully public, enabling abuse. The frontend `/dashboard` route has no auth guard. Rackets have no ownership model, so any authenticated user (or even unauthenticated) can mutate them.

---

## 1. Rate Limiting Module

**New file:** `backend/api/src/middleware/rateLimits.ts`

All limiters defined and exported from one place. Route files import what they need.

| Export | Window | Max | Key by | Used on |
|---|---|---|---|---|
| `globalLimiter` | 15 min | 500 | IP | All `/api/v1/` (moved from `app.ts`) |
| `authLimiter` | 1 min | 10 | IP | `/api/v1/auth/` (moved from `app.ts`) |
| `aiLimiter` | 15 min | 10 | user ID (`req.user.id`) | Recommendation generate endpoints (applied after auth middleware so user is available) |
| `proxyLimiter` | 1 min | 60 | IP | Image proxy |
| `comparisonLimiter` | 15 min | 20 | IP | Public comparison POST |

`aiLimiter` uses a custom `keyGenerator` returning `req.user?.id ?? req.ip` — keys by authenticated user, not IP, so VPN rotation doesn't bypass it.

`app.ts` removes its inline limiter definitions and imports `globalLimiter`, `authLimiter` from this module instead.

---

## 2. DB Migration: Racket Ownership

**New column:** `store_id UUID REFERENCES stores(id) ON DELETE SET NULL` on the `rackets` table.

- Nullable: existing rackets have no owner store.
- Populated when a store creates/claims a racket.
- `ON DELETE SET NULL`: deleting a store orphans its rackets (does not cascade-delete them).

SQL:
```sql
ALTER TABLE rackets
  ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE SET NULL;
```

Update `Racket` TypeScript type to include `store_id?: string | null`.

---

## 3. Racket Ownership Middleware

**New file:** `backend/api/src/middleware/requireRacketOwner.ts`

Logic (applied to PUT/DELETE `/rackets/:id`):

1. No `req.user` → 401
2. `req.user.role === 'admin'` → pass through
3. Non-admin:
   a. Fetch racket by `req.params.id` from DB
   b. If racket not found → 404
   c. Fetch store where `admin_user_id = req.user.id`
   d. If no store, or `racket.store_id !== store.id` → 403
   e. Match → pass through

Uses Supabase service client directly (same pattern as other middleware). Does not call `RacketService` (avoids circular deps) — queries Supabase directly.

---

## 4. Backend Route Fixes

### `routes/rackets.ts`
| Route | Before | After |
|---|---|---|
| `PUT /:id` | `optionalAuth` | `authenticateUser, requireRacketOwner` |
| `DELETE /:id` | `optionalAuth` | `authenticateUser, requireRacketOwner` |
| `POST /bulk-update` | `optionalAuth` | `authenticateUser, requireAdmin` |

### `routes/recommendationRoutes.ts`
| Route | Before | After |
|---|---|---|
| `POST /generate` | public | `authenticate, aiLimiter` |
| `POST /generate-rag` | public | `authenticate, aiLimiter` |
| `POST /cache/clear` | public | `authenticate, requireAdmin` |
| `GET /cache/stats` | public | `authenticate, requireAdmin` |

### `routes/users.ts`
| Route | Before | After |
|---|---|---|
| `GET /stats` | `authenticateUser` | `authenticateUser, requireAdmin` |

### `routes/stores.ts`
Remove `router.use(authenticateUser)` blanket middleware. Apply per-route:
| Route | Access |
|---|---|
| `GET /` | public |
| `GET /me` | `authenticateUser` |
| `GET /:id` | public |
| `POST /` | `authenticateUser` |
| `PUT /:id` | `authenticateUser` |
| `DELETE /:id` | `authenticateUser` |

### `routes/proxyRoutes.ts`
- `GET /image` → add `proxyLimiter`

### `routes/comparisonRoutes.ts`
- `POST /` → add `comparisonLimiter`

### `routes/recommendationRoutes.ts` — import cleanup
Import `requireAdmin` from `middleware/requireAdmin.ts` (consistent with `admin.ts`). Don't use the one in `auth.ts`.

---

## 5. Frontend Route Protection

**File:** `frontend/src/App.tsx:159`

`/dashboard` route is not wrapped in `<ProtectedRoute>`. Fix:

```tsx
// Before
<Route path='/dashboard' element={<LazyRoute><PlayerDashboard /></LazyRoute>} />

// After
<Route
  path='/dashboard'
  element={
    <ProtectedRoute>
      <LazyRoute><PlayerDashboard /></LazyRoute>
    </ProtectedRoute>
  }
/>
```

---

## 6. Files Changed Summary

| File | Action |
|---|---|
| `backend/api/src/middleware/rateLimits.ts` | Create |
| `backend/api/src/middleware/requireRacketOwner.ts` | Create |
| `backend/api/src/app.ts` | Remove inline limiters, import from rateLimits |
| `backend/api/src/routes/rackets.ts` | Fix PUT/DELETE/bulk-update auth |
| `backend/api/src/routes/recommendationRoutes.ts` | Add auth + limits + admin gates |
| `backend/api/src/routes/users.ts` | Add requireAdmin to /stats |
| `backend/api/src/routes/stores.ts` | Restructure per-route auth |
| `backend/api/src/routes/proxyRoutes.ts` | Add proxyLimiter |
| `backend/api/src/routes/comparisonRoutes.ts` | Add comparisonLimiter |
| `backend/api/src/types/racket.ts` | Add `store_id` field |
| `frontend/src/App.tsx` | Wrap /dashboard in ProtectedRoute |
| DB migration SQL | Add `store_id` to rackets table |

---

## Non-Goals

- Store racket creation flow (UI for stores to submit rackets) — separate feature
- `GET /health/deep` hardening — low priority, no sensitive secrets exposed
- `GET /auth/me` auth middleware — intentionally tolerates missing token (returns null gracefully)
- Backfilling `store_id` on existing rackets — out of scope, nullable handles it
