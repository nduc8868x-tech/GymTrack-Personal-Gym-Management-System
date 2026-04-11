'use client';

import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Dumbbell, Zap, Copy, CheckCircle, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useT } from '@/lib/i18n';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  split_type: string;
  duration_weeks: number | null;
  is_active: boolean;
  created_at: string;
  _count: { plan_days: number };
}

export default function PlansPage() {
  const qc = useQueryClient();
  const { t } = useT();

  const SPLIT_LABELS: Record<string, string> = {
    full_body: t.plans.splitLabels.full_body,
    upper_lower: t.plans.splitLabels.upper_lower,
    ppl: t.plans.splitLabels.ppl,
    custom: t.plans.splitLabels.custom,
  };
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [splitType, setSplitType] = useState<'full_body' | 'upper_lower' | 'ppl' | 'custom'>('full_body');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: queryKeys.plans.all(),
    queryFn: () => api.get<{ data: Plan[] }>('/plans').then((r) => r.data.data),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/plans/${id}/activate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.plans.all() }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/plans/${id}/duplicate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.plans.all() }),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post('/plans', { name: name.trim(), split_type: splitType, description: description || undefined });
      qc.invalidateQueries({ queryKey: queryKeys.plans.all() });
      setName('');
      setDescription('');
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.plans.title}</h1>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t.plans.newPlan}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-sm">{t.plans.createPlan}</h2>
          <input
            type="text"
            placeholder={t.plans.planName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={splitType}
            onChange={(e) => setSplitType(e.target.value as typeof splitType)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {Object.entries(SPLIT_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder={t.plans.descriptionOptional}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {creating ? t.plans.creating : t.common.create}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg border border-border animate-pulse bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && plans?.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">{t.plans.noPLans}</p>
          <p className="text-xs text-muted-foreground mt-1">{t.plans.noPlansDesc}</p>
        </div>
      )}

      {plans && plans.length > 0 && (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{plan.name}</span>
                    {plan.is_active && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {t.plans.active}
                      </span>
                    )}
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5 rounded">
                      {SPLIT_LABELS[plan.split_type] ?? plan.split_type}
                    </span>
                  </div>
                  {plan.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{plan.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plan._count.plan_days} {plan._count.plan_days !== 1 ? t.plans.daysPlural : t.plans.days}
                    {plan.duration_weeks ? ` · ${plan.duration_weeks}w` : ''}
                  </p>
                </div>
                <Link href={`/plans/${plan.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
              <div className="flex border-t border-border divide-x divide-border">
                <button
                  onClick={() => activateMutation.mutate(plan.id)}
                  disabled={plan.is_active || activateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Zap className="h-3.5 w-3.5" />
                  {plan.is_active ? t.plans.active : t.plans.activate}
                </button>
                <button
                  onClick={() => duplicateMutation.mutate(plan.id)}
                  disabled={duplicateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium hover:bg-accent disabled:opacity-40 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {t.plans.duplicate}
                </button>
                <Link
                  href={`/plans/${plan.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium hover:bg-accent transition-colors"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  {t.common.edit}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
