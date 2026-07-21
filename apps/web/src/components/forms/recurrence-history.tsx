'use client';

import { formatMoney } from '@korapay/domain';
import { StatusBadge } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { IconAction } from '@/components/ui/icon-action';
import { apiFetch } from '@/lib/api';
import type { Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

interface Props {
  workspaceId: string;
  ruleId: string;
}

export function RecurrenceHistory({ workspaceId, ruleId }: Props) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.recurrenceOccurrences(workspaceId, ruleId),
    queryFn: () => apiFetch<Transaction[]>(`/transactions/recurrence/${ruleId}?workspaceId=${workspaceId}`),
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/transactions/${id}/status?workspaceId=${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurrenceOccurrences(workspaceId, ruleId) });
      queryClient.invalidateQueries({ queryKey: ['transactions', workspaceId] });
      toast.success('Estado actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const occurrences = data ?? [];
  const paid = occurrences.filter((o) => o.status === 'PAID').length;

  return (
    <div className="space-y-2 sm:col-span-2">
      <div className="flex items-center justify-between">
        <dt className="text-xs font-medium text-muted-foreground">
          Historial de pagos ({paid}/{occurrences.length} pagados)
        </dt>
      </div>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Cargando...</p>
      ) : (
        <div className="max-h-56 divide-y overflow-y-auto rounded-lg border">
          {occurrences.map((o) => (
            <div key={o.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="tabular-nums">{formatDate(o.date)}</span>
              <div className="flex items-center gap-2">
                <span className="tabular-nums font-medium">
                  {formatMoney(o.amountOriginal, o.currency as 'PEN' | 'USD')}
                </span>
                <StatusBadge status={o.status} />
                {o.status === 'PAID' ? (
                  <IconAction
                    icon={RotateCcw}
                    label="Marcar pendiente"
                    onClick={() => changeStatus.mutate({ id: o.id, status: 'PENDING' })}
                  />
                ) : (
                  <IconAction
                    icon={CheckCircle2}
                    label="Marcar pagado"
                    onClick={() => changeStatus.mutate({ id: o.id, status: 'PAID' })}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
