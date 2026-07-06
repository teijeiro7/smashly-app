-- ============================================================
-- Migration: messaging
-- Conversations + messages for buyer↔store chat
-- ============================================================

-- 1. Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(buyer_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_store ON conversations(store_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_at DESC);

-- 2. Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

-- 3. Helper: check if user participates in a conversation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conv_id
      AND (c.buyer_id = auth.uid()
        OR c.store_id IN (SELECT id FROM stores WHERE admin_user_id = auth.uid()))
  );
$$;

-- 4. Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. Conversations RLS
CREATE POLICY "conversations_select_participant"
  ON conversations FOR SELECT
  USING (buyer_id = auth.uid()
    OR store_id IN (SELECT id FROM stores WHERE admin_user_id = auth.uid()));

CREATE POLICY "conversations_insert_buyer"
  ON conversations FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- 6. Messages RLS
CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  USING (public.is_conversation_participant(conversation_id));

CREATE POLICY "messages_insert_participant"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_participant(conversation_id)
  );

CREATE POLICY "messages_update_participant"
  ON messages FOR UPDATE
  USING (public.is_conversation_participant(conversation_id))
  WITH CHECK (public.is_conversation_participant(conversation_id));

-- 7. Notifications for new messages
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'price_drop', 'comparison_complete', 'recommendation_complete',
    'review', 'review_reply', 'admin_update', 'new_user',
    'new_store', 'store_status', 'new_message'
  ));
