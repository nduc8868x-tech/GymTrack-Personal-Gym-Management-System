'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, X, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface FoodResult {
  id: string;
  name: string;
  brand: string | null;
  calories_per100g: number;
  protein_per100g: number;
  carbs_per100g: number;
  fat_per100g: number;
  serving_size_g: number | null;
  is_custom: boolean;
  source: 'database' | 'open_food_facts';
}

let searchTimer: ReturnType<typeof setTimeout>;

export default function FoodLogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { t } = useT();

  const MEAL_LABELS: Record<MealType, string> = {
    breakfast: t.nutrition.mealLabels.breakfast,
    lunch:     t.nutrition.mealLabels.lunch,
    dinner:    t.nutrition.mealLabels.dinner,
    snack:     t.nutrition.mealLabels.snack,
  };

  const MEAL_ICONS: Record<MealType, string> = {
    breakfast: '🌅',
    lunch:     '☀️',
    dinner:    '🌙',
    snack:     '🍎',
  };

  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState<FoodResult | null>(null);
  const [mealType, setMealType]   = useState<MealType>('breakfast');
  const [quantity, setQuantity]   = useState('100');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFood, setCustomFood] = useState({
    name: '',
    calories_per100g: '',
    protein_per100g: '0',
    carbs_per100g: '0',
    fat_per100g: '0',
  });

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    clearTimeout(searchTimer);
    if (!q.trim()) { setResults([]); return; }
    searchTimer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get<{ data: FoodResult[] }>('/nutrition/foods/search', {
          params: { q, limit: 20 },
        });
        setResults(res.data.data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const logMutation = useMutation({
    mutationFn: (payload: { food_id: string; logged_at: string; meal_type: MealType; quantity_g: number }) =>
      api.post('/nutrition/logs', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.nutrition.logs(date) });
      router.push('/nutrition');
    },
  });

  const createFoodMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post<{ data: FoodResult }>('/nutrition/foods', payload),
    onSuccess: (res) => {
      setSelected(res.data.data);
      setShowCustomForm(false);
      setResults([]);
      setQuery('');
    },
  });

  const handleLog = () => {
    if (!selected) return;
    logMutation.mutate({
      food_id: selected.id,
      logged_at: date,
      meal_type: mealType,
      quantity_g: parseFloat(quantity) || 100,
    });
  };

  const handleCreateCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    createFoodMutation.mutate({
      name: customFood.name,
      calories_per100g: parseFloat(customFood.calories_per100g),
      protein_per100g: parseFloat(customFood.protein_per100g) || 0,
      carbs_per100g: parseFloat(customFood.carbs_per100g) || 0,
      fat_per100g: parseFloat(customFood.fat_per100g) || 0,
    });
  };

  const qty = parseFloat(quantity) || 0;
  const preview = selected
    ? {
        calories: Math.round((selected.calories_per100g * qty) / 100),
        protein:  Math.round((selected.protein_per100g  * qty) / 100 * 10) / 10,
        carbs:    Math.round((selected.carbs_per100g    * qty) / 100 * 10) / 10,
        fat:      Math.round((selected.fat_per100g      * qty) / 100 * 10) / 10,
      }
    : null;

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-base font-bold text-white">{t.nutrition.logPage.title}</h1>
          <p className="text-xs text-slate-500">{date}</p>
        </div>
      </div>

      <div className="px-6 py-5 max-w-2xl space-y-5">
        {/* ── Meal type selector ───────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8">
          {(Object.keys(MEAL_LABELS) as MealType[]).map((m) => (
            <button
              key={m}
              onClick={() => setMealType(m)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                mealType === m
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-500 hover:text-slate-300',
              )}
            >
              <span>{MEAL_ICONS[m]}</span>
              <span className="hidden sm:inline">{MEAL_LABELS[m]}</span>
            </button>
          ))}
        </div>

        {/* ── Selected food card ───────────────────────────────── */}
        {selected ? (
          <div className="rounded-2xl bg-blue-600/10 border border-blue-600/20 p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-white">{selected.name}</p>
                {selected.brand && <p className="text-xs text-slate-500 mt-0.5">{selected.brand}</p>}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-400 shrink-0">{t.nutrition.logPage.quantity}</label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-28 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              <span className="text-xs text-slate-500">g</span>
              {selected.serving_size_g && (
                <button
                  onClick={() => setQuantity(String(selected.serving_size_g))}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  {t.nutrition.logPage.oneServing.replace('{size}', String(selected.serving_size_g))}
                </button>
              )}
            </div>

            {/* Macro preview */}
            {preview && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Kcal',    value: preview.calories, unit: '',  color: 'text-white' },
                  { label: 'Protein', value: preview.protein,  unit: 'g', color: 'text-blue-400' },
                  { label: 'Carbs',   value: preview.carbs,    unit: 'g', color: 'text-amber-400' },
                  { label: 'Fat',     value: preview.fat,      unit: 'g', color: 'text-red-400' },
                ].map(({ label, value, unit, color }) => (
                  <div key={label} className="rounded-xl bg-white/5 border border-white/8 px-2 py-2.5 text-center">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                    <p className={cn('text-sm font-black', color)}>{value}{unit}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleLog}
              disabled={logMutation.isPending || !quantity || parseFloat(quantity) <= 0}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all',
                'bg-blue-600 hover:bg-blue-500 active:scale-[0.98]',
                'shadow-lg shadow-blue-600/20',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {logMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t.nutrition.logPage.logTo.replace('{meal}', MEAL_LABELS[mealType])}
            </button>
          </div>
        ) : (
          <>
            {/* ── Search ─────────────────────────────────────────── */}
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t.nutrition.logPage.searchPlaceholder}
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-11 pr-11 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              {searching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-500" />
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="rounded-2xl bg-white/4 border border-white/8 overflow-hidden divide-y divide-white/5">
                {results.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => { setSelected(food); setQuery(''); setResults([]); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{food.name}</p>
                      {food.brand && <p className="text-xs text-slate-500 truncate">{food.brand}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">{food.calories_per100g}</p>
                      <p className="text-[10px] text-slate-600">{t.nutrition.per100g}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query.trim() && results.length === 0 && !searching && (
              <div className="rounded-2xl bg-white/4 border border-white/8 p-8 text-center">
                <p className="text-sm text-slate-500">{t.nutrition.logPage.noResults} &quot;{query}&quot;</p>
              </div>
            )}

            {/* Custom food toggle */}
            <div>
              <button
                onClick={() => setShowCustomForm((v) => !v)}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </div>
                {t.nutrition.logPage.createCustom}
              </button>

              {showCustomForm && (
                <form
                  onSubmit={handleCreateCustomFood}
                  className="mt-4 rounded-2xl bg-white/4 border border-white/8 p-5 space-y-4"
                >
                  <h3 className="text-sm font-bold text-white">{t.nutrition.logPage.customFood}</h3>

                  <input
                    type="text"
                    placeholder={t.nutrition.logPage.foodName}
                    value={customFood.name}
                    required
                    onChange={(e) => setCustomFood((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40 transition-all"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: 'calories_per100g', label: 'Calories (per 100g) *', required: true },
                      { key: 'protein_per100g',  label: 'Protein (g)',           required: false },
                      { key: 'carbs_per100g',    label: 'Carbs (g)',             required: false },
                      { key: 'fat_per100g',      label: 'Fat (g)',               required: false },
                    ] as const).map(({ key, label, required }) => (
                      <div key={key}>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          required={required}
                          value={customFood[key]}
                          onChange={(e) => setCustomFood((p) => ({ ...p, [key]: e.target.value }))}
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/40 transition-all"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={createFoodMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 transition-colors"
                    >
                      {createFoodMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      {t.nutrition.logPage.createAndSelect}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomForm(false)}
                      className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
