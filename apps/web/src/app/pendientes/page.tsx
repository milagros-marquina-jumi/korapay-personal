'use client';
import { formatMoney } from '@korapay/domain';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface PendingItem {
  id: string;
  kind: string;
  concept: string;
  amount: string;
  currency: string;
  dueDate: string;
  status: string;
}
export default function PendientesPage() {
  const { data: items, isLoading } = useQuery({
    queryKey: ['pending-items'],
    queryFn: () => apiFetch<PendingItem[]>('/pending-items?workspaceId=personal'),
  });
  const statusIcon = (status: string) => {
    if (status === 'PAID') return <CheckCircle className="h-4 w-4 text-success" />;
    if (status === 'OVERDUE') return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-warning" />;
  };
  return (
    <div className="space-y-6">
      {' '}
      <div>
        {' '}
        <h1 className="font-display text-2xl font-bold">Pendientes</h1>{' '}
        <p className="text-sm text-muted-foreground">Cobros y pagos pendientes</p>{' '}
      </div>{' '}
      {isLoading ? (
        <div className="space-y-3">
          {' '}
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}{' '}
        </div>
      ) : items?.length ? (
        <div className="space-y-2">
          {' '}
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border bg-card px-5 py-3">
              {' '}
              <div className="flex items-center gap-3">
                {' '}
                {statusIcon(item.status)}{' '}
                <div>
                  {' '}
                  <p className="text-sm font-medium">{item.concept}</p>{' '}
                  <p className="text-xs text-muted-foreground">
                    {' '}
                    {item.kind === 'COBRAR' ? 'Por cobrar' : 'Por pagar'} · Vence:{' '}
                    {new Date(item.dueDate).toLocaleDateString('es-PE')}{' '}
                  </p>{' '}
                </div>{' '}
              </div>{' '}
              <p className={`text-sm font-semibold ${item.kind === 'COBRAR' ? 'text-success' : 'text-destructive'}`}>
                {' '}
                {formatMoney(item.amount, item.currency as 'PEN' | 'USD')}{' '}
              </p>{' '}
            </div>
          ))}{' '}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16">
          {' '}
          <CheckCircle className="h-12 w-12 text-muted-foreground/50" />{' '}
          <p className="mt-4 text-sm text-muted-foreground">No tienes pendientes</p>{' '}
        </div>
      )}{' '}
    </div>
  );
}
