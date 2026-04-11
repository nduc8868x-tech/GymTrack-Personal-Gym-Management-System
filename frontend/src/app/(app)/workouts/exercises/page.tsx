'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, X, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';
import { MUSCLE_GROUPS } from '@/lib/constants';
import { useT } from '@/lib/i18n';

interface Exercise {
  id: string;
  name: string;
  primary_muscle: string;
  equipment: string;
  is_custom: boolean;
  image_url: string | null;
}

// We will use t.workouts.exercises.muscleGroups instead of a hardcoded MUSCLE_LABELS

const MUSCLE_COLORS: Record<string, string> = {
  chest: 'bg-red-100 text-red-700',
  back: 'bg-blue-100 text-blue-700',
  legs: 'bg-green-100 text-green-700',
  shoulders: 'bg-yellow-100 text-yellow-700',
  arms: 'bg-purple-100 text-purple-700',
  core: 'bg-orange-100 text-orange-700',
  cardio: 'bg-pink-100 text-pink-700',
  full_body: 'bg-gray-100 text-gray-700',
};

export default function ExerciseLibraryPage() {
  const { t } = useT();
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('chest');
  const [newEquipment, setNewEquipment] = useState('barbell');

  const qc = useQueryClient();

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: queryKeys.exercises.all({ search, muscle: selectedMuscle }),
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedMuscle) params.set('muscle', selectedMuscle);
      params.set('limit', '100');
      return api
        .get<{ data: Exercise[] }>(`/exercises?${params}`)
        .then((r) => r.data.data);
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: { name: string; primary_muscle: string; equipment: string }) =>
      api.post('/exercises', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercises'] });
      setShowAddForm(false);
      setNewName('');
    },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.workouts.exercises.title}</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t.workouts.exercises.custom}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={t.workouts.exercises.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Muscle group filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedMuscle('')}
          className={cn(
            'flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors',
            !selectedMuscle
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-input hover:bg-accent',
          )}
        >
          {t.workouts.exercises.all}
        </button>
        {MUSCLE_GROUPS.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMuscle(selectedMuscle === m ? '' : m)}
            className={cn(
              'flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors',
              selectedMuscle === m
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-input hover:bg-accent',
            )}
          >
            {t.workouts.exercises.muscleGroups[m as keyof typeof t.workouts.exercises.muscleGroups] ?? m}
          </button>
        ))}
      </div>

      {/* Add custom form */}
      {showAddForm && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t.workouts.exercises.addCustom}</h3>
            <button onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <input
            type="text"
            placeholder={t.workouts.exercises.title}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newMuscle}
              onChange={(e) => setNewMuscle(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {MUSCLE_GROUPS.map((m) => (
                <option key={m} value={m}>{t.workouts.exercises.muscleGroups[m as keyof typeof t.workouts.exercises.muscleGroups] ?? m}</option>
              ))}
            </select>
            <select
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'].map((e) => (
                <option key={e} value={e}>{t.workouts.exercises.equipmentOptions[e as keyof typeof t.workouts.exercises.equipmentOptions] ?? e}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() =>
              addMutation.mutate({ name: newName, primary_muscle: newMuscle, equipment: newEquipment })
            }
            disabled={!newName.trim() || addMutation.isPending}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {addMutation.isPending ? t.common.saving : t.workouts.exercises.addCustom}
          </button>
        </div>
      )}

      {/* Exercise list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-sm">{t.workouts.exercises.noResults}</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 text-sm text-primary hover:underline"
          >
            {t.workouts.exercises.addCustom}
          </button>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
          {exercises.map((ex) => (
            <Link
                          key={ex.id}
              href={`/workouts/exercises/${ex.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
            >
              {/* Thumbnail */}
              <div className="flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden bg-muted border border-border">
                {ex.image_url ? (
                  <img src={ex.image_url} alt={ex.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-lg">
                      {ex.primary_muscle === 'chest' ? '💪' :
                       ex.primary_muscle === 'back' ? '🔙' :
                       ex.primary_muscle === 'legs' ? '🦵' :
                       ex.primary_muscle === 'shoulders' ? '🏋️' :
                       ex.primary_muscle === 'arms' ? '💪' :
                       ex.primary_muscle === 'core' ? '🎯' :
                       ex.primary_muscle === 'cardio' ? '🏃' : '⚡'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{ex.name}</p>
                  {ex.is_custom && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                      {t.workouts.exercises.custom}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.workouts.exercises.equipmentOptions[ex.equipment as keyof typeof t.workouts.exercises.equipmentOptions] ?? ex.equipment}
                </p>
              </div>
              <span
                className={cn(
                  'flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                  MUSCLE_COLORS[ex.primary_muscle] ?? 'bg-muted text-muted-foreground',
                )}
              >
                {t.workouts.exercises.muscleGroups[ex.primary_muscle as keyof typeof t.workouts.exercises.muscleGroups] ?? ex.primary_muscle}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
