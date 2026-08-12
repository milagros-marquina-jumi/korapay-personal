'use client';

import { formatMoney } from '@korapay/domain';
import { ArrowDownLeft, ArrowUpRight, FileClock, Landmark, RefreshCw, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useWorkspace } from '@/components/providers/workspace-provider';
import type { CalendarEvent, CalendarSource, CalendarStatus } from '@/lib/api.types';
import { cn } from '@/lib/utils';

const SOURCE_ICON: Record<CalendarSource, typeof Wallet> = {
  TRANSACTION: Wallet,
  TALENT_LEDGER: ArrowDownLeft,
  TAX: Landmark,
  CONTRACT: FileClock,
  SUBSCRIPTION: RefreshCw,
};

export const SOURCE_LABEL: Record<CalendarSource, string> = {
  TRANSACTION: 'Movimiento',
  TALENT_LEDGER: 'Deuda de talento',
  TAX: 'Renta',
  CONTRACT: 'Contrato',
  SUBSCRIPTION: 'Suscripción',
};

const STATUS_STYLE: Record<CalendarStatus, string> = {
  OVERDUE: 'bg-destructive/12 text-destructive',
  REVIEW: 'bg-info/12 text-info',
  PENDING: 'bg-warning/15 text-warning-foreground',
};

const STATUS_LABEL: Record<CalendarStatus, string> = {
  OVERDUE: 'Vencido',
  REVIEW: 'Por revisar',
  PENDING: 'Pendiente',
};

export function dotColor(event: CalendarEvent): string {
  if (event.status === 'OVERDUE') return 'bg-destructive';
  if (event.kind === 'COLLECTION') return 'bg-success';
  if (event.kind === 'CONTRACT_END') return 'bg-info';
  return 'bg-brand';
}

export function relativeLabel(daysUntil: number): string {
  if (daysUntil === 0) return 'hoy';
  if (daysUntil === 1) return 'mañana';
  if (daysUntil === -1) return 'ayer';
  if (daysUntil > 0) return `en ${daysUntil} días`;
  const dias = Math.abs(daysUntil);
  if (dias < 60) return `hace ${dias} días`;
  const meses = Math.round(dias / 30);
  if (meses < 24) return `hace ${meses} meses`;
  return `hace ${Math.round(dias / 365)} años`;
}

export function EventRow({
  event,
  showWorkspace = true,
  onNavigate,
}: Readonly<{ event: CalendarEvent; showWorkspace?: boolean; onNavigate?: () => void }>) {
  const Icon = SOURCE_ICON[event.source];
  const cobro = event.kind === 'COLLECTION';
  const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspace();

  const handleClick = () => {
    if (event.workspaceId && event.workspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(event.workspaceId);
    }
    onNavigate?.();
  };

  return (
    <Link
      href={event.href}
      onClick={handleClick}
      className="flex items-start gap-3 rounded-lg border border-border/60 bg-card px-3 py-3 transition-colors hover:border-brand/40 hover:bg-accent/60"
    >
      <span
        className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg', STATUS_STYLE[event.status])}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-foreground">{event.title}</span>
          {event.amount && (
            <span
              className={cn('shrink-0 text-sm font-semibold tabular-nums', cobro ? 'text-success' : 'text-foreground')}
            >
              {cobro ? '+' : '−'}
              {formatMoney(event.amount, event.currency as 'PEN' | 'USD')}
            </span>
          )}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{SOURCE_LABEL[event.source]}</span>
          <span aria-hidden="true">·</span>
          <span className={event.status === 'OVERDUE' ? 'font-medium text-destructive' : undefined}>
            {STATUS_LABEL[event.status]} {relativeLabel(event.daysUntil)}
          </span>
          {showWorkspace && event.workspaceName && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{event.workspaceName}</span>
            </>
          )}
        </span>
      </span>
    </Link>
  );
}

export function SummaryCard({
  label,
  amount,
  count,
  tone,
  icon: Icon,
}: Readonly<{
  label: string;
  amount: string;
  count: number;
  tone: 'pay' | 'collect' | 'overdue';
  icon: typeof Wallet;
}>) {
  const tones = {
    pay: 'text-foreground',
    collect: 'text-success',
    overdue: 'text-destructive',
  } as const;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className={cn('mt-1.5 font-display text-xl font-bold tabular-nums', tones[tone])}>
        {formatMoney(amount, 'PEN')}
      </p>
      <p className="text-xs text-muted-foreground">
        {count} {count === 1 ? 'evento' : 'eventos'}
      </p>
    </div>
  );
}

export { ArrowDownLeft, ArrowUpRight, Wallet };
