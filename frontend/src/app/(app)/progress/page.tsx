'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useT } from '@/lib/i18n';
import { usePageTitle } from '@/hooks/usePageTitle';

type ChartType = 'weight' | 'volume' | 'strength';

interface WeightPoint {
  date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
}

interface VolumePoint {
  date: string;
  name: string | null;
  volume_kg: number;
}

interface StrengthPR {
  exercise_id: string;
  exercise_name: string;
  primary_muscle: string;
  weight_kg: number | null;
  reps: number | null;
  one_rm_estimate: number | null;
  achieved_at: string;
}

interface Measurement {
  id: string;
  measured_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  photo_url: string | null;
}

const RANGE_OPTIONS = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

function getDateRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ProgressPage() {
  const { t } = useT();
  usePageTitle('Tiến trình');
  const [chartType, setChartType] = useState<ChartType>('weight');
  const [rangeDays, setRangeDays] = useState(90);
  const { from, to } = getDateRange(rangeDays);

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: [...queryKeys.progress.charts(), chartType, from, to],
    queryFn: () =>
      api
        .get<{ data: WeightPoint[] | VolumePoint[] | StrengthPR[] }>('/progress/charts', {
          params: { type: chartType, from, to },
        })
        .then((r) => r.data.data),
  });

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: queryKeys.progress.records(),
    queryFn: () =>
      api.get<{ data: StrengthPR[] }>('/progress/records').then((r) => r.data.data),
  });

  const { data: measurementsRes } = useQuery({
    queryKey: [...queryKeys.progress.measurements(), 'latest'],
    queryFn: () =>
      api
        .get<{ data: Measurement[] }>('/progress/measurements', { params: { limit: 1 } })
        .then((r) => r.data.data),
  });

  const latestMeasurement = measurementsRes?.[0];

  const tooltipStyle = {
    fontSize: 12,
    background: '#1a1a2e',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: '#e2e8f0',
  };

  const renderChart = () => {
    if (chartLoading) {
      return (
        <div className="h-52 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Đang tải…</span>
          </div>
        </div>
      );
    }
    if (!chartData || chartData.length === 0) {
      return (
        <div className="h-52 flex flex-col items-center justify-center gap-3 text-slate-600">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <p className="text-sm">{t.progress.noData}</p>
        </div>
      );
    }

    if (chartType === 'weight') {
      const data = (chartData as WeightPoint[]).map((p) => ({
        date: formatDate(p.date),
        weight: p.weight_kg,
        fat: p.body_fat_pct,
      }));
      return (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={['auto', 'auto']} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="weight" stroke="#3b82f6" dot={false} strokeWidth={2} name={t.progress.chartWeightLabel} />
            <Line type="monotone" dataKey="fat" stroke="#8b5cf6" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name={t.progress.chartFatLabel} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'volume') {
      const data = (chartData as VolumePoint[]).map((p) => ({
        date: formatDate(p.date),
        volume: p.volume_kg,
      }));
      return (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, t.progress.chartTypes.volume]} />
            <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t.progress.chartVolumeLabel} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // strength — top PRs as horizontal bar
    const data = (chartData as StrengthPR[]).map((p) => ({
      name: p.exercise_name.length > 14 ? p.exercise_name.slice(0, 14) + '…' : p.exercise_name,
      '1RM': p.one_rm_estimate,
    }));
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={100} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, t.progress.chart1RMLabel]} />
          <Bar dataKey="1RM" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="h-screen bg-[#1a1b2e] text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h1 className="text-lg font-bold text-white">{t.progress.title}</h1>
        <Link
          href="/progress/measurements"
          className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          {t.progress.bodyMeasurements}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-3xl space-y-4">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {/* Weight card */}
          <div className="rounded-2xl bg-white/4 border border-white/8 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{t.progress.currentWeight}</p>
            <p className="text-2xl font-black text-white mt-1">
              {latestMeasurement?.weight_kg != null ? `${latestMeasurement.weight_kg}` : '—'}
              {latestMeasurement?.weight_kg != null && <span className="text-sm font-medium text-slate-400 ml-1">kg</span>}
            </p>
            {latestMeasurement && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {new Date(latestMeasurement.measured_at).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>

          {/* Body fat card */}
          <div className="rounded-2xl bg-white/4 border border-white/8 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{t.progress.bodyFat}</p>
            <p className="text-2xl font-black text-white mt-1">
              {latestMeasurement?.body_fat_pct != null ? `${latestMeasurement.body_fat_pct}` : '—'}
              {latestMeasurement?.body_fat_pct != null && <span className="text-sm font-medium text-slate-400 ml-0.5">%</span>}
            </p>
            {latestMeasurement && (
              <p className="text-xs text-slate-500 mt-1">{t.progress.latestMeasurement}</p>
            )}
          </div>

          {/* Measurements link card */}
          <Link
            href="/progress/measurements"
            className="rounded-2xl bg-blue-600/10 border border-blue-600/20 p-4 hover:bg-blue-600/15 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-white">{t.progress.bodyMeasurements}</p>
            <p className="text-xs text-slate-500 mt-0.5">{t.progress.bodyMeasurementsDesc}</p>
          </Link>
        </div>

        {/* Chart card */}
        <div className="rounded-2xl bg-white/4 border border-white/8 p-5 space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Chart type tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/4 border border-white/8">
              {([
                {
                  type: 'weight' as ChartType,
                  label: t.progress.chartTypes.weight,
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ),
                },
                {
                  type: 'volume' as ChartType,
                  label: t.progress.chartTypes.volume,
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  ),
                },
                {
                  type: 'strength' as ChartType,
                  label: t.progress.chartTypes.strength,
                  icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  ),
                },
              ]).map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    chartType === type
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {/* Range selector */}
            {chartType !== 'strength' && (
              <div className="flex gap-1">
                {RANGE_OPTIONS.map(({ label, days }) => (
                  <button
                    key={days}
                    onClick={() => setRangeDays(days)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      rangeDays === days
                        ? 'bg-white/10 text-white'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {renderChart()}
        </div>

        {/* Personal Records */}
        <div className="rounded-2xl bg-white/4 border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h2 className="font-bold text-sm text-white">{t.progress.personalRecords}</h2>
            </div>
            <span className="text-xs text-slate-500 bg-white/4 px-2 py-1 rounded-lg">
              {records?.length ?? 0} {t.progress.exercises}
            </span>
          </div>

          {recordsLoading && (
            <div className="space-y-px p-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl animate-pulse bg-white/4" />
              ))}
            </div>
          )}

          {!recordsLoading && (!records || records.length === 0) && (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500">{t.progress.logWorkouts}</p>
            </div>
          )}

          {records && records.length > 0 && (
            <div className="divide-y divide-white/5">
              {records.map((pr) => (
                <div key={pr.exercise_id} className="flex items-center px-5 py-3.5 gap-4 hover:bg-white/3 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{pr.exercise_name}</p>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">
                      {pr.primary_muscle} · {new Date(pr.achieved_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">
                      {pr.weight_kg != null ? `${pr.weight_kg} kg` : '—'}
                      {pr.reps != null ? <span className="text-slate-400 font-medium"> × {pr.reps}</span> : ''}
                    </p>
                    {pr.one_rm_estimate != null && (
                      <p className="text-xs text-blue-400 mt-0.5 font-medium">~{pr.one_rm_estimate} kg 1RM</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
