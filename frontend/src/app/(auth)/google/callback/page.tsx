'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useT } from '@/lib/i18n';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const { t } = useT();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      router.replace('/login?error=oauth_failed');
      return;
    }

    localStorage.setItem('access_token', token);

    // Fetch current user to populate store
    api
      .get<{ data: { id: string; email: string; name: string; avatar_url?: string } }>('/auth/me')
      .then((res) => {
        const u = res.data.data;
        setUser({ id: u.id, email: u.email, name: u.name, avatar_url: u.avatar_url });
        // Redirect to onboarding if no height set, otherwise dashboard
        if (!('height_cm' in u) || (u as { height_cm?: number }).height_cm == null) {
          router.replace('/onboarding');
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        router.replace('/login?error=oauth_failed');
      });
  }, [router, searchParams, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{t.auth.signingIn}</p>
      </div>
    </div>
  );
}
