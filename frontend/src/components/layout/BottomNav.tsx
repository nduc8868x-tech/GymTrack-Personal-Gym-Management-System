'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Dumbbell, UtensilsCrossed, TrendingUp, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useT();

  const NAV_ITEMS = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/workouts', label: t.nav.workouts, icon: Dumbbell },
    { href: '/nutrition', label: t.nav.nutrition, icon: UtensilsCrossed },
    { href: '/progress', label: t.nav.progress, icon: TrendingUp },
    { href: '/ai-coach', label: t.nav.aiCoach, icon: Bot },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#1a1b2e] border-t border-white/5">
      <div className="flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors',
                active ? 'text-blue-400' : 'text-slate-600',
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2]')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
