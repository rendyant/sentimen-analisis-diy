'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, sendChatMessage } from '@/lib/api';

const STORAGE_KEY = 'diy_shared_ai_chat_v1';
const OPD_STORAGE_KEY = 'diy_shared_ai_opd_v1';
const SYNC_EVENT = 'diy-chat-sync';

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content:
      'Halo! Saya **Asisten AI Analis Sentimen Pemda DIY**.\nSaya terhubung langsung dengan database ulasan & statistik 24 OPD DIY. Silakan pilih pertanyaan cepat atau ketik pertanyaan Anda terkait keluhan warga, performa OPD, maupun rekomendasi kebijakan.',
  },
];

function readStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return DEFAULT_MESSAGES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MESSAGES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MESSAGES;
  } catch {
    return DEFAULT_MESSAGES;
  }
}

function writeStoredMessages(msgs: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    window.dispatchEvent(new Event(SYNC_EVENT));
  } catch {
    // ignore storage quota errors
  }
}

export function useSharedChat(defaultOpd = '') {
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [instansiId, setInstansiIdState] = useState<string>(defaultOpd);
  const [loading, setLoading] = useState(false);

  // Load initial state from localStorage and listen for cross-component updates
  useEffect(() => {
    setMessages(readStoredMessages());
    const savedOpd = localStorage.getItem(OPD_STORAGE_KEY);
    if (savedOpd !== null) {
      setInstansiIdState(savedOpd);
    }

    const handleSync = () => {
      setMessages(readStoredMessages());
      const currentOpd = localStorage.getItem(OPD_STORAGE_KEY);
      if (currentOpd !== null) {
        setInstansiIdState(currentOpd);
      }
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const setInstansiId = useCallback((val: string) => {
    setInstansiIdState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem(OPD_STORAGE_KEY, val);
      window.dispatchEvent(new Event(SYNC_EVENT));
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || loading) return;

      const currentMsgs = readStoredMessages();
      const nextMessages: ChatMessage[] = [...currentMsgs, { role: 'user', content: q }];
      setMessages(nextMessages);
      writeStoredMessages(nextMessages);
      setLoading(true);

      try {
        const res = await sendChatMessage({
          message: q,
          instansi_id: instansiId || undefined,
          history: nextMessages.slice(-6),
        });
        const updated: ChatMessage[] = [...nextMessages, { role: 'assistant', content: res.reply }];
        setMessages(updated);
        writeStoredMessages(updated);
      } catch {
        const fallback: ChatMessage[] = [
          ...nextMessages,
          {
            role: 'assistant',
            content:
              'Maaf, saat ini tidak dapat terhubung ke server Backend (`http://localhost:8000`). Pastikan server backend FastAPI sedang berjalan.',
          },
        ];
        setMessages(fallback);
        writeStoredMessages(fallback);
      } finally {
        setLoading(false);
      }
    },
    [instansiId, loading]
  );

  const resetChat = useCallback(() => {
    const resetMsgs: ChatMessage[] = [
      {
        role: 'assistant',
        content:
          'Percakapan telah direset. Silakan ajukan pertanyaan baru seputar data ulasan dan statistik sentimen OPD DIY.',
      },
    ];
    setMessages(resetMsgs);
    writeStoredMessages(resetMsgs);
  }, []);

  return {
    messages,
    instansiId,
    setInstansiId,
    loading,
    sendMessage,
    resetChat,
  };
}
