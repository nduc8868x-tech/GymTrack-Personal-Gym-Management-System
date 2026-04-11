'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { t } = useT();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t.auth.resetPassword.invalidLink}</h1>
        <p className="text-muted-foreground text-sm">{t.auth.resetPassword.invalidLinkDesc}</p>
        <Link href="/forgot-password" className="text-primary hover:underline text-sm">
          {t.auth.resetPassword.requestNewLink}
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t.auth.resetPassword.successTitle}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{t.auth.resetPassword.successDesc}</p>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t.auth.login.submit}
        </button>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setServerError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: data.password });
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setServerError(e.response?.data?.error?.message || t.auth.resetPassword.errors.expired);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t.auth.resetPassword.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.auth.resetPassword.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">{t.auth.resetPassword.newPassword}</label>
          <input
            {...register('password')}
            type="password"
            placeholder={t.auth.register.passwordPlaceholder}
            className={cn(
              'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring',
              errors.password && 'border-destructive',
            )}
          />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t.auth.resetPassword.confirmNewPassword}</label>
          <input
            {...register('confirmPassword')}
            type="password"
            placeholder="••••••••"
            className={cn(
              'w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring',
              errors.confirmPassword && 'border-destructive',
            )}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? t.auth.resetPassword.updating : t.auth.resetPassword.submit}
        </button>
      </form>
    </div>
  );
}
