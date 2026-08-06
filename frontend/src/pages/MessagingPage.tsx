import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { FiSend, FiArrowLeft, FiMessageSquare, FiMail } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import { sileo } from 'sileo';
import { supabase } from '../lib/supabase';
import messagingService, { Conversation, Message } from '../services/messagingService';

const Page = styled.div`
  height: calc(100dvh - 4rem);
  display: flex;
  background: var(--surface);
  max-width: 1100px;
  margin: 0 auto;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border);

  @media (max-width: 768px) {
    height: calc(100dvh - 3.5rem);
    border-radius: 0;
    border: none;
  }
`;

const Sidebar = styled.div<{ $show: boolean }>`
  width: 340px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    display: ${({ $show }) => ($show ? 'flex' : 'none')};
  }
`;

const ChatArea = styled.div<{ $show: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;

  @media (max-width: 768px) {
    display: ${({ $show }) => ($show ? 'flex' : 'none')};
  }
`;

const SidebarHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--text);
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ConversationItem = styled.div<{ $active?: boolean }>`
  padding: 1rem 1.5rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
  background: ${({ $active }) => ($active ? 'var(--primary-subtle)' : 'transparent')};

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--primary-subtle)' : 'var(--surface-2)')};
  }
`;

const ConvTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
`;

const ConvName = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
`;

const ConvTime = styled.div`
  font-size: 0.75rem;
  color: var(--text-subtle);
`;

const ConvPreview = styled.div`
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UnreadBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: var(--primary);
  color: var(--on-primary);
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 700;
  margin-left: 0.5rem;
`;

const ChatHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 6px;
  display: none;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const ChatTitle = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: var(--text);
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const MessageBubble = styled.div<{ $mine: boolean }>`
  max-width: 75%;
  align-self: ${({ $mine }) => ($mine ? 'flex-end' : 'flex-start')};
  padding: 0.75rem 1rem;
  border-radius: ${({ $mine }) => ($mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px')};
  background: ${({ $mine }) => ($mine ? 'var(--primary)' : 'var(--surface-2)')};
  color: ${({ $mine }) => ($mine ? 'var(--on-primary)' : 'var(--text)')};
  font-size: 0.9rem;
  line-height: 1.5;
  word-wrap: break-word;
`;

const MessageTime = styled.div<{ $mine: boolean }>`
  font-size: 0.7rem;
  color: ${({ $mine }) => ($mine ? 'rgba(var(--on-primary-rgb), 0.7)' : 'var(--text-subtle)')};
  margin-top: 0.25rem;
  text-align: ${({ $mine }) => ($mine ? 'right' : 'left')};
`;

const InputBar = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 0.75rem;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 0.95rem;
  background: var(--surface);
  color: var(--text);

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
  }
`;

const SendButton = styled.button`
  padding: 0.75rem;
  border: none;
  border-radius: 12px;
  background: var(--primary);
  color: var(--on-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: var(--primary-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyChat = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 0.75rem;
  padding: 2rem;
`;

const EmptyChatIcon = styled.div`
  font-size: 3rem;
  opacity: 0.3;
`;

const EmptyChatText = styled.p`
  font-size: 0.95rem;
  margin: 0;
`;

const LoadingContainer = styled.div`
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
`;

const MessagingPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(false);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const loadConversations = useCallback(async () => {
    try {
      const data = await messagingService.listConversations();
      setConversations(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (convId: string) => {
    setMessagesLoading(true);
    try {
      const result = await messagingService.getMessages(convId);
      setMessages(result.data);
      // Mark as read on server
      await messagingService.markRead(convId);
      // Update unread count locally
      setConversations(prev => prev.map(c => (c.id === convId ? { ...c, unread_count: 0 } : c)));
    } catch {
      /* ignore */
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const selectConversation = (convId: string) => {
    setActiveConvId(convId);
    setShowChat(true);
    loadMessages(convId);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || !activeConvId) return;

    setSending(true);
    try {
      const msg = await messagingService.sendMessage(activeConvId, content);
      setMessages(prev => [...prev, msg]);
      setInputValue('');
      // Update last_message
      setConversations(prev =>
        prev.map(c =>
          c.id === activeConvId
            ? {
                ...c,
                last_message_at: msg.created_at,
                last_message: {
                  content: msg.content,
                  created_at: msg.created_at,
                  sender_id: msg.sender_id,
                },
              }
            : c
        )
      );
    } catch (error: any) {
      sileo.error({ title: 'Error', description: error.message });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUserId(session.user.id);
    });
  }, []);

  return (
    <Page>
      <Sidebar $show={!showChat}>
        <SidebarHeader>Mensajes</SidebarHeader>
        <ConversationList>
          {loading ? (
            <LoadingContainer>Cargando...</LoadingContainer>
          ) : conversations.length === 0 ? (
            <EmptyChat>
              <EmptyChatIcon>
                <FiMessageSquare />
              </EmptyChatIcon>
              <EmptyChatText>No tienes conversaciones</EmptyChatText>
            </EmptyChat>
          ) : (
            conversations.map(conv => (
              <ConversationItem
                key={conv.id}
                $active={conv.id === activeConvId}
                onClick={() => selectConversation(conv.id)}
              >
                <ConvTop>
                  <ConvName>
                    <FaStore size={14} style={{ marginRight: '0.375rem' }} />
                    {conv.store?.store_name || 'Tienda'}
                  </ConvName>
                  <ConvTime>{formatTime(conv.last_message_at)}</ConvTime>
                </ConvTop>
                <ConvPreview>
                  {conv.last_message?.content || 'Sin mensajes'}
                  {conv.unread_count > 0 && <UnreadBadge>{conv.unread_count}</UnreadBadge>}
                </ConvPreview>
              </ConversationItem>
            ))
          )}
        </ConversationList>
      </Sidebar>

      <ChatArea $show={showChat}>
        {activeConv ? (
          <>
            <ChatHeader>
              <BackButton onClick={() => setShowChat(false)}>
                <FiArrowLeft size={20} />
              </BackButton>
              <FaStore size={18} />
              <ChatTitle>{activeConv.store?.store_name || 'Tienda'}</ChatTitle>
            </ChatHeader>

            <MessagesContainer>
              {messagesLoading ? (
                <LoadingContainer>Cargando mensajes...</LoadingContainer>
              ) : messages.length === 0 ? (
                <EmptyChat>
                  <EmptyChatIcon>
                    <FiMail />
                  </EmptyChatIcon>
                  <EmptyChatText>No hay mensajes aún. Envía el primero.</EmptyChatText>
                </EmptyChat>
              ) : (
                messages.map(msg => (
                  <MessageBubble key={msg.id} $mine={msg.sender_id === currentUserId}>
                    {msg.content}
                    <MessageTime $mine={msg.sender_id === currentUserId}>
                      {formatTime(msg.created_at)}
                    </MessageTime>
                  </MessageBubble>
                ))
              )}
              <div ref={messagesEndRef} />
            </MessagesContainer>

            <InputBar>
              <MessageInput
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Escribe un mensaje...'
              />
              <SendButton onClick={handleSend} disabled={!inputValue.trim() || sending}>
                <FiSend size={18} />
              </SendButton>
            </InputBar>
          </>
        ) : (
          <EmptyChat>
            <EmptyChatIcon>
              <FiMessageSquare />
            </EmptyChatIcon>
            <EmptyChatText>Selecciona una conversación para empezar</EmptyChatText>
          </EmptyChat>
        )}
      </ChatArea>
    </Page>
  );
};

export default MessagingPage;
