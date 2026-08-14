'use client';

import { formatMoney } from '@korapay/domain';
import { StatusBadge } from '@korapay/ui';
import { RentaInstallments } from '@/components/forms/renta-installments';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { TaxObligation } from '@/lib/api.types';
import { cn, daysUntilDue, formatDateLong } from '@/lib/utils';

interface Props {
  obligation: TaxObligation | null;
  workspaceId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function RentaDetailDialog({ obligation, workspaceId, onOpenChange }: Readonly<Props>) {
  const filas = obligation?.installmentRows ?? [];
  const pagadas = filas.filter((r) => r.status === 'PAID').length;
  const sinCuotas = filas.length === 0;
  const dias = obligation?.dueDate ? daysUntilDue(obligation.dueDate) : null;
  const vencida = obligation?.status !== 'PAID' && dias !== null && dias < 0;

  return (
    <Dialog open={obligation !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        {obligation && (
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle className="pr-6 text-lg leading-tight">{obligation.name}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>Obligación tributaria</span>
                <span aria-hidden="true">·</span>
                <span className={cn(vencida && 'text-destructive')}>vence {formatDateLong(obligation.dueDate)}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total a pagar</p>
                <p className="font-semibold text-2xl tabular-nums">{formatMoney(obligation.amount ?? '0', 'PEN')}</p>
                {filas.length > 0 && (
                  <p className="mt-0.5 text-muted-foreground text-xs tabular-nums">
                    {pagadas} de {filas.length} cuotas pagadas
                  </p>
                )}
              </div>
              <StatusBadge status={vencida ? 'OVERDUE' : obligation.status} />
            </div>

            {sinCuotas && obligation.year && (
              <dl className="divide-y rounded-xl border text-sm">
                <Linea label="Año" value={String(obligation.year)} />
              </dl>
            )}

            {obligation.notes && (
              <div className="rounded-xl border px-4 py-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Notas</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{obligation.notes}</p>
              </div>
            )}

            {workspaceId && filas.length > 0 && (
              <div className="rounded-xl border">
                <RentaInstallments workspaceId={workspaceId} obligation={obligation} readOnly />
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Linea({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-muted-foreground text-xs">{label}</dt>
      <dd className="min-w-0 text-right font-medium tabular-nums">{value}</dd>
    </div>
  );
}
