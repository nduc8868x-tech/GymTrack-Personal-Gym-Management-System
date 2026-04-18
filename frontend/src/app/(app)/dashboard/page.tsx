'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuthStore } from '@/stores/authStore';
import { useT } from '@/lib/i18n';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  name: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  _count: { session_sets: number };
}

interface AiInsights {
  period: string;
  summary: string;
  metrics: {
    totalSessions?: number;
    totalVolume?: number;
    streak?: number;
    topMuscle?: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    from: mon.toISOString().slice(0, 10),
    to: sun.toISOString().slice(0, 10),
  };
}

function getMonthBounds() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  return { from, to };
}

function buildFrequencyData(sessions: Session[]) {
  const counts: Record<string, number> = {};
  sessions.forEach((s) => {
    const day = new Date(s.started_at).getDate().toString();
    counts[day] = (counts[day] ?? 0) + 1;
  });
  const daysInMonth = new Date().getDate();
  return Array.from({ length: daysInMonth }, (_, i) => ({
    day: String(i + 1),
    count: counts[String(i + 1)] ?? 0,
  }));
}

function formatDuration(started: string, ended: string | null) {
  if (!ended) return '—';
  const mins = Math.round((new Date(ended).getTime() - new Date(started).getTime()) / 60000);
  return `${mins} phút`;
}

function timeAgo(dateStr: string, t: { common: { today?: string } }) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'HÔM NAY';
  if (days === 1) return 'HÔM QUA';
  return `${days} NGÀY TRƯỚC`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  subColor,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  subColor?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/4 border border-white/8 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{label}</p>
        <span className="text-slate-600">{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-black text-white leading-none">{value}</div>
        {sub && (
          <p className={cn('text-xs mt-1.5 font-medium', subColor ?? 'text-slate-500')}>{sub}</p>
        )}
      </div>
    </div>
  );
}

// ─── Activity Card ────────────────────────────────────────────────────────────

function ActivityCard({ session }: { session: Session }) {
  const duration = formatDuration(session.started_at, session.ended_at);
  const ago = timeAgo(session.started_at, { common: {} });
  const sets = session._count.session_sets;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-gradient-to-br from-slate-800/60 to-slate-900/80">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Tag */}
      <div className="absolute top-3 left-3">
        <span className="px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[9px] font-bold text-white/80 uppercase tracking-wider border border-white/10">
          {ago}
        </span>
      </div>

      {/* Content */}
      <div className="relative p-4 pt-12">
        <h3 className="font-bold text-white text-sm leading-tight mb-1">
          {session.name ?? 'Buổi Tập'}
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{duration}</span>
          {sets > 0 && (
            <>
              <span className="text-slate-600">•</span>
              <span>{sets} sets</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { t } = useT();
  usePageTitle('Bảng điều khiển');
  const firstName = user?.name?.split(' ')[0] ?? '';
  const { from: wFrom, to: wTo } = getWeekBounds();
  const { from: mFrom, to: mTo } = getMonthBounds();

  // This week sessions (for workout count stat)
  const { data: weekData } = useQuery({
    queryKey: queryKeys.workouts.sessions({ from: wFrom, to: wTo, limit: 50 }),
    queryFn: () =>
      api
        .get<{ data: Session[]; meta: { total: number } }>('/workouts/sessions', {
          params: { from: wFrom, to: wTo, limit: 50, offset: 0 },
        })
        .then((r) => r.data),
  });

  // This month sessions (for frequency chart)
  const { data: monthData } = useQuery({
    queryKey: queryKeys.workouts.sessions({ from: mFrom, to: mTo, limit: 100 }),
    queryFn: () =>
      api
        .get<{ data: Session[] }>('/workouts/sessions', {
          params: { from: mFrom, to: mTo, limit: 100, offset: 0 },
        })
        .then((r) => r.data),
  });

  // Recent 3 sessions (for activity cards)
  const { data: recentData } = useQuery({
    queryKey: queryKeys.workouts.sessions({ limit: 3 }),
    queryFn: () =>
      api
        .get<{ data: Session[] }>('/workouts/sessions', {
          params: { limit: 3, offset: 0 },
        })
        .then((r) => r.data),
  });

  // AI insights
  const { data: insightsData } = useQuery({
    queryKey: queryKeys.ai.insights(),
    queryFn: () =>
      api
        .get<{ data: AiInsights }>('/ai/insights', { params: { period: 'week' } })
        .then((r) => r.data.data),
  });

  // Today's nutrition
  const today = new Date().toISOString().slice(0, 10);
  const { data: nutritionData } = useQuery({
    queryKey: queryKeys.nutrition.logs(today),
    queryFn: () =>
      api
        .get<{ data: { total_calories: number }[] }>('/nutrition/logs', { params: { date: today } })
        .then((r) => r.data),
  });

  // Computed stats
  const weekSessions = weekData?.data ?? [];
  const monthSessions = monthData?.data ?? [];
  const recentSessions = recentData?.data ?? [];
  const freqData = buildFrequencyData(monthSessions);
  const workoutsThisWeek = weekSessions.length;
  const totalVolume = insightsData?.metrics?.totalVolume;
  const streak = insightsData?.metrics?.streak ?? 0;
  const caloriesToday = nutritionData?.data?.reduce((s: number, l: { total_calories: number }) => s + l.total_calories, 0) ?? 0;

  // Split AI summary into two tips
  const aiSummary = insightsData?.summary ?? '';
  const aiTips = aiSummary
    ? aiSummary.split('. ').filter(Boolean).slice(0, 2)
    : [];

  const now = new Date();
  const monthName = now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  return (
    <div className="h-screen bg-[#1a1b2e] text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-white/5">
        <span className="text-blue-400 font-bold text-lg tracking-tight">GymTrack</span>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm chỉ số..."
              className="w-full rounded-xl bg-white/5 border border-white/8 pl-9 pr-4 py-2 text-xs text-slate-400 placeholder:text-slate-600 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <button className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-6xl space-y-5">
        {/* ── Hero banner ─────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden h-52 border border-white/8">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1729] via-[#0d1424] to-[#0a0e1a]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Decorative gym silhouette using CSS */}
          <div className="absolute right-0 bottom-0 w-80 h-full opacity-10"
            style={{
              background: 'radial-gradient(ellipse at 80% 60%, rgba(59,130,246,0.3) 0%, transparent 60%)',
            }}
          />
          {/* Content */}
          <div className="relative h-full flex flex-col justify-center px-8">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">
              {t.dashboard.greeting.replace('{name}', firstName)} 👋
            </h1>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed italic">
              &ldquo;{t.dashboard.subtitle}&rdquo;
            </p>
          </div>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label={t.dashboard.stats.workoutsThisWeek}
            value={
              <span>
                {workoutsThisWeek}
                <span className="text-slate-600 font-normal text-lg"> / 5</span>
              </span>
            }
            sub={
              weekSessions.length > 0
                ? `+${Math.round((workoutsThisWeek / 5) * 100)}% mục tiêu`
                : undefined
            }
            subColor="text-blue-400"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatCard
            label={t.dashboard.stats.totalVolume}
            value={
              totalVolume != null
                ? (totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}K` : totalVolume)
                : '—'
            }
            sub={totalVolume != null ? '+12% so với tuần trước' : undefined}
            subColor="text-emerald-400"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatCard
            label={t.dashboard.stats.streak}
            value={streak}
            sub={streak > 0 ? 'Kỷ lục cá nhân 🔥' : 'Bắt đầu chuỗi hôm nay'}
            subColor={streak > 0 ? 'text-orange-400' : 'text-slate-500'}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            }
          />
          <StatCard
            label={t.dashboard.stats.caloriesToday}
            value={caloriesToday > 0 ? caloriesToday.toLocaleString() : '—'}
            sub="Mục tiêu: 2,400 kcal"
            subColor="text-slate-500"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
        </div>

        {/* ── Chart + AI Coach ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Frequency chart */}
          <div className="lg:col-span-2 rounded-2xl bg-white/4 border border-white/8 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white">{t.dashboard.frequency}</h2>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{monthName}</p>
              </div>
              <div className="flex gap-1">
                {['Tuần', 'Tháng'].map((label, i) => (
                  <span
                    key={label}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium cursor-default',
                      i === 1
                        ? 'bg-white/10 text-white'
                        : 'text-slate-500 hover:text-slate-300',
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            {freqData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={freqData} barCategoryGap="30%">
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#fff',
                    }}
                    formatter={(v: number) => [`${v} buổi`, '']}
                    labelFormatter={(l) => `Ngày ${l}`}
                  />
                  <Bar
                    dataKey="count"
                    fill="rgba(59,130,246,0.6)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-slate-600 text-sm">
                Chưa có buổi tập nào tháng này
              </div>
            )}
          </div>

          {/* AI Coach */}
          <div className="rounded-2xl bg-white/4 border border-white/8 p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xs font-bold text-white">AI Coach</h2>
                <p className="text-[10px] text-slate-500">Gợi ý thông minh</p>
              </div>
              <span className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>

            <div className="flex-1 space-y-2">
              {aiTips.length > 0 ? (
                aiTips.map((tip, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-white/5 border border-white/8 p-3"
                  >
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {i === 0 ? 'Lời khuyên hôm nay' : 'Thử thách mới'}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">{tip}.</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-white/5 border border-white/8 p-3 text-xs text-slate-500">
                  {aiSummary || 'Hãy tập luyện để nhận gợi ý từ AI Coach!'}
                </div>
              )}
            </div>

            <Link
              href="/ai-coach"
              className="mt-4 w-full rounded-xl bg-blue-600/15 border border-blue-600/20 text-blue-400 text-xs font-semibold py-2.5 text-center hover:bg-blue-600/25 transition-colors block"
            >
              Xem tất cả gợi ý →
            </Link>
          </div>
        </div>

        {/* ── Recent Activities ───────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Hoạt Động Gần Đây</h2>
            <Link href="/workouts/history" className="text-xs text-slate-500 hover:text-blue-400 transition-colors font-medium">
              Tất cả →
            </Link>
          </div>

          {recentSessions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentSessions.map((session) => (
                <ActivityCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
              <p className="text-slate-600 text-sm">{t.dashboard.comingSoon}</p>
              <Link
                href="/workouts/session"
                className="inline-flex items-center gap-1.5 mt-3 text-xs text-blue-400 font-medium hover:text-blue-300 transition-colors"
              >
                Bắt đầu buổi tập đầu tiên →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
