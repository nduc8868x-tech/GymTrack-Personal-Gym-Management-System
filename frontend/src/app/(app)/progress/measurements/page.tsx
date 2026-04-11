'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { Plus, Camera, X, ChevronLeft, Scale, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useT } from '@/lib/i18n';

interface Measurement {
  id: string;
  measured_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  left_arm_cm: number | null;
  right_arm_cm: number | null;
  left_thigh_cm: number | null;
  right_thigh_cm: number | null;
  photo_url: string | null;
  notes: string | null;
}

interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
}


type FormState = Partial<Record<keyof Measurement, string>>;

const today = () => new Date().toISOString().split('T')[0];

async function uploadToImageKit(
  file: File,
  authParams: ImageKitAuthParams,
  publicKey: string,
  urlEndpoint: string,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', `measurement_${Date.now()}_${file.name}`);
  formData.append('folder', '/gymtrack/measurements');
  formData.append('publicKey', publicKey);
  formData.append('signature', authParams.signature);
  formData.append('expire', String(authParams.expire));
  formData.append('token', authParams.token);

  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Image upload failed');
  const json = await res.json();
  return json.url as string;
}

export default function MeasurementsPage() {
  const qc = useQueryClient();
  const { t } = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const FIELDS: { key: keyof Measurement; label: string; unit: string }[] = [
    { key: 'weight_kg', label: t.progress.measurements.fields.weight_kg, unit: 'kg' },
    { key: 'body_fat_pct', label: t.progress.measurements.fields.body_fat_pct, unit: '%' },
    { key: 'chest_cm', label: t.progress.measurements.fields.chest_cm, unit: 'cm' },
    { key: 'waist_cm', label: t.progress.measurements.fields.waist_cm, unit: 'cm' },
    { key: 'hips_cm', label: t.progress.measurements.fields.hips_cm, unit: 'cm' },
    { key: 'left_arm_cm', label: t.progress.measurements.fields.left_arm_cm, unit: 'cm' },
    { key: 'right_arm_cm', label: t.progress.measurements.fields.right_arm_cm, unit: 'cm' },
    { key: 'left_thigh_cm', label: t.progress.measurements.fields.left_thigh_cm, unit: 'cm' },
    { key: 'right_thigh_cm', label: t.progress.measurements.fields.right_thigh_cm, unit: 'cm' },
  ];

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({ measured_at: today() });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ?? '';
  const IMAGEKIT_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? '';

  const { data: res, isLoading } = useQuery({
    queryKey: queryKeys.progress.measurements(),
    queryFn: () =>
      api
        .get<{ data: Measurement[]; meta: { total: number } }>('/progress/measurements', {
          params: { limit: 50 },
        })
        .then((r) => r.data),
  });

  const measurements = res?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/progress/measurements', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.progress.measurements() });
      setShowForm(false);
      setForm({ measured_at: today() });
      setPhotoFile(null);
      setPhotoPreview(null);
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let photo_url: string | undefined;

      if (photoFile && IMAGEKIT_PUBLIC_KEY && IMAGEKIT_URL_ENDPOINT) {
        const authRes = await api.get<{ data: ImageKitAuthParams }>('/progress/imagekit-auth');
        photo_url = await uploadToImageKit(
          photoFile,
          authRes.data.data,
          IMAGEKIT_PUBLIC_KEY,
          IMAGEKIT_URL_ENDPOINT,
        );
      }

      const payload: Record<string, unknown> = { measured_at: form.measured_at };
      for (const { key } of FIELDS) {
        const val = form[key];
        if (val !== undefined && val !== '') payload[key] = parseFloat(val as string);
      }
      if (form.notes) payload.notes = form.notes;
      if (photo_url) payload.photo_url = photo_url;

      await createMutation.mutateAsync(payload);
    } finally {
      setUploading(false);
    }
  };

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/progress" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">{t.progress.measurements.title}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="ml-auto flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t.progress.measurements.log}
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-card p-5 space-y-4"
        >
          <h2 className="font-semibold text-sm">{t.progress.measurements.newMeasurement}</h2>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t.common.date}</label>
            <input
              type="date"
              value={form.measured_at as string}
              onChange={(e) => setField('measured_at', e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(({ key, label, unit }) => (
              <div key={key}>
                <label className="block text-xs text-muted-foreground mb-1">
                  {label} ({unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="—"
                  value={(form[key] as string) ?? ''}
                  onChange={(e) => setField(key, e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t.progress.measurements.photo}</label>
            {photoPreview ? (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-md border border-border"
                />
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:bg-accent transition-colors"
              >
                <Camera className="h-4 w-4" />
                {t.progress.measurements.addPhoto}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t.common.notes}</label>
            <textarea
              rows={2}
              placeholder={t.progress.measurements.notesPlaceholder}
              value={(form.notes as string) ?? ''}
              onChange={(e) => setField('notes', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploading || createMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {(uploading || createMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {uploading ? t.progress.measurements.uploading : createMutation.isPending ? t.common.saving : t.common.save}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setPhotoFile(null); setPhotoPreview(null); }}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              {t.common.cancel}
            </button>
          </div>

          {createMutation.isError && (
            <p className="text-xs text-destructive">Failed to save. Please try again.</p>
          )}
        </form>
      )}

      {/* Timeline */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg border border-border animate-pulse bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && measurements.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Scale className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">{t.progress.measurements.noMeasurements}</p>
          <p className="text-xs text-muted-foreground mt-1">{t.progress.measurements.noMeasurementsDesc}</p>
        </div>
      )}

      {measurements.length > 0 && (
        <div className="space-y-3">
          {measurements.map((m, idx) => {
            const prev = measurements[idx + 1];
            const weightDiff =
              m.weight_kg != null && prev?.weight_kg != null
                ? m.weight_kg - prev.weight_kg
                : null;

            return (
              <div key={m.id} className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                  {/* Photo thumbnail */}
                  {m.photo_url && (
                    <img
                      src={m.photo_url}
                      alt="Progress photo"
                      className="h-16 w-16 rounded-md object-cover flex-shrink-0 border border-border"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">
                        {new Date(m.measured_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {weightDiff !== null && (
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            weightDiff < 0
                              ? 'bg-green-500/10 text-green-600'
                              : weightDiff > 0
                              ? 'bg-red-500/10 text-red-600'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {weightDiff > 0 ? '+' : ''}
                          {weightDiff.toFixed(1)} kg
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5">
                      {m.weight_kg != null && (
                        <span className="text-xs text-muted-foreground">
                          {t.progress.measurements.fields.weight_kg}: <span className="text-foreground font-medium">{m.weight_kg} kg</span>
                        </span>
                      )}
                      {m.body_fat_pct != null && (
                        <span className="text-xs text-muted-foreground">
                          {t.progress.measurements.fields.body_fat_pct}: <span className="text-foreground font-medium">{m.body_fat_pct}%</span>
                        </span>
                      )}
                      {m.chest_cm != null && (
                        <span className="text-xs text-muted-foreground">
                          {t.progress.measurements.fields.chest_cm}: <span className="text-foreground font-medium">{m.chest_cm} cm</span>
                        </span>
                      )}
                      {m.waist_cm != null && (
                        <span className="text-xs text-muted-foreground">
                          {t.progress.measurements.fields.waist_cm}: <span className="text-foreground font-medium">{m.waist_cm} cm</span>
                        </span>
                      )}
                      {m.hips_cm != null && (
                        <span className="text-xs text-muted-foreground">
                          {t.progress.measurements.fields.hips_cm}: <span className="text-foreground font-medium">{m.hips_cm} cm</span>
                        </span>
                      )}
                      {(m.left_arm_cm != null || m.right_arm_cm != null) && (
                        <span className="text-xs text-muted-foreground">
                          {t.progress.measurements.arms}:{' '}
                          <span className="text-foreground font-medium">
                            {m.left_arm_cm ?? '—'} / {m.right_arm_cm ?? '—'} cm
                          </span>
                        </span>
                      )}
                      {(m.left_thigh_cm != null || m.right_thigh_cm != null) && (
                        <span className="text-xs text-muted-foreground">
                          {t.progress.measurements.thighs}:{' '}
                          <span className="text-foreground font-medium">
                            {m.left_thigh_cm ?? '—'} / {m.right_thigh_cm ?? '—'} cm
                          </span>
                        </span>
                      )}
                    </div>

                    {m.notes && (
                      <p className="text-xs text-muted-foreground mt-1.5 italic">{m.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
