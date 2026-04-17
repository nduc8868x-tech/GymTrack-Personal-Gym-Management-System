'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { usePageTitle } from '@/hooks/usePageTitle';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExerciseRef {
  id: string;
  name: string;
  primary_muscle: string;
  equipment: string;
}

interface ScheduledExercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight_kg: number | null;
  order_index: number;
  notes: string | null;
  exercise: ExerciseRef;
}

interface ScheduledWorkout {
  id: string;
  name: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  is_completed: boolean;
  plan_day: { id: string; name: string | null; day_of_week: number } | null;
  plan: { id: string; name: string } | null;
  scheduled_exercises: ScheduledExercise[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatTime(isoTime: string | null): string {
  if (!isoTime) return '';
  const match = isoTime.match(/T(\d{2}:\d{2})/);
  if (match) return match[1];
  return isoTime.slice(0, 5);
}

// ─── Exercise Picker (inline mini picker) ─────────────────────────────────────

function ExercisePickerInline({
  onSelect,
  onClose,
}: {
  onSelect: (ex: ExerciseRef) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const { data: exercises = [] } = useQuery({
    queryKey: queryKeys.exercises.all({ search }),
    queryFn: () => {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      return api
        .get<{ data: ExerciseRef[] }>(`/exercises?${params}`)
        .then((r) => r.data.data);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1e1f35] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <h3 className="font-bold text-sm text-white">Chọn bài tập</h3>
          <button onClick={onClose} className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-4 py-2 border-b border-white/5">
          <input
            autoFocus
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-600/50"
          />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-white">{ex.name}</p>
                <p className="text-xs text-slate-500 capitalize">{ex.primary_muscle.replace('_', ' ')}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Add Exercise Form ────────────────────────────────────────────────────────

function AddExerciseForm({
  scheduledId,
  exercise,
  onSaved,
  onCancel,
}: {
  scheduledId: string;
  exercise: ExerciseRef;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/schedule/${scheduledId}/exercises`, {
        exercise_id: exercise.id,
        sets: parseInt(sets) || 3,
        reps: parseInt(reps) || 10,
        ...(weight ? { weight_kg: parseFloat(weight) } : {}),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-blue-600/20 bg-blue-600/5 p-3 space-y-2">
      <p className="text-xs font-bold text-blue-400">{exercise.name}</p>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block">Sets</label>
          <input
            type="number"
            inputMode="numeric"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-blue-600/50"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block">Reps</label>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-blue-600/50"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block">Tạ (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="—"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-blue-600/50"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Đang lưu...' : 'Thêm'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          Huỷ
        </button>
      </div>
    </div>
  );
}

// ─── Exercise Manager (inside WorkoutDetail) ──────────────────────────────────

function ScheduledExerciseManager({
  scheduledId,
  exercises,
  onChanged,
}: {
  scheduledId: string;
  exercises: ScheduledExercise[];
  onChanged: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [pendingExercise, setPendingExercise] = useState<ExerciseRef | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = async (entryId: string) => {
    setRemoving(entryId);
    try {
      await api.delete(`/schedule/${scheduledId}/exercises/${entryId}`);
      onChanged();
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bài tập</p>
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-1 rounded-lg bg-blue-600/15 border border-blue-600/20 px-2.5 py-1.5 text-[11px] font-bold text-blue-400 hover:bg-blue-600/25 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Thêm bài
        </button>
      </div>

      {exercises.length === 0 && !pendingExercise && (
        <p className="text-xs text-slate-600 text-center py-3">Chưa có bài tập — nhấn "Thêm bài" để bắt đầu</p>
      )}

      <div className="space-y-2">
        {exercises.map((ex) => (
          <div key={ex.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{ex.exercise.name}</p>
              <p className="text-xs text-slate-500">
                {ex.sets} × {ex.reps} reps
                {ex.weight_kg != null ? ` @ ${ex.weight_kg} kg` : ''}
              </p>
            </div>
            <button
              onClick={() => handleRemove(ex.id)}
              disabled={removing === ex.id}
              className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {pendingExercise && (
          <AddExerciseForm
            scheduledId={scheduledId}
            exercise={pendingExercise}
            onSaved={() => { setPendingExercise(null); onChanged(); }}
            onCancel={() => setPendingExercise(null)}
          />
        )}
      </div>

      {showPicker && (
        <ExercisePickerInline
          onSelect={(ex) => { setPendingExercise(ex); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// ─── Add Workout Modal ────────────────────────────────────────────────────────

function AddWorkoutForm({ date, onClose, onSaved }: { date: string; onClose: () => void; onSaved: () => void }) {
  const { t } = useT();
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/schedule', {
        name: name || undefined,
        scheduled_date: date,
        scheduled_time: time || undefined,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1e1f35] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h2 className="font-bold text-sm text-white">{t.schedule.addToSchedule}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{date}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <input
            autoFocus
            type="text"
            placeholder={`${t.schedule.workoutName} (${t.common.optional})`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-600/50 transition-colors"
          />
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 focus-within:border-blue-600/50 transition-colors">
            <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white outline-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {saving ? t.common.saving : t.schedule.newEvent}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/6 transition-colors"
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Workout Detail Modal ─────────────────────────────────────────────────────

function WorkoutDetail({
  workout,
  onClose,
  onDeleted,
  onToggleComplete,
  onExercisesChanged,
}: {
  workout: ScheduledWorkout;
  onClose: () => void;
  onDeleted: () => void;
  onToggleComplete: () => void;
  onExercisesChanged: () => void;
}) {
  const { t } = useT();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(t.common.deleteConfirm)) return;
    setDeleting(true);
    try {
      await api.delete(`/schedule/${workout.id}`);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1e1f35] rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-sm text-white truncate">{workout.name ?? t.workouts.defaultName}</h2>
            {workout.is_completed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-0.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                XONG
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors ml-2 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
              </svg>
              <span>{workout.scheduled_date.slice(0, 10)}</span>
            </div>
            {workout.scheduled_time && (
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTime(workout.scheduled_time)}</span>
              </div>
            )}
            {workout.plan && (
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664" />
                </svg>
                <span>{workout.plan.name}</span>
              </div>
            )}
          </div>

          {/* Exercise Manager */}
          <div className="border-t border-white/5 pt-4">
            <ScheduledExerciseManager
              scheduledId={workout.id}
              exercises={workout.scheduled_exercises}
              onChanged={onExercisesChanged}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onToggleComplete}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors',
                workout.is_completed
                  ? 'bg-white/4 border border-white/8 text-slate-400 hover:bg-white/6'
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20',
              )}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {workout.is_completed ? t.schedule.upcoming : t.schedule.completed}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916" />
              </svg>
              {t.common.delete}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const qc = useQueryClient();
  const { t } = useT();
  usePageTitle('Lịch tập');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [addDate, setAddDate] = useState<string | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  const from = toDateStr(weekStart);
  const to = toDateStr(addDays(weekStart, 6));

  const { data: schedules } = useQuery({
    queryKey: queryKeys.schedule.list({ from, to }),
    queryFn: () =>
      api
        .get<{ data: ScheduledWorkout[] }>(`/schedule?from=${from}&to=${to}`)
        .then((r) => r.data.data),
  });

  // Derive selectedWorkout from live schedules so it auto-updates after mutations
  const selectedWorkout = useMemo(
    () => schedules?.find((s) => s.id === selectedWorkoutId) ?? null,
    [schedules, selectedWorkoutId],
  );

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ id, is_completed }: { id: string; is_completed: boolean }) =>
      api.put(`/schedule/${id}`, { is_completed }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.schedule.list({ from, to }) });
    },
  });

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const byDate = useMemo(() => {
    const map: Record<string, ScheduledWorkout[]> = {};
    for (const s of schedules ?? []) {
      const key = s.scheduled_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [schedules]);

  const todayStr = toDateStr(new Date());

  const invalidateSchedule = () =>
    qc.invalidateQueries({ queryKey: queryKeys.schedule.list({ from, to }) });

  const handleSaved = () => { invalidateSchedule(); setAddDate(null); };
  const handleDeleted = () => { invalidateSchedule(); setSelectedWorkoutId(null); };

  const allWorkouts = schedules ?? [];
  const completedCount = allWorkouts.filter((w) => w.is_completed).length;
  const totalCount = allWorkouts.length;

  return (
    <div className="min-h-screen bg-[#1a1b2e] text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div>
          <h1 className="text-lg font-bold text-white">{t.schedule.title}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
            </svg>
            <span className="text-xs text-slate-500 tabular-nums">{from} — {to}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            className="w-8 h-8 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3 py-1.5 rounded-xl bg-white/4 border border-white/8 text-xs font-bold text-white hover:bg-white/6 transition-colors"
          >
            {t.nutrition.today}
          </button>
          <button
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            className="w-8 h-8 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5 max-w-5xl">
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const dateStr = toDateStr(day);
            const isToday = dateStr === todayStr;
            const dayWorkouts = byDate[dateStr] ?? [];

            return (
              <div
                key={dateStr}
                className={cn(
                  'rounded-2xl border flex flex-col min-h-[160px] overflow-hidden transition-all',
                  isToday
                    ? 'border-blue-600/40 bg-blue-600/5'
                    : 'border-white/8 bg-white/4',
                )}
              >
                {/* Day header */}
                <div className={cn(
                  'px-2.5 py-2.5 flex items-start justify-between border-b',
                  isToday ? 'border-blue-600/20' : 'border-white/5',
                )}>
                  <div>
                    <p className={cn(
                      'text-[10px] font-bold uppercase tracking-wider',
                      isToday ? 'text-blue-400' : 'text-slate-600',
                    )}>
                      {t.schedule.shortDays[i]}
                    </p>
                    <p className={cn(
                      'text-xl font-black leading-tight',
                      isToday ? 'text-blue-400' : 'text-white',
                    )}>
                      {String(day.getDate()).padStart(2, '0')}
                    </p>
                  </div>
                  <button
                    onClick={() => setAddDate(dateStr)}
                    className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center transition-colors mt-0.5',
                      isToday
                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                        : 'bg-white/8 text-slate-500 hover:text-white hover:bg-white/12',
                    )}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>

                {/* Workouts */}
                <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                  {dayWorkouts.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-4">
                      <svg className="w-5 h-5 text-white/8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                      </svg>
                    </div>
                  ) : (
                    dayWorkouts.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => setSelectedWorkoutId(w.id)}
                        className={cn(
                          'w-full text-left rounded-xl px-2 py-2 text-[10px] leading-tight transition-all border',
                          w.is_completed
                            ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
                            : 'bg-blue-600/10 border-blue-600/20 text-blue-300 hover:bg-blue-600/15',
                        )}
                      >
                        <span className={cn(
                          'text-[8px] font-black uppercase tracking-widest block mb-0.5',
                          w.is_completed ? 'text-emerald-500' : 'text-blue-400',
                        )}>
                          {w.is_completed ? 'XONG' : 'KẾ HOẠCH'}
                        </span>
                        <p className="font-bold truncate text-white">
                          {w.name ?? w.plan?.name ?? t.workouts.defaultName}
                        </p>
                        {w.scheduled_time && (
                          <p className="text-slate-500 mt-0.5">{formatTime(w.scheduled_time)}</p>
                        )}
                        {w.scheduled_exercises.length > 0 && (
                          <p className="text-slate-500 mt-0.5">{w.scheduled_exercises.length} bài tập</p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-3 gap-4">
          <Link
            href="/ai-coach"
            className="col-span-2 relative rounded-2xl overflow-hidden min-h-[140px] group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-[#1a1b2e]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-blue-500 blur-2xl" />
              <div className="absolute bottom-4 right-12 w-16 h-16 rounded-full bg-purple-500 blur-2xl" />
            </div>
            <div className="relative p-5 h-full flex flex-col justify-end">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-[9px] font-black text-blue-400 uppercase tracking-wider w-fit mb-2">
                GỢI Ý
              </span>
              <p className="text-base font-black text-white leading-tight">{t.schedule.todaySuggestion}</p>
              <p className="text-xs text-slate-400 mt-1">{t.schedule.todaySuggestionDesc}</p>
            </div>
          </Link>

          <div className="rounded-2xl bg-white/4 border border-white/8 p-4 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-white">{t.schedule.weeklyGoal}</p>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">{t.schedule.sessionsCount}</span>
                  <span className="text-xs font-bold text-white">{completedCount}/{Math.max(totalCount, 4)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${Math.min((completedCount / Math.max(totalCount, 4)) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">{t.schedule.activeDays}</span>
                  <span className="text-xs font-bold text-white">
                    {weekDays.filter((d) => (byDate[toDateStr(d)] ?? []).length > 0).length}/7
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-yellow-500 transition-all"
                    style={{ width: `${(weekDays.filter((d) => (byDate[toDateStr(d)] ?? []).length > 0).length / 7) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {addDate && (
        <AddWorkoutForm date={addDate} onClose={() => setAddDate(null)} onSaved={handleSaved} />
      )}

      {selectedWorkout && (
        <WorkoutDetail
          workout={selectedWorkout}
          onClose={() => setSelectedWorkoutId(null)}
          onDeleted={handleDeleted}
          onToggleComplete={() =>
            toggleCompleteMutation.mutate({
              id: selectedWorkout.id,
              is_completed: !selectedWorkout.is_completed,
            })
          }
          onExercisesChanged={invalidateSchedule}
        />
      )}
    </div>
  );
}
