import type { IncomingMessage, ServerResponse } from 'http';
import { supabaseAdmin } from '../../_lib/supabase';
import { getAuthUser, readBody, setCorsHeaders, handleOptions, unauthorized, badRequest, forbidden } from '../../_lib/auth';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(res);

  if (handleOptions(req, res)) return;

  if (req.method === 'GET') {
    await handleGetMessages(req, res);
    return;
  }

  if (req.method === 'POST') {
    await handleSendMessage(req, res);
    return;
  }

  if (req.method === 'PUT') {
    await handleMarkRead(req, res);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}

async function isParticipant(conversationId: string, userId: string): Promise<boolean> {
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('buyer_id, store_id')
    .eq('id', conversationId)
    .maybeSingle();

  if (!conv) return false;
  if (conv.buyer_id === userId) return true;

  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('id')
    .eq('id', conv.store_id)
    .eq('admin_user_id', userId)
    .maybeSingle();

  return !!store;
}

async function handleGetMessages(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const conversationId = url.searchParams.get('conversation_id');
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

  if (!conversationId) return badRequest(res, 'conversation_id is required');

  if (!(await isParticipant(conversationId, user.id))) return forbidden(res);

  const offset = (page - 1) * limit;

  const { data: messages, error, count } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  // Mark messages as read
  await supabaseAdmin
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('read', false);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ data: messages.reverse(), total: count, page, limit }));
}

async function handleSendMessage(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  let body: any;
  try { body = await readBody(req); } catch {
    return badRequest(res, 'Invalid JSON body');
  }

  const { conversation_id, content } = body;

  if (!conversation_id || !content) {
    return badRequest(res, 'conversation_id and content are required');
  }

  if (!(await isParticipant(conversation_id, user.id))) return forbidden(res);

  const { data: message, error } = await supabaseAdmin
    .from('messages')
    .insert({ conversation_id, sender_id: user.id, content })
    .select()
    .single();

  if (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  await supabaseAdmin
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversation_id);

  // Notify the other participant
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('buyer_id, store_id')
    .eq('id', conversation_id)
    .single();

  if (conv) {
    const { data: store } = await supabaseAdmin
      .from('stores')
      .select('admin_user_id')
      .eq('id', conv.store_id)
      .single();

    const recipientId = store?.admin_user_id === user.id ? conv.buyer_id : store?.admin_user_id;

    if (recipientId) {
      await supabaseAdmin.from('notifications').insert({
        user_id: recipientId,
        type: 'new_message',
        title: 'Nuevo mensaje',
        message: 'Tienes un nuevo mensaje',
        data: { conversation_id, store_id: conv.store_id },
      });
    }
  }

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(message));
}

async function handleMarkRead(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized(res);

  let body: any;
  try { body = await readBody(req); } catch {
    return badRequest(res, 'Invalid JSON body');
  }

  const { conversation_id } = body;

  if (!conversation_id) return badRequest(res, 'conversation_id is required');

  await supabaseAdmin
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversation_id)
    .neq('sender_id', user.id)
    .eq('read', false);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true }));
}
