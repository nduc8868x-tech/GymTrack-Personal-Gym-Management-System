'use client';

import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useT } from '@/lib/i18n';
import { usePageTitle } from '@/hooks/usePageTitle';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NutritionPlan {
  id: string;
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  name: string | null;
}

interface FoodLog {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  quantity_g: number;
  food: { id: string; name: string; brand: string | null; calories_per100g: number };
  macros: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
}

interface FoodAnalysisResult {
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_note: string;
  confidence: 'high' | 'medium' | 'low';
}

const MEAL_ORDER: FoodLog['meal_type'][] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_CONFIG: Record<FoodLog['meal_type'], { icon: string; color: string }> = {
  breakfast: { icon: '🌅', color: 'text-amber-400' },
  lunch:     { icon: '☀️', color: 'text-yellow-400' },
  dinner:    { icon: '🌙', color: 'text-indigo-400' },
  snack:     { icon: '🍎', color: 'text-orange-400' },
};

const PRO_TIPS = [
  { title: 'Uống Nước Trước Tập', body: 'Uống 500ml nước 2 tiếng trước khi tập để duy trì sức bền cơ bắp tối đa.' },
  { title: 'Thời Điểm Nạp Protein', body: 'Nạp 20-40g protein trong vòng 30 phút sau khi tập để tối ưu tổng hợp cơ.' },
  { title: 'Nạp Carb Trước Buổi Nặng', body: 'Tăng lượng carbohydrate hôm trước các buổi cường độ cao để có thêm năng lượng.' },
];

function fmt(d: Date) { return d.toISOString().split('T')[0]; }

function displayDate(dateStr: string) {
  const today = fmt(new Date());
  const yesterday = fmt(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Hôm nay';
  if (dateStr === yesterday) return 'Hôm qua';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
}

// ─── Food Analysis Modal ──────────────────────────────────────────────────────

type MealType = FoodLog['meal_type'];
const MEAL_OPTS: { key: MealType; icon: string; label: string }[] = [
  { key: 'breakfast', icon: '🌅', label: 'Sáng'  },
  { key: 'lunch',     icon: '☀️', label: 'Trưa'  },
  { key: 'dinner',    icon: '🌙', label: 'Tối'   },
  { key: 'snack',     icon: '🍎', label: 'Snack' },
];
function defaultMeal(): MealType {
  const h = new Date().getHours();
  if (h >= 5  && h < 10) return 'breakfast';
  if (h >= 10 && h < 15) return 'lunch';
  if (h >= 18 && h < 22) return 'dinner';
  return 'snack';
}
function compressImage(file: File, cb: (b64: string) => void) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const MAX = 800;
    const s = Math.min(1, MAX / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url); cb(c.toDataURL('image/jpeg', 0.8));
  };
  img.src = url;
}

function FoodAnalysisModal({ date, onLogged, onClose }: {
  date: string;
  onLogged: () => void;
  onClose: () => void;
}) {
  const [preview, setPreview]   = useState<string | null>(null);
  const [result, setResult]     = useState<FoodAnalysisResult | null>(null);
  const [mealType, setMealType] = useState<MealType>(defaultMeal());
  const [logged, setLogged]     = useState(false);

  const { mutate: analyze, isPending: analyzing, error: analyzeError } = useMutation({
    mutationFn: (image: string) =>
      api.post<{ data: FoodAnalysisResult }>('/ai/analyze-food', { image }).then((r) => r.data.data),
    onSuccess: setResult,
  });

  const { mutate: logFood, isPending: logging, error: logError } = useMutation({
    mutationFn: async () => {
      if (!result) return;
      const food = await api.post<{ data: { id: string } }>('/nutrition/foods', {
        name: result.food_name,
        calories_per100g: result.calories,
        protein_per100g: result.protein_g,
        carbs_per100g: result.carbs_g,
        fat_per100g: result.fat_g,
      }).then((r) => r.data.data);
      await api.post('/nutrition/logs', {
        food_id: food.id, meal_type: mealType, quantity_g: 100, logged_at: date,
      });
    },
    onSuccess: () => { setLogged(true); onLogged(); setTimeout(onClose, 1400); },
  });

  const confColor = { high: 'text-emerald-400', medium: 'text-yellow-400', low: 'text-slate-500' } as const;
  const confLabel = { high: 'Cao', medium: 'Trung bình', low: 'Ước tính' } as const;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1e1f35] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h2 className="text-sm font-bold text-white">Phân tích món ăn từ ảnh</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">AI nhận diện & tự động ghi nhật ký</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          {logged ? (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-2xl">✅</div>
              <p className="text-sm font-bold text-white">Đã ghi vào nhật ký!</p>
              <p className="text-xs text-slate-500">{result?.food_name} · {MEAL_OPTS.find(m => m.key === mealType)?.label}</p>
            </div>
          ) : (
            <>
              {!result && (
                <label className={cn('block rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden', preview ? 'border-blue-500/30' : 'border-white/10 hover:border-white/20')}>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) compressImage(f, (b) => { setPreview(b); setResult(null); }); }} />
                  {preview ? <img src={preview} alt="preview" className="w-full h-44 object-cover" /> : (
                    <div className="h-44 flex flex-col items-center justify-center gap-2 text-slate-500">
                      <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                      <span className="text-xs">Chọn ảnh hoặc chụp ngay</span>
                    </div>
                  )}
                </label>
              )}
              {result && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-white/5 border border-white/8 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-white">{result.food_name}</p>
                        {result.serving_note && <p className="text-[10px] text-slate-500 mt-0.5">{result.serving_note}</p>}
                      </div>
                      <span className={cn('text-[10px] font-semibold shrink-0', confColor[result.confidence])}>{confLabel[result.confidence]}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {([
                        { label: 'Calo',    value: result.calories,  unit: 'kcal', color: 'text-blue-400'    },
                        { label: 'Protein', value: result.protein_g, unit: 'g',    color: 'text-emerald-400' },
                        { label: 'Carbs',   value: result.carbs_g,   unit: 'g',    color: 'text-yellow-400'  },
                        { label: 'Fat',     value: result.fat_g,     unit: 'g',    color: 'text-rose-400'    },
                      ] as const).map(({ label, value, unit, color }) => (
                        <div key={label} className="rounded-lg bg-white/5 p-2 text-center">
                          <p className={cn('text-sm font-black', color)}>{value}</p>
                          <p className="text-[9px] text-slate-500">{unit}</p>
                          <p className="text-[9px] text-slate-600">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Ghi vào bữa</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {MEAL_OPTS.map(({ key, icon, label }) => (
                        <button key={key} onClick={() => setMealType(key)}
                          className={cn('rounded-xl py-2 text-center transition-all', mealType === key ? 'bg-blue-600 border border-blue-500' : 'bg-white/5 border border-white/8 hover:bg-white/10')}>
                          <p className="text-base">{icon}</p>
                          <p className="text-[10px] text-white mt-0.5">{label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {(analyzeError || logError) && (
                <p className="text-xs text-rose-400 text-center">{((analyzeError || logError) as Error).message}</p>
              )}
              <div className="flex gap-2">
                {!result ? (
                  <>
                    <button disabled={!preview || analyzing} onClick={() => preview && analyze(preview)}
                      className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-40 transition-colors">
                      {analyzing ? 'Đang phân tích...' : '🔍 Phân tích'}
                    </button>
                    {preview && <button onClick={() => setPreview(null)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition-colors">Đổi ảnh</button>}
                  </>
                ) : (
                  <>
                    <button disabled={logging} onClick={() => logFood()}
                      className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-40 transition-colors">
                      {logging ? 'Đang ghi...' : '✅ Ghi ngay'}
                    </button>
                    <button onClick={() => { setResult(null); setPreview(null); }} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition-colors">Thử lại</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Calorie ring ─────────────────────────────────────────────────────────────

function CalRing({ current, goal }: { current: number; goal: number }) {
  const pct = goal > 0 ? Math.min(1, current / goal) : 0;
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <svg width="100" height="100" className="-rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke="#3b82f6" strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NutritionPage() {
  const qc = useQueryClient();
  const { t } = useT();
  usePageTitle('Dinh dưỡng');
  const [date, setDate] = useState(fmt(new Date()));
  const [showFoodAnalysis, setShowFoodAnalysis] = useState(false);
  const tipIdx = new Date().getDate() % PRO_TIPS.length;
  const tip = PRO_TIPS[tipIdx];

  const MEAL_LABELS: Record<FoodLog['meal_type'], string> = {
    breakfast: t.nutrition.mealLabels.breakfast,
    lunch:     t.nutrition.mealLabels.lunch,
    dinner:    t.nutrition.mealLabels.dinner,
    snack:     t.nutrition.mealLabels.snack,
  };

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(fmt(d));
  };

  const { data: plan } = useQuery({
    queryKey: queryKeys.nutrition.plan(),
    queryFn: () => api.get<{ data: NutritionPlan | null }>('/nutrition/plan').then((r) => r.data.data),
  });

  const { data: logsRaw, isLoading } = useQuery({
    queryKey: queryKeys.nutrition.logs(date),
    queryFn: () =>
      api.get<{ data: FoodLog[] }>('/nutrition/logs', { params: { date } }).then((r) => r.data.data),
  });

  const logs: FoodLog[] = Array.isArray(logsRaw) ? logsRaw : [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/nutrition/logs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.nutrition.logs(date) }),
  });

  // Totals
  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.macros.calories,
      protein:  acc.protein  + l.macros.protein_g,
      carbs:    acc.carbs    + l.macros.carbs_g,
      fat:      acc.fat      + l.macros.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const calGoal = plan?.daily_calories ?? 0;

  // Group by meal
  const byMeal = MEAL_ORDER.reduce((acc, meal) => {
    acc[meal] = logs.filter((l) => l.meal_type === meal);
    return acc;
  }, {} as Record<FoodLog['meal_type'], FoodLog[]>);

  return (
    <div className="h-screen bg-[#1a1b2e] text-white flex flex-col overflow-hidden">
      {/* ── Top nav bar ─────────────────────────────────────────── */}
      <div className="flex-none flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-6">
          <span className="text-blue-400 font-bold text-base tracking-tight">GymTrack</span>
          <nav className="hidden md:flex items-center gap-5">
            {[
              { label: 'Tập Luyện', href: '/workouts' },
              { label: 'Dinh Dưỡng', href: '/nutrition', active: true },
              { label: 'Cộng Đồng', href: '#' },
            ].map(({ label, href, active }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  'text-xs font-medium transition-colors pb-px',
                  active
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-slate-500 hover:text-slate-300',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <Link href="/nutrition/plan" className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 max-w-4xl mx-auto space-y-4">
        {/* ── Page header + date nav ───────────────────────────── */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-white tracking-tight">{t.nutrition.title}</h1>
          <div className="flex items-center gap-1 rounded-xl bg-white/5 border border-white/8 px-1 py-1">
            <button
              onClick={() => changeDate(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-semibold text-white px-3">{displayDate(date)}</span>
            <button
              onClick={() => changeDate(1)}
              disabled={date >= fmt(new Date())}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Calorie summary card ─────────────────────────────── */}
        <div className="rounded-2xl bg-white/4 border border-white/8 p-6">
          <div className="flex items-center gap-6">
            {/* Left: cal ring + number */}
            <div className="relative shrink-0">
              <CalRing current={totals.calories} goal={calGoal} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white leading-none">{totals.calories}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">kcal</span>
              </div>
            </div>

            {/* Right: message + macros */}
            <div className="flex-1 space-y-4">
              {plan ? (
                <>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-white">{totals.calories}</span>
                      <span className="text-sm text-slate-500">/ {calGoal} kcal</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (totals.calories / calGoal) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'PROTEIN', value: Math.round(totals.protein), goal: plan.protein_g, color: '#3b82f6' },
                      { label: 'TINH BỘT', value: Math.round(totals.carbs),   goal: plan.carbs_g,   color: '#f59e0b' },
                      { label: 'CHẤT BÉO', value: Math.round(totals.fat),     goal: plan.fat_g,     color: '#ef4444' },
                    ].map(({ label, value, goal, color }) => (
                      <div key={label} className="rounded-xl bg-white/5 border border-white/8 px-3 py-2 text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-base font-black" style={{ color }}>{value}<span className="text-xs font-normal text-slate-500">g</span></p>
                        <p className="text-[9px] text-slate-600 mt-0.5">/ {goal}g</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-4xl font-black text-white mb-1">0 <span className="text-xl font-normal text-slate-400">kcal</span></p>
                  <p className="text-sm text-slate-400 mb-4">Tiếp thêm năng lượng. Bắt đầu bằng cách đặt mục tiêu calo hàng ngày.</p>
                  <Link
                    href="/nutrition/plan"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-400 px-5 py-2.5 text-sm font-bold text-white transition-colors"
                  >
                    Thiết lập kế hoạch dinh dưỡng
                  </Link>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {['PROTEIN', 'TINH BỘT', 'CHẤT BÉO'].map((label) => (
                      <div key={label} className="rounded-xl bg-white/5 border border-white/8 px-3 py-2.5 text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-sm font-black text-slate-400">0g</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Add food buttons ─────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <Link
            href={`/nutrition/log?date=${date}`}
            className="inline-flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            + Thêm thực phẩm
          </Link>
          <button
            onClick={() => setShowFoodAnalysis(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600/15 border border-violet-500/25 hover:bg-violet-600/25 hover:border-violet-500/40 px-4 py-2.5 text-sm font-semibold text-violet-300 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            📸 Phân tích AI
          </button>
        </div>

        {/* ── Meal cards 2×2 grid ──────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/4 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MEAL_ORDER.map((meal) => {
              const entries = byMeal[meal];
              const mealCals = entries.reduce((s, l) => s + l.macros.calories, 0);
              const cfg = MEAL_CONFIG[meal];
              return (
                <div key={meal} className="rounded-2xl bg-white/4 border border-white/8 overflow-hidden">
                  {/* Meal header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-base">
                        {cfg.icon}
                      </div>
                      <span className="text-sm font-bold text-white">{MEAL_LABELS[meal]}</span>
                    </div>
                    <span className={cn('text-xs font-semibold', mealCals > 0 ? 'text-white' : 'text-slate-600')}>
                      {mealCals} kcal
                    </span>
                  </div>

                  {/* Meal entries */}
                  <div className="px-4 py-3 min-h-[56px]">
                    {entries.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">Chưa ghi gì cả</p>
                    ) : (
                      <div className="space-y-2">
                        {entries.map((log) => (
                          <div key={log.id} className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">{log.food.name}</p>
                              <p className="text-[10px] text-slate-600">
                                {log.quantity_g}g · P:{Math.round(log.macros.protein_g)}g C:{Math.round(log.macros.carbs_g)}g F:{Math.round(log.macros.fat_g)}g
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-white shrink-0">{log.macros.calories} kcal</span>
                            <button
                              onClick={() => deleteMutation.mutate(log.id)}
                              className="text-slate-700 hover:text-red-400 transition-colors shrink-0 ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pro Tip ─────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white/4 border border-white/8 p-4 flex items-center gap-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0 text-2xl">
            🥗
          </div>
          <div>
            <p className="text-xs font-bold text-blue-400 mb-0.5">Mẹo Hay: {tip.title}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{tip.body}</p>
          </div>
        </div>
      </div>
      </div>

      {/* ── Food Analysis Modal ──────────────────────────────── */}
      {showFoodAnalysis && (
        <FoodAnalysisModal
          date={date}
          onLogged={() => qc.invalidateQueries({ queryKey: queryKeys.nutrition.logs(date) })}
          onClose={() => setShowFoodAnalysis(false)}
        />
      )}

      {/* ── Bottom CTA (mobile) ──────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden px-4 pb-4 pt-2 bg-gradient-to-t from-[#1a1b2e] to-transparent">
        <Link
          href={`/nutrition/log?date=${date}`}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3.5 text-sm font-bold text-white transition-colors shadow-xl shadow-blue-600/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ghi Nhanh Bữa Ăn
        </Link>
      </div>
    </div>
  );
}
