'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser, logout } = useAuthStore();
  const checked = useRef(false);

  // Verify session on every mount — let axios interceptor auto-refresh access token
  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    api
      .get<{ data: { id: string; email: string; name: string; avatar_url?: string } }>('/auth/me')
      .then((res) => {
        const u = res.data.data;
        setUser({ id: u.id, email: u.email, name: u.name, avatar_url: u.avatar_url });
      })
      .catch(() => {
        // /auth/me failed even after axios tried to refresh → session truly expired
        logout();
        router.replace('/login');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0 overflow-hidden">{children}</main>
      <BottomNav />
    </div>
  );
}
