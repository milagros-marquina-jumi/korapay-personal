'use client';

import { formatMoney } from '@korapay/domain';
import { StatusBadge } from '@korapay/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { IconAction } from '@/components/ui/icon-action';
import { apiFetch } from '@/lib/api';
import type { TaxObligation } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

interface Props {
  workspaceId: string;
  obligation: TaxObligation;
}

export function RentaInstallments({ workspaceId, obligation }: Props) {
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
    return <p className="px-4 py-3 text-sm text-muted-foreground">Esta obligación no tiene cuotas definidas.</p>;
  }

  return (
    <div className="px-4 py-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Cuotas ({paid}/{rows.length} pagadas)
      </p>
      <div className="divide-y rounded-lg border">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <span className="tabular-nums">Cuota {r.number}</span>
            <div className="flex items-center gap-3">
              {r.dueDate && <span className="text-xs text-muted-foreground">vence {formatDate(r.dueDate)}</span>}
              <span className="w-24 text-right font-medium tabular-nums">{formatMoney(r.amount, 'PEN')}</span>
              <StatusBadge status={r.status} />
              {r.status === 'PAID' ? (
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
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
