'use client';

import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  if (transaction.status === 'PAID' || transaction.status === 'CANCELLED') return null;

  // Sin fecha limite el vencimiento se mide contra la fecha del movimiento.
  const limite = transaction.dueDate ?? transaction.date;
  if (!limite) return null;

  const days = daysUntilDue(limite);
  const vencido = days < 0;
  if (!vencido && days > WARN_WINDOW_DAYS) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex shrink-0 cursor-help items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-[10px]',
            vencido || days === 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning',
          )}
        >
          <AlertTriangle className="size-3" aria-hidden />
          {compact ? dueShort(days) : dueLabel(days)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <span className="block font-medium">{dueLabel(days)}</span>
        <span className="block text-muted-foreground">Fecha límite: {formatDate(limite)}</span>
        {!transaction.dueDate && (
          <span className="block text-muted-foreground">Sin límite propio: se usa la fecha del movimiento.</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
