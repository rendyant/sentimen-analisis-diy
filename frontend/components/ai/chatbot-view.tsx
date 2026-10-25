'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Trash2, User, Building2, Loader2 } from 'lucide-react';
import { OPD_LIST } from '@/lib/api';
import { useSharedChat } from '@/lib/chat-store';

const QUICK_PROMPTS = [
  'OPD mana yang paling banyak keluhan?',
  'Apa keluhan utama di Dikpora DIY?',
  'Bagaimana performa Dinas Kesehatan DIY?',
  'Berikan rekomendasi solusi untuk keluhan warga',
  'Ringkasan statistik sentimen seluruh OPD',
];

export function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className={line.trim().startsWith('-') || /^\d+\./.test(line.trim()) ? 'pl-2' : ''}>
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={j} className="font-bold">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

export default function ChatbotView({ defaultOpd = '' }: { defaultOpd?: string }) {
  const { messages, instansiId, setInstansiId, loading, sendMessage, resetChat } = useSharedChat(defaultOpd);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend(textToSend?: string) {
    const q = (textToSend ?? input).trim();
    if (!q || loading) return;
    if (!textToSend) setInput('');
    await sendMessage(q);
  }

  return (
    <div className="p-8 bg-gray-100 min-h-[calc(100vh-65px)] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900 to-red-950 rounded-xl p-6 text-white mb-5 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
            <Bot size={26} className="text-yellow-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">ASISTEN AI SENTIMEN DIY</h1>
              <span className="bg-yellow-400/20 text-yellow-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={10} /> SINKRON & REAL-TIME
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              Tanya jawab interaktif berbasis data ulasan warga, statistik sentimen, dan rekomendasi kebijakan 24 OPD DIY
            </p>
          </div>
        </div>

        {/* Filter Konteks OPD & Reset */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xs">
            <Building2 size={14} className="text-yellow-300 shrink-0" />
            <select
              value={instansiId}
              onChange={(e) => setInstansiId(e.target.value)}
              className="bg-transparent text-white font-medium outline-none cursor-pointer max-w-[210px]"
            >
              {OPD_LIST.map((opd) => (
                <option key={opd.id} value={opd.id} className="text-gray-800">
                  {opd.nama}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={resetChat}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
          >
            <Trash2 size={13} /> Bersihkan Chat
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        {/* Pertanyaan Cepat */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-gray-500 uppercase shrink-0">Pertanyaan Cepat:</span>
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleSend(qp)}
              className="shrink-0 text-xs bg-white hover:bg-red-50 hover:text-red-800 hover:border-red-200 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-full transition disabled:opacity-50"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Daftar Pesan */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[520px]">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div key={idx} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-red-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={16} />
                  </div>
                )}
                <div
                  className={`max-w-2xl rounded-2xl px-4 py-3 text-xs ${
                    isUser
                      ? 'bg-red-900 text-white rounded-tr-none'
                      : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-none'
                  }`}
                >
                  <FormattedText text={m.content} />
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-900 text-white flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-gray-500 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-red-800" />
                Menganalisis data ulasan & statistik OPD...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-gray-200 bg-white flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan seputar statistik OPD, keluhan warga, atau rekomendasi solusi..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/10"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-red-900 hover:bg-red-950 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <Send size={14} /> Kirim
          </button>
        </form>
      </div>
    </div>
  );
}
