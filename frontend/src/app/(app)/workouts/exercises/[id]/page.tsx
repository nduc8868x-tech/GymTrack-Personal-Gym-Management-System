'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { ArrowLeft, Trash2, Trophy, Dumbbell, Camera, X, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { cn, formatDate, calcOneRM } from '@/lib/utils';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useT } from '@/lib/i18n';

interface PersonalRecord {
  id: string;
  weight_kg: number | null;
  reps: number | null;
  one_rm_estimate: number | null;
  is_current_best: boolean;
  achieved_at: string;
}

interface ExerciseDetail {
  id: string;
  name: string;
  primary_muscle: string;
  equipment: string;
  description: string | null;
  video_url: string | null;
  image_url: string | null;
  is_custom: boolean;
  personal_records: PersonalRecord[];
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: 'bg-red-100 text-red-700', back: 'bg-blue-100 text-blue-700',
  legs: 'bg-green-100 text-green-700', shoulders: 'bg-yellow-100 text-yellow-700',
  arms: 'bg-purple-100 text-purple-700', core: 'bg-orange-100 text-orange-700',
  cardio: 'bg-pink-100 text-pink-700', full_body: 'bg-gray-100 text-gray-700',
};

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { activeSession, startSession } = useWorkoutStore();
  const { t } = useT();
  const [starting, setStarting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return api.post<{ data: { image_url: string } }>(`/exercises/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.exercises.detail(id) });
      qc.invalidateQueries({ queryKey: ['exercises'] });
      setUploadError('');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setUploadError(e.response?.data?.error?.message || 'Upload thất bại. Vui lòng thử lại.');
    },
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: () => api.delete(`/exercises/${id}/image`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.exercises.detail(id) });
      qc.invalidateQueries({ queryKey: ['exercises'] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File quá lớn. Tối đa 5MB.');
      return;
    }
    uploadImageMutation.mutate(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const { data: exercise, isLoading } = useQuery({
    queryKey: queryKeys.exercises.detail(id),
    queryFn: () =>
      api.get<{ data: ExerciseDetail }>(`/exercises/${id}`).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/exercises/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercises'] });
      router.back();
    },
  });

  const handleLogExercise = async () => {
    if (activeSession) {
      router.push('/workouts/session');
      return;
    }
    setStarting(true);
    try {
      const res = await api.post<{ data: { id: string; name: string | null; started_at: string } }>(
        '/workouts/sessions',
        { name: exercise?.name },
      );
      const s = res.data.data;
      startSession({ id: s.id, name: s.name ?? exercise?.name ?? 'Workout', startedAt: s.started_at });
      router.push('/workouts/session');
    } finally {
      setStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-32 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!exercise) return null;

  const currentPR = exercise.personal_records.find((p) => p.is_current_best);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.common.back}
      </button>

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold leading-tight">{exercise.name}</h1>
          {exercise.is_custom && (
            <button
              onClick={() => {
                if (confirm(t.workouts.exercises.deleteConfirm)) deleteMutation.mutate();
              }}
              className="text-muted-foreground hover:text-destructive transition-colors mt-1"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
              MUSCLE_COLORS[exercise.primary_muscle] ?? 'bg-muted text-muted-foreground',
            )}
          >
            {exercise.primary_muscle.replace('_', ' ')}
          </span>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground capitalize">
            {exercise.equipment}
          </span>
        </div>
      </div>

      {/* Description */}
      {exercise.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{exercise.description}</p>
      )}

      {/* Exercise Image */}
      <div className="space-y-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {exercise.image_url ? (
          /* Image with overlay controls */
          <div className="relative rounded-xl overflow-hidden border border-border bg-muted aspect-video">
            <img
              src={exercise.image_url}
              alt={exercise.name}
              className="w-full h-full object-cover"
            />
            {/* Overlay buttons */}
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadImageMutation.isPending}
                title="Thay ảnh"
                className="flex items-center gap-1 rounded-md bg-black/60 px-2 py-1.5 text-xs text-white hover:bg-black/80 backdrop-blur transition-colors disabled:opacity-50"
              >
                {uploadImageMutation.isPending ? (
                  <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                Thay ảnh
              </button>
              <button
                onClick={() => {
                  if (confirm('Xóa ảnh bài tập này?')) deleteImageMutation.mutate();
                }}
                disabled={deleteImageMutation.isPending}
                title="Xóa ảnh"
                className="flex items-center gap-1 rounded-md bg-red-600/80 px-2 py-1.5 text-xs text-white hover:bg-red-700 backdrop-blur transition-colors disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Upload placeholder */
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadImageMutation.isPending}
            className="w-full rounded-xl border-2 border-dashed border-border bg-muted/40 hover:bg-muted/60 hover:border-primary/50 transition-colors py-10 flex flex-col items-center gap-3 disabled:opacity-50"
          >
            {uploadImageMutation.isPending ? (
              <>
                <span className="h-8 w-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Đang upload...</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Thêm ảnh bài tập</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP — tối đa 5MB</p>
                </div>
              </>
            )}
          </button>
        )}

        {/* Upload error */}
        {uploadError && (
          <p className="text-xs text-destructive">{uploadError}</p>
        )}
      </div>

      {/* Current PR */}
      {currentPR ? (
        <div className="flex items-center gap-3 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 px-4 py-3">
          <Trophy className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">{t.workouts.exercises.personalRecord}</p>
            <p className="text-sm font-semibold">
              {currentPR.weight_kg != null && currentPR.reps != null
                ? `${currentPR.weight_kg} kg × ${currentPR.reps} reps`
                : currentPR.reps != null
                ? `${currentPR.reps} reps`
                : '—'}
            </p>
            {currentPR.one_rm_estimate != null && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Est. 1RM: {currentPR.one_rm_estimate} kg
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3">
          <Dumbbell className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">{t.workouts.exercises.noPR}</p>
        </div>
      )}

      {/* PR History */}
      {exercise.personal_records.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t.workouts.exercises.prHistory}
          </h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
            {exercise.personal_records.map((pr) => (
              <div key={pr.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  {pr.is_current_best && <Trophy className="h-3.5 w-3.5 text-yellow-500" />}
                  <span className="text-sm">
                    {pr.weight_kg != null && pr.reps != null
                      ? `${pr.weight_kg} kg × ${pr.reps}`
                      : pr.reps != null
                      ? `${pr.reps} reps`
                      : '—'}
                  </span>
                </div>
                <div className="text-right">
                  {pr.one_rm_estimate != null && (
                    <p className="text-xs text-muted-foreground">1RM ~{pr.one_rm_estimate} kg</p>
                  )}
                  <p className="text-xs text-muted-foreground">{formatDate(pr.achieved_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log button */}
      <button
        onClick={handleLogExercise}
        disabled={starting}
        className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {starting
          ? t.workouts.exercises.starting
          : activeSession
          ? t.workouts.exercises.logInSession
          : t.workouts.exercises.startWithExercise}
      </button>
    </div>
  );
}
