'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { X, Search, Trophy, Trash2, Timer, ChevronDown, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useWorkoutStore, type SetLog, type PlannedExercise } from '@/stores/workoutStore';
import { useTimerStore } from '@/stores/timerStore';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface Exercise {
  id: string;
  name: string;
  primary_muscle: string;
  equipment: string;
}

// ─── Rest Timer ───────────────────────────────────────────────────────────────
function RestTimer() {
  const { t } = useT();
  const { secondsLeft, isRunning, totalSeconds, stop, start } = useTimerStore();

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      useTimerStore.getState().tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  if (!isRunning && secondsLeft === 0) return null;

  const pct = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div
      className={cn(
        'fixed bottom-20 md:bottom-6 inset-x-4 md:inset-x-auto md:right-6 md:left-auto md:w-72 rounded-xl border bg-[#1e1f35] shadow-lg p-4 z-50 transition-all',
        isRunning ? 'border-blue-500/40' : 'border-white/10 opacity-60',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-white">{t.workouts.session.restTimer}</span>
        </div>
        <button onClick={stop} className="text-slate-500 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold tabular-nums text-white">
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
        <div className="flex gap-2">
          {[60, 90, 120, 180].map((s) => (
            <button
              key={s}
              onClick={() => start(s)}
              className="rounded px-2 py-1 text-xs bg-white/8 hover:bg-white/12 text-slate-300 transition-colors"
            >
              {s}s
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-1000"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Exercise Picker Modal ────────────────────────────────────────────────────
function ExercisePicker({
  onSelect,
  onClose,
}: {
  onSelect: (ex: Exercise) => void;
  onClose: () => void;
}) {
  const { t } = useT();
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('');

  const { data: exercises = [] } = useQuery({
    queryKey: queryKeys.exercises.all({ search, muscle }),
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (muscle) params.set('muscle', muscle);
      params.set('limit', '100');
      return api
        .get<{ data: Exercise[] }>(`/exercises?${params}`)
        .then((r) => r.data.data);
    },
  });

  const muscles = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1b2e]">
      <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-semibold text-white">{t.workouts.exercises.title}</h2>
      </div>
      <div className="px-4 py-2 border-b border-white/8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            autoFocus
            type="text"
            placeholder={t.workouts.exercises.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40"
          />
        </div>
      </div>
      <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-white/8">
        <button
          onClick={() => setMuscle('')}
          className={cn(
            'flex-shrink-0 rounded-full px-3 py-1 text-xs border transition-colors',
            !muscle ? 'bg-blue-600 text-white border-blue-600' : 'border-white/10 text-slate-400 hover:bg-white/5',
          )}
        >
          {t.workouts.exercises.all}
        </button>
        {muscles.map((m) => (
          <button
            key={m}
            onClick={() => setMuscle(muscle === m ? '' : m)}
            className={cn(
              'flex-shrink-0 rounded-full px-3 py-1 text-xs border capitalize transition-colors',
              muscle === m ? 'bg-blue-600 text-white border-blue-600' : 'border-white/10 text-slate-400 hover:bg-white/5',
            )}
          >
            {m.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {exercises.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onSelect(ex)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-white">{ex.name}</p>
              <p className="text-xs text-slate-500 capitalize">
                {ex.primary_muscle.replace('_', ' ')} · {ex.equipment}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Plan Panel ───────────────────────────────────────────────────────────────
function PlanPanel({
  planned,
  groupedSets,
  onSelectExercise,
}: {
  planned: PlannedExercise[];
  groupedSets: Record<string, SetLog[]>;
  onSelectExercise: (ex: { id: string; name: string; primary_muscle: string; equipment: string }, weight: string, reps: string) => void;
}) {
  const doneSets = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of planned) {
      map[p.exerciseId] = (groupedSets[p.exerciseId] ?? []).length;
    }
    return map;
  }, [planned, groupedSets]);

  const doneCount = planned.filter((p) => (doneSets[p.exerciseId] ?? 0) >= p.sets).length;

  return (
    <div className="mx-4 my-3 rounded-2xl border border-violet-500/25 bg-violet-600/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-violet-500/15">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">KẾ HOẠCH</p>
        </div>
        <span className="text-xs font-bold text-slate-400">{doneCount}/{planned.length} bài</span>
      </div>
      <div className="divide-y divide-white/5">
        {planned.map((p, idx) => {
          const logged = doneSets[p.exerciseId] ?? 0;
          const done = logged >= p.sets;
          return (
            <button
              key={p.id}
              onClick={() =>
                onSelectExercise(
                  { id: p.exerciseId, name: p.exerciseName, primary_muscle: p.primaryMuscle, equipment: '' },
                  p.weightKg != null ? String(p.weightKg) : '',
                  String(p.reps),
                )
              }
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                done ? 'opacity-50' : 'hover:bg-white/5',
              )}
            >
              <span className="text-[10px] font-black text-violet-500 w-4 shrink-0">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', done ? 'line-through text-slate-500' : 'text-white')}>
                  {p.exerciseName}
                </p>
                <p className="text-xs text-slate-500">
                  {p.sets} × {p.reps}{p.weightKg != null ? ` @ ${p.weightKg}kg` : ''}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1.5">
                <span className={cn('text-xs font-bold tabular-nums', done ? 'text-emerald-400' : 'text-slate-400')}>
                  {logged}/{p.sets}
                </span>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : <div className="w-4 h-4 rounded-full border border-white/20" />
                }
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Session Page ────────────────────────────────────────────────────────
export default function WorkoutSessionPage() {
  const router = useRouter();
  const { t } = useT();
  const { activeSession, addSet, removeSet, endSession } = useWorkoutStore();
  const { start: startTimer } = useTimerStore();

  const [showPicker, setShowPicker] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const [logging, setLogging] = useState(false);
  const [ending, setEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!activeSession) {
      router.replace('/workouts');
    }
  }, [activeSession, router]);

  useEffect(() => {
    if (!activeSession) return;
    const start = new Date(activeSession.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const groupedSets = activeSession?.sets.reduce<Record<string, SetLog[]>>((acc, s) => {
    if (!acc[s.exerciseId]) acc[s.exerciseId] = [];
    acc[s.exerciseId].push(s);
    return acc;
  }, {}) ?? {};

  const getSetCount = (exerciseId: string) =>
    (groupedSets[exerciseId] ?? []).length + 1;

  const handleLogSet = async () => {
    if (!selectedExercise || !activeSession) return;
    setLogging(true);
    try {
      const res = await api.post<{
        data: {
          id: string;
          exercise: { id: string; name: string; primary_muscle: string };
          set_number: number;
          reps: number | null;
          weight_kg: number | null;
          duration_seconds: number | null;
          is_personal_record: boolean;
        };
      }>(`/workouts/sessions/${activeSession.id}/sets`, {
        exercise_id: selectedExercise.id,
        set_number: getSetCount(selectedExercise.id),
        ...(reps ? { reps: parseInt(reps) } : {}),
        ...(weight ? { weight_kg: parseFloat(weight) } : {}),
        ...(duration ? { duration_seconds: parseInt(duration) } : {}),
      });

      const s = res.data.data;
      addSet({
        id: s.id,
        exerciseId: s.exercise.id,
        exerciseName: s.exercise.name,
        setNumber: s.set_number,
        reps: s.reps ?? undefined,
        weightKg: s.weight_kg ?? undefined,
        durationSeconds: s.duration_seconds ?? undefined,
        isPersonalRecord: s.is_personal_record,
      });

      startTimer(90);
      setReps('');
      setWeight('');
      setDuration('');
    } finally {
      setLogging(false);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!activeSession) return;
    try {
      await api.delete(`/workouts/sessions/${activeSession.id}/sets/${setId}`);
      removeSet(setId);
    } catch {
      // ignore
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    setEnding(true);
    try {
      await api.put(`/workouts/sessions/${activeSession.id}`, {
        ended_at: new Date().toISOString(),
        notes: notes || undefined,
      });
      endSession();
      router.replace('/workouts/history');
    } finally {
      setEnding(false);
    }
  };

  // Tap plan row → select exercise + pre-fill weight/reps
  const handleSelectFromPlan = (
    ex: { id: string; name: string; primary_muscle: string; equipment: string },
    preWeight: string,
    preReps: string,
  ) => {
    setSelectedExercise(ex);
    if (preWeight) setWeight(preWeight);
    if (preReps) setReps(preReps);
    setShowPicker(false);
  };

  if (!activeSession) return null;

  const isCardio = selectedExercise?.primary_muscle === 'cardio' ||
    selectedExercise?.primary_muscle === 'core';

  const planned = activeSession.plannedExercises ?? [];

  // Header plan stat
  const planDoneCount = planned.filter(
    (p) => (groupedSets[p.exerciseId] ?? []).length >= p.sets,
  ).length;

  return (
    <div className="min-h-screen bg-[#1a1b2e] flex flex-col">
      {showPicker && (
        <ExercisePicker
          onSelect={(ex) => {
            setSelectedExercise(ex);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#1a1b2e] border-b border-white/8 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm text-white">{activeSession.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-500 tabular-nums">{formatElapsed(elapsed)}</p>
            {planned.length > 0 && (
              <>
                <span className="text-slate-700">·</span>
                <p className="text-xs text-violet-400 font-bold">{planDoneCount}/{planned.length} bài</p>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowEndConfirm(true)}
          className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
        >
          {t.workouts.session.endWorkout}
        </button>
      </div>

      {/* End confirm overlay */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60">
          <div className="w-full md:max-w-sm bg-[#1e1f35] rounded-t-2xl md:rounded-2xl border border-white/10 p-5 space-y-4">
            <h3 className="font-semibold text-lg text-white">{t.workouts.session.confirmEnd}</h3>
            <p className="text-sm text-slate-400">
              {activeSession.sets.length} set đã ghi. Thêm ghi chú (tuỳ chọn):
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Buổi tập diễn ra như thế nào?"
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleEndSession}
                disabled={ending}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {ending ? t.common.saving : t.common.done}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-64 md:pb-32">
        {/* Plan panel — shown only when session started from a plan */}
        {planned.length > 0 && (
          <PlanPanel
            planned={planned}
            groupedSets={groupedSets}
            onSelectExercise={handleSelectFromPlan}
          />
        )}

        {/* Log a set form */}
        <div className="px-4 py-4 border-b border-white/8 space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Ghi Set
          </h2>

          {/* Exercise picker button */}
          <button
            onClick={() => setShowPicker(true)}
            className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm hover:bg-white/8 transition-colors"
          >
            <span className={selectedExercise ? 'font-medium text-white' : 'text-slate-500'}>
              {selectedExercise ? selectedExercise.name : 'Chọn bài tập…'}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>

          {selectedExercise && (
            <div className="grid grid-cols-2 gap-2">
              {isCardio ? (
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Thời gian (giây)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40"
                />
              ) : (
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Số reps"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40"
                />
              )}
              <input
                type="number"
                inputMode="decimal"
                placeholder="Tạ (kg)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40"
              />
            </div>
          )}

          <button
            onClick={handleLogSet}
            disabled={!selectedExercise || logging || (!reps && !duration)}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40 transition-colors"
          >
            {logging ? 'Đang ghi…' : `Ghi Set${selectedExercise ? ` (Set ${getSetCount(selectedExercise.id)})` : ''}`}
          </button>
        </div>

        {/* Logged sets grouped by exercise */}
        <div className="px-4 py-4 space-y-4">
          {Object.keys(groupedSets).length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-sm">
              Chưa có set nào — chọn bài tập ở trên để bắt đầu
            </div>
          ) : (
            Object.entries(groupedSets).map(([exerciseId, sets]) => (
              <div key={exerciseId}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-white">
                  {sets[0].exerciseName}
                  <span className="text-xs font-normal text-slate-500">
                    {sets.length} set{sets.length > 1 ? 's' : ''}
                  </span>
                </h3>
                <div className="divide-y divide-white/5 rounded-xl border border-white/8 bg-white/3 overflow-hidden">
                  {sets.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="text-xs text-slate-500 w-12">
                        Set {s.setNumber}
                      </span>
                      <span className="flex-1 text-sm text-white">
                        {s.weightKg != null && s.reps != null
                          ? `${s.weightKg} kg × ${s.reps}`
                          : s.reps != null
                          ? `${s.reps} reps`
                          : s.durationSeconds != null
                          ? `${s.durationSeconds}s`
                          : '—'}
                      </span>
                      {s.isPersonalRecord && (
                        <Trophy className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                      )}
                      <button
                        onClick={() => handleDeleteSet(s.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <RestTimer />
    </div>
  );
}
