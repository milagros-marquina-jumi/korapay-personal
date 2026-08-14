'use client';

import { formatMoney } from '@korapay/domain';
import { StatusBadge } from '@korapay/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { RentaSchedulePaste } from '@/components/forms/renta-schedule-paste';
import { IconAction } from '@/components/ui/icon-action';
import { apiFetch } from '@/lib/api';
import type { TaxObligation } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { cn, daysUntilDue, formatDate } from '@/lib/utils';

interface Props {
  workspaceId: string;
  obligation: TaxObligation;
  readOnly?: boolean;
}

export function RentaInstallments({ workspaceId, obligation, readOnly = false }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const rows = obligation.installmentRows ?? [];
  const paid = rows.filter((r) => r.status === 'PAID').length;

  const pay = useMutation({
    mutationFn: ({ installmentId, action }: { installmentId: string; action: 'pay' | 'unpay' }) =>
      apiFetch(`/tax-obligations/${obligation.id}/installments/${installmentId}/${action}?workspaceId=${workspaceId}`, {
        method: 'POST',
      }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taxObligations(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(
        vars.action === 'pay' ? 'Cuota pagada. Se registró un egreso en Personal.' : 'Pago de cuota revertido.',
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!rows.length) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="text-muted-foreground text-sm">
          {readOnly
            ? 'Esta obligación no tiene cuotas.'
            : 'Todavía no hay cuotas. Pega el cuadro de tu resolución de SUNAT.'}
        </p>
        {!readOnly && <RentaSchedulePaste workspaceId={workspaceId} obligation={obligation} />}
      </div>
    );
  }

  const totals = obligation.totals;
  const conInteres = !!totals && Number(totals.interest) > 0;
  const pendiente = rows
    .filter((r) => r.status !== 'PAID')
    .reduce((s, r) => s + Number(r.amount), 0)
    .toFixed(2);
  const ordenadas = [...rows].sort((a, b) => b.number - a.number);

  return (
    <div className="px-4 py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="font-medium text-muted-foreground text-xs">
          Cuotas ({paid}/{rows.length} pagadas) · queda {formatMoney(pendiente, 'PEN')}
        </p>
        {!readOnly && <RentaSchedulePaste workspaceId={workspaceId} obligation={obligation} />}
      </div>

      {conInteres && (
        <div className="mb-3 grid gap-2 rounded-lg border border-warning/40 bg-warning/8 p-3 sm:grid-cols-4">
          <div>
            <p className="text-[11px] text-muted-foreground">Deuda original</p>
            <p className="font-semibold text-sm tabular-nums">{formatMoney(totals.principal, 'PEN')}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Interés</p>
            <p className="font-semibold text-sm text-warning-foreground tabular-nums">
              +{formatMoney(totals.interest, 'PEN')}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Total a pagar</p>
            <p className="font-semibold text-sm tabular-nums">{formatMoney(totals.total, 'PEN')}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Pagas de más</p>
            <p className="font-semibold text-sm text-warning-foreground tabular-nums">+{totals.surchargePct}%</p>
          </div>
        </div>
      )}

      <div className="divide-y rounded-lg border">
        {ordenadas.map((r) => {
          const pagada = r.status === 'PAID';
          const diasRestantes = r.dueDate ? daysUntilDue(r.dueDate) : null;
          const vencida = !pagada && diasRestantes !== null && diasRestantes < 0;
          return (
            <div
              key={r.id}
              className={cn(
                'flex items-center justify-between gap-3 px-3 py-2 text-sm',
                pagada && 'bg-muted/30',
                vencida && 'bg-destructive/5',
              )}
            >
              <span className="min-w-0">
                <span className={cn('block tabular-nums', pagada && 'text-muted-foreground line-through')}>
                  Cuota {r.number}
                </span>
                {conInteres && r.interestAmount && Number(r.interestAmount) > 0 && (
                  <span className="block text-[11px] text-muted-foreground tabular-nums">
                    {formatMoney(r.principalAmount ?? r.amount, 'PEN')} de deuda +{' '}
                    {formatMoney(r.interestAmount, 'PEN')} de interés
                  </span>
                )}
              </span>
              <div className="flex shrink-0 items-center gap-3">
                {r.dueDate && (
                  <span
                    className={cn('hidden text-xs sm:inline', vencida ? 'text-destructive' : 'text-muted-foreground')}
                  >
                    vence {formatDate(r.dueDate)}
                  </span>
                )}
                <span
                  className={cn(
                    'w-24 text-right font-medium tabular-nums',
                    pagada && 'text-muted-foreground line-through',
                  )}
                >
                  {formatMoney(r.amount, 'PEN')}
                </span>
                <StatusBadge status={vencida ? 'OVERDUE' : r.status} />
                {!readOnly &&
                  (pagada ? (
                    <IconAction
                      icon={RotateCcw}
                      label="Marcar pendiente"
                      onClick={() => pay.mutate({ installmentId: r.id, action: 'unpay' })}
                    />
                  ) : (
                    <IconAction
                      icon={CheckCircle2}
                      label="Marcar pagada"
                      onClick={() => pay.mutate({ installmentId: r.id, action: 'pay' })}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
