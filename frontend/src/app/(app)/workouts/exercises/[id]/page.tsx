'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { cn, formatDate } from '@/lib/utils';
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

const MUSCLE_COLORS: Record<string, { bg: string; text: string }> = {
  chest:     { bg: 'bg-red-500/20',    text: 'text-red-400' },
  back:      { bg: 'bg-blue-500/20',   text: 'text-blue-400' },
  legs:      { bg: 'bg-green-500/20',  text: 'text-green-400' },
  shoulders: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  arms:      { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  core:      { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  cardio:    { bg: 'bg-pink-500/20',   text: 'text-pink-400' },
  full_body: { bg: 'bg-slate-500/20',  text: 'text-slate-400' },
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Ngực', back: 'Lưng', legs: 'Chân', shoulders: 'Vai',
  arms: 'Tay', core: 'Bụng/Lõi', cardio: 'Cardio', full_body: 'Toàn thân',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Tạ đòn', dumbbell: 'Tạ đơn', machine: 'Máy tập',
  cable: 'Cáp', bodyweight: 'Thể trọng', other: 'Khác',
};

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { t } = useT();
  const [uploadError, setUploadError] = useState('');
  const [notes, setNotes] = useState<string | null>(null);
  const [notesSaved, setNotesSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: exercise, isLoading } = useQuery({
    queryKey: queryKeys.exercises.detail(id),
    queryFn: () =>
      api.get<{ data: ExerciseDetail }>(`/exercises/${id}`).then((r) => r.data.data),
  });

  useEffect(() => {
    if (exercise && notes === null) setNotes(exercise.description ?? '');
  }, [exercise]);

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

  const deleteImageMutation = useMutation({
    mutationFn: () => api.delete(`/exercises/${id}/image`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.exercises.detail(id) });
      qc.invalidateQueries({ queryKey: ['exercises'] });
    },
  });

  const saveNotesMutation = useMutation({
    mutationFn: (description: string) =>
      api.patch(`/exercises/${id}`, { description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.exercises.detail(id) });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/exercises/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercises'] });
      router.back();
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setUploadError('File quá lớn. Tối đa 5MB.'); return; }
    uploadImageMutation.mutate(file);
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#1a1b2e] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  if (!exercise) return null;

  const currentPR = exercise.personal_records.find((p) => p.is_current_best);
  const colors = MUSCLE_COLORS[exercise.primary_muscle];
  const notesValue = notes ?? exercise.description ?? '';
  const notesChanged = notesValue !== (exercise.description ?? '');

  return (
    <div className="h-screen bg-[#1a1b2e] text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-white/5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t.common.back}
        </button>

        {exercise.is_custom && (
          <button
            onClick={() => { if (confirm(t.workouts.exercises.deleteConfirm)) deleteMutation.mutate(); }}
            className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 max-w-2xl mx-auto space-y-5">

          {/* Title + badges */}
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{exercise.name}</h1>
            <div className="flex gap-2 mt-2">
              <span className={cn('rounded-full px-3 py-1 text-xs font-bold', colors?.bg, colors?.text)}>
                {MUSCLE_LABELS[exercise.primary_muscle] ?? exercise.primary_muscle}
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-bold bg-white/8 text-slate-400">
                {EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}
              </span>
            </div>
          </div>

          {/* Image section */}
          <div className="space-y-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {exercise.image_url ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/8 aspect-square bg-white/4">
                <img src={exercise.image_url} alt={exercise.name} className="w-full h-full object-contain" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadImageMutation.isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-black/60 backdrop-blur px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80 transition-colors disabled:opacity-50"
                  >
                    {uploadImageMutation.isPending ? (
                      <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    )}
                    Thay ảnh
                  </button>
                  <button
                    onClick={() => { if (confirm('Xóa ảnh bài tập này?')) deleteImageMutation.mutate(); }}
                    disabled={deleteImageMutation.isPending}
                    className="w-7 h-7 rounded-xl bg-red-600/70 backdrop-blur flex items-center justify-center text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadImageMutation.isPending}
                className="w-full rounded-2xl border-2 border-dashed border-white/10 bg-white/3 hover:bg-white/5 hover:border-blue-500/40 transition-all py-10 flex flex-col items-center gap-3 disabled:opacity-50"
              >
                {uploadImageMutation.isPending ? (
                  <>
                    <span className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-sm text-slate-500">Đang lưu ảnh...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-400">Lưu ảnh bài tập</p>
                      <p className="text-xs text-slate-600 mt-0.5">JPG, PNG, WEBP — tối đa 5MB</p>
                    </div>
                  </>
                )}
              </button>
            )}

            {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
          </div>

          {/* Personal Record */}
          {currentPR ? (
            <div className="flex items-center gap-3 rounded-2xl bg-amber-500/8 border border-amber-500/20 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{t.workouts.exercises.personalRecord}</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {currentPR.weight_kg != null && currentPR.reps != null
                    ? `${currentPR.weight_kg} kg × ${currentPR.reps} reps`
                    : currentPR.reps != null ? `${currentPR.reps} reps` : '—'}
                </p>
                {currentPR.one_rm_estimate != null && (
                  <p className="text-xs text-amber-400/70 mt-0.5">Est. 1RM: {currentPR.one_rm_estimate} kg</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/10 px-4 py-3.5">
              <svg className="w-5 h-5 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
              <p className="text-sm text-slate-500">{t.workouts.exercises.noPR}</p>
            </div>
          )}

          {/* Notes / Description */}
          <div className="rounded-2xl bg-white/4 border border-white/8 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ghi chú</p>
              {notesChanged && (
                <button
                  onClick={() => saveNotesMutation.mutate(notesValue)}
                  disabled={saveNotesMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
                >
                  {saveNotesMutation.isPending ? (
                    <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  Lưu
                </button>
              )}
              {notesSaved && !notesChanged && (
                <span className="text-xs text-emerald-400 font-semibold">✓ Đã lưu</span>
              )}
            </div>
            <textarea
              value={notesValue}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thêm ghi chú về kỹ thuật, lưu ý, kinh nghiệm..."
              rows={3}
              className="w-full bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* PR History */}
          {exercise.personal_records.length > 0 && (
            <div className="rounded-2xl bg-white/4 border border-white/8 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.workouts.exercises.prHistory}</p>
              </div>
              {exercise.personal_records.map((pr, idx) => (
                <div
                  key={pr.id}
                  className={cn(
                    'flex items-center justify-between px-4 py-3',
                    idx < exercise.personal_records.length - 1 && 'border-b border-white/5',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {pr.is_current_best && (
                      <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )}
                    <span className="text-sm font-semibold text-white">
                      {pr.weight_kg != null && pr.reps != null
                        ? `${pr.weight_kg} kg × ${pr.reps}`
                        : pr.reps != null ? `${pr.reps} reps` : '—'}
                    </span>
                  </div>
                  <div className="text-right">
                    {pr.one_rm_estimate != null && (
                      <p className="text-xs text-blue-400">~{pr.one_rm_estimate} kg 1RM</p>
                    )}
                    <p className="text-xs text-slate-500">{formatDate(pr.achieved_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pb-4" />
        </div>
      </div>
    </div>
  );
}
