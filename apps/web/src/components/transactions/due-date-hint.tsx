'use client';

import { AlertTriangle } from 'lucide-react';
import type { Transaction } from '@/lib/api.types';
import { cn, daysUntilDue, formatDate } from '@/lib/utils';

const WARN_WINDOW_DAYS = 7;

function dueLabel(days: number) {
  if (days < 0) return days === -1 ? 'Venció ayer' : `Venció hace ${Math.abs(days)} días`;
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  return `Vence en ${days} días`;
}

export function DueDateHint({ transaction }: Readonly<{ transaction: Transaction }>) {
  if (!transaction.dueDate || transaction.status === 'PAID' || transaction.status === 'CANCELLED') return null;

  const days = daysUntilDue(transaction.dueDate);
  const vencido = days < 0;
  if (!vencido && days > WARN_WINDOW_DAYS) return null;

  return (
    <span
      title={`Fecha límite: ${formatDate(transaction.dueDate)}`}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
        vencido || days === 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning',
      )}
    >
      <AlertTriangle className="size-3" aria-hidden />
      {dueLabel(days)}
    </span>
  );
}
