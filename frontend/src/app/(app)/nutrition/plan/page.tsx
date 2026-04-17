'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ChevronLeft, Loader2, Target } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useT } from '@/lib/i18n';

interface NutritionPlan {
  id: string;
  name: string | null;
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  start_date: string | null;
  is_active: boolean;
}

interface FormState {
  name: string;
  daily_calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  start_date: string;
}


function calcCalFromMacros(p: number, c: number, f: number) {
  return p * 4 + c * 4 + f * 9;
}

export default function NutritionPlanPage() {
  const qc = useQueryClient();
  const { t } = useT();
  const PRESETS = [
    { label: t.nutrition.planPage.presets.cut, calories: 1800, protein: 160, carbs: 160, fat: 55 },
    { label: t.nutrition.planPage.presets.maintain, calories: 2200, protein: 150, carbs: 220, fat: 73 },
    { label: t.nutrition.planPage.presets.bulk, calories: 2800, protein: 180, carbs: 300, fat: 85 },
  ];

  const { data: plan, isLoading } = useQuery({
    queryKey: queryKeys.nutrition.plan(),
    queryFn: () => api.get<{ data: NutritionPlan | null }>('/nutrition/plan').then((r) => r.data.data),
  });

  const [form, setForm] = useState<FormState>({
    name: '',
    daily_calories: '2000',
    protein_g: '150',
    carbs_g: '200',
    fat_g: '65',
    start_date: new Date().toISOString().split('T')[0],
  });
  const [editing, setEditing] = useState(false);

  // Populate form from existing plan
  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name ?? '',
        daily_calories: String(plan.daily_calories),
        protein_g: String(plan.protein_g),
        carbs_g: String(plan.carbs_g),
        fat_g: String(plan.fat_g),
        start_date: plan.start_date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      });
    } else {
      setEditing(true); // no plan yet → show form immediately
    }
  }, [plan]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      plan
        ? api.put(`/nutrition/plan/${plan.id}`, payload)
        : api.post('/nutrition/plan', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.nutrition.plan() });
      setEditing(false);
    },
  });

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setForm((p) => ({
      ...p,
      daily_calories: String(preset.calories),
      protein_g: String(preset.protein),
      carbs_g: String(preset.carbs),
      fat_g: String(preset.fat),
    }));
  };

  const setField = (key: keyof FormState, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      name: form.name || undefined,
      daily_calories: parseInt(form.daily_calories),
      protein_g: parseInt(form.protein_g),
      carbs_g: parseInt(form.carbs_g),
      fat_g: parseInt(form.fat_g),
      start_date: form.start_date || undefined,
    });
  };

  // Macro calorie breakdown
  const p = parseInt(form.protein_g) || 0;
  const c = parseInt(form.carbs_g) || 0;
  const f = parseInt(form.fat_g) || 0;
  const calFromMacros = calcCalFromMacros(p, c, f);
  const totalCal = parseInt(form.daily_calories) || 0;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/nutrition" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{t.nutrition.planPage.title}</h1>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !editing && plan && (
        /* View mode */
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{plan.name ?? 'Kế Hoạch Của Tôi'}</p>
                {plan.start_date && (
                  <p className="text-xs text-muted-foreground">
                    {t.nutrition.planPage.since.replace('{date}', new Date(plan.start_date).toLocaleDateString())}
                  </p>
                )}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">
                {t.plans.active}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-4 text-center col-span-2">
                <p className="text-3xl font-bold">{plan.daily_calories}</p>
                <p className="text-xs text-muted-foreground mt-0.5">kcal / day</p>
              </div>
              {[
                { label: t.nutrition.protein, value: plan.protein_g, kcal: plan.protein_g * 4, color: 'text-blue-500' },
                { label: t.nutrition.carbs, value: plan.carbs_g, kcal: plan.carbs_g * 4, color: 'text-yellow-500' },
                { label: t.nutrition.fat, value: plan.fat_g, kcal: plan.fat_g * 9, color: 'text-red-500' },
              ].map(({ label, value, kcal, color }) => (
                <div key={label} className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className={`text-xl font-bold ${color}`}>{value}g</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{kcal} kcal</p>
                </div>
              ))}
            </div>

            {/* Macro split bar */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{t.nutrition.planPage.macroSplit}</span>
                <span>{plan.protein_g * 4 + plan.carbs_g * 4 + plan.fat_g * 9} kcal from macros</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden gap-px">
                {[
                  { pct: (plan.protein_g * 4 / plan.daily_calories) * 100, color: 'bg-blue-500' },
                  { pct: (plan.carbs_g * 4 / plan.daily_calories) * 100, color: 'bg-yellow-500' },
                  { pct: (plan.fat_g * 9 / plan.daily_calories) * 100, color: 'bg-red-500' },
                ].map(({ pct, color }, i) => (
                  <div key={i} className={`${color} rounded-full`} style={{ width: `${pct}%` }} />
                ))}
              </div>
              <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Protein {Math.round((plan.protein_g * 4 / plan.daily_calories) * 100)}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />Carbs {Math.round((plan.carbs_g * 4 / plan.daily_calories) * 100)}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Fat {Math.round((plan.fat_g * 9 / plan.daily_calories) * 100)}%</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setEditing(true)}
            className="w-full rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            {t.nutrition.planPage.editPlan}
          </button>
        </div>
      )}

      {!isLoading && (editing || !plan) && (
        /* Edit / Create form */
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Presets */}
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Target className="h-4 w-4" /> {t.nutrition.planPage.quickPresets}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent transition-colors text-center"
                >
                  <div>{preset.label}</div>
                  <div className="text-muted-foreground mt-0.5">{preset.calories} kcal</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t.nutrition.planPage.planNameOptional}</label>
              <input
                type="text"
                placeholder="e.g. Summer Cut"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t.nutrition.planPage.dailyCalories}</label>
              <input
                type="number"
                required
                min="500"
                max="10000"
                value={form.daily_calories}
                onChange={(e) => setField('daily_calories', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'protein_g', label: `${t.nutrition.protein} (g)`, color: 'text-blue-500' },
                { key: 'carbs_g', label: `${t.nutrition.carbs} (g)`, color: 'text-yellow-500' },
                { key: 'fat_g', label: `${t.nutrition.fat} (g)`, color: 'text-red-500' },
              ] as const).map(({ key, label, color }) => (
                <div key={key}>
                  <label className={`block text-xs mb-1 ${color}`}>{label}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>

            {/* Macro cal check */}
            <div className={`text-xs rounded-md px-3 py-2 ${Math.abs(calFromMacros - totalCal) > 100 ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted text-muted-foreground'}`}>
              {Math.abs(calFromMacros - totalCal) > 100
                ? t.nutrition.planPage.macroCalWarning.replace('{cal}', String(calFromMacros)).replace('{diff}', String(Math.abs(calFromMacros - totalCal)))
                : t.nutrition.planPage.macroCalOk.replace('{cal}', String(calFromMacros))}
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t.nutrition.planPage.startDate}</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setField('start_date', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {plan ? t.nutrition.planPage.saveChanges : t.nutrition.planPage.createPlan}
            </button>
            {plan && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border border-border px-4 py-2.5 text-sm hover:bg-accent transition-colors"
              >
                {t.common.cancel}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
