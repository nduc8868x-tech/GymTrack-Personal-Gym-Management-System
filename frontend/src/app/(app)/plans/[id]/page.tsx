'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Search, X, Edit2, Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Exercise {
  id: string;
  name: string;
  primary_muscle: string;
  equipment: string;
}

interface PlanExercise {
  id: string;
  exercise_id: string;
  sets: number | null;
  reps_min: number | null;
  reps_max: number | null;
  rest_seconds: number;
  order_index: number | null;
  notes: string | null;
  exercise: { id: string; name: string; primary_muscle: string; equipment: string };
}

interface PlanDay {
  id: string;
  day_of_week: number;
  name: string | null;
  order_index: number | null;
  plan_exercises: PlanExercise[];
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  split_type: string;
  duration_weeks: number | null;
  is_active: boolean;
  plan_days: PlanDay[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  const { data } = useQuery({
    queryKey: queryKeys.exercises.all({ search, limit: 30 }),
    queryFn: () =>
      api
        .get<{ data: Exercise[] }>(`/exercises?search=${encodeURIComponent(search)}&limit=30`)
        .then((r) => r.data.data),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-xl border border-border shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-sm">{t.plans.detail.addExercise}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              placeholder={t.workouts.exercises.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {data?.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{ex.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {ex.primary_muscle} · {ex.equipment}
                </p>
              </div>
            </button>
          ))}
          {data?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">{t.workouts.exercises.noResults}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Plan Day Card ────────────────────────────────────────────────────────────

function DayCard({
  planId,
  day,
  onDelete,
}: {
  planId: string;
  day: PlanDay;
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const { t } = useT();
  const [open, setOpen] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const addExerciseMutation = useMutation({
    mutationFn: (exerciseId: string) =>
      api.post(`/plans/${planId}/days/${day.id}/exercises`, { exercise_id: exerciseId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.plans.detail(planId) }),
  });

  const removeExerciseMutation = useMutation({
    mutationFn: (exId: string) =>
      api.delete(`/plans/${planId}/days/${day.id}/exercises/${exId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.plans.detail(planId) }),
  });

  const handleExerciseSelect = (ex: Exercise) => {
    addExerciseMutation.mutate(ex.id);
    setShowPicker(false);
  };

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {day.name ?? DAY_NAMES[day.day_of_week]}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {DAY_NAMES[day.day_of_week]}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">{day.plan_exercises.length} {t.workouts.exercises.title.toLowerCase()}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded hover:bg-primary/10"
            >
              <Plus className="h-3.5 w-3.5" />
              {t.plans.detail.addExercise}
            </button>
            <button
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && day.plan_exercises.length > 0 && (
          <div className="border-t border-border divide-y divide-border">
            {day.plan_exercises.map((pe) => (
              <div key={pe.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pe.exercise.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {pe.exercise.primary_muscle}
                    {pe.sets ? ` · ${pe.sets} sets` : ''}
                    {pe.reps_min || pe.reps_max
                      ? ` · ${pe.reps_min ?? '?'}–${pe.reps_max ?? '?'} reps`
                      : ''}
                    {pe.rest_seconds ? ` · ${pe.rest_seconds}s rest` : ''}
                  </p>
                </div>
                <button
                  onClick={() => removeExerciseMutation.mutate(pe.id)}
                  disabled={removeExerciseMutation.isPending}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {open && day.plan_exercises.length === 0 && (
          <div className="border-t border-border px-4 py-4 text-center">
            <p className="text-xs text-muted-foreground">{t.plans.detail.noDaysDesc}</p>
          </div>
        )}
      </div>

      {showPicker && (
        <ExercisePicker onSelect={handleExerciseSelect} onClose={() => setShowPicker(false)} />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { t } = useT();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showAddDay, setShowAddDay] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayName, setDayName] = useState('');

  const { data: plan, isLoading } = useQuery({
    queryKey: queryKeys.plans.detail(id),
    queryFn: () => api.get<{ data: Plan }>(`/plans/${id}`).then((r) => r.data.data),
  });

  const updatePlanMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string }) => api.put(`/plans/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.plans.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.plans.all() });
      setEditingName(false);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: () => api.delete(`/plans/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.plans.all() });
      router.push('/plans');
    },
  });

  const addDayMutation = useMutation({
    mutationFn: (data: { day_of_week: number; name?: string }) =>
      api.post(`/plans/${id}/days`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.plans.detail(id) });
      setShowAddDay(false);
      setDayName('');
    },
  });

  const deleteDayMutation = useMutation({
    mutationFn: (dayId: string) => api.delete(`/plans/${id}/days/${dayId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.plans.detail(id) }),
  });

  const handleSaveName = () => {
    if (nameInput.trim()) updatePlanMutation.mutate({ name: nameInput.trim() });
  };

  const handleStartEditName = () => {
    setNameInput(plan?.name ?? '');
    setEditingName(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-lg border border-border animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/plans')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.plans.title}
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-lg font-bold outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={handleSaveName}
                  className="text-primary hover:text-primary/80"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold truncate">{plan.name}</h1>
                <button
                  onClick={handleStartEditName}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                {plan.is_active && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded flex-shrink-0">
                    {t.plans.active}
                  </span>
                )}
              </div>
            )}
            {plan.description && (
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
            )}
          </div>
          <button
            onClick={() => {
              if (confirm('Delete this plan?')) deletePlanMutation.mutate();
            }}
            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Plan Days */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t.plans.detail.dayName}
          </h2>
          <button
            onClick={() => setShowAddDay((v) => !v)}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t.plans.detail.addDay}
          </button>
        </div>

        {showAddDay && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium">{t.plans.detail.addDay}</h3>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {DAY_NAMES.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder={`${t.plans.detail.dayName} (${t.common.optional})`}
              value={dayName}
              onChange={(e) => setDayName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <button
                onClick={() => addDayMutation.mutate({ day_of_week: dayOfWeek, name: dayName || undefined })}
                disabled={addDayMutation.isPending}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {t.plans.detail.addDay}
              </button>
              <button
                onClick={() => setShowAddDay(false)}
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        )}

        {plan.plan_days.length === 0 && !showAddDay && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">{t.plans.detail.noDays}</p>
          </div>
        )}

        {plan.plan_days.map((day) => (
          <DayCard
            key={day.id}
            planId={id}
            day={day}
            onDelete={() => {
              if (confirm('Delete this day and all its exercises?')) deleteDayMutation.mutate(day.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
