'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Activity, Assignment, CohortSummary, CreatedCredentials, Learner } from '@/types';
import LearningBlogFeed from '@/components/LearningBlogFeed';

export default function CoordinatorDashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<CohortSummary>({ totalLearners: 0, totalAssignments: 0, completedAssignments: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState<number | null>(null);
  const [learnerAssignments, setLearnerAssignments] = useState<Assignment[]>([]);

  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);
  const [actTitle, setActTitle] = useState('');
  const [actTopic, setActTopic] = useState('');
  const [actHours, setActHours] = useState('4');

  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candCohort, setCandCohort] = useState('Cohort Alpha');
  const [issuedCreds, setIssuedCreds] = useState<CreatedCredentials | null>(null);
  const [copied, setCopied] = useState(false);

  const [assignActivityId, setAssignActivityId] = useState<string>('');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const completionPct =
    summary.totalAssignments > 0
      ? Math.round((summary.completedAssignments / summary.totalAssignments) * 100)
      : 0;

  async function refreshAll(activeLearnerId?: number | null) {
    const [sumData, actData, lrnData] = await Promise.all([
      apiFetch<CohortSummary>('/api/v1/cohort-summary'),
      apiFetch<Activity[]>('/api/v1/activities'),
      apiFetch<Learner[]>('/api/v1/learners'),
    ]);
    setSummary(sumData);
    setActivities(actData);
    setLearners(lrnData);

    const candidateId = activeLearnerId !== undefined ? activeLearnerId : selectedLearnerId;
    const stillExists = lrnData.some((l) => l.id === candidateId);
    const targetId = stillExists ? candidateId! : (lrnData[0]?.id ?? null);

    setSelectedLearnerId(targetId);
    if (targetId) {
      const asgs = await apiFetch<Assignment[]>(`/api/v1/learners/${targetId}/assignments`);
      setLearnerAssignments(asgs);
    } else {
      setLearnerAssignments([]);
    }
  }

  useEffect(() => {
    refreshAll()
      .catch(() => router.replace('/'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelectLearner(id: number) {
    setSelectedLearnerId(id);
    const asgs = await apiFetch<Assignment[]>(`/api/v1/learners/${id}/assignments`);
    setLearnerAssignments(asgs);
  }

  async function handleSaveActivity(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    try {
      const payload = { title: actTitle, topic: actTopic, plannedHours: Number(actHours) };
      if (editingActivityId) {
        await apiFetch(`/api/v1/activities/${editingActivityId}`, { method: 'PUT', body: JSON.stringify(payload) });
        setBanner({ type: 'success', text: 'Course updated successfully.' });
      } else {
        await apiFetch('/api/v1/activities', { method: 'POST', body: JSON.stringify(payload) });
        setBanner({ type: 'success', text: 'New course added to catalog.' });
      }
      setEditingActivityId(null);
      setActTitle('');
      setActTopic('');
      setActHours('4');
      await refreshAll();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  }

  async function handleDeleteActivity(act: Activity) {
    if (!window.confirm(`Delete course "${act.title}" and remove all student assignments for it?`)) return;
    setBanner(null);
    try {
      await apiFetch<void>(`/api/v1/activities/${act.id}`, { method: 'DELETE' });
      if (editingActivityId === act.id) {
        setEditingActivityId(null);
        setActTitle('');
        setActTopic('');
        setActHours('4');
      }
      setBanner({ type: 'success', text: `Deleted course "${act.title}".` });
      await refreshAll();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  }

  function startEditActivity(act: Activity) {
    setEditingActivityId(act.id);
    setActTitle(act.title);
    setActTopic(act.topic);
    setActHours(String(act.plannedHours));
  }

  async function handleCreateCandidate(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    setIssuedCreds(null);
    setCopied(false);
    try {
      const creds = await apiFetch<CreatedCredentials>('/api/v1/learners', {
        method: 'POST',
        body: JSON.stringify({ name: candName, email: candEmail, cohort: candCohort }),
      });
      setIssuedCreds(creds);
      setCandName('');
      setCandEmail('');
      setBanner({ type: 'success', text: `Student ${creds.displayName} onboarded. Copy credentials below.` });
      await refreshAll(creds.learnerId);
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  }

  async function handleDeleteLearner(learnerId: number) {
    const target = learners.find((l) => l.id === learnerId);
    if (!target) return;
    if (!window.confirm(`Delete student "${target.displayName}" (${target.email}) and all their progress records?`)) return;
    setBanner(null);
    setIssuedCreds(null);
    try {
      await apiFetch<void>(`/api/v1/learners/${learnerId}`, { method: 'DELETE' });
      setBanner({ type: 'success', text: `Removed student "${target.displayName}".` });
      await refreshAll(null);
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  }

  async function handleResetPassword(learnerId: number) {
    setBanner(null);
    setIssuedCreds(null);
    setCopied(false);
    try {
      const creds = await apiFetch<CreatedCredentials>(`/api/v1/learners/${learnerId}/reset-password`, {
        method: 'POST',
      });
      setIssuedCreds(creds);
      setBanner({ type: 'success', text: `Temporary password regenerated for ${creds.displayName}.` });
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  }

  async function handleAssignActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLearnerId || !assignActivityId) return;
    setBanner(null);
    try {
      await apiFetch('/api/v1/assignments', {
        method: 'POST',
        body: JSON.stringify({ learnerId: selectedLearnerId, activityId: Number(assignActivityId) }),
      });
      setAssignActivityId('');
      setBanner({ type: 'success', text: 'Course assigned to student.' });
      await refreshAll(selectedLearnerId);
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  }

  async function handleLogout() {
    await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/');
  }

  function copyCredentials() {
    if (!issuedCreds) return;
    navigator.clipboard.writeText(`Email: ${issuedCreds.email}\nTemporary Password: ${issuedCreds.temporaryPassword}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-indigo-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          Loading Bento Studio workspace...
        </div>
      </div>
    );
  }

  const selectedLearner = learners.find((l) => l.id === selectedLearnerId) ?? null;

  return (
    <div className="relative min-h-screen overflow-hidden pb-16"><div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-indigo-400/15 blur-3xl" style={{ animation: "ambientPulse 9s ease-in-out infinite" }} /><div className="pointer-events-none absolute right-1/4 top-1/3 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" style={{ animation: "ambientPulse 11s ease-in-out infinite 2s" }} />
      {/* Top Glass Header */}
      <header className="sticky top-0 z-30 border-b border-indigo-500/15 bg-[#111831]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-emerald-400 shadow-md shadow-indigo-500/25">
              <span className="h-2.5 w-2.5 rotate-45 rounded-xs bg-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white">Learning Progress Tracker</span>
              <span className="ml-2.5 rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
                Coordinator Portal
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

      <main className="mx-auto max-w-7xl px-6 pt-8">
        {/* Top Row: 3 Bento KPI Tiles */}
        <section aria-label="Cohort summary" className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Tile 1: Total Students */}
          <div className="bento-card animate-bento delay-1 relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/20 blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Students</span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                Active Cohort
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-4xl font-extrabold tracking-tight text-white">{summary.totalLearners}</div>
              <div className="flex items-end gap-1">
                {[35, 55, 45, 75, 65, 95].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h * 0.34}px` }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-emerald-500/40 to-emerald-400 transition-all duration-500"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tile 2: Total Assignments */}
          <div className="bento-card animate-bento delay-2 relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-500/20 blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Assignments</span>
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
                {activities.length} Courses
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-4xl font-extrabold tracking-tight text-white">{summary.totalAssignments}</div>
              <div className="flex items-end gap-1">
                {[40, 60, 80, 50, 90, 75].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h * 0.34}px` }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500/40 to-violet-400 transition-all duration-500"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tile 3: Completed Assignments with Animated Progress Ring */}
          <div className="bento-card animate-bento delay-3 relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/20 blur-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed Assignments</span>
                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className="text-4xl font-extrabold tracking-tight text-white">
                    {summary.completedAssignments}
                  </span>
                  <span className="text-xs font-medium text-emerald-400">
                    of {summary.totalAssignments} done
                  </span>
                </div>
              </div>

              {/* Animated SVG Ring */}
              <div className="relative flex h-16 w-16 items-center justify-center">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="rgba(129, 140, 248, 0.16)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="url(#bentoRingGrad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={163.36}
                    strokeDashoffset={163.36 - (163.36 * completionPct) / 100}
                    className="transition-all duration-700 ease-out"
                  />
                  <defs>
                    <linearGradient id="bentoRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute text-xs font-bold text-white">{completionPct}%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Status Toast Banner */}
        {banner && (
          <div
            role="status"
            className={`animate-bento mb-6 flex items-center justify-between rounded-2xl border px-5 py-3.5 text-sm ${banner.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2 w-2 rounded-full ${banner.type === 'success' ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                  }`}
              />
              {banner.text}
            </div>
            <button onClick={() => setBanner(null)} className="text-xs opacity-70 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {/* One-Time Temporary Credentials Box */}
        {issuedCreds && (
          <div className="bento-card animate-bento mb-8 border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-violet-500/10 to-indigo-500/15 p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400" />
                <strong className="text-base font-bold text-white">
                  One-Time Student Credentials (Copy Now)
                </strong>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={copyCredentials}
                  className="rounded-lg border border-amber-400/40 bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/30"
                >
                  {copied ? 'Copied!' : 'Copy credentials'}
                </button>
                <button
                  onClick={() => setIssuedCreds(null)}
                  className="text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <p className="mb-3 text-xs text-amber-200/80">
              Shown once only. Valid for 24 hours ({issuedCreds.expiresAt}). Student will set a permanent password on first login.
            </p>
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#111831]/75 p-4 font-mono text-xs sm:grid-cols-2">
              <div className="text-slate-300">
                <span className="text-slate-500">Email: </span>
                <span className="text-emerald-300">{issuedCreds.email}</span>
              </div>
              <div className="text-slate-300">
                <span className="text-slate-500">Temporary Password: </span>
                <span className="text-amber-300">{issuedCreds.temporaryPassword}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Bento Grid: Courses (Left) + Onboarding & Student Progress (Right) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Bento Panel: Courses & Learning Activities */}
          <section className="bento-card animate-bento delay-2 p-6 lg:col-span-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Courses & Learning Activities</h2>
                <p className="text-xs text-slate-400">Create, edit, or delete cohort curriculum modules</p>
              </div>
              <span className="rounded-lg bg-indigo-500/15 px-2.5 py-1 text-xs font-bold text-indigo-300">
                {activities.length}
              </span>
            </div>

            <form
              onSubmit={handleSaveActivity}
              className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-indigo-500/15 bg-slate-900/40 p-4 sm:grid-cols-4"
            >
              <input
                type="text"
                placeholder="Course title"
                required
                value={actTitle}
                onChange={(e) => setActTitle(e.target.value)}
                className="bento-input px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                type="text"
                placeholder="Topic"
                required
                value={actTopic}
                onChange={(e) => setActTopic(e.target.value)}
                className="bento-input px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={1}
                placeholder="Hrs"
                required
                value={actHours}
                onChange={(e) => setActHours(e.target.value)}
                className="bento-input px-3 py-2 text-sm"
              />
              <div className="flex gap-2 sm:col-span-4">
                <button type="submit" className="bento-btn-primary px-4 py-2 text-xs">
                  {editingActivityId ? 'Save changes' : '+ Add course'}
                </button>
                {editingActivityId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingActivityId(null);
                      setActTitle('');
                      setActTopic('');
                      setActHours('4');
                    }}
                    className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {activities.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No courses added yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {activities.map((act) => (
                  <li
                    key={act.id}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-indigo-500/15 bg-slate-900/45 px-4 py-3 transition hover:border-indigo-400/40 hover:bg-slate-800/60"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-indigo-200 transition">
                        {act.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {act.topic} Ã‚Â· <span className="text-emerald-400">{act.plannedHours} hrs</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditActivity(act)}
                        className="rounded-lg border border-indigo-400/25 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/25"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(act)}
                        className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/25"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Right Column: Onboard Student + Student Progress & Assignments */}
          <div className="space-y-6 lg:col-span-7">
            {/* Top Right Bento: Onboard Student */}
            <section className="bento-card animate-bento delay-3 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white">Onboard Student</h2>
                <p className="text-xs text-slate-400">Generate a verified student account with one-time login credentials</p>
              </div>
              <form onSubmit={handleCreateCandidate} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Full name"
                  required
                  value={candName}
                  onChange={(e) => setCandName(e.target.value)}
                  className="bento-input px-3.5 py-2.5 text-sm"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={candEmail}
                  onChange={(e) => setCandEmail(e.target.value)}
                  className="bento-input px-3.5 py-2.5 text-sm"
                />
                <input
                  type="text"
                  placeholder="Cohort"
                  required
                  value={candCohort}
                  onChange={(e) => setCandCohort(e.target.value)}
                  className="bento-input px-3.5 py-2.5 text-sm"
                />
                <button type="submit" className="bento-btn-primary py-2.5 text-xs sm:col-span-3">
                  Create student account
                </button>
              </form>
            </section>

            {/* Bottom Right Bento: Student Progress & Assignments */}
            <section className="bento-card animate-bento delay-4 p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Student Progress & Assignments</h2>
                  <p className="text-xs text-slate-400">Inspect completion telemetry, assign modules, or manage access</p>
                </div>
                {selectedLearnerId && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResetPassword(selectedLearnerId)}
                      className="rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/20"
                    >
                      Reset password
                    </button>
                    <button
                      onClick={() => handleDeleteLearner(selectedLearnerId)}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/25"
                    >
                      Delete student
                    </button>
                  </div>
                )}
              </div>

              {learners.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No students enrolled yet.</p>
              ) : (
                <>
                  {/* Student Selector + Avatar Pill */}
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    {selectedLearner && (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-400 text-sm font-extrabold text-white shadow-md">
                        {selectedLearner.displayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <label htmlFor="learner-select" className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Active Student Profile
                      </label>
                      <select
                        id="learner-select"
                        value={selectedLearnerId ?? ''}
                        onChange={(e) => handleSelectLearner(Number(e.target.value))}
                        className="bento-input w-full px-3.5 py-2 text-sm"
                      >
                        {learners.map((l) => (
                          <option key={l.id} value={l.id} className="bg-[#0b0e20] text-white">
                            {l.displayName} ({l.cohort} Ã‚Â· {l.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedLearnerId && (
                    <>
                      <form onSubmit={handleAssignActivity} className="mb-5 flex gap-2.5">
                        <select
                          aria-label="Course to assign"
                          required
                          value={assignActivityId}
                          onChange={(e) => setAssignActivityId(e.target.value)}
                          className="bento-input flex-1 px-3.5 py-2.5 text-sm"
                        >
                          <option value="" className="bg-[#0b0e20] text-slate-400">
                            Choose course to assign...
                          </option>
                          {activities.map((a) => (
                            <option key={a.id} value={a.id} className="bg-[#0b0e20] text-white">
                              {a.title} ({a.plannedHours} hrs)
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95"
                        >
                          Assign
                        </button>
                      </form>

                      {learnerAssignments.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-700 py-6 text-center text-sm text-slate-500">
                          No courses assigned to this student yet.
                        </p>
                      ) : (
                        <ul className="space-y-2.5">
                          {learnerAssignments.map((asg) => {
                            const isCompleted = asg.status === 'Completed';
                            const isInProgress = asg.status === 'In Progress';
                            return (
                              <li
                                key={asg.id}
                                className="flex items-center justify-between rounded-xl border border-indigo-500/15 bg-slate-900/45 px-4 py-3 text-sm transition hover:border-indigo-400/35"
                              >
                                <div>
                                  <span className="font-semibold text-white">{asg.activityTitle}</span>
                                  <span className="ml-2 text-xs text-slate-400">({asg.plannedHours} hrs)</span>{asg.certificateName && asg.certificateData && (<a href={asg.certificateData} download={asg.certificateName} className="ml-2.5 inline-flex items-center rounded-md border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25">Cert: {asg.certificateName}</a>)}
                                </div>
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isCompleted
                                      ? 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                                      : isInProgress
                                        ? 'border border-indigo-400/30 bg-indigo-500/15 text-indigo-300'
                                        : 'border border-slate-600/40 bg-slate-800/70 text-slate-300'
                                    }`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${isCompleted
                                        ? 'bg-emerald-400'
                                        : isInProgress
                                          ? 'animate-pulse bg-indigo-400'
                                          : 'bg-slate-400'
                                      }`}
                                  />
                                  {asg.status}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
              <LearningBlogFeed canPublish={true} />
      </main>
    </div>
  );
}