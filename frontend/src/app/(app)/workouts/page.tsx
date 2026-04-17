'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useWorkoutStore } from '@/stores/workoutStore';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { usePageTitle } from '@/hooks/usePageTitle';

interface Session {
  id: string;
  name: string | null;
  started_at: string;
  ended_at: string | null;
  _count: { session_sets: number };
}

interface AiInsights {
  metrics?: { streak?: number };
}

interface PlannedEx {
  id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  exercise: { id: string; name: string; primary_muscle: string; equipment: string };
}

interface TodaySchedule {
  id: string;
  name: string | null;
  is_completed: boolean;
  scheduled_exercises: PlannedEx[];
}

function durationMins(start: string, end: string | null) {
  if (!end) return null;
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

function relativeDay(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'HÔM NAY';
  if (days === 1) return 'HÔM QUA';
  return `${days} NGÀY TRƯỚC`;
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WorkoutsPage() {
  const router = useRouter();
  const { activeSession, startSession } = useWorkoutStore();
  const { t } = useT();
  usePageTitle('Tập luyện');
  const [starting, setStarting] = useState(false);
  const [sessionName, setSessionName] = useState('');

  // Recent 3 sessions
  const { data: recentData } = useQuery({
    queryKey: queryKeys.workouts.sessions({ limit: 3 }),
    queryFn: () =>
      api
        .get<{ data: Session[] }>('/workouts/sessions?limit=3')
        .then((r) => r.data.data),
  });

  // AI insights for streak
  const { data: insightsData } = useQuery({
    queryKey: queryKeys.ai.insights(),
    queryFn: () =>
      api
        .get<{ data: AiInsights }>('/ai/insights', { params: { period: 'week' } })
        .then((r) => r.data.data),
  });

  const streak = insightsData?.metrics?.streak ?? 0;

  // Today's scheduled plan
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const { data: todaySchedules } = useQuery({
    queryKey: queryKeys.schedule.today(todayDateStr),
    queryFn: () =>
      api
        .get<{ data: TodaySchedule[] }>(`/schedule/today?date=${todayDateStr}`)
        .then((r) => r.data.data),
  });
  const todayPlan = todaySchedules?.find((s) => !s.is_completed) ?? todaySchedules?.[0] ?? null;

  const handleStartFromPlan = async (plan: TodaySchedule) => {
    setStarting(true);
    try {
      const res = await api.post<{ data: { id: string; name: string | null; started_at: string } }>(
        '/workouts/sessions',
        { name: plan.name ?? 'Kế Hoạch Hôm Nay', scheduled_id: plan.id },
      );
      const s = res.data.data;
      startSession({
        id: s.id,
        name: s.name ?? 'Kế Hoạch Hôm Nay',
        startedAt: s.started_at,
        scheduledId: plan.id,
        plannedExercises: plan.scheduled_exercises.map((ex) => ({
          id: ex.id,
          exerciseId: ex.exercise_id,
          exerciseName: ex.exercise.name,
          primaryMuscle: ex.exercise.primary_muscle,
          sets: ex.sets,
          reps: ex.reps,
          weightKg: ex.weight_kg,
        })),
      });
      router.push('/workouts/session');
    } finally {
      setStarting(false);
    }
  };

  const handleStartSession = async () => {
    setStarting(true);
    try {
      const res = await api.post<{ data: { id: string; name: string | null; started_at: string } }>(
        '/workouts/sessions',
        { name: sessionName || undefined },
      );
      const s = res.data.data;
      startSession({
        id: s.id,
        name: s.name ?? t.workouts.defaultName,
        startedAt: s.started_at,
      });
      router.push('/workouts/session');
    } finally {
      setStarting(false);
    }
  };

  // Date header
  const now = new Date();
  const dateLabel = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#1a1b2e] text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="relative w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm bài tập..."
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-4 py-2 text-xs text-slate-400 placeholder:text-slate-600 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
            U
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-5xl space-y-6">
        {/* ── Heading ─────────────────────────────────────────────── */}
        <div>
          <h1 className="text-5xl font-black text-white tracking-tight leading-none mb-2">
            Sẵn Sàng Tập
          </h1>
          <p className="text-slate-500 text-sm capitalize">
            {dateLabel}
          </p>
        </div>

        {/* ── Active session resume banner ─────────────────────────── */}
        {activeSession && (
          <Link
            href="/workouts/session"
            className="flex items-center gap-3 rounded-2xl border border-blue-500/30 bg-blue-600/10 px-5 py-4"
          >
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-blue-400 text-sm">{t.workouts.session.activeSession}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{activeSession.name}</p>
            </div>
            <span className="text-xs font-semibold text-blue-400">{t.workouts.resume} →</span>
          </Link>
        )}

        {/* ── Today's Plan ────────────────────────────────────────── */}
        {todayPlan && todayPlan.scheduled_exercises.length > 0 && (
          <div className="rounded-2xl border border-violet-500/25 bg-violet-600/5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-violet-500/15">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <p className="text-xs font-black text-violet-400 uppercase tracking-widest">KẾ HOẠCH HÔM NAY</p>
              </div>
              {!activeSession && (
                <button
                  onClick={() => handleStartFromPlan(todayPlan)}
                  disabled={starting}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  BẮT ĐẦU
                </button>
              )}
            </div>
            <div className="px-5 py-3">
              <p className="text-sm font-bold text-white mb-3">
                {todayPlan.name ?? 'Kế hoạch hôm nay'}
              </p>
              <div className="space-y-2">
                {todayPlan.scheduled_exercises.map((ex, idx) => (
                  <div key={ex.id} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-violet-500 w-4 shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{ex.exercise.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{ex.exercise.primary_muscle.replace('_', ' ')}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 shrink-0">
                      {ex.sets} × {ex.reps}
                      {ex.weight_kg != null ? ` @ ${ex.weight_kg}kg` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Main grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: New Session card */}
          <div className="lg:col-span-2 rounded-2xl bg-white/4 border border-white/8 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-600/20 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Buổi Tập Mới</h2>
                <p className="text-sm text-slate-500 mt-0.5">Theo dõi cường độ và khối lượng tập theo thời gian thực</p>
              </div>
            </div>

            {!activeSession && (
              <>
                <div className="mb-6">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                    Tên Buổi Tập
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="vd. Ngày Đẩy Nặng A"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !starting && handleStartSession()}
                      className={cn(
                        'w-full rounded-xl bg-[#111223] border border-white/8 pl-11 pr-4 py-4 text-sm text-white placeholder:text-slate-600',
                        'outline-none transition-all',
                        'focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20',
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleStartSession}
                    disabled={starting}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-8 py-4 text-sm font-bold text-white transition-all duration-200',
                      'bg-blue-600 hover:bg-blue-500 active:scale-[0.98]',
                      'shadow-xl shadow-blue-600/25',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                  >
                    {starting ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                    {starting ? t.common.loading : 'BẮT ĐẦU TẬP'}
                  </button>
                  <p className="text-xs text-slate-600 italic">Ước tính: 75 phút</p>
                </div>
              </>
            )}

            {activeSession && (
              <Link
                href="/workouts/session"
                className={cn(
                  'flex items-center justify-center gap-3 w-full rounded-xl px-8 py-4 text-sm font-bold text-white',
                  'bg-blue-600 hover:bg-blue-500 transition-colors',
                )}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Tiếp tục buổi tập
              </Link>
            )}
          </div>

          {/* Right: Quick links */}
          <div className="space-y-3">
            {/* Workout History */}
            <Link
              href="/workouts/history"
              className={cn(
                'flex items-center gap-4 rounded-2xl bg-white/4 border border-white/8 p-4',
                'hover:bg-white/6 hover:border-white/12 transition-all group',
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Lịch Sử Tập</p>
                <p className="text-xs text-slate-500 mt-0.5">Xem hiệu suất buổi trước</p>
              </div>
              <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Workout Library */}
            <Link
              href="/workouts/exercises"
              className={cn(
                'flex items-center gap-4 rounded-2xl bg-white/4 border border-white/8 p-4',
                'hover:bg-white/6 hover:border-white/12 transition-all group',
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Thư Viện Bài Tập</p>
                <p className="text-xs text-slate-500 mt-0.5">Duyệt các mẫu chương trình tập</p>
              </div>
              <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Weekly Streak */}
            <div className="rounded-2xl bg-white/4 border border-white/8 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-white">Chuỗi Tuần</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                {streak > 0
                  ? `Bạn đã tập ${streak} ngày liên tiếp. Hãy tiếp tục đà đó!`
                  : 'Bắt đầu chuỗi tập hôm nay. Kiên trì là chìa khóa.'}
              </p>
              {/* Progress dots (7 days of week) */}
              <div className="flex gap-1.5">
                {Array.from({ length: 7 }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 h-1.5 rounded-full',
                      i < streak % 7 ? 'bg-blue-500' : 'bg-white/10',
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Performance ──────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Hiệu Suất Gần Đây</h2>
            <Link
              href="/workouts/history"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              XEM TẤT CẢ
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {recentData && recentData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentData.map((session, idx) => {
                const dur = durationMins(session.started_at, session.ended_at);
                const icons = [
                  <path key="0" strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />,   // lightning — PR
                  <path key="1" strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />, // trending up
                  <path key="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />, // check
                ];
                const iconColors = ['text-blue-400', 'text-emerald-400', 'text-blue-400'];
                return (
                  <Link
                    key={session.id}
                    href={`/workouts/history/${session.id}`}
                    className={cn(
                      'rounded-2xl bg-white/4 border border-white/8 p-4',
                      'hover:bg-white/6 hover:border-white/12 transition-all',
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                        </svg>
                      </div>
                      <svg className={cn('w-4 h-4', iconColors[idx % 3])} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {icons[idx % 3]}
                      </svg>
                    </div>

                    {/* Name + time */}
                    <p className="font-bold text-white text-sm leading-tight">
                      {session.name ?? t.workouts.defaultName}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5 mb-3">
                      {relativeDay(session.started_at)}, {formatDateTime(session.started_at).split(',')[1]?.trim()}
                    </p>

                    {/* Stats */}
                    <div className="flex gap-4 pt-3 border-t border-white/5">
                      <div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">SETS</p>
                        <p className="text-base font-black text-white mt-0.5">{session._count.session_sets}</p>
                      </div>
                      {dur != null && (
                        <div>
                          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">THỜI GIAN</p>
                          <p className="text-base font-black text-white mt-0.5">{dur}<span className="text-xs font-normal text-slate-500 ml-0.5">min</span></p>
                        </div>
                      )}
                      <div className="ml-auto self-end">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">TRẠNG THÁI</p>
                        <p className="text-xs font-bold text-emerald-400 mt-0.5">XONG</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <p className="text-slate-600 text-sm font-medium">{t.workouts.noSessions}</p>
              <p className="text-slate-700 text-xs mt-1">{t.workouts.noSessionsDesc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
