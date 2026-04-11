'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  Calendar,
  Bot,
  Settings,
  LogOut,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { t } = useT();

  const NAV_ITEMS = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/workouts', label: t.nav.workouts, icon: Dumbbell },
    { href: '/nutrition', label: t.nav.nutrition, icon: UtensilsCrossed },
    { href: '/progress', label: t.nav.progress, icon: TrendingUp },
    { href: '/schedule', label: t.nav.schedule, icon: Calendar },
    { href: '/ai-coach', label: t.nav.aiCoach, icon: Bot },
  ];

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      logout();
      router.push('/login');
    }
  };

  const initials = user?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <aside className="hidden md:flex flex-col w-48 min-h-screen bg-[#0d0d14] border-r border-white/5">
      {/* Logo / Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-white font-bold text-sm tracking-tight">GymTrack</span>
        </div>
        {user && (
          <p className="text-[10px] font-semibold tracking-widest text-blue-500/80 uppercase pl-8 mt-0.5">
            Cấp độ Elite
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-150',
                active
                  ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 pl-[10px]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border-l-2 border-transparent pl-[10px]',
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-blue-400' : 'text-slate-500')} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Start Workout CTA */}
      <div className="px-4 py-3">
        <Link
          href="/workouts/session"
          className={cn(
            'flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-xs font-bold text-white',
            'bg-blue-600 hover:bg-blue-500 transition-colors duration-150',
            'shadow-lg shadow-blue-600/20',
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          {t.workouts.startWorkout}
        </Link>
      </div>

      {/* User profile */}
      <div className="border-t border-white/5 px-3 py-3 space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
            pathname === '/settings'
              ? 'text-blue-400 bg-blue-600/10'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/5',
          )}
        >
          <Settings className="h-3.5 w-3.5 shrink-0" />
          {t.nav.settings}
        </Link>

        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-xl bg-white/3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-7 w-7 rounded-full object-cover ring-2 ring-blue-500/30 shrink-0"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Thành Viên</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
              title={t.common.signOut}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
