'use client';
import { formatMoney } from '@korapay/domain';
import { useQuery } from '@tanstack/react-query';
import { PiggyBank, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface SavingGoal {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  progress: string;
  status: string;
  currency: string;
}
export default function AhorrosPage() {
  const { data: goals, isLoading } = useQuery({
    queryKey: ['saving-goals'],
    queryFn: () => apiFetch<SavingGoal[]>('/saving-goals?workspaceId=personal'),
  });
  return (
    <div className="space-y-6">
      {' '}
      <div className="flex items-center justify-between">
        {' '}
        <div>
          {' '}
          <h1 className="font-display text-2xl font-bold">Ahorros</h1>{' '}
          <p className="text-sm text-muted-foreground">Metas de ahorro y progreso</p>{' '}
        </div>{' '}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {' '}
          <Plus className="h-4 w-4" /> Nueva Meta{' '}
        </button>{' '}
      </div>{' '}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {' '}
          {[1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
          ))}{' '}
        </div>
      ) : goals?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {' '}
          {goals.map((goal) => (
            <div key={goal.id} className="rounded-xl border bg-card p-5">
              {' '}
              <div className="flex items-center gap-3">
                {' '}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10">
                  {' '}
                  <PiggyBank className="h-5 w-5 text-teal" />{' '}
                </div>{' '}
                <div>
                  {' '}
                  <h3 className="font-medium">{goal.name}</h3>{' '}
                  <p className="text-xs text-muted-foreground">{goal.progress}% completado</p>{' '}
                </div>{' '}
              </div>{' '}
              <div className="mt-4">
                {' '}
                <div className="flex justify-between text-sm">
                  {' '}
                  <span>{formatMoney(goal.currentAmount, goal.currency as 'PEN' | 'USD')}</span>{' '}
                  <span className="text-muted-foreground">
                    {formatMoney(goal.targetAmount, goal.currency as 'PEN' | 'USD')}
                  </span>{' '}
                </div>{' '}
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  {' '}
                  <div
                    className="h-full rounded-full bg-teal transition-all"
                    style={{
                      width: `${Math.min(Number(goal.progress), 100)}%`,
                    }}
                  />{' '}
                </div>{' '}
              </div>{' '}
            </div>
          ))}{' '}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16">
          {' '}
          <PiggyBank className="h-12 w-12 text-muted-foreground/50" />{' '}
          <p className="mt-4 text-sm text-muted-foreground">No tienes metas de ahorro</p>{' '}
        </div>
      )}{' '}
    </div>
  );
}
