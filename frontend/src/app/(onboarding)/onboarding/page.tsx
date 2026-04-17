'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

type GoalType = 'muscle_gain' | 'fat_loss' | 'strength' | 'general_health';
type Gender = 'male' | 'female' | 'other';

interface Step1 {
  gender: Gender | '';
  birthdate: string;
  height_cm: string;
}

interface Step2 {
  current_weight: string;
  goal_type: GoalType | '';
  target_weight: string;
  weight_unit: 'kg' | 'lbs';
}

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useT();

  const GOAL_OPTIONS: { value: GoalType; label: string; icon: string; desc: string }[] = [
    { value: 'muscle_gain', label: t.onboarding.goalOptions.muscle_gain, icon: '💪', desc: 'Tăng khối lượng cơ bắp' },
    { value: 'fat_loss',    label: t.onboarding.goalOptions.fat_loss,    icon: '🔥', desc: 'Giảm mỡ, cải thiện vóc dáng' },
    { value: 'strength',    label: t.onboarding.goalOptions.strength,    icon: '🏋️', desc: 'Nâng tạ nặng hơn' },
    { value: 'general_health', label: t.onboarding.goalOptions.general_health, icon: '❤️', desc: 'Sống khoẻ mỗi ngày' },
  ];

  const GENDER_OPTIONS: { value: Gender; label: string; icon: string }[] = [
    { value: 'male',   label: t.onboarding.genderOptions.male,   icon: '♂' },
    { value: 'female', label: t.onboarding.genderOptions.female, icon: '♀' },
    { value: 'other',  label: t.onboarding.genderOptions.other,  icon: '○' },
  ];

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [step1, setStep1] = useState<Step1>({ gender: '', birthdate: '', height_cm: '' });
  const [step2, setStep2] = useState<Step2>({ current_weight: '', goal_type: '', target_weight: '', weight_unit: 'kg' });

  const handleFinish = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/onboarding', {
        ...(step1.gender && { gender: step1.gender }),
        ...(step1.birthdate && { birthdate: step1.birthdate }),
        ...(step1.height_cm && { height_cm: parseFloat(step1.height_cm) }),
        ...(step2.current_weight && { current_weight: parseFloat(step2.current_weight) }),
        ...(step2.goal_type && { goal_type: step2.goal_type }),
        ...(step2.target_weight && { target_weight: parseFloat(step2.target_weight) }),
        weight_unit: step2.weight_unit,
      });
      router.push('/dashboard');
    } catch {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const pct = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-[#111223] text-white flex flex-col">
      {/* Top progress bar */}
      <div className="h-0.5 bg-white/5">
        <div
          className="h-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm space-y-7">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    i + 1 === step
                      ? 'w-6 h-2 bg-blue-500'
                      : i + 1 < step
                      ? 'w-2 h-2 bg-blue-500/60'
                      : 'w-2 h-2 bg-white/15',
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] font-medium text-slate-500 tracking-wider">
              {t.onboarding.stepOf.replace('{step}', String(step)).replace('{total}', String(TOTAL_STEPS))}
            </span>
          </div>

          {/* Header */}
          <div>
            {step === 1 && (
              <>
                <h1 className="text-2xl font-black text-white tracking-tight">{t.onboarding.aboutYou}</h1>
                <p className="text-slate-500 text-sm mt-1">{t.onboarding.aboutYouSubtitle}</p>
              </>
            )}
            {step === 2 && (
              <>
                <h1 className="text-2xl font-black text-white tracking-tight">{t.onboarding.yourGoal}</h1>
                <p className="text-slate-500 text-sm mt-1">{t.onboarding.yourGoalSubtitle}</p>
              </>
            )}
            {step === 3 && (
              <>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {t.onboarding.allSet.replace('{name}', user?.name?.split(' ')[0] ?? '')}
                </h1>
                <p className="text-slate-500 text-sm mt-1">{t.onboarding.reviewSubtitle}</p>
              </>
            )}
          </div>

          {/* ── Step 1 — Personal info ──────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  {t.onboarding.fields.gender}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GENDER_OPTIONS.map(({ value, label, icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStep1((s) => ({ ...s, gender: value }))}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl border py-3.5 text-sm font-semibold transition-all',
                        step1.gender === value
                          ? 'border-blue-500/60 bg-blue-600/15 text-blue-400'
                          : 'border-white/8 bg-white/4 text-slate-400 hover:border-white/15 hover:text-white',
                      )}
                    >
                      <span className="text-lg">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Birthdate */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t.onboarding.fields.birthdate}
                </label>
                <input
                  type="date"
                  value={step1.birthdate}
                  onChange={(e) => setStep1((s) => ({ ...s, birthdate: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all [color-scheme:dark]"
                />
              </div>

              {/* Height */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t.onboarding.fields.height}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="175"
                    value={step1.height_cm}
                    onChange={(e) => setStep1((s) => ({ ...s, height_cm: e.target.value }))}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">cm</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2 — Goal + Weight ──────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Goal type */}
              <div className="grid grid-cols-2 gap-2.5">
                {GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStep2((s) => ({ ...s, goal_type: opt.value }))}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all',
                      step2.goal_type === opt.value
                        ? 'border-blue-500/60 bg-blue-600/15'
                        : 'border-white/8 bg-white/4 hover:border-white/15',
                    )}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className={cn('text-sm font-bold', step2.goal_type === opt.value ? 'text-blue-400' : 'text-white')}>
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {/* Current weight */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t.onboarding.fields.currentWeight}{' '}
                  <span className="text-slate-600 normal-case font-normal">({t.common.optional})</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="70"
                    value={step2.current_weight}
                    onChange={(e) => setStep2((s) => ({ ...s, current_weight: e.target.value }))}
                    className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  />
                  <div className="flex rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    {(['kg', 'lbs'] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setStep2((s) => ({ ...s, weight_unit: u }))}
                        className={cn(
                          'px-4 py-3 text-sm font-semibold transition-colors',
                          step2.weight_unit === u ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white',
                        )}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Target weight */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t.onboarding.fields.targetWeight}{' '}
                  <span className="text-slate-600 normal-case font-normal">({t.common.optional})</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="65"
                    value={step2.target_weight}
                    onChange={(e) => setStep2((s) => ({ ...s, target_weight: e.target.value }))}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">{step2.weight_unit}</span>
                </div>
                {step2.current_weight && step2.target_weight && (
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {parseFloat(step2.target_weight) < parseFloat(step2.current_weight)
                      ? `Mục tiêu giảm ${(parseFloat(step2.current_weight) - parseFloat(step2.target_weight)).toFixed(1)} ${step2.weight_unit}`
                      : `Mục tiêu tăng ${(parseFloat(step2.target_weight) - parseFloat(step2.current_weight)).toFixed(1)} ${step2.weight_unit}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3 — Review ────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-3">
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              <div className="rounded-2xl bg-white/4 border border-white/8 divide-y divide-white/5 overflow-hidden">
                {step1.gender && (
                  <div className="flex justify-between items-center px-4 py-3.5">
                    <span className="text-sm text-slate-400">{t.onboarding.fields.gender}</span>
                    <span className="text-sm font-semibold text-white">{t.onboarding.genderOptions[step1.gender as Gender]}</span>
                  </div>
                )}
                {step1.birthdate && (
                  <div className="flex justify-between items-center px-4 py-3.5">
                    <span className="text-sm text-slate-400">{t.onboarding.fields.birthdate}</span>
                    <span className="text-sm font-semibold text-white">{step1.birthdate}</span>
                  </div>
                )}
                {step1.height_cm && (
                  <div className="flex justify-between items-center px-4 py-3.5">
                    <span className="text-sm text-slate-400">{t.onboarding.fields.height}</span>
                    <span className="text-sm font-semibold text-white">{step1.height_cm} cm</span>
                  </div>
                )}
                {step2.current_weight && (
                  <div className="flex justify-between items-center px-4 py-3.5">
                    <span className="text-sm text-slate-400">{t.onboarding.fields.currentWeight}</span>
                    <span className="text-sm font-semibold text-white">{step2.current_weight} {step2.weight_unit}</span>
                  </div>
                )}
                {step2.goal_type && (
                  <div className="flex justify-between items-center px-4 py-3.5">
                    <span className="text-sm text-slate-400">{t.onboarding.fields.goalType}</span>
                    <span className="text-sm font-semibold text-white">{GOAL_OPTIONS.find((o) => o.value === step2.goal_type)?.label}</span>
                  </div>
                )}
                {step2.target_weight && (
                  <div className="flex justify-between items-center px-4 py-3.5">
                    <span className="text-sm text-slate-400">{t.onboarding.fields.targetWeight}</span>
                    <span className="text-sm font-semibold text-white">{step2.target_weight} {step2.weight_unit}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-1">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/8 transition-all"
              >
                {t.common.back}
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]"
              >
                {t.common.continue}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? t.common.saving : t.onboarding.getStarted}
              </button>
            )}
          </div>

          {step < TOTAL_STEPS && (
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
            >
              {t.onboarding.skipForNow}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
