import { API_URL } from '../config/api';
import { supabase } from '../lib/supabase';

async function getToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || '';
}

export interface Conversation {
  id: string;
  buyer_id: string;
  store_id: string;
  last_message_at: string;
  created_at: string;
  store: { store_name: string; slug: string; logo_url?: string } | null;
  buyer: { nickname: string; avatar_url?: string } | null;
  last_message: { content: string; created_at: string; sender_id: string } | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

const messagingService = {
  async listConversations(): Promise<Conversation[]> {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/v1/messaging/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al cargar conversaciones');
    const data = await res.json();
    return data.data || [];
  },

  async createConversation(storeId: string, content: string): Promise<Message> {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/v1/messaging/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ store_id: storeId, content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear conversación');
    }
    return res.json();
  },

  async getMessages(conversationId: string, page = 1): Promise<{ data: Message[]; total: number }> {
    const token = await getToken();
    const url = `${API_URL}/api/v1/messaging/messages?conversation_id=${conversationId}&page=${page}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al cargar mensajes');
    return res.json();
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/v1/messaging/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ conversation_id: conversationId, content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al enviar mensaje');
    }
    return res.json();
  },

  async markRead(conversationId: string): Promise<void> {
    const token = await getToken();
    await fetch(`${API_URL}/api/v1/messaging/messages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ conversation_id: conversationId }),
    });
  },
};

export default messagingService;
