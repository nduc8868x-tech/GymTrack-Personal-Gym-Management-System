'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { usePageTitle } from '@/hooks/usePageTitle';

const schema = z.object({
  email: z.string().email(),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { t } = useT();
  usePageTitle('Quên mật khẩu');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight mb-3">
          {t.auth.forgotPassword.successTitle}
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          {t.auth.forgotPassword.successMessage}
        </p>

        <Link
          href="/login"
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold',
            'bg-white/5 border border-white/10 text-slate-300',
            'hover:bg-white/10 hover:text-white hover:border-white/20',
            'transition-all duration-200',
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t.auth.forgotPassword.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-8"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {t.auth.forgotPassword.backToLogin}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mb-5">
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
          {t.auth.forgotPassword.title}
        </h1>
        <p className="text-slate-400 text-sm">{t.auth.forgotPassword.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {t.auth.forgotPassword.email}
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
              <span>⚠</span> {t.auth.login.errors.invalidEmail}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all duration-200',
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
              {t.auth.forgotPassword.submitting}
            </span>
          ) : (
            t.auth.forgotPassword.submit
          )}
        </button>
      </form>
    </div>
  );
}
