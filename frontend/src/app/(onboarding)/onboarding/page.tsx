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
  goal_type: GoalType | '';
  target_weight: string;
  weight_unit: 'kg' | 'lbs';
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useT();

  const GOAL_OPTIONS: { value: GoalType; label: string; icon: string }[] = [
    { value: 'muscle_gain', label: t.onboarding.goalOptions.muscle_gain, icon: '💪' },
    { value: 'fat_loss', label: t.onboarding.goalOptions.fat_loss, icon: '🔥' },
    { value: 'strength', label: t.onboarding.goalOptions.strength, icon: '🏋️' },
    { value: 'general_health', label: t.onboarding.goalOptions.general_health, icon: '❤️' },
  ];
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [step1, setStep1] = useState<Step1>({ gender: '', birthdate: '', height_cm: '' });
  const [step2, setStep2] = useState<Step2>({ goal_type: '', target_weight: '', weight_unit: 'kg' });

  const handleFinish = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/onboarding', {
        ...(step1.gender && { gender: step1.gender }),
        ...(step1.birthdate && { birthdate: step1.birthdate }),
        ...(step1.height_cm && { height_cm: parseFloat(step1.height_cm) }),
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t.onboarding.stepOf.replace('{step}', String(step)).replace('{total}', '3')}
            </p>
            {step === 1 && (
              <>
                <h1 className="mt-2 text-2xl font-bold">{t.onboarding.aboutYou}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {t.onboarding.aboutYouSubtitle}
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <h1 className="mt-2 text-2xl font-bold">{t.onboarding.yourGoal}</h1>
                <p className="text-muted-foreground text-sm mt-1">{t.onboarding.yourGoalSubtitle}</p>
              </>
            )}
            {step === 3 && (
              <>
                <h1 className="mt-2 text-2xl font-bold">{t.onboarding.allSet.replace('{name}', user?.name?.split(' ')[0] ?? '')}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {t.onboarding.reviewSubtitle}
                </p>
              </>
            )}
          </div>

          {/* Step 1 — Personal info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t.onboarding.fields.gender}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['male', 'female', 'other'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setStep1((s) => ({ ...s, gender: g }))}
                      className={cn(
                        'rounded-md border px-3 py-2 text-sm capitalize transition-colors',
                        step1.gender === g
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-input hover:bg-accent',
                      )}
                    >
                      {t.onboarding.genderOptions[g]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.onboarding.fields.birthdate}</label>
                <input
                  type="date"
                  value={step1.birthdate}
                  onChange={(e) => setStep1((s) => ({ ...s, birthdate: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.onboarding.fields.height}</label>
                <input
                  type="number"
                  placeholder="175"
                  value={step1.height_cm}
                  onChange={(e) => setStep1((s) => ({ ...s, height_cm: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {/* Step 2 — Goal */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStep2((s) => ({ ...s, goal_type: opt.value }))}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors',
                      step2.goal_type === opt.value
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-input hover:bg-accent',
                    )}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t.onboarding.fields.targetWeight}{' '}
                  <span className="text-muted-foreground font-normal">({t.common.optional})</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="70"
                    value={step2.target_weight}
                    onChange={(e) => setStep2((s) => ({ ...s, target_weight: e.target.value }))}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex rounded-md border border-input overflow-hidden">
                    {(['kg', 'lbs'] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setStep2((s) => ({ ...s, weight_unit: u }))}
                        className={cn(
                          'px-3 py-2 text-sm transition-colors',
                          step2.weight_unit === u
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent',
                        )}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="space-y-3">
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="rounded-lg border border-border divide-y divide-border">
                {step1.gender && (
                  <div className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">{t.onboarding.fields.gender}</span>
                    <span className="font-medium">{t.onboarding.genderOptions[step1.gender as Gender]}</span>
                  </div>
                )}
                {step1.height_cm && (
                  <div className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">{t.onboarding.fields.height}</span>
                    <span className="font-medium">{step1.height_cm} cm</span>
                  </div>
                )}
                {step2.goal_type && (
                  <div className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">{t.onboarding.fields.goalType}</span>
                    <span className="font-medium">{GOAL_OPTIONS.find((o) => o.value === step2.goal_type)?.label ?? step2.goal_type}</span>
                  </div>
                )}
                {step2.target_weight && (
                  <div className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-muted-foreground">{t.onboarding.fields.targetWeight}</span>
                    <span className="font-medium">
                      {step2.target_weight} {step2.weight_unit}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                {t.common.back}
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t.common.continue}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? t.common.saving : t.onboarding.getStarted}
              </button>
            )}
          </div>

          {step < 3 && (
            <button
              type="button"
              onClick={() => (step === 3 ? handleFinish() : router.push('/dashboard'))}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.onboarding.skipForNow}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
