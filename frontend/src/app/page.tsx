'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { UserSession } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await apiFetch<UserSession>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (user.mustChangePassword) {
        router.push('/change-password');
      } else if (user.role === 'COORDINATOR') {
        router.push('/coordinator');
      } else {
        router.push('/my-training');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Ambient Animated Orbs */}
      <div
        className="pointer-events-none absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl"
        style={{ animation: 'ambientPulse 8s ease-in-out infinite' }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl"
        style={{ animation: 'ambientPulse 10s ease-in-out infinite 2s' }}
      />

      <div className="bento-card animate-bento relative w-full max-w-md p-8 sm:p-10">
        {/* Top Accent Line */}
        <div className="absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-emerald-400" />

        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-emerald-400 shadow-lg shadow-indigo-500/30">
            <span className="h-3 w-3 rotate-45 rounded-xs bg-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
              Bento Studio Portal
            </p>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Learning Progress Tracker
            </h1>
          </div>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-slate-400">
          Sign in with your coordinator account or the temporary credentials issued for your cohort.
        </p>

        {error && (
          <div
            role="alert"
            className="animate-bento mb-5 flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@learning.com"
              className="bento-input w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bento-input w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bento-btn-primary mt-2 w-full py-3 text-sm tracking-wide disabled:opacity-60"
          >
            {submitting ? 'Authenticating...' : 'Sign in to workspace'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between border-t border-indigo-500/15 pt-4 text-[11px] text-slate-400">
          <span>Coordinator-managed access</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Session Protected
          </span>
        </div>
      </div>
    </main>
  );
}