'use client';

import { useEffect, useRef, useState } from 'react';
import { Assignment } from '@/types';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

const QUICK_PROMPTS = [
  'What should I focus on next?',
  'How do I mark a course Completed?',
  'Summarize my progress & hours',
  'Give me a 45-min study sprint plan',
];

export default function StudentStudyChatbot({ assignments }: { assignments: Assignment[] }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hi! I am your live Learning Coach. Ask me what module to tackle next, how to upload your completion certificate, or for a custom study plan.',
      time: 'Live',
    },
  ]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing, open]);

  function buildReply(question: string): string {
    const q = question.toLowerCase();
    const total = assignments.length;
    const completed = assignments.filter((a) => a.status === 'Completed');
    const inProgress = assignments.filter((a) => a.status === 'In Progress');
    const notStarted = assignments.filter((a) => a.status === 'Not Started');
    const totalHrs = assignments.reduce((s, a) => s + (a.plannedHours || 0), 0);
    const doneHrs = completed.reduce((s, a) => s + (a.plannedHours || 0), 0);

    if (q.includes('cert') || q.includes('complete') || q.includes('upload')) {
      return 'To mark any course as Completed: click the "Completed" button on the course card, attach your completion certificate (PDF, PNG, JPG, or WEBP up to 5 MB), and confirm submission. Your coordinator will immediately see the verified badge and file.';
    }

    if (q.includes('progress') || q.includes('summary') || q.includes('hour') || q.includes('stat')) {
      if (total === 0) {
        return 'You do not have any assigned modules yet. Check back once your coordinator assigns your cohort courses!';
      }
      const pct = Math.round((completed.length / total) * 100);
      return `You have completed ${completed.length}/${total} modules (${pct}%) and logged ${doneHrs} of ${totalHrs} planned hours. Currently ${inProgress.length} module(s) are In Progress and ${notStarted.length} are Not Started.`;
    }

    if (q.includes('next') || q.includes('focus') || q.includes('recommend') || q.includes('start')) {
      if (inProgress.length > 0) {
        const current = inProgress[0];
        return `Your top priority is finishing "${current.activityTitle}" (${current.activityTopic}, ${current.plannedHours} hrs), which is already In Progress. Once done, upload your certificate to lock in completion!`;
      }
      if (notStarted.length > 0) {
        const nextUp = [...notStarted].sort((a, b) => a.plannedHours - b.plannedHours)[0];
        return `Start with "${nextUp.activityTitle}" (${nextUp.activityTopic}) — it is only ${nextUp.plannedHours} hrs, making it a quick momentum win. Switch its status to "In Progress" when you begin.`;
      }
      return 'Amazing work — every single assigned module is already marked Completed with certificates verified!';
    }

    if (q.includes('sprint') || q.includes('plan') || q.includes('study') || q.includes('tip')) {
      const target = inProgress[0] ?? notStarted[0];
      const topicHint = target ? ` on "${target.activityTitle}"` : '';
      return `Here is a 45-minute sprint plan${topicHint}:\n1) 0–5 min: Review module objectives & open your IDE.\n2) 5–35 min: Build or test one concrete feature with notifications muted.\n3) 35–45 min: Write a 3-bullet summary note and update your milestone status.`;
    }

    const matchedCourse = assignments.find(
      (a) => q.includes(a.activityTitle.toLowerCase()) || q.includes(a.activityTopic.toLowerCase())
    );
    if (matchedCourse) {
      return `"${matchedCourse.activityTitle}" (${matchedCourse.activityTopic}) is ${matchedCourse.plannedHours} hrs and currently marked "${matchedCourse.status}".${
        matchedCourse.certificateName ? ` Certificate on file: ${matchedCourse.certificateName}.` : ''
      }`;
    }

    return `You currently have ${inProgress.length} active and ${notStarted.length} upcoming modules (${totalHrs - doneHrs} hrs remaining). Try asking "What should I focus on next?" or "How do I mark a course Completed?"`;
  }

  function handleSend(textToSend?: string) {
    const trimmed = (textToSend ?? input).trim();
    if (!trimmed || typing) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      time: now,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: buildReply(trimmed),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 450);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="bento-card animate-bento mb-3.5 flex h-[460px] w-[340px] flex-col overflow-hidden border-indigo-400/35 bg-[#121a35]/95 shadow-2xl shadow-indigo-950/80 sm:w-[380px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-indigo-400/20 bg-gradient-to-r from-indigo-600/30 via-violet-600/25 to-teal-500/25 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-white">Live Study Coach</h3>
                <p className="text-[10px] text-indigo-200/80">Synced with your live roadmap</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 leading-relaxed ${
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
              <div className="flex items-center gap-1.5 px-2 py-1 text-indigo-300">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-400 [animation-delay:300ms]" />
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
              placeholder="Ask your study assistant..."
              className="bento-input flex-1 px-3 py-2 text-xs"
            />
            <button type="submit" className="bento-btn-primary px-3.5 py-2 text-xs">
              Send
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
        <span>{open ? 'Hide Study Coach' : 'Live Study Coach'}</span>
      </button>
    </div>
  );
}