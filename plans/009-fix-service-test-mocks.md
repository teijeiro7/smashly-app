# Plan 009: Fix service tests to mock supabase instead of fetch

> **Executor instructions**: Follow this step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- frontend/src/__tests__/unit/services/ frontend/src/services/`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (but must precede plan 011)
- **Category**: tests
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

Several service tests mock `global.fetch` and assert URLs and request bodies,
but the actual services use `supabase.from('table').select()` (which does NOT
use `fetch` under the hood that would be intercepted by mocks). The tests
provide false confidence — they pass for wrong reasons and wouldn't catch
regressions in the actual data-access logic.

Affected test files:
- `frontend/src/__tests__/unit/services/comparisonService.test.ts` (452 lines)
- `frontend/src/__tests__/unit/services/racketService.test.ts`
- `frontend/src/__tests__/unit/services/reviewService.test.ts`
- `frontend/src/__tests__/unit/services/listService.test.ts`

## Current state

Tests import `global.fetch = vi.fn()` and mock the fetch function, then assert
fetch was called with specific URLs. But the services use Supabase client
methods directly:

```typescript
// comparisonService.ts:54 — uses supabase, not fetch
const { data, error } = await supabase
  .from('comparisons')
  .insert({ ... })
```

```typescript
// comparisonService.test.ts — mocks fetch, not supabase
(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ store: mockStore }),
});
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Test | `cd frontend && npx vitest run src/__tests__/unit/services/` | all pass |
| Typecheck | `cd frontend && npx tsc --noEmit` | exit 0 |

## Scope

**In scope**:
- All test files under `frontend/src/__tests__/unit/services/`
- `frontend/src/__tests__/unit/services/` — the test files themselves

**Out of scope**:
- The service implementations — they are correct, only tests need fixing
- Component/context tests — they may have similar issues but are separate

## Git workflow

- Branch: `advisor/009-fix-service-test-mocks`

## Steps

### Step 1: Create a shared supabase mock helper

Create `frontend/src/__tests__/unit/services/__mocks__/supabase.ts` — or simpler:
add a `mockSupabase` helper in a shared test utility that provides a mocked
Supabase client with the common chainable methods.

Since the services import `supabase` from `../lib/supabase`, the cleanest
approach is to mock that module at the test level:

```typescript
// In each test file, add:
vi.mock('../../../lib/supabase', () => ({
  supabase: createMockSupabase(),
}));
```

But creating a full mock Supabase client is complex due to the chainable API.
The **recommended alternative**: refactor the affected services to match the
pattern used by `storeService.ts` (fetch-based with API_ENDPOINTS), which is
already the dominant pattern for new code and is testable via fetch mocks.

However, that's a bigger task (plan 011 territory). For this plan, the simpler
fix: mock the `supabase` module at the import level.

Create `frontend/src/__tests__/helpers/mockSupabase.ts`:

```typescript
import { vi } from 'vitest';

type MockResponse = { data: any; error: any; count?: any };

function mockSelectReturn(resp: MockResponse) {
  const chain: any = { data: resp.data, error: resp.error, count: resp.count };
  chain.order = vi.fn(() => chain);
  chain.range = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.or = vi.fn(() => chain);
  chain.ilike = vi.fn(() => chain);
  chain.neq = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.single = vi.fn(async () => ({ data: resp.data?.[0] ?? resp.data ?? null, error: resp.error }));
  chain.maybeSingle = vi.fn(async () => ({ data: resp.data?.[0] ?? resp.data ?? null, error: resp.error }));
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => ({ ...chain, select: vi.fn(() => ({ ...chain, single: vi.fn(async () => resp) })) }));
  chain.update = vi.fn(() => ({ ...chain, select: vi.fn(() => ({ ...chain, single: vi.fn(async () => resp) })) }));
  chain.delete = vi.fn(() => chain);
  chain.upsert = vi.fn(() => ({ ...chain, select: vi.fn(() => ({ ...chain, single: vi.fn(async () => resp) })) }));
  chain.then = async (resolve: any) => resolve(resp); // for await
  return chain;
}

export function mockSupabase(resp: MockResponse) {
  return {
    from: vi.fn(() => mockSelectReturn(resp)),
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { access_token: 'test-token', user: { id: 'test-user', email: 'test@test.com' } } },
        error: null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    rpc: vi.fn(),
    storage: { from: vi.fn() },
  };
}
```

### Step 2: Fix each test file to mock `../../lib/supabase` instead of `global.fetch`

For `racketService.test.ts`:

```typescript
import { mockSupabase } from '../../helpers/mockSupabase';
vi.mock('../../../lib/supabase', () => ({ supabase: mockSupabase({ data: [...], error: null }) }));
```

Replace all `global.fetch` mock calls with supabase mock assertions. Assert on
`supabase.from` being called with the correct table name and query parameters.

### Step 3: Repeat for comparisonService, reviewService, listService

Each follows the same pattern: replace `vi.mock('@/config/api', ...)` + `global.fetch = vi.fn()` with `vi.mock('../../lib/supabase', ...)` using the mock helper.

**Verify**: `cd frontend && npx vitest run src/__tests__/unit/services/` → all pass with meaningful assertions

## Test plan

- The tests themselves are the product — verify they pass with real assertions
- Also verify: breaking a service intentionally (e.g., changing a table name) causes test failure

## Done criteria

- [ ] No test file under `src/__tests__/unit/services/` mocks `global.fetch`
- [ ] `frontend/src/__tests__/helpers/mockSupabase.ts` exists with the shared helper
- [ ] All service tests use `vi.mock('../../lib/supabase', ...)` instead
- [ ] `cd frontend && npx vitest run src/__tests__/unit/services/` passes
- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- If the mock helper becomes too complex to handle all service query patterns,
  report back — some services may need individual mock setups
- If `racketService.ts` is being refactored to use fetch (plan 011), coordinate — the mock approach changes

## Maintenance notes

- New services should use the fetch-based pattern (like `storeService.ts`)
  for easier testability via standard `global.fetch` mocks
- The supabase mock helper covers common chain patterns — extend it when new
  query patterns (e.g., `.textSearch()`) are needed in tests
