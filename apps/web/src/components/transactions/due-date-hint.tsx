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

function dueShort(days: number) {
  if (days < 0) return `-${Math.abs(days)}d`;
  if (days === 0) return 'hoy';
  return `${days}d`;
}

export function DueDateHint({
  transaction,
  compact = false,
}: Readonly<{ transaction: Transaction; compact?: boolean }>) {
  if (!transaction.dueDate || transaction.status === 'PAID' || transaction.status === 'CANCELLED') return null;

  const days = daysUntilDue(transaction.dueDate);
  const vencido = days < 0;
  if (!vencido && days > WARN_WINDOW_DAYS) return null;

  return (
    <span
      title={`${dueLabel(days)} · Fecha límite: ${formatDate(transaction.dueDate)}`}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-[10px]',
        vencido || days === 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning',
      )}
    >
      <AlertTriangle className="size-3" aria-hidden />
      {compact ? dueShort(days) : dueLabel(days)}
    </span>
  );
}
