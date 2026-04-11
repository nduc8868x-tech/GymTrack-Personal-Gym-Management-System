'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy, Clock, Dumbbell } from 'lucide-react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { formatDate } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface SessionSet {
  id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  is_personal_record: boolean;
  exercise: { id: string; name: string; primary_muscle: string };
}

interface SessionDetail {
  id: string;
  name: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  session_sets: SessionSet[];
}

function durationLabel(start: string, end: string) {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useT();

  const { data: session, isLoading } = useQuery({
    queryKey: queryKeys.workouts.session(id),
    queryFn: () =>
      api.get<{ data: SessionDetail }>(`/workouts/sessions/${id}`).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-40 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!session) return null;

  // Group sets by exercise
  const grouped = session.session_sets.reduce<Record<string, SessionSet[]>>((acc, s) => {
    const key = s.exercise.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const prCount = session.session_sets.filter((s) => s.is_personal_record).length;
  const totalVolume = session.session_sets
    .filter((s) => s.weight_kg != null && s.reps != null)
    .reduce((sum, s) => sum + (s.weight_kg! * s.reps!), 0);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.workouts.history.title}
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{session.name ?? 'Workout'}</h1>
        <p className="text-sm text-muted-foreground mt-1">{formatDate(session.started_at)}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card px-3 py-3 text-center">
          <p className="text-xl font-bold">{session.session_sets.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t.workouts.history.sets}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-3 text-center">
          <p className="text-xl font-bold">
            {session.ended_at ? durationLabel(session.started_at, session.ended_at) : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{t.workouts.session.duration}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-3 text-center">
          <p className="text-xl font-bold">
            {totalVolume > 0 ? `${Math.round(totalVolume).toLocaleString()}` : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{t.workouts.history.volume} (kg)</p>
        </div>
      </div>

      {prCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-2.5">
          <Trophy className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
            {prCount} {t.workouts.session.personalRecord}
          </p>
        </div>
      )}

      {/* Sets by exercise */}
      {Object.keys(grouped).length === 0 ? (
        <div className="py-8 text-center">
          <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t.workouts.session.noExercises}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([, sets]) => (
            <div key={sets[0].exercise.id}>
              <h3 className="text-sm font-semibold mb-2">{sets[0].exercise.name}</h3>
              <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
                <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-muted/50">
                  <span className="text-xs font-medium text-muted-foreground">{t.workouts.history.sets}</span>
                  <span className="text-xs font-medium text-muted-foreground">{t.workouts.session.reps}</span>
                  <span className="text-xs font-medium text-muted-foreground">{t.workouts.session.kg}</span>
                  <span className="text-xs font-medium text-muted-foreground">PR</span>
                </div>
                {sets.map((s) => (
                  <div key={s.id} className="grid grid-cols-4 gap-2 items-center px-4 py-2.5">
                    <span className="text-sm text-muted-foreground">{s.set_number}</span>
                    <span className="text-sm">
                      {s.reps != null ? s.reps : s.duration_seconds != null ? `${s.duration_seconds}s` : '—'}
                    </span>
                    <span className="text-sm">
                      {s.weight_kg != null ? `${s.weight_kg} kg` : '—'}
                    </span>
                    <span>
                      {s.is_personal_record ? (
                        <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {session.notes && (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t.common.notes}</p>
          <p className="text-sm">{session.notes}</p>
        </div>
      )}
    </div>
  );
}
