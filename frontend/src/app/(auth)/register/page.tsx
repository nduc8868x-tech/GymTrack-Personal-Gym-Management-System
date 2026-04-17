'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function RegisterPage() {
  usePageTitle('Đăng ký');
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { t } = useT();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const schema = z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t.auth.register.errors.passwordMismatch,
      path: ['confirmPassword'],
    });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    setLoading(true);
    try {
      const res = await api.post<{
        data: { access_token: string; user: { id: string; email: string; name: string; avatar_url?: string } };
      }>('/auth/register', {
        email: data.email,
        password: data.password,
        name: data.name,
      });

      localStorage.setItem('access_token', res.data.data.access_token);
      setUser(res.data.data.user);
      router.push('/onboarding');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { code?: string; message?: string } } } };
      const code = e.response?.data?.error?.code;
      if (code === 'EMAIL_EXISTS') {
        setServerError(t.auth.register.errors.emailExists);
      } else {
        setServerError(t.auth.register.errors.generic);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
          {t.auth.register.title}
        </h1>
        <p className="text-slate-400 text-sm">{t.auth.register.subtitle}</p>
      </div>

      {/* Error banner */}
      {serverError && (
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm text-red-400">{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {t.auth.register.fullName}
          </label>
          <input
            {...register('name')}
            type="text"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            className={cn(
              'w-full rounded-xl bg-white/5 border px-4 py-3 text-sm text-white placeholder:text-slate-600',
              'outline-none transition-all duration-200',
              'focus:bg-white/10 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20',
              errors.name
                ? 'border-red-500/50 bg-red-500/5'
                : 'border-white/10 hover:border-white/20',
            )}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <span>⚠</span> {t.auth.register.errors.nameRequired}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {t.auth.register.email}
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={cn(
              'w-full rounded-xl bg-white/5 border px-4 py-3 text-sm text-white placeholder:text-slate-600',
              'outline-none transition-all duration-200',
              'focus:bg-white/10 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20',
              errors.email
                ? 'border-red-500/50 bg-red-500/5'
                : 'border-white/10 hover:border-white/20',
            )}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <span>⚠</span> {t.auth.register.errors.invalidEmail}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {t.auth.register.password}
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t.auth.register.passwordPlaceholder}
              autoComplete="new-password"
              className={cn(
                'w-full rounded-xl bg-white/5 border px-4 py-3 pr-11 text-sm text-white placeholder:text-slate-600',
                'outline-none transition-all duration-200',
                'focus:bg-white/10 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20',
                errors.password
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-white/10 hover:border-white/20',
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <span>⚠</span> {t.auth.register.errors.passwordMin}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {t.auth.register.confirmPassword}
          </label>
          <div className="relative">
            <input
              {...register('confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              className={cn(
                'w-full rounded-xl bg-white/5 border px-4 py-3 pr-11 text-sm text-white placeholder:text-slate-600',
                'outline-none transition-all duration-200',
                'focus:bg-white/10 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20',
                errors.confirmPassword
                  ? 'border-red-500/50 bg-red-500/5'
                  : 'border-white/10 hover:border-white/20',
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <span>⚠</span> {t.auth.register.errors.passwordMismatch}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all duration-200 mt-2',
            'bg-blue-600 hover:bg-blue-500 active:scale-[0.98]',
            'shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          )}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t.auth.register.submitting}
            </span>
          ) : (
            t.auth.register.submit
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#1a1b2e] px-3 text-xs text-slate-600 uppercase tracking-widest">
            {t.common.or}
          </span>
        </div>
      </div>

      {/* Google */}
      <button
        onClick={handleGoogleLogin}
        className={cn(
          'w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5',
          'px-4 py-3 text-sm font-medium text-slate-300',
          'hover:bg-white/10 hover:border-white/20 hover:text-white',
          'transition-all duration-200 active:scale-[0.98]',
        )}
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        {t.auth.register.googleButton}
      </button>

      {/* Sign in link */}
      <p className="mt-6 text-center text-sm text-slate-500">
        {t.auth.register.hasAccount}{' '}
        <Link href="/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
          {t.auth.register.signIn}
        </Link>
      </p>
    </div>
  );
}
