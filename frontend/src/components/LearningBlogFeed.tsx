'use client';

import { useState } from 'react';

export interface BlogPost {
  id: string;
  title: string;
  category: 'Study Guide' | 'Cohort Update' | 'Engineering Note';
  author: string;
  date: string;
  readTime: string;
  summary: string;
  content: string;
  accent: string;
}

const INITIAL_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    title: 'Mastering Weekly Sprint Milestones Without Burnout',
    category: 'Study Guide',
    author: 'Soubhagya · Coordinator',
    date: 'Nov 24, 2026',
    readTime: '3 min read',
    summary:
      'Break multi-hour modules into focused 45-minute deep-work blocks and log incremental status updates as soon as you finish each lab.',
    content:
      'Consistent daily progress beats weekend cramming. Start each session by picking one active assignment, reviewing its planned hours, and setting a clear milestone before opening your IDE. Moving a module to "In Progress" early helps coordinators spot blockers and offer timely feedback.',
    accent: 'from-indigo-400/20 to-sky-400/20 text-sky-200 border-sky-400/30',
  },
  {
    id: 'post-2',
    title: 'Cohort Alpha Architecture Walkthrough & API Checklist',
    category: 'Cohort Update',
    author: 'PDI Training Desk',
    date: 'Nov 22, 2026',
    readTime: '4 min read',
    summary:
      'Key takeaways from this week’s system design review: clean REST versioning, session security, and end-to-end verification.',
    content:
      'Before marking your backend and full-stack modules complete, verify that every endpoint handles validation errors gracefully, session cookies remain HTTP-only, and automated tests pass cleanly in a fresh environment.',
    accent: 'from-emerald-400/20 to-teal-400/20 text-emerald-200 border-emerald-400/30',
  },
  {
    id: 'post-3',
    title: 'How to Write Clear Technical Notes While Learning',
    category: 'Engineering Note',
    author: 'Mentor Collective',
    date: 'Nov 19, 2026',
    readTime: '2 min read',
    summary:
      'Turn every debugging session into a reusable 5-line playbook so future troubleshooting takes seconds instead of hours.',
    content:
      'Whenever you solve a tricky configuration or runtime error, jot down three things: the exact symptom, the root cause, and the verified fix. Over a 12-week cohort, these concise notes become your strongest interview prep asset.',
    accent: 'from-violet-400/20 to-fuchsia-400/20 text-violet-200 border-violet-400/30',
  },
];

export default function LearningBlogFeed({ canPublish = false }: { canPublish?: boolean }) {
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_POSTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BlogPost['category']>('Cohort Update');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');

  function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;
    const accentMap: Record<BlogPost['category'], string> = {
      'Study Guide': 'from-indigo-400/20 to-sky-400/20 text-sky-200 border-sky-400/30',
      'Cohort Update': 'from-emerald-400/20 to-teal-400/20 text-emerald-200 border-emerald-400/30',
      'Engineering Note': 'from-violet-400/20 to-fuchsia-400/20 text-violet-200 border-violet-400/30',
    };
    const newPost: BlogPost = {
      id: `post-${Date.now()}`,
      title: title.trim(),
      category,
      author: 'Coordinator Desk',
      date: 'Just now',
      readTime: `${Math.max(2, Math.ceil((content.length || summary.length) / 250))} min read`,
      summary: summary.trim(),
      content: content.trim() || summary.trim(),
      accent: accentMap[category],
    };
    setPosts([newPost, ...posts]);
    setTitle('');
    setSummary('');
    setContent('');
    setShowComposer(false);
  }

  return (
    <section aria-label="Learning blog and cohort insights" className="bento-card animate-bento delay-4 mt-8 p-6 sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-teal-300 shadow-[0_0_12px_rgba(94,234,212,0.75)]" />
            <h2 className="text-lg font-bold tracking-tight text-slate-100">
              Cohort Journal & Learning Blog
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-300/80">
            Curated study playbooks, cohort announcements, and engineering field notes
          </p>
        </div>

        {canPublish && (
          <button
            type="button"
            onClick={() => setShowComposer((prev) => !prev)}
            className="rounded-xl border border-indigo-300/30 bg-indigo-500/15 px-3.5 py-2 text-xs font-semibold text-indigo-200 transition hover:border-indigo-300/50 hover:bg-indigo-500/25"
          >
            {showComposer ? 'Close editor' : '+ Publish post'}
          </button>
        )}
      </div>

      {canPublish && showComposer && (
        <form
          onSubmit={handlePublish}
          className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-indigo-300/20 bg-slate-900/45 p-4 sm:grid-cols-3"
        >
          <input
            type="text"
            required
            placeholder="Article headline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bento-input px-3.5 py-2 text-sm sm:col-span-2"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as BlogPost['category'])}
            className="bento-input px-3.5 py-2 text-sm"
          >
            <option value="Cohort Update" className="bg-slate-900">Cohort Update</option>
            <option value="Study Guide" className="bg-slate-900">Study Guide</option>
            <option value="Engineering Note" className="bg-slate-900">Engineering Note</option>
          </select>
          <input
            type="text"
            required
            placeholder="Short summary shown on the card..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="bento-input px-3.5 py-2 text-sm sm:col-span-3"
          />
          <textarea
            rows={3}
            placeholder="Full article body (optional)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bento-input px-3.5 py-2 text-sm sm:col-span-3"
          />
          <div className="sm:col-span-3">
            <button type="submit" className="bento-btn-primary px-5 py-2 text-xs">
              Publish to Cohort Feed
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {posts.map((post) => {
          const isOpen = expandedId === post.id;
          return (
            <article
              key={post.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-300/15 bg-slate-900/35 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300/40 hover:bg-slate-900/55"
            >
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full border bg-gradient-to-r px-2.5 py-0.5 text-[11px] font-semibold ${post.accent}`}
                  >
                    {post.category}
                  </span>
                  <span className="text-[11px] text-slate-400">{post.readTime}</span>
                </div>

                <h3 className="text-base font-bold leading-snug text-slate-100 transition group-hover:text-indigo-200">
                  {post.title}
                </h3>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-300/90">{post.summary}</p>

                {isOpen && (
                  <p className="mt-3 border-t border-slate-700/60 pt-3 text-xs leading-relaxed text-slate-200">
                    {post.content}
                  </p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-700/50 pt-3 text-[11px] text-slate-400">
                <span>
                  {post.author} · {post.date}
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : post.id)}
                  className="font-semibold text-teal-300 transition hover:text-teal-200"
                >
                  {isOpen ? 'Show less ↑' : 'Read note →'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}