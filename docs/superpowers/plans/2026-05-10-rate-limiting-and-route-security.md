# Rate Limiting & Route Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the Smashly API with granular rate limits, fix unprotected mutating routes, add racket ownership via `store_id`, and guard the frontend `/dashboard` route.

**Architecture:** A new `rateLimits.ts` middleware module centralizes all Express rate limiters. A new `requireRacketOwner.ts` middleware enforces admin-or-store-owner access on racket mutations by querying Supabase. A DB migration adds `store_id` to the rackets table. Route files are updated to apply the correct middleware chains. The React `/dashboard` route gains a `<ProtectedRoute>` wrapper.

**Tech Stack:** Express, express-rate-limit v7, Supabase JS client v2, TypeScript, Vitest, React Router v6

---

## File Map

| File | Action |
|---|---|
| `backend/api/src/middleware/rateLimits.ts` | Create — all named rate limiters + exported `aiKeyGenerator` |
| `backend/api/src/middleware/requireRacketOwner.ts` | Create — ownership middleware |
| `backend/api/src/__tests__/unit/rateLimits.test.ts` | Create — unit tests for exports and key generator |
| `backend/api/src/__tests__/unit/requireRacketOwner.test.ts` | Create — unit tests with mocked Supabase |
| `backend/api/src/app.ts` | Modify — remove inline limiters, import from rateLimits |
| `backend/api/src/routes/rackets.ts` | Modify — fix PUT/DELETE/bulk-update auth |
| `backend/api/src/routes/recommendationRoutes.ts` | Modify — add auth + aiLimiter + admin gates |
| `backend/api/src/routes/users.ts` | Modify — add requireAdmin to /stats |
| `backend/api/src/routes/stores.ts` | Modify — per-route auth, make GET public |
| `backend/api/src/routes/proxyRoutes.ts` | Modify — add proxyLimiter |
| `backend/api/src/routes/comparisonRoutes.ts` | Modify — add comparisonLimiter |
| `backend/api/src/types/racket.ts` | Modify — add `store_id` field to `Racket` interface |
| `backend/api/migrations/add_store_id_to_rackets.sql` | Create — DB migration |
| `frontend/src/App.tsx` | Modify — wrap /dashboard in ProtectedRoute |

---

## Task 1: Rate Limits Module

**Files:**
- Create: `backend/api/src/middleware/rateLimits.ts`
- Create: `backend/api/src/__tests__/unit/rateLimits.test.ts`

- [ ] **Step 1: Write the failing tests**

`backend/api/src/__tests__/unit/rateLimits.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  globalLimiter,
  authLimiter,
  aiLimiter,
  proxyLimiter,
  comparisonLimiter,
  aiKeyGenerator,
} from '../../middleware/rateLimits';
import type { Request } from 'express';
import type { RequestWithUser } from '../../types';

describe('rateLimits — exports', () => {
  it('globalLimiter is an Express middleware function', () => {
    expect(typeof globalLimiter).toBe('function');
  });
  it('authLimiter is an Express middleware function', () => {
    expect(typeof authLimiter).toBe('function');
  });
  it('aiLimiter is an Express middleware function', () => {
    expect(typeof aiLimiter).toBe('function');
  });
  it('proxyLimiter is an Express middleware function', () => {
    expect(typeof proxyLimiter).toBe('function');
  });
  it('comparisonLimiter is an Express middleware function', () => {
    expect(typeof comparisonLimiter).toBe('function');
  });
});

describe('aiKeyGenerator', () => {
  it('returns user.id when authenticated', () => {
    const req = { user: { id: 'user-abc', email: '', role: 'player' }, ip: '1.2.3.4' } as RequestWithUser;
    expect(aiKeyGenerator(req as unknown as Request)).toBe('user-abc');
  });

  it('falls back to IP when no user', () => {
    const req = { ip: '5.6.7.8' } as Request;
    expect(aiKeyGenerator(req)).toBe('5.6.7.8');
  });

  it('returns "anonymous" when no user and no IP', () => {
    const req = {} as Request;
    expect(aiKeyGenerator(req)).toBe('anonymous');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend/api && npx vitest run src/__tests__/unit/rateLimits.test.ts
```

Expected: `Cannot find module '../../middleware/rateLimits'`

- [ ] **Step 3: Create the module**

`backend/api/src/middleware/rateLimits.ts`:
```typescript
import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import type { RequestWithUser } from '../types';

export function aiKeyGenerator(req: Request): string {
  const user = (req as RequestWithUser).user;
  return user?.id ?? req.ip ?? 'anonymous';
}

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: {
    error: 'Demasiados intentos. Por favor, espere un minuto.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: aiKeyGenerator,
  message: {
    error: 'Too many AI requests. Please wait before trying again.',
    code: 'AI_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const proxyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: {
    error: 'Too many image proxy requests.',
    code: 'PROXY_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const comparisonLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Too many comparison requests. Please wait before trying again.',
    code: 'COMPARISON_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend/api && npx vitest run src/__tests__/unit/rateLimits.test.ts
```

Expected: all 8 tests pass

- [ ] **Step 5: Update `app.ts` to use the module**

In `backend/api/src/app.ts`, replace the inline limiter definitions and their imports:

Remove lines 6 (`import rateLimit from 'express-rate-limit';`) and lines 83–107 (both `limiter` and `authLimiter` definitions).

Add at the top with other imports:
```typescript
import { globalLimiter, authLimiter } from './middleware/rateLimits';
```

Replace lines 106–107:
```typescript
app.use('/api/v1/', limiter);
app.use('/api/v1/auth/', authLimiter);
```
With:
```typescript
app.use('/api/v1/', globalLimiter);
app.use('/api/v1/auth/', authLimiter);
```

- [ ] **Step 6: Verify app still compiles**

```bash
cd backend/api && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
cd backend/api && git add src/middleware/rateLimits.ts src/__tests__/unit/rateLimits.test.ts src/app.ts
git commit -m "feat(security): add centralized rate limits module"
```

---

## Task 2: DB Migration + Racket Type Update

**Files:**
- Create: `backend/api/migrations/add_store_id_to_rackets.sql`
- Modify: `backend/api/src/types/racket.ts`

- [ ] **Step 1: Create the migration file**

Create directory if needed:
```bash
mkdir -p backend/api/migrations
```

`backend/api/migrations/add_store_id_to_rackets.sql`:
```sql
-- Add store ownership to rackets
-- Nullable: existing rackets have no owner store
-- ON DELETE SET NULL: deleting a store orphans its rackets (does not cascade-delete them)
ALTER TABLE rackets
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;
```

- [ ] **Step 2: Run the migration against Supabase**

Go to your Supabase project → SQL Editor, paste and run the contents of `add_store_id_to_rackets.sql`.

Verify with:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rackets' AND column_name = 'store_id';
```

Expected: one row with `data_type = uuid`, `is_nullable = YES`

- [ ] **Step 3: Update the TypeScript Racket type**

In `backend/api/src/types/racket.ts`, add `store_id` to the `Racket` interface after `updated_at`:

```typescript
  // Ownership
  store_id?: string | null;
```

Full context for placement (after line `updated_at?: string;`):
```typescript
  created_at?: string;
  updated_at?: string;

  // Ownership
  store_id?: string | null;
```

- [ ] **Step 4: Verify type compiles**

```bash
cd backend/api && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add backend/api/migrations/add_store_id_to_rackets.sql backend/api/src/types/racket.ts
git commit -m "feat(security): add store_id ownership column to rackets"
```

---

## Task 3: requireRacketOwner Middleware

**Files:**
- Create: `backend/api/src/middleware/requireRacketOwner.ts`
- Create: `backend/api/src/__tests__/unit/requireRacketOwner.test.ts`

- [ ] **Step 1: Write the failing tests**

`backend/api/src/__tests__/unit/requireRacketOwner.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response, NextFunction } from 'express';
import type { RequestWithUser } from '../../types';

// Mock supabase before importing the middleware
vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../../config/supabase';
import { requireRacketOwner } from '../../middleware/requireRacketOwner';

function createMockRes(): any {
  const res: any = { statusCode: 200 };
  res.status = vi.fn((code: number) => { res.statusCode = code; return res; });
  res.json = vi.fn((body: any) => { res.body = body; return res; });
  return res;
}

function createMockReq(overrides: Partial<RequestWithUser> = {}): RequestWithUser {
  return { params: { id: '42' }, user: undefined, ...overrides } as unknown as RequestWithUser;
}

const mockSupabaseChain = (data: any, error: any = null) => {
  const chain: any = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data, error }) };
  (supabase.from as any).mockReturnValue(chain);
  return chain;
};

describe('requireRacketOwner', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when no user', async () => {
    const req = createMockReq({ user: undefined });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    await requireRacketOwner(req, res as Response, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next immediately for admin users', async () => {
    const req = createMockReq({ user: { id: 'admin-1', email: 'a@b.com', role: 'admin' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    await requireRacketOwner(req, res as Response, next);

    expect(supabase.from).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('returns 400 when racket id is not a number', async () => {
    const req = createMockReq({ params: { id: 'abc' }, user: { id: 'u1', email: 'u@b.com', role: 'player' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    await requireRacketOwner(req, res as Response, next);

    expect(res.statusCode).toBe(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 when racket does not exist', async () => {
    const req = createMockReq({ user: { id: 'u1', email: 'u@b.com', role: 'player' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    // First call: racket query returns null
    mockSupabaseChain(null, { message: 'not found' });

    await requireRacketOwner(req, res as Response, next);

    expect(res.statusCode).toBe(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when racket has no store_id', async () => {
    const req = createMockReq({ user: { id: 'u1', email: 'u@b.com', role: 'player' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    mockSupabaseChain({ id: 42, store_id: null });

    await requireRacketOwner(req, res as Response, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user has no store', async () => {
    const req = createMockReq({ user: { id: 'u1', email: 'u@b.com', role: 'player' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    const from = vi.fn();
    (supabase.from as any).mockImplementation((table: string) => {
      const chain: any = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      if (table === 'rackets') {
        chain.single = vi.fn().mockResolvedValue({ data: { id: 42, store_id: 'store-uuid' }, error: null });
      } else {
        chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'no store' } });
      }
      return chain;
    });

    await requireRacketOwner(req, res as Response, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when store does not own racket', async () => {
    const req = createMockReq({ user: { id: 'u1', email: 'u@b.com', role: 'player' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    (supabase.from as any).mockImplementation((table: string) => {
      const chain: any = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      if (table === 'rackets') {
        chain.single = vi.fn().mockResolvedValue({ data: { id: 42, store_id: 'store-A' }, error: null });
      } else {
        chain.single = vi.fn().mockResolvedValue({ data: { id: 'store-B' }, error: null });
      }
      return chain;
    });

    await requireRacketOwner(req, res as Response, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when store owns the racket', async () => {
    const req = createMockReq({ user: { id: 'u1', email: 'u@b.com', role: 'player' } });
    const res = createMockRes();
    const next: NextFunction = vi.fn();

    (supabase.from as any).mockImplementation((table: string) => {
      const chain: any = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      if (table === 'rackets') {
        chain.single = vi.fn().mockResolvedValue({ data: { id: 42, store_id: 'store-X' }, error: null });
      } else {
        chain.single = vi.fn().mockResolvedValue({ data: { id: 'store-X' }, error: null });
      }
      return chain;
    });

    await requireRacketOwner(req, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend/api && npx vitest run src/__tests__/unit/requireRacketOwner.test.ts
```

Expected: `Cannot find module '../../middleware/requireRacketOwner'`

- [ ] **Step 3: Implement the middleware**

`backend/api/src/middleware/requireRacketOwner.ts`:
```typescript
import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { RequestWithUser } from '../types';
import logger from '../config/logger';

export async function requireRacketOwner(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to perform this action',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (user.role?.toLowerCase() === 'admin') {
      next();
      return;
    }

    const racketId = parseInt(req.params.id);
    if (isNaN(racketId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Racket ID must be a number',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { data: racket, error: racketError } = await supabase
      .from('rackets')
      .select('id, store_id')
      .eq('id', racketId)
      .single();

    if (racketError || !racket) {
      res.status(404).json({
        success: false,
        error: 'Racket not found',
        message: `No racket found with ID ${racketId}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!racket.store_id) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'This racket has no owner store. Only admins can modify it.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('admin_user_id', user.id)
      .single();

    if (storeError || !store) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have a registered store.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (store.id !== racket.store_id) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only modify rackets belonging to your store.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info(`✅ Racket owner verified: user ${user.id} owns racket ${racketId} via store ${store.id}`);
    next();
  } catch (error: unknown) {
    logger.error('Error in requireRacketOwner middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Error checking racket ownership',
      timestamp: new Date().toISOString(),
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend/api && npx vitest run src/__tests__/unit/requireRacketOwner.test.ts
```

Expected: all 8 tests pass

- [ ] **Step 5: Verify TypeScript**

```bash
cd backend/api && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add backend/api/src/middleware/requireRacketOwner.ts backend/api/src/__tests__/unit/requireRacketOwner.test.ts
git commit -m "feat(security): add requireRacketOwner middleware (admin or store owner)"
```

---

## Task 4: Fix Rackets Routes

**Files:**
- Modify: `backend/api/src/routes/rackets.ts`

- [ ] **Step 1: Update imports in `rackets.ts`**

Replace the current import block at the top of `backend/api/src/routes/rackets.ts`:

```typescript
import { Router } from 'express';
import { RacketController } from '../controllers/racketController';
import { optionalAuth, authenticateUser } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { requireRacketOwner } from '../middleware/requireRacketOwner';
import {
  validatePagination,
  validateIdParam,
  validateSearchQuery,
  validateSearchFilters,
} from '../middleware/validation';
```

- [ ] **Step 2: Fix the three mutating routes**

Replace lines 58–65 (PUT, DELETE, POST bulk-update):

```typescript
// PUT /api/rackets/:id — admin or racket's store owner
router.put('/:id', authenticateUser, requireRacketOwner, validateIdParam(), RacketController.updateRacket);

// DELETE /api/rackets/:id — admin or racket's store owner
router.delete('/:id', authenticateUser, requireRacketOwner, validateIdParam(), RacketController.deleteRacket);

// POST /api/rackets/bulk-update — admin only
router.post('/bulk-update', authenticateUser, requireAdmin, RacketController.bulkUpdateRackets);
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd backend/api && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add backend/api/src/routes/rackets.ts
git commit -m "feat(security): require auth+ownership for racket mutations"
```

---

## Task 5: Fix Recommendation Routes

**Files:**
- Modify: `backend/api/src/routes/recommendationRoutes.ts`

- [ ] **Step 1: Rewrite the routes file**

Replace the entire content of `backend/api/src/routes/recommendationRoutes.ts`:

```typescript
import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendationController';
import { authenticateUser as authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { aiLimiter } from '../middleware/rateLimits';

const router = Router();

// Auth + per-user rate limit on AI endpoints
router.post('/generate', authenticate, aiLimiter, RecommendationController.generate);
router.post('/generate-rag', authenticate, aiLimiter, RecommendationController.generateWithRAG);

// Protected routes
router.post('/save', authenticate, RecommendationController.save);
router.get('/last', authenticate, RecommendationController.getLast);

// Cache management — admin only
router.post('/cache/clear', authenticate, requireAdmin, RecommendationController.clearCache);
router.get('/cache/stats', authenticate, requireAdmin, RecommendationController.getCacheStats);

export default router;
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd backend/api && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add backend/api/src/routes/recommendationRoutes.ts
git commit -m "feat(security): require auth on AI routes, admin-gate cache management"
```

---

## Task 6: Fix Remaining Routes

**Files:**
- Modify: `backend/api/src/routes/users.ts`
- Modify: `backend/api/src/routes/stores.ts`
- Modify: `backend/api/src/routes/proxyRoutes.ts`
- Modify: `backend/api/src/routes/comparisonRoutes.ts`

- [ ] **Step 1: Fix `users.ts` — add requireAdmin to /stats**

In `backend/api/src/routes/users.ts`, add the `requireAdmin` import:
```typescript
import { authenticateUser, authenticateUser as requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
```

Change the `/stats` route (currently line 51):
```typescript
// GET /api/users/stats - Get user statistics (admin only)
router.get("/stats", authenticateUser, requireAdmin, UserController.getUserStats);
```

- [ ] **Step 2: Fix `stores.ts` — per-route auth, public GET**

Replace the entire content of `backend/api/src/routes/stores.ts`:

```typescript
import { Router } from "express";
import { authenticateUser } from "../middleware/auth";
import { validatePagination } from "../middleware/validation";
import { storeController as StoreController } from "../controllers/storeController";

const router = Router();

// Public — anyone can browse stores
router.get("/", validatePagination, StoreController.getAllStores);
router.post("/", authenticateUser, StoreController.createStoreRequest);

// /me MUST be before /:id — Express matches routes in registration order
router.get("/me", authenticateUser, StoreController.getMyStore);

// Param routes last
router.get("/:id", StoreController.getStoreById);
router.put("/:id", authenticateUser, StoreController.updateStore);
router.delete("/:id", authenticateUser, StoreController.deleteStore);

export default router;
```

- [ ] **Step 3: Fix `proxyRoutes.ts` — add proxyLimiter**

In `backend/api/src/routes/proxyRoutes.ts`, add the import after the existing imports:
```typescript
import { proxyLimiter } from '../middleware/rateLimits';
```

Change line 55 (the route definition):
```typescript
router.get('/image', proxyLimiter, async (req: Request, res: Response) => {
```

- [ ] **Step 4: Fix `comparisonRoutes.ts` — add comparisonLimiter**

In `backend/api/src/routes/comparisonRoutes.ts`, add the import:
```typescript
import { comparisonLimiter } from '../middleware/rateLimits';
```

Change the public comparison POST (line 8):
```typescript
router.post('/', comparisonLimiter, ComparisonController.compareRackets);
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd backend/api && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Run full unit test suite**

```bash
cd backend/api && npx vitest run src/__tests__/unit
```

Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add backend/api/src/routes/users.ts backend/api/src/routes/stores.ts backend/api/src/routes/proxyRoutes.ts backend/api/src/routes/comparisonRoutes.ts
git commit -m "feat(security): harden remaining routes with correct auth and rate limits"
```

---

## Task 7: Frontend Dashboard Protection

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Wrap `/dashboard` in ProtectedRoute**

In `frontend/src/App.tsx`, find the `/dashboard` route (currently lines 158–165):

```tsx
<Route
  path='/dashboard'
  element={
    <LazyRoute>
      <PlayerDashboard />
    </LazyRoute>
  }
/>
```

Replace with:

```tsx
<Route
  path='/dashboard'
  element={
    <ProtectedRoute>
      <LazyRoute>
        <PlayerDashboard />
      </LazyRoute>
    </ProtectedRoute>
  }
/>
```

`ProtectedRoute` is already imported at line 13 — no new import needed.

- [ ] **Step 2: Verify the import exists**

Confirm line 13 of `frontend/src/App.tsx` reads:
```tsx
import ProtectedRoute from './components/ProtectedRoute';
```

- [ ] **Step 3: Check TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(security): protect /dashboard route — require auth"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Run full backend test suite**

```bash
cd backend/api && npx vitest run src/__tests__/unit
```

Expected: all tests pass

- [ ] **Step 2: Build backend**

```bash
cd backend/api && npm run build
```

Expected: no TypeScript errors, `dist/` produced

- [ ] **Step 3: Build frontend**

```bash
cd frontend && npm run build
```

Expected: no errors

- [ ] **Step 4: Commit if anything was unstaged**

```bash
git status
```

If clean: done. If dirty: investigate before committing.
