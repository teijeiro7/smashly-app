import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../_lib/supabase';
import { getAuthUser, readBody, setCorsHeaders, handleOptions, unauthorized, badRequest } from '../../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(req, res);

  if (handleOptions(req, res)) return;

  if (req.method === 'GET') {
    await handleList(req, res);
    return;
  }

  if (req.method === 'POST') {
    await handleCreate(req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

async function handleList(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Fetch conversations with store info
  let query = supabaseAdmin
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false });

  if (profile?.role === 'Store') {
    const { data: storeIds } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('admin_user_id', user.id);

    const ids = (storeIds || []).map(s => s.id);
    if (ids.length === 0) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: [] }));
      return;
    }
    query = query.in('store_id', ids);
  } else {
    query = query.eq('buyer_id', user.id);
  }

  const { data: conversations, error } = await query;

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  // Enrich with store info, buyer info, last message, unread count
  const storeIds = [...new Set(conversations.map(c => c.store_id))];
  const buyerIds = [...new Set(conversations.map(c => c.buyer_id))];
  const convIds = conversations.map(c => c.id);

  let enriched: any[] = [];

  if (convIds.length > 0) {
    const [storeResult, buyerResult] = await Promise.all([
      storeIds.length
        ? supabaseAdmin.from('stores').select('id, store_name, slug, logo_url').in('id', storeIds)
        : { data: [] },
      buyerIds.length
        ? supabaseAdmin.from('user_profiles').select('id, nickname, avatar_url').in('id', buyerIds)
        : { data: [] },
    ]);

    const storeMap = Object.fromEntries((storeResult.data || []).map(s => [s.id, s]));
    const buyerMap = Object.fromEntries((buyerResult.data || []).map(b => [b.id, b]));

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

    enriched = conversations.map(conv => ({
      ...conv,
      store: storeMap[conv.store_id] || null,
      buyer: buyerMap[conv.buyer_id] || null,
      last_message: lastMessageMap.get(conv.id) || null,
      unread_count: unreadMap.get(conv.id) || 0,
    }));
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ data: enriched }));
}

async function handleCreate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  let body: any;
  try { body = await readBody(req); } catch {
    return badRequest(res, 'Invalid JSON body');
  }

  const { store_id, content } = body;

  if (!store_id || !content) {
    return badRequest(res, 'store_id and content are required');
  }

  // Find existing conversation or create new one
  const { data: existing } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('buyer_id', user.id)
    .eq('store_id', store_id)
    .maybeSingle();

  let conversationId: string;

  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: newConv, error: convError } = await supabaseAdmin
      .from('conversations')
      .insert({ buyer_id: user.id, store_id })
      .select('id')
      .single();

    if (convError) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: convError.message }));
      return;
    }

    conversationId = newConv.id;
  }

  // Send the message
  const { data: message, error: msgError } = await supabaseAdmin
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, content })
    .select()
    .single();

  if (msgError) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: msgError.message }));
    return;
  }

  // Update last_message_at
  await supabaseAdmin
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  // Notify store owner
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('admin_user_id, store_name')
    .eq('id', store_id)
    .single();

  if (store?.admin_user_id) {
    await supabaseAdmin.from('notifications').insert({
      user_id: store.admin_user_id,
      type: 'new_message',
      title: 'Nuevo mensaje',
      message: `Has recibido un mensaje de un comprador en ${store.store_name}`,
      data: { conversation_id: conversationId, store_id },
    });
  }

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(message));
}
