'use client';
import { formatMoney } from '@korapay/domain';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Debt {
  id: string;
  direction: string;
  concept: string;
  originalAmount: string;
  status: string;
  balance: string;
  totalPaid: string;
}
export default function DeudasPage() {
  const { data: debts, isLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: () => apiFetch<Debt[]>('/debts?workspaceId=personal'),
  });
  return (
    <div className="space-y-6">
      {' '}
      <div className="flex items-center justify-between">
        {' '}
        <div>
          {' '}
          <h1 className="font-display text-2xl font-bold">Deudas</h1>{' '}
          <p className="text-sm text-muted-foreground">Gestiona lo que debes y te deben</p>{' '}
        </div>{' '}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {' '}
          <Plus className="h-4 w-4" /> Nueva Deuda{' '}
        </button>{' '}
      </div>{' '}
      {isLoading ? (
        <div className="space-y-3">
          {' '}
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}{' '}
        </div>
      ) : debts?.length ? (
        <div className="space-y-3">
          {' '}
          {debts.map((debt) => (
            <div key={debt.id} className="rounded-xl border bg-card p-5">
              {' '}
              <div className="flex items-start justify-between">
                {' '}
                <div>
                  {' '}
                  <div className="flex items-center gap-2">
                    {' '}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${debt.direction === 'DEBO' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}
                    >
                      {' '}
                      {debt.direction === 'DEBO' ? 'Debo' : 'Me deben'}{' '}
                    </span>{' '}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${debt.status === 'PAID' ? 'bg-success/10 text-success' : debt.status === 'PARTIAL' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}
                    >
                      {' '}
                      {debt.status === 'PAID' ? 'Pagado' : debt.status === 'PARTIAL' ? 'Parcial' : 'Pendiente'}{' '}
                    </span>{' '}
                  </div>{' '}
                  <h3 className="mt-2 font-medium">{debt.concept}</h3>{' '}
                </div>{' '}
                <div className="text-right">
                  {' '}
                  <p className="font-display text-xl font-bold">{formatMoney(debt.originalAmount, 'PEN')}</p>{' '}
                  <p className="text-xs text-muted-foreground mt-1">
                    {' '}
                    Saldo: {formatMoney(debt.balance, 'PEN')} | Pagado: {formatMoney(debt.totalPaid, 'PEN')}{' '}
                  </p>{' '}
                </div>{' '}
              </div>{' '}
            </div>
          ))}{' '}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16">
          {' '}
          <p className="text-sm text-muted-foreground">No tienes deudas registradas</p>{' '}
        </div>
      )}{' '}
    </div>
  );
}
