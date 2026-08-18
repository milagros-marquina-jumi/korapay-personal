'use client';

import { formatMoney } from '@korapay/domain';
import { StatusBadge } from '@korapay/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { TalentLedgerEntry } from '@/lib/api.types';
import { cn, formatDateLong } from '@/lib/utils';
import { debtOwnerLabel } from './debt-owner-badge';

const TYPE_LABELS: Record<string, string> = { EGRESO: 'Egreso', DEUDA: 'Deuda' };

interface Props {
  entry: TalentLedgerEntry | null;
  currency: 'PEN' | 'USD';
  viewer?: 'ADMIN' | 'TALENT';
  talentName?: string;
  adminName?: string;
  onOpenChange: (open: boolean) => void;
}

export function TalentLedgerDetailDialog({
  entry,
  currency,
  viewer = 'ADMIN',
  talentName,
  adminName,
  onOpenChange,
}: Readonly<Props>) {
  const esDeuda = entry?.type === 'DEUDA';

  return (
    <Dialog open={entry !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {entry && (
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle className="pr-6 text-lg leading-tight">
                {entry.description || TYPE_LABELS[entry.type] || 'Movimiento'}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{TYPE_LABELS[entry.type] ?? entry.type}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDateLong(entry.date)}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  {esDeuda ? 'Deuda' : 'Desembolsado'}
                </p>
                <p className={cn('font-semibold text-2xl tabular-nums', !esDeuda && 'text-coral')}>
                  {formatMoney(esDeuda ? entry.debtAmount : entry.paidAmount, currency)}
                </p>
              </div>
              <StatusBadge status={entry.status} />
            </div>

            <dl className="divide-y rounded-xl border text-sm">
              {esDeuda && (
                <Line label="De quién es" value={debtOwnerLabel(entry.debtOwner, viewer, talentName, adminName)} />
              )}
              {esDeuda && (
                <Line
                  label="Falta pagar"
                  value={formatMoney(entry.pendingAmount, currency)}
                  destacar={Number(entry.pendingAmount) > 0}
                />
              )}
              <Line label="Periodo" value={`${String(entry.month).padStart(2, '0')}/${entry.year}`} />
            </dl>

            {entry.description && (
              <div className="rounded-xl border px-4 py-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Descripción</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{entry.description}</p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Line({ label, value, destacar }: Readonly<{ label: string; value: string; destacar?: boolean }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-muted-foreground text-xs">{label}</dt>
      <dd className={cn('min-w-0 text-right font-medium tabular-nums', destacar && 'text-destructive')}>{value}</dd>
    </div>
  );
}
