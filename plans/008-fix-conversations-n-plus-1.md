# Plan 008: Batch enrich conversations (fix N+1 queries)

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat b4b881f..HEAD -- api/v1/messaging/conversations.ts`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `b4b881f`, 2026-07-13

## Why this matters

The conversations list handler issues 1 + 4N Supabase queries per request
(one for the conversation list, then 4 per conversation for store info, buyer
info, last message, unread count). For a store with 20 conversations, that's
81 queries. On Vercel serverless with cold starts, this adds seconds of
latency and costs $ per invocation.

## Current state

```typescript
// api/v1/messaging/conversations.ts:66-89
const enriched = await Promise.all((conversations || []).map(async (conv) => {
  const [storeResult, buyerResult, lastMsgResult, unreadResult] = await Promise.all([
    supabaseAdmin.from('stores').select('store_name, slug, logo_url').eq('id', conv.store_id).maybeSingle(),
    supabaseAdmin.from('user_profiles').select('nickname, avatar_url').eq('id', conv.buyer_id).maybeSingle(),
    supabaseAdmin.from('messages').select('content, created_at, sender_id')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin.from('messages')
      .eq('conversation_id', conv.id)
      .eq('read', false)
      .neq('sender_id', user.id)
      .select('*', { count: 'exact', head: true }),
  ]);
  // ...
}));
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `cd frontend && npx tsc --noEmit` | exit 0 |

## Scope

**In scope**:
- `api/v1/messaging/conversations.ts` — batch enrichments

**Out of scope**:
- The messages handler at `api/v1/messaging/messages.ts`
- Frontend changes

## Git workflow

- Branch: `advisor/008-conversations-n-plus-1`

## Steps

### Step 1: Collect all unique IDs from conversations

After fetching conversations, collect `store_ids`, `buyer_ids`, and
`conversation_ids` into Sets:

```typescript
const storeIds = [...new Set(conversations.map(c => c.store_id))];
const buyerIds = [...new Set(conversations.map(c => c.buyer_id))];
const convIds = conversations.map(c => c.id);
```

### Step 2: Batch-fetch stores and buyers

Replace per-conversation store/buyer queries with batched queries:

```typescript
const [storeRows, buyerRows] = await Promise.all([
  storeIds.length
    ? supabaseAdmin.from('stores').select('id, store_name, slug, logo_url').in('id', storeIds)
    : { data: [] },
  buyerIds.length
    ? supabaseAdmin.from('user_profiles').select('id, nickname, avatar_url').in('id', buyerIds)
    : { data: [] },
]);
```

Build lookup maps:

```typescript
const storeMap = Object.fromEntries((storeRows.data || []).map(s => [s.id, s]));
const buyerMap = Object.fromEntries((buyerRows.data || []).map(b => [b.id, b]));
```

### Step 3: Batch-fetch last messages

Get the most recent message per conversation using a single query with
DISTINCT ON, or a simpler approach: fetch ALL messages for these conversations
and pick the latest per conversation in JS:

```typescript
const { data: allMessages } = await supabaseAdmin
  .from('messages')
  .select('id, conversation_id, content, created_at, sender_id')
  .in('conversation_id', convIds)
  .order('created_at', { ascending: false });

const lastMessageMap = new Map();
for (const msg of allMessages || []) {
  if (!lastMessageMap.has(msg.conversation_id)) {
    lastMessageMap.set(msg.conversation_id, msg);
  }
}
```

### Step 4: Batch-fetch unread counts

Single query with grouping:

```typescript
const { data: unreadMessages } = await supabaseAdmin
  .from('messages')
  .select('conversation_id, id')
  .in('conversation_id', convIds)
  .eq('read', false)
  .neq('sender_id', user.id);

const unreadMap = new Map<string, number>();
for (const msg of unreadMessages || []) {
  unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) || 0) + 1);
}
```

### Step 5: Build enriched response with lookup maps

```typescript
const enriched = (conversations || []).map(conv => ({
  ...conv,
  store: storeMap[conv.store_id] || null,
  buyer: buyerMap[conv.buyer_id] || null,
  last_message: lastMessageMap.get(conv.id) || null,
  unread_count: unreadMap.get(conv.id) || 0,
}));
```

**Verify**: `grep -n "in(" api/v1/messaging/conversations.ts` → shows batched queries with `.in('id', ...)`

## Test plan

- No API handler tests exist (see plan 010). Manual: load conversation list
  for a store with 10+ conversations, verify response matches old shape.
  Monitor Supabase query logs — should see 4 queries total instead of 1+4N.

## Done criteria

- [ ] No per-conversation Supabase queries in the enrichment section
- [ ] All lookups use batched `.in()` queries with client-side Map joins
- [ ] Response shape is identical to before (backward-compatible)
- [ ] `cd frontend && npx tsc --noEmit` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- If `convIds` is empty, skip all batch queries (return empty enriched array)
- If any `.in()` query would exceed Supabase's 1000-item limit for big stores,
  report back — need chunked batching

## Maintenance notes

- When adding new enrichment fields to conversations, add them to the batched
  queries — never add per-conversation queries
- Monitor Supabase `IN` clause size limit (~1000 items for PG, ~32767 for
  Supabase); current usage is safe for any reasonable store
