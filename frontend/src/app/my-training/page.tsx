'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Assignment } from '@/types';
import LearningBlogFeed from '@/components/LearningBlogFeed';
import StudentStudyChatbot from '@/components/StudentStudyChatbot';

const STATUSES = ['Not Started', 'In Progress', 'Completed'] as const;
type FilterTab = 'All' | (typeof STATUSES)[number];

export default function MyTrainingPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<FilterTab>('All');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; isComplete: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Certificate Upload Modal State
  const [certTarget, setCertTarget] = useState<Assignment | null>(null);
  const [certFileName, setCertFileName] = useState('');
  const [certFileData, setCertFileData] = useState('');
  const [certError, setCertError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Assignment[]>('/api/v1/me/assignments')
      .then(setAssignments)
      .catch((err: any) => {
        if (err.status === 403) {
          router.replace('/change-password');
        } else {
          router.replace('/');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  function openCertificateModal(assignment: Assignment) {
    setCertTarget(assignment);
    setCertFileName(assignment.certificateName || '');
    setCertFileData(assignment.certificateData || '');
    setCertError(null);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setCertError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setCertError('Certificate file must be under 5 MB (PDF, PNG, JPG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCertFileName(file.name);
      setCertFileData(String(reader.result || ''));
    };
    reader.onerror = () => {
      setCertError('Could not read the selected file. Please try another file.');
    };
    reader.readAsDataURL(file);
  }

  async function submitCertificateCompletion(e: React.FormEvent) {
    e.preventDefault();
    if (!certTarget) return;
    if (!certFileData || !certFileName) {
      setCertError('Please upload your completion certificate first — completion requires a verified certificate.');
      return;
    }

    setError(null);
    setUpdatingId(certTarget.id);
    try {
      const updated = await apiFetch<Assignment>(`/api/v1/assignments/${certTarget.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Completed',
          certificateName: certFileName,
          certificateData: certFileData,
        }),
      });
      setAssignments((prev) => prev.map((a) => (a.id === certTarget.id ? updated : a)));
      setToast({
        text: `Certificate "${certFileName}" uploaded & "${certTarget.activityTitle}" marked Completed!`,
        isComplete: true,
      });
      setCertTarget(null);
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setCertError(err.message || 'Certificate upload failed.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleStatusChange(assignment: Assignment, status: string) {
    if (updatingId === assignment.id) return;

    // Require certificate upload whenever selecting "Completed"
    if (status === 'Completed') {
      openCertificateModal(assignment);
      return;
    }

    if (assignment.status === status) return;
    setError(null);
    setUpdatingId(assignment.id);
    try {
      const updated = await apiFetch<Assignment>(`/api/v1/assignments/${assignment.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setAssignments((prev) => prev.map((a) => (a.id === assignment.id ? updated : a)));
      setToast({
        text: `Updated "${assignment.activityTitle}" to ${status}.`,
        isComplete: false,
      });
      setTimeout(() => setToast(null), 3200);
    } catch (err: any) {
      setError(err.message || 'Could not update status.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleLogout() {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/');
  }

  const totalCount = assignments.length;
  const completedCount = assignments.filter((a) => a.status === 'Completed').length;
  const inProgressCount = assignments.filter((a) => a.status === 'In Progress').length;
  const totalHours = assignments.reduce((sum, a) => sum + (a.plannedHours || 0), 0);
  const completedHours = assignments
    .filter((a) => a.status === 'Completed')
    .reduce((sum, a) => sum + (a.plannedHours || 0), 0);
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredAssignments =
    filter === 'All' ? assignments : assignments.filter((a) => a.status === filter);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-indigo-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          Loading your Bento training studio...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden pb-24">
      {/* Ambient Floating Orbs */}
      <div
        className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-indigo-400/15 blur-3xl"
        style={{ animation: 'ambientPulse 9s ease-in-out infinite' }}
      />
      <div
        className="pointer-events-none absolute right-1/4 top-1/3 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl"
        style={{ animation: 'ambientPulse 11s ease-in-out infinite 2s' }}
      />

      {/* Sticky Glass Header */}
      <header className="sticky top-0 z-30 border-b border-indigo-400/15 bg-[#111831]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-emerald-400 shadow-md shadow-indigo-500/25">
              <span className="h-2.5 w-2.5 rotate-45 rounded-xs bg-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white">Learning Progress Tracker</span>
              <span className="ml-2.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                Student Portal
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-indigo-400/25 bg-indigo-950/40 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-indigo-400/50 hover:bg-indigo-900/50 hover:text-white"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-8">
        {/* Top Bento Telemetry Row */}
        <section aria-label="Training overview" className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Hero Progress Ring Bento Card */}
          <div className="bento-card animate-bento delay-1 relative overflow-hidden p-6 lg:col-span-6">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-500/20 blur-2xl" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Live Learning Telemetry
                </span>
                <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-white">
                  My Training Roadmap
                </h1>
                <p className="mt-1 text-xs leading-relaxed text-slate-300/80">
                  {pct === 100 && totalCount > 0
                    ? 'All assigned courses completed with certificates verified!'
                    : `You have completed ${completedCount} of ${totalCount} assigned modules.`}
                </p>
              </div>

              {/* Animated SVG Circular Progress Ring */}
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    fill="none"
                    stroke="rgba(129, 140, 248, 0.16)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    fill="none"
                    stroke="url(#studentRingGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={238.76}
                    strokeDashoffset={238.76 - (238.76 * pct) / 100}
                    className="transition-all duration-700 ease-out"
                  />
                  <defs>
                    <linearGradient id="studentRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center">
                  <span className="text-lg font-extrabold text-white">{pct}%</span>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400">Done</span>
                </div>
              </div>
            </div>

            {/* Shimmer Progress Bar */}
            <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-slate-800/90">
              <div
                className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${pct}%` }}
              >
                <span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  style={{ animation: 'shimmerSweep 2.4s infinite' }}
                />
              </div>
            </div>
          </div>

          {/* Tile 2: Active & In-Progress Count */}
          <div className="bento-card animate-bento delay-2 relative overflow-hidden p-6 lg:col-span-3">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/20 blur-2xl" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300/80">In Progress</span>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-4xl font-extrabold tracking-tight text-white">{inProgressCount}</div>
                <div className="mt-1 text-xs text-indigo-300">Active modules</div>
              </div>
              <div className="flex items-end gap-1">
                {[30, 65, 50, 85, 70].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h * 0.36}px` }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500/40 to-violet-400"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tile 3: Study Hours Telemetry */}
          <div className="bento-card animate-bento delay-3 relative overflow-hidden p-6 lg:col-span-3">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/20 blur-2xl" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300/80">Learning Hours</span>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-4xl font-extrabold tracking-tight text-white">
                  {completedHours}
                  <span className="text-lg font-semibold text-slate-400">/{totalHours}h</span>
                </div>
                <div className="mt-1 text-xs text-emerald-400">Completed effort</div>
              </div>
              <div className="flex items-end gap-1">
                {[40, 55, 70, 60, 95].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h * 0.36}px` }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-emerald-500/40 to-emerald-400"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Floating Live Toast Notification */}
        {toast && (
          <div
            role="status"
            className={`animate-bento mb-6 flex items-center justify-between rounded-2xl border px-5 py-3.5 text-sm shadow-lg ${toast.isComplete
              ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200 shadow-emerald-500/10'
              : 'border-indigo-400/40 bg-indigo-500/15 text-indigo-200 shadow-indigo-500/10'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${toast.isComplete ? 'animate-ping bg-emerald-400' : 'animate-pulse bg-indigo-400'
                  }`}
              />
              <span className="font-medium">{toast.text}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-xs opacity-70 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="animate-bento mb-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200"
          >
            {error}
          </div>
        )}

        {/* Filter Pill Bar */}
        <div className="animate-bento delay-2 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(['All', ...STATUSES] as FilterTab[]).map((tab) => {
              const active = filter === tab;
              const count =
                tab === 'All'
                  ? assignments.length
                  : assignments.filter((a) => a.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${active
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'border border-indigo-400/20 bg-slate-900/45 text-slate-300 hover:border-indigo-400/40 hover:text-white'
                    }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Animated Course Bento Cards */}
        {assignments.length === 0 ? (
          <div className="bento-card p-12 text-center text-sm text-slate-400">
            No learning activities have been assigned to your account yet.
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="bento-card p-10 text-center text-sm text-slate-400">
            No modules match the <strong className="text-white">{filter}</strong> filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {filteredAssignments.map((asg, idx) => {
              const isCompleted = asg.status === 'Completed';
              const isInProgress = asg.status === 'In Progress';
              const isUpdating = updatingId === asg.id;
              const cardProgress = isCompleted ? 100 : isInProgress ? 50 : 8;

              return (
                <div
                  key={asg.id}
                  style={{ animationDelay: `${idx * 70}ms` }}
                  className={`bento-card animate-bento group relative flex flex-col justify-between gap-5 overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 ${isCompleted
                    ? 'border-emerald-500/35 shadow-emerald-500/10'
                    : isInProgress
                      ? 'border-indigo-400/40 shadow-indigo-500/15'
                      : ''
                    }`}
                >
                  {/* Top Subtle Glow Strip */}
                  <div
                    className={`absolute inset-x-0 top-0 h-[2px] transition-opacity duration-300 ${isCompleted
                      ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-100'
                      : isInProgress
                        ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-400 opacity-100'
                        : 'bg-slate-700/40 opacity-50'
                      }`}
                  />

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="rounded-lg border border-indigo-400/25 bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-300">
                        {asg.activityTopic}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-800/90 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                          {asg.plannedHours} hrs
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isCompleted
                            ? 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                            : isInProgress
                              ? 'border border-indigo-400/30 bg-indigo-500/15 text-indigo-300'
                              : 'border border-slate-700 bg-slate-800/80 text-slate-400'
                            }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${isCompleted
                              ? 'bg-emerald-400'
                              : isInProgress
                                ? 'animate-ping bg-indigo-400'
                                : 'bg-slate-500'
                              }`}
                          />
                          {asg.status}
                        </span>
                      </div>
                    </div>

                    <h2 className="text-lg font-bold tracking-tight text-white transition group-hover:text-indigo-200">
                      {asg.activityTitle}
                    </h2>

                    {/* Certificate Proof Badge when Uploaded */}
                    {asg.certificateName && (
                      <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                        <span className="truncate font-medium">
                          Certificate: {asg.certificateName}
                        </span>
                        <div className="ml-2 flex shrink-0 items-center gap-2">
                          {asg.certificateData && (
                            <a
                              href={asg.certificateData}
                              download={asg.certificateName}
                              className="font-semibold text-teal-300 underline hover:text-teal-200"
                            >
                              View
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => openCertificateModal(asg)}
                            className="text-[11px] text-slate-300 hover:text-white"
                          >
                            Replace
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Individual Module Progress Bar */}
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                        <span>Module progress</span>
                        <span className="font-semibold text-slate-300">{isCompleted ? '100%' : isInProgress ? '50%' : '0%'}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : isInProgress
                              ? 'bg-gradient-to-r from-indigo-500 to-violet-400'
                              : 'bg-slate-600'
                            }`}
                          style={{ width: `${cardProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Interactive One-Click Status Selector Pills */}
                  <div>
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {isUpdating ? 'Syncing progress...' : 'Update Milestone Status (Cert required for Completed)'}
                    </span>
                    <div className="grid grid-cols-3 gap-2 rounded-xl border border-indigo-500/15 bg-slate-900/55 p-1.5">
                      {STATUSES.map((statusOption) => {
                        const selected = asg.status === statusOption;
                        let activeClass = 'bg-slate-700 text-white shadow';
                        if (selected && statusOption === 'In Progress') {
                          activeClass =
                            'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30';
                        } else if (selected && statusOption === 'Completed') {
                          activeClass =
                            'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/30';
                        }

                        return (
                          <button
                            key={statusOption}
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(asg, statusOption)}
                            className={`rounded-lg px-2 py-2 text-center text-[11px] font-semibold transition-all duration-200 disabled:opacity-50 ${selected
                              ? activeClass
                              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                              }`}
                          >
                            {statusOption}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <LearningBlogFeed canPublish={false} />
      </main>

      {/* Mandatory Certificate Upload Modal */}
      {certTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
          <div className="bento-card animate-bento w-full max-w-md border-emerald-400/40 bg-[#131b36] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  Certificate Verification Required
                </span>
                <h3 className="mt-2 text-lg font-bold text-white">{certTarget.activityTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setCertTarget(null)}
                className="rounded-lg px-2.5 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="mb-4 text-xs leading-relaxed text-slate-300">
              Upload your completion certificate (<strong className="text-white">PDF, PNG, JPG, or WEBP</strong>, max 5 MB) to verify and mark this module as <strong className="text-emerald-300">Completed</strong>.
            </p>

            <form onSubmit={submitCertificateCompletion} className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-400/35 bg-slate-900/60 px-4 py-6 text-center transition hover:border-emerald-400/50 hover:bg-slate-900/80">
                <span className="text-xs font-semibold text-indigo-200">
                  {certFileName ? `Selected: ${certFileName}` : 'Click to choose certificate file'}
                </span>
                <span className="mt-1 text-[11px] text-slate-400">PDF, PNG, JPG, or WEBP up to 5 MB</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              {certError && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2.5 text-xs text-rose-200">
                  {certError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setCertTarget(null)}
                  className="rounded-xl border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!certFileData || updatingId === certTarget.id}
                  className="bento-btn-primary px-5 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {updatingId === certTarget.id ? 'Uploading...' : 'Upload & Mark Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Floating Study Assistant Chatbot */}
      <StudentStudyChatbot assignments={assignments} />
    </div>
  );
}