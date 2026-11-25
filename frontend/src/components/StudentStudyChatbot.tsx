'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Assignment } from '@/types';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

const QUICK_PROMPTS = [
  'What should I study next?',
  'Explain Spring Security JWT vs Session',
  'Quiz me on my active topic',
  'Give me a 45-min study sprint',
];

export default function StudentStudyChatbot({ assignments }: { assignments: Assignment[] }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hi! I am powered by Gemini AI and synced with your training roadmap. Ask me anything — coding doubts, system design, interview questions, or study plans!',
      time: 'Gemini Live',
    },
  ]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing, open]);

  async function handleSend(textToSend?: string) {
    const trimmed = (textToSend ?? input).trim();
    if (!trimmed || typing) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      time: now,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setTyping(true);

    try {
      const data = await apiFetch<{ reply: string }>('/api/v1/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-8).map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      const completed = assignments.filter((a) => a.status === 'Completed').length;
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: `${err.message || 'Unable to reach Gemini right now.'} (Roadmap status: ${completed}/${assignments.length} modules completed.)`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="bento-card animate-bento mb-3.5 flex h-[500px] w-[345px] flex-col overflow-hidden border-indigo-400/35 bg-[#121a35]/95 shadow-2xl shadow-indigo-950/80 sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-indigo-400/20 bg-gradient-to-r from-indigo-600/30 via-violet-600/25 to-teal-500/25 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-white">Ask Gemini · Live Coach</h3>
                <p className="text-[10px] text-indigo-200/80">Ask anything · Synced with {assignments.length} modules</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: `reset-${Date.now()}`,
                      sender: 'bot',
                      text: 'Chat cleared! Ask me anything about your courses, coding, or career prep.',
                      time: 'Gemini Live',
                    },
                  ])
                }
                className="rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[86%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25'
                      : 'border border-indigo-400/20 bg-slate-900/80 text-slate-100'
                  }`}
                >
                  {m.text}
                </div>
                <span className="mt-1 px-1 text-[10px] text-slate-400">{m.time}</span>
              </div>
            ))}

            {typing && (
              <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-indigo-300">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-400 [animation-delay:300ms]" />
                <span>Gemini is thinking...</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-slate-800/80 bg-slate-950/40 px-3 py-2">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp}
                type="button"
                onClick={() => handleSend(qp)}
                className="shrink-0 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-medium text-indigo-200 transition hover:border-indigo-300/50 hover:bg-indigo-500/25"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-indigo-400/20 bg-slate-950/70 p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Gemini anything..."
              className="bento-input flex-1 px-3 py-2 text-xs"
            />
            <button type="submit" disabled={typing} className="bento-btn-primary px-3.5 py-2 text-xs disabled:opacity-50">
              Ask
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="bento-btn-primary group flex items-center gap-2.5 rounded-full px-5 py-3.5 text-xs font-bold shadow-xl shadow-indigo-600/35"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-80" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </span>
        <span>{open ? 'Hide Gemini Coach' : 'Ask Gemini AI'}</span>
      </button>
    </div>
  );
}