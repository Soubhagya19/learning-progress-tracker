'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      router.push('/my-training');
    } catch (err: any) {
      setError(err.message || 'Could not update password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="bento-card animate-bento relative w-full max-w-md p-8">
        <div className="absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-emerald-400" />
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-amber-300">
          Security Activation
        </p>
        <h1 className="mb-2 text-xl font-bold text-white">Set your permanent password</h1>
        <p className="mb-6 text-sm text-slate-400">
          Your temporary password must be replaced before accessing your training dashboard.
        </p>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="current" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Temporary password
            </label>
            <input
              id="current"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bento-input w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="newPass" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              New password (minimum 8 characters)
            </label>
            <input
              id="newPass"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bento-input w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="confirmPass" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Confirm new password
            </label>
            <input
              id="confirmPass"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bento-input w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <button type="submit" disabled={submitting} className="bento-btn-primary w-full py-3 text-sm">
            {submitting ? 'Saving...' : 'Save password & continue'}
          </button>
        </form>
      </div>
    </main>
  );
}