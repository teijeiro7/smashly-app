# Plan 005: Block HTTP redirect following in image proxy

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- api/proxy/image.ts`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

The image proxy at `api/proxy/image.ts:84` fetches images using the default
`fetch()` behavior, which follows HTTP redirects automatically. If any domain
in the `ALLOWED_IMAGE_DOMAINS` list has an open redirect vulnerability, an
attacker could chain through it to bypass the domain allowlist and make the
server fetch arbitrary URLs — enabling SSRF to internal services or data
exfiltration.

## Current state

```typescript
// api/proxy/image.ts:84 — no redirect option set
const response = await fetch(imageUrl, {
  headers: { ... },
  signal: AbortSignal.timeout(10_000),
});
// By default, fetch follows redirects (redirect: 'follow')
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `cd frontend && npx tsc --noEmit` | exit 0 |

## Scope

**In scope**:
- `api/proxy/image.ts` — add `redirect: 'manual'` to the fetch call

**Out of scope**:
- Updating `ALLOWED_IMAGE_DOMAINS` (handled in plan 006 if needed)
- Other Vercel functions that call fetch

## Git workflow

- Branch: `advisor/005-image-proxy-redirects`

## Steps

### Step 1: Add `redirect` option to fetch call

Change line 84 from:

```typescript
const response = await fetch(imageUrl, {
  headers: { ... },
  signal: AbortSignal.timeout(10_000),
});
```

To:

```typescript
const response = await fetch(imageUrl, {
  headers: { ... },
  signal: AbortSignal.timeout(10_000),
  redirect: 'manual',
});
```

If the response status is 3xx after adding `redirect: 'manual'`, return an
error — the proxy should not serve redirect responses to clients either:

```typescript
if (!response.ok || response.status >= 300) {
  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Failed to fetch image from source' }));
  return;
}
```

Note: the existing check on line 92 only checks `!response.ok` — with
`redirect: 'manual'`, 3xx responses are NOT automatically followed AND they
have `ok: true` (since 3xx is "ok" in HTTP). So we need `|| response.status >= 300`.

**Verify**: `grep -n "redirect:" api/proxy/image.ts` → shows `redirect: 'manual'`

## Test plan

Manual: Call `/api/proxy/image?url=https://example.com/redirect` where
example.com redirects to another domain — should return 400, not fetch the
final destination.

## Done criteria

- [ ] `api/proxy/image.ts:84` has `redirect: 'manual'` option
- [ ] The error check covers 3xx responses (`!response.ok || response.status >= 300`)
- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- If images from allowed domains legitimately use redirects (e.g., CDN short-urls),
  report back — the plan needs a different approach (validate final URL)

## Maintenance notes

- If a legitimate redirect-based CDN is added later, the proxy may need a
  `redirect: 'follow'` variant with per-domain allowlisting of final URL
