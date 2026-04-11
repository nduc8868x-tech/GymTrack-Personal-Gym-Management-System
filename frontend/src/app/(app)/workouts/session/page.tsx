'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { X, Search, Trophy, Trash2, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useWorkoutStore, type SetLog } from '@/stores/workoutStore';
import { useTimerStore } from '@/stores/timerStore';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface Exercise {
  id: string;
  name: string;
  primary_muscle: string;
  equipment: string;
}

// ─── Rest Timer component ─────────────────────────────────────────────────────
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
        'fixed bottom-20 md:bottom-6 inset-x-4 md:inset-x-auto md:right-6 md:left-auto md:w-72 rounded-xl border bg-card shadow-lg p-4 z-50 transition-all',
        isRunning ? 'border-primary/50' : 'border-border opacity-60',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{t.workouts.session.restTimer}</span>
        </div>
        <button onClick={stop} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold tabular-nums">
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
        <div className="flex gap-2">
          {[60, 90, 120, 180].map((s) => (
            <button
              key={s}
              onClick={() => start(s)}
              className="rounded px-2 py-1 text-xs bg-muted hover:bg-accent transition-colors"
            >
              {s}s
            </button>
          ))}
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-1000"
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
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-semibold">{t.workouts.exercises.title}</h2>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            placeholder={t.workouts.exercises.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Muscle filter */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-border">
        <button
          onClick={() => setMuscle('')}
          className={cn(
            'flex-shrink-0 rounded-full px-3 py-1 text-xs border transition-colors',
            !muscle ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent',
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
              muscle === m ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent',
            )}
          >
            {m.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {exercises.map((ex) => (
          <button
            key={ex.id}
            onClick={() => onSelect(ex)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors"
          >
            <div>
              <p className="text-sm font-medium">{ex.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {ex.primary_muscle.replace('_', ' ')} · {ex.equipment}
              </p>
            </div>
          </button>
        ))}
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

  // Redirect if no active session
  useEffect(() => {
    if (!activeSession) {
      router.replace('/workouts');
    }
  }, [activeSession, router]);

  // Elapsed timer
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

  // Group sets by exercise for display
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

      // Auto-start rest timer (default 90s)
      startTimer(90);

      // Clear inputs
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

  if (!activeSession) return null;

  const isCardio = selectedExercise?.primary_muscle === 'cardio' ||
    selectedExercise?.primary_muscle === 'core';

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
      <div className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{activeSession.name}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{formatElapsed(elapsed)}</p>
        </div>
        <button
          onClick={() => setShowEndConfirm(true)}
          className="rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors"
        >
          {t.workouts.session.endWorkout}
        </button>
      </div>

      {/* End confirm overlay */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="w-full md:max-w-sm bg-card rounded-t-2xl md:rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-lg">{t.workouts.session.confirmEnd}</h3>
            <p className="text-sm text-muted-foreground">
              {activeSession.sets.length} sets logged. Add a note (optional):
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go?"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleEndSession}
                disabled={ending}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {ending ? t.common.saving : t.common.done}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-64 md:pb-32">
        {/* Log a set form */}
        <div className="px-4 py-4 border-b border-border space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Log Set
          </h2>

          {/* Exercise picker button */}
          <button
            onClick={() => setShowPicker(true)}
            className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2.5 text-sm hover:bg-accent transition-colors"
          >
            <span className={selectedExercise ? 'font-medium' : 'text-muted-foreground'}>
              {selectedExercise ? selectedExercise.name : 'Select exercise…'}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {selectedExercise && (
            <div className="grid grid-cols-2 gap-2">
              {/* Reps / Duration input */}
              {isCardio ? (
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Duration (s)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Reps"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              )}
              <input
                type="number"
                inputMode="decimal"
                placeholder="Weight (kg)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          <button
            onClick={handleLogSet}
            disabled={
              !selectedExercise ||
              logging ||
              (!reps && !duration)
            }
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {logging ? 'Logging…' : `Log Set${selectedExercise ? ` (Set ${getSetCount(selectedExercise.id)})` : ''}`}
          </button>
        </div>

        {/* Logged sets grouped by exercise */}
        <div className="px-4 py-4 space-y-4">
          {Object.keys(groupedSets).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No sets logged yet — select an exercise above to start
            </div>
          ) : (
            Object.entries(groupedSets).map(([exerciseId, sets]) => (
              <div key={exerciseId}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  {sets[0].exerciseName}
                  <span className="text-xs font-normal text-muted-foreground">
                    {sets.length} set{sets.length > 1 ? 's' : ''}
                  </span>
                </h3>
                <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
                  {sets.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="text-xs text-muted-foreground w-12">
                        Set {s.setNumber}
                      </span>
                      <span className="flex-1 text-sm">
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
                        className="text-muted-foreground hover:text-destructive transition-colors"
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

      {/* Rest Timer */}
      <RestTimer />
    </div>
  );
}
