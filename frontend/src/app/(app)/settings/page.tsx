'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useT } from '@/lib/i18n';
import { usePageTitle } from '@/hooks/usePageTitle';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Gender = 'male' | 'female' | 'other';
type GoalType = 'muscle_gain' | 'fat_loss' | 'strength' | 'general_health';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  gender: Gender | null;
  birthdate: string | null;
  height_cm: number | null;
  avatar_url: string | null;
  user_settings: { weight_unit: 'kg' | 'lbs'; notifications_enabled: boolean } | null;
  user_goals: { goal_type: GoalType; target_weight: number | null }[];
}

interface Measurement {
  weight_kg: number | null;
  measured_at: string;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">{title}</h2>
      <div className="rounded-2xl bg-white/4 border border-white/8 overflow-hidden divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 gap-4">
      <span className="text-sm text-slate-400 shrink-0">{label}</span>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { t } = useT();
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  usePageTitle('Hồ sơ & Cài đặt');

  // Profile form state
  const [name, setName] = useState(user?.name ?? '');
  const [gender, setGender] = useState<Gender | ''>('');
  const [birthdate, setBirthdate] = useState('');
  const [height, setHeight] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Settings state
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Password reset state
  const [linkSent, setLinkSent] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);

  // Load full profile
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: () => api.get<{ data: UserProfile }>('/auth/me').then((r) => r.data.data),
  });

  // Load latest measurement for current weight
  const { data: measurementsData } = useQuery({
    queryKey: ['measurements-latest'],
    queryFn: () =>
      api
        .get<{ data: Measurement[] }>('/progress/measurements', { params: { limit: 1 } })
        .then((r) => r.data.data),
  });

  const latestWeight = measurementsData?.[0]?.weight_kg ?? null;
  const activeGoal = profile?.user_goals?.[0] ?? null;

  // Populate form when profile loads
  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setGender((profile.gender as Gender) ?? '');
    setBirthdate(
      profile.birthdate ? new Date(profile.birthdate).toISOString().split('T')[0] : '',
    );
    setHeight(profile.height_cm != null ? String(profile.height_cm) : '');
    setWeightUnit(profile.user_settings?.weight_unit ?? 'kg');
    setNotifEnabled(profile.user_settings?.notifications_enabled ?? false);
  }, [profile]);

  const profileMutation = useMutation({
    mutationFn: () =>
      api.put('/auth/profile', {
        ...(name && { name }),
        ...(gender && { gender }),
        ...(birthdate && { birthdate }),
        ...(height && { height_cm: parseFloat(height) }),
      }),
    onSuccess: (res) => {
      const updated = (res as { data: { data: { name: string; avatar_url?: string; id: string; email: string } } }).data?.data;
      if (updated) setUser({ ...user!, name: updated.name });
      qc.invalidateQueries({ queryKey: ['me'] });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    },
  });

  const settingsMutation = useMutation({
    mutationFn: () =>
      api.put('/auth/settings', { weight_unit: weightUnit, notifications_enabled: notifEnabled }),
    onSuccess: () => {
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    },
  });

  const handleSendResetLink = async () => {
    if (!profile?.email) return;
    setSendingLink(true);
    try {
      await api.post('/auth/forgot-password', { email: profile.email });
      setLinkSent(true);
    } finally {
      setSendingLink(false);
    }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } finally {
      logout();
      router.push('/login');
    }
  };

  const GENDER_LABELS: Record<Gender, string> = {
    male: t.onboarding.genderOptions.male,
    female: t.onboarding.genderOptions.female,
    other: t.onboarding.genderOptions.other,
  };

  const GOAL_LABELS: Record<GoalType, string> = {
    muscle_gain: t.onboarding.goalOptions.muscle_gain,
    fat_loss: t.onboarding.goalOptions.fat_loss,
    strength: t.onboarding.goalOptions.strength,
    general_health: t.onboarding.goalOptions.general_health,
  };

  return (
    <div className="min-h-screen bg-[#1a1b2e] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{t.profile.title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{profile?.email}</p>
        </div>
        {/* Avatar */}
        <div>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/30" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-lg font-black text-blue-400">
              {profile?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-6 max-w-2xl space-y-7">

        {/* ── Thông tin cá nhân ──────────────────────────────── */}
        <Section title={t.profile.sections.profile}>
          {/* Name */}
          <div className="px-4 py-3.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t.profile.fields.name}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>

          {/* Gender */}
          <div className="px-4 py-3.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              {t.profile.fields.gender}
            </label>
            <div className="flex gap-2">
              {(['male', 'female', 'other'] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={cn(
                    'flex-1 rounded-xl border py-2 text-xs font-semibold transition-all',
                    gender === g
                      ? 'border-blue-500/50 bg-blue-600/15 text-blue-400'
                      : 'border-white/10 bg-white/4 text-slate-400 hover:border-white/20 hover:text-white',
                  )}
                >
                  {GENDER_LABELS[g]}
                </button>
              ))}
            </div>
          </div>

          {/* Birthdate + Height */}
          <div className="grid grid-cols-2 gap-0 divide-x divide-white/5">
            <div className="px-4 py-3.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t.profile.fields.birthdate}
              </label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/40 transition-all [color-scheme:dark]"
              />
            </div>
            <div className="px-4 py-3.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t.profile.fields.height}
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 pr-10 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500">cm</span>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="px-4 py-3">
            <button
              onClick={() => profileMutation.mutate()}
              disabled={profileMutation.isPending}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                profileSaved
                  ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20',
                'disabled:opacity-50',
              )}
            >
              {profileSaved ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {t.profile.savedSuccess}
                </>
              ) : profileMutation.isPending ? t.common.saving : t.common.save}
            </button>
          </div>
        </Section>

        {/* ── Thông số cơ thể ────────────────────────────────── */}
        <Section title={t.profile.sections.bodyStats}>
          <Row label={t.profile.fields.currentWeight}>
            {latestWeight != null ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{latestWeight} kg</span>
                <Link href="/progress/measurements" className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
                  Cập nhật →
                </Link>
              </div>
            ) : (
              <Link href="/progress/measurements" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                {t.profile.noCurrentWeight}
              </Link>
            )}
          </Row>
          <Row label={t.profile.fields.targetWeight}>
            {activeGoal?.target_weight != null ? (
              <span className="text-sm font-bold text-white">{activeGoal.target_weight} kg</span>
            ) : (
              <span className="text-xs text-slate-600">{t.profile.noGoal}</span>
            )}
          </Row>
          <Row label={t.profile.fields.goalType}>
            {activeGoal ? (
              <span className="text-sm font-semibold text-blue-400">
                {GOAL_LABELS[activeGoal.goal_type]}
              </span>
            ) : (
              <span className="text-xs text-slate-600">{t.profile.noGoal}</span>
            )}
          </Row>
          {latestWeight != null && activeGoal?.target_weight != null && (
            <div className="px-4 py-3 bg-white/2">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>Tiến trình</span>
                <span className="font-semibold">
                  {Math.abs(latestWeight - activeGoal.target_weight).toFixed(1)} kg còn lại
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-700"
                  style={{
                    width: `${Math.max(5, Math.min(100, 100 - Math.abs(latestWeight - activeGoal.target_weight) / Math.abs(latestWeight) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </Section>

        {/* ── Cài đặt ────────────────────────────────────────── */}
        <Section title={t.profile.sections.settings}>
          {/* Weight unit */}
          <div className="px-4 py-3.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              {t.profile.fields.weightUnit}
            </label>
            <div className="flex gap-2">
              {(['kg', 'lbs'] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setWeightUnit(u)}
                  className={cn(
                    'flex-1 rounded-xl border py-2.5 text-sm font-bold transition-all',
                    weightUnit === u
                      ? 'border-blue-500/50 bg-blue-600/15 text-blue-400'
                      : 'border-white/10 bg-white/4 text-slate-400 hover:text-white',
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <Row label={t.profile.fields.notifications}>
            <button
              onClick={() => setNotifEnabled((v) => !v)}
              className={cn(
                'w-11 h-6 rounded-full transition-all duration-200 relative',
                notifEnabled ? 'bg-blue-600' : 'bg-white/15',
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200',
                notifEnabled && 'translate-x-5',
              )} />
            </button>
          </Row>

          {/* Save settings */}
          <div className="px-4 py-3">
            <button
              onClick={() => settingsMutation.mutate()}
              disabled={settingsMutation.isPending}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                settingsSaved
                  ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/8',
                'disabled:opacity-50',
              )}
            >
              {settingsSaved ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {t.profile.savedSuccess}
                </>
              ) : settingsMutation.isPending ? t.common.saving : t.common.save}
            </button>
          </div>
        </Section>

        {/* ── Mật khẩu ──────────────────────────────────────── */}
        <Section title={t.profile.changePassword}>
          <div className="px-4 py-4 space-y-3">
            <p className="text-xs text-slate-500">{t.profile.changePasswordDesc}</p>
            {linkSent ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {t.profile.linkSent}
              </div>
            ) : (
              <button
                onClick={handleSendResetLink}
                disabled={sendingLink}
                className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/8 disabled:opacity-50 transition-all"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {sendingLink ? t.common.loading : t.profile.sendResetLink}
              </button>
            )}
          </div>
        </Section>

        {/* ── Tài khoản ─────────────────────────────────────── */}
        <Section title={t.profile.sections.account}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t.common.signOut}
          </button>
        </Section>

        <div className="pb-20 md:pb-6" />
      </div>
    </div>
  );
}
