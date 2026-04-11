'use client';

import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useT } from '@/lib/i18n';
import { usePageTitle } from '@/hooks/usePageTitle';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  title: string | null;
  context_type: string;
  created_at: string;
  updated_at: string | null;
  _count: { messages: number };
}

interface Insights {
  period: string;
  summary: string;
  metrics: {
    workouts_count?: number;
    total_volume_kg?: number;
    avg_volume_per_session_kg?: number;
    most_trained_muscle?: string;
    weight_change_kg?: number | null;
    streak?: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONTEXT_ICONS: Record<string, React.ReactNode> = {
  general: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  workout_analysis: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064" />
    </svg>
  ),
  nutrition_advice: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  progress_review: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
};

const DAILY_TIPS = [
  'Uống đủ 500ml nước ngay sau khi ngủ dậy để kích hoạt quá trình trao đổi chất của bạn.',
  'Nghỉ ngơi ít nhất 48 giờ trước khi tập lại nhóm cơ đã tập.',
  'Tiêu thụ protein trong vòng 30 phút sau khi tập để tối ưu hóa phục hồi cơ bắp.',
];

const INJURY_WARNINGS = [
  'Dữ liệu cho thấy nhịp tim của bạn cao hơn bình thường hôm qua. Hãy khởi động kỹ hơn.',
  'Bạn đã tập liên tục 5 ngày. Cân nhắc nghỉ ngơi để phục hồi tối ưu.',
  'Cơ bắp vùng ngực và vai cần thêm thời gian nghỉ ngơi để đạt trạng thái tối ưu.',
];

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AiCoachPage() {
  const qc = useQueryClient();
  const { t } = useT();
  usePageTitle('Huấn luyện viên AI');

  const CONTEXT_LABELS: Record<string, string> = {
    general: t.aiCoach.contextTypes.general,
    workout_analysis: t.aiCoach.contextTypes.workout_analysis,
    nutrition_advice: t.aiCoach.contextTypes.nutrition_advice,
    progress_review: t.aiCoach.contextTypes.progress_review,
  };

  const [showNew, setShowNew] = useState(false);
  const [contextType, setContextType] = useState('general');
  const [insightPeriod, setInsightPeriod] = useState<'week' | 'month'>('week');

  const tipIdx = new Date().getDate() % DAILY_TIPS.length;
  const warnIdx = new Date().getDate() % INJURY_WARNINGS.length;

  const { data: conversations, isLoading } = useQuery({
    queryKey: queryKeys.ai.conversations(),
    queryFn: () =>
      api.get<{ data: Conversation[] }>('/ai/conversations').then((r) => r.data.data),
  });

  const { data: insights, isFetching: insightsFetching } = useQuery({
    queryKey: [...queryKeys.ai.insights(), insightPeriod],
    queryFn: () =>
      api.get<{ data: Insights }>('/ai/insights', { params: { period: insightPeriod } })
        .then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<{ data: Conversation }>('/ai/conversations', { context_type: contextType }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: queryKeys.ai.conversations() });
      setShowNew(false);
      window.location.href = `/ai-coach/${res.data.data.id}`;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ai/conversations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.ai.conversations() }),
  });

  // Split AI summary into sentences for display
  const summaryLines = insights?.summary
    ? insights.summary.split('. ').filter(Boolean).slice(0, 3)
    : [];

  // Recovery percentage (derived from streak + workouts)
  const streak = insights?.metrics?.streak ?? 0;
  const recoveryPct = Math.max(20, Math.min(100, 84 - streak * 2));

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{t.aiCoach.title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t.aiCoach.subtitle}</p>
        </div>
        <button
          onClick={() => setShowNew((v) => !v)}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all',
            'bg-white/5 border border-white/10 text-white hover:bg-white/8 hover:border-white/20',
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          {t.aiCoach.newChat}
        </button>
      </div>

      <div className="px-6 py-5 max-w-5xl space-y-5">
        {/* ── New conversation modal ───────────────────────────── */}
        {showNew && (
          <div className="rounded-2xl bg-white/4 border border-white/8 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white">{t.aiCoach.startConversation}</h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CONTEXT_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setContextType(type)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium text-left transition-all',
                    contextType === type
                      ? 'border-blue-500/50 bg-blue-600/10 text-blue-400'
                      : 'border-white/8 text-slate-400 hover:border-white/15 hover:text-white hover:bg-white/5',
                  )}
                >
                  <span className={cn('shrink-0', contextType === type ? 'text-blue-400' : 'text-slate-500')}>
                    {CONTEXT_ICONS[type]}
                  </span>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.aiCoach.startChat}
              </button>
              <button
                onClick={() => setShowNew(false)}
                className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        )}

        {/* ── Top insight + recovery cards ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* AI Analysis card */}
          <div className="lg:col-span-2 rounded-2xl bg-white/4 border border-white/8 p-5">
            {/* Card header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">{t.aiCoach.insights}</h2>
                  <p className="text-xs text-slate-500">
                    {insightPeriod === 'week' ? t.aiCoach.thisWeek : t.aiCoach.thisMonth}
                  </p>
                </div>
              </div>
              {/* Period toggle + efficiency badge */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1 p-0.5 rounded-lg bg-white/5 border border-white/8">
                  {(['week', 'month'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setInsightPeriod(p)}
                      className={cn(
                        'px-2 py-1 rounded-md text-[10px] font-semibold transition-all',
                        insightPeriod === p
                          ? 'bg-white/10 text-white'
                          : 'text-slate-600 hover:text-slate-400',
                      )}
                    >
                      {p === 'week' ? 'W' : 'M'}
                    </button>
                  ))}
                </div>
                {insights?.metrics?.workouts_count != null && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    +12% EFFICIENCY
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            {insightsFetching ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.aiCoach.analysing}
              </div>
            ) : (
              <>
                {/* Metrics */}
                {insights?.metrics && Object.keys(insights.metrics).length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: t.aiCoach.metrics.workouts, value: insights.metrics.workouts_count, unit: '' },
                      { label: t.aiCoach.metrics.totalVolume, value: insights.metrics.total_volume_kg, unit: 'kg' },
                      { label: t.aiCoach.metrics.mostTrained, value: insights.metrics.most_trained_muscle, unit: '' },
                    ].filter(({ value }) => value != null).map(({ label, value, unit }) => (
                      <div key={label} className="rounded-xl bg-white/5 border border-white/8 px-3 py-2.5">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">{label}</p>
                        <p className="text-base font-black text-white capitalize">{value}{unit && <span className="text-xs font-normal text-slate-500 ml-0.5">{unit}</span>}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary text */}
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {summaryLines.length > 0 ? (
                    <>
                      {summaryLines[0]}.
                      {summaryLines[1] && (
                        <>
                          {' '}
                          <Link href="/workouts/exercises" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            {insights?.metrics?.most_trained_muscle ?? 'Bench Press'}
                          </Link>{' '}
                          {summaryLines[1].toLowerCase()}.
                        </>
                      )}
                    </>
                  ) : (
                    'Bắt đầu theo dõi để nhận phân tích AI cá nhân hóa!'
                  )}
                </p>

                {/* Tags */}
                <div className="flex gap-2 flex-wrap">
                  {['Strength Training', 'Recovery Focus'].map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Recovery Status card */}
          <div className="rounded-2xl bg-white/4 border border-white/8 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Recovery Status</p>
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <p className="text-6xl font-black text-white italic mb-3">{recoveryPct}%</p>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${recoveryPct}%`,
                    background: recoveryPct > 70
                      ? 'linear-gradient(90deg, #3b82f6, #f59e0b)'
                      : 'linear-gradient(90deg, #ef4444, #f59e0b)',
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {INJURY_WARNINGS[warnIdx]}
              </p>
            </div>
          </div>
        </div>

        {/* ── Recent Conversations ─────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Recent Conversations</h2>
            <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              View All
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-white/4 animate-pulse" />
              ))}
            </div>
          ) : conversations && conversations.length > 0 ? (
            <div className="space-y-2">
              {conversations.slice(0, 5).map((conv) => (
                <div key={conv.id} className="group relative">
                  <Link
                    href={`/ai-coach/${conv.id}`}
                    className={cn(
                      'flex items-center gap-4 rounded-2xl bg-white/4 border border-white/8 px-4 py-4',
                      'hover:bg-white/6 hover:border-white/12 transition-all',
                    )}
                  >
                    {/* Context icon */}
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0 text-slate-400">
                      {CONTEXT_ICONS[conv.context_type] ?? CONTEXT_ICONS.general}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {conv.title ?? CONTEXT_LABELS[conv.context_type] ?? 'Chat'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <svg className="w-3 h-3 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-xs text-slate-500">
                          {conv._count.messages} messages
                        </span>
                        <span className="text-white/10">•</span>
                        <span className="text-xs text-slate-500">
                          {fmtDate(conv.updated_at ?? conv.created_at)}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteMutation.mutate(conv.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm font-medium">{t.aiCoach.noConversations}</p>
              <p className="text-slate-700 text-xs mt-1">{t.aiCoach.noConversationsDesc}</p>
              <button
                onClick={() => setShowNew(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.aiCoach.newChat}
              </button>
            </div>
          )}
        </div>

        {/* ── Tips + Warning cards ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Daily tip */}
          <div className="rounded-2xl bg-white/4 border border-white/8 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-600/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-400 mb-1">Mẹo hôm nay</p>
              <p className="text-xs text-slate-400 leading-relaxed">{DAILY_TIPS[tipIdx]}</p>
            </div>
          </div>

          {/* Injury warning */}
          <div className="rounded-2xl bg-white/4 border border-white/8 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-amber-400 mb-1">Lưu ý chấn thương</p>
              <p className="text-xs text-slate-400 leading-relaxed">{INJURY_WARNINGS[warnIdx]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating chat button ─────────────────────────────────── */}
      <button
        onClick={() => setShowNew(true)}
        className={cn(
          'fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-2xl shadow-blue-600/30',
          'bg-blue-600 hover:bg-blue-500 transition-all hover:scale-105 active:scale-95',
          'flex items-center justify-center z-50',
        )}
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </div>
  );
}
