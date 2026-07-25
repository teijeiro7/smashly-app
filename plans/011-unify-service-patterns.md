# Plan 011: Unify frontend service patterns

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- frontend/src/services/ frontend/src/__tests__/`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: 009 (characterization tests exist before refactoring), 010 (untested services have tests)
- **Category**: tech-debt
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

Frontend services use 3 different patterns:
1. **Static class** (`RacketService.getAllRackets()`) — `racketService.ts`
2. **Plain object** (`storeService.getAllStores()`) — `storeService.ts`, `messagingService.ts`
3. **Class with static methods** (`ComparisonService.compareRackets()`) — `comparisonService.ts`

This inconsistency creates cognitive overhead, blocks mechanical refactors,
and confuses new contributors. The `storeService` pattern (plain object export
with fetch-based calls via `API_ENDPOINTS`) is the most recent and consistent.

## Current state

Pattern exemplars:

```typescript
// Pattern A — static class (racketService.ts)
export class RacketService {
  static async getAllRackets(): Promise<Racket[]> {
    return supabase.from('rackets').select('*');
  }
}

// Pattern B — plain object (storeService.ts)
const storeService = {
  async getAllStores(): Promise<Store[]> {
    const response = await fetch(`${API_URL}/api/v1/stores`);
    return response.json();
  },
};
export default storeService;

// Pattern C — class with static (comparisonService.ts)
export const ComparisonService = {
  compareRackets: async (...): Promise<...> => { ... },
};
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Test | `cd frontend && npx vitest run` | all pass |
| Typecheck | `cd frontend && npx tsc --noEmit` | exit 0 |

## Scope

**In scope**:
- `frontend/src/services/racketService.ts` — migrate to plain object pattern
- `frontend/src/services/comparisonService.ts` — migrate to plain object pattern
- All call sites in `frontend/src/pages/`, `frontend/src/contexts/`, etc.

**Out of scope**:
- API client logic (that's a separate refactor — see note in maintenance)
- Component restructuring

## Git workflow

- Branch: `advisor/011-unify-service-patterns`

## Steps

### Step 1: Migrate `racketService.ts` to plain object pattern

Refactor from `class RacketService { static async getAllRackets() { ... } }`
to `const racketService = { async getAllRackets() { ... } }; export default racketService;`

The method implementations stay the same (they use supabase client directly).
Only the export pattern changes.

**Convention to follow**: methods as arrow function properties on a const object:

```typescript
const racketService = {
  getAllRackets: async (): Promise<Racket[]> => {
    const { data, error } = await supabase.from('rackets').select('*');
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapDbToFrontend);
  },
  // ... rest of methods
};
export default racketService;
```

### Step 2: Update all call sites for RacketService

Find and replace all `RacketService.methodName(` → `racketService.methodName(`.
Also update imports from `import { RacketService } from ...` to
`import racketService from ...`.

```
grep -rn "RacketService\." frontend/src/
```

Expected call sites: CatalogPage, RacketDetailPage, and other pages/services
that import RacketService.

### Step 3: Migrate `comparisonService.ts` to plain object pattern

Same approach — `ComparisonService` is already a const object, just needs
renaming to `comparisonService` and updating call sites.

The tricky part: `comparisonService.ts` mixes fetch-based `compareRackets`
(which calls `/api/comparison`) with supabase-based CRUD methods
(`saveComparison`, `getComparisons`, etc.). This is fine for the scope of
pattern unification — only the export name changes.

### Step 4: Update all imports

For each changed service, run the test suite to confirm nothing broke:

**Verify**: `cd frontend && npx vitest run` → all pass

## Test plan

- Plan 009 must land first — ensures characterization tests catch regressions
- After migration, run full test suite: `cd frontend && npx vitest run`
- Also run typecheck: `cd frontend && npx tsc --noEmit`

## Done criteria

- [ ] `RacketService` is migrated to `racketService` (plain object, default export)
- [ ] `ComparisonService` is migrated to `comparisonService` if the name differs
- [ ] No `class.*Service` patterns remain in `frontend/src/services/`
- [ ] All imports updated
- [ ] `cd frontend && npx vitest run` exits 0
- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- If plan 009 (test mocks) is not yet complete, STOP — do not refactor without test coverage
- If moving `RacketService` breaks more than 20 call sites, report back for scope adjustment

## Maintenance notes

- This is purely a naming/export pattern change. Method bodies stay the same.
- A future plan could migrate the supabase-based methods to use fetch-based
  API calls (like `storeService` does), making them testable without the
  complex supabase mock. That's a separate scope.
- All NEW services should use the `storeService` pattern (plain object, fetch-based, API_ENDPOINTS)
