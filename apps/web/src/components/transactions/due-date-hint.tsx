'use client';

import { AlertTriangle } from 'lucide-react';
import type { Transaction } from '@/lib/api.types';
import { cn, formatDate } from '@/lib/utils';

const DAY_MS = 86_400_000;
const WARN_WINDOW_DAYS = 7;

function daysUntilDue(dueDate: string) {
  const today = new Date();
  const startOfToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const due = new Date(dueDate);
  const startOfDue = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  return Math.round((startOfDue - startOfToday) / DAY_MS);
}

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
