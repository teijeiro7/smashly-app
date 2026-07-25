# Plan 003: Add server-side auth to analytics tracking endpoint

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. If anything in STOP conditions occurs, stop and report.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- api/v1/analytics/store.ts`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

The analytics endpoint at `api/v1/analytics/store.ts` accepts POST requests
with any `store_id` and `event` value without any authentication. Any script,
bot, or malicious actor can arbitrarily inflate view/click counts for any
store. There is no rate limiting, no origin validation, and no user identity
requirement.

## Current state

```typescript
// api/v1/analytics/store.ts:19-58 — handleTrack has zero auth
async function handleTrack(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let body: any;
  try { body = await readBody(req); } catch {
    return badRequest(res, 'Invalid JSON body');
  }
  // ... reads store_id + event, increments counter
  // NO getAuthUser() call, no token validation
}
```

Frontend caller (`frontend/src/services/analyticsService.ts`) sends no auth
token currently — just a bare POST with store_id and event.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `cd frontend && npx tsc --noEmit` | exit 0 |

## Scope

**In scope**:
- `api/v1/analytics/store.ts` — add auth check
- `frontend/src/services/analyticsService.ts` — add auth token to requests

**Out of scope**:
- Rate limiting — out of scope for this plan
- Other unauthenticated endpoints — handled in plan 006

## Git workflow

- Branch: `advisor/003-analytics-auth`

## Steps

### Step 1: Add auth check to analytics handler

In `api/v1/analytics/store.ts`, add `getAuthUser` import and call it at the
start of `handleTrack`. If auth fails, return early (but don't reveal it's
an auth issue — return 200 to avoid informing scrapers).

```typescript
import { getAuthUser, ... } from '../../_lib/auth';

async function handleTrack(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) {
    // Return 200 to avoid revealing auth requirement to scrapers
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }
  // ... rest of handler
}
```

**Verify**: `grep -n "getAuthUser" api/v1/analytics/store.ts` → shows the import and use

### Step 2: Add auth token to frontend analytics service

In `frontend/src/services/analyticsService.ts`, add a `getToken` call similar
to `messagingService.ts:4-7` and include it in the request headers.

```typescript
import { supabase } from '../lib/supabase';

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

// In trackEvent:
const token = await getToken();
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({ store_id, event }),
});
```

**Verify**: `cd frontend && npx tsc --noEmit` → exit 0

## Test plan

No analytics tests exist (see plan 010). Manual verification: POST to
`/api/v1/analytics/store` without auth header should return `{ success: true }`
without incrementing the counter.

## Done criteria

- [ ] `api/v1/analytics/store.ts` calls `getAuthUser` and returns 200 without incrementing when unauthenticated
- [ ] `frontend/src/services/analyticsService.ts` includes Bearer token when available
- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- If the frontend analytics calls need to work for unauthenticated users
  (anonymous page views), report back — the auth requirement changes scope
