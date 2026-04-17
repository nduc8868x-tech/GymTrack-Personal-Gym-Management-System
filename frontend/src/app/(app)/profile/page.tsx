'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { usePageTitle } from '@/hooks/usePageTitle';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MeResponse {
  id: string;
  email: string;
  provider: string;
  profile: {
    name: string;
    avatar_url?: string | null;
    gender?: string | null;
    birthdate?: string | null;
    height_cm?: number | null;
  } | null;
  user_settings: {
    weight_unit: string;
    notifications_enabled: boolean;
    timezone: string;
  } | null;
  user_goals: {
    goal_type: string;
    target_weight?: number | null;
    target_date?: string | null;
  }[];
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1).max(100),
  gender: z.enum(['male', 'female', 'other', '']),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')),
  height_cm: z.coerce.number().positive().max(300).or(z.literal('')),
});

const goalSchema = z.object({
  goal_type: z.enum(['muscle_gain', 'fat_loss', 'strength', 'general_health']),
  target_weight: z.coerce.number().positive().or(z.literal('')),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')),
});

const settingsSchema = z.object({
  weight_unit: z.enum(['kg', 'lbs']),
  notifications_enabled: z.boolean(),
  timezone: z.string().min(1),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'mismatch',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type GoalForm = z.infer<typeof goalSchema>;
type SettingsForm = z.infer<typeof settingsSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/4 border border-white/8 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8">
        <h2 className="text-sm font-bold text-white">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
      {children}
    </label>
  );
}

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-600',
        'outline-none transition-all duration-200',
        'focus:bg-white/10 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20',
        'hover:border-white/20',
        className,
      )}
    />
  );
}

function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white',
        'outline-none transition-all duration-200 appearance-none',
        'focus:bg-white/10 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20',
        'hover:border-white/20',
        className,
      )}
    >
      {children}
    </select>
  );
}

function SaveButton({ loading, saved }: { loading: boolean; saved: boolean }) {
  const { t } = useT();
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        'mt-5 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200',
        saved
          ? 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-600/25'
          : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
      )}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {t.common.saving}
        </span>
      ) : saved ? (
        <span className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {t.profile.saved}
        </span>
      ) : (
        t.profile.saveChanges
      )}
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
      <span className="text-xs text-red-400">{message}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();
  const { t } = useT();
  usePageTitle(t.profile.title);

  const [meData, setMeData] = useState<MeResponse | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Section loading/saved/error states
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [goalLoading, setGoalLoading] = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);
  const [goalError, setGoalError] = useState('');

  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  const [pwLoading, setPwLoading] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');

  // Forms
  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const goalForm = useForm<GoalForm>({ resolver: zodResolver(goalSchema) });
  const settingsForm = useForm<SettingsForm>({ resolver: zodResolver(settingsSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  // Fetch /auth/me on mount
  useEffect(() => {
    api
      .get<{ data: MeResponse }>('/auth/me')
      .then((res) => {
        const data = res.data.data;
        setMeData(data);
        setIsGoogleUser(data.provider === 'google' && !data.profile);

        // Detect Google-only accounts (no password)
        // We'll use provider field for this
        if (data.provider === 'google') setIsGoogleUser(true);

        // Prefill profile form
        profileForm.reset({
          name: data.profile?.name ?? '',
          gender: (data.profile?.gender as ProfileForm['gender']) ?? '',
          birthdate: data.profile?.birthdate
            ? new Date(data.profile.birthdate).toISOString().slice(0, 10)
            : '',
          height_cm: data.profile?.height_cm ?? '',
        });

        // Prefill goal form
        const activeGoal = data.user_goals[0];
        goalForm.reset({
          goal_type: (activeGoal?.goal_type as GoalForm['goal_type']) ?? 'general_health',
          target_weight: activeGoal?.target_weight ?? '',
          target_date: activeGoal?.target_date
            ? new Date(activeGoal.target_date).toISOString().slice(0, 10)
            : '',
        });

        // Prefill settings form
        settingsForm.reset({
          weight_unit: (data.user_settings?.weight_unit as 'kg' | 'lbs') ?? 'kg',
          notifications_enabled: data.user_settings?.notifications_enabled ?? true,
          timezone: data.user_settings?.timezone ?? 'Asia/Ho_Chi_Minh',
        });
      })
      .catch(() => {
        router.replace('/login');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const onSaveProfile = async (data: ProfileForm) => {
    setProfileError('');
    setProfileLoading(true);
    try {
      await api.put('/auth/profile', {
        ...(data.name && { name: data.name }),
        ...(data.gender && { gender: data.gender }),
        ...(data.birthdate && { birthdate: data.birthdate }),
        ...(data.height_cm !== '' && { height_cm: Number(data.height_cm) }),
      });
      updateUser({ name: data.name });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {
      setProfileError(t.profile.errors.generic);
    } finally {
      setProfileLoading(false);
    }
  };

  const onSaveGoal = async (data: GoalForm) => {
    setGoalError('');
    setGoalLoading(true);
    try {
      await api.put('/auth/goals', {
        goal_type: data.goal_type,
        ...(data.target_weight !== '' && { target_weight: Number(data.target_weight) }),
        ...(data.target_date && { target_date: data.target_date }),
      });
      setGoalSaved(true);
      setTimeout(() => setGoalSaved(false), 2500);
    } catch {
      setGoalError(t.profile.errors.generic);
    } finally {
      setGoalLoading(false);
    }
  };

  const onSaveSettings = async (data: SettingsForm) => {
    setSettingsError('');
    setSettingsLoading(true);
    try {
      await api.put('/auth/settings', data);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch {
      setSettingsError(t.profile.errors.generic);
    } finally {
      setSettingsLoading(false);
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    setPwError('');
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset();
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { code?: string } } } };
      const code = e.response?.data?.error?.code;
      if (code === 'INVALID_CREDENTIALS') {
        setPwError(t.profile.errors.wrongPassword);
      } else {
        setPwError(t.profile.errors.generic);
      }
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      logout();
      router.push('/login');
    }
  };

  // ── Avatar helpers ────────────────────────────────────────────────────────────

  const avatarUrl = meData?.profile?.avatar_url;
  const initials = (meData?.profile?.name ?? user?.name ?? '?').charAt(0).toUpperCase();

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#1a1a2e] px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-xl mx-auto space-y-5">

        {/* Header */}
        <div className="rounded-2xl bg-white/4 border border-white/8 p-5 flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={meData?.profile?.name}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-blue-500/30 shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xl font-bold text-blue-400 shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">
              {meData?.profile?.name ?? user?.name ?? '—'}
            </p>
            <p className="text-sm text-slate-400 truncate">{meData?.email ?? user?.email}</p>
            {isGoogleUser && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/8 border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Google
              </span>
            )}
          </div>
        </div>

        {/* ── Personal info ── */}
        <SectionCard title={`📋  ${t.profile.personalInfo}`}>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
            {/* Name */}
            <div>
              <Label>{t.profile.name}</Label>
              <Input {...profileForm.register('name')} placeholder="Nguyễn Văn A" />
            </div>

            {/* Gender */}
            <div>
              <Label>{t.profile.gender}</Label>
              <Select {...profileForm.register('gender')}>
                <option value="">{t.common.optional}</option>
                <option value="male">{t.onboarding.genderOptions.male}</option>
                <option value="female">{t.onboarding.genderOptions.female}</option>
                <option value="other">{t.onboarding.genderOptions.other}</option>
              </Select>
            </div>

            {/* Birthdate */}
            <div>
              <Label>{t.profile.birthdate}</Label>
              <Input {...profileForm.register('birthdate')} type="date" />
            </div>

            {/* Height */}
            <div>
              <Label>{t.profile.height}</Label>
              <Input
                {...profileForm.register('height_cm')}
                type="number"
                placeholder="170"
                min={50}
                max={300}
              />
            </div>

            {profileError && <ErrorBanner message={profileError} />}
            <SaveButton loading={profileLoading} saved={profileSaved} />
          </form>
        </SectionCard>

        {/* ── Fitness goal ── */}
        <SectionCard title={`🎯  ${t.profile.fitnessGoal}`}>
          <form onSubmit={goalForm.handleSubmit(onSaveGoal)} className="space-y-4">
            {/* Goal type */}
            <div>
              <Label>{t.profile.goalType}</Label>
              <Select {...goalForm.register('goal_type')}>
                <option value="muscle_gain">{t.onboarding.goalOptions.muscle_gain}</option>
                <option value="fat_loss">{t.onboarding.goalOptions.fat_loss}</option>
                <option value="strength">{t.onboarding.goalOptions.strength}</option>
                <option value="general_health">{t.onboarding.goalOptions.general_health}</option>
              </Select>
            </div>

            {/* Target weight */}
            <div>
              <Label>{t.profile.targetWeight}</Label>
              <Input
                {...goalForm.register('target_weight')}
                type="number"
                placeholder="70"
                min={20}
                max={500}
                step={0.1}
              />
            </div>

            {/* Target date */}
            <div>
              <Label>{t.profile.targetDate}</Label>
              <Input {...goalForm.register('target_date')} type="date" />
            </div>

            {goalError && <ErrorBanner message={goalError} />}
            <SaveButton loading={goalLoading} saved={goalSaved} />
          </form>
        </SectionCard>

        {/* ── Settings ── */}
        <SectionCard title={`⚙️  ${t.profile.appSettings}`}>
          <form onSubmit={settingsForm.handleSubmit(onSaveSettings)} className="space-y-4">
            {/* Weight unit */}
            <div>
              <Label>{t.profile.weightUnit}</Label>
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                {(['kg', 'lbs'] as const).map((unit) => (
                  <label
                    key={unit}
                    className={cn(
                      'flex-1 text-center py-3 text-sm font-semibold cursor-pointer transition-colors duration-150',
                      settingsForm.watch('weight_unit') === unit
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10',
                    )}
                  >
                    <input
                      {...settingsForm.register('weight_unit')}
                      type="radio"
                      value={unit}
                      className="sr-only"
                    />
                    {unit.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-300">{t.profile.notifications}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  {...settingsForm.register('notifications_enabled')}
                  type="checkbox"
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-blue-600 transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>

            {/* Timezone */}
            <div>
              <Label>{t.profile.timezone}</Label>
              <Input
                {...settingsForm.register('timezone')}
                placeholder="Asia/Ho_Chi_Minh"
              />
            </div>

            {settingsError && <ErrorBanner message={settingsError} />}
            <SaveButton loading={settingsLoading} saved={settingsSaved} />
          </form>
        </SectionCard>

        {/* ── Security (hidden for Google users) ── */}
        {!isGoogleUser && (
          <SectionCard title={`🔒  ${t.profile.security}`}>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <div>
                <Label>{t.profile.currentPassword}</Label>
                <Input
                  {...passwordForm.register('currentPassword')}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label>{t.profile.newPassword}</Label>
                <Input
                  {...passwordForm.register('newPassword')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="mt-1.5 text-xs text-red-400">
                    ⚠ Tối thiểu 8 ký tự
                  </p>
                )}
              </div>
              <div>
                <Label>{t.profile.confirmPassword}</Label>
                <Input
                  {...passwordForm.register('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400">
                    ⚠ {t.profile.errors.passwordMismatch}
                  </p>
                )}
              </div>

              {pwError && <ErrorBanner message={pwError} />}

              <button
                type="submit"
                disabled={pwLoading}
                className={cn(
                  'mt-1 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-200',
                  pwSaved
                    ? 'bg-green-600 hover:bg-green-500 shadow-lg shadow-green-600/25'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25',
                  'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
                )}
              >
                {pwLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t.common.saving}
                  </span>
                ) : pwSaved ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {t.profile.saved}
                  </span>
                ) : (
                  t.profile.updatePassword
                )}
              </button>
            </form>
          </SectionCard>
        )}

        {isGoogleUser && (
          <SectionCard title={`🔒  ${t.profile.security}`}>
            <p className="text-sm text-slate-500">{t.profile.googleAccount}</p>
          </SectionCard>
        )}

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4',
            'text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:border-red-500/30',
            'transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2',
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t.common.signOut}
        </button>

      </div>
    </div>
  );
}
