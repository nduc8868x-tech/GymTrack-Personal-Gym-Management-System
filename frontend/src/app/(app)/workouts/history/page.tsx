'use client';

import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { usePageTitle } from '@/hooks/usePageTitle';

interface Session {
  id: string;
  name: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  _count: { session_sets: number };
}

interface PageData {
  data: Session[];
  meta: { total: number; limit: number; offset: number };
}

const LIMIT = 20;

function durationLabel(start: string, end: string | null) {
  if (!end) return null;
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Hôm nay';
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(sessions: Session[]) {
  const groups: Record<string, Session[]> = {};
  sessions.forEach((s) => {
    const key = new Date(s.started_at).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });
  return groups;
}

export default function WorkoutHistoryPage() {
  const { t } = useT();
  usePageTitle('Lịch sử tập luyện');
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: queryKeys.workouts.sessions({ limit: LIMIT }),
    queryFn: ({ pageParam = 0 }) =>
      api
        .get<PageData>(`/workouts/sessions?limit=${LIMIT}&offset=${pageParam}`)
        .then((r) => r.data),
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const next = last.meta.offset + last.meta.limit;
      return next < last.meta.total ? next : undefined;
    },
  });

  const sessions = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;
  const groups = groupByDate(sessions);

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5">
        <Link
          href="/workouts"
          className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-white">{t.workouts.history.title}</h1>
          {total > 0 && (
            <p className="text-xs text-slate-500">{total} {t.common.sessionsCount}</p>
          )}
        </div>
      </div>

      <div className="px-6 py-6 max-w-3xl space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/4 animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-bold text-slate-400">{t.workouts.history.noHistory}</p>
            <p className="text-sm text-slate-600 mt-1">{t.workouts.history.noHistoryDesc}</p>
            <Link
              href="/workouts"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {t.workouts.startWorkout}
            </Link>
          </div>
        ) : (
          <>
            {Object.entries(groups).map(([dateKey, daySessions]) => (
              <div key={dateKey}>
                {/* Date group header */}
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest capitalize">
                    {formatDay(daySessions[0].started_at)}
                  </p>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <div className="space-y-2">
                  {daySessions.map((s) => {
                    const dur = durationLabel(s.started_at, s.ended_at);
                    return (
                      <Link
                        key={s.id}
                        href={`/workouts/history/${s.id}`}
                        className={cn(
                          'flex items-center gap-4 rounded-2xl bg-white/4 border border-white/8 px-4 py-4',
                          'hover:bg-white/6 hover:border-white/12 transition-all group',
                        )}
                      >
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/15 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064" />
                          </svg>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {s.name ?? t.workouts.defaultName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">{formatTime(s.started_at)}</span>
                            {dur && (
                              <>
                                <span className="text-white/10">·</span>
                                <span className="text-xs text-slate-500">{dur}</span>
                              </>
                            )}
                            <span className="text-white/10">·</span>
                            <span className="text-xs text-slate-500">
                              {s._count.session_sets} {t.workouts.history.sets}
                            </span>
                          </div>
                        </div>

                        {/* Done badge + arrow */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                            Xong
                          </span>
                          <svg className="w-4 h-4 text-slate-700 group-hover:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className={cn(
                  'w-full rounded-2xl border border-white/8 bg-white/4 py-3 text-sm font-medium text-slate-400',
                  'hover:bg-white/6 hover:text-white transition-all disabled:opacity-50',
                )}
              >
                {isFetchingNextPage ? t.common.loading : t.common.loadMore}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
