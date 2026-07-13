# Plan 010: Add tests for untested services and API handlers

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- frontend/src/__tests__/ api/`

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: LOW
- **Depends on**: 009 (test infrastructure)
- **Category**: tests
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

8 of 17 frontend services have zero test coverage, including critical paths:
messaging (conversations, messages), catalog (store CRUD), notifications,
upload, and user profiles. All 11 API serverless handlers also have zero tests.
Without tests, every change to these modules is a blind deployment.

Untested services:
- `messagingService.ts` (conversations, messages — critical user-facing feature)
- `catalogService.ts` (store catalog CRUD)
- `notificationService.ts` (push notifications)
- `uploadService.ts` (image uploads)
- `userProfileService.ts` (user profile CRUD)
- `pdfGenerator.ts` (PDF generation — 496 lines)
- `googleAuthService.ts` (Google OAuth — 257 lines)
- `analyticsService.ts` (view/click tracking)

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Test | `cd frontend && npx vitest run` | all pass |
| Typecheck | `cd frontend && npx tsc --noEmit` | exit 0 |

## Scope

**In scope**:
- `frontend/src/__tests__/unit/services/messagingService.test.ts` (create)
- `frontend/src/__tests__/unit/services/catalogService.test.ts` (create)
- `frontend/src/__tests__/unit/services/notificationService.test.ts` (create)
- `frontend/src/__tests__/unit/services/uploadService.test.ts` (create)
- `frontend/src/__tests__/unit/services/userProfileService.test.ts` (create)
- `frontend/src/__tests__/unit/services/analyticsService.test.ts` (create)

**Out of scope**:
- `pdfGenerator.ts` tests — jsPDF makes assertions hard; defer
- `googleAuthService.ts` tests — OAuth flows are integration-level; defer
- API handler tests — need infra setup (see plan 010b if applicable)
- Component/context tests

## Git workflow

- Branch: `advisor/010-add-missing-tests`

## Steps

### Step 1: Create messagingService test

Model after `storeService.test.ts` pattern (fetch-based mocks since
`messagingService.ts` uses fetch + auth headers).

Test file: `frontend/src/__tests__/unit/services/messagingService.test.ts`

Test cases:
- `listConversations` — returns conversation list with auth header
- `createConversation` — POST with store_id and content
- `getMessages` — GET with conversation_id and page
- `sendMessage` — POST with conversation_id and content
- `markRead` — PUT with conversation_id
- Error handling — each method throws on non-ok response

Use `global.fetch = vi.fn()` and mock `../../lib/supabase` for `getToken`:

```typescript
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      }),
    },
  },
}));
```

### Step 2: Create catalogService test

`catalogService.ts` uses fetch-based API calls. Test:
- `getCatalog` — GET with storeId, page, limit
- `addCatalogItem` — POST with racket_id and price
- `updateCatalogItem` — PUT/PATCH
- `deleteCatalogItem` — DELETE
- `searchCatalog` — GET with search query

### Step 3: Create notificationService test

`notificationService.ts` uses supabase directly. Test via supabase mock:
- `getNotifications` — returns notification list
- `getUnreadCount` — returns count
- `markAsRead` — marks single notification
- `markAllAsRead` — marks all
- `deleteNotification` — deletes

### Step 4: Create uploadService test

`uploadService.ts` uses supabase storage. Test:
- `uploadImage` — uploads to storage bucket
- `deleteImage` — removes from storage

### Step 5: Create userProfileService test

`userProfileService.ts` uses supabase. Test:
- `getProfile` — fetches user profile
- `updateProfile` — updates profile fields
- `getUserById` — fetches other user's public profile

### Step 6: Create analyticsService test

`analyticsService.ts` is thin — test:
- `trackEvent` — POST with store_id and event type

**Verify after each step**: `cd frontend && npx vitest run` → all pass

## Test plan

Each new test file should follow the repo's existing test conventions:
- `global.fetch = vi.fn()` for fetch-based services
- `vi.mock('../../lib/supabase', ...)` for supabase-based services
- `beforeEach` with `vi.clearAllMocks()`
- Happy path + error path for each method

Model after `storeService.test.ts` for structure.

## Done criteria

- [ ] 6 new test files created under `frontend/src/__tests__/unit/services/`
- [ ] Each tests happy path and error path for all methods
- [ ] `cd frontend && npx vitest run` exits 0
- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- If a service method's implementation is not yet stable (frequently changing),
  write a basic smoke test and flag it for update after the API stabilizes
