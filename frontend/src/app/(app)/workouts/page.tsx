'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
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
  scheduled_date: string;
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

const VI_DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const VI_DAY_FULL  = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export default function WorkoutsPage() {
  const router = useRouter();
  const { activeSession, startSession } = useWorkoutStore();
  const { t } = useT();
  usePageTitle('Tập luyện');
  const [starting, setStarting] = useState(false);

  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDateStr, setSelectedDateStr] = useState(todayDateStr);

  // Monday of current week
  const weekFrom = useMemo(() => {
    const d = new Date();
    const dow = d.getDay();
    const diff = d.getDate() - dow + (dow === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  }, []);

  // Sunday of current week
  const weekTo = useMemo(() => {
    const d = new Date(weekFrom);
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  }, [weekFrom]);

  // 7-day date array Mon→Sun
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekFrom);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekFrom]);

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

  // Full week schedule
  const { data: weekSchedules } = useQuery({
    queryKey: queryKeys.schedule.list({ from: weekFrom, to: weekTo }),
    queryFn: () =>
      api
        .get<{ data: TodaySchedule[] }>(`/schedule?from=${weekFrom}&to=${weekTo}`)
        .then((r) => r.data.data),
  });

  // Plan for selected day
  const selectedPlan = useMemo(
    () =>
      weekSchedules?.find((s) => s.scheduled_date.slice(0, 10) === selectedDateStr) ?? null,
    [weekSchedules, selectedDateStr],
  );

  // Map date → schedule for quick lookup in strip
  const scheduleByDate = useMemo(() => {
    const map = new Map<string, TodaySchedule>();
    for (const s of weekSchedules ?? []) {
      map.set(s.scheduled_date.slice(0, 10), s);
    }
    return map;
  }, [weekSchedules]);

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



  // Dynamic header label for plan section
  const planLabel = useMemo(() => {
    if (selectedDateStr === todayDateStr) return 'KẾ HOẠCH HÔM NAY';
    const d = new Date(selectedDateStr + 'T00:00:00');
    return `KẾ HOẠCH ${VI_DAY_FULL[d.getDay()].toUpperCase()}`;
  }, [selectedDateStr, todayDateStr]);

  // Date header
  const now = new Date();
  const dateLabel = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="h-screen bg-[#1a1b2e] text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-white/5">
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

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 max-w-5xl mx-auto space-y-6">
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

        {/* ── Weekly schedule strip ────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">LỊCH TUẦN NÀY</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {weekDays.map((day) => {
              const dateStr  = day.toISOString().slice(0, 10);
              const schedule = scheduleByDate.get(dateStr);
              const isToday  = dateStr === todayDateStr;
              const isSelected = dateStr === selectedDateStr;
              const isDone   = schedule?.is_completed === true;
              const exCount  = schedule?.scheduled_exercises?.length ?? 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={cn(
                    'flex-shrink-0 w-[76px] rounded-2xl border p-3 text-left transition-all',
                    isSelected
                      ? 'border-blue-500/60 bg-blue-600/15'
                      : isDone
                      ? 'border-emerald-500/40 bg-emerald-600/8 hover:bg-emerald-600/12'
                      : schedule
                      ? 'border-violet-500/30 bg-violet-600/8 hover:bg-violet-600/12'
                      : 'border-white/8 bg-white/4 hover:bg-white/6',
                  )}
                >
                  {/* Day label */}
                  <p className={cn(
                    'text-[10px] font-black uppercase tracking-widest',
                    isSelected ? 'text-blue-400' : 'text-slate-500',
                  )}>
                    {VI_DAY_SHORT[day.getDay()]}
                  </p>

                  {/* Date number + today dot */}
                  <div className="flex items-center gap-1 mt-0.5 mb-2">
                    <p className={cn(
                      'text-lg font-black leading-none',
                      isSelected ? 'text-white' : isToday ? 'text-blue-300' : 'text-slate-300',
                    )}>
                      {day.getDate()}
                    </p>
                    {isToday && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    )}
                  </div>

                  {/* Plan info */}
                  {schedule ? (
                    <div>
                      <p className={cn(
                        'text-[9px] font-bold leading-tight truncate',
                        isDone ? 'text-emerald-400' : isSelected ? 'text-violet-300' : 'text-slate-400',
                      )}>
                        {schedule.name ?? 'Workout'}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {isDone ? (
                          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className={cn(
                            'text-[9px] font-black px-1 py-0.5 rounded',
                            isSelected ? 'bg-violet-500/30 text-violet-300' : 'bg-white/10 text-slate-500',
                          )}>
                            {exCount} bài
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[9px] text-slate-700 font-medium">Nghỉ</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected day plan ────────────────────────────────────── */}
        {selectedPlan && selectedPlan.scheduled_exercises.length > 0 && (
          <div className="rounded-2xl border border-violet-500/25 bg-violet-600/5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-violet-500/15">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <p className="text-xs font-black text-violet-400 uppercase tracking-widest">{planLabel}</p>
              </div>
              {!activeSession && (
                <button
                  onClick={() => handleStartFromPlan(selectedPlan)}
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
                {selectedPlan.name ?? 'Kế hoạch'}
              </p>
              <div className="space-y-2">
                {selectedPlan.scheduled_exercises.map((ex, idx) => (
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

        {/* ── Quick links ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Weekly Streak */}
          <div className="rounded-2xl bg-white/4 border border-white/8 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-white">Chuỗi Tuần</p>
              {streak > 0 && (
                <span className="ml-auto text-xs font-black text-amber-400">{streak} ngày</span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              {streak > 0 ? 'Hãy tiếp tục đà đó!' : 'Kiên trì là chìa khóa.'}
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-1 h-1.5 rounded-full',
                    i < streak % 7 ? 'bg-amber-400' : 'bg-white/10',
                  )}
                />
              ))}
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
                  <path key="0" strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />,
                  <path key="1" strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
                  <path key="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
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

                    <p className="font-bold text-white text-sm leading-tight">
                      {session.name ?? t.workouts.defaultName}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5 mb-3">
                      {relativeDay(session.started_at)}, {formatDateTime(session.started_at).split(',')[1]?.trim()}
                    </p>

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
    </div>
  );
}
