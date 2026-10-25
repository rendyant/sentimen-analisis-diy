'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, X, Send, Sparkles, Maximize2, Trash2, Loader2 } from 'lucide-react';
import { useSharedChat } from '@/lib/chat-store';
import { FormattedText } from '@/components/ai/chatbot-view';

const MINI_PROMPTS = [
  'OPD mana paling banyak keluhan?',
  'Apa keluhan utama di Dikpora?',
  'Berikan rekomendasi solusi',
];

export default function ChatWidget({ fullPageHref = '/chatbot' }: { fullPageHref?: string }) {
  const pathname = usePathname();
  const { messages, loading, sendMessage, resetChat } = useSharedChat();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, loading]);

  // Sembunyikan floating widget jika sedang berada di halaman penuh chatbot
  if (pathname?.includes('/chatbot')) {
    return null;
  }

  async function handleSend(textToSend?: string) {
    const q = (textToSend ?? input).trim();
    if (!q || loading) return;
    if (!textToSend) setInput('');
    await sendMessage(q);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Header Widget */}
          <div className="bg-gradient-to-r from-red-900 to-red-950 px-4 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <Bot size={18} className="text-yellow-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold flex items-center gap-1">
                  Asisten AI DIY <Sparkles size={11} className="text-yellow-300" />
                </h4>
                <p className="text-[10px] text-white/75">Tersinkron dengan menu Asisten AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetChat}
                title="Bersihkan chat"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <Trash2 size={14} />
              </button>
              <Link
                href={fullPageHref}
                onClick={() => setOpen(false)}
                title="Buka halaman penuh"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <Maximize2 size={14} />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Tutup"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Quick Chips */}
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex gap-1.5 overflow-x-auto">
            {MINI_PROMPTS.map((mp, i) => (
              <button
                key={i}
                type="button"
                disabled={loading}
                onClick={() => handleSend(mp)}
                className="shrink-0 text-[10px] bg-white hover:bg-red-50 text-gray-700 hover:text-red-800 border border-gray-200 px-2.5 py-1 rounded-full transition"
              >
                {mp}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="p-3.5 space-y-3 overflow-y-auto h-80 bg-white">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    m.role === 'user'
                      ? 'bg-red-900 text-white rounded-tr-none'
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  <FormattedText text={m.content} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-600 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-red-800" />
                  Menganalisis database...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 border-t border-gray-100 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pertanyaan..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-red-800"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-red-900 hover:bg-red-950 disabled:opacity-50 text-white p-2 rounded-xl transition"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 bg-gradient-to-r from-red-900 to-red-950 hover:from-red-800 hover:to-red-900 text-white px-4 py-3 rounded-full shadow-xl shadow-red-950/30 transition transform hover:scale-105"
        >
          <Bot size={20} className="text-yellow-300" />
          <span className="text-xs font-bold tracking-wide">Tanya AI DIY</span>
        </button>
      )}
    </div>
  );
}
