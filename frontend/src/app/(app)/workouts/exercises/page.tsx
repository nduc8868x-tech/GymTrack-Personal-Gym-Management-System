'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';
import { MUSCLE_GROUPS } from '@/lib/constants';
import { useT } from '@/lib/i18n';
import { usePageTitle } from '@/hooks/usePageTitle';

interface Exercise {
  id: string;
  name: string;
  primary_muscle: string;
  equipment: string;
  is_custom: boolean;
  image_url: string | null;
}

const MUSCLE_COLORS: Record<string, { bg: string; text: string }> = {
  chest:     { bg: 'bg-red-500/15',    text: 'text-red-400' },
  back:      { bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  legs:      { bg: 'bg-green-500/15',  text: 'text-green-400' },
  shoulders: { bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
  arms:      { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  core:      { bg: 'bg-orange-500/15', text: 'text-orange-400' },
  cardio:    { bg: 'bg-pink-500/15',   text: 'text-pink-400' },
  full_body: { bg: 'bg-slate-500/15',  text: 'text-slate-400' },
};

const MUSCLE_ICONS: Record<string, string> = {
  chest: '💪', back: '🔙', legs: '🦵', shoulders: '🏋️',
  arms: '💪', core: '🎯', cardio: '🏃', full_body: '⚡',
};

export default function ExerciseLibraryPage() {
  const { t } = useT();
  usePageTitle('Thư viện bài tập');
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
    <div className="min-h-screen bg-[#1a1b2e] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{t.workouts.exercises.title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {exercises.length > 0 ? `${exercises.length} bài tập` : 'Tìm kiếm & thêm bài tập'}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all',
            showAddForm
              ? 'bg-blue-600 text-white'
              : 'bg-white/5 border border-white/10 text-white hover:bg-white/8',
          )}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={showAddForm ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
          </svg>
          {showAddForm ? 'Đóng' : t.workouts.exercises.custom}
        </button>
      </div>

      <div className="px-6 py-5 max-w-4xl space-y-5">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t.workouts.exercises.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-11 pr-11 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Muscle filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedMuscle('')}
            className={cn(
              'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-all',
              !selectedMuscle
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white bg-white/5',
            )}
          >
            {t.workouts.exercises.all}
          </button>
          {MUSCLE_GROUPS.map((m) => {
            const colors = MUSCLE_COLORS[m];
            const isActive = selectedMuscle === m;
            return (
              <button
                key={m}
                onClick={() => setSelectedMuscle(selectedMuscle === m ? '' : m)}
                className={cn(
                  'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-all',
                  isActive
                    ? `${colors?.bg ?? 'bg-white/10'} ${colors?.text ?? 'text-white'} border-transparent`
                    : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white bg-white/5',
                )}
              >
                {t.workouts.exercises.muscleGroups[m as keyof typeof t.workouts.exercises.muscleGroups] ?? m}
              </button>
            );
          })}
        </div>

        {/* Add custom form */}
        {showAddForm && (
          <div className="rounded-2xl bg-white/4 border border-white/8 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">{t.workouts.exercises.addCustom}</h3>
            <input
              type="text"
              placeholder="Tên bài tập"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nhóm cơ</label>
                <select
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/40 transition-all appearance-none"
                >
                  {MUSCLE_GROUPS.map((m) => (
                    <option key={m} value={m} className="bg-[#1a1b2e]">
                      {t.workouts.exercises.muscleGroups[m as keyof typeof t.workouts.exercises.muscleGroups] ?? m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dụng cụ</label>
                <select
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/40 transition-all appearance-none"
                >
                  {['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'].map((e) => (
                    <option key={e} value={e} className="bg-[#1a1b2e]">
                      {t.workouts.exercises.equipmentOptions[e as keyof typeof t.workouts.exercises.equipmentOptions] ?? e}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  addMutation.mutate({ name: newName, primary_muscle: newMuscle, equipment: newEquipment })
                }
                disabled={!newName.trim() || addMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 transition-colors"
              >
                {addMutation.isPending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {addMutation.isPending ? t.common.saving : t.workouts.exercises.addCustom}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        )}

        {/* Exercise list */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/4 animate-pulse" />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-2xl">
              🏋️
            </div>
            <p className="text-slate-500 text-sm font-medium">{t.workouts.exercises.noResults}</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-3 text-xs text-blue-400 font-semibold hover:text-blue-300 transition-colors"
            >
              + {t.workouts.exercises.addCustom}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map((ex) => {
              const colors = MUSCLE_COLORS[ex.primary_muscle];
              const icon = MUSCLE_ICONS[ex.primary_muscle] ?? '⚡';
              return (
                <Link
                  key={ex.id}
                  href={`/workouts/exercises/${ex.id}`}
                  className={cn(
                    'flex items-center gap-4 rounded-2xl bg-white/4 border border-white/8 px-4 py-3.5',
                    'hover:bg-white/6 hover:border-white/12 transition-all group',
                  )}
                >
                  {/* Icon / thumbnail */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base',
                    colors?.bg ?? 'bg-white/5',
                  )}>
                    {ex.image_url ? (
                      <img src={ex.image_url} alt={ex.name} className="w-full h-full object-cover rounded-xl" />
                    ) : icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{ex.name}</p>
                      {ex.is_custom && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/8 text-slate-500 border border-white/8 shrink-0">
                          TỰ TẠO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.workouts.exercises.equipmentOptions[ex.equipment as keyof typeof t.workouts.exercises.equipmentOptions] ?? ex.equipment}
                    </p>
                  </div>

                  {/* Muscle badge */}
                  <span className={cn(
                    'flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold',
                    colors?.bg ?? 'bg-white/8',
                    colors?.text ?? 'text-slate-400',
                  )}>
                    {t.workouts.exercises.muscleGroups[ex.primary_muscle as keyof typeof t.workouts.exercises.muscleGroups] ?? ex.primary_muscle}
                  </span>

                  <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
